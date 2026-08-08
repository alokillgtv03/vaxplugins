// script themoviedata version: 1.0
// Danh sách API keys xoay vòng (Fallback list)
const API_KEYS = [
  'aa8db17cefbe569dc21a8809090b7b93',
  '3d421899d5ce93db8ad4ae4591ccc130',
  '9e7096a7575623aa30c66e9cc987e411'
];

const DEBUG_KEY_DEFAULT = "9780752";

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const queryParams = new URLSearchParams(req.query);

    // Lấy thông tin server nếu có (VD: server=goated, server=fluxtv)
    const serverName = queryParams.get('server');
    queryParams.delete('server');

    // 1. Lấy raw endpoint từ query
    let rawEndpoint = queryParams.get('endpoint') || 'discover/movie';
    queryParams.delete('endpoint');

    // 2. Tách query string nếu có trong rawEndpoint
    if (rawEndpoint.includes('?')) {
      const [path, extraQuery] = rawEndpoint.split('?');
      rawEndpoint = path;
      const extraParams = new URLSearchParams(extraQuery);
      extraParams.forEach((value, key) => {
        if (!queryParams.has(key)) {
          queryParams.set(key, value);
        }
      });
    }

    // Chuẩn bị tham số cho Server API
    const isGetSv = queryParams.get('getsv') === 'true';
    const serverParams = new URLSearchParams();
    
    if (queryParams.has('source')) serverParams.set('source', queryParams.get('source'));
    if (isGetSv) serverParams.set('getsv', 'true');
    if (queryParams.has('play')) serverParams.set('play', queryParams.get('play'));
    if (queryParams.has('type')) serverParams.set('type', queryParams.get('type'));
    
    serverParams.set('debug', queryParams.get('debug') || DEBUG_KEY_DEFAULT);

    // 3. Mặc định tham số TMDB
    if (!queryParams.has('language')) {
      queryParams.set('language', 'vi-VN');
    }
    if (!queryParams.has('include_adult')) {
      queryParams.set('include_adult', 'false');
    }

    // Danh sách API Key
    const customApiKey = queryParams.get('api_key');
    const keysToTry = customApiKey 
      ? [customApiKey, ...API_KEYS.filter(k => k !== customApiKey)] 
      : [...API_KEYS];

    let lastError = null;
    let successfulData = null;

    // 4. Gọi TMDB API
    for (const key of keysToTry) {
      queryParams.set('api_key', key);
      const tmdbUrl = `https://api.themoviedb.org/3/${rawEndpoint}?${queryParams.toString()}`;

      try {
        const response = await fetch(tmdbUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json;charset=utf-8'
          }
        });

        if (response.ok) {
          successfulData = await response.json();
          break;
        }

        const errorData = await response.json().catch(() => ({}));
        lastError = { status: response.status, error: errorData };
      } catch (fetchError) {
        lastError = { status: 500, error: fetchError.message };
      }
    }

    // 5. Nếu thành công & có truyền `server` -> Gọi 1 lần sang Server Stream
    if (successfulData) {
      if (serverName) {
        try {
          const pathSegments = rawEndpoint.split('/').filter(Boolean);
          const mediaType = pathSegments[0] === 'tv' ? 'tv' : 'movie';
          const id = pathSegments[1];

          if (id && !isNaN(id)) {
            serverParams.set('mediaType', mediaType);
            serverParams.set('id', id);

            if (mediaType === 'tv') {
              if (isGetSv) {
                // Tối ưu: Khi lấy danh sách Server, luôn cố định season=1 & episode=1 để chỉ gọi đúng 1 lần duy nhất
                serverParams.set('season', '1');
                serverParams.set('episode', '1');
              } else {
                const seasonIdx = pathSegments.indexOf('season');
                const episodeIdx = pathSegments.indexOf('episode');

                const season = seasonIdx !== -1 ? pathSegments[seasonIdx + 1] : (queryParams.get('season') || '1');
                const episode = episodeIdx !== -1 ? pathSegments[episodeIdx + 1] : (queryParams.get('episode') || '1');

                serverParams.set('season', season);
                serverParams.set('episode', episode);
              }
            }

            if (!serverParams.has('source')) {
              serverParams.set('source', 'all');
            }

            const host = req.headers.host || 'vaxplayer.vercel.app';
            const protocol = req.headers['x-forwarded-proto'] || 'https';
            const serverApiUrl = `${protocol}://${host}/api/${serverName}?${serverParams.toString()}`;

            const serverRes = await fetch(serverApiUrl, {
              headers: {
                'x-app-secret': 'VAXPLAYER'
              }
            });

            if (serverRes.ok) {
              const serverData = await serverRes.json();
              successfulData.stream_data = serverData;
            } else {
              successfulData.stream_data = {
                status: "error",
                message: `Không thể kết nối đến server '${serverName}' (Status: ${serverRes.status})`
              };
            }
          }
        } catch (serverErr) {
          successfulData.stream_data = {
            status: "error",
            message: "Lỗi xử lý gộp dữ liệu từ server stream",
            error: serverErr.message
          };
        }
      }

      res.setHeader('Cache-Control', 'public, max-age=21600, s-maxage=21600, stale-while-revalidate=86400');
      res.setHeader('Content-Type', 'application/json;charset=utf-8');
      return res.status(200).json(successfulData);
    }

    return res.status(lastError?.status || 500).json({
      status: "error",
      message: "Tất cả các API Keys TMDB đều thất bại hoặc không hợp lệ",
      tmdb_error: lastError?.error
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Không thể lấy dữ liệu từ TMDB API",
      error: error.message
    });
  }
};