// =============================================================================
// VAAPP Plugin - Crophim Pro (Đồng bộ cấu trúc 100% theo chuẩn RophimFake)
// Tên file bắt buộc khi lưu: crophim_plugin.js
// =============================================================================
BaseURL = "https://script.google.com/macros/s/AKfycbydwasfO9sUsP7nSduOON6yKVZUMpSraNRFb58knwl_AKpb6vixCuPe-uptcpaGIiXBEw/exec";
BaseJSON = "";
LISTURL = `
https://animevv.com/
https://animevv.com/xem-phim/nhat-tram-thuong-khung-p6069/02-98030
`


function getManifest() {
    return JSON.stringify({
        "id": "testvideo3",          
        "name": "Test EMBED TO Exoplayer",
        "description": "Nguồn xem phim Online ổn định",
        "version": "1.5.2",             
        "baseUrl": "https://google.com",
        "iconUrl": "https://crimescenesolutions.co.za/wp-content/uploads/2026/04/phimhayok-io-fav.jpg", 
        "isEnabled": true,
        "debug":true,
        "type": "MOVIE",
        "adblock": false,
        "playerType": "embedtoexoplay"
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
const urls = LISTURL.trim()
  .split('\n')
  .map(url => url.trim())
  .filter(Boolean);

// 2. Lấy URL đầu tiên làm URL chính
const baseUrl = urls[0];

// 3. Lấy các URL từ vị trí thứ 2 trở đi, encode mã hóa và ghép thành param query
const queryParams = urls
  .slice(1)
  .map(url => `fetchUrl=${encodeURIComponent(url)}`)
  .join('&');

// 4. Kết hợp lại thành URL hoàn chỉnh
const finalUrl = `${baseUrl}?${queryParams}`;
var items = [];
        items.push({
            "id": finalUrl,          
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
  //console.log("parseDetailResponse [Raw]: " + html);
  try {
    var rawJS = checkRaw(runjS(), true);
    var result = getNextFetchStep(url);

    console.log("parseDetailResponse [Next URL]: " + result.nextUrl);
    console.log("parseDetailResponse [isEmbed]: " + result.isEmbed);
    if(result.isEmbed == true){
      console.log("Gọi hàm embed với link: " + result.nextUrl);
      return JSON.stringify({
        "url": result.nextUrl,
        "isEmbed": result.isEmbed,
        "headers": {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": getCleanReferer(url)
        }
      });
    }
    
    return JSON.stringify({
      "url": result.nextUrl,
      "isEmbed": result.isEmbed,
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": getCleanReferer(url),
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
  //console.log("parseEmbedResponse [Raw]: " + html);
  try {
    var rawJS = checkRaw(runjS(), true);
    var result = getNextFetchStep(url);

    console.log("parseEmbedResponse [Next URL]: " + result.nextUrl);
    console.log("parseEmbedResponse [isEmbed]: " + result.isEmbed);

    return JSON.stringify({
      "url": result.nextUrl,
      "isEmbed": result.isEmbed, // Tự động trả về false khi đã bóc tới tầng cuối!
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": getCleanReferer(url),
        "Block-Ads": false,
        "Block-Css": "html,body,*",
        "Custom-Js": rawJS
      }
    });
  } catch (e) {
    console.log("[Lỗi parseEmbedResponse]", e);
    return JSON.stringify({ "url": "", "isEmbed": false, "headers": {} });
  }
}
 /**
     * =====================================================================================================
     * 📖 HƯỚNG DẪN CẤU HÌNH HỆ THỐNG SNIFFER (GLOBAL CONFIGURATION GUIDE)
     * =====================================================================================================
     * 
     * 🟢 NÚT BẬT/TẮT CHÍNH (0 = TẮT, 1 = BẬT):
     * -----------------------------------------------------------------------------------------------------
     * - USE_GAS_PROXY       : [0|1] 1 = Bật bắt Blob M3U8 & gửi lên Google Apps Script; 0 = Tắt hẳn luồng GAS.
     * - LOGGER              : [0|1] 1 = Xuất log chi tiết ra Console/Toast; 0 = Tắt log.
     * - PROXY_ENABLED       : [0|1] 1 = Chạy URL qua Cloudflare Worker Proxy; 0 = Chạy link gốc.
     * - HTMLRAW             : [0|1] 1 = Xuất DOM HTML thô sau 10 giây để debug; 0 = Tắt.
     * - USE_CUSTOM_DECODER  : [0|1] 1 = Sử dụng hàm giải mã DOM custom (setVideo); 0 = Tắt.
     * - ENABLE_KEYWORD_FILTER: [0|1] 1 = Bắt buộc URL phải chứa từ khóa trong TARGET_KEYWORDS; 0 = Tắt.
     * - ENABLE_EXCLUDE_FILTER: [0|1] 1 = Loại trừ URL chứa từ khóa trong EXCLUDE_KEYWORDS; 0 = Tắt.
     * - ENABLE_FILTER         : [0|1] 1 = Bật lọc domain quảng cáo từ BLOCKED_DOMAINS; 0 = Tắt.
     * 
     * ⚙️ CHẾ ĐỘ & ĐƯỜNG DẪN:
     * -----------------------------------------------------------------------------------------------------
     * - PLAYER_MODE        : "ART" = Render trình phát ArtPlayer HTML5; "EXO" = Bắn Intent ra App ngoài.
     * - GAS_WEB_APP_URL    : URL endpoint của Google Apps Script (Chỉ chạy khi USE_GAS_PROXY = 1).
     * - SET_VIDEO_WAIT_MS  : Thời gian chờ setVideo trước khi fallback (mặc định 2000ms).
     * - SNIFFER_TIMEOUT_MS : Thời gian tối đa quét media (mặc định 20000ms = 20s).
     * =====================================================================================================
     */
// https://script.google.com/macros/s/AKfycbxo8zZaqIcehS3s1P-NGGJrrUp0kVzzbzybuFptH1DZqNI5oc8tqZ1r1ZA4aDdWe4L-/exec

function runjS() {

    // =========================================================================
    // 1. CONFIG JS & TRACER LOGS
    // =========================================================================
    function configJS() {
        return `
    var USE_GAS_PROXY = 1;          
    var LOGGER = 1;                 
    var PROXY_ENABLED = 0;          
    var HTMLRAW = 0;                
    var USE_CUSTOM_DECODER = 0;     
    var ENABLE_KEYWORD_FILTER = 0;  
    var ENABLE_EXCLUDE_FILTER = 1;  
    var ENABLE_FILTER = 0;          

    // ⚙️ CHUYỂN SANG CHẾ ĐỘ "ART" PLAYER
    var PLAYER_MODE = "EXO";        // "ART" | "EXO" | "HTML5"
    var GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxo8zZaqIcehS3s1P-NGGJrrUp0kVzzbzybuFptH1DZqNI5oc8tqZ1r1ZA4aDdWe4L-/exec";
    
    var processedUrls = {};
    var loggedDropReasons = {}; 
    var hasDispatchedAny = 0;       
    var STARTRUN = 0;
    var setVideoSuccess = 0;
    var setVideoTimer = null;
    var SET_VIDEO_WAIT_MS = 2000; 
    var SNIFFER_TIMEOUT_MS = 20000;
    var executionRetries = 0;
    var maxExecutionRetries = 10;
    var videoObserver = null;

    var KEYWORD_MATCH_MODE = "ALL";   
    var TARGET_KEYWORDS = ["www.1porn.tv", "get_file", "mp4"];

    var EXCLUDE_MATCH_MODE = "SOME"; 
    var EXCLUDE_KEYWORDS = ["/config?", "/style", "/title", "/script", "/head", "vast.flimora", "ads", "preview", "trailer", ".png", ".jpg", ".css"];

    var BLOCKED_DOMAINS = ["ads.example.com", "*.adnetwork.com", "streamLib.js"];

    var junkLinksQueue = [];
    var snifferQueue = [];

    var WORKER_POOL = [
      "https://soft-surf-c11d.alokillgtv.workers.dev",
      "https://soft-water-25b0.alokillgtv02.workers.dev"
    ];
    var CUSTOM_REFERER = window.location.href;
    var activeWorkerIndex = Math.floor(Math.random() * WORKER_POOL.length);

    var STREAM_URL_REGEX = /(?:\\.m3u8|\\.mp4|\\.ts|googlevideo\\.com|googleusercontent\\.com|bp\\.blogspot\\.com|\\/hls\\/|playlist|token=|expires=|sig=|signature=|=m18|=m22|=m37)/i;

    if (window.SnifferBridge && typeof window.SnifferBridge.toast === 'function') {
      SnifferBridge.toast("🎯 Đang xử lý dữ liệu. Chờ chút nhé...", 3000);
    }

    function saveJunkLink(url, category, reason) {
      if (!url || typeof url !== 'string' || url.trim() === "") return;
      junkLinksQueue.push({
        url: url,
        category: category,
        reason: reason,
        time: new Date().toLocaleTimeString()
      });
    }

    function checkKeywordMatch(url) {
      if (!url || typeof url !== 'string' || url.trim() === "") return { pass: 0, reason: "URL rỗng" };
      var lowerUrl = String(url).toLowerCase();

      if (ENABLE_EXCLUDE_FILTER === 1 && EXCLUDE_KEYWORDS && EXCLUDE_KEYWORDS.length > 0) {
        if (EXCLUDE_MATCH_MODE === "ALL") {
          var isAllMatch = EXCLUDE_KEYWORDS.every(function(kw) { 
            return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1; 
          });
          if (isAllMatch) return { pass: 0, reason: "Chứa tất cả từ khóa LOẠI TRỪ" };
        } else {
          var isSomeMatch = EXCLUDE_KEYWORDS.some(function(kw) { 
            return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1; 
          });
          if (isSomeMatch) return { pass: 0, reason: "Chứa từ khóa LOẠI TRỪ" };
        }
      }

      if (ENABLE_KEYWORD_FILTER === 1 && TARGET_KEYWORDS && TARGET_KEYWORDS.length > 0) {
        if (KEYWORD_MATCH_MODE === "ALL") {
          var passAll = TARGET_KEYWORDS.every(function(kw) { 
            return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1; 
          });
          if (!passAll) return { pass: 0, reason: "Không chứa đủ từ khóa TARGET_KEYWORDS" };
        } else {
          var passSome = TARGET_KEYWORDS.some(function(kw) { 
            return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1; 
          });
          if (!passSome) return { pass: 0, reason: "Không khớp từ khóa TARGET_KEYWORDS" };
        }
      }

      return { pass: 1 };
    }

    function isValidM3U8(content) {
      if (typeof content !== 'string') return 0;
      var trimmed = content.trim();

      if (trimmed.indexOf('#EXTM3U') !== 0) return 0;
      if (trimmed.indexOf('#EXTINF') === -1 && trimmed.indexOf('#EXT-X-STREAM-INF') === -1) return 0;

      if (trimmed.indexOf('var exports') !== -1 || 
          trimmed.indexOf('function(') !== -1 || 
          trimmed.indexOf('Object.defineProperty') !== -1 ||
          trimmed.indexOf('module.exports') !== -1) {
        return 0;
      }

      return 1;
    }

    function decodeRawUrl(str) {
      if (!str) return '';
      try {
        return String(str)
          .replace(/\\\\u0026/g, '&')
          .replace(/\\\\u003d/g, '=')
          .replace(/\\\\u002f/g, '/')
          .replace(/\\\\/g, '');
      } catch(e) {
        return str;
      }
    }

    function bridgeLog(msg) {
      if (LOGGER !== 1) return;
      try {
        var strMsg = String(msg);
        var formattedContent = strMsg;
        var match = strMsg.match(/^(\\S+\\s*\\[[^\\]]+\\]:?)(.*)$/);
        if (match) {
          formattedContent = match[1].trim() + "\\r\\n\\t" + match[2].trim();
        }
        var logMessage = '[CustomJS] ' + formattedContent;
        if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
          window.SnifferBridge.log(logMessage);
        } else if (typeof console !== 'undefined' && console.log) {
          console.log(logMessage);
        }
      } catch (e) {}
    }

    function logDropOnce(url, reason) {
      if (!url) return;
      var key = reason + '|' + url;
      if (!loggedDropReasons[key]) {
        loggedDropReasons[key] = 1;
        bridgeLog('⛔ [BỎ QUA LÝ DO: ' + reason + ']: -> ' + url);
      }
    }
    `;
    }

    // =========================================================================
    // 2. SETVIDEO JS
    // =========================================================================
    function setVideoJS() {
        return `
  function setVideo(rawUrl, sourceName) {
    try {
      if (USE_CUSTOM_DECODER !== 1) return 0;
      
      var videoElem = document.querySelector("video source") || document.querySelector("video");
      var decodedUrl = videoElem ? videoElem.src : "";

      if (decodedUrl && typeof decodedUrl === 'string' && decodedUrl.trim().length > 10 && (decodedUrl.indexOf('http') === 0 || decodedUrl.indexOf('//') === 0)) {
        if (typeof checkKeywordMatch === 'function') {
          var checkRes = checkKeywordMatch(decodedUrl);
          if (checkRes.pass !== 1) {
            logDropOnce(decodedUrl, checkRes.reason);
            saveJunkLink(decodedUrl, "other", checkRes.reason);
            return 0;
          }
        }
        
        bridgeLog('⏳ [setVideo - ĐANG XỬ LÝ ƯU TIÊN] Nguồn: [' + sourceName + ']');
        setVideoSuccess = 1;
        if (setVideoTimer) clearTimeout(setVideoTimer);

        bridgeLog('🎉 [setVideo - THÀNH CÔNG]: Đã lấy được link -> ' + decodedUrl);
        dispatchToPlayer(decodedUrl, "setVideo");
        return 1;
      }
      return 0;
    } catch (e) {
      bridgeLog('❌ [setVideo - LỖI XỬ LÝ]: ' + e.message);
      return 0;
    }
  }
  `;
    }

    // =========================================================================
    // 3. GET LINK & GAS PROCESSOR JS
    // =========================================================================
    function getLinkJS() {
        return `
    function sendM3U8ToGAS(m3u8Content, sourceInfo) {
      if (USE_GAS_PROXY !== 1) {
        bridgeLog('ℹ️ [GAS-SKIPPED] Luồng Google Apps Script đang TẮT (USE_GAS_PROXY = 0).');
        return;
      }

      if (hasDispatchedAny === 1) return;
      hasDispatchedAny = 1;

      bridgeLog('📤 [GAS-UPLOAD] Đang gửi nội dung M3U8 chuẩn (' + sourceInfo + ') lên GAS...');
      showLoadingScreen("Đang giải mã và tối ưu M3U8...");

      fetch(GAS_WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          content: m3u8Content,
          baseUrl: window.location.href
        })
      })
      .then(function(res) { 
        return res.text();
      })
      .then(function(textData) {
        if (!textData || textData.trim() === "") {
          bridgeLog('❌ [GAS-ERROR] GAS trả về dữ liệu rỗng!');
          hasDispatchedAny = 0;
          return;
        }

        var cleanText = textData.trim();
        var targetPlayUrl = "";

        try {
          var jsonData = JSON.parse(cleanText);
          if (jsonData && jsonData.m3u8_url) {
            targetPlayUrl = jsonData.m3u8_url;
          } else if (jsonData && jsonData.url) {
            targetPlayUrl = jsonData.url;
          }
        } catch (e) {}

        if (!targetPlayUrl) {
          if (cleanText.indexOf('http://') === 0 || cleanText.indexOf('https://') === 0 || cleanText.indexOf('blob:') === 0) {
            targetPlayUrl = cleanText;
          } else if (cleanText.indexOf('#EXTM3U') === 0) {
            var blob = new Blob([cleanText], { type: 'application/x-mpegURL' });
            targetPlayUrl = URL.createObjectURL(blob);
            bridgeLog('📦 [GAS-BLOB]: Đã chuyển nội dung M3U8 từ GAS thành Blob URL');
          }
        }

        if (targetPlayUrl) {
          bridgeLog('🎯 [GAS-SUCCESS] Lấy thành công nguồn phát từ GAS: ' + targetPlayUrl);
          dispatchToPlayer(targetPlayUrl, "GoogleAppsScript (" + sourceInfo + ")");
        } else {
          bridgeLog('❌ [GAS-ERROR] Phản hồi từ GAS không hợp lệ: ' + cleanText.substring(0, 100));
          hasDispatchedAny = 0;
        }
      })
      .catch(function(err) {
        bridgeLog('❌ [GAS-NET-ERR] Lỗi kết nối tới GAS: ' + err.toString());
        hasDispatchedAny = 0;
      });
    }

    function getLinkJS(rawUrl, sourceName) {
      try {
        if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === "" || hasDispatchedAny === 1) return;
        
        var cleanRawUrl = typeof decodeRawUrl === 'function' ? decodeRawUrl(rawUrl) : rawUrl;

        if (cleanRawUrl.indexOf('data:') === 0) {
          logDropOnce(cleanRawUrl, "Link Data URL");
          saveJunkLink(cleanRawUrl, "other", "Link Data URL");
          return;
        }

        if (cleanRawUrl.indexOf('/embed/') !== -1 || cleanRawUrl.indexOf('blogger.com/video.g') !== -1 || cleanRawUrl.indexOf('youtube.googleapis.com/embed') !== -1) {
          logDropOnce(cleanRawUrl, "Trang Embed/Iframe Wrapper");
          saveJunkLink(cleanRawUrl, "embed", "Iframe/Embed Wrapper Page");
          return;
        }

        var absoluteUrl = cleanRawUrl.indexOf('blob:') === 0 ? cleanRawUrl : new URL(cleanRawUrl, document.baseURI || window.location.href).href;

        if (typeof checkKeywordMatch === 'function') {
          var checkRes = checkKeywordMatch(absoluteUrl);
          if (checkRes.pass !== 1) {
            logDropOnce(absoluteUrl, checkRes.reason);
            saveJunkLink(absoluteUrl, "other", checkRes.reason);
            return;
          }
        }

        if (STREAM_URL_REGEX && !STREAM_URL_REGEX.test(absoluteUrl) && !STREAM_URL_REGEX.test(cleanRawUrl)) {
          logDropOnce(absoluteUrl, "Không chứa định dạng Stream Media chuẩn");
          saveJunkLink(absoluteUrl, "other", "Không chứa định dạng Stream Media");
          return;
        }

        if (processedUrls[absoluteUrl]) return;
        processedUrls[absoluteUrl] = 1;

        bridgeLog('🎯 [Sniffer - KHỚP ĐIỀU KIỆN] Nguồn [' + (sourceName || 'Unknown') + ']: ' + absoluteUrl);

        if (absoluteUrl.indexOf('.m3u8') !== -1 || absoluteUrl.indexOf('.mp4') !== -1 || absoluteUrl.indexOf('googlevideo.com') !== -1 || absoluteUrl.indexOf('googleusercontent.com') !== -1 || USE_CUSTOM_DECODER !== 1) {
            dispatchToPlayer(absoluteUrl, "DirectSniffer (" + sourceName + ")");
            return;
        }

        snifferQueue.push({ url: absoluteUrl, source: sourceName });

        if (USE_CUSTOM_DECODER === 1 && typeof setVideo === 'function') {
          var success = setVideo(absoluteUrl, sourceName);
          if (success !== 1 && !setVideoTimer && setVideoSuccess !== 1) {
            setVideoTimer = setTimeout(function() {
              triggerSnifferFallback();
            }, SET_VIDEO_WAIT_MS);
          }
        }
      } catch (e) {
        bridgeLog('❌ [getLinkJS - Lỗi]: ' + e.message);
      }
    }

    function triggerSnifferFallback() {
      if (hasDispatchedAny === 1 || setVideoSuccess === 1) return;
      bridgeLog('🔄 [Sniffer Fallback]: Tiến hành xả hàng đợi Sniffer Queue (' + snifferQueue.length + ' link)...');

      if (snifferQueue.length > 0) {
        var fallbackItem = snifferQueue[0];
        bridgeLog('🚀 [Sniffer Fallback]: Lấy link từ Sniffer gửi Player -> ' + fallbackItem.url);
        dispatchToPlayer(fallbackItem.url, "SnifferFallback (" + fallbackItem.source + ")");
      }
    }
    `;
    }

    // =========================================================================
    // 4. ARTPLAYER WITH DATA BASE64 REDIRECT
    // =========================================================================
    function artPlayer() {
        return `
function renderArtPlayerBase64(playUrl) {
  try {
    bridgeLog('🎨 [ARTPLAYER]: Khởi tạo giao diện ArtPlayer dưới dạng Base64 Data URL...');

    // Mã HTML tĩnh tích hợp ArtPlayer + Hls.js
    var htmlContent = '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">' +
      '<title>ArtPlayer Stream</title>' +
      '<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>' +
      '<script src="https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.js"></script>' +
      '<style>' +
        'html, body { margin:0; padding:0; width:100%; height:100%; background:#000; overflow:hidden; }' +
        '#artplayer { width:100vw; height:100vh; }' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<div id="artplayer"></div>' +
      '<script>' +
        'var playUrl = "' + playUrl + '";' +
        'var art = new Artplayer({' +
          'container: "#artplayer",' +
          'url: playUrl,' +
          'type: playUrl.indexOf(".m3u8") !== -1 || playUrl.indexOf("blob:") === 0 ? "m3u8" : "",' +
          'autoplay: true,' +
          'isLive: false,' +
          'muted: false,' +
          'fullscreen: true,' +
          'fullscreenWeb: true,' +
          'autoSize: true,' +
          'pip: true,' +
          'setting: true,' +
          'customType: {' +
            'm3u8: function(video, url, art) {' +
              'if (Hls.isSupported()) {' +
                'if (art.hls) art.hls.destroy();' +
                'var hls = new Hls();' +
                'hls.loadSource(url);' +
                'hls.attachMedia(video);' +
                'art.hls = hls;' +
                'art.on("destroy", function() { hls.destroy(); });' +
              '} else if (video.canPlayType("application/vnd.apple.mpegurl")) {' +
                'video.src = url;' +
              '}' +
            '}' +
          '}' +
        '});' +
        'art.on("ready", function() { art.play(); });' +
      '</script>' +
    '</body>' +
    '</html>';

    // Mã hóa UTF-8 sang Base64
    var base64Html = btoa(unescape(encodeURIComponent(htmlContent)));
    var dataUrl = "data:text/html;base64," + base64Html;

    bridgeLog('🚀 [ARTPLAYER-REDIRECT]: Đang nạp link Base64 vào window.location...');
    window.location.href = dataUrl;

  } catch (e) { 
    bridgeLog('❌ [renderArtPlayerBase64 - Lỗi]: ' + e.message); 
  }
}
    `;
    }

    // =========================================================================
    // 5. RAW HTML DUMP
    // =========================================================================
    function doneHTML(){
      return `
        function executeDump() {
          if (STARTRUN === 1 || hasDispatchedAny === 1) return; 
          STARTRUN = 1;

          var domHTML = document.getElementsByTagName("html");
          
          if (domHTML && domHTML[0]) {
            if(HTMLRAW === 1){
              bridgeLog(domHTML[0].outerHTML);
            }
          
            var VDeo = document.querySelector("video");
            var VDeo2 = document.querySelector("video source");
            var linkVD = "";
            if(VDeo && VDeo.src){ linkVD = VDeo.src; }
            else if(VDeo2 && VDeo2.src){ linkVD = VDeo2.src; }

            if (linkVD && typeof linkVD === 'string' && linkVD.trim().length > 10 && (linkVD.indexOf('http') === 0 || linkVD.indexOf('//') === 0)) {
              if (typeof checkKeywordMatch === 'function') {
                var checkRes = checkKeywordMatch(linkVD);
                if (checkRes.pass !== 1) {
                  logDropOnce(linkVD, checkRes.reason);
                  saveJunkLink(linkVD, "other", checkRes.reason);
                  return;
                }
              }
              
              setVideoSuccess = 1;
              if (setVideoTimer) clearTimeout(setVideoTimer);

              bridgeLog('🎉 [setVideo - THÀNH CÔNG]: Đã lấy được link -> ' + linkVD);
              dispatchToPlayer(linkVD, "setVideo");
            } else {
              bridgeLog('⚠️ [Raw HTML]: Không tìm thấy link video hợp lệ khi quét HTML.');
            }
          }
        }
      `;
    }

    // =========================================================================
    // 6. MAIN JS
    // =========================================================================
    function mainJS() {
        return `
    function dispatchToPlayer(mediaUrl, dispatchSource) {
      try {
        if (!mediaUrl || typeof mediaUrl !== 'string' || mediaUrl.trim() === "") {
          bridgeLog('⚠️ [DISPATCH REJECTED]: Từ chối phát link rỗng từ [' + dispatchSource + ']');
          return;
        }

        hasDispatchedAny = 1;
        if (videoObserver) videoObserver.disconnect();
        bridgeLog('🛑 [HALT]: Dừng các cơ chế quét vì đã tìm thấy Link.');

        bridgeLog('🎬 [DISPATCH TO PLAYER] [Nguồn: ' + dispatchSource + '] -> ' + mediaUrl);

        if (PLAYER_MODE === "EXO") {
          var playUrl = (PROXY_ENABLED === 1) ? buildProxyUrl(mediaUrl, activeWorkerIndex) : mediaUrl;
          if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') window.SnifferBridge.play(playUrl, CUSTOM_REFERER);
          else window.location.href = playUrl;
        } else {
          dispatchMediaStream(mediaUrl);
        }
      } catch (e) { bridgeLog('❌ [dispatchToPlayer - Lỗi]: ' + e.message); }
    }

    function startVideoObserver() {
      if (hasDispatchedAny === 1) return;
      scanVideoElements();
      if (typeof MutationObserver !== 'undefined' && !videoObserver) {
        videoObserver = new MutationObserver(function(mutations) {
          if (hasDispatchedAny === 1) { if (videoObserver) videoObserver.disconnect(); return; }
          scanVideoElements();
        });
        var targetNode = document.body || document.documentElement;
        if (targetNode) {
          videoObserver.observe(targetNode, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
        }
      }
    }

    function preventRedirects() {
      try {
        window.open = function() { return null; };
        try { window.location.assign = function() {}; } catch(e1) {}
        try { window.location.replace = function() {}; } catch(e2) {}
      } catch(e) {}
    }

    function scheduleRawHtmlDump() {
      if (HTMLRAW !== 1) return;
      ${doneHTML()}
      
      function startTimer() {
        setTimeout(executeDump, 10000);
      }

      if (document.readyState === 'complete') {
        startTimer();
      } else {
        window.addEventListener('load', startTimer);
      }
    }

    function beginJS() {
      try {
        bridgeLog('🚀 [INIT] Khởi chạy Sniffer! Đang nạp Interceptors...');

        showLoadingScreen("Đang quét và bắt luồng video...");

        preventRedirects();
        scheduleRawHtmlDump();

        // 🎯 1. HOOK URL.createObjectURL
        if (typeof URL !== 'undefined' && URL.createObjectURL) {
          var originalCreateObjectURL = URL.createObjectURL;
          URL.createObjectURL = function(blob) {
            var blobUrl = originalCreateObjectURL.apply(this, arguments);
            if (USE_GAS_PROXY === 1 && (blob instanceof Blob || blob instanceof File)) {
              var reader = new FileReader();
              reader.onload = function(e) {
                var content = e.target.result;
                if (isValidM3U8(content) === 1) {
                  bridgeLog('🎯 [FOUND-BLOB]: Bắt đúng M3U8 từ Blob! Đang đọc dữ liệu gửi GAS...');
                  sendM3U8ToGAS(content, "Blob URL: " + blobUrl);
                }
              };
              reader.readAsText(blob);
            }
            return blobUrl;
          };
        }

        // 🎯 2. XHR INTERCEPTOR
        if (typeof XMLHttpRequest !== 'undefined') {
          var originalOpen = XMLHttpRequest.prototype.open;
          var originalSend = XMLHttpRequest.prototype.send;
          XMLHttpRequest.prototype.open = function (method, url) { 
            try { if (url && !url.endsWith('.js') && !url.endsWith('.css')) getLinkJS(url, 'XHR.' + method); } catch (e) {} 
            return originalOpen.apply(this, arguments); 
          };
          XMLHttpRequest.prototype.send = function () {
            this.addEventListener('load', function () {
              try {
                if (USE_GAS_PROXY === 1 && this.responseText && isValidM3U8(this.responseText) === 1) {
                  bridgeLog('🎯 [FOUND-XHR-BODY]: Phát hiện M3U8 chuẩn trong XHR Response! Đang gửi GAS...');
                  sendM3U8ToGAS(this.responseText, "XHR Response");
                }
              } catch (e) {}
            });
            return originalSend.apply(this, arguments);
          };
        }

        // 🎯 3. FETCH INTERCEPTOR
        if (typeof window.fetch === 'function') {
          var originalFetch = window.fetch;
          window.fetch = function (input, init) {
            var url = (typeof input === 'string') ? input : (input && input.url ? input.url : '');
            if (url && !url.endsWith('.js') && !url.endsWith('.css')) getLinkJS(url, 'Fetch');
            return originalFetch.apply(this, arguments).then(function (response) {
              try {
                if (USE_GAS_PROXY === 1) {
                  var cloned = response.clone();
                  cloned.text().then(function (bodyText) {
                    if (isValidM3U8(bodyText) === 1) {
                      bridgeLog('🎯 [FOUND-FETCH-BODY]: Phát hiện M3U8 chuẩn từ Fetch Body! Đang gửi GAS...');
                      sendM3U8ToGAS(bodyText, "Fetch Response");
                    }
                  });
                }
              } catch (e) {}
              return response;
            });
          };
        }

        setTimeout(function() {
          if (hasDispatchedAny !== 1) {
            bridgeLog('🛑 [HALT - TIMEOUT] Hết thời gian ' + (SNIFFER_TIMEOUT_MS/1000) + 's. Dừng luồng quét.');
            onSnifferFailed();
          }
        }, SNIFFER_TIMEOUT_MS);

        startVideoObserver();
        handleMainExecution();

      } catch (e) { bridgeLog('❌ [beginJS - Lỗi]: ' + e.message); }
    }

    function onSnifferFailed() {
      if (hasDispatchedAny === 1) return;
      if (snifferQueue.length > 0) { triggerSnifferFallback(); return; }
      
      hideLoadingScreen();
      bridgeLog('❌ [HALT - THẤT BẠI]: Không thể tìm thấy bất kỳ link media nào hợp lệ!');

      try {
        if (window.SnifferBridge && typeof window.SnifferBridge.toast === 'function') {
          window.SnifferBridge.toast("❌ Không tìm thấy video hợp lệ!", 10000);
        }
      } catch(e) {}
    }

    function buildProxyUrl(targetUrl, workerIdx) { return targetUrl; } 

    function dispatchMediaStream(rawStreamUrl) {
      renderArtPlayerBase64(rawStreamUrl);
    }

    ${artPlayer()}

    function scanVideoElements() {
      if (hasDispatchedAny === 1) return;
      var videos = document.getElementsByTagName('video');
      if (videos.length > 0) {
        for (var i = 0; i < videos.length; i++) {
          if (hasDispatchedAny === 1) break;
          if (videos[i].currentSrc) getLinkJS(videos[i].currentSrc, 'HTMLVideoElement.currentSrc');
          if (videos[i].src) getLinkJS(videos[i].src, 'HTMLVideoElement.src');
        }
      }
    }

    function handleMainExecution() {
      if (hasDispatchedAny === 1) return;
      try {
        executionRetries++;
        scanVideoElements();
        if (hasDispatchedAny === 1) return;

        if (hasDispatchedAny !== 1) {
           if (executionRetries < maxExecutionRetries) setTimeout(handleMainExecution, 1000);
           else bridgeLog('🛑 [HALT - MAX RETRY] Đã quét đủ ' + maxExecutionRetries + ' lần, dừng luồng quét chính.');
        }

      } catch (e) {}
    }
    `;
    }

    // =========================================================================
    // 7. LOADING SCREEN (ĐẢM BẢO HIỂN THỊ TRÊN TẤT CẢ CÁC TRANG)
    // =========================================================================
    function loadingSC() { 
      return `
        (function () { 
          window.showLoadingScreen = function(msg) {
            function attach() {
              var target = document.body || document.documentElement;
              if (!target) {
                setTimeout(attach, 10);
                return;
              }
              var loader = document.getElementById('global-sniffer-loader');
              if (!loader) {
                loader = document.createElement('div');
                loader.id = 'global-sniffer-loader';
                loader.style.cssText = 'position:fixed !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; background:#000 !important; z-index:99999999 !important; display:flex !important; flex-direction:column !important; align-items:center !important; justify-content:center !important; color:#fff !important; font-family:sans-serif !important;';
                loader.innerHTML = '<div style="width:40px; height:40px; border:3px solid rgba(255,255,255,0.2); border-left-color:#38bdf8; border-radius:50%; animation:snfSpin 0.8s linear infinite;"></div>' +
                                   '<div id="global-sniffer-msg" style="margin-top:15px; font-size:14px; color:#38bdf8; font-weight:bold;">' + (msg || 'Đang lấy dữ liệu video...') + '</div>' +
                                   '<style>@keyframes snfSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';
                target.appendChild(loader);
              } else {
                var txt = document.getElementById('global-sniffer-msg');
                if (txt) txt.innerText = msg || 'Đang lấy dữ liệu video...';
                loader.style.display = 'flex';
              }
            }
            attach();
          };

          window.hideLoadingScreen = function(){
            var loader = document.getElementById('global-sniffer-loader');
            if (loader) loader.style.display = 'none';
          }; 
        })();
      `; 
    }

    // =========================================================================
    // KẾT NỐI SCRIPT
    // =========================================================================
    return `
(function initEnhancedVideoSniffer() {
  if (window.__SNIFFER_INITIALIZED__) return;
  window.__SNIFFER_INITIALIZED__ = 1;
  try {
    ${loadingSC()}
    ${configJS()}
    ${setVideoJS()}
    ${getLinkJS()}
    ${mainJS()}
    beginJS();
  } catch (globalErr) {
    if (typeof bridgeLog === 'function') bridgeLog('❌ [GLOBAL-ERR]: ' + globalErr.message);
  }
})();
  `;
}



function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
