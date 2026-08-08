// File: /api/novahd.js (hoặc /api/novahd/index.js)
const crypto = require('crypto');

const cache = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 tiếng

const APP_SECRET_KEY = "VAXPLAYER";
const DEBUG_KEY = "9780752";

// Worker proxy cá nhân của bạn
const WORKER_PROXY_BASE = "https://billowing-sun-1654.alokillgtv.workers.dev";

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { 
    id, 
    mediaType = 'movie', 
    type = 'video', 
    play, 
    debug,
    season,
    episode,
    cache: cacheParam
  } = req.query;

  const isCacheDisabled = cacheParam === 'false' || req.query.nocache === 'true' || req.query.refresh === 'true';

  // 1. KIỂM TRA BẢO MẬT
  const clientSecret = req.headers['x-app-secret'];
  if (clientSecret !== APP_SECRET_KEY && debug !== DEBUG_KEY) {
    return res.status(403).json({ status: "error", error: "Truy cập bị từ chối!" });
  }

  if (!id) {
    return res.status(400).json({ status: "error", error: "Thiếu tham số 'id' trên URL" });
  }

  const cleanId = Array.isArray(id) ? String(id[0]).trim() : String(id).split(',')[0].trim();
  const cacheKey = `novahd_${mediaType}_${cleanId}_S${season || 1}_E${episode || 1}_T${type}`;

  // 2. CHECK CACHE
  if (isCacheDisabled) {
    cache.delete(cacheKey);
  } else if (cache.has(cacheKey)) {
    const cachedItem = cache.get(cacheKey);
    if (Date.now() - cachedItem.timestamp < CACHE_TTL) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json({
        status: "success",
        log: {
          cache_status: "HIT",
          message: "Lấy dữ liệu NovaHD từ Cache thành công",
          cached_at: new Date(cachedItem.timestamp).toISOString()
        },
        ...cachedItem.data
      });
    }
    cache.delete(cacheKey);
  }

  try {
    // 3. LẤY DỮ LIỆU TỪ NOVAHD QUA CLOUDFLARE WORKER VÀ SUBTITLE
    const [novaData, subData] = await Promise.all([
      fetchNovaHD({ mediaType, id: cleanId, season, episode }),
      fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode }).catch(() => ([]))
    ]);

    if (!novaData?.sources || novaData.sources.length === 0) {
      throw new Error("NovaHD không tìm thấy nguồn video nào cho ID này.");
    }

    // MAP TOÀN BỘ DANH SÁCH SERVER (Viper, Vega, Atlas, Orion...)
    const mappedSources = novaData.sources.map(item => ({
      sourceName: item.provider ? `NovaHD (${item.provider})` : (item.name || 'NovaHD'),
      url: item.url,
      quality: item.quality,
      type: item.type,
      provider: item.provider,
      language: item.language,
      hostKey: item.hostKey
    }));

    const resultData = {
      sources: mappedSources,
      subtitles: subData?.subtitles || subData
    };

    // 4. LƯU CACHE VÀ BÁO KẾT QUẢ
    const now = Date.now();
    cache.set(cacheKey, { timestamp: now, data: resultData });

    res.setHeader('X-Cache', isCacheDisabled ? 'BYPASS' : 'MISS');
    return res.status(200).json({
      status: "success",
      log: {
        cache_status: isCacheDisabled ? "BYPASS_REFRESH" : "MISS",
        message: "Lấy dữ liệu thành công từ NovaHD",
        cached_at: new Date(now).toISOString()
      },
      ...resultData
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      log: { cache_status: "FAILED" },
      error: error.message
    });
  }
};

// HÀM LẤY DATA NOVAHD QUA CLOUDFLARE WORKER PROXY
async function fetchNovaHD({ mediaType, id, season, episode }) {
  const normType = (mediaType === 'series' || mediaType === 'show' || mediaType === 'tv') ? 'show' : 'movie';
  
  // 1. Tạo URL gốc NovaHD
  let novaTargetUrl = `https://novahd.cc/api/sources?type=${normType}&tmdbId=${id}`;
  if (normType === 'show') {
    novaTargetUrl += `&season=${season || 1}&episode=${episode || 1}`;
  }

  // 2. Wrap URL qua Cloudflare Worker theo cấu trúc: ?url=...&type=json
  const workerUrl = `${WORKER_PROXY_BASE}/?url=${encodeURIComponent(novaTargetUrl)}&type=json`;

  const res = await fetch(workerUrl);

  if (!res.ok) {
    throw new Error(`Cloudflare Worker Proxy Status: ${res.status}`);
  }

  const data = await res.json();
  return { sources: data.sources || [] };
}

// HÀM LẤY SUBTITLE SHEGU
async function fetchSubtitlesShegu({ mediaType, id, season, episode }) {
  const normType = (mediaType === 'series' || mediaType === 'show' || mediaType === 'tv') ? 'tv' : 'movie';
  let targetUrl = `https://subtitles.shegu.st/subtitles?type=${normType}&tmdb=${id}`;
  
  if (normType === 'tv') {
    if (season) targetUrl += `&season=${season}`;
    if (episode) targetUrl += `&episode=${episode}`;
  }
  
  const res = await fetch(targetUrl);
  if (!res.ok) throw new Error("Lỗi lấy Subtitle");
  return await res.json();
}