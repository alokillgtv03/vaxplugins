// script goated, version: 1.7 (Fixed Vercel Serverless Route Detection)
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

  // Ép buộc mặc định là 'novahd' cho file api/novahd.js nếu không chỉ định source khác
  let activeSource = (server || source || 'novahd').trim().toLowerCase();

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

  const cleanId = Array.isArray(id) ? String(id[0]).trim() : String(id).split(',')[0].trim();

  // Cache key
  const cacheKey = isGetSv 
    ? `getsv_${mediaType}_${cleanId}_S${season || 1}_E${episode || 1}`
    : `src_${activeSource}_${mediaType}_${cleanId}_S${season || 1}_E${episode || 1}_T${type}`;

  // 2. CHECK CACHE
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
          message: `Lấy dữ liệu thành công từ Cache [${activeSource.toUpperCase()}]`,
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

    // 3. XỬ LÝ THEO SOURCE
    if (isGetSv) {
      let servers = ['NovaHD'];
      try {
        const initialRes = await fetchApiWithPoW('resolve', mediaType, cleanId, { season, episode });
        if (Array.isArray(initialRes?.availableSources)) {
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
      // Quét NovaHD + Tất cả Server PoW
      const [novaRes, initialPoWRes, subData] = await Promise.all([
        fetchNovaHD({ mediaType, id: cleanId, season, episode }).catch(err => ({ error: err.message })),
        fetchApiWithPoW('resolve', mediaType, cleanId, { season, episode }).catch(err => ({ error: err.message })),
        fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode }).catch(() => ([]))
      ]);

      const sourcesResult = [];

      // Map mảng NovaHD
      if (novaRes && !novaRes.error && Array.isArray(novaRes.sources)) {
        novaRes.sources.forEach(item => {
          sourcesResult.push({
            sourceName: item.provider ? `NovaHD (${item.provider})` : 'NovaHD',
            url: item.url,
            quality: item.quality,
            type: item.type,
            provider: item.provider,
            language: item.language,
            source: 'NovaHD'
          });
        });
      }

      // Map mảng PoW
      const availableList = Array.isArray(initialPoWRes?.availableSources) ? initialPoWRes.availableSources : [];
      if (availableList.length > 0) {
        const powRequests = availableList.map(serverName =>
          fetchApiWithPoW('resolve', mediaType, cleanId, { source: serverName, season, episode })
            .then(res => ({ serverName, data: res }))
            .catch(err => ({ serverName, error: err.message }))
        );

        const powResponses = await Promise.all(powRequests);

        powResponses.forEach(item => {
          if (item.data && !item.data.error) {
            const { subtitles: _, availableSources: __, ...cleanData } = item.data;
            sourcesResult.push({
              sourceName: item.serverName,
              ...cleanData
            });
          }
        });
      }

      if (sourcesResult.length === 0) {
        throw new Error("Không thể lấy dữ liệu từ bất kỳ nguồn server nào.");
      }

      resultData = {
        sources: sourcesResult,
        subtitles: subData?.subtitles || subData
      };

    } else if (isNovaHD) {
      // MẶC ĐỊNH: LẤY ĐỦ TOÀN BỘ MẢNG SOURCES TỪ NOVAHD (Viper, Vega, Atlas, Orion,...)
      const [novaData, subData] = await Promise.all([
        fetchNovaHD({ mediaType, id: cleanId, season, episode }),
        fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode }).catch(() => ([]))
      ]);

      if (!novaData?.sources || novaData.sources.length === 0) {
        throw new Error("NovaHD không tìm thấy nguồn video cho ID này.");
      }

      // Map toàn bộ danh sách server từ mảng sources của NovaHD
      const mappedNovaSources = novaData.sources.map(item => ({
        sourceName: item.provider ? `NovaHD (${item.provider})` : (item.name || 'NovaHD'),
        url: item.url,
        quality: item.quality,
        type: item.type,
        provider: item.provider,
        language: item.language,
        hostKey: item.hostKey
      }));

      resultData = {
        sources: mappedNovaSources,
        subtitles: subData?.subtitles || subData
      };

    } else {
      // Lấy server PoW cụ thể
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

    // 4. LƯU CACHE
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

    res.setHeader('X-Cache', isCacheDisabled ? 'BYPASS' : 'MISS');
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');
    return res.status(200).json(finalResponse);

  } catch (error) {
    return res.status(500).json({
      status: "error",
      log: { cache_status: "FAILED" },
      error: error.message
    });
  }
};

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
    throw new Error(`NovaHD API lỗi Status: ${res.status}`);
  }

  const data = await res.json();

  return {
    sources: data.sources || []
  };
}

async function fetchSubtitlesShegu({ mediaType, id, season, episode }) {
  const normType = (mediaType === 'series' || mediaType === 'show' || mediaType === 'tv') ? 'tv' : 'movie';
  let targetUrl = `https://subtitles.shegu.st/subtitles?type=${normType}&tmdb=${id}`;

  if (normType === 'tv') {
    if (season) targetUrl += `&season=${season}`;
    if (episode) targetUrl += `&episode=${episode}`;
  }

  const res = await fetch(targetUrl);
  if (!res.ok) throw new Error("Lỗi sub");
  return await res.json();
}

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