// =============================================================================
// VAAPP Plugin - Crophim Pro (Đồng bộ cấu trúc 100% theo chuẩn RophimFake)
// Tên file bắt buộc khi lưu: crophim_plugin.js
// =============================================================================
BaseURL = "https://script.google.com/macros/s/AKfycbydwasfO9sUsP7nSduOON6yKVZUMpSraNRFb58knwl_AKpb6vixCuPe-uptcpaGIiXBEw/exec";
BaseJSON = "";
LISTURL = `
https://xem20.net/xem-phim/sat-thu/vietsub-1/1
https://sv1.rophim.mom/player.php?id=358
`


function getManifest() {
    return JSON.stringify({
        "id": "testvideo3",          
        "name": "Test EMBED TO Exoplayer",
        "description": "Nguồn xem phim Online ổn định",
        "version": "1.5.2",             
        "baseUrl": "https://blank.org",
        "iconUrl": "https://crimescenesolutions.co.za/wp-content/uploads/2026/04/phimhayok-io-fav.jpg", 
        "isEnabled": true,
        "debug":true,
        "type": "MOVIE",
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
    // 1. CONFIG JS & TRACER LOGS
    // =========================================================================
    function configJS() {
        return `
    SnifferBridge.toast("🎯 Đang xử lý dữ liệu. Chờ chút nhé...", 3000);
    
    // ⚙️ GLOBAL CONFIG
    var LOGGER = true; 
    var processedUrls = {};
    var loggedDropReasons = {}; 
    var hasDispatchedAny = false;
    var activeWorkerIndex = 0;
    var PLAYER_MODE = "EXO"; 
    var PROXY_ENABLED = false; 
    var HTMLRAW = 1; 
    var STARTRUN = 0;
    var USE_CUSTOM_DECODER = false; 
    var SET_VIDEO_WAIT_MS = 2000; 
    
    // 🎯 BỘ LỌC TỪ KHÓA BAO GỒM
    var ENABLE_KEYWORD_FILTER = false; 
    var KEYWORD_MATCH_MODE = "ALL";   
    var TARGET_KEYWORDS = ["www.1porn.tv", "get_file", "mp4"];

    // 🎯 BỘ LỌC TỪ KHÓA LOẠI TRỪ TOÀN CỤC
    var ENABLE_EXCLUDE_FILTER = true; 
    var EXCLUDE_MATCH_MODE = "SOME"; 
    var EXCLUDE_KEYWORDS = ["/config?", "/style", "/title", "/script", "/head", "vast.flimora", "ads", "preview", "trailer"];

    // 🎯 TẬP HỢP LƯU LINK RÁC BỊ LOẠI TRỪ
    var junkLinksQueue = [];

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
      if (!url || typeof url !== 'string' || url.trim() === "") return { pass: false, reason: "URL rỗng" };
      var lowerUrl = String(url).toLowerCase();

      if (ENABLE_EXCLUDE_FILTER && EXCLUDE_KEYWORDS && EXCLUDE_KEYWORDS.length > 0) {
        if (EXCLUDE_MATCH_MODE === "ALL") {
          var isAllMatch = EXCLUDE_KEYWORDS.every(function(kw) { 
            return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1; 
          });
          if (isAllMatch) return { pass: false, reason: "Chứa tất cả từ khóa LOẠI TRỪ" };
        } else {
          var isSomeMatch = EXCLUDE_KEYWORDS.some(function(kw) { 
            return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1; 
          });
          if (isSomeMatch) return { pass: false, reason: "Chứa từ khóa LOẠI TRỪ" };
        }
      }

      if (ENABLE_KEYWORD_FILTER && TARGET_KEYWORDS && TARGET_KEYWORDS.length > 0) {
        if (KEYWORD_MATCH_MODE === "ALL") {
          var passAll = TARGET_KEYWORDS.every(function(kw) { 
            return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1; 
          });
          if (!passAll) return { pass: false, reason: "Không chứa đủ từ khóa TARGET_KEYWORDS" };
        } else {
          var passSome = TARGET_KEYWORDS.some(function(kw) { 
            return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1; 
          });
          if (!passSome) return { pass: false, reason: "Không khớp từ khóa TARGET_KEYWORDS" };
        }
      }

      return { pass: true };
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

    var WORKER_POOL = [
      "https://soft-surf-c11d.alokillgtv.workers.dev",
      "https://soft-water-25b0.alokillgtv02.workers.dev"
    ];
    var CUSTOM_REFERER = window.location.href;
    
    var STREAM_URL_REGEX = /(?:\\.m3u8|\\.mp4|\\.ts|googlevideo\\.com|bp\\.blogspot\\.com|\\/hls\\/|playlist|token=|expires=|sig=|signature=)/i;

    var snifferQueue = [];
    var setVideoSuccess = false;
    var setVideoTimer = null;
    var ENABLE_FILTER = false; 
    var BLOCKED_DOMAINS = ["ads.example.com", "*.adnetwork.com","streamLib.js"];

    var SNIFFER_TIMEOUT_MS = 20000;
    var executionRetries = 0;
    var maxExecutionRetries = 10;
    var videoObserver = null;
    activeWorkerIndex = Math.floor(Math.random() * WORKER_POOL.length);

    function bridgeLog(msg) {
      if (!LOGGER) return;
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
        loggedDropReasons[key] = true;
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
      if (!USE_CUSTOM_DECODER) return false;
      
      var videoElem = document.querySelector("video source") || document.querySelector("video");
      var decodedUrl = videoElem ? videoElem.src : "";

      if (decodedUrl && typeof decodedUrl === 'string' && decodedUrl.trim().length > 10 && (decodedUrl.indexOf('http') === 0 || decodedUrl.indexOf('//') === 0)) {
        if (typeof checkKeywordMatch === 'function') {
          var checkRes = checkKeywordMatch(decodedUrl);
          if (!checkRes.pass) {
            logDropOnce(decodedUrl, checkRes.reason);
            saveJunkLink(decodedUrl, "other", checkRes.reason);
            return false;
          }
        }
        
        bridgeLog('⏳ [setVideo - ĐANG XỬ LÝ ƯU TIÊN] Nguồn: [' + sourceName + ']');
        setVideoSuccess = true;
        if (setVideoTimer) clearTimeout(setVideoTimer);

        bridgeLog('🎉 [setVideo - THÀNH CÔNG]: Đã lấy được link -> ' + decodedUrl);
        dispatchToPlayer(decodedUrl, "setVideo");
        return true;
      }
      return false;
    } catch (e) {
      bridgeLog('❌ [setVideo - LỖI XỬ LÝ]: ' + e.message);
      return false;
    }
  }
  `;
    }

    // =========================================================================
    // 3. GET LINK JS
    // =========================================================================
    function getLinkJS() {
        return `
    function getLinkJS(rawUrl, sourceName) {
      try {
        if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === "" || hasDispatchedAny) return;
        
        var cleanRawUrl = typeof decodeRawUrl === 'function' ? decodeRawUrl(rawUrl) : rawUrl;

        if (cleanRawUrl.indexOf('blob:') === 0 || cleanRawUrl.indexOf('data:') === 0) {
          logDropOnce(cleanRawUrl, "Link Blob/Data");
          saveJunkLink(cleanRawUrl, "other", "Link Blob/Data");
          return;
        }

        if (cleanRawUrl.indexOf('/embed/') !== -1 || cleanRawUrl.indexOf('blogger.com/video.g') !== -1 || cleanRawUrl.indexOf('youtube.googleapis.com/embed') !== -1) {
          logDropOnce(cleanRawUrl, "Trang Embed/Iframe Wrapper");
          saveJunkLink(cleanRawUrl, "embed", "Iframe/Embed Wrapper Page");
          return;
        }

        var absoluteUrl = new URL(cleanRawUrl, document.baseURI || window.location.href).href;

        if (typeof checkKeywordMatch === 'function') {
          var checkRes = checkKeywordMatch(absoluteUrl);
          if (!checkRes.pass) {
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
        processedUrls[absoluteUrl] = true;

        if (!isDomainAllowed(absoluteUrl)) {
          logDropOnce(absoluteUrl, "Bị chặn bởi BLOCKED_DOMAINS");
          saveJunkLink(absoluteUrl, "other", "Domain bị chặn");
          return; 
        }

        bridgeLog('🎯 [Sniffer - KHỚP ĐIỀU KIỆN] Nguồn [' + (sourceName || 'Unknown') + ']: ' + absoluteUrl);

        if (absoluteUrl.indexOf('.m3u8') !== -1 || absoluteUrl.indexOf('.mp4') !== -1 || absoluteUrl.indexOf('googlevideo.com') !== -1 || !USE_CUSTOM_DECODER) {
            dispatchToPlayer(absoluteUrl, "DirectSniffer (" + sourceName + ")");
            return;
        }

        snifferQueue.push({ url: absoluteUrl, source: sourceName });

        if (typeof USE_CUSTOM_DECODER !== 'undefined' && USE_CUSTOM_DECODER && typeof setVideo === 'function') {
          var success = setVideo(absoluteUrl, sourceName);
          if (!success && !setVideoTimer && !setVideoSuccess) {
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
      if (hasDispatchedAny || setVideoSuccess) return;
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
    // 4. ART PLAYER BUILDING
    // =========================================================================
    function artPlayer() {
        return `
function renderArtPlayer(playUrl, rawStreamUrl) {
  try {
    bridgeLog('🚀 [renderArtPlayer]: Khởi tạo ArtPlayer...');

    document.documentElement.style.cssText = 'background: #000 !important; background-image: none !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important;';
    document.body.innerHTML = '';
    document.body.style.cssText = 'background: #000 !important; background-image: none !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important;';

    var style = document.createElement('style');
    style.innerHTML = \`
      *:not(#artplayer-container *):not(.art-video) {
        background-image: none !important;
      }
      html, body { width: 100vw !important; height: 100vh !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #0f172a !important; } 
      #artplayer-container { width: 100vw !important; height: 100vh !important; position: fixed !important; top: 0 !important; left: 0 !important; z-index: 999999 !important; outline: none !important; background: #0f172a !important; }
      .art-poster, .art-poster-img { display: none !important; }
      .art-loading { background: #0f172a !important; }
      .art-loading-icon, .art-icon-loading { display: none !important; }
      .custom-art-loading-box { display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .custom-art-spinner { width: 50px; height: 50px; border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: #38bdf8; border-radius: 50%; animation: artSpin 0.8s linear infinite; }
      .custom-art-loading-text { margin-top: 15px; color: #f8fafc; font-size: 14px; font-weight: 500; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      @keyframes artSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
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

    var isM3U8 = lowerRawUrl.indexOf('.m3u8') !== -1 || lowerPlayUrl.indexOf('.m3u8') !== -1 || lowerPlayUrl.indexOf('%2fm3u8') !== -1 || isProxyLink;

    var customSettings = [];
    if (PROXY_ENABLED && WORKER_POOL && WORKER_POOL.length > 0) {
      customSettings.push({
        html: 'Server Proxy',
        tooltip: 'Server ' + (activeWorkerIndex + 1),
        selector: WORKER_POOL.map(function(workerUrl, idx) {
          return { default: idx === activeWorkerIndex, html: 'Server ' + (idx + 1) + (idx === activeWorkerIndex ? ' (Đang chọn)' : ''), url: workerUrl, index: idx };
        }),
        onSelect: function (item) {
          activeWorkerIndex = item.index;
          window.art.switchUrl(buildProxyUrl(rawStreamUrl, activeWorkerIndex));
          return item.html;
        }
      });
    }

    customSettings.push({
      html: 'Tỉ lệ màn hình', tooltip: 'Mặc định',
      selector: [
        { default: true, html: 'Mặc định', value: 'default' },
        { html: '16:9', value: '16:9' },
        { html: '4:3', value: '4:3' },
        { html: 'Phủ kín (Crop)', value: 'cover' }
      ],
      onSelect: function (item) { window.art.aspectRatio = item.value; return item.html; }
    });

    window.art = new Artplayer({
      container: '#artplayer-container',
      url: playUrl, type: isM3U8 ? 'm3u8' : 'mp4', autoplay: true, volume: 0.8, isLive: false, hotkey: true, setting: true, playbackRate: true, aspectRatio: true, fullscreen: true, fullscreenWeb: true, pip: true, autoOrientation: true, airplay: true, screenshot: true, theme: '#38bdf8',
      customHTML: { loading: \`<div class="custom-art-loading-box"><div class="custom-art-spinner"></div><div class="custom-art-loading-text">Đang tải video...</div></div>\` },
      customType: {
        m3u8: function (video, url, art) {
          if (Hls.isSupported()) {
            if (art.hls) art.hls.destroy();
            var hls = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 90, maxBufferLength: 30, maxMaxBufferLength: 600 });
            hls.loadSource(url); hls.attachMedia(video); art.hls = hls;
            art.on('destroy', function () { if (art.hls) art.hls.destroy(); });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
          }
        }
      }
    });

    window.art.on('ready', function() {
      bridgeLog('🎉 [ArtPlayer]: Sẵn sàng!');
      setTimeout(function() { container.focus(); if (window.art && window.art.template && window.art.template.$player) window.art.template.$player.focus(); }, 300);
      window.art.play().catch(function() { window.art.muted = true; window.art.play(); });
    });

  } catch (e) { bridgeLog('❌ [renderArtPlayer - Lỗi]: ' + e.message); }
} 
    `;
    }
  
    // =========================================================================
    // 5. HÀM CHẠY SAU KHÍ WEB TẢI XONG
    // =========================================================================
    function doneHTML(){
      return `
        function executeDump() {
          if (STARTRUN === 1 || hasDispatchedAny) return; 
          STARTRUN = 1;

          var domHTML = document.getElementsByTagName("html");
          
          if (domHTML && domHTML[0]) {
            if(HTMLRAW == 1){
              bridgeLog(domHTML[0].outerHTML);
            }
          
            var VDeo = document.querySelector(".art-video");
            var VDeo2 = document.querySelector(".art-video source");
            var linkVD = "";
            if(VDeo && VDeo.src){ linkVD = VDeo.src; }
            else if(VDeo2 && VDeo2.src){ linkVD = VDeo2.src; }

            if (linkVD && typeof linkVD === 'string' && linkVD.trim().length > 10 && (linkVD.indexOf('http') === 0 || linkVD.indexOf('//') === 0)) {
              if (typeof checkKeywordMatch === 'function') {
                var checkRes = checkKeywordMatch(linkVD);
                if (!checkRes.pass) {
                  logDropOnce(linkVD, checkRes.reason);
                  saveJunkLink(linkVD, "other", checkRes.reason);
                  return;
                }
              }
              
              setVideoSuccess = true;
              if (setVideoTimer) clearTimeout(setVideoTimer);

              bridgeLog('🎉 [setVideo - THÀNH CÔNG]: Đã lấy được link -> ' + linkVD);
              dispatchToPlayer(linkVD, "setVideo");
            } else {
              bridgeLog('⚠️ [Raw HTML]: Không tìm thấy link video hợp lệ khi quét HTML.');
            }
          }
        }
      `
    }
  
    // =========================================================================
    // 6. MAIN JS (TÍCH HỢP TOAST THÔNG BÁO LỖI 10 GIÂY)
    // =========================================================================
    function mainJS() {
        return `
    function dispatchToPlayer(mediaUrl, dispatchSource) {
      try {
        if (!mediaUrl || typeof mediaUrl !== 'string' || mediaUrl.trim() === "") {
          bridgeLog('⚠️ [DISPATCH REJECTED]: Từ chối phát link rỗng từ [' + dispatchSource + ']');
          return;
        }

        hasDispatchedAny = true;
        if (videoObserver) videoObserver.disconnect();
        bridgeLog('🛑 [HALT]: Dừng các cơ chế quét vì đã tìm thấy Link.');

        bridgeLog('🎬 [DISPATCH TO PLAYER] [Nguồn: ' + dispatchSource + '] -> ' + mediaUrl);

        if (PLAYER_MODE === "EXO") {
          var playUrl = PROXY_ENABLED ? buildProxyUrl(mediaUrl, activeWorkerIndex) : mediaUrl;
          if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') window.SnifferBridge.play(playUrl, CUSTOM_REFERER);
          else window.location.href = "intent://" + playUrl.replace(/^https?:\\/\\/ freedom/, '') + "#Intent;scheme=https;type=video/*;end";
        } else {
          dispatchMediaStream(mediaUrl);
        }
      } catch (e) { bridgeLog('❌ [dispatchToPlayer - Lỗi]: ' + e.message); }
    }

    function startVideoObserver() {
      if (hasDispatchedAny) return;
      scanVideoElements();
      if (typeof MutationObserver !== 'undefined' && !videoObserver) {
        videoObserver = new MutationObserver(function(mutations) {
          if (hasDispatchedAny) { if (videoObserver) videoObserver.disconnect(); return; }
          scanVideoElements();
        });
        var targetNode = document.body || document.documentElement;
        if (targetNode) {
          videoObserver.observe(targetNode, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
          bridgeLog('👀 [INIT - DOM Observer]: Đã bật lắng nghe thay đổi thẻ <video>');
        }
      }
    }

    function preventRedirects() {
      try {
        bridgeLog('🛡️ [SECURITY]: Đang bật cơ chế chống chuyển trang & chặn Popup...');

        window.open = function(url, target, features) {
          bridgeLog('🛡️ [CHẶN POPUP]: Đã chặn mở tab mới -> ' + (url || 'about:blank'));
          return null;
        };

        try { window.location.assign = function(url) { bridgeLog('🛡️ [CHẶN REDIRECT]: Đã chặn location.assign -> ' + url); }; } catch(e1) {}
        try { window.location.replace = function(url) { bridgeLog('🛡️ [CHẶN REDIRECT]: Đã chặn location.replace -> ' + url); }; } catch(e2) {}

        window.addEventListener('click', function(e) {
          var target = e.target ? e.target.closest('a') : null;
          if (target && target.href) {
            if (target.target === '_blank' || (target.hostname && target.hostname !== window.location.hostname)) {
              e.preventDefault();
              e.stopPropagation();
              bridgeLog('🛡️ [CHẶN CLICKJACKING]: Đã chặn click chuyển trang -> ' + target.href);
            }
          }
        }, true);

      } catch(e) { bridgeLog('❌ [preventRedirects - Lỗi]: ' + e.message); }
    }

    function scheduleRawHtmlDump() {
      if (typeof HTMLRAW === 'undefined' || HTMLRAW !== 1) return;
      ${doneHTML()}
      
      function startTimer() {
        bridgeLog("⏳ [Raw HTML]: Web đã tải xong. Đang chờ 10 giây để script trang chạy hoàn tất...");
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

        preventRedirects();
        scheduleRawHtmlDump();

        // 🎯 XHR INTERCEPTOR
        if (typeof XMLHttpRequest !== 'undefined') {
          var originalOpen = XMLHttpRequest.prototype.open;
          var originalSend = XMLHttpRequest.prototype.send;
          XMLHttpRequest.prototype.open = function (method, url) { try { if (url) getLinkJS(url, 'XHR.' + method); } catch (e) {} return originalOpen.apply(this, arguments); };
          XMLHttpRequest.prototype.send = function () {
            this.addEventListener('load', function () {
              try {
                if (this.responseText) {
                  var match = this.responseText.match(/(?:https?:\\/\\/[^\\s"'<>]+|\\/[^\\s"'<>]+)(?:m3u8|mp4|googlevideo\\.com)[^\\s"'>]*/i);
                  if (match && match[0]) getLinkJS(match[0], 'XHR-ResponseBody');
                }
              } catch (e) {}
            });
            return originalSend.apply(this, arguments);
          };
          bridgeLog('✅ [INIT]: Nạp thành công XHR Interceptor');
        }

        // 🎯 FETCH INTERCEPTOR
        if (typeof window.fetch === 'function') {
          var originalFetch = window.fetch;
          window.fetch = function (input, init) {
            var url = (typeof input === 'string') ? input : (input && input.url ? input.url : '');
            if (url) getLinkJS(url, 'Fetch');
            return originalFetch.apply(this, arguments).then(function (response) {
              try {
                var cloned = response.clone();
                cloned.text().then(function (bodyText) {
                  var match = bodyText.match(/(?:https?:\\/\\/[^\\s"'<>]+|\\/[^\\s"'<>]+)(?:m3u8|mp4|googlevideo\\.com)[^\\s"'>]*/i);
                  if (match && match[0]) getLinkJS(match[0], 'Fetch-ResponseBody');
                });
              } catch (e) {}
              return response;
            });
          };
          bridgeLog('✅ [INIT]: Nạp thành công Fetch Interceptor');
        }

        setTimeout(function() {
          if (!hasDispatchedAny) {
            bridgeLog('🛑 [HALT - TIMEOUT] Hết thời gian ' + (SNIFFER_TIMEOUT_MS/1000) + 's. Dừng luồng quét.');
            onSnifferFailed();
          }
        }, SNIFFER_TIMEOUT_MS);

        startVideoObserver();
        handleMainExecution();

      } catch (e) { bridgeLog('❌ [beginJS - Lỗi]: ' + e.message); }
    }

    // 🎯 HÀM BÁO THẤT BẠI: BẬT TOAST 10 GIÂY & IN LOG LINK RÁC
    function onSnifferFailed() {
      if (hasDispatchedAny) return;
      if (snifferQueue.length > 0) { triggerSnifferFallback(); return; }
      
      bridgeLog('❌ [HALT - THẤT BẠI]: Không thể tìm thấy bất kỳ link media nào hợp lệ!');

      // 🔔 BẬT THÔNG BÁO TOAST HIỂN THỊ TRONG 10 GIÂY (10000ms)
      try {
        if (window.SnifferBridge && typeof window.SnifferBridge.toast === 'function') {
          window.SnifferBridge.toast("❌ Không tìm thấy video hợp lệ!", 10000);
        }
      } catch(e) {}

      bridgeLog('==================== [DANH SÁCH LINK RÁC / EMBED BỊ BỎ QUA] ====================');
      
      if (!junkLinksQueue || junkLinksQueue.length === 0) {
        bridgeLog('Không ghi nhận link rác nào trong quá trình quét.');
      } else {
        var embeds = junkLinksQueue.filter(function(item) { return item.category === 'embed'; });
        var others = junkLinksQueue.filter(function(item) { return item.category === 'other'; });

        bridgeLog('📌 1. DANH SÁCH LINK EMBED / IFRAME (' + embeds.length + ' link):');
        embeds.forEach(function(item, idx) {
          bridgeLog('   [' + (idx + 1) + '] [' + item.time + '] ' + item.url + ' | Lý do: ' + item.reason);
        });

        bridgeLog('📌 2. DANH SÁCH LINK BỊ LỌC / KHÔNG HỢP LỆ (' + others.length + ' link):');
        others.forEach(function(item, idx) {
          bridgeLog('   [' + (idx + 1) + '] [' + item.time + '] ' + item.url + ' | Lý do: ' + item.reason);
        });
      }

      bridgeLog('===============================================================================');
      
      if (typeof window.hideLoadingScreen === 'function') window.hideLoadingScreen();
    }

    function isDomainAllowed(url) { return true; } 
    function buildProxyUrl(targetUrl, workerIdx) { return targetUrl; } 

    function dispatchMediaStream(rawStreamUrl) {
      loadAndRenderArtPlayer(PROXY_ENABLED ? buildProxyUrl(rawStreamUrl, activeWorkerIndex) : rawStreamUrl, rawStreamUrl);
    }

    function loadAndRenderArtPlayer(initialPlayUrl, rawStreamUrl) {
      try {
        bridgeLog('📦 [CDN-LOAD]: Đang tải song song CSS & Script của ArtPlayer...');
        
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
        } else { checkLoaded(); }

        if (typeof Artplayer === 'undefined') {
          var scriptArt = document.createElement('script');
          scriptArt.src = 'https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.js';
          scriptArt.onload = checkLoaded;
          document.head.appendChild(scriptArt);
        } else { checkLoaded(); }
      } catch (e) {}
    }

    ${artPlayer()}

    function scanVideoElements() {
      if (hasDispatchedAny) return;
      var videos = document.getElementsByTagName('video');
      if (videos.length > 0) {
        for (var i = 0; i < videos.length; i++) {
          if (hasDispatchedAny) break;
          if (videos[i].currentSrc) getLinkJS(videos[i].currentSrc, 'HTMLVideoElement.currentSrc');
          if (videos[i].src) getLinkJS(videos[i].src, 'HTMLVideoElement.src');
        }
      }
    }

    function handleMainExecution() {
      if (hasDispatchedAny) return;
      try {
        executionRetries++;
        bridgeLog('👉 [SCAN-LOOP] Chuỗi quét lần ' + executionRetries + '/' + maxExecutionRetries);
        
        try {
          if (window.videoData && window.videoData.sources) {
            for (var k = 0; k < window.videoData.sources.length; k++) {
              if (window.videoData.sources[k].file) { 
                getLinkJS(window.videoData.sources[k].file, 'window.videoData'); 
                if (hasDispatchedAny) return; 
              }
            }
          }
        } catch(e) {}

        scanVideoElements();
        if (hasDispatchedAny) return;

        if (!hasDispatchedAny) {
           if (executionRetries < maxExecutionRetries) setTimeout(handleMainExecution, 1000);
           else bridgeLog('🛑 [HALT - MAX RETRY] Đã quét đủ ' + maxExecutionRetries + ' lần, dừng luồng quét chính.');
        }

      } catch (e) {}
    }
    `;
    }

    // =========================================================================
    // 7. LOADING SCREEN JS
    // =========================================================================
    function loadingSC() { return `(function () { window.hideLoadingScreen = function(){}; })();`; }

    // =========================================================================
    // KẾT NỐI TOÀN BỘ SCRIPT
    // =========================================================================
    return `
(function initEnhancedVideoSniffer() {
  if (window.__SNIFFER_INITIALIZED__) return;
  window.__SNIFFER_INITIALIZED__ = true;
  try {
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
