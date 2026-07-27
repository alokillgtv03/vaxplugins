// =============================================================================
// VAAPP Plugin - Crophim Pro (Đồng bộ cấu trúc 100% theo chuẩn RophimFake)
// Tên file bắt buộc khi lưu: crophim_plugin.js
// =============================================================================
BaseURL = "https://script.google.com/macros/s/AKfycbydwasfO9sUsP7nSduOON6yKVZUMpSraNRFb58knwl_AKpb6vixCuPe-uptcpaGIiXBEw/exec";
BaseJSON = "";

function getManifest() {
    return JSON.stringify({
        "id": "testvideo3",          
        "name": "Test EMBED TO Exoplayer",
        "description": "Nguồn xem phim Online ổn định",
        "version": "1.5.2",             
        "baseUrl": "https://script.google.com/macros/s/AKfycbydwasfO9sUsP7nSduOON6yKVZUMpSraNRFb58knwl_AKpb6vixCuPe-uptcpaGIiXBEw/exec",
        "iconUrl": "https://crimescenesolutions.co.za/wp-content/uploads/2026/04/phimhayok-io-fav.jpg", 
        "isEnabled": true,
        "type": "VIDEO",
        "playerType": "embed"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "", "title": "Phim Lẻ", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Hành Động", "slug": "" }
    ]);
}

function getFilters() {
    return JSON.stringify({
        "sort": [
            { "name": "Mới nhất", "value": "newest" }
        ]
    });
}

// =============================================================================
// URL GENERATION (Bóc tách slug sạch theo khuôn mẫu mới)
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    
    if (slug === "hanh-dong" || slug === "kinh-di" || slug === "phim-18" || slug === "hai-huoc" || slug === "chien-tranh" || slug === "hoat-hinh" || slug === "vien-tuong") {
        return BaseURL;
    }
    return BaseURL;
}

function getUrlSearch(keyword, filtersJson) {
    return BaseURL;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BaseURL;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================
function appendParamWithRegex(url, myParam) {
    // Pattern kiểm tra xem URL đã chứa dấu '?' chưa
    // (Bỏ qua trường hợp dấu '?' nằm trong phần anchor # nếu có)
    const hasQuery = /\?/.test(url);

    // Nếu đã có '?' thì nối thêm '&', chưa có thì nối '?'
    return hasQuery ? `${url}&${myParam}` : `${url}?${myParam}`;
}

function parseListResponse(html) {

    try {
      
       // print("[parseMovieDetail data]",html);
        var id = BaseURL;
        var parsed = JSON.parse(html);
        BaseJSON = Array.isArray(parsed) ? parsed[0] : parsed;
        var videoUrl = BaseJSON.link;
        var $url = BaseJSON.url || "";
        // Lưu trữ object đầu tiên trực tiếp vào BaseJSON toàn cục để các hàm sau dùng tiện lợi
        var items = [];
        items.push({
            "id": videoUrl,          
            "title": "Test", 
            "posterUrl": "https://img-cdn.phimhayok.net/filmhayok/1782912263995/20260701/ChatGPT-Image-19_29_49-1-thg-7-2026_a20d108246f140ad8be82acb9bca2606.png",  
            "backdropUrl": "https://img-cdn.phimhayok.net/filmhayok/1782912263995/20260701/ChatGPT-Image-19_29_49-1-thg-7-2026_a20d108246f140ad8be82acb9bca2606.png"
        });
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    } catch (e) {
        console.log("Lỗi [parseListResponse]: " + e)
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}


function checkRaw(scriptStr, returnFixed) {
  try {
    if (!scriptStr || typeof scriptStr !== 'string') {
      console.log("[Lỗi escape runJS]\r\n\t Dữ liệu đầu vào không phải là chuỗi hợp lệ!");
      return scriptStr || "";
    }

    var lines = scriptStr.split('\n');
    var fixedLines = [];
    var hasError = false;

    for (var i = 0; i < lines.length; i++) {
      var currentLine = lines[i];
      var lineNum = i + 1;
      var lineErrorFound = false;

      // 1. Kiểm tra lỗi escape newline/tab nguy hiểm nằm trần trong chuỗi quote
      // Trường hợp chưa được escape dạng '\\n' hoặc '\\t' trong chuỗi ghép
      if (/([^\\]|^)(\r\n|\r|\n)/.test(currentLine)) {
        console.log("[Lỗi escape runJS]\r\n\t Phát hiện xuống dòng chưa escape ở Dòng " + lineNum + ": " + currentLine.trim());
        lineErrorFound = true;
      }

      // 2. Kiểm tra lỗi quên escape ký tự Tab trần không hợp lệ
      if (/\t/.test(currentLine) && !/\\t/.test(currentLine)) {
        console.log("[Lỗi escape runJS]\r\n\t Phát hiện ký tự Tab trần ở Dòng " + lineNum + ": " + currentLine.trim());
        lineErrorFound = true;
      }

      // 3. Kiểm tra dấu xược ngược single trailing backlash ở cuối dòng (dễ làm gãy chuỗi)
      if (/([^\\])\\$/.test(currentLine)) {
        console.log("[Lỗi escape runJS]\r\n\t Dấu Backslash (\\) cô đơn ở cuối Dòng " + lineNum + ": " + currentLine.trim());
        lineErrorFound = true;
      }

      if (lineErrorFound) {
        hasError = true;
      }

      // Tiến hành SỬA LỖI tự động nếu tham số returnFixed = true
      var fixedLine = currentLine;
      if (returnFixed) {
        // Chuẩn hóa ký tự xuống dòng và tab đặc biệt
        fixedLine = fixedLine
          .replace(/\r/g, "")
          .replace(/\t/g, "  "); // Thay Tab trần bằng 2 khoảng trắng cho an toàn
      }

      fixedLines.push(fixedLine);
    }

    // 4. Kiểm tra cú pháp nhanh xem toàn bộ chuỗi có parse được JS không
    try {
      new Function(scriptStr);
    } catch (syntaxErr) {
      hasError = true;
      console.log("[Lỗi escape runJS]\r\n\t 💥 LỖI CÚ PHÁP (SyntaxError) toàn cục: " + syntaxErr.message);
    }

    if (!hasError) {
      console.log("[checkRaw] 🟢 Chuỗi Raw JS hoàn toàn sạch lỗi!");
    }

    // Trả về bản đã fix hoặc bản gốc theo tham số returnFixed
    return returnFixed ? fixedLines.join('\n') : scriptStr;

  } catch (e) {
    console.log("[Lỗi escape runJS]\r\n\t Lỗi ngoại lệ trong hàm checkRaw: " + e.message);
    return scriptStr; // Luôn an toàn: Fallback trả về chuỗi gốc chứ không làm sập script
  }
}

/**
 * Hàm Decode sạch các HTML entities trong URL
 */
function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseMovieDetail(html, url) {
  console.log("parseMovieDetail [videoUrl]: " + url);
  try {  
    var cleanUrl = decodeHtmlEntities(url);
    var title = "Chưa rõ tên phim";
    var year = "2026";
    var des = html;
    var img = "https://img-cdn.phimhayok.net/filmhayok/1782912263995/20260701/ChatGPT-Image-19_29_49-1-thg-7-2026_a20d108246f140ad8be82acb9bca2606.png";
    
    // Giữ nguyên chuỗi cleanUrl ban đầu cho tập phim
    var episodes = [{ id: cleanUrl, name: "Xem Ngay", slug: "full" }]; 
    
    return JSON.stringify({
      "id": cleanUrl,
      "title": title,
      "posterUrl": img,
      "backdropUrl": img,
      "description": des,
      "year": year,
      "rating": 10,
      "quality": "HD",
      "servers": [{ "name": "Server Vietsub", "episodes": episodes }]
    });

  } catch (e) {
    console.log("parseMovieDetail Error: " + e);
    return JSON.stringify({ "id": "error", "title": "Lỗi tải dữ liệu", "servers": [] });
  }
}

/**
 * 🚀 HÀM WATERFALL TỪNG BƯỚC (STEP-BY-STEP)
 * Chỉ bóc tách ĐÚNG 1 TẦNG fetchUrl tiếp theo để App Fetch tiếp.
 */

function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * 🚀 HÀM WATERFALL ĐA NĂNG (GÉNÉRIC FOR ALL SERVERS)
 * Tự động gom đúng tất cả các token/param đi kèm về đúng fetchUrl tương ứng.
 */
function getNextFetchStep(url) {
  var cleanUrl = decodeHtmlEntities(url);
  try { cleanUrl = decodeURIComponent(cleanUrl); } catch (e) {}
  cleanUrl = decodeHtmlEntities(cleanUrl);

  var qIndex = cleanUrl.indexOf('?');
  if (qIndex === -1) {
    return { nextUrl: cleanUrl, isEmbed: false };
  }

  var baseUrl = cleanUrl.substring(0, qIndex);
  var queryString = cleanUrl.substring(qIndex + 1);

  // Trích xuất tất cả fetchUrl kèm theo toàn bộ Token/Param của nó
  var fetchUrls = [];
  var parts = queryString.split(/(?:^|&)fetchUrl=/i);

  // phần [0] là param của Base URL, từ [1] trở đi là các fetchUrl
  for (var i = 1; i < parts.length; i++) {
    var rawItem = parts[i];
    if (!rawItem) continue;

    // Làm sạch ký tự mã hóa dư thừa
    var decodedItem = rawItem;
    try {
      if (decodedItem.indexOf('%3A') !== -1 || decodedItem.indexOf('%2F') !== -1) {
        decodedItem = decodeURIComponent(decodedItem);
      }
    } catch (e) {}

    decodedItem = decodeHtmlEntities(decodedItem);
    decodedItem = decodedItem.replace(/^[&?]+|[&?]+$/g, '');

    if (decodedItem && fetchUrls.indexOf(decodedItem) === -1) {
      fetchUrls.push(decodedItem);
    }
  }

  // 1. Nếu không còn fetchUrl nào -> ĐÃ LÀ TẦNG CUỐI!
  if (fetchUrls.length === 0) {
    return {
      nextUrl: cleanUrl,
      isEmbed: false
    };
  }

  // 2. Lấy fetchUrl ĐẦU TIÊN làm Target cho tầng tiếp theo
  var targetUrl = fetchUrls.shift();

  // 3. Nếu KHÔNG CÒN fetchUrl nào phía sau -> TẮT EMBED (Trả về False để bật CustomJS)
  if (fetchUrls.length === 0) {
    return {
      nextUrl: targetUrl,
      isEmbed: false // 🎯 HOÀN THÀNH WATERFALL
    };
  }

  // 4. Nếu VẪN CÒN các fetchUrl phía sau -> Nối lại nguyên vẹn cho các tầng tiếp theo
  var remainingParams = fetchUrls
    .map(function(item) {
      return "fetchUrl=" + encodeURIComponent(item);
    })
    .join("&");

  var joinChar = targetUrl.indexOf('?') !== -1 ? '&' : '?';
  targetUrl = targetUrl + joinChar + remainingParams;

  return {
    nextUrl: targetUrl,
    isEmbed: true // 🎯 Tiếp tục Waterfall sang tầng kế
  };
}

/**
 * 🛡️ REFERER ĐỘNG ĐA NĂNG
 * Tự động cắt lấy Base URL của tầng hiện tại làm Referer hợp lệ cho tầng sau.
 */
function getCleanReferer(url) {
  try {
    var clean = decodeHtmlEntities(url);
    var qIndex = clean.indexOf('?');
    if (qIndex !== -1) {
      return clean.substring(0, qIndex);
    }
    return clean;
  } catch(e) {
    return url;
  }
}

function parseDetailResponse(html, url) {
  console.log("parseDetailResponse [Tầng 1]: " + url);
  console.log("parseDetailResponse [Raw]: " + html);
  try {
    var rawJS = checkRaw(runjS(), true);
    var result = getNextFetchStep(url);

    console.log("parseDetailResponse [Next URL]: " + result.nextUrl);
    console.log("parseDetailResponse [isEmbed]: " + result.isEmbed);

    return JSON.stringify({
      "url": result.nextUrl,
      "isEmbed": result.isEmbed,
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": getCleanReferer(url),
        "Block-Ads": "true",
        "Custom-Js": rawJS
      }
    });
  } catch (e) {
    console.log("[Lỗi parseDetailResponse]", e);
    return JSON.stringify({ "url": "", "isEmbed": false, "headers": {} });
  }
}

function parseEmbedResponse(html, url) {
  console.log("parseEmbedResponse [Tầng tiếp theo]: " + url);
  console.log("parseEmbedResponse [Raw]: " + html);
  try {
    var rawJS = checkRaw(runjS(), true);
    var result = getNextFetchStep(url);

    console.log("parseEmbedResponse [Next URL]: " + result.nextUrl);
    console.log("parseEmbedResponse [isEmbed]: " + result.isEmbed);

    return JSON.stringify({
      "url": result.nextUrl,
      "isEmbed": result.isEmbed, // Tự động trả về false khi đã bóc tới tầng cuối!
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": getCleanReferer(url),
        "Block-Ads": "true",
        "Custom-Js": rawJS
      }
    });
  } catch (e) {
    console.log("[Lỗi parseEmbedResponse]", e);
    return JSON.stringify({ "url": "", "isEmbed": false, "headers": {} });
  }
}


function runjS() {

    // =========================================================================
    // 1. CONFIG JS: Cấu hình linh hoạt
    // =========================================================================
    function configJS() {
        return `
    // ⚙️ GLOBAL CONFIG
    var LOGGER = true; 
    var processedUrls = {};
    var hasDispatchedAny = false;
    var activeWorkerIndex = 0;

    var PLAYER_MODE = "CUSTOM"; // "EXO": Phát qua Native App | "CUSTOM": Nhúng ArtPlayer
    var PROXY_ENABLED = true; 

    // 👉 BẬT CUSTOM DECODER (SETVIDEO QUYỀN ƯU TIÊN HÀNG ĐẦU)
    var USE_CUSTOM_DECODER = false; 
    var SET_VIDEO_WAIT_MS = 3000; // Thời gian tối đa chờ setVideo xử lý trước khi kích hoạt Fallback Sniffer

    var WORKER_POOL = [
      "https://soft-surf-c11d.alokillgtv.workers.dev",
      "https://soft-water-25b0.alokillgtv02.workers.dev"
    ];

    var CUSTOM_REFERER = window.location.href;

    // 🚀 REGEX TỔNG QUÁT BẮT LINK MEDIA & API (Đã fix escape \\/hls\\/)
    var STREAM_URL_REGEX = /https?:\\/\\/[^\\s"'<>]*(?:m3u8|mp4|streaming|stream|playlist|embed|sanstream\\.xyz|cdn=|\\/hls\\/|\\?id=)[^\\s"'>]*/i;

    // 🎯 HÀNG ĐỢI (QUEUE) LƯU TẤT CẢ LINK SNIFFER BẮT ĐƯỢC ĐỂ CHỜ FALLBACK
    var snifferQueue = [];
    var setVideoSuccess = false;
    var setVideoTimer = null;

    var ENABLE_FILTER = false; 
    var BLOCKED_DOMAINS = ["ads.example.com", "*.adnetwork.com"];

    var SNIFFER_TIMEOUT_MS = 10000;
    var HTMLRAW = false;
    var ENDEMBED = true; 
    
    activeWorkerIndex = Math.floor(Math.random() * WORKER_POOL.length);

    function bridgeLog(msg) {
      if (!LOGGER) return;
      try {
        var strMsg = String(msg);
        var formattedContent = strMsg;

        var match = strMsg.match(/^(\\S+\\s*\\[[^\\]]+\\]:?)(.*)$/);
        if (match) {
          var header = match[1].trim();
          var body = match[2].trim();
          formattedContent = header + "\\r\\n\\t" + body;
        }

        var logMessage = '[CustomJS][LOG] [SNIFFER LOG] ' + formattedContent;

        if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
          window.SnifferBridge.log(logMessage);
        } else if (typeof console !== 'undefined' && console.log) {
          console.log(logMessage);
        }
      } catch (e) {}
    }
    `;
    }

    // =========================================================================
    // 🚀 SETVIDEO JS: Chạy ưu tiên & Đánh dấu trạng thái
    // =========================================================================
    function setVideoJS() {
        return `
  function setVideo(rawUrl, sourceName) {
    try {
      bridgeLog('⏳ [setVideo - ĐANG XỬ LÝ ƯU TIÊN] Nguồn: [' + sourceName + ']');

      var html = document.documentElement ? document.documentElement.outerHTML : '';

      var idvideo = html.match(/videoId[^"']+["']([^"']+)["']/i);
      var urlvideo = html.match(/videoId[\\s\\S]*?(\\/\\?token1=[^"']+)["']/i);
      var linkVD = "";

      // 🛡️ Bắt buộc kiểm tra null trước khi truy cập idvideo[1]
      if (idvideo && idvideo[1] && urlvideo && urlvideo[1]) {
        linkVD = "https://cdn.neuronix.sbs/segment/" + idvideo[1] + urlvideo[1];
        bridgeLog("🎉 Đã tìm ra link video: " + linkVD);
      } else {
        bridgeLog("⚠️ Không tìm thấy regex videoId trong HTML!");
      }

      var decodedUrl = linkVD; 

      if (decodedUrl && typeof decodedUrl === 'string' && decodedUrl.length > 10) {
        setVideoSuccess = true;
        hasDispatchedAny = true;
        if (setVideoTimer) clearTimeout(setVideoTimer);

        bridgeLog('🎉 [setVideo - THÀNH CÔNG]: Đã lấy được link -> ' + decodedUrl);
        dispatchToPlayer(decodedUrl, "setVideo");
        return true;
      } else {
        bridgeLog('⚠️ [setVideo - KHÔNG THỎA MÃN]: Chờ Sniffer Fallback...');
        return false;
      }

    } catch (e) {
      bridgeLog('❌ [setVideo - LỖI XỬ LÝ]: ' + e.message);
      return false;
    }
  }
  `;
    }

    // =========================================================================
    // 📡 GET LINK JS: Vừa chạy setVideo vừa Cache link cho Fallback Sniffer
    // =========================================================================
    function getLinkJS() {
        return `
    function getLinkJS(rawUrl, sourceName) {
      try {
        if (!rawUrl || typeof rawUrl !== 'string') return;
        if (hasDispatchedAny) return;
        if (rawUrl.indexOf('blob:') === 0 || rawUrl.indexOf('data:') === 0) return;

        var absoluteUrl = new URL(rawUrl, document.baseURI || window.location.href).href;

        if (STREAM_URL_REGEX && !STREAM_URL_REGEX.test(absoluteUrl)) return; 
        if (processedUrls[absoluteUrl]) return;
        processedUrls[absoluteUrl] = true;

        bridgeLog('🎯 [Sniffer - TÓM ĐƯỢC LINK] Nguồn [' + (sourceName || 'Unknown') + ']: ' + absoluteUrl);

        if (!isDomainAllowed(absoluteUrl)) {
          bridgeLog('🚫 [Sniffer - Bị Filter Domain]: ' + absoluteUrl);
          return; 
        }

        // 1. LƯU LINK VÀO QUEUE ĐỂ PHÒNG KHÍ SETVIDEO THẤT BẠI
        snifferQueue.push({ url: absoluteUrl, source: sourceName });

        // 2. NẾU BẬT USE_CUSTOM_DECODER -> CHO SETVIDEO CHẠY THỬ TRƯỚC
        if (typeof USE_CUSTOM_DECODER !== 'undefined' && USE_CUSTOM_DECODER && typeof setVideo === 'function') {
          
          var success = setVideo(absoluteUrl, sourceName);
          
          // Nếu setVideo chưa có kết quả thành công, kích hoạt Timer đếm ngược chờ Fallback Sniffer
          if (!success && !setVideoTimer && !setVideoSuccess) {
            bridgeLog('⏱️ [Sniffer]: Bắt đầu hẹn giờ ' + SET_VIDEO_WAIT_MS + 'ms chờ setVideo... Nếu hết giờ sẽ chuyển sang dùng link Sniffer.');
            
            setVideoTimer = setTimeout(function() {
              triggerSnifferFallback();
            }, SET_VIDEO_WAIT_MS);
          }
          return;
        }

        // 3. NẾU KHÔNG BẬT USE_CUSTOM_DECODER -> PHÁT THẲNG
        dispatchToPlayer(absoluteUrl, "DirectSniffer");

      } catch (e) {
        bridgeLog('❌ [getLinkJS - Lỗi]: ' + e.message);
      }
    }

    /**
     * 🔄 HÀM FALLBACK: Gọi khi setVideo hết thời gian chờ mà không gửi được link nào
     */
    function triggerSnifferFallback() {
      if (hasDispatchedAny || setVideoSuccess) return;

      bridgeLog('🔄 [Sniffer Fallback]: setVideo không trả về link! Tiến hành xả hàng đợi Sniffer Queue (' + snifferQueue.length + ' link)...');

      if (snifferQueue.length > 0) {
        var fallbackItem = snifferQueue[0]; // Lấy link đầu tiên tóm được
        bridgeLog('🚀 [Sniffer Fallback]: Lấy link từ Sniffer gửi Player -> ' + fallbackItem.url);
        
        hasDispatchedAny = true;
        dispatchToPlayer(fallbackItem.url, "SnifferFallback (" + fallbackItem.source + ")");
      } else {
        bridgeLog('⚠️ [Sniffer Fallback]: Hàng đợi rỗng, chờ Sniffer tìm thêm...');
      }
    }
    `;
    }

    // =========================================================================
    // 📡 ART PLAYER BUILDING
    // =========================================================================
    function artPlayer() {
        return `
function renderArtPlayer(playUrl, rawStreamUrl) {
  try {
    bridgeLog('🚀 [renderArtPlayer]: Khởi tạo ArtPlayer (Xóa sạch Loading xấu của web gốc)...');

    // 1. ÉP TẤT CẢ NỀN WEB GỐC VỀ MÀU ĐEN SẠCH (Xóa sạch hình Play mờ phía sau)
    document.documentElement.style.cssText = 'background: #000 !important; background-image: none !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important;';
    document.body.innerHTML = '';
    document.body.style.cssText = 'background: #000 !important; background-image: none !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important;';

    var style = document.createElement('style');
    style.innerHTML = \`
      /* RESET SẠCH TẤT CẢ TÁC NHÂN NỀN XẤU TỪ WEB GỐC */
      *:not(#artplayer-container *):not(.art-video) {
        background-image: none !important;
      }

      html, body { 
        width: 100vw !important; 
        height: 100vh !important; 
        margin: 0 !important; 
        padding: 0 !important; 
        overflow: hidden !important; 
        background: #0f172a !important; 
      } 

      #artplayer-container { 
        width: 100vw !important; 
        height: 100vh !important; 
        position: fixed !important; 
        top: 0 !important; 
        left: 0 !important; 
        z-index: 999999 !important; 
        outline: none !important; 
        background: #0f172a !important;
      }

      /* AN HĂN POSTER LỚN CỦA PLAYER */
      .art-poster, .art-poster-img {
        display: none !important;
      }

      /* TÙY CHỈNH LOADING SCREEN MỚI CỰC ĐẸP */
      .art-loading {
        background: #0f172a !important; /* Nền tối phẳng mượt */
      }
      .art-loading-icon, .art-icon-loading { 
        display: none !important; 
      }
      
      .custom-art-loading-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .custom-art-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-left-color: #38bdf8;
        border-radius: 50%;
        animation: artSpin 0.8s linear infinite;
      }
      .custom-art-loading-text {
        margin-top: 15px;
        color: #f8fafc;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.5px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      @keyframes artSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    \`;
    document.head.appendChild(style);

    var container = document.createElement('div');
    container.id = 'artplayer-container';
    container.setAttribute('tabindex', '0');
    container.setAttribute('autofocus', 'true');
    document.body.appendChild(container);

    var lowerPlayUrl = (playUrl || '').toLowerCase();
    var lowerRawUrl = (rawStreamUrl || '').toLowerCase();
    
    var isProxyLink = PROXY_ENABLED && WORKER_POOL.some(function(worker) {
      return lowerPlayUrl.indexOf(worker.toLowerCase()) !== -1;
    });

    var isM3U8 = lowerRawUrl.indexOf('.m3u8') !== -1 || 
                 lowerPlayUrl.indexOf('.m3u8') !== -1 || 
                 lowerPlayUrl.indexOf('%2fm3u8') !== -1 ||
                 isProxyLink;

    var customSettings = [];
    if (PROXY_ENABLED && WORKER_POOL && WORKER_POOL.length > 0) {
      customSettings.push({
        html: 'Server Proxy',
        tooltip: 'Server ' + (activeWorkerIndex + 1),
        selector: WORKER_POOL.map(function(workerUrl, idx) {
          return {
            default: idx === activeWorkerIndex,
            html: 'Server ' + (idx + 1) + (idx === activeWorkerIndex ? ' (Đang chọn)' : ''),
            url: workerUrl,
            index: idx
          };
        }),
        onSelect: function (item) {
          bridgeLog('🔄 [ArtPlayer]: Chuyển sang ' + item.html);
          activeWorkerIndex = item.index;
          var newPlayUrl = buildProxyUrl(rawStreamUrl, activeWorkerIndex);
          window.art.switchUrl(newPlayUrl);
          return item.html;
        }
      });
    }

    customSettings.push({
      html: 'Tỉ lệ màn hình',
      tooltip: 'Mặc định',
      selector: [
        { default: true, html: 'Mặc định', value: 'default' },
        { html: '16:9', value: '16:9' },
        { html: '4:3', value: '4:3' },
        { html: 'Phủ kín (Crop)', value: 'cover' }
      ],
      onSelect: function (item) {
        window.art.aspectRatio = item.value;
        return item.html;
      }
    });

    window.art = new Artplayer({
      container: '#artplayer-container',
      url: playUrl,
      type: isM3U8 ? 'm3u8' : 'mp4',
      autoplay: true,
      volume: 0.8,
      isLive: false,
      hotkey: true,
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      pip: true,
      autoOrientation: true,
      airplay: true,
      screenshot: true,
      theme: '#38bdf8',

      // NẠP LOADING CỦA ARTPLAYER
      customHTML: {
        loading: \`
          <div class="custom-art-loading-box">
            <div class="custom-art-spinner"></div>
            <div class="custom-art-loading-text">Đang tải video...</div>
          </div>
        \`
      },

      customType: {
        m3u8: function (video, url, art) {
          if (Hls.isSupported()) {
            if (art.hls) art.hls.destroy();
            var hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 90,
              maxBufferLength: 30,
              maxMaxBufferLength: 600
            });

            hls.loadSource(url);
            hls.attachMedia(video);
            art.hls = hls;

            art.on('destroy', function () {
              if (art.hls) art.hls.destroy();
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
          }
        }
      }
    });

    window.art.on('ready', function() {
      bridgeLog('🎉 [ArtPlayer]: Sẵn sàng!');
      setTimeout(function() {
        container.focus();
        if (window.art && window.art.template && window.art.template.$player) {
          window.art.template.$player.focus();
        }
      }, 300);

      window.art.play().catch(function() {
        window.art.muted = true;
        window.art.play();
      });
    });

    // LẮNG NGHE BÀN PHÍM VÀ REMOTE TV
    window.addEventListener('keydown', function(e) {
      if (!window.art) return;

      var code = e.keyCode || e.which;
      var key = e.key;

      // ⏩ LÙI VIDEO (10s)
      if (code === 37 || code === 21 || code === 88 || code === 412 || key === 'ArrowLeft' || key === 'MediaRewind') {
        e.preventDefault();
        e.stopPropagation();
        var targetTime = Math.max(0, window.art.currentTime - 10);
        window.art.seek = targetTime;
        window.art.notice.show = '⏪ Lùi 10s (' + Math.floor(targetTime) + 's)';
      }
      
      // ⏩ TUA VIDEO (10s)
      else if (code === 39 || code === 22 || code === 87 || code === 417 || key === 'ArrowRight' || key === 'MediaFastForward') {
        e.preventDefault();
        e.stopPropagation();
        var targetTime = Math.min(window.art.duration || 99999, window.art.currentTime + 10);
        window.art.seek = targetTime;
        window.art.notice.show = '⏩ Tua 10s (' + Math.floor(targetTime) + 's)';
      }

      // 🔊 TĂNG ÂM LƯỢNG
      else if (code === 38 || code === 19 || key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        window.art.volume = Math.min(1, window.art.volume + 0.1);
        window.art.notice.show = '🔊 Âm lượng: ' + Math.round(window.art.volume * 100) + '%';
      }

      // 🔉 GIẢM ÂM LƯỢNG
      else if (code === 40 || code === 20 || key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        window.art.volume = Math.max(0, window.art.volume - 0.1);
        window.art.notice.show = '🔉 Âm lượng: ' + Math.round(window.art.volume * 100) + '%';
      }

      // ⏯️ PAUSE / PLAY
      else if (code === 32 || code === 13 || code === 23 || code === 66 || code === 179 || key === ' ' || key === 'Enter' || key === 'Select') {
        e.preventDefault();
        e.stopPropagation();
        window.art.toggle();
      }
    }, true);

  } catch (e) {
    bridgeLog('❌ [renderArtPlayer - Lỗi]: ' + e.message);
  }
} 
    `;
    }

    // =========================================================================
    // 🎨 PLAYER DISPATCHER: Hàm dùng chung để phát qua Native hoặc Custom Player
    // =========================================================================
    function mainJS() {
        return `
    function dispatchToPlayer(mediaUrl, dispatchSource) {
      try {
        hasDispatchedAny = true;
        bridgeLog('🎬 [DISPATCH TO PLAYER] [Nguồn: ' + dispatchSource + '] -> ' + mediaUrl);

        if (PLAYER_MODE === "EXO") {
          var playUrl = PROXY_ENABLED ? buildProxyUrl(mediaUrl, activeWorkerIndex) : mediaUrl;
          bridgeLog('📱 [DISPATCH EXO NATIVE]: ' + playUrl);

          if (window.SnifferBridge && typeof window.SnifferBridge.onMediaFound === 'function') {
            window.SnifferBridge.onMediaFound(playUrl, CUSTOM_REFERER);
          } 
          else if (window.SnifferBridge && typeof window.SnifferBridge.playVideo === 'function') {
            window.SnifferBridge.playVideo(playUrl, CUSTOM_REFERER);
          } 
          else {
            window.location.href = "intent://" + playUrl.replace(/^https?:\\/\\//, '') + "#Intent;scheme=https;type=video/*;end";
          }
        } 
        else {
          bridgeLog('🎨 [DISPATCH CUSTOM ARTPLAYER] Rendering...');
          dispatchMediaStream(mediaUrl);
          SnifferBridge.toast("Đã setup thành công, trình phát có hỗ trợ chuyển server. Bạn hãy sử dụng chúng nếu video không xem được.")
          
        }
      } catch (e) {
        bridgeLog('❌ [dispatchToPlayer - Lỗi]: ' + e.message);
      }
    }

    function beginJS() {
      try {
        bridgeLog('🚀 [beginJS] Khởi chạy Sniffer! Tiến hành gắn Interceptors...');

        // 🛡️ ANTI-REDIRECT SHIELD
        (function blockNavigation() {
          try {
            var noop = function() { bridgeLog('🛡️ [Anti-Redirect] Đã chặn chuyển trang!'); };
            Object.defineProperty(window, 'onbeforeunload', { configurable: false, get: function() { return null; }, set: function() {} });
            if (window.location) { window.location.assign = noop; window.location.replace = noop; }
            window.open = function() { bridgeLog('🛡️ [Anti-Redirect] Đã chặn window.open()!'); return null; };
          } catch (err) {}
        })();

        // ⏱️ TIMER TIMEOUT TOÀN CỤC
        setTimeout(function() {
          if (!hasDispatchedAny) {
            onSnifferFailed();
          }
        }, SNIFFER_TIMEOUT_MS);

        // 📡 INTERCEPT XHR
        if (typeof XMLHttpRequest !== 'undefined') {
          var originalOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function (method, url) {
            try { if (url) getLinkJS(url, 'XHR.' + method); } catch (e) {}
            return originalOpen.apply(this, arguments);
          };
        }

        // 📡 INTERCEPT FETCH
        if (typeof window.fetch === 'function') {
          var originalFetch = window.fetch;
          window.fetch = function (input, init) {
            try {
              var url = (typeof input === 'string') ? input : (input && input.url ? input.url : '');
              if (url) getLinkJS(url, 'Fetch');
            } catch (e) {}
            return originalFetch.apply(this, arguments);
          };
        }

        // 🎬 SCAN DOM ON LOAD
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          handleMainExecution();
        } else {
          window.addEventListener('load', handleMainExecution);
          setTimeout(handleMainExecution, 800);
        }

      } catch (e) {
        bridgeLog('❌ [beginJS - Lỗi]: ' + e.message);
      }
    }

    function onSnifferFailed() {
      try {
        if (hasDispatchedAny) return;

        // Thử kích hoạt Fallback Sniffer một lần nữa trước khi báo lỗi
        if (snifferQueue.length > 0) {
          triggerSnifferFallback();
          return;
        }

        bridgeLog('⚠️ [onSnifferFailed]: Hết thời gian chờ, cả setVideo và Sniffer đều không tìm thấy link!');

        if (typeof HTMLRAW !== 'undefined' && HTMLRAW) {
          var htmlContent = document.documentElement ? document.documentElement.outerHTML : document.body.innerHTML;
          bridgeLog('[In Raw HTML]: ' + htmlContent + '...');
          
          if (ENDEMBED && window.SnifferBridge && typeof window.SnifferBridge.toast === 'function') {
            window.SnifferBridge.toast("Không tìm thấy link media. Thử lại sau nhé!");
          }
        }

        if (window.SnifferBridge && typeof window.SnifferBridge.onFailed === 'function') {
          window.SnifferBridge.onFailed("NOT_FOUND");
        }
      } catch (e) {
        bridgeLog('❌ [onSnifferFailed - Lỗi]: ' + e.message);
      }
    }

    function isDomainAllowed(url) {
      try {
        if (!ENABLE_FILTER) return true;
        var parsedUrl = new URL(url);
        var hostname = parsedUrl.hostname.toLowerCase();

        if (BLOCKED_DOMAINS && BLOCKED_DOMAINS.length > 0) {
          for (var i = 0; i < BLOCKED_DOMAINS.length; i++) {
            var blockPattern = BLOCKED_DOMAINS[i].toLowerCase().trim();
            if (hostname.indexOf(blockPattern.replace('*', '')) !== -1) return false;
          }
        }
        return true;
      } catch (e) {
        return true;
      }
    }

    function buildProxyUrl(targetUrl, workerIdx) {
      try {
        if (!PROXY_ENABLED || !WORKER_POOL || WORKER_POOL.length === 0) return targetUrl;
        var selectedWorker = WORKER_POOL[workerIdx % WORKER_POOL.length];
        return selectedWorker + "?url=" + encodeURIComponent(targetUrl) + "&referer=" + encodeURIComponent(CUSTOM_REFERER);
      } catch (e) {
        return targetUrl;
      }
    }

    function dispatchMediaStream(rawStreamUrl) {
      try {
        var playUrl = PROXY_ENABLED ? buildProxyUrl(rawStreamUrl, activeWorkerIndex) : rawStreamUrl;
        bridgeLog('🎨 [dispatchMediaStream]: Tải CDN ArtPlayer cho link -> ' + playUrl);
        loadAndRenderArtPlayer(playUrl, rawStreamUrl);
      } catch (e) {
        bridgeLog('❌ [dispatchMediaStream - Lỗi]: ' + e.message);
      }
    }

    function loadAndRenderArtPlayer(initialPlayUrl, rawStreamUrl) {
      try {
        if (!document.getElementById('artplayer-css')) {
          var linkCss = document.createElement('link');
          linkCss.id = 'artplayer-css';
          linkCss.rel = 'stylesheet';
          linkCss.href = 'https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.css';
          document.head.appendChild(linkCss);
        }

        var loadedCount = 0;
        function checkLoaded() {
          loadedCount++;
          if (loadedCount >= 2) renderArtPlayer(initialPlayUrl, rawStreamUrl);
        }

        if (typeof Hls === 'undefined') {
          var scriptHls = document.createElement('script');
          scriptHls.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
          scriptHls.onload = checkLoaded;
          document.head.appendChild(scriptHls);
        } else {
          checkLoaded();
        }

        if (typeof Artplayer === 'undefined') {
          var scriptArt = document.createElement('script');
          scriptArt.src = 'https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.js';
          scriptArt.onload = checkLoaded;
          document.head.appendChild(scriptArt);
        } else {
          checkLoaded();
        }
      } catch (e) {
        bridgeLog('❌ [loadAndRenderArtPlayer - Lỗi]: ' + e.message);
      }
    }

    // Build Artplayer
    ${artPlayer()}

    function scanVideoElements() {
      if (hasDispatchedAny) return;
      try {
        var videos = document.getElementsByTagName('video');
        for (var i = 0; i < videos.length; i++) {
          if (hasDispatchedAny) break;
          var v = videos[i];
          if (v.currentSrc) getLinkJS(v.currentSrc, 'HTMLVideoElement.currentSrc');
          if (v.src) getLinkJS(v.src, 'HTMLVideoElement.src');
        }
      } catch (e) {}
    }

    function handleMainExecution() {
      try { 
        // 🚀 ƯU TIÊN 1: Ép setVideo chạy ngay lập tức khi vào trang
        if (typeof USE_CUSTOM_DECODER !== 'undefined' && USE_CUSTOM_DECODER && typeof setVideo === 'function' && !hasDispatchedAny) {
          bridgeLog('⚡ [handleMainExecution]: Ép setVideo chạy ưu tiên ngay khi tải trang...');
          var success = setVideo(window.location.href, 'DirectDOM');
          if (success) return; // Nếu thành công thì dừng luôn, không cần quét gì nữa
        }

        // 🎯 ƯU TIÊN 2: Quét tag <video>
        scanVideoElements(); 
      } catch (e) {
        bridgeLog('❌ [handleMainExecution - Lỗi]: ' + e.message);
      }
    }
    `;
    }

    // =========================================================================
    // KẾT NỐI TOÀN BỘ SCRIPT
    // =========================================================================
    function loadingSC() {
        return `
  (function () {
  // 🎯 1. TẠO MÃ CSS DẠNG NỀN TỐI + SPINNER XOAY
  var loadingCSS = \`
    /* Che toàn bộ màn hình với nền tối */
    
    #custom-loading-screen {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background-color: #0f172a !important; /* Nền tối sang trọng */
      z-index: 99999999 !important; /* Luôn đè lên trên tất cả */
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      transition: opacity 0.4s ease, visibility 0.4s ease !important;
    }

    /* Vòng xoay Spinner */
    .custom-spinner {
      width: 50px !important;
      height: 50px !important;
      border: 4px solid rgba(255, 255, 255, 0.1) !important;
      border-left-color: #38bdf8 !important; /* Màu xanh sáng */
      border-radius: 50% !important;
      animation: custom-spin 1s linear infinite !important;
    }

    /* Dòng chữ bên dưới Spinner */
    .custom-loading-text {
      margin-top: 16px !important;
      color: #f8fafc !important;
      font-size: 15px !important;
      font-weight: 500 !important;
      letter-spacing: 0.5px !important;
    }

    /* Hiệu ứng xoay 360 độ */
    @keyframes custom-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  \`;

  // 🎯 2. HÀM INJECT CSS & HTML VÀO TRANG SỚM NHẤT CÓ THỂ
  function injectLoadingScreen() {
    if (document.getElementById('custom-loading-screen')) return;

    // Inject CSS
    var styleNode = document.createElement('style');
    styleNode.id = 'custom-loading-style';
    styleNode.textContent = loadingCSS;

    // Inject HTML Loading Screen
    var loadingNode = document.createElement('div');
    loadingNode.id = 'custom-loading-screen';
    loadingNode.innerHTML = \`
      <div class="custom-spinner"></div>
      <div class="custom-loading-text">Đang tải dữ liệu...</div>
    \`;

    // Ép nhét vào documentElement (thẻ <html>) ngay cả khi chưa có thẻ <body> hay <head>
    var target = document.head || document.documentElement;
    target.appendChild(styleNode);
    document.documentElement.appendChild(loadingNode);
  }

  // 🎯 3. HÀM ẨN VÀ XÓA MÀN HÌNH CHỜ KHI WEB ĐÃ TẢI XONG
  window.hideLoadingScreen = function () {
    var screen = document.getElementById('custom-loading-screen');
    if (screen) {
      screen.style.opacity = '0';
      screen.style.visibility = 'hidden';
      setTimeout(function () {
        if (screen && screen.parentNode) {
          screen.parentNode.removeChild(screen);
        }
      }, 400); // Đợi hiệu ứng mờ dần (fade out) 0.4s rồi xóa khỏi HTML
    }
  };

  // Thực thi inject ngay lập tức
  injectLoadingScreen();

  // Tự động tắt màn hình chờ khi toàn bộ trang web (DOM + Tài nguyên) đã tải xong
  if (document.readyState === 'complete') {
    window.hideLoadingScreen();
  } else {
    window.addEventListener('load', window.hideLoadingScreen);
  }
})();
  `;
    }

    return `
(function initEnhancedVideoSniffer() {
  if (window.__SNIFFER_INITIALIZED__) return;
  window.__SNIFFER_INITIALIZED__ = true;

  try {
    ${loadingSC()}
    ${configJS()}
    ${setVideoJS()}
    ${getLinkJS()}
    ${mainJS()}

    beginJS();

  } catch (globalErr) {
    if (typeof bridgeLog === 'function') {
      bridgeLog('❌ [initEnhancedVideoSniffer - Lỗi Toàn Cục]: ' + globalErr.message);
    }
  }
})();
  `;
}




function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
