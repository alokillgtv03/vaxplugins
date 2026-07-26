
BASEURL = "https://sexdeplon.blog";

// https://sexdep.vip/?page=2
// https://www.xxxfiles.com/favicon-32x32.png
function getManifest() {
    return JSON.stringify({
        "id": "sexdep",
        "name": "sexdep",
        "description": "XXX Hay",
      	"info": "Nguồn sex Việt. Nguồn này hay bị chặn bởi nhà mạng. Nếu không xem được hãy thử cài APP 1.1.1.1 hoặc dùng DNS và DPI có sẵn trên app để xem tiếp.",
        "version": "1.4.6",
        "baseUrl": "https://sexdeplon.blog",
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/cnporn.jpg",
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "embedtoexoplay"
    });
}



// https://sexdeplon.com/?view=hay-nhat&page=2
function getHomeSections() {
    var listurl = "the-loai/viet-nam@@Hàng Mới@@true";
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function getPrimaryCategories() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

// ĐÃ SỬA: Lỗi cú pháp khai báo biến trong JSON.stringify
function getFilterConfig() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify({
        category: menulist
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var page = 1;
        var path = slug || "";

        // Parse JSON an toàn để lấy page và category (nếu chưa có slug)
        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                
                // Nếu không truyền slug, lấy category từ JSON
                if (!slug && filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug;
                    } else if (typeof filters.category === 'string') {
                        path = filters.category;
                    }
                }
            } catch (jsonErr) {}
        }

        // Nếu path/slug đã là URL tuyệt đối (chứa http/https)
        if (path && path.indexOf("http") > -1) {
            var cleanPath = path.replace(/\/+$/, "");
            if (page > 1) {
                return cleanPath + (cleanPath.indexOf("?") > -1 ? "&page=" + page : "/?page=" + page);
            }
            return cleanPath + "/";
        }

        // Tạo URL chuẩn từ BASEURL
        var baseUrlClean = (typeof BASEURL !== 'undefined' ? BASEURL : "").replace(/\/+$/, "");
        var pathClean = path ? path.replace(/^\/+|\/+$/g, "") : "";
        
        var resultUrl = baseUrlClean + (pathClean ? "/" + pathClean : "");

        if (page > 1) {
            resultUrl += (resultUrl.indexOf("?") > -1 ? "&page=" + page : "/?page=" + page);
        } else {
            if (pathClean && pathClean.indexOf("?") !== 0) {
                resultUrl += "/";
            }
        }

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");

    } catch (e) {
        console.log(e);
        if (slug && slug.indexOf("http") > -1) {
            return slug;
        }
        var fallback = (typeof BASEURL !== 'undefined' ? BASEURL : "") + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    
    // Parse filtersJson để lấy trang nếu có
    if (filtersJson) {
        var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
        try {
            var filters = JSON.parse(fixedJson);
            page = parseInt(filters.page) || 1;
        } catch (jsonErr) {}
    }

    var baseUrlClean = (typeof BASEURL !== 'undefined' ? BASEURL : "").replace(/\/+$/, "");
    var searchPath = baseUrlClean + "/search/" + encodeURIComponent(keyword || "");

    // Phân trang chuẩn dạng ?page=N
    if (page > 1) {
        searchPath += "?page=" + page;
    }

    return searchPath.replace(/([^:]\/)\/+/g, "$1");
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + "/" + slug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================



function parseListResponse(html, currentUrl) {
    try {
        var items = [];
        
        // 1. Kiểm tra nếu HTML trống hoặc lỗi
        if (!html || html.indexOf('body') === -1) {
            return JSON.stringify({
                items: [{ id: currentUrl, title: "Lỗi: 1 - " + currentUrl, posterUrl: BASEIMG }],
                pagination: { currentPage: 1, totalPages: 1 }
            });
        }
        
        // 2. Regex linh hoạt hơn cho class (chấp nhận thumb item hoặc item thumb, và các class đi kèm)
        const divRegex = /<div[^>]*class=["'][^"']*item-box[^"']*["'][^>]*>([\s\S]*?)<\/div>/g;
        let match;
        
        while ((match = divRegex.exec(html)) !== null) {
            const content = match[1];
            
            // Nếu trong khối không chứa các từ khóa quan trọng thì bỏ qua
            if (!content.match(/img|href|video|src/i)) {
                continue;
            }
            
            // 3. Lấy href từ thẻ <a> đầu tiên trong khối
            var urlMatch = content.match(/<a[^>]+href=["'](http[^"']+)["']/i);
            var itemUrl = "";
            if (urlMatch && urlMatch[1]) {
                itemUrl = urlMatch[1];
            } else {
                continue; // Không có link thì bỏ qua item này
            }
            
            if (!itemUrl.startsWith("http")) {
                itemUrl = BASEURL + (itemUrl.startsWith("/") ? "" : "/") + itemUrl;
            }
            
            // 4. Lấy Title từ thuộc tính alt của ảnh
            var title = "";
            var rmatch = content.match(/alt=["']([^>]+)["']/i);
            if (rmatch && rmatch[1]) {
                title = rmatch[1];
            }
            
            // 5. Lấy Poster (Ưu tiên data-src rồi mới đến src)
            // <a[^>]+href=["'](http[^"']+)["']
            var posterMatch = content.match(/src=['"](http[^"']+)["']/i);
            var poster = posterMatch ? posterMatch[1] : BASEIMG;
            
            if (poster && !poster.startsWith("http")) {
                poster = BASEURL + (poster.startsWith("/") ? "" : "/") + poster;
            }
            
            items.push({
                id: itemUrl,
                title: title,
                posterUrl: poster
            });
        }
        
        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 999 }
        });
        
    } catch (e) {
        return JSON.stringify({
            items: [{ id: currentUrl, title: "Lỗi: 2 - " + e.message, posterUrl: BASEIMG }],
            pagination: { currentPage: 1, totalPages: 1 }
        });
    }
}

// --- Cách chạy thực tế trên Console trình duyệt ---

/*
BASEURL = "https://sexdeplon.com";
BASEIMG = "https://sexdeplon.com";
var html = document.getElementsByTagName("html")[0].outerHTML;
JSON.parse(parseListResponse(html));
*/


function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html, url) {
    var lurl = "";
    var limg = "";
    var lname = "Đang cập nhật...";
    var ldes = "Không có mô tả.";
    var year = 2026;
    var direc = "????";
    var cast = "????";
    var status = "????";
    var duration = "";
    var servers = [];
    var categories = "";
    
    try {
        var rmatch;
        // Lấy title name /property=["']og:title["']\s+content=["']([^"']+)["']/i
        rmatch = html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i);
        if (rmatch && rmatch[1]) { lname = rmatch[1].trim(); }
        
        // Lấy ảnh /property=["']og:image["']\s+content=["']([^"']+)["']/i
        rmatch = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
        if (rmatch && rmatch[1]) { limg = rmatch[1].trim(); }
        
        // Lấy description /property=["']og:description["']\s+content=["']([^"']+)["']/i
        rmatch = html.match(/property=["']og:description["']\s+content=["']([^"']+)["']/i);
        if (rmatch && rmatch[1]) {var ldes = rmatch[1];}
        
        // Lấy thể loại /(<div[^>]+class=["']categories[\s\S]*?<\/div>)/i
        rmatch = html.match(/(<div[^>]+class=["']categories[\s\S]*?<\/div>)/i);
        if (rmatch && rmatch[1]) {categories = trimHTML(rmatch[1])}          
        // Bốc tách server
        var regex = /data-source=["']([^"']+)/g;
        var matches = [...html.matchAll(regex)];
               var episodes = [];

        matches.forEach((match, index) => {
          var link = match[1];
          var stt = index + 1;
          if(link.indexOf("zabitcdn.name") > -1){
            episodes.push({
               id: link,
               name: "Xem Ngay",
               slug: "Full"
            });
          }

        });

        servers = [{
            name: "Server",
            episodes: episodes
        }];

        
    } catch (e) {
        console.error("Lỗi parse dữ liệu: ", e);
    }
    
    return JSON.stringify({
        id: lurl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: lurl ? ldes + "\r\n\r\n" + lurl : ldes,
        servers: servers,
        quality: "HD",
        year: year,
        status: status,
        duration: duration,
        casts: cast,
        director: direc,
        category: categories
    });
}


//BASEURL = "https://motherless.xxx";
//var html = document.getElementsByTagName("html")[0].outerHTML;
//JSON.parse(parseMovieDetail(html));



function parseDetailResponse(html, url) {
    try {
      	console.log("Đang thực thi: " + url)
        var customjs = runjS();
        return JSON.stringify({
            "url": url,
            "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                // Đánh lừa thuật toán Client Hints của tường lửa
                "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                "Sec-Ch-Ua-Mobile": "?1",
                "Sec-Ch-Ua-Platform": '"Android"',
                
                // Khai báo kiểu dữ liệu được chấp nhận giống như trình duyệt thật
                "Accept": "*/*",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
                "X-Requested-With": "com.android.chrome",
                "Custom-Js": customjs.trim()
            },
            "subtitles": []
        });
        
    } catch (e) {
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

    // ==========================================
    // CẤU HÌNH BỘ LỌC TÊN MIỀN
    // ==========================================
    var ENABLE_FILTER = true; // true: Bật lọc | false: Tắt lọc (lấy mọi link stream hợp lệ)
    var ALLOWED_DOMAINS = [
      "zabitcdn.name",
      "*.zabitcdn.name"
      // Thêm các domain khác tại đây (hỗ trợ tên miền thuần, hoặc có * ở đầu/cuối)
    ];

    function isDomainAllowed(url) {
      // Nếu tắt bộ lọc thì cho qua tất cả
      if (!ENABLE_FILTER) return true;

      try {
        var parsedUrl = new URL(url);
        var hostname = parsedUrl.hostname.toLowerCase();

        if (!ALLOWED_DOMAINS || ALLOWED_DOMAINS.length === 0) {
          return true;
        }

        for (var j = 0; j < ALLOWED_DOMAINS.length; j++) {
          var pattern = ALLOWED_DOMAINS[j].toLowerCase().trim();
          
          // Xử lý dạng có dấu * (ví dụ: *zabitcdn*)
          if (pattern.indexOf('*') !== -1) {
            var cleanPattern = pattern.replace(/\\*/g, '');
            if (hostname.indexOf(cleanPattern) !== -1) {
              return true;
            }
          } 
          // Xử lý dạng tên miền thuần hoặc đủ http
          else {
            var cleanDomain = pattern.replace(/^https?:\\/\\//, '').replace(/\\/.*/, '');
            if (hostname === cleanDomain || hostname.endsWith('.' + cleanDomain)) {
              return true;
            }
          }
        }

        return false; // Không khớp domain nào trong danh sách cho phép
      } catch (e) {
        return true; // Nếu lỗi parse URL thì cho qua
      }
    }

    // ==========================================
    // 1. HELPER: LOGGING BRIDGE
    // ==========================================
    function bridgeLog(msg) {
      try {
        if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
          window.SnifferBridge.log(String(msg));
        } else if (typeof console !== 'undefined' && console.log) {
          console.log('[SNIFFER LOG]', msg);
        }
      } catch (e) {}
    }

    function debounce(fn, delay) {
      var timer = null;
      return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          fn.apply(context, args);
        }, delay);
      };
    }

    bridgeLog('🎬 [Sniffer v3.2] Khởi chạy với Bộ lọc Domain tùy chỉnh.');

    // ==========================================
    // 2. HÀM KIỂM TRA LINK SỐNG / CHẾT
    // ==========================================
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
              bridgeLog('🚫 [URL Chết - Status ' + status + ']: Bỏ qua link -> ' + url);
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

    // ==========================================
    // 3. HÀM TRUYỀN DỮ LIỆU SANG NATIVE
    // ==========================================
    function dispatchToNative(videoUrl) {
      try {
        if (!videoUrl || typeof videoUrl !== 'string') return;
        if (hasDispatchedAny) return;

        if (videoUrl.indexOf('blob:') === 0) return;
        if (videoUrl.indexOf('.ts') !== -1 && videoUrl.indexOf('.m3u8') === -1) return;

        // KIỂM TRA BỘ LỌC TÊN MIỀN
        if (!isDomainAllowed(videoUrl)) {
          bridgeLog('🛡️ [Domain Filter] Bỏ qua link không thuộc danh sách cho phép: ' + videoUrl);
          return;
        }

        if (processedUrls[videoUrl]) return;
        processedUrls[videoUrl] = true;

        bridgeLog('🔍 Đang kiểm tra link candidate: ' + videoUrl);

        checkUrlPlayable(videoUrl, function(isPlayable) {
          if (hasDispatchedAny) return;
          if (!isPlayable) return;

          hasDispatchedAny = true;
          bridgeLog('📌 [SUCCESS] Link SỐNG & Hợp lệ! Gửi sang Native: ' + videoUrl);

          var headersObj = {
            "Referer": window.location.href,
            "User-Agent": navigator.userAgent
          };
          var headersJson = JSON.stringify(headersObj);
          var dispatched = false;

          if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
            try {
              window.SnifferBridge.play(videoUrl, headersJson);
              dispatched = true;
            } catch (e1) {}
          }

          if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.m3u8Detected) {
            try {
              window.webkit.messageHandlers.m3u8Detected.postMessage(videoUrl);
              dispatched = true;
            } catch (e2) {}
          }
        });

      } catch (errDispatch) {}
    }

    // ==========================================
    // INTERCEPTOR & SCANNERS
    // ==========================================
    (function initNetworkInterceptor() {
      try {
        var isMediaUrl = function (url) {
          if (!url || typeof url !== 'string') return false;
          if (url.indexOf('blob:') === 0) return false;
          return (
            url.indexOf('.m3u8') !== -1 ||
            url.indexOf('.mp4') !== -1 ||
            url.indexOf('manifest') !== -1 ||
            url.indexOf('playlist') !== -1
          );
        };

        if (typeof XMLHttpRequest !== 'undefined') {
          var originalOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function (method, url) {
            try {
              if (!hasDispatchedAny && isMediaUrl(url)) {
                var absoluteUrl = new URL(url, document.baseURI || window.location.href).href;
                dispatchToNative(absoluteUrl);
              }
            } catch (e) {}
            return originalOpen.apply(this, arguments);
          };
        }

        if (typeof window.fetch === 'function') {
          var originalFetch = window.fetch;
          window.fetch = function (input, init) {
            try {
              var url = (typeof input === 'string') ? input : (input && input.url ? input.url : '');
              if (!hasDispatchedAny && isMediaUrl(url)) {
                var absoluteUrl = new URL(url, document.baseURI || window.location.href).href;
                dispatchToNative(absoluteUrl);
              }
            } catch (e) {}
            return originalFetch.apply(this, arguments);
          };
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
          if (v.currentSrc && v.currentSrc.indexOf('blob:') !== 0) dispatchToNative(v.currentSrc);
          if (v.src && v.src.indexOf('blob:') !== 0) dispatchToNative(v.src);

          var sources = v.getElementsByTagName('source');
          for (var j = 0; j < sources.length; j++) {
            if (hasDispatchedAny) break;
            if (sources[j].src && sources[j].src.indexOf('blob:') !== 0) dispatchToNative(sources[j].src);
          }
        }
      } catch (e) {}
    }

    function scanFullHtml() {
      if (hasDispatchedAny) return;
      try {
        var mediaRegex = /https?:\\/\\/[^\\s"'<>]+\\.(?:m3u8|mp4)(?:[?#][^\\s"'<>]*)?/gi;
        var elementsWithAttr = document.querySelectorAll('[src], [data-src], [data-url], [href]');
        
        for (var i = 0; i < elementsWithAttr.length; i++) {
          if (hasDispatchedAny) break;
          var el = elementsWithAttr[i];
          var attrs = ['src', 'data-src', 'data-url', 'href'];
          for (var a = 0; a < attrs.length; a++) {
            var val = el.getAttribute(attrs[a]);
            if (val && val.indexOf('blob:') !== 0 && (val.indexOf('.m3u8') !== -1 || val.indexOf('.mp4') !== -1)) {
              try {
                dispatchToNative(new URL(val, document.baseURI || window.location.href).href);
              } catch (e) {
                dispatchToNative(val);
              }
            }
          }
        }

        var scripts = document.getElementsByTagName('script');
        for (var k = 0; k < scripts.length; k++) {
          if (hasDispatchedAny) break;
          var sc = scripts[k];
          if (sc.textContent) {
            var match;
            while ((match = mediaRegex.exec(sc.textContent)) !== null) {
              if (match[0].indexOf('blob:') !== 0) {
                dispatchToNative(match[0]);
              }
            }
          }
        }
      } catch (e) {}
    }

    function start30sTimeoutMonitor() {
      setTimeout(function () {
        if (hasDispatchedAny) return;
        scanFullHtml();
        setTimeout(function () {
          if (!hasDispatchedAny) {
            var timeoutMsg = '❌ [30s Timeout]: Không tìm thấy link stream hợp lệ!';
            bridgeLog(timeoutMsg);
            if (HTMLRAW == true) {
              bridgeLog(document.getElementsByTagName("html")[0].outerHTML);
            }
          }
        }, 3500);
      }, 30000);
    }

    function autoClick() {
      try {
        setTimeout(function () {
          var nodes = document.querySelectorAll('div[aria-label="Phát"], #btnResume, button[id*="Resume"], button[id*="resume"]');
          if (nodes && nodes.length > 0) nodes[0].click();
        }, 500);
      } catch (err) {}
    }

    function startDOMSniffing() {
      try {
        scanVideoElements();
        var debouncedVideoScan = debounce(scanVideoElements, 400);
        if (typeof MutationObserver !== 'undefined') {
          var observer = new MutationObserver(function () {
            if (!hasDispatchedAny) debouncedVideoScan();
          });
          observer.observe(document.body || document.documentElement, {
            childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'data-src', 'data-url']
          });
        }
      } catch (errSniff) {}
    }

    function handleMainExecution() {
      try {
        autoClick();
        startDOMSniffing();
        start30sTimeoutMonitor();
      } catch (errExec) {}
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      handleMainExecution();
    } else {
      window.addEventListener('load', handleMainExecution);
      setTimeout(handleMainExecution, 1000);
    }

  } catch (globalErr) {}
})();
  `;
}




function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `
the-loai/vietsub@@Vietsub
the-loai/khong-che@@Không Che
the-loai/viet-nam@@Việt Nam
the-loai/trung-quoc@@Trung Quốc
the-loai/au-my@@Âu - Mỹ
the-loai/gai-xinh@@Gái Xinh
the-loai/hiep-dam@@Hiếp Dâm
the-loai/jav-hd@@JAV HD
the-loai/hoc-sinh@@Học Sinh
the-loai/vu-to@@Vú To
`
}


// Hàm tách menu bằng list - ĐÃ TỐI ƯU: Không dùng Regex lặp để tránh treo app
function buildMenu(listurl) {
    let menulist = [];
    if (!listurl) return menulist;
    
    let lines = listurl.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.indexOf('@@') === -1) continue;
        
        let parts = line.split('@@');
        let link = parts[0] ? parts[0].trim() : "";
        let name = parts[1] ? parts[1].trim() : "";
        let check = parts[2] ? parts[2].trim() : undefined;

        if (!link || !name) continue;

        let item = {};
        if (check === "false") {
            item = { "slug": link, "title": name, "type": "Horizontal" };
        } else if (check === "true") {
            item = { "slug": link, "title": name, "type": "Grid" };
        } else {
            item = { "slug": link, "name": name };
        }
        menulist.push(item);
    }
    return menulist;
}
function trimHTML(inhtml) {
    var result = inhtml.replace(/<[^>]*>/g, '');
    result = result.replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n|\r/gi, ' - ')
        .replace(/\s+/gi, ' ')
        .replace(/^,+|,+$/g, "");
    return result;
}


