const crypto = require('crypto');

const cache = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 tiếng

const APP_SECRET_KEY = "VAXPLAYER";
const DEBUG_KEY = "9780752";

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { 
    id, 
    mediaType = 'movie', 
    type = 'video', 
    source = 'Valenox', 
    play, 
    debug,
    season,
    episode,
    cache: cacheParam // Nhận tham số cache từ URL (vd: ?cache=false)
  } = req.query;

  // Xử lý cờ bypass cache (cache=false, nocache=true, refresh=true)
  const isCacheDisabled = cacheParam === 'false' || req.query.nocache === 'true' || req.query.refresh === 'true';

  // 1. KIỂM TRA BẢO MẬT
  const clientSecret = req.headers['x-app-secret'];
  const isHeaderValid = clientSecret === APP_SECRET_KEY;
  const isDebugValid = debug === DEBUG_KEY;

  if (!isHeaderValid && !isDebugValid) {
    return res.status(403).json({ 
      status: "error",
      error: "Truy cập bị từ chối! Bạn không có quyền gọi API này." 
    });
  }

  if (!id) {
    return res.status(400).json({ status: "error", error: "Thiếu tham số 'id' trên URL" });
  }

  const cacheKey = `${mediaType}_${id}_${season || ''}_${episode || ''}_${type}_${source}`;

  // 2. KIỂM TRA CACHE TỒN TẠI TỪ TRƯỚC (CACHE HIT)
  // Nếu cache=false thì bỏ qua bước kiểm tra này và chủ động xóa Cache cũ nếu có
  if (isCacheDisabled) {
    cache.delete(cacheKey);
  } else if (cache.has(cacheKey)) {
    const cachedItem = cache.get(cacheKey);
    if (Date.now() - cachedItem.timestamp < CACHE_TTL) {
      const ageSeconds = Math.floor((Date.now() - cachedItem.timestamp) / 1000);
      
      const responseData = {
        status: "success",
        log: {
          cache_status: "HIT",
          message: "Lấy dữ liệu thành công từ Cache trước đó",
          cached_at: new Date(cachedItem.timestamp).toISOString(),
          age_seconds: ageSeconds
        },
        ...cachedItem.data
      };

      if (play && source !== 'true' && source !== 'all' && type === 'video') {
        const videoUrl = responseData?.url || responseData?.link;
        if (videoUrl && typeof videoUrl === 'string') {
          return res.redirect(302, videoUrl);
        }
      }

      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(responseData);
    } else {
      cache.delete(cacheKey);
    }
  }

  try {
    let resultData = {};

    // 3. XỬ LÝ THEO LOẠI SOURCE VÀ TYPE
    if (type === 'subtitle' || type === 'sub') {
      // Chỉ lấy phụ đề từ Shegust (Trực tiếp, không dùng PoW)
      resultData = await fetchSubtitlesShegu({ mediaType, id, season, episode });
    } else if (source === 'all') {
      // Lấy TẤT CẢ các Video Server (Dùng PoW) + Phụ đề từ Shegust
      const [firstSourceRes, subData] = await Promise.all([
        fetchApiWithPoW('resolve', mediaType, id, { source: 'Valenox', season, episode }),
        fetchSubtitlesShegu({ mediaType, id, season, episode })
      ]);

      const sourcesResult = [];

      if (firstSourceRes && !firstSourceRes.error) {
        const { subtitles: _, availableSources: __, ...cleanFirst } = firstSourceRes;
        sourcesResult.push({
          sourceName: 'Valenox',
          ...cleanFirst
        });
      }

      const allAvailable = firstSourceRes?.availableSources || ['Valenox', 'Orbit'];
      const remainingSources = allAvailable.filter(s => s !== 'Valenox');

      if (remainingSources.length > 0) {
        const remainingRequests = remainingSources.map(src =>
          fetchApiWithPoW('resolve', mediaType, id, { source: src, season, episode })
            .then(res => ({ sourceName: src, data: res }))
            .catch(err => ({ sourceName: src, error: err.message }))
        );

        const remainingResponses = await Promise.all(remainingRequests);

        remainingResponses.forEach(item => {
          if (item.data && !item.data.error) {
            const { subtitles: _, availableSources: __, ...cleanData } = item.data;
            sourcesResult.push({
              sourceName: item.sourceName,
              ...cleanData
            });
          }
        });
      }

      if (sourcesResult.length === 0) {
        throw new Error("Tất cả các nguồn Server đều bị giới hạn (Limit) hoặc lỗi.");
      }

      resultData = {
        sources: sourcesResult,
        subtitles: subData?.subtitles || subData
      };

    } else if (source === 'true') {
      // Lấy 1 Server mặc định (Dùng PoW) + Phụ đề từ Shegust
      const [videoData, subData] = await Promise.all([
        fetchApiWithPoW('resolve', mediaType, id, { source: 'Valenox', season, episode }),
        fetchSubtitlesShegu({ mediaType, id, season, episode })
      ]);

      if (videoData?.error) throw new Error(videoData.error);

      resultData = {
        ...videoData,
        subtitles: subData?.subtitles || subData
      };

    } else {
      // CHẾ ĐỘ THƯỜNG (Lấy 1 Video Server bằng PoW)
      resultData = await fetchApiWithPoW('resolve', mediaType, id, { source, season, episode });
      if (resultData?.error) throw new Error(resultData.error);
    }

    // 4. LƯU DỮ LIỆU VÀO CACHE MỚI (CACHE MISS HOẶC CACHE REFRESH)
    const now = Date.now();
    cache.set(cacheKey, {
      timestamp: now,
      data: resultData
    });

    const finalResponse = {
      status: "success",
      log: {
        cache_status: isCacheDisabled ? "BYPASS_REFRESH" : "MISS",
        message: isCacheDisabled 
          ? "Đã làm mới dữ liệu thành công (bỏ qua Cache cũ)" 
          : "Dữ liệu mới tạo thành công và đã được lưu vào Cache",
        cached_at: new Date(now).toISOString(),
        age_seconds: 0
      },
      ...resultData
    };

    if (play && source !== 'true' && source !== 'all' && type === 'video') {
      const videoUrl = resultData?.url || resultData?.link;
      if (videoUrl && typeof videoUrl === 'string') {
        return res.redirect(302, videoUrl);
      }
    }

    res.setHeader('X-Cache', isCacheDisabled ? 'BYPASS' : 'MISS');
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');
    return res.status(200).json(finalResponse);

  } catch (error) {
    // 5. NẾU LỖI -> DÙNG CACHE DỰ PHÒNG (KỂ CẢ KHI CÓ CACHE=FALSE NHƯNG FETCH MỚI THẤT BẠI)
    if (cache.has(cacheKey)) {
      const fallbackItem = cache.get(cacheKey);
      const ageSeconds = Math.floor((Date.now() - fallbackItem.timestamp) / 1000);

      return res.status(200).json({
        status: "success",
        log: {
          cache_status: "HIT_FALLBACK",
          message: `Request mới bị lỗi (${error.message}). Tự động dùng Cache dự phòng trước đó.`,
          cached_at: new Date(fallbackItem.timestamp).toISOString(),
          age_seconds: ageSeconds
        },
        ...fallbackItem.data
      });
    }

    return res.status(500).json({
      status: "error",
      log: {
        cache_status: "FAILED",
        message: "Request thất bại và không tìm thấy Cache cũ để phục hồi."
      },
      error: error.message
    });
  }
};

// Hàm lấy Phụ đề từ Shegust
async function fetchSubtitlesShegu({ mediaType, id, season, episode }) {
  const url = new URL('https://subtitles.shegu.st/subtitles');
  url.searchParams.append('type', mediaType);
  url.searchParams.append('tmdb', id);

  if (mediaType === 'tv' || mediaType === 'series') {
    if (season) url.searchParams.append('season', season);
    if (episode) url.searchParams.append('episode', episode);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Không thể lấy phụ đề từ Shegust (Status: ${res.status})\\n + ${url.toString()}`);
  }
  return await res.json();
}

// Hàm giải mã Video Link qua Challenge / PoW
async function fetchApiWithPoW(endpoint, mediaType, id, extraParams = {}) {
  const challengeRes = await fetch("https://api.reallyfast.xyz/api/challenge");
  if (!challengeRes.ok) throw new Error("Không thể lấy challenge");
  
  const challengeData = await challengeRes.json();
  const { challenge, difficulty = 4 } = challengeData;

  const nonce = solvePoWNode(challenge, difficulty);

  const payload = {
    mediaType,
    id: isNaN(id) ? id : Number(id),
    challenge,
    nonce: nonce.toString(),
    ...extraParams
  };

  const apiRes = await fetch(`https://api.reallyfast.xyz/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return await apiRes.json();
}

function solvePoWNode(challenge, difficulty) {
  const targetPrefix = '0'.repeat(difficulty);
  let nonce = 0;

  while (nonce < 1000000) {
    const hash = crypto.createHash('sha256').update(challenge + nonce).digest('hex');
    if (hash.startsWith(targetPrefix)) {
      return nonce;
    }
    nonce++;
  }
  return nonce;
}