// Danh sách API keys xoay vòng (Fallback list)
const API_KEYS = [
  'aa8db17cefbe569dc21a8809090b7b93', // Key mặc định cũ
  '3d421899d5ce93db8ad4ae4591ccc130',
  '9e7096a7575623aa30c66e9cc987e411'
];

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

    // 3. Thiết lập các tham số mặc định khác
    if (!queryParams.has('language')) {
      queryParams.set('language', 'vi-VN');
    }
    if (!queryParams.has('include_adult')) {
      queryParams.set('include_adult', 'false');
    }

    // Xác định danh sách keys sẽ thử: 
    // Nếu client tự truyền api_key lên thì ưu tiên dùng key đó trước, sau đó mới đến danh sách fallback
    const customApiKey = queryParams.get('api_key');
    const keysToTry = customApiKey 
      ? [customApiKey, ...API_KEYS.filter(k => k !== customApiKey)] 
      : [...API_KEYS];

    let lastError = null;
    let successfulData = null;

    // 4. Vòng lặp xoay vòng API Keys
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
          break; // Gọi thành công -> thoát khỏi vòng lặp
        }

        // Lưu lại thông tin lỗi để fallback nếu tất cả các keys đều thất bại
        const errorData = await response.json().catch(() => ({}));
        lastError = {
          status: response.status,
          error: errorData
        };

        // Nếu gặp lỗi do API Key (401: Unauthorized, 403: Forbidden, 429: Too Many Requests) 
        // hoặc lỗi Server (5xx), vòng lặp sẽ tự nhảy sang key tiếp theo.
      } catch (fetchError) {
        lastError = { status: 500, error: fetchError.message };
      }
    }

    // 5. Trả về kết quả nếu có ít nhất 1 key thành công
    if (successfulData) {
      res.setHeader('Cache-Control', 'public, max-age=21600, s-maxage=21600, stale-while-revalidate=86400');
      res.setHeader('Content-Type', 'application/json;charset=utf-8');
      return res.status(200).json(successfulData);
    }

    // Trả về lỗi nếu tất cả các keys trong danh sách đều không khả dụng
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