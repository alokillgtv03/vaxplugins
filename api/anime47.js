// File: /api/anime47.js
// script anime47 proxy version: 1.1 (Direct Endpoint Compatible)

// Bộ nhớ đệm RAM lưu Token
let tokenCache = {
  accessToken: null,
  refreshToken: null,
  expiresAt: 0
};

// Bộ nhớ đệm RAM lưu dữ liệu API
const memoryCache = new Map();

module.exports = async (req, res) => {
  // 1. Cấu hình CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 2. Bóc tách cleanPath linh hoạt (Hỗ trợ cả tham số query 'endpoint' lẫn URL path)
    let cleanPath = "";
    
    if (req.query && req.query.endpoint) {
      cleanPath = req.query.endpoint;
    } else {
      // Cắt bỏ tiền tố /api/anime47 nếu gọi dạng path
      cleanPath = req.url.split("?")[0].replace(/^\/api\/anime47/i, "");
    }

    if (!cleanPath.startsWith("/")) {
      cleanPath = "/" + cleanPath;
    }

    const isGetMethod = req.method === "GET";
    const now = Date.now();

    // 3. Phân loại chiến lược Cache theo Slug
    const cacheStrategy = getCacheStrategy(cleanPath);

    // 4. KIỂM TRA RAM CACHE (Nếu là GET request và cho phép Cache)
    if (isGetMethod && cacheStrategy !== "NO_CACHE" && memoryCache.has(cleanPath)) {
      const cachedItem = memoryCache.get(cleanPath);

      if (now < cachedItem.expiresAt) {
        // Trả kết quả trực tiếp từ RAM
        setCacheHeaders(res, cacheStrategy, true);
        res.setHeader("Content-Type", "application/json");
        return res.status(200).send(cachedItem.data);
      } else {
        // Đã hết hạn -> Xóa Cache cũ để lấy mới
        memoryCache.delete(cleanPath);
      }
    }

    const targetUrl = `https://anime47.love${cleanPath}`;

    // 5. Lấy Access Token hợp lệ (Tự động login / refresh)
    const token = await getValidAccessToken();

    // 6. Cấu hình Header gọi sang Anime47
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

    // 7. Gọi API gốc Anime47
    const apiResponse = await fetch(targetUrl, {
      method: req.method,
      headers: fetchHeaders,
      body: body
    });

    const contentType = apiResponse.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await apiResponse.json();
      const stringifiedData = JSON.stringify(data);

      // 8. LƯU BẢN CACHE MỚI (Nếu GET thành công và có bật Cache)
      if (isGetMethod && apiResponse.status === 200 && cacheStrategy !== "NO_CACHE") {
        const ttl = cacheStrategy === "CACHE_30M" 
          ? 30 * 60 * 1000                 // 30 phút
          : 365 * 24 * 60 * 60 * 1000;       // Tối đa (1 năm)

        memoryCache.set(cleanPath, {
          data: stringifiedData,
          expiresAt: now + ttl
        });
      }

      setCacheHeaders(res, cacheStrategy, false);
      res.setHeader("Content-Type", "application/json");
      return res.status(apiResponse.status).send(stringifiedData);
    } else {
      const textData = await apiResponse.text();
      setCacheHeaders(res, cacheStrategy, false);
      return res.status(apiResponse.status).send(textData);
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Hàm phân loại chiến lược Cache theo cấu trúc Slug
 */
function getCacheStrategy(path) {
  // Rule 1: Link xem tập phim -> KHÔNG LƯU CACHE
  if (path.includes("/anime/watch/")) {
    return "NO_CACHE";
  }

  // Rule 2: Trang danh sách lọc phim mới -> CACHE 30 PHÚT
  if (path.includes("/anime/filter") && path.includes("sort=latest")) {
    return "CACHE_30M";
  }

  // Rule 3: Tất cả các slug còn lại -> CACHE TỐI ĐA
  return "CACHE_MAX";
}

/**
 * Hàm thiết lập Header Cache cho Vercel Edge CDN & Trình duyệt
 */
function setCacheHeaders(res, strategy, isRamHit) {
  if (strategy === "NO_CACHE") {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("X-Proxy-Cache", "NO-CACHE");
  } else if (strategy === "CACHE_30M") {
    res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=1800, stale-while-revalidate=300");
    res.setHeader("X-Proxy-Cache", isRamHit ? "HIT-RAM-30M" : "MISS-30M");
  } else {
    // CACHE_MAX: Lưu lâu nhất có thể trên Edge CDN Vercel
    res.setHeader("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    res.setHeader("X-Proxy-Cache", isRamHit ? "HIT-RAM-MAX" : "MISS-MAX");
  }
}

/**
 * Logic tự động Đăng nhập & Refresh Token
 */
async function getValidAccessToken() {
  const now = Date.now();

  if (
    tokenCache.accessToken &&
    tokenCache.expiresAt &&
    now < tokenCache.expiresAt - 120000
  ) {
    return tokenCache.accessToken;
  }

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
      // Refresh thất bại -> Tự động chuyển xuống login mới
    }
  }

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
  
  tokenCache.accessToken = loginData.access_token;
  tokenCache.expiresAt = now + (loginData.expires_in * 1000);
  if (loginData.refresh_token) {
    tokenCache.refreshToken = loginData.refresh_token;
  }

  return tokenCache.accessToken;
}