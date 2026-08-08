// script goated, version: 1.3 (Fixed Cache Key & Route Mapping)
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
    source, 
    server, 
    play, 
    debug,
    season,
    episode,
    cache: cacheParam,
    getsv
  } = req.query;

  // Kiểm tra nếu gọi qua endpoint /api/novahd/ hoặc truyền param server/source
  const isNovaRoute = req.url.includes('/novahd') || req.baseUrl?.includes('/novahd');
  
  // Xác định chính xác nguồn đang gọi
  let activeSource = (server || source || (isNovaRoute ? 'novahd' : 'Valenox')).trim().toLowerCase();

  const isNovaHD = activeSource === 'novahd';
  const isCacheDisabled = cacheParam === 'false' || req.query.nocache === 'true' || req.query.refresh === 'true';
  const isGetSv = getsv === 'true' || getsv === 'novahd';

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

  // Tạo Cache Key độc lập cho từng nguồn (phân biệt rõ novahd, valenox, flextv,...)
  const cacheKey = isGetSv 
    ? `getsv_${mediaType}_${cleanId}_S${season || 1}_E${episode || 1}`
    : `src_${activeSource}_${mediaType}_${cleanId}_S${season || 1}_E${episode || 1}_T${type}`;

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
          message: `Lấy dữ liệu thành công từ Cache nguồn [${activeSource.toUpperCase()}]`,
          cached_at: new Date(cachedItem.timestamp).toISOString(),
          age_seconds: ageSeconds
        },
        ...cachedItem.data
      };

      if (!isGetSv && play && activeSource !== 'true' && activeSource !== 'all' && type === 'video') {
        const videoUrl = responseData?.url || responseData?.link || responseData?.sources?.[0]?.url;
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
      let servers = ['novahd'];
      try {
        const initialRes = await fetchApiWithPoW('resolve', mediaType, cleanId, { source: 'Valenox', season, episode });
        if (initialRes?.availableSources) {
          servers = Array.from(new Set([...servers, ...initialRes.availableSources]));
        }
      } catch (e) {}

      resultData = {
        total_servers: servers.length,
        servers: servers
      };

    } else if (type === 'subtitle' || type === 'sub') {
      resultData = await fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode });

    } else if (activeSource === 'all') {
      const [novaRes, firstSourceRes, subData] = await Promise.all([
        fetchNovaHD({ mediaType, id: cleanId, season, episode }).catch(err => ({ error: err.message })),
        fetchApiWithPoW('resolve', mediaType, cleanId, { source: 'Valenox', season, episode }).catch(err => ({ error: err.message })),
        fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode }).catch(() => ([]))
      ]);

      const sourcesResult = [];

      if (novaRes && !novaRes.error && novaRes.sources) {
        sourcesResult.push({
          sourceName: 'NovaHD',
          sources: novaRes.sources
        });
      }

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
        throw new Error("Tất cả các nguồn Server đều bị giới hạn hoặc lỗi.");
      }

      resultData = {
        sources: sourcesResult,
        subtitles: subData?.subtitles || subData
      };

    } else if (isNovaHD) {
      // Xử lý riêng cho NovaHD
      const [novaData, subData] = await Promise.all([
        fetchNovaHD({ mediaType, id: cleanId, season, episode }),
        fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode }).catch(() => ([]))
      ]);

      if (!novaData?.sources || novaData.sources.length === 0) {
        throw new Error("Không lấy được dữ liệu video từ NovaHD.");
      }

      resultData = {
        sources: novaData.sources,
        subtitles: subData?.subtitles || subData
      };

    } else {
      // Các nguồn PoW như Valenox, Flextv,...
      const [videoData, subData] = await Promise.all([
        fetchApiWithPoW('resolve', mediaType, cleanId, { source: activeSource, season, episode }),
        fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode }).catch(() => ([]))
      ]);

      if (videoData?.error) throw new Error(videoData.error);

      resultData = {
        ...videoData,
        subtitles: subData?.subtitles || subData
      };
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
          ? "Đã làm mới dữ liệu thành công" 
          : `Dữ liệu nguồn [${activeSource.toUpperCase()}] đã lưu vào Cache`,
        cached_at: new Date(now).toISOString(),
        age_seconds: 0
      },
      ...resultData
    };

    if (!isGetSv && play && activeSource !== 'true' && activeSource !== 'all' && type === 'video') {
      const videoUrl = resultData?.url || resultData?.link || resultData?.sources?.[0]?.url;
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
          message: `Request mới bị lỗi (${error.message}). Dùng Cache dự phòng của [${activeSource.toUpperCase()}].`,
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

// Hàm lấy dữ liệu trực tiếp từ NovaHD
async function fetchNovaHD({ mediaType, id, season, episode }) {
  const normType = (mediaType === 'series' || mediaType === 'show' || mediaType === 'tv') ? 'show' : 'movie';
  let targetUrl = `https://novahd.cc/api/sources?type=${normType}&tmdbId=${id}`;

  if (normType === 'show') {
    targetUrl += `&season=${season || 1}&episode=${episode || 1}`;
  }

  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://novahd.cc/'
    }
  });

  if (!res.ok) {
    throw new Error(`Không thể lấy dữ liệu từ NovaHD (Status: ${res.status})`);
  }

  const data = await res.json();

  return {
    sources: data.sources || []
  };
}

// Hàm lấy Phụ đề từ Shegust
async function fetchSubtitlesShegu({ mediaType, id, season, episode }) {
  const normType = (mediaType === 'series' || mediaType === 'show' || mediaType === 'tv') ? 'tv' : 'movie';
  let targetUrl = `https://subtitles.shegu.st/subtitles?type=${normType}&tmdb=${id}`;

  if (normType === 'tv') {
    if (season) targetUrl += `&season=${season}`;
    if (episode) targetUrl += `&episode=${episode}`;
  }

  const res = await fetch(targetUrl);
  if (!res.ok) {
    throw new Error(`Không thể lấy phụ đề từ Shegust (Status: ${res.status})`);
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