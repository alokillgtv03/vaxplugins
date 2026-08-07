const crypto = require('crypto');

const APP_SECRET_KEY = "VAXPLAYER";
const DEBUG_KEY = "9780752";

// Bộ nhớ Cache trong RAM
const cache = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 tiếng

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, mediaType = 'movie', type = 'video', source = 'Valenox', play, debug } = req.query;

  // 1. Kiểm tra BẢO MẬT
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

  const cacheKey = `${mediaType}_${id}_${type}_${source}`;

  // 2. KIỂM TRA CACHE TỒN TẠI TỪ TRƯỚC (CACHE HIT)
  if (cache.has(cacheKey)) {
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

    // 3. XỬ LÝ KHI SOURCE = ALL (Tự động phát hiện và lấy TẤT CẢ các Server + Phụ đề)
    if (source === 'all') {
      // BƯỚC 3.1: Gọi thử 1 server mặc định (Valenox) + Phụ đề
      const [firstSourceRes, subData] = await Promise.all([
        fetchApiWithPoW('resolve', mediaType, id, { source: 'Valenox' }),
        fetchApiWithPoW('subtitles', mediaType, id)
      ]);

      const sourcesResult = [];

      if (firstSourceRes && !firstSourceRes.error) {
        // Dọn dẹp bớt thuộc tính dư thừa trong object server
        const { subtitles: _, availableSources: __, ...cleanFirst } = firstSourceRes;
        sourcesResult.push({
          sourceName: 'Valenox',
          ...cleanFirst
        });
      }

      // BƯỚC 3.2: Lấy danh sách TẤT CẢ các source khả thi từ phản hồi API
      const allAvailable = firstSourceRes?.availableSources || ['Valenox', 'Orbit'];
      const remainingSources = allAvailable.filter(s => s !== 'Valenox');

      // BƯỚC 3.3: Gọi tiếp song song tất cả các source còn lại
      if (remainingSources.length > 0) {
        const remainingRequests = remainingSources.map(src =>
          fetchApiWithPoW('resolve', mediaType, id, { source: src })
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
      // SOURCE = TRUE (Lấy 1 server mặc định + Phụ đề)
      const [videoData, subData] = await Promise.all([
        fetchApiWithPoW('resolve', mediaType, id, { source: 'Valenox' }),
        fetchApiWithPoW('subtitles', mediaType, id)
      ]);

      if (videoData?.error) throw new Error(videoData.error);

      resultData = {
        ...videoData,
        subtitles: subData?.subtitles || subData
      };

    } else {
      // CHẾ ĐỘ THƯỜNG (Lấy riêng lẻ)
      const endpoint = (type === 'subtitle' || type === 'sub') ? 'subtitles' : 'resolve';
      const extraPayload = endpoint === 'resolve' ? { source } : {};

      resultData = await fetchApiWithPoW(endpoint, mediaType, id, extraPayload);
      if (resultData?.error) throw new Error(resultData.error);
    }

    // 4. LƯU DỮ LIỆU HOÀN CHỈNH VÀO CACHE MỚI (CACHE MISS)
    const now = Date.now();
    cache.set(cacheKey, {
      timestamp: now,
      data: resultData
    });

    const finalResponse = {
      status: "success",
      log: {
        cache_status: "MISS",
        message: "Dữ liệu mới tạo thành công và đã được lưu vào Cache",
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

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');
    return res.status(200).json(finalResponse);

  } catch (error) {
    // 5. NẾU LỖI / BỊ LIMIT -> KIỂM TRA XEM CÓ CACHE CŨ DỰ PHÒNG KHÔNG
    if (cache.has(cacheKey)) {
      const fallbackItem = cache.get(cacheKey);
      const ageSeconds = Math.floor((Date.now() - fallbackItem.timestamp) / 1000);

      return res.status(200).json({
        status: "success",
        log: {
          cache_status: "HIT_FALLBACK",
          message: `Request mới bị lỗi/limit (${error.message}). Tự động dùng Cache dự phòng trước đó.`,
          cached_at: new Date(fallbackItem.timestamp).toISOString(),
          age_seconds: ageSeconds
        },
        ...fallbackItem.data
      });
    }

    // Nếu không có Cache cũ để cứu -> Trả về STATUS ERROR
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

// Hàm bổ trợ gọi API + PoW
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
