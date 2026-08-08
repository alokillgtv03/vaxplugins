// File: /api/clbpx.js
// script clbpx wordpress proxy version: 1.1 (Direct Endpoint Compatible)

const { URLSearchParams } = require('url');

const TARGET_DOMAIN = process.env.TARGET_DOMAIN || "https://clbphimxua.com";
const USERNAME = process.env.WP_USERNAME || "hoangnp369@gmail.com";
const PASSWORD = process.env.WP_PASSWORD || "123456";

let cachedCookie = "";
let cookieExpiresAt = 0;

// BỘ NHỚ RAM LƯU CACHE (LỚP 2)
const memoryCache = new Map();
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 tiếng (7,200,000 ms)

module.exports = async (req, res) => {
  try {
    const now = Date.now();

    if (!cachedCookie || now >= cookieExpiresAt) {
      cachedCookie = await loginAndSaveCookie();
    }

    await handleProxyAndScrape(req, res, cachedCookie);

  } catch (error) {
    return res.status(500).json({ error: "Lỗi Proxy Server", details: error.message });
  }
};

async function loginAndSaveCookie() {
  try {
    const formData = new URLSearchParams();
    formData.append("log", USERNAME);
    formData.append("pwd", PASSWORD);
    formData.append("rememberme", "forever");
    formData.append("wp-submit", "Đăng nhập");
    formData.append("redirect_to", `${TARGET_DOMAIN}/wp-admin/`);
    formData.append("testcookie", "1");

    const response = await fetch(`${TARGET_DOMAIN}/wp-login.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": "wordpress_test_cookie=WP%20Cookie%20check",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: formData.toString(),
      redirect: "manual"
    });

    let rawCookies = [];
    if (typeof response.headers.getSetCookie === "function") {
      rawCookies = response.headers.getSetCookie();
    } else {
      const singleHeader = response.headers.get("set-cookie");
      if (singleHeader) rawCookies = [singleHeader];
    }

    const parsedCookies = rawCookies
      .map(c => c.split(";")[0].trim())
      .filter(Boolean);

    const hasAuthToken = parsedCookies.some(c => c.startsWith("wordpress_logged_in_"));
    const formattedCookies = parsedCookies.join("; ");

    if (hasAuthToken && formattedCookies) {
      cookieExpiresAt = Date.now() + 12 * 60 * 60 * 1000; // Cookie sống 12 tiếng
      return formattedCookies;
    }
    return "";
  } catch (error) {
    return "";
  }
}

async function handleProxyAndScrape(req, res, authCookie) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'vaxplayer.vercel.app';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const PROXY_BASE_URL = `${protocol}://${host}/api/clbpx`;

  // Trích xuất cleanPath linh hoạt (hỗ trợ cả query 'endpoint' lẫn URL path)
  let cleanPath = "";
  if (req.query && req.query.endpoint) {
    cleanPath = req.query.endpoint;
  } else {
    let rawPath = req.url || "/";
    cleanPath = rawPath.split("?")[0].replace(/^(\/+api\/+clbpx)+/gi, "");
  }

  cleanPath = cleanPath.replace(/\/+/g, "/");
  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;

  const isGetMethod = req.method === "GET";
  const now = Date.now();

  // 1. KIỂM TRA TRONG BỘ NHỚ RAM (LỚP 2)
  if (isGetMethod && memoryCache.has(cleanPath)) {
    const cachedItem = memoryCache.get(cleanPath);
    if (now - cachedItem.timestamp < CACHE_TTL) {
      res.setHeader('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=600');
      res.setHeader('X-Cache-Status', 'HIT-MEMORY');
      return res.status(200).send(cachedItem.data);
    } else {
      memoryCache.delete(cleanPath);
    }
  }

  const targetUrl = new URL(cleanPath, TARGET_DOMAIN);

  // Lọc header tránh lỗi trùng lặp Host/Connection
  const fetchHeaders = {};
  if (req.headers['content-type']) fetchHeaders['content-type'] = req.headers['content-type'];
  if (req.headers['accept']) fetchHeaders['accept'] = req.headers['accept'];
  
  fetchHeaders["host"] = new URL(TARGET_DOMAIN).host;
  fetchHeaders["user-agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  if (authCookie) {
    fetchHeaders["cookie"] = authCookie;
  }

  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
  }

  const response = await fetch(targetUrl.toString(), {
    method: req.method,
    headers: fetchHeaders,
    body: body,
    redirect: "manual"
  });

  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'content-encoding' && lowerKey !== 'content-length' && lowerKey !== 'transfer-encoding') {
      if (lowerKey === 'location') {
        const newLocation = value.replace(TARGET_DOMAIN, PROXY_BASE_URL);
        res.setHeader(key, newLocation);
      } else {
        res.setHeader(key, value);
      }
    }
  });

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/html") || contentType.includes("application/json")) {
    let text = await response.text();
    text = text.replaceAll(TARGET_DOMAIN, PROXY_BASE_URL);

    // 2. LƯU DỮ LIỆU VÀO CACHE KHI CÀO THÀNH CÔNG (HTTP 200)
    if (isGetMethod && response.status === 200) {
      memoryCache.set(cleanPath, { data: text, timestamp: now });
      res.setHeader('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=600');
      res.setHeader('X-Cache-Status', 'MISS-FETCHED');
    }

    return res.status(response.status).send(text);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (isGetMethod && response.status === 200) {
    res.setHeader('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=600');
  }

  return res.status(response.status).send(buffer);
}