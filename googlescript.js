export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // =========================================================================
    // 1. UPLOAD M3U8 NỘI DUNG THÔ (DOPOST)
    // =========================================================================
    if (request.method === "POST" && url.pathname === "/upload-m3u8") {
      try {
        const data = await request.json();
        let m3u8Content = data.content;
        const baseUrl = data.baseUrl || "";
        const customReferer = data.referer || baseUrl || "https://vsmov.com";

        if (!m3u8Content || !m3u8Content.includes("#EXTM3U")) {
          return responseJSON({ status: "error", message: "Invalid M3U8 content" }, corsHeaders);
        }

        // Rewrite Master Playlist hoặc Media Playlist
        const processedM3u8 = rewriteM3u8Segments(m3u8Content, baseUrl, url.origin, customReferer);

        const fileId = "m3u8_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

        if (env.MY_KV) {
          await env.MY_KV.put(fileId, processedM3u8, { expirationTtl: 600 });
        } else {
          const cache = caches.default;
          const cacheUrl = new URL(`${url.origin}/cache-m3u8/${fileId}`);
          await cache.put(cacheUrl, new Response(processedM3u8, {
            headers: { "Content-Type": "text/plain", "Cache-Control": "max-age=600" }
          }));
        }

        const finalProxyUrl = `${url.origin}/play-m3u8?fileId=${fileId}&ext=.m3u8`;

        return responseJSON({
          status: "success",
          file_id: fileId,
          m3u8_url: finalProxyUrl
        }, corsHeaders);

      } catch (err) {
        return responseJSON({ status: "error", message: err.toString() }, corsHeaders);
      }
    }

    // =========================================================================
    // 2. PHÁT M3U8 TẠM ĐÃ LƯU (DOGET)
    // =========================================================================
    if (url.pathname === "/play-m3u8") {
      const fileId = url.searchParams.get("fileId");
      if (!fileId) return new Response("#EXTM3U\n# Error: Missing File ID", { headers: corsHeaders });

      let m3u8Content = null;
      if (env.MY_KV) {
        m3u8Content = await env.MY_KV.get(fileId);
      } else {
        const cache = caches.default;
        const cachedRes = await cache.match(new URL(`${url.origin}/cache-m3u8/${fileId}`));
        if (cachedRes) m3u8Content = await cachedRes.text();
      }

      if (!m3u8Content) return new Response("#EXTM3U\n# Error: File expired", { headers: corsHeaders });

      return new Response(m3u8Content, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      });
    }

    // =========================================================================
    // 3. PROXY TẢI CÁC PHÂN ĐOẠN HOẶC M3U8 CON (TS / PNG / KEY)
    // =========================================================================
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response("Missing 'url' parameter", { status: 400, headers: corsHeaders });
    }

    const customReferer = url.searchParams.get("referer") || "https://vsmov.com";
    const customUA = url.searchParams.get("ua") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

    let customOrigin = customReferer;
    try { customOrigin = new URL(customReferer).origin; } catch(e) {}

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          "User-Agent": customUA,
          "Referer": customReferer,
          "Origin": customOrigin,
          "Accept": "*/*",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "cross-site"
        }
      });

      if (!response.ok) {
        return new Response(`CDN Blocked: HTTP ${response.status}`, { status: response.status, headers: corsHeaders });
      }

      const contentType = response.headers.get("content-type") || "";
      const isM3U8 = targetUrl.includes(".m3u8") || contentType.includes("mpegurl") || contentType.includes("application/x-mpegurl");

      // Nếu phân đoạn lại tiếp tục là 1 file M3U8 con (Sub-playlist)
      if (isM3U8) {
        let text = await response.text();
        const rewritten = rewriteM3u8Segments(text, targetUrl, url.origin, customReferer);

        return new Response(rewritten, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-store, no-cache, must-revalidate"
          }
        });
      }

      // Nếu là phân đoạn Video TS/PNG
      const newHeaders = new Headers(response.headers);
      Object.keys(corsHeaders).forEach(key => newHeaders.set(key, corsHeaders[key]));
      
      // Đảm bảo MIME type chuẩn để Player nhận diện đúng luồng Stream
      newHeaders.set("Content-Type", "video/mp2t");

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders
      });

    } catch (err) {
      return new Response("Worker Error: " + err.message, { status: 500, headers: corsHeaders });
    }
  }
};

function responseJSON(obj, corsHeaders) {
  return new Response(JSON.stringify(obj), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// Xử lý chuyển đổi toàn bộ link trong M3U8 (Xử lý an toàn cho cả URL mã hóa)
function rewriteM3u8Segments(m3u8Text, baseUrl, workerOrigin, referer) {
  const lines = m3u8Text.split("\n");
  const rewritten = lines.map(line => {
    let trimmed = line.trim();

    if (!trimmed) return line;

    // 1. Xử lý Tag khóa mã hóa (AES-128 KEY)
    if (trimmed.startsWith("#")) {
      if (trimmed.includes("URI=")) {
        return trimmed.replace(/URI="([^"]+)"/, (match, keyUrl) => {
          let absKeyUrl = resolveUrl(keyUrl, baseUrl);
          return `URI="${workerOrigin}?url=${encodeURIComponent(absKeyUrl)}&referer=${encodeURIComponent(referer)}"`;
        });
      }
      return line;
    }

    // 2. Xử lý link phân đoạn (.ts / .png / .m3u8 con)
    let absSegmentUrl = resolveUrl(trimmed, baseUrl);
    return `${workerOrigin}?url=${encodeURIComponent(absSegmentUrl)}&referer=${encodeURIComponent(referer)}`;
  });

  return rewritten.join("\n");
}

// Helper giải quyết link tương đối an toàn
function resolveUrl(relativeOrAbsolute, baseUrl) {
  if (!baseUrl || relativeOrAbsolute.startsWith("http://") || relativeOrAbsolute.startsWith("https://")) {
    return relativeOrAbsolute;
  }
  try {
    return new URL(relativeOrAbsolute, baseUrl).href;
  } catch (e) {
    return relativeOrAbsolute;
  }
}