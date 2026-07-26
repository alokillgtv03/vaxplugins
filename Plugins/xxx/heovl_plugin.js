BASEURL = "https://heovl.im";
function getManifest() {
    return JSON.stringify({
        "id": "heovl",
        "name": "Heovl",
        "description": "XXX Hay",
        "version": "1.5",
      	"info": "Nguồn sex Việt. Nguồn này hay bị chặn bởi nhà mạng. Nếu không xem được hãy thử cài APP 1.1.1.1 hoặc dùng DNS và DPI có sẵn trên app để xem tiếp.",
        "baseUrl": "https://heovl.im",
        "iconUrl": "https://static.cdnsolutions.media/xh-desktop/images/favicon/favicon-v2-256x256.ico",
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "embedtoexoplay"
    });
}



// Hàm tách menu bằng list
function buildMenu(listurl){
// 2. Khởi tạo mảng chứa kết quả
let menulist = [];
let regex = /^([^@\r\n]+)@@([^@\r\n]+)(?:@@([^@\r\n]+))?/gm;
let match;

// 4. Vòng lặp duyệt qua từng hàng bằng RegExp
while ((match = regex.exec(listurl)) !== null) {
    let link = match[1].trim();
    let name = match[2].trim();
    let check = match[3] ? match[3].trim() : undefined; // Lấy giá trị check nếu có

    let item = {};

    // 5. Kiểm tra điều kiện biến check để tạo cấu trúc Object
    if (check === "false") {
        item = { 
            "slug": link, 
            "title": name, 
            "type": "Horizontal" 
        };
    } else if (check === "true") {
        item = { 
            "slug": link, 
            "title": name, 
            "type": "Grid" 
        };
    } else {
        // Trường hợp không có biến check (undefined)
        item = { 
            "slug": link, 
            "name": name 
        };
    }

    // 6. Push item vào mảng menulist
    menulist.push(item);
}


// 7. In kết quả ra để kiểm tra
    return menulist
}

//https://pornone.com/newest/
//https://pornone.com/newest/3/
//https://pornone.com/search?q=black
/*
{ "slug": "", "title": "", "type": "Horizontal" },
{ "slug": "", "title": "", "type": "Grid" }
*/

function getHomeSections() {
    var listurl = `
    categories/viet-nam@@Việt Nam@@true
    `
    var  menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

// https://pornone.com/anal/
/*
    { "slug": "", "name": ""},
    { "slug": "", "name": ""}
    
    
*/
function getPrimaryCategories() {
    var listurl = `
    categories/choi-lo-dit-anal-sex@@Lỗ Nhị
    categories/nga-russia@@Nga
    categories/vu-to@@Vú To
    categories/tap-the@@Tập Thể
    categories/hiep-dam@@Hiếp Dâm
    categories/loan-luan@@Loạn Luân
    categories/phim-cap-3@@Phim Cap 3
    `
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'latest' },
            { name: 'Đánh giá cao', value: 'rating' },
            { name: 'Xem nhiều', value: 'views' }
        ],
        category: [
            { name: "Huyền Huyễn", value: "huyen-huyen" },
            { name: "Xuyên Không", value: "xuyen-khong" },
            { name: "Trùng Sinh", value: "trung-sinh" },
            { name: "Tiên Hiệp", value: "tien-hiep" },
            { name: "Cổ Trang", value: "co-trang" },
            { name: "Hài Hước", value: "hai-huoc" },
            { name: "Kiếm Hiệp", value: "kiem-hiep" },
            { name: "Hiện Đại", value: "hien-dai" }
        ]
    });
}

// =============================================================================
// URL GENERATION (Bóc tách slug sạch theo khuôn mẫu mới)
// =============================================================================

// https://heovl.im/search/vang-anh?page=3
// https://heovl.im/categories/viet-nam?page=3

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        // Prioritize category filter if present
        if (filtersJson.category) {
            return BASEURL + "/" + filters.category + "/?page=" + page;
        }
        
        if (page > 1) {
            if (slug.indexOf("search") > -1) {
                return BASEURL + "/" + slug + "/?page=" + page;
            } else {
                return BASEURL + "/" + slug + "/?page=" + page;
            }
        }
        return BASEURL + "/" + slug;
    } catch (e) {
        return BASEURL + "/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/search/" + encodeURIComponent(keyword);
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

function parseListResponse(html) {
    try {
        var items = [];
        // Tách từng item phim để tránh regex chạy sai giữa các item
        var chunks = html.split('class="videos__box-wrapper"');
        
        // Bắt đầu từ 1 vì phần tử 0 là phần html trước class đầu tiên
        for (var i = 1; i < chunks.length; i++) {
            var blockHtml = chunks[i];
            
            // Kiểm tra xem block này có chứa các thẻ cốt lõi của video không
            if (!blockHtml.match(/img|href|video|src/i)) {
                continue;
            }
            
            // 1. Lấy link phim (Sửa lỗi logic || thành &&)
            var urlMatch = blockHtml.match(/a[\s\S]*?href="([^"]+)"/i);
            var url = "";
            if (urlMatch && urlMatch[1]) {
                url = urlMatch[1];
            } else {
                // Nếu không có url hợp lệ, bỏ qua chunk này luôn, không lấy rác
                continue;
            }
            
            if (!url.startsWith("http")) {
                url = BASEURL + url;
            }
            
            // 2. Lấy Title
            var title = "";
            var rmatch = blockHtml.match(/title="([^"]+)"/i);
            if (rmatch && rmatch[1]) {
                title = rmatch[1];
            }
            
            // 3. Lấy Poster (Toán tử 3 ngôi chuẩn)
            var posterMatch = blockHtml.match(/data-src="([^"]+)"/i) || blockHtml.match(/src="([^"]+)"/i);
            var poster = posterMatch ? posterMatch[1] : "";
            if (poster && !poster.startsWith("http")) {
                poster = BASEURL + poster;
            }
            
            items.push({
                id: url,
                title: title,
                posterUrl: poster
            });
        }
        
        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 999 }
        });
    } catch (e) {
        //console.error("Lỗi Parse:", e);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}


function parseSearchResponse(html) {
    return parseListResponse(html);
}



//JSON.parse(parseMovieDetail(html,"https://heovl.im/videos/chich-nhan-tinh-cuc-pham-tren-ghe-sieu-nung"))
function parseMovieDetail(html,ourl) {
    var lurl = "";
    var limg = "";
    var lname = "Đang cập nhật...";
    var ldes = "Không có mô tả.";
    var year = 2026;
    var direc = "????";
    var cast = "????";
    var status = "????";
    var duration = "1:09:00 | 16 | 16";
    var servers = [];
    
    try {
        // 1. Parse Meta Tags
        var rmatch;
        rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) { limg = rmatch[1]; }
        
        rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) { lname = rmatch[1]; }
        
        rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) { ldes = rmatch[1]; }
        
        var episodes = [];
        
        // 2. Kiểm tra xem có nút bấm server hay không bằng Regex MatchAll
        // Tìm tất cả các đoạn có data-source="..." trong class button tương ứng
        var serverRegex = /data-source="([^"]+)"/gi;
        //var html = document.getElementsByTagName("html")[0].outerHTML;
        var serverMatches = html.match(serverRegex)
        
        if (serverMatches.length > 0) {
            // Nếu tìm thấy các nút server
            for (var j = 0; j < serverMatches.length; j++) {
                var sourcebutton = serverMatches[j]; // Lấy giá trị trong nhóm ngoặc đơn ([^"]+)
                var sourceUrl = sourcebutton.match(/data-source=["']([\s\S]*?)["']/i);
                if(sourceUrl && sourceUrl[1]){
                    //console.log(sourceUrl[1])
									if(sourceUrl[1].indexOf("zabitcdn.name") > -1){
                    episodes.push({
                        id: sourceUrl[1],
                        name: "Server " + (j + 1),
                        slug: "tap-" + (j + 1)
                    });
                  }
                }

            }
        } else {
            // 3. Nếu không có nút thì tìm iframe
            var iframeRegex = /class="[^"]*video-player[^"]*"[\s\S]*?iframe\s+src="([^"]+)"/i;
            var iframeMatch = html.match(iframeRegex);
            
            if (iframeMatch && iframeMatch[1]) {
                lurl = iframeMatch[1];
               if(lurl.indexOf("zabitcdn.name") > -1){
                  episodes.push({
                      id: lurl,
                      name: "Server 1",
                      slug: "tap-1"
                  });
               }
            }
        }
        
        servers = [{
            name: "Server",
            episodes: episodes
        }];
        
    } catch (e) {
        //console.error("Lỗi parse dữ liệu: ", e);
    }
    var $return = {
        id: ourl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: lurl,
        servers: servers,
        quality: "HD",
        year: year,
        status: status,
        duration: duration,
        casts: cast,
        director: direc
    }
    // Trả về kết quả (Dù lỗi hay không lỗi vẫn return đúng cấu trúc object mong muốn)
    return JSON.stringify($return);
}
//var html = document.getElementsByTagName("html")[0].outerHTML;
//JSON.parse(parseMovieDetail(html,""))
//var iframeRegex = /class="[^"]*video-player[^"]*"[\s\S]*?iframe\s+src="([^"]+)"/i;
//var iframeMatch = html.match(iframeRegex);

function parseDetailResponse(html,url) {
    try {
    // Đọc trực tiếp từ thuộc tính của BaseJSON đã lưu ở bước đầu tiên
        var $stream = url;
        var iframeRegex = /class="[^"]*video-player[^"]*"[\s\S]*?iframe\s+src="([^"]+)"/i;
        var iframeMatch = html.match(iframeRegex);
        if(iframeMatch && iframeMatch[1]){
            $stream = iframeMatch[1];
        }

        return JSON.stringify({
            url: $stream,
            isEmbed: true // Vẫn cần fetch tiếp
        });

    } catch (e) {
        return JSON.stringify({ "url": "", "headers": {} });
    }
}


function parseEmbedResponse(html, sourceUrl) {
        

        var customjs = runjS();
        customjs += `
        function runScript($msg){
            //showToast("${sourceUrl}", duration = 60000)
        }
        `

        return JSON.stringify({
            url: sourceUrl,
            isEmbed: false, // Kết thúc, đây là link stream cuối
            mimeType: "application/x-mpegURL", // Báo App đây là HLS
            headers: { "Referer": sourceUrl,
            "Custom-Js": customjs.trim()
            },
        });
    
    return JSON.stringify({ url: "", isEmbed: false });
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


// KHỚP MẪU ROPHIMFAKE: Trả về chuỗi text thuần túy thay vì gọi JSON.stringify
//function parseCategoriesResponse(html) { return "[]"}
function parseCategoriesResponse(apiResponseJson) {
    var listurl = `
categories/viet-nam@@Việt Nam
categories/nga-russia@@Nga(Russia)
categories/vu-to@@Vú To
categories/tap-the@@Tập Thể
categories/hiep-dam@@Hiếp Dâm
categories/loan-luan@@Loạn Luân
categories/phim-cap-3@@Phim Cap 3
categories/vietsub@@Vietsub
categories/choi-lo-dit-anal-sex@@Chơi lỗ đít(Anal Sex
categories/nhat-ban@@Nhật Bản
`
    var menulist = buildMenu(listurl);
    
    return JSON.stringify(menulist);
}
function parseCountriesResponse(html) { return "[]"}
function parseYearsResponse(html) { return "[]"}
