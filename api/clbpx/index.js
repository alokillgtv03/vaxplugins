const { URLSearchParams } = require('url');

const TARGET_DOMAIN = process.env.TARGET_DOMAIN || "https://clbphimxua.com";
const USERNAME = process.env.WP_USERNAME || "hoangnp369@gmail.com";
const PASSWORD = process.env.WP_PASSWORD || "123456";

let cachedCookie = "";
let cookieExpiresAt = 0;

module.exports = async (req, res) => {
  try {
    const now = Date.now();

    // 1. Kiểm tra Cookie
    if (!cachedCookie || now >= cookieExpiresAt) {
      cachedCookie = await loginAndSaveCookie();
    }

    // 2. Chạy Proxy
    await handleProxyAndScrape(req, res, cachedCookie);

  } catch (error) {
    return res.status(500).json({ error: "Lỗi Proxy Server", details: error.message });
  }
};

/**
 * Đăng nhập lấy Cookie
 */
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
      cookieExpiresAt = Date.now() + 12 * 60 * 60 * 1000;
      return formattedCookies;
    }
    return "";
  } catch (error) {
    return "";
  }
}

/**
 * Xử lý Proxy
 */
async function handleProxyAndScrape(req, res, authCookie) {
  // Lấy đường dẫn gốc client gửi lên
  let rawPath = req.url || "/";

  // Loại bỏ tất cả tiền tố /api/clbpx bị lặp (kể cả dấu ///)
  let cleanPath = rawPath.replace(/^(\/+api\/+clbpx)+/gi, "");
  
  // Rút gọn dấu gạch chéo
  cleanPath = cleanPath.replace(/\/+/g, "/");
  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;

  // Tạo URL gửi sang clbphimxua.com
  const targetUrl = new URL(cleanPath, TARGET_DOMAIN);

  const fetchHeaders = { ...req.headers };
  delete fetchHeaders.host;
  fetchHeaders["host"] = new URL(TARGET_DOMAIN).host;
  fetchHeaders["user-agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  if (authCookie) {
    const existingCookie = fetchHeaders["cookie"] || "";
    fetchHeaders["cookie"] = existingCookie ? `${existingCookie}; ${authCookie}` : authCookie;
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

  // Chuyển hướng Location an toàn
  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'content-encoding' && lowerKey !== 'content-length') {
      if (lowerKey === 'location') {
        const newLocation = value.replace(TARGET_DOMAIN, "/api/clbpx");
        res.setHeader(key, newLocation);
      } else {
        res.setHeader(key, value);
      }
    }
  });

  const contentType = response.headers.get("content-type") || "";

  // Sửa đổi HTML
  if (contentType.includes("text/html")) {
    let htmlText = await response.text();
    
    // Thay toàn bộ domain gốc bằng prefix proxy
    htmlText = htmlText.replaceAll(TARGET_DOMAIN, "/api/clbpx");

    return res.status(response.status).send(htmlText);
  }

  // Trả về dữ liệu file tĩnh / media
  const arrayBuffer = await response.arrayBuffer();
  return res.status(response.status).send(Buffer.from(arrayBuffer));
}
