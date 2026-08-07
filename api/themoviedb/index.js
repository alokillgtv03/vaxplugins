module.exports = async (req, res) => {
  // 1. Thiết lập Header CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const queryParams = new URLSearchParams(req.query);

    // 2. Lấy tham số endpoint từ request, mặc định là 'discover/movie' nếu client không truyền
    const endpoint = queryParams.get('endpoint') || 'discover/movie';
    
    // XÓA tham số endpoint ra khỏi queryParams để không bị truyền thừa sang TMDB API
    queryParams.delete('endpoint');

    // Đảm bảo các tham số mặc định
    if (!queryParams.has('api_key')) {
      queryParams.set('api_key', 'aa8db17cefbe569dc21a8809090b7b93');
    }
    if (!queryParams.has('language')) {
      queryParams.set('language', 'vi-VN'); // Khuyên dùng vi-VN mặc định cho app
    }
    if (!queryParams.has('include_adult')) {
      queryParams.set('include_adult', 'false');
    }

    // 3. Ghép endpoint ĐỘNG vào URL của TMDB
    const tmdbUrl = `https://api.themoviedb.org/3/${endpoint}?${queryParams.toString()}`;

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

    // 5. Cấu hình Caching trên Vercel Edge/CDN
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