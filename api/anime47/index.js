// Bộ nhớ đệm RAM lưu Token (Thay thế cho Cloudflare KV)
let tokenCache = {
  accessToken: null,
  refreshToken: null,
  expiresAt: 0
};

module.exports = async (req, res) => {
  // 1. Cấu hình CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Xử lý Preflight Request (CORS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 2. Lấy đường dẫn request (path + query string)
    const targetPath = req.url;
    const targetUrl = `https://anime47.love${targetPath}`;

    // 3. Lấy Access Token hợp lệ
    const token = await getValidAccessToken();

    // 4. Gọi API đích của Anime47
    const apiResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Authorization": `Bearer ${token}`,
        "Origin": "https://anime47.best",
        "Referer": "https://anime47.best/",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
      }
    });

    const data = await apiResponse.json();

    // 5. Trả kết quả về cho client
    res.setHeader("Content-Type", "application/json");
    return res.status(apiResponse.status).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Hàm xử lý logic lấy token thông minh
async function getValidAccessToken() {
  const now = Date.now();

  // 1. Nếu token còn hạn (trừ hao 2 phút = 120000ms), lấy từ RAM ra dùng ngay
  if (
    tokenCache.accessToken &&
    tokenCache.expiresAt &&
    now < tokenCache.expiresAt - 120000
  ) {
    return tokenCache.accessToken;
  }

  // 2. Nếu có refresh_token, thử refresh trước
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
      // Refresh thất bại -> Tự động chuyển xuống bước login mới bên dưới
    }
  }

  // 3. Nếu chưa có token hoặc refresh lỗi -> Tiến hành Đăng nhập mới
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
  
  // Lưu token mới vào bộ nhớ RAM
  tokenCache.accessToken = loginData.access_token;
  tokenCache.expiresAt = now + (loginData.expires_in * 1000);
  if (loginData.refresh_token) {
    tokenCache.refreshToken = loginData.refresh_token;
  }

  return tokenCache.accessToken;
}
