BASEURL = "https://krx18.com";

function getManifest() {
    return JSON.stringify({
        "id": "krx18",
        "name": "Phim 18+ Hàn",
        "description": "Nguồn XXX hàn quốc Hay",
        "version": "1.1",
        "BASEURL": "https://krx18.com",
        "iconUrl": "https://krx18.com/wp-content/uploads/2022/10/krx18B.png",
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
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
    epi.push({ id: $linkser + "2", name: "Server 2", slug: "full" });
    epi.push({ id: $linkser + "3", name: "Server 3", slug: "full" });
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
  return `
(function initEnhancedVideoSniffer() {
  try {
    var processedUrls = {};
    var hasDispatchedAny = false;

    // ==========================================
    // ⚙️ CẤU HÌNH TOÀN CỤC (TÙY CHỈNH DỄ DÀNG)
    // ==========================================
    var GOOGLE_SCRIPT_API = "https://dark-dream-4a7d.langhuythuan.workers.dev/";
    var CUSTOM_REFERER = "https://play2.cdn-xvideos-xnxx.xyz";
    
    // Bật/tắt tính năng dùng Google Script Proxy để cấp link cho ExoPlayer
    var PROXY_ENABLED = true; 

    var STREAM_URL_REGEX = /https?:\\/\\/[^\\s"'<>]*(?:sanstream\\.xyz|m3u8|mp4|cdn=r2)[^\\s"'<>]*/i;
    var REPLACE_EXTENSION_ENABLED = true; 
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

    bridgeLog('🎬 [Sniffer v4.4] Khởi chạy với Global API Config...');

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

    // Hàm xây dựng URL gọi qua Google Script API kèm đầy đủ tham số
    function buildProxyUrl(targetUrl) {
      try {
        if (!PROXY_ENABLED || !GOOGLE_SCRIPT_API) {
          return targetUrl;
        }
        var encodedUrl = encodeURIComponent(targetUrl);
        var encodedReferer = encodeURIComponent(CUSTOM_REFERER || window.location.href);
        var encodedUA = encodeURIComponent(navigator.userAgent);

        var finalProxy = GOOGLE_SCRIPT_API + "?url=" + encodedUrl + "&referer=" + encodedReferer + "&ua=" + encodedUA + "&check=false&render=false";
        bridgeLog('🔗 [Proxy Built]: ' + finalProxy);
        return finalProxy;
      } catch (e) {
        return targetUrl;
      }
    }

    function dispatchStreamToNative(finalUrl) {
      try {
        // Tạo đường dẫn qua Google Script API với các biến toàn cục đã khai báo
        var playableUrl = buildProxyUrl(finalUrl);

        var headersObj = {
          "Referer": CUSTOM_REFERER || window.location.href,
          "User-Agent": navigator.userAgent,
          "mimeType": MIME
        };
        var headersJson = JSON.stringify(headersObj);

        bridgeLog('📌 [SUCCESS] Gửi link sang Native: ' + playableUrl);

        if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
          try { window.SnifferBridge.play(playableUrl, headersJson); } catch (e1) {}
        }

        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.m3u8Detected) {
          try { window.webkit.messageHandlers.m3u8Detected.postMessage(playableUrl); } catch (e2) {}
        }
      } catch (err) {}
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
          dispatchStreamToNative(finalUrl);
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


