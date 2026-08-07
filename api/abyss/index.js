const fetch = require('node-fetch'); // Nếu chạy Node <= 17 (Node 18+ đã có sẵn fetch)

async function getAbyssCleanSource(abyssUrl) {
  try {
    // 1. Giả lập Header từ trang mẹ (clbphimxua.com)
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": "https://clbphimxua.com/",
      "Origin": "https://clbphimxua.com",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      "Sec-Fetch-Dest": "iframe",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "cross-site"
    };

    // 2. Tải HTML với chế độ theo dõi Redirect thủ công
    let response = await fetch(abyssUrl, {
      method: "GET",
      headers: headers,
      redirect: "manual" // KHÔNG cho phép tự động chuyển hướng HTTP 301/302
    });

    // Nếu Abyss trả về lệnh Redirect (301, 302, 307, 308)
    if (response.status >= 300 && response.status < 400) {
      const redirectLocation = response.headers.get("location");
      console.log("Phát hiện HTTP Redirect sang:", redirectLocation);
      
      // Nếu link chuyển hướng vẫn thuộc abysscdn/abyss thì đuổi theo lấy HTML thật
      if (redirectLocation && redirectLocation.includes("abyss")) {
        response = await fetch(redirectLocation, { headers, redirect: "manual" });
      }
    }

    let html = await response.text();

    // 3. TRIỆT HẠ JS REDIRECT (Xóa toàn bộ mã lệnh chuyển hướng trình duyệt)
    html = html
      .replace(/window\.top\.location\s*=\s*[^;]+;/gi, '/* blocked redirect */')
      .replace(/window\.location\.(href|replace)\s*\([^)]*\);?/gi, '/* blocked redirect */')
      .replace(/top\.location\.href\s*=\s*[^;]+;/gi, '/* blocked redirect */')
      .replace(/<meta[^>]*http-equiv=["']refresh["'][^>]*>/gi, ''); // Xóa tag HTML Refresh

    // 4. BÓC TÁCH LINK VIDEO (.m3u8 / .mp4 / API Source)
    const m3u8Match = html.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i) || 
                      html.match(/(https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/i);

    return {
      status: "success",
      videoUrl: m3u8Match ? m3u8Match[1] : null,
      cleanHtml: html // HTML đã xóa sạch mã chuyển hướng
    };

  } catch (error) {
    return { status: "error", message: error.message };
  }
}

// === THỬ NGHIỆM ===
(async () => {
  const targetUrl = "https://abysscdn.com/?v=Z9mWsX3Pl";
  console.log("Đang tải dữ liệu từ Abyss...");
  
  const result = await getAbyssCleanSource(targetUrl);
  
  if (result.videoUrl) {
    console.log("🎯 Bóc thành công link Video gốc:", result.videoUrl);
  } else {
    console.log("⚠️ Không tìm thấy link trực tiếp .m3u8, HTML đã được làm sạch JS redirect.");
  }
})();
