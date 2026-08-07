const { URLSearchParams } = require('url');

const TARGET_DOMAIN = process.env.TARGET_DOMAIN || "https://clbphimxua.com";
const USERNAME = process.env.WP_USERNAME || "hoangnp369@gmail.com";
const PASSWORD = process.env.WP_PASSWORD || "123456";

let cachedCookie = "";
let cookieExpiresAt = 0;

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
      cookieExpiresAt = Date.now() + 12 * 60 * 60 * 1000;
      return formattedCookies;
    } else {
      console.error("Đăng nhập thất bại.");
      return "";
    }
  } catch (error) {
    console.error("Lỗi tự động đăng nhập:", error);
    return "";
  }
}

async function handleProxyAndScrape(req, res, authCookie) {
  // 1. LÀM SẠCH VÀ KHỬ LẶP URL (URL SANITIZATION)
  let cleanPath = req.url;

  // Xóa tất cả các đoạn /api/clbpx bị lặp (kể cả có nhiều dấu ///)
  while (cleanPath.match(/^(\/+api\/+clbpx)/i)) {
    cleanPath = cleanPath.replace(/^(\/+api\/+clbpx)/i, '');
  }

  // Thu gọn nhiều dấu / liên tiếp thành 1 dấu /
  cleanPath = cleanPath.replace(/\/+/g, '/');

  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

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

  // 2. CHUYỂN HƯỚNG LOCATION AN TOÀN
  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'content-encoding' && lowerKey !== 'content-length') {
      if (lowerKey === 'location') {
        let rewrittenLocation = value.replaceAll(TARGET_DOMAIN + "/api/clbpx", "/api/clbpx");
        rewrittenLocation = rewrittenLocation.replaceAll(TARGET_DOMAIN, "/api/clbpx");
        res.setHeader(key, rewrittenLocation);
      } else {
        res.setHeader(key, value);
      }
    }
  });

  const contentType = response.headers.get("content-type") || "";

  // 3. THAY THẾ LINK TRONG HTML Tránh bị lặp trùng
  if (contentType.includes("text/html")) {
    let htmlText = await response.text();
    
    htmlText = htmlText.replaceAll(TARGET_DOMAIN + "/api/clbpx", "/api/clbpx");
    htmlText = htmlText.replaceAll(TARGET_DOMAIN, "/api/clbpx");

    const injectedScript = "<script>console.log('Proxy active - clbphimxua.com');</script>";
    if (htmlText.includes("</body>")) {
      htmlText = htmlText.replace("</body>", `${injectedScript}</body>`);
    } else {
      htmlText += injectedScript;
    }

    return res.status(response.status).send(htmlText);
  }

  const arrayBuffer = await response.arrayBuffer();
  return res.status(response.status).send(Buffer.from(arrayBuffer));
}
