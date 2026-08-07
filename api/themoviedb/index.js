module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const queryParams = new URLSearchParams(req.query);

    // 1. Lấy raw endpoint từ query
    let rawEndpoint = queryParams.get('endpoint') || 'discover/movie';
    queryParams.delete('endpoint');

    // 2. Nếu trong endpoint chứa sẵn query string (ví dụ "tv/top_rated?language=vi-VN")
    // Tiến hành tách riêng path và param ra để ghép lại đúng chuẩn URL
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

    // 3. Đảm bảo các tham số mặc định
    if (!queryParams.has('api_key')) {
      queryParams.set('api_key', 'aa8db17cefbe569dc21a8809090b7b93');
    }
    if (!queryParams.has('language')) {
      queryParams.set('language', 'vi-VN');
    }
    if (!queryParams.has('include_adult')) {
      queryParams.set('include_adult', 'false');
    }

    // 4. Ghép URL chuẩn xác cho TMDB (chỉ chứa 1 dấu ? duy nhất)
    const tmdbUrl = `https://api.themoviedb.org/3/${rawEndpoint}?${queryParams.toString()}`;

    const response = await fetch(tmdbUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json;charset=utf-8'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        status: "error",
        message: "Lỗi từ phía TMDB API",
        tmdb_error: errorData
      });
    }

    const data = await response.json();

    res.setHeader('Cache-Control', 'public, max-age=21600, s-maxage=21600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Không thể lấy dữ liệu từ TMDB API",
      error: error.message
    });
  }
};