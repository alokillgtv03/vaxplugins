module.exports = async (req, res) => {
  // 1. Thiết lập Header CORS để Cho phép gọi từ Web/App khác
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Xử lý Preflight Request (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. Gom tất cả tham số Query truyền từ Client
    const queryParams = new URLSearchParams(req.query);

    // Đảm bảo luôn có api_key và mặc định các giá trị cần thiết nếu Client không truyền
    if (!queryParams.has('api_key')) {
      queryParams.set('api_key', 'aa8db17cefbe569dc21a8809090b7b93');
    }
    if (!queryParams.has('language')) {
      queryParams.set('language', 'en-US');
    }
    if (!queryParams.has('include_adult')) {
      queryParams.set('include_adult', 'false');
    }

    // 3. Tạo URL gọi sang TMDB API
    const tmdbUrl = `https://api.themoviedb.org/3/discover/movie?${queryParams.toString()}`;

    // 4. Fetch dữ liệu từ TMDB
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

    // 5. Cấu hình Caching trên Vercel Edge/CDN (Lưu cache 6 tiếng giống TMDB)
    res.setHeader('Cache-Control', 'public, max-age=21600, s-maxage=21600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    // 6. Trả dữ liệu về cho Client
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Không thể lấy dữ liệu từ TMDB API",
      error: error.message
    });
  }
};