// script goated, version: 1.1 (Added getsv feature)
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
    cache: cacheParam,
    getsv
  } = req.query;

  const isCacheDisabled = cacheParam === 'false' || req.query.nocache === 'true' || req.query.refresh === 'true';
  const isGetSv = getsv === 'true';

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

  // Làm sạch ID
  const cleanId = String(id).split(',')[0].trim();

  // Tạo Cache Key riêng biệt nếu query tham số getsv
  const cacheKey = isGetSv 
    ? `getsv_${mediaType}_${cleanId}_${season || ''}_${episode || ''}`
    : `${mediaType}_${cleanId}_${season || ''}_${episode || ''}_${type}_${source}`;

  // 2. KIỂM TRA CACHE TỒN TẠI TỪ TRƯỚC (CACHE HIT)
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

      if (!isGetSv && play && source !== 'true' && source !== 'all' && type === 'video') {
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

    // 3. XỬ LÝ THEO LOẠI REQUEST
    if (isGetSv) {
      // 1. Lấy danh sách server khả dụng ban đầu
      const initialRes = await fetchApiWithPoW('resolve', mediaType, cleanId, { source: 'Valenox', season, episode });
      if (initialRes?.error) throw new Error(initialRes.error);

      const servers = initialRes?.availableSources || ['Valenox'];

      // 2. Lấy chi tiết format/định dạng của từng server bằng cách gọi song song
      const serverDetailsPromises = servers.map(async (src) => {
        try {
          const res = await fetchApiWithPoW('resolve', mediaType, cleanId, { source: src, season, episode });
          return {
            name: src,
            format: res?.format || res?.type || (res?.url?.includes('.m3u8') ? 'hls' : (res?.url ? 'mp4' : 'unknown')),
            status: res?.error ? 'error' : 'available'
          };
        } catch (e) {
          return {
            name: src,
            format: 'unknown',
            status: 'error'
          };
        }
      });

      const serversWithFormat = await Promise.all(serverDetailsPromises);

      resultData = {
        total_servers: servers.length,
        servers: serversWithFormat
      };

    } else if (type === 'subtitle' || type === 'sub') {
      resultData = await fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode });
    } else if (source === 'all') {
      const [firstSourceRes, subData] = await Promise.all([
        fetchApiWithPoW('resolve', mediaType, cleanId, { source: 'Valenox', season, episode }),
        fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode })
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
          fetchApiWithPoW('resolve', mediaType, cleanId, { source: src, season, episode })
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
      const [videoData, subData] = await Promise.all([
        fetchApiWithPoW('resolve', mediaType, cleanId, { source: 'Valenox', season, episode }),
        fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode })
      ]);

      if (videoData?.error) throw new Error(videoData.error);

      resultData = {
        ...videoData,
        subtitles: subData?.subtitles || subData
      };

    } else {
      resultData = await fetchApiWithPoW('resolve', mediaType, cleanId, { source, season, episode });
      if (resultData?.error) throw new Error(resultData.error);
    }

    // 4. LƯU DỮ LIỆU VÀO CACHE MỚI
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

    if (!isGetSv && play && source !== 'true' && source !== 'all' && type === 'video') {
      const videoUrl = resultData?.url || resultData?.link;
      if (videoUrl && typeof videoUrl === 'string') {
        return res.redirect(302, videoUrl);
      }
    }

    res.setHeader('X-Cache', isCacheDisabled ? 'BYPASS' : 'MISS');
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');
    return res.status(200).json(finalResponse);

  } catch (error) {
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
  const normType = (mediaType === 'series' || mediaType === 'tv') ? 'tv' : 'movie';
  let targetUrl = `https://subtitles.shegu.st/subtitles?type=${normType}&tmdb=${id}`;

  if (normType === 'tv') {
    if (season) targetUrl += `&season=${season}`;
    if (episode) targetUrl += `&episode=${episode}`;
  }

  const res = await fetch(targetUrl);
  if (!res.ok) {
    throw new Error(`Không thể lấy phụ đề từ Shegust (Status: ${res.status}) - Link: ${targetUrl}`);
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