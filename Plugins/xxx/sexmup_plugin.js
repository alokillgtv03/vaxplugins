// =============================================================================
// VAAPP Plugin - SEX MUP (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================
BASEURL = "https://sexmupxinh.net";
DEV = "true";
function getManifest() {
    return JSON.stringify({
        "id": "sexmup",          
        "name": "sexmup",
        "description": "XXX Hay",
        "version": "1.6.1",      
      	"info": "Nguồn sex Việt. Nguồn này hay bị chặn bởi nhà mạng. Nếu không xem được hãy thử cài APP 1.1.1.1 hoặc dùng DNS và DPI có sẵn trên app để xem tiếp.",
        "baseUrl": "https://sexmupxinh.net",
        "iconUrl": "https://sexmupxinh.net/favicon.ico", 
        "isEnabled": true,
        "isAdult": true,
        "layoutType": "HORIZONTAL",
        "type": "VIDEO",
        "playerType": "embedtoexoplay"
    });
}
/*
{ "slug": "phim-sex-hiep-dam", "title": "Hiếp Dâm", "type": "Horizontal" },
        { "slug": "phim-sex-loan-luan", "title": "Loạn Luân", "type": "Horizontal" },
        { "slug": "phim-sex-vung-trom", "title": "Vụng Trộm", "type": "Horizontal" }, // ĐÃ SỬA: Thêm dấu phẩy hợp lệ ở đây
        { "slug": "phim-sex-chau-au", "title": "Châu Âu", "type": "Horizontal" },
        { "slug": "phim-sex-trung-quoc", "title": "Trung Quốc", "type": "Horizontal" }
    ]);
*/
function log(msg) {
  if (DEV && typeof console !== "undefined" && console.log) {
    console.log(
      "[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg,
    );
  }
}


function getHomeSections() {
    return JSON.stringify([
        { "slug": "/phim-sex-loan-luan/", "title": "Loạn Luân", "type": "HORIZONTAL" },
        { "slug": "/phim-sex-hiep-dam/", "title": "Hiếp Dâm", "type": "HORIZONTAL" },
        { "slug": "/phim-sex-chau-au/", "title": "Châu Âu", "type": "HORIZONTAL" },
        { "slug": "/phim-sex-trung-quoc/", "title": "Trung Quốc", "type": "HORIZONTAL" },
        { "slug": "/", "title": "Clip Mới", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Hiếp Dâm", "slug": "/phim-sex-hiep-dam/"},
        { "name": "Loạn Luân", "slug": "/phim-sex-loan-luan/"},
        { "slug": "/phim-sex-vung-trom/", "name": "Vụng Trộm"},
        { "slug": "/phim-sex-chau-au/", "name": "Châu Âu"},
        { "slug": "/phim-sex-trung-quoc/", "name": "Trung Quốc"},
        { "slug": "search/?do=search&qh=L%E1%BB%97+Nh%E1%BB%8B", "name": "Lỗ Nhị"},
        { "slug": "search/?do=search&qh=Da+%C4%91en", "name": "Da Đen"}
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
// URL GENERATION
// =============================================================================
function getUrlList(slug, filtersJson) {
  try {
    if (slug && slug.indexOf("http") > -1) {
      log("getUrlList[url]: \n" + slug);
      return slug;
    }

    var page = 1;
    var path = slug || "";

    if (filtersJson) {
      var fixedJson2 = filtersJson
        .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/:,/g, ":");
      try {
        var filters = JSON.parse(fixedJson2);
        page = parseInt(filters.page) || 1;
        if (filters.category) {
          if (Array.isArray(filters.category) && filters.category.length > 0) {
            path = filters.category[0].slug;
          } else if (typeof filters.category === "string") {
            path = filters.category;
          }
        }
      } catch (jsonErr) {}
    }

    var resultUrl = BASEURL;
    if (path) {
      resultUrl += path;
    }
    if (page > 1) {
      resultUrl += "page/" + page + "/";
    }

    var finalUrl = resultUrl;
    log("getUrlList[url]: \n" + finalUrl);
    return finalUrl;
  } catch (e) {
    log("getUrlList[err]:\n " + e);
    if (slug && slug.indexOf("http") > -1) {
      return slug;
    }
    var fallback = BASEURL + (slug ? "/" + slug : "");
    return fallback;
  }
}

function getUrlSearch(keyword, filtersJson) {
  try {
    var resultUrl = "";
    if (filtersJson) {
      var fixedJson = filtersJson
        .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/:,/g, ":");
      try {
        var filters = JSON.parse(fixedJson);
        var page = parseInt(filters.page) || 1;
        if (page > 1) {
          resultUrl =
            BASEURL +
            "/search/?do=search&qh=" +
            encodeURIComponent(keyword) +
            "&page=" +
            page;
        } else {
          resultUrl = BASEURL + "/search/?do=search&qh=" + encodeURIComponent(keyword);
        }
      } catch (jsonErr) {
        resultUrl = BASEURL + "/search/?do=search&qh=" + encodeURIComponent(keyword);
      }
    } else {
      resultUrl = BASEURL + "/search/?do=search&qh=" + encodeURIComponent(keyword);
    }

    log("getUrlSearch[url]: \n" + resultUrl);
    return resultUrl;
  } catch (e) {
    log("getUrlSearch[err]:\n " + e);
  }
}


function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + "/" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        // ĐÃ SỬA: Chỉ bóc cụm nội dung bên trong thẻ <img> để không bị bẫy mất item không có data-src
        var regex = /class="video-list"[\s\S]*?a\s+title="([^"]+)"[\s\S]*?href="([^"]+)"[\s\S]*?<img[^>]*class="video-image[^"]*"([^>]*)/g;
        var match;
        var imageRegex = /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i;
        
        while ((match = regex.exec(html)) !== null) {
            var title = match[1].trim();
            var id = match[2];
            var imgTagContent = match[3];

            // Tìm thuộc tính src và data-src riêng lẻ
            var srcMatch = imgTagContent.match(/src="([^"]+)"/i);
            var dataSrcMatch = imgTagContent.match(/data-src="([^"]+)"/i);

            var lurl1 = srcMatch ? srcMatch[1].replace(/&amp;/g, '&') : "";
            var lurl2 = dataSrcMatch ? dataSrcMatch[1].replace(/&amp;/g, '&') : "";

            // ĐÃ SỬA: Sửa lại chính xác tên biến lurl1 và lurl2
            var limg = (lurl1 && imageRegex.test(lurl1)) ? lurl1 : 
                       (lurl2 && imageRegex.test(lurl2)) ? lurl2 : 
                       "https://sexmupxinh.net/file/cover/ong-chu-dam-duc-lua-em-nu-sinh-vao-cuoc-may-mua-tao-bao.jpg";
           
            items.push({
                "id": id,          
                "title": title, 
                "posterUrl": limg,
                "backdropUrl": limg
            });
        }

        var currentPage = 1;
        var totalPages = 1;

        if (html) {
            var currentMatch = html.match(/class="pagenavi"[\s\S]*?class="active"[\s\S]*?>(\d+)<\/a>/i);
            var maxMatch = html.match(/>(\d+)<\/a><a[^>]*>→<\/a>/i);

            if (currentMatch && currentMatch[1]) {
                currentPage = parseInt(currentMatch[1], 10);
            }
            if (maxMatch && maxMatch[1]) {
                totalPages = parseInt(maxMatch[1], 10);
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { 
                "currentPage": 1, 
                "totalPages": 99999,    
                "totalItems":  24 * totalPages,
                "itemsPerPage": 24
            }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    var lurl = "";
    var limg = "";
    var lname = "Đang cập nhật...";
    var ldes = "Không có mô tả.";

    var rmatch = html.match(/link\srel="canonical"[\s\S]*?href="([\s\S]*?)"/i);
    if (rmatch && rmatch[1]) { lurl = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:image"\s+content="([\s\S]*?)"/i);
    if (rmatch && rmatch[1]) { limg = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:title"\s+content="([\s\S]*?)"/i);
    if (rmatch && rmatch[1]) { lname = rmatch[1]; }

    rmatch = html.match(/<div\s+class="content">([\s\S]*?)<\/div>/i);
    if (rmatch && rmatch[1]) { ldes = rmatch[1]; }
     
    return JSON.stringify({
        id: lurl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: ldes,
        servers: [
            {
                name: "Full",
                episodes: [
                    { id: lurl, name: "Full", slug: "" }
                ]
            }
        ],
        quality: "HD",
        year: 2026, // ĐÃ SỬA: Thay "????" bằng số nguyên để không lỗi ép kiểu
        rating: 8.0,
        status: "Full",
        duration: 0, // ĐÃ SỬA: Thay "????" bằng 0 đề phòng lỗi ép kiểu tương tự
        casts: "Diễn viên",
        director: "Đạo diễn",
        category: "18+"
    });
}

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        var rmatch = html.match(/<div\s+class="video-player mobile"[\s\S]*?iframe\s+src="([\s\S]*?)"/i);
        if (rmatch && rmatch[1]) {
            streamUrl = rmatch[1];
        }	
      	console.log("Đang thực thi: " +  streamUrl)
				var customJs = runjS();
        return JSON.stringify({
            url: streamUrl,
            headers: {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Custom-Js": customJs
            }
        });
    } catch (error) {
        return JSON.stringify({ url: "", headers: {} });
    }
}



function runjS() {
  return `
(function initEnhancedVideoSniffer() {
  try {
    var processedUrls = {};
    var hasDispatchedAny = false;
    var HTMLRAW = true;

    // ==========================================
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
            "Referer": window.location.href,
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
