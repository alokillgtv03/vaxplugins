module.exports = async (req, res) => {
  try {
    // 1. Lấy mã video từ Query string (Ví dụ: /api/abyss?v=Z9mWsX3Pl)
    const videoId = req.query?.v || "Z9mWsX3Pl";
    
    let targetUrl = videoId;
    if (!targetUrl.startsWith("http")) {
      targetUrl = `https://abysscdn.com/?v=${videoId}`;
    }

    // 2. Gửi Request giả lập Header từ trang mẹ
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://clbphimxua.com/",
        "Origin": "https://clbphimxua.com",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      redirect: "follow"
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Trang gốc Abyss trả về lỗi HTTP ${response.status}` 
      });
    }

    let html = await response.text();

    // 3. TRIỆT HẠ MÃ REDIRECT (Thay thế các câu lệnh nhảy trang bằng console.log)
    html = html
      .replace(/window\.top\.location/gi, "console.log")
      .replace(/window\.location/gi, "console.log")
      .replace(/top\.location/gi, "console.log")
      .replace(/<meta[^>]*http-equiv=["']refresh["'][^>]*>/gi, ""); // Xóa tag HTML Refresh tự động

    // 4. Trả về HTML "sạch" cho trình duyệt / App
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Lưu Cache 2 tiếng để tải tức thì ở các lần sau
    res.setHeader("Cache-Control", "public, max-age=7200, s-maxage=7200, stale-while-revalidate=86400");
    
    return res.status(200).send(html);

  } catch (error) {
    // Bắt toàn bộ ngoại lệ để Vercel không bị crash 500
    return res.status(500).json({ 
      error: "Lỗi Serverless Function", 
      details: error.message 
    });
  }
};
