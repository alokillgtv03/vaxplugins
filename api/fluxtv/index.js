// File: /api/flextv/index.js
// script flextv version 1.2 (Standalone Folder Route)
const crypto = require('crypto');

const APP_SECRET_KEY = "VAXPLAYER";
const DEBUG_KEY = "9780752";

// Hàm an toàn nhận diện định dạng video từ response
function safeDetectFormat(data) {
  if (!data || typeof data !== 'object') return 'unknown';
  if (data.format) return String(data.format).toLowerCase();
  if (data.type) return String(data.type).toLowerCase();
  
  var targetUrl = data.directUrl || data.hlsUrl || data.url || data.link || '';
  if (typeof targetUrl === 'string') {
    if (targetUrl.indexOf('.m3u8') > -1) return 'hls';
    if (targetUrl.indexOf('.mp4') > -1) return 'mp4';
    if (targetUrl.length > 0) return 'hls';
  }
  return 'unknown';
}

// Hàm tạo SID & ghép URL theo chuẩn nflixmovies
function withEmbedSid(q, parentHost = 'nflixmovies.app') {
  const embedSid = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let s = String(q || '');

  if (!/(?:^|&)sid=/.test(s)) {
    s = `${s}${s.length ? '&' : ''}sid=${encodeURIComponent(embedSid)}`;
  }

  if (!/(?:^|&)parent=/.test(s)) {
    s = `${s}&parent=${encodeURIComponent(parentHost)}`;
  }

  return s;
}

// Hàm fetch stream/video từ Nflixmovies
async function fetchNflixStream({ mediaType, id, season, episode }) {
  const normType = (mediaType === 'series' || mediaType === 'tv') ? 'tv' : 'movie';
  let queryPath = '';

  if (normType === 'movie') {
    queryPath = `type=movie&id=${id}&public_embed=1`;
  } else {
    const s = season || '1';
    const e = episode || '1';
    queryPath = `id=${id}&type=tv&season=${s}&episode=${e}&skip=signalvault&browserPlatform=desktop&browserHevc=1&browserH2644k=1&browserMatroska=1&public_embed=1`;
  }

  const finalQuery = withEmbedSid(queryPath, 'nflixmovies.app');
  const endpoint = normType === 'movie' 
    ? `https://nflixmovies.app/api/titan/embed-access?${finalQuery}`
    : `https://nflixmovies.app/api/titan/play?${finalQuery}`;

  const res = await fetch(endpoint, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://nflixmovies.app/'
    }
  });

  if (!res.ok) {
    throw new Error(`Không thể lấy dữ liệu từ Nflixmovies (Status: ${res.status})`);
  }

  return await res.json();
}

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
    source = 'Nflix', 
    play, 
    debug,
    season,
    episode,
    getsv
  } = req.query;

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

  const cleanId = String(id).split(',')[0].trim();

  try {
    let resultData = {};

    // 2. XỬ LÝ THEO LOẠI REQUEST
    if (isGetSv) {
      // Chỉ lấy danh sách server khả dụng từ 1 request duy nhất
      const initialRes = await fetchApiWithPoW('resolve', mediaType, cleanId, { source: 'Valenox', season, episode });
      if (initialRes?.error) throw new Error(initialRes.error);

      const servers = initialRes?.availableSources || ['Valenox'];

      resultData = {
        total_servers: servers.length,
        servers: servers
      };

    } else if (type === 'subtitle' || type === 'sub') {
      resultData = await fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode });
      
    } else if (source === 'Nflix') {
      const [nflixData, subData] = await Promise.all([
        fetchNflixStream({ mediaType, id: cleanId, season, episode }),
        fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode }).catch(() => ([]))
      ]);

      const subtitlesList = subData?.subtitles || subData || [];

      resultData = {
        ...nflixData,
        subtitleTracks: subtitlesList
      };

    } else if (source === 'all') {
      const [nflixRes, valenoxRes, subData] = await Promise.all([
        fetchNflixStream({ mediaType, id: cleanId, season, episode }).catch(err => ({ error: err.message })),
        fetchApiWithPoW('resolve', mediaType, cleanId, { source: 'Valenox', season, episode }).catch(err => ({ error: err.message })),
        fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode }).catch(() => ([]))
      ]);

      const sourcesResult = [];

      if (nflixRes && !nflixRes.error) {
        sourcesResult.push({
          sourceName: 'Nflix',
          ...nflixRes
        });
      }

      if (valenoxRes && !valenoxRes.error) {
        const { subtitles: _, availableSources: __, ...cleanValenox } = valenoxRes;
        sourcesResult.push({
          sourceName: 'Valenox',
          ...cleanValenox
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
        fetchSubtitlesShegu({ mediaType, id: cleanId, season, episode }).catch(() => ([]))
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

    const finalResponse = {
      status: "success",
      ...resultData
    };

    // Điều hướng nếu có tham số play=true
    if (!isGetSv && play && type === 'video') {
      const videoUrl = resultData?.directUrl || resultData?.hlsUrl || resultData?.url || resultData?.link;
      if (videoUrl && typeof videoUrl === 'string') {
        return res.redirect(302, videoUrl);
      }
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.status(200).json(finalResponse);

  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error.message
    });
  }
};