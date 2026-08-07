// Bộ nhớ đệm RAM lưu Token (Thay thế cho Cloudflare KV)
let tokenCache = {
  accessToken: null,
  refreshToken: null,
  expiresAt: 0
};

module.exports = async (req, res) => {
  // 1. Cấu hình CORS đầy đủ
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Xử lý Preflight Request (CORS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 2. Tự động cắt bỏ /api/anime47 khỏi URL để không bị 404
    let cleanPath = req.url.replace(/^\/api\/anime47/i, "");
    if (!cleanPath.startsWith("/")) {
      cleanPath = "/" + cleanPath;
    }

    const targetUrl = `https://anime47.love${cleanPath}`;

    // 3. Lấy Access Token hợp lệ (Tự động login / refresh)
    const token = await getValidAccessToken();

    // 4. Thiết lập Header gọi sang Anime47
    const fetchHeaders = {
      "Accept": "application/json, text/plain, */*",
      "Authorization": `Bearer ${token}`,
      "Origin": "https://anime47.best",
      "Referer": "https://anime47.best/",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
    };

    let body = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
      fetchHeaders["Content-Type"] = req.headers["content-type"] || "application/json";
    }

    // 5. Gọi API đích
    const apiResponse = await fetch(targetUrl, {
      method: req.method,
      headers: fetchHeaders,
      body: body
    });

    const contentType = apiResponse.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await apiResponse.json();
      res.setHeader("Content-Type", "application/json");
      return res.status(apiResponse.status).json(data);
    } else {
      const textData = await apiResponse.text();
      return res.status(apiResponse.status).send(textData);
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Hàm xử lý logic lấy token thông minh
async function getValidAccessToken() {
  const now = Date.now();

  // Nếu token còn hạn (trừ hao 2 phút = 120000ms), dùng luôn từ RAM
  if (
    tokenCache.accessToken &&
    tokenCache.expiresAt &&
    now < tokenCache.expiresAt - 120000
  ) {
    return tokenCache.accessToken;
  }

  // Thử refresh token nếu có
  if (tokenCache.refreshToken) {
    try {
      const refreshRes = await fetch("https://anime47.love/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenCache.refreshToken}`,
          "Origin": "https://anime47.best",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
        }
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        tokenCache.accessToken = refreshData.access_token;
        tokenCache.expiresAt = now + (refreshData.expires_in * 1000);
        if (refreshData.refresh_token) {
          tokenCache.refreshToken = refreshData.refresh_token;
        }
        return tokenCache.accessToken;
      }
    } catch (e) {
      // Refresh thất bại -> Chuyển xuống bước login mới
    }
  }

  // Đăng nhập mới
  const loginRes = await fetch("https://anime47.love/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Origin": "https://anime47.best",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
    },
    body: JSON.stringify({
      login: "alokillgtv@gmail.com",
      password: "Exciter150"
    })
  });

  if (!loginRes.ok) {
    throw new Error("Đăng nhập thất bại vào Anime47.");
  }

  const loginData = await loginRes.json();
  
  // Lưu token vào RAM
  tokenCache.accessToken = loginData.access_token;
  tokenCache.expiresAt = now + (loginData.expires_in * 1000);
  if (loginData.refresh_token) {
    tokenCache.refreshToken = loginData.refresh_token;
  }

  return tokenCache.accessToken;
}
