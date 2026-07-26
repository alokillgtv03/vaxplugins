// =============================================================================
// VAAPP Plugin - Xhamster (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================
BASEURL = "https://phimsexsuong3x.net";
function getManifest() {
    return JSON.stringify({
        "id": "haysex",          
        "name": "HaySex",
        "description": "XXX Hay",
        "version": "1.2.3",    
      	"info": "Nguồn sex Việt. Nguồn này hay bị chặn bởi nhà mạng. Nếu không xem được hãy thử cài APP 1.1.1.1 hoặc dùng DNS và DPI có sẵn trên app để xem tiếp.",
        "baseUrl": "https://phimsexsuong3x.net",
        "iconUrl": "https://static.cdnsolutions.media/xh-desktop/images/favicon/favicon-v2-256x256.ico", 
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "embed"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "phim-sex-loan-luan", "title": "Loạn Luân", "type": "Horizontal" },
        { "slug": "onlyfans-leak", "title": "OnlyFans", "type": "Horizontal" },
        { "slug": "phim-sex-vietsub", "title": "Việt Sub", "type": "Horizontal" },
        { "slug": "clip-sex-telegram", "title": "Telegram", "type": "Horizontal" },
        { "slug": "", "title": "Hàng Mới", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
    { "slug": "phim-sex-my", "name": "Âu | Mỹ" },
    { "slug": "phim-sex-nhat-ban", "name": "Nhật Bản" },
    { "slug": "phim-sex-viet-nam", "name": "Việt Nam" },
    { "slug": "phim-sex-trung-quoc", "name": "Trung Quốc" },
    { "slug": "phim-sex-dong-tinh-nam-gay", "name": "Gay" },
    { "slug": "phim-sex-deepfake", "name": "DeepFake" },
    { "slug": "phim-sex-hiep-dam", "name": "Hiếp Dâm" }
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
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        
        if (page > 1) {
            return BASEURL + "/" + slug + "/page/" + page;
        }
        return BASEURL + "/" + slug;
    } catch (e) {
        return BASEURL + "/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/" + encodeURIComponent(keyword);
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
var pattern = /(?=<div[^>]*class="[^"]*video-block[^"]*")/g;
var splitItems = html.split(pattern).filter(Boolean);

for (var j = 1; j < splitItems.length; j++) {
    var block = splitItems[j];
    var hrefMatch = block.match(/href="([^"]+)"/i);
    if (!hrefMatch) continue; // Bỏ qua nếu khối không chứa link

    var id = hrefMatch[1].trim();

    var title = "";
    
    // Thử lấy title từ thuộc tính alt của ảnh trước
    // <span class="title">
    var altMatch = block.match(/<span class="title">([\s\S]*?)<\/span>/i);
    if (altMatch) {
        title = altMatch[1].trim();
    } else {
        // Khử fallback sang aria-label nếu alt không tồn tại
        var labelMatch = block.match(/title="([^"]+)"/i);
        title = labelMatch ? labelMatch[1].trim() : "";
    }
    
    // ĐIỀU KIỆN 1: Nếu tiêu đề rỗng hoặc là "Video không tiêu đề" thì không gán vào items
    if (!title || title === "Video không tiêu đề") {
        continue; 
    }
    
    var srcMatch = block.match(/img[\s\S]*?src="([^"]+)"/i);
    var posterUrl = srcMatch ? srcMatch[1].trim() : "https://ic-vt-nss.cdnsolutions.media/a/YjgwNDg0MGRkZWVjZjQ1ZGVhZjc5MzQ0ZWJkMDlhOTA/s(w:1280,h:720),webp/026/522/500/1280x720.17475568.jpg";
    
    items.push({
        "id": id,          
        "title": title, 
        "posterUrl": posterUrl, 
        "backdropUrl": posterUrl
    });
}
		
        var currentPage = 1;
        var totalPages = 1;

        const activeMatch = html.match(/(?:active|current)[\s\S]*?>\s*(\d+)\s*<\//);
const activePage = activeMatch ? parseInt(activeMatch[1]) : 1;

// 2. Tìm số trang cuối cùng (Quét qua toàn bộ thẻ <a> chứa số thuần túy)
const linkRegex = /<a[\s\S]*?>\s*(\d+)\s*<\/a>/g;
let lastPage = 1;
let match;

while ((match = linkRegex.exec(html)) !== null) {
    let pageNum = parseInt(match[1]);
    if (pageNum > lastPage) {
        lastPage = pageNum;
    }
}
        return JSON.stringify({
            "items": items,
            "pagination": { 
                "currentPage": activePage, 
                "totalPages": lastPage, // ĐÃ SỬA: Đồng bộ đúng biến totalPages động
                "totalItems": 40 * totalPages,
                "itemsPerPage": 40
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

    var rmatch = html.match(/<meta[^>]*?property="og:url"[^>]*?(https?:\/\/[^"\s]+)|<meta[^>]*?(https?:\/\/[^"\s]+)[^>]*?property="og:url"/);
    if (rmatch && rmatch[1]) { lurl = rmatch[1]}

    rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { limg = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { lname = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { ldes = rmatch[1]; }   
     
     var streamUrl = "";
        
        var rmatch = html.match(/iframe[\s\S]*?data-src="([\s\S]*?)"/i);
   	 if (rmatch && rmatch[1]) { streamUrl = rmatch[1]; }
     
    return JSON.stringify({
        id: lurl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: ldes  + "\r\n\r\n" +lurl + "\r\n\r\n" + streamUrl,
        servers: [
            {
                name: "HaySex",
                episodes: [
                    { id: lurl, name: "Xem Ngay", slug: "full" }
                ]
            }
        ],
        quality: "HD",
        year: 2026,
        rating: 8.5,
        status: "Full",
        duration: "N/A",
        casts: "N/A",
        director: "N/A",
        category: "18+"
    });
}

function parseDetailResponse(html,url) {
    try {
      
      /*
      var rmatch = html.match(/link\s+rel="canonical"\s+href="([^"]+)"/i);
    if (rmatch && rmatch[1]) { lurl = rmatch[1]; }
    */
		var customJs = runjS();
		var streamUrl = "";
        var rmatch = html.match(/iframe[\s\S]*?data-src="([\s\S]*?)"/i);
   	 if (rmatch && rmatch[1]) { streamUrl = rmatch[1]; }
   console.log("Đang xử lý: " + rmatch[1])
return JSON.stringify({
    url: streamUrl,
    headers: {
        "Referer": BASEURL,
        "Origin": BASEURL,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Custom-Js": customJs,
      "Block-Ads": "true"
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

    // ==========================================
    // ⚙️ CẤU HÌNH TOÀN CỤC & DANH SÁCH WORKER
    // ==========================================
    // Tự động xoay vòng và dự phòng khi có lỗi
    var WORKER_POOL = [
      "https://soft-surf-c11d.alokillgtv.workers.dev",
      "https://soft-water-25b0.alokillgtv02.workers.dev"
      // Bạn có thể thêm worker thứ 3, 4 vào đây dễ dàng:
      // "https://worker-so-3.workers.dev"
    ];
    
    // Chỉ số Worker đang được chọn phát hiện tại
    var activeWorkerIndex = Math.floor(Math.random() * WORKER_POOL.length);
    
    var CUSTOM_REFERER = "https://play2.cdn-xvideos-xnxx.xyz";
    var PROXY_ENABLED = true; 

    var STREAM_URL_REGEX = /https?:\\/\\/[^\\s"'<>]*(?:sanstream\\.xyz|m3u8|mp4|cdn=r2)[^\\s"'<>]*/i;
    var REPLACE_EXTENSION_ENABLED = false; 
    var REPLACE_FROM = ".html";           
    var REPLACE_TO = ".m3u8";             
    var MIME = "application/x-mpegURL"; 

    var ENABLE_FILTER = false; 
    var ALLOWED_DOMAINS = ["sanstream.xyz", "*.sanstream.xyz"];
    var BLOCKED_DOMAINS = ["ads.example.com", "*.adnetwork.com"];
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

    bridgeLog('🎬 [Sniffer v5.2] Khởi chạy chế độ Web Player Clean DOM + Multi-Worker Failover...');

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

    // Hàm dựng Proxy URL dựa theo index của Worker trong Pool
    function buildProxyUrl(targetUrl, workerIdx) {
      try {
        if (!PROXY_ENABLED || !WORKER_POOL || WORKER_POOL.length === 0) {
          return targetUrl;
        }
        
        var selectedWorker = WORKER_POOL[workerIdx % WORKER_POOL.length];
        var encodedUrl = encodeURIComponent(targetUrl);
        var encodedReferer = encodeURIComponent(CUSTOM_REFERER || window.location.href);
        var encodedUA = encodeURIComponent(navigator.userAgent);

        var finalProxy = selectedWorker + "?url=" + encodedUrl + "&referer=" + encodedReferer + "&ua=" + encodedUA + "&file=.m3u8";
        bridgeLog('🔗 [Worker #' + (workerIdx % WORKER_POOL.length) + ' Proxy Built]: ' + finalProxy);
        return finalProxy;
      } catch (e) {
        return targetUrl;
      }
    }

    // ==========================================
    // 🧹 CLEAN DOM VÀ TẠO PLAYER VỚI FAILOVER AUTOMATION
    // ==========================================
    function renderCustomWebPlayer(rawStreamUrl) {
      bridgeLog('🚀 Đang xóa DOM cũ và tạo Player mới...');

      // 1. Dọn sạch toàn bộ HTML cũ
      document.getElementsByTagName('html')[0].innerHTML = '';
      
      // 2. Thiết lập lại Body tràn viền
      document.body.style.backgroundColor = '#000000';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.width = '100vw';
      document.body.style.height = '100vh';
      document.body.style.overflow = 'hidden';
      document.body.style.display = 'flex';
      document.body.style.justifyContent = 'center';
      document.body.style.alignItems = 'center';

      // 3. Tạo thẻ Video Fullscreen Controls Autoplay
      var video = document.createElement('video');
      video.id = 'customHlsPlayer';
      video.controls = true;
      video.autoplay = true;
      video.muted = false;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('x5-playsinline', '');
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'contain';

      document.body.appendChild(video);

      var hlsInstance = null;
      var failedWorkersCount = 0;

      // 4. Hàm phát Video bằng hls.js hoặc Native HLS
      function startPlayback(workerIndex) {
        var proxyUrl = buildProxyUrl(rawStreamUrl, workerIndex);

        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
          if (hlsInstance) {
            hlsInstance.destroy();
          }

          bridgeLog('📺 Đang phát qua Worker #' + (workerIndex % WORKER_POOL.length) + ': ' + WORKER_POOL[workerIndex % WORKER_POOL.length]);
          
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            manifestLoadingMaxRetry: 2, // Thử lại tối đa 2 lần trước khi báo lỗi
            fragLoadingMaxRetry: 2
          });

          hlsInstance.loadSource(proxyUrl);
          hlsInstance.attachMedia(video);

          hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
            failedWorkersCount = 0; // Reset lại đếm lỗi nếu tải thành công
            video.play().catch(function(e) {
              bridgeLog('⚠️ Autoplay bị chặn, chuyển muted để phát tiếp...');
              video.muted = true;
              video.play();
            });
            if (video.requestFullscreen) { video.requestFullscreen(); }
            else if (video.webkitRequestFullscreen) { video.webkitRequestFullscreen(); }
          });

          // BẮT LỖI TỰ ĐỘNG ĐỔI WORKER KHI CÓ SỰ CỐ NETWORK HOẶC 403/500
          hlsInstance.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
              failedWorkersCount++;
              bridgeLog('⚠️ Lỗi Worker #' + (workerIndex % WORKER_POOL.length) + ' (' + data.type + '). Đang thử Worker kế tiếp...');

              if (failedWorkersCount < WORKER_POOL.length) {
                // Nhảy sang Worker kế tiếp trong Array
                activeWorkerIndex = (workerIndex + 1) % WORKER_POOL.length;
                startPlayback(activeWorkerIndex);
              } else {
                bridgeLog('❌ TẤT CẢ WORKER TRONG LIST ĐỀU LỖI/BỊ CHẶN!');
              }
            }
          });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          bridgeLog('🍎 Sử dụng Native HLS Player (Safari/iOS)');
          video.src = proxyUrl;
          video.addEventListener('loadedmetadata', function () {
            video.play();
            if (video.webkitEnterFullscreen) { video.webkitEnterFullscreen(); }
          });
        } else {
          bridgeLog('❌ Trình duyệt không hỗ trợ HLS');
        }
      }

      // 5. Tải động thư viện hls.js
      if (typeof Hls === 'undefined') {
        bridgeLog('📥 Đang tải thư viện hls.js...');
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.onload = function() { startPlayback(activeWorkerIndex); };
        script.onerror = function() {
          bridgeLog('❌ Không thể tải hls.js CDN');
        };
        document.head.appendChild(script);
      } else {
        startPlayback(activeWorkerIndex);
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

        var finalUrl = absoluteUrl;
        if (REPLACE_EXTENSION_ENABLED) {
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
          
          // Render giao diện phát video với cơ chế Auto-Failover
          renderCustomWebPlayer(finalUrl);
        });

      } catch (errDispatch) {
        bridgeLog('❌ [Error]: ' + errDispatch.message);
      }
    }

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
