BASEURL = "https://krx18.com";

function getManifest() {
    return JSON.stringify({
        "id": "krx18",
        "name": "Phim 18+ Hàn",
        "description": "Nguồn XXX hàn quốc Hay", 
        "version": "1.1.6",
        "BASEURL": "https://krx18.com",
        "iconUrl": "https://krx18.com/wp-content/uploads/2022/10/krx18B.png",
        "isEnabled": true,
        "isAdult": true,
        "type": "MOVIE",
        "playerType": "embed"
    });
}
// https://krx18.com/movies/page/2/
function getHomeSections() {
    return JSON.stringify([
        { "slug": "/movies/", "title": "Phim Có Nội Dung", "type": "Grid" }
    ]);
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
// ===================================================================
function getUrlList(slug, filtersJson) {
    try {
        // 1. Kiểm tra nếu slug là link tuyệt đối (chứa http) và không có bộ lọc thì trả về luôn
        if (slug && slug.indexOf("http") > -1 || slug.indexOf("search/") > -1) {
            // thường là link search sẽ bị trả về ở đây
            return slug;
        }
        let page = 1;
        let path = slug || "";
        
        // 2. Xử lý an toàn filtersJson nếu có truyền vào
        if (filtersJson) {
            // Nếu có số trang hoặc  có menu categ
            // Sửa lỗi nếu JSON thiếu dấu ngoặc kép ở key hoặc sai cú pháp cơ bản
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/:,/g, ':');
            // Sửa lỗi nếu truyền kiểu {"page",24} thành {"page":24}
            
            try {
                let filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                
                // Nếu có category trong JSON, ưu tiên lấy category làm đường dẫn (path)
                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug;
                    } else if (typeof filters.category === 'string') {
                        path = filters.category;
                    }
                }
            } catch (jsonErr) {
                //console.log("JSON parse lỗi, dùng giá trị mặc định");
            }
        }
        
        
        // 4. Chuẩn hóa path (Xóa dấu gạch chéo thừa ở đầu/cuối để tránh nhân đôi dấu //)        
        // 5. Nối chuỗi URL kết quả
        let resultUrl = BASEURL;
        if (path) {
            resultUrl += path;
        }
        // https://www.tranny.one/recent/?mix=true&pageId=2&_=1783573720196
        if (page > 1 && resultUrl.indexOf("filter=latest") == -1) {
            resultUrl += "page/" + page + "/";
        }
        // Trả về kết quả, chỉ gộp dấu // ở phần path, giữ nguyên https://
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
        
    } catch (e) {
        // console.log("Lỗi hệ thống: " + e.message);
        // Trả về URL gốc an toàn nếu có lỗi
        let fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}
// https://krx18.com/genre/china/page/3/
// https://krx18.com/movies/page/4/

//BASEURL = "https://www.trannymovs.com";
//filtersJson = '{"page":5,"category":[{"slug":"/categories/ladyboy/","name":"ladyboy"}]}';
//filtersJson = '{"page":13}';
//console.log(getUrlList("", filtersJson));


function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/search/" + encodeURIComponent(keyword) + "/";
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + slug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        //.thumb_rel item
        // 
        var regexList = `
class[^>]+movies[\\s\\S]*?
src=["']([^"']+)["'][\\s\\S]*?
alt=["']([^"']+)["'][\\s\\S]*?
href=["']([^"']+)["']
`;
        regexList = regexList.replace(/\r|\n|\t/g, "");
        regmath = new RegExp(regexList, "g");
//regmath.exec(html)
        var matchList;
        // regexList.exec(html)
        while ((matchList = regmath.exec(html)) !== null) {
            if (matchList[3] && matchList[3].indexOf("http") > -1) {
                var cleanThumb = matchList[1].replace(/&amp;/g, '&');
                // var imgorigin = matchList[0].match(/data-webp=["']([^"']+)["']/i);
                //if(imgorigin && imgorigin[1]){
                //   cleanThumb = imgorigin[1];
                //}
                
                items.push({
                    "id": matchList[3],
                    "title": matchList[2].trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb
                });
            }
        }
        
        var totalPages = 999;
        var currentPage = 1;
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": currentPage, "totalPages": totalPages }
        });
    } catch (e) {
        var items = [];
        items.push({
            "id": $url,
            "title": "Lỗi: " + e,
            "posterUrl": "",
            "backdropUrl": ""
        });
        return JSON.stringify({ "items": items, "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}
///*
//html = $("html")[0].outerHTML;
//JSON.parse(parseListResponse(html));
// Bỏ dấu / ở đầu chuỗi
//*/



function parseSearchResponse(html) {
    return parseListResponse(html);
}


function parseMovieDetail(html,$url) {
    var lurl = "";
    var limg = "";
    var lname = "Đang cập nhật...";
    var ldes = "Không có mô tả.";
    var streamUrl = ""; // ĐÃ SỬA: Khai báo rõ ràng biến streamUrl tránh lỗi Global leak

    var rmatch = html.match(/link\s+rel="canonical"\s+href=["']([^"']+)["']/i);
    if (rmatch && rmatch[1]) { lurl = rmatch[1] }

    rmatch = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (rmatch && rmatch[1]) { limg = rmatch[1]; }

    rmatch = html.match(/<title>([^<]+)/i);
    if (rmatch && rmatch[1]) { lname = rmatch[1]; }

    rmatch = html.match(/meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (rmatch && rmatch[1]) { ldes = rmatch[1]; }
    // https://krx18.com/wp-json/dooplayer/v2/85671/movie/1
    // <meta id="dooplay-ajax-counter" data-postid="85671" />
    var idvideo = "";
    var $linkser = "";
    rmatch = html.match(/id=["']dooplay-ajax-counter["']\s+data-postid=["']([^"']+)["']/i);
    if (rmatch && rmatch[1]) { 
        idvideo = rmatch[1];
        $linkser = "https://krx18.com/wp-json/dooplayer/v2/"+idvideo+"/movie/";
    }
    var $stream = "";
    var epi = [];
    
    epi.push({ id: $linkser + "1", name: "Server 1", slug: "full" });
    // var stream = 'https://agokda.cdnlab.live/stream/X9mBBkyCNC1euSox903wew/1783632790/0/431/431.m3u8';
    var $return = {
        id: $url,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: "",
        servers: [
            {
                name: "Servers: ",
                episodes: epi
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
    }
    var $objreturn = $return;
    $return.description = ldes + "\r\n\r\n\r\n\r\n\r\n\r\n" + JSON.stringify($objreturn);
    return JSON.stringify($return);
}

/*
BASEURL = "https://www.justporn.com";
var html = $("html")[0].outerHTML;
var $url = "https://www.justporn.com/video/18058/hot-babe-remy-cheats-with-bbc/";
JSON.parse(parseMovieDetail(html,$url))
*/

function parseDetailResponse(html,url) {
    try {
        var link = url;
        //if(html.indexOf("embed_url") > -1){
            var $embed = JSON.parse(html);
            link = $embed.embed_url;
       // }
        
        
		var customjs = runjS();

    // {"embed_url":"https:\/\/play.playkrx18.site\/play\/6a4f1c63ee633ccb0191a32f","type":"iframe"}
    // Đọc trực tiếp từ thuộc tính của BaseJSON đã lưu ở bước đầu tiên
        return JSON.stringify({
    "url": link,
    "headers": {
        "Referer": BASEURL,
        "Origin": BASEURL,
        isEmbed: true,
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        // Đánh lừa thuật toán Client Hints của tường lửa
        "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "Sec-Ch-Ua-Mobile": "?1",
        "Sec-Ch-Ua-Platform": '"Android"',
        
        // Khai báo kiểu dữ liệu được chấp nhận giống như trình duyệt thật
        "Accept": "*/*",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        "X-Requested-With": "com.android.chrome",
      	"Block-Ads": "true",      
      	"Custom-Js": customjs
    },
    "subtitles": []
});

    } catch (e) {
      	console.log("parseDetailResponse[error]: " + e)
        return JSON.stringify({ "url": "", "headers": {} });
    }
}
/*
function parseEmbedResponse(html, sourceUrl) {
  try{      
        var link = sourceUrl;
       // if (html.indexOf("embed_url") > -1) {
            var $embed = JSON.parse(html);
            link = $embed.embed_url;
       // }

        var customjs = runjS();
				
        return JSON.stringify({
            url: link,
            isEmbed: false, // Kết thúc, đây là link stream cuối// Báo App đây là HLS
            headers: { "Referer": BASEURL,
            "Custom-Js": customjs               
            }
        });
  } catch(e){
    console.log("parseEmbedResponse[error]: " + e);
    return JSON.stringify({ url: "", isEmbed: false });
  }
}
*/


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

function renderArtPlayer(playUrl, rawStreamUrl) {
  try {
    bridgeLog('🚀 [renderArtPlayer]: Tạo Giao diện ArtPlayer Fullscreen đầy đủ tính năng...');

    document.body.innerHTML = '';
    var style = document.createElement('style');
    style.innerHTML = 'html, body { width: 100vw !important; height: 100vh !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background-color: #000 !important; } #artplayer-container { width: 100vw !important; height: 100vh !important; position: fixed !important; top: 0 !important; left: 0 !important; z-index: 999999 !important; }';
    document.head.appendChild(style);

    var container = document.createElement('div');
    container.id = 'artplayer-container';
    document.body.appendChild(container);

    // 🎯 1. NHẬN DIỆN M3U8 THÔNG MINH
    var lowerPlayUrl = (playUrl || '').toLowerCase();
    var lowerRawUrl = (rawStreamUrl || '').toLowerCase();
    
    var isProxyLink = PROXY_ENABLED && WORKER_POOL.some(function(worker) {
      return lowerPlayUrl.indexOf(worker.toLowerCase()) !== -1;
    });

    var isM3U8 = lowerRawUrl.indexOf('.m3u8') !== -1 || 
                 lowerPlayUrl.indexOf('.m3u8') !== -1 || 
                 lowerPlayUrl.indexOf('%2fm3u8') !== -1 ||
                 isProxyLink;

    // 🎯 2. BẢNG CÀI ĐẶT BÁNH RĂNG (SETTINGS) ĐẦY ĐỦ
    var customSettings = [];

    // Tùy chọn Server Proxy
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

    // Tùy chọn Tỉ lệ khung hình (Aspect Ratio)
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

    // 🎯 3. KHỞI TẠO ARTPLAYER VỚI ĐẦY ĐỦ CONTROL & TÙY CHỌN
    window.art = new Artplayer({
      container: '#artplayer-container',
      url: playUrl,
      type: isM3U8 ? 'm3u8' : 'mp4',
      autoplay: true,
      volume: 0.8,
      isLive: false,
      
      // 🕹️ BẬT ĐẦY ĐỦ CÁC NÚT ĐIỀU KHIỂN NATIVE
      setting: true,         // Bánh răng cài đặt
      playbackRate: true,    // Nút tua nhanh / tốc độ phát (0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x)
      aspectRatio: true,     // Chỉnh tỉ lệ khung hình
      fullscreen: true,      // Nút Toàn màn hình
      fullscreenWeb: true,   // Nút Fullscreen trình duyệt
      pip: true,             // Nút Bật Hình trong hình (Picture-in-Picture)
      autoOrientation: true, // Tự xoay màn hình điện thoại
      airplay: true,         // Nút Airplay
      screenshot: true,      // Nút Chụp ảnh màn hình
      theme: '#23ade5',       // Màu chủ đạo giao diện player
      
      // Gắn danh sách Cài đặt mở rộng vào Bánh Răng
      settings: customSettings,

      // 🛠️ TỐI ƯU HLS.JS ĐỂ TUA KHÔNG BỊ TRỮ/KẸT VIDEO
      customType: {
        m3u8: function (video, url, art) {
          if (Hls.isSupported()) {
            if (art.hls) art.hls.destroy();
            var hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 90,
              maxBufferLength: 30, // Giới hạn bộ nhớ đệm để tua mượt hơn
              maxMaxBufferLength: 600,
              enableCEA708Captions: false
            });

            hls.loadSource(url);
            hls.attachMedia(video);
            art.hls = hls;

            // Xử lý sự kiện tua video (seek) để tránh giật lag
            art.on('seek', function (time) {
              if (art.hls) {
                bridgeLog('⏩ [ArtPlayer]: Đang tua đến ' + time + 's');
              }
            });

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
      bridgeLog('🎉 [ArtPlayer]: Trình phát sẵn sàng đầy đủ tính năng!');
      window.art.play().catch(function() {
        window.art.muted = true;
        window.art.play();
      });
    });

  } catch (e) {
    bridgeLog('❌ [renderArtPlayer - Lỗi]: ' + e.message);
  }
}


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
    if (typeof bridgeLog === 'function') {
      bridgeLog('❌ [initEnhancedVideoSniffer - Lỗi Toàn Cục]: ' + globalErr.message);
    }
  }
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
/genre/korea/@@Korea
/genre/australia/@@Australia
/genre/belgium/@@Belgium
/genre/canada/@@Canada
/genre/china/@@China
/genre/denmark/@@Denmark
/genre/france/@@France
/genre/germany/@@Germany
/genre/indonesia/@@Indonesia
/genre/india/@@India
/genre/italy/@@Italy
/genre/japan/@@Japan
/genre/netherlands/@@Netherlands
/genre/philippines/@@Philippines
/genre/poland/@@Poland
/genre/russia/@@Russia
/genre/singapore/@@Singapore
/genre/spain/@@Spain
/genre/switzerland/@@Switzerland
/genre/taiwan/@@Taiwan
/genre/thailand/@@Thailand
`;
}

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


