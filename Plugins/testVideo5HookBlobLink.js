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
    var rawJS = checkRaw(runJS(), true);
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
    var rawJS = checkRaw(runJS(), true);
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


function runJS() {
    return `
function bridgeLog(msg, check) {
    try {
      if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
        window.SnifferBridge.log(msg);
        if (check === true && typeof window.SnifferBridge.toast === 'function') {
          window.SnifferBridge.toast(msg, 1000);
        }
      } else if (typeof console !== 'undefined' && console.log) {
        console.log(msg);
      }
    } catch(e) {}
  }
(function injectCSS() {
  try {
    // 1. Khai báo nội dung CSS của bạn ở đây
    const cssStyle = "body,html,*{display:none!important,backgroud:black!important;opacity:0!important;z-index:-999999}";

    // 2. Tạo thẻ <style>
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.setAttribute('data-injected-by', 'custom-script');

    if (styleElement.styleSheet) {
      // Dành cho các trình duyệt IE cũ
      styleElement.styleSheet.cssText = cssStyle;
    } else {
      // Dành cho trình duyệt hiện đại
      styleElement.appendChild(document.createTextNode(cssStyle));
    }

    // 3. Tìm vị trí để chèn (ưu tiên <head>, nếu chưa có head thì lấy documentElement)
    const targetNode = document.head || document.getElementsByTagName('head')[0] || document.documentElement;

    if (targetNode) {
      targetNode.appendChild(styleElement);
      bridgeLog("Chèn css ngay lập tức.")
    } else {
      // Fallback: Nếu DOM chưa sẵn sàng, chờ DOMContentLoaded rồi mới chèn
      document.addEventListener('DOMContentLoaded', function () {
        (document.head || document.documentElement).appendChild(styleElement);
        bridgeLog("Chèn Css sau khi load xong")
      });
    }
  } catch (error) {
    // Bắt toàn bộ lỗi để đảm bảo script chính vẫn tiếp tục chạy bình thường
    bridgeLog('Không thể chèn CSS tự động, bỏ qua lỗi:', error);
  }
})();

(function initLocalBlobSniffer() {
  if (window.__BLOB_SNIFFER_INITIALIZED__) return;
  window.__BLOB_SNIFFER_INITIALIZED__ = 1;

  var hasDispatchedAny = 0;
  var isFinished = 0;
  var timeoutTimer = null;

  

  // =========================================================================
  // 1. GIỚI HẠN THỜI GIAN 10 GIÂY (TIMEOUT)
  // =========================================================================
  bridgeLog("Đang tiến hành tìm link Video, xin chờ....", true);

  timeoutTimer = setTimeout(function() {
    if (hasDispatchedAny === 0 && isFinished === 0) {
      isFinished = 1;
      bridgeLog("❌ [TIMEOUT] Đã quá 10 giây nhưng không tìm thấy Blob M3U8!", false);
      bridgeLog("Không tìm thấy link video (Hết thời gian 10s).", true);
      
      // Fallback khi không tìm thấy
      if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
        window.SnifferBridge.play("https://google.com", "");
      }
    }
  }, 20000); // 10,000 ms = 10 giây

  function stopTimeout() {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  }

  // =========================================================================
  // 2. KIỂM TRA M3U8 HỢP LỆ
  // =========================================================================
  function isValidM3U8(content) {
    if (typeof content !== 'string') return false;
    var trimmed = content.trim();
    return trimmed.indexOf('#EXTM3U') === 0 && 
          (trimmed.indexOf('#EXTINF') !== -1 || trimmed.indexOf('#EXT-X-STREAM-INF') !== -1);
  }

  // =========================================================================
  // 3. CHUYỂN NỘI DUNG M3U8 VỀ APP (LOCAL SERVER)
  // =========================================================================
  function dispatchM3u8ToApp(m3u8Content) {
    if (!m3u8Content || hasDispatchedAny === 1) return;
    hasDispatchedAny = 1;
    isFinished = 1;
    stopTimeout(); // Hủy đếm ngược 10s khi đã lấy thành công

    bridgeLog('🎯 [LOCAL-DISPATCH] Đã tìm thấy M3U8! Đang nạp vào Local Player...');
    bridgeLog("🎯 Bắt link thành công! Đang phát video...", true);

    try {
      if (window.SnifferBridge && typeof window.SnifferBridge.playM3u8Content === 'function') {
        // Truyền trực tiếp nội dung M3U8 thô + URL hiện tại làm Referer/BaseURL
        window.SnifferBridge.playM3u8Content(m3u8Content, window.location.href);
      } else {
        bridgeLog('❌ SnifferBridge.playM3u8Content không khả dụng!');
      }
    } catch(e) {
      bridgeLog('❌ [DISPATCH ERROR]: ' + e.message);
    }
  }

  // =========================================================================
  // 4. HOOK URL.createObjectURL (BẮT TRỰC TIẾP DỮ LIỆU BLOB M3U8)
  // =========================================================================
  try {
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      var originalCreateObjectURL = URL.createObjectURL;
      
      URL.createObjectURL = function(blob) {
        var blobUrl = originalCreateObjectURL.apply(this, arguments);

        if (isFinished === 0 && blob && (blob instanceof Blob || blob instanceof File)) {
          var processContent = function(content) {
            if (isValidM3U8(content)) {
              //bridgeLog('🎯 [FOUND-BLOB]: Phát hiện M3U8 từ Blob RAM!');
              dispatchM3u8ToApp(content);
            }
          };

          if (typeof blob.text === 'function') {
            blob.text().then(processContent).catch(function(){});
          } else {
            var reader = new FileReader();
            reader.onload = function(e) {
              processContent(e.target.result);
            };
            reader.readAsText(blob);
          }
        }

        return blobUrl;
      };
      
      bridgeLog('🚀 [INIT] Đã Hook thành công.');
    }
  } catch (e) {
    bridgeLog('❌ [INIT-ERROR]: ' + e.message);
  }
})();
  `;
}




// js dùng proxy của cloudflare
/*
function runJS() {
    return `
(function initBlobWorkerSniffer() {
  if (window.__BLOB_SNIFFER_INITIALIZED__) return;
  window.__BLOB_SNIFFER_INITIALIZED__ = 1;

  // =========================================================================
  // 1. CẤU HÌNH WORKER POOL & BIẾN TRẠNG THÁI
  // =========================================================================
  var WORKER_POOL = [
    "https://soft-surf-c11d.alokillgtv.workers.dev",
    "https://soft-water-25b0.alokillgtv02.workers.dev",
    "https://raspy-king-7894.alokillgtv03.workers.dev"
  ];

  var activeWorkerIndex = 0;
  var hasDispatchedAny = 0;
  var isFinished = 0; // Đánh dấu đã kết thúc (thành công hoặc hết giờ)
  var CUSTOM_REFERER = window.location.href;
  var timeoutTimer = null;

  function bridgeLog(msg, check) {
    try {
      var logMsg = msg;
      if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
        window.SnifferBridge.log(logMsg);
        if (check === true) {
          window.SnifferBridge.toast(logMsg, 1000);
        }
      } else if (typeof console !== 'undefined' && console.log) {
        console.log(logMsg);
      }
    } catch(e) {}
  }

  // =========================================================================
  // 2. GIỚI HẠN THỜI GIAN 30 GIÂY (TIMEOUT)
  // =========================================================================
  bridgeLog("Đang tiến hành lấy link Video, xin chờ....", true);

  timeoutTimer = setTimeout(function() {
    if (hasDispatchedAny === 0 && isFinished === 0) {
      isFinished = 1;
      bridgeLog("❌ [TIMEOUT] Đã quá 30 giây nhưng không tìm thấy link Blob M3U8!", false);
      bridgeLog("Không tìm thấy link video (Hết thời gian 10s). Hãy thử lại sau!", true);
      window.SnifferBridge.play("https://google.com", "");
    }
  }, 10000); // 30,000 ms = 30 giây

  function stopTimeout() {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  }

  // =========================================================================
  // 3. KIỂM TRA M3U8 HỢP LỆ
  // =========================================================================
  function isValidM3U8(content) {
    if (typeof content !== 'string') return false;
    var trimmed = content.trim();
    if (trimmed.indexOf('#EXTM3U') !== 0) return false;
    if (trimmed.indexOf('#EXTINF') === -1 && trimmed.indexOf('#EXT-X-STREAM-INF') === -1) return false;
    return true;
  }

  // =========================================================================
  // 4. ĐIỀU HƯỚNG PHÁT LUỒNG (DISPATCH)
  // =========================================================================
  function dispatchToPlayer(mediaUrl) {
    if (!mediaUrl || hasDispatchedAny === 1) return;
    hasDispatchedAny = 1;
    isFinished = 1;
    stopTimeout(); // Hủy đếm ngược 30s khi thành công

    bridgeLog('🎬 [DISPATCH TO PLAYER]: ' + mediaUrl);

    try {
      if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
        window.SnifferBridge.play(mediaUrl, CUSTOM_REFERER);
      } else {
        window.location.href = mediaUrl;
      }
    } catch(e) {
      bridgeLog('❌ [DISPATCH ERROR]: ' + e.message);
    }
  }

  // =========================================================================
  // 5. XỬ LÝ WORKER POOL
  // =========================================================================
  function sendM3U8ToGAS(m3u8Content, workerIndexToTry) {
    if (isFinished === 1 && typeof workerIndexToTry === 'undefined') return;

    var currentIdx = (typeof workerIndexToTry === 'number') ? workerIndexToTry : activeWorkerIndex;

    if (currentIdx >= WORKER_POOL.length) {
      bridgeLog('❌ [WORKER-POOL-EXHAUSTED] Tất cả Worker trong Pool đều lỗi!');
      bridgeLog("Không lấy được link video.. Hãy quay lại sau..", true);
      window.SnifferBridge.play("https://google.com", "");
      isFinished = 1;
      stopTimeout();
      return;
    }

    var currentWorkerBase = WORKER_POOL[currentIdx].replace(/\\/+$/, '');
    var uploadEndpoint = currentWorkerBase + "/upload-m3u8";

    bridgeLog('📤 [WORKER-TRY ' + (currentIdx + 1) + '/' + WORKER_POOL.length + '] Gửi M3U8 tới: ' + uploadEndpoint);
    bridgeLog("Đã lấy được Blob, đang giải mã, xin chờ....", true);

    fetch(uploadEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({
        content: m3u8Content,
        baseUrl: window.location.href,
        referer: CUSTOM_REFERER
      })
    })
    .then(function(res) {
      if (!res.ok) throw new Error("HTTP Status " + res.status);
      return res.text();
    })
    .then(function(textData) {
      if (!textData || textData.trim() === "") throw new Error("Worker trả về dữ liệu rỗng!");

      var cleanText = textData.trim();
      var targetPlayUrl = "";

      try {
        var jsonData = JSON.parse(cleanText);
        targetPlayUrl = jsonData.m3u8_url || jsonData.url || "";
      } catch (e) {}

      if (!targetPlayUrl && (cleanText.indexOf('http://') === 0 || cleanText.indexOf('https://') === 0)) {
        targetPlayUrl = cleanText;
      }

      if (targetPlayUrl) {
        bridgeLog('🎯 [WORKER-SUCCESS] Lấy link thành công từ Worker [' + (currentIdx + 1) + ']: ' + targetPlayUrl);
        bridgeLog("🎯 Đã có link video phát được. Chúc vui.", true);
        activeWorkerIndex = currentIdx;
        dispatchToPlayer(targetPlayUrl);
      } else {
        bridgeLog("⚠️ Không chứa link M3U8 hợp lệ từ Worker.", true);
        window.SnifferBridge.play("https://google.com", "");
        throw new Error("Phản hồi không chứa link M3U8 hợp lệ");
      }
    })
    .catch(function(err) {
      if (isFinished === 1) return;
      bridgeLog('⚠️ [WORKER-FAIL] Worker [' + (currentIdx + 1) + '] lỗi: ' + err.message + ' -> Chuyển sang Worker tiếp theo...');
      bridgeLog("⚠️ Lỗi giải mã, đang thử lại với Server dự phòng...", true);
      sendM3U8ToGAS(m3u8Content, currentIdx + 1);
    });
  }

  // =========================================================================
  // 6. HOOK URL.createObjectURL (ĐỌC VÀ LỌC BLOB M3U8)
  // =========================================================================
  try {
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      var originalCreateObjectURL = URL.createObjectURL;
      
      URL.createObjectURL = function(blob) {
        var blobUrl = originalCreateObjectURL.apply(this, arguments);

        if (isFinished === 0 && blob && (blob instanceof Blob || blob instanceof File)) {
          var processContent = function(content) {
            if (isValidM3U8(content)) {
              bridgeLog('🎯 [FOUND-BLOB]: Phát hiện M3U8 chuẩn từ Blob!');
              bridgeLog('🎯 Đã tìm được link video. Tiếp theo sẽ giải mã. xin chờ...', true);
              sendM3U8ToGAS(content, 0);
            }
          };

          if (typeof blob.text === 'function') {
            blob.text().then(processContent).catch(function(){});
          } else {
            var reader = new FileReader();
            reader.onload = function(e) {
              processContent(e.target.result);
            };
            reader.readAsText(blob);
          }
        }

        return blobUrl;
      };
      
      bridgeLog('🚀 [INIT] Đã Hook thành công URL.createObjectURL.');
      bridgeLog('🚀 Đã phát hiện nguồn link video.');
      
    }
  } catch (e) {
    bridgeLog('❌ [INIT-ERROR]: ' + e.message);
  }
})();
  `;
}
*/

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
