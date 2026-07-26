export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (!targetUrl) {
      return new Response("Missing 'url' parameter", { status: 400, headers: corsHeaders });
    }

    const customReferer = url.searchParams.get("referer") || "https://play2.cdn-xvideos-xnxx.xyz";
    const customUA = url.searchParams.get("ua") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

    // Tạo Origin từ Referer
    let customOrigin = customReferer;
    try {
      customOrigin = new URL(customReferer).origin;
    } catch(e) {}

    try {
      // BỔ SUNG ĐẦY ĐỦ HEADER ĐỂ "LỪA" CDN KHÔNG BLOCK BOT
      const customHeaders = {
        "User-Agent": customUA,
        "Referer": customReferer,
        "Origin": customOrigin,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site"
      };

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: customHeaders
      });

      if (!response.ok) {
        return new Response(`CDN Blocked: HTTP ${response.status}`, { status: response.status, headers: corsHeaders });
      }

      const contentType = response.headers.get("content-type") || "";
      const isM3U8 = targetUrl.includes(".m3u8") || contentType.includes("mpegurl") || contentType.includes("application/x-mpegurl");

      // 1. XỬ LÝ FILE PLAYLIST .M3U8
      if (isM3U8) {
        let text = await response.text();
        const workerBaseUrl = `${url.origin}${url.pathname}`;
        
        let targetBaseUrl = targetUrl;
        try {
          targetBaseUrl = new URL(targetUrl).href;
        } catch(e) {}

        const lines = text.split("\n");
        const rewrittenLines = lines.map(line => {
          let trimmed = line.trim();

          if (trimmed.startsWith("#")) {
            if (trimmed.includes("URI=")) {
              return trimmed.replace(/URI="([^"]+)"/, (match, keyUrl) => {
                let absKeyUrl = new URL(keyUrl, targetBaseUrl).href;
                return `URI="${workerBaseUrl}?url=${encodeURIComponent(absKeyUrl)}&referer=${encodeURIComponent(customReferer)}"`;
              });
            }
            return line;
          }

          if (trimmed.length > 0) {
            let absSegmentUrl = new URL(trimmed, targetBaseUrl).href;
            return `${workerBaseUrl}?url=${encodeURIComponent(absSegmentUrl)}&referer=${encodeURIComponent(customReferer)}`;
          }

          return line;
        });

        return new Response(rewrittenLines.join("\n"), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/x-mpegURL",
            "Cache-Control": "no-store, no-cache, must-revalidate"
          }
        });
      }

      // 2. XỬ LÝ FILE PHÂN ĐOẠN VIDEO (.TS / VIDEO BINARY)
      const newHeaders = new Headers(response.headers);
      Object.keys(corsHeaders).forEach(key => newHeaders.set(key, corsHeaders[key]));
      
      // Ép chuẩn Content-Type để mọi Player giải mã ngay lập tức
      newHeaders.set("Content-Type", "video/MP2T");

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders
      });

    } catch (err) {
      return new Response("Worker Error: " + err.message, { status: 500, headers: corsHeaders });
    }
  }
};
