const { URLSearchParams } = require('url');

// CẤU HÌNH THÔNG TIN: Ưu tiên lấy từ Biến môi trường Vercel (nếu có), hoặc dùng giá trị mặc định
const TARGET_DOMAIN = process.env.TARGET_DOMAIN || "https://clbphimxua.com";
const USERNAME = process.env.WP_USERNAME || "hoangnp369@gmail.com";
const PASSWORD = process.env.WP_PASSWORD || "123456";

// BỘ NHỚ CACHE TRONG RAM THAY THẾ CHO CLOUDFLARE KV
let cachedCookie = "";
let cookieExpiresAt = 0; // Thời gian hết hạn Cookie (Timestamp ms)

module.exports = async (req, res) => {
  try {
    const now = Date.now();

    // 1. Nếu chưa có Cookie hoặc đã hết hạn 12 tiếng -> Tiến hành đăng nhập lấy Cookie mới
    if (!cachedCookie || now >= cookieExpiresAt) {
      cachedCookie = await loginAndSaveCookie();
    }

    // 2. Thực hiện Proxy request kèm Cookie xác thực và biến đổi HTML
    await handleProxyAndScrape(req, res, cachedCookie);

  } catch (error) {
    return res.status(500).json({ error: "Lỗi Proxy Server", details: error.message });
  }
};

/**
 * Đăng nhập vào WordPress target và lưu Cookie vào bộ nhớ RAM
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

    // Gửi request đăng nhập
    const response = await fetch(`${TARGET_DOMAIN}/wp-login.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": "wordpress_test_cookie=WP%20Cookie%20check",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      body: formData.toString(),
      redirect: "manual"
    });

    // Lấy Set-Cookie headers
    let rawCookies = [];
    if (typeof response.headers.getSetCookie === "function") {
      rawCookies = response.headers.getSetCookie();
    } else {
      const singleHeader = response.headers.get("set-cookie");
      if (singleHeader) rawCookies = [singleHeader];
    }

    // Trích xuất các cookie
    const parsedCookies = rawCookies
      .map(c => c.split(";")[0].trim())
      .filter(Boolean);

    // Kiểm tra cookie đăng nhập của WordPress
    const hasAuthToken = parsedCookies.some(c => c.startsWith("wordpress_logged_in_"));
    const formattedCookies = parsedCookies.join("; ");

    // Lưu vào RAM nếu thành công (Thời gian sống: 12 tiếng = 43.200.000 ms)
    if (hasAuthToken && formattedCookies) {
      cookieExpiresAt = Date.now() + 12 * 60 * 60 * 1000;
      return formattedCookies;
    } else {
      console.error("Đăng nhập thất bại: Sai tài khoản/mật khẩu hoặc dính Captcha/Cloudflare.");
      return "";
    }
  } catch (error) {
    console.error("Lỗi tự động đăng nhập:", error);
    return "";
  }
}

/**
 * Trung chuyển yêu cầu và chỉnh sửa HTML (Thay thế HTMLRewriter)
 */
async function handleProxyAndScrape(req, res, authCookie) {
  // Tạo URL đích dựa trên path và query của request gốc
  const targetUrl = new URL(req.url, TARGET_DOMAIN);

  const fetchHeaders = { ...req.headers };
  delete fetchHeaders.host;
  fetchHeaders["host"] = new URL(TARGET_DOMAIN).host;

  // Đính kèm Cookie xác thực
  if (authCookie) {
    const existingCookie = fetchHeaders["cookie"] || "";
    fetchHeaders["cookie"] = existingCookie ? `${existingCookie}; ${authCookie}` : authCookie;
  }

  // Chuẩn bị Body đối với POST / PUT / PATCH
  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
  }

  const response = await fetch(targetUrl.toString(), {
    method: req.method,
    headers: fetchHeaders,
    body: body
  });

  const contentType = response.headers.get("content-type") || "";

  // Sao chép các header từ trang đích về client (Bỏ content-length & content-encoding để tránh lỗi mismatch khi sửa HTML)
  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'content-encoding' && lowerKey !== 'content-length') {
      res.setHeader(key, value);
    }
  });

  // Nếu là trang HTML -> Tiến hành can thiệp & chèn Script
  if (contentType.includes("text/html")) {
    let htmlText = await response.text();
    
    // Thay thế cho HTMLRewriter: Chèn script trước thẻ </body>
    const injectedScript = "<script>console.log('Proxy active - clbphimxua.com');</script>";
    if (htmlText.includes("</body>")) {
      htmlText = htmlText.replace("</body>", `${injectedScript}</body>`);
    } else {
      htmlText += injectedScript;
    }

    return res.status(response.status).send(htmlText);
  }

  // Nếu là file tĩnh (Ảnh, JS, CSS, Media...) -> Trả về Buffer dữ liệu thô
  const arrayBuffer = await response.arrayBuffer();
  return res.status(response.status).send(Buffer.from(arrayBuffer));
}
