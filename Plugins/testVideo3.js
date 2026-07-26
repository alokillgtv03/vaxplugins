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
        "baseUrl": BaseURL,
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

function parseListResponse(html) {
    try {
        // Lưu trữ object đầu tiên trực tiếp vào BaseJSON toàn cục để các hàm sau dùng tiện lợi
        var items = [];
        items.push({
            "id": BaseURL,          
            "title": "Test", 
            "posterUrl": "https://img-cdn.phimhayok.net/filmhayok/1782912263995/20260701/ChatGPT-Image-19_29_49-1-thg-7-2026_a20d108246f140ad8be82acb9bca2606.png",  
            "backdropUrl": "https://img-cdn.phimhayok.net/filmhayok/1782912263995/20260701/ChatGPT-Image-19_29_49-1-thg-7-2026_a20d108246f140ad8be82acb9bca2606.png"
        });
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        var id = BaseURL;
        var parsed = JSON.parse(html);
        BaseJSON = Array.isArray(parsed) ? parsed[0] : parsed;
        var videoUrl = BaseJSON.link;
        var $url = BaseJSON.url + "#stream=" + encodeURIComponent(videoUrl)|| "";
      	console.log("parseMovieDetail[URL]: " + $url)
        // Khai báo trước streamUrl chống lỗi Strict Mode khi eval thực thi
        var streamUrl = ""; 
        var title = "Chưa rõ tên phim";
        var year = "2026";
        var des = html;
        var img = "https://img-cdn.phimhayok.net/filmhayok/1782912263995/20260701/ChatGPT-Image-19_29_49-1-thg-7-2026_a20d108246f140ad8be82acb9bca2606.png";
        var episodes = [{ id: $url, name: "Xem Ngay", slug: "full" }]; 
        return JSON.stringify({
            "id": id,
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
      	console.log("parseMovieDetail: " + e)
        return JSON.stringify({ "id": "error", "title": "Lỗi tải dữ liệu", "servers": [] });
    }
}


function parseDetailResponse(html,url) {
    try {
      console.log("parseDetailResponse[URL]: " + url)
        // Đọc trực tiếp từ thuộc tính của BaseJSON đã lưu ở bước đầu tiên
			var match = url.match(/\#stream=([\s\S]*?)$/i);
      var videoUrl = url;
      if(match && match[1]){
        videoUrl = match[1];
      }
      console.log("parseDetailResponse[STREAM]: " + videoUrl) 
			return JSON.stringify({
        "url": videoUrl,
        "isEmbed": false, // PHẢI LÀ true để app chạy WebView ngầm (EmbedSniffer)
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": url,
          	"Block-Ads": "false",
            "Custom-Js": runjS()
        }
    });
      
    } catch (e) {
      	console.log(e);
        return JSON.stringify({ "url": "", "headers": {} });
    }
}





function runjS() {
  return `
(function initEnhancedVideoSniffer() {
  try {
    var processedUrls = {};
    var hasDispatchedAny = false;
    var HTMLRAW = true;
		var REFENRE = "https://play2.cdn-xvideos-xnxx.xyz";
    // =======================	===================
    // CẤU HÌNH REGEXP & THAY THẾ ĐUÔI FILE
    // ==========================================
    var STREAM_URL_REGEX = /https?:\\/\\/[^\\s"'<>]*(?:sanstream\\.xyz|m3u8|mp4|cdn=r2)[^\\s"'<>]*/i;

    // CẤU HÌNH REPLACE ĐUÔI FILE (Ví dụ: Đổi .html thành .m3u8)
    var REPLACE_EXTENSION_ENABLED = true; // true: bật replace, false: giữ nguyên link gốc
    var REPLACE_FROM = ".html";           // Đuôi cũ cần tìm (ví dụ: .html)
    var REPLACE_TO = ".m3u8";             // Đuôi mới thay thế (ví dụ: .m3u8)

    var MIME = "application/x-mpegURL"; 

    var ENABLE_FILTER = false; 
    var ALLOWED_DOMAINS = [
      "sanstream.xyz",
      "*.sanstream.xyz"
    ];

    var BLOCKED_DOMAINS = [
      "ads.example.com",
      "*.adnetwork.com"
    ];

    function bridgeLog(msg) {
      try {
        if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
          window.SnifferBridge.log(String(msg));
        } else if (typeof console !== 'undefined' && console.log) {
          console.log('[SNIFFER LOG]', msg);
        }
      } catch (e) {}
    }

    bridgeLog('🎬 [Sniffer v3.6] Khởi chạy với tính năng Replace Extension...');

    function isDomainAllowed(url) {
      try {
        var parsedUrl = new URL(url);
        var hostname = parsedUrl.hostname.toLowerCase();

        if (BLOCKED_DOMAINS && BLOCKED_DOMAINS.length > 0) {
          for (var i = 0; i < BLOCKED_DOMAINS.length; i++) {
            var blockPattern = BLOCKED_DOMAINS[i].toLowerCase().trim();
            if (blockPattern.indexOf('*') !== -1) {
              var cleanBlockPattern = blockPattern.replace(/\\*/g, '');
              if (hostname.indexOf(cleanBlockPattern) !== -1) return false;
            } else {
              var cleanBlockDomain = blockPattern.replace(/^https?:\\/\\//, '').replace(/\\/.*/, '');
              if (hostname === cleanBlockDomain || hostname.endsWith('.' + cleanBlockDomain)) return false;
            }
          }
        }

        if (!ENABLE_FILTER) return true;
        if (!ALLOWED_DOMAINS || ALLOWED_DOMAINS.length === 0) return true;

        for (var j = 0; j < ALLOWED_DOMAINS.length; j++) {
          var pattern = ALLOWED_DOMAINS[j].toLowerCase().trim();
          if (pattern.indexOf('*') !== -1) {
            var cleanPattern = pattern.replace(/\\*/g, '');
            if (hostname.indexOf(cleanPattern) !== -1) return true;
          } else {
            var cleanDomain = pattern.replace(/^https?:\\/\\//, '').replace(/\\/.*/, '');
            if (hostname === cleanDomain || hostname.endsWith('.' + cleanDomain)) return true;
          }
        }
        return false;
      } catch (e) {
        return true;
      }
    }

    function checkUrlPlayable(url, callback) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('HEAD', url, true);
        xhr.timeout = 3000;

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            var status = xhr.status;
            if ((status >= 200 && status < 300) || status === 206 || status === 0) {
              bridgeLog('🟢 [URL OK - Status ' + status + ']: ' + url);
              callback(true);
            } else {
              bridgeLog('🚫 [URL Chết - Status ' + status + ']: Bỏ qua -> ' + url);
              callback(false);
            }
          }
        };
        xhr.onerror = function () { callback(true); };
        xhr.ontimeout = function () { callback(false); };
        xhr.send();
      } catch (e) {
        callback(true);
      }
    }

    function processCandidateUrl(rawUrl) {
      try {
        if (!rawUrl || typeof rawUrl !== 'string') return;
        if (hasDispatchedAny) return;
        if (rawUrl.indexOf('blob:') === 0) return;

        var absoluteUrl = new URL(rawUrl, document.baseURI || window.location.href).href;

        if (STREAM_URL_REGEX && !STREAM_URL_REGEX.test(absoluteUrl)) {
          return; 
        }

        bridgeLog('🎯 [RegExp Matched!]: ' + absoluteUrl);

        // THỰC HIỆN REPLACE ĐUÔI FILE NẾU ĐƯỢC BẬT
        var finalUrl = absoluteUrl;
        if (REPLACE_EXTENSION_ENABLED) {
          // Xử lý replace an toàn kể cả khi có query params ở đuôi (như ?cdn=r2)
          var queryIndex = absoluteUrl.indexOf('?');
          if (queryIndex !== -1) {
            var baseUrlPart = absoluteUrl.substring(0, queryIndex);
            var queryPart = absoluteUrl.substring(queryIndex);
            if (baseUrlPart.indexOf(REPLACE_FROM) !== -1) {
              baseUrlPart = baseUrlPart.replace(REPLACE_FROM, REPLACE_TO);
              finalUrl = baseUrlPart + queryPart;
              bridgeLog('🔄 [Replaced URL]: ' + finalUrl);
            }
          } else {
            if (absoluteUrl.indexOf(REPLACE_FROM) !== -1) {
              finalUrl = absoluteUrl.replace(REPLACE_FROM, REPLACE_TO);
              bridgeLog('🔄 [Replaced URL]: ' + finalUrl);
            }
          }
        }

        if (!isDomainAllowed(finalUrl)) {
          bridgeLog('🛡️ [Domain Blocked]: ' + finalUrl);
          return;
        }

        if (processedUrls[finalUrl]) return;
        processedUrls[finalUrl] = true;

        bridgeLog('⏳ Đang kiểm tra link...');

        checkUrlPlayable(finalUrl, function(isPlayable) {
          if (hasDispatchedAny) return;
          if (!isPlayable) return;

          hasDispatchedAny = true;
          bridgeLog('📌 [SUCCESS] Gửi link sang Native: ' + finalUrl);

          var headersObj = {
            "Referer": REFENRE || window.location.href,
            "User-Agent": navigator.userAgent,
            "mimeType": MIME
          };
          var headersJson = JSON.stringify(headersObj);

          if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
            try { window.SnifferBridge.play(finalUrl, headersJson); } catch (e1) {}
          }

          if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.m3u8Detected) {
            try { window.webkit.messageHandlers.m3u8Detected.postMessage(finalUrl); } catch (e2) {}
          }
        });

      } catch (errDispatch) {
        bridgeLog('❌ [Error]: ' + errDispatch.message);
      }
    }

    // Interceptor gốc
    (function initEarlyInterceptor() {
      try {
        if (typeof XMLHttpRequest !== 'undefined') {
          var originalOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function (method, url) {
            try { if (url) processCandidateUrl(url); } catch (e) {}
            return originalOpen.apply(this, arguments);
          };
          bridgeLog('🔌 Đã bọc XMLHttpRequest.open');
        }

        if (typeof window.fetch === 'function') {
          var originalFetch = window.fetch;
          window.fetch = function (input, init) {
            try {
              var url = (typeof input === 'string') ? input : (input && input.url ? input.url : '');
              if (url) processCandidateUrl(url);
            } catch (e) {}
            return originalFetch.apply(this, arguments);
          };
          bridgeLog('🔌 Đã bọc window.fetch');
        }
      } catch (e) {}
    })();

    function scanVideoElements() {
      if (hasDispatchedAny) return;
      try {
        var videos = document.getElementsByTagName('video');
        for (var i = 0; i < videos.length; i++) {
          if (hasDispatchedAny) break;
          var v = videos[i];
          if (v.currentSrc) processCandidateUrl(v.currentSrc);
          if (v.src) processCandidateUrl(v.src);
        }
      } catch (e) {}
    }

    function handleMainExecution() {
      try { scanVideoElements(); } catch (errExec) {}
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      handleMainExecution();
    } else {
      window.addEventListener('load', handleMainExecution);
      setTimeout(handleMainExecution, 500);
    }

  } catch (globalErr) {}
})();
  `;
}






function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
