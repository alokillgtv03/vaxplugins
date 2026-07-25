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
    function bridgeLog(msg) {
      try {
        if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
          window.SnifferBridge.log(String(msg));
        } else if (typeof console !== 'undefined' && console.log) {
          console.log('[SNIFFER LOG]', msg);
        }
      } catch (e) {}
    }
(function waitCrypto() {

    if (!window.CryptoJS || !CryptoJS.AES || !CryptoJS.AES.decrypt) {
        setTimeout(waitCrypto, 500);
        return;
    }

    function hexToString(hex) {

        try {

            let str = "";

            for (let i = 0; i < hex.length; i += 2) {
                str += String.fromCharCode(
                    parseInt(hex.substr(i, 2), 16)
                );
            }

            return str;

        } catch (e) {
            return "";
        }

    }

    const originalAESDecrypt = CryptoJS.AES.decrypt;

    CryptoJS.AES.decrypt = function () {

        try {

            const result = originalAESDecrypt.apply(this, arguments);

            const raw = String(result);

            bridgeLog("========== AES ==========");

            bridgeLog("[AES KEY]");
            bridgeLog(String(arguments[1]));

            bridgeLog("[AES CIPHER]");
            bridgeLog(String(arguments[0]));

            bridgeLog("[AES RESULT]");
            bridgeLog(raw);

            bridgeLog("[AES TYPE]");
            bridgeLog(typeof result);

            if (/^[0-9a-f]+$/i.test(raw)) {

                const decoded = hexToString(raw);

                bridgeLog("[HEX DECODE]");
                bridgeLog(decoded);

                if (
                    decoded.startsWith("http://") ||
                    decoded.startsWith("https://")
                ) {

                    bridgeLog("🎯 [STREAM URL]");
                    bridgeLog(decoded);
          var headersObj = {
            "Referer": "https://krx18.com",
            mimeType: "application/x-mpegURL",
            "User-Agent": navigator.userAgent
          };       
			if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
            try {
              window.SnifferBridge.play(decoded + "/index.m3u8", headersObj);
              dispatched = true;
            } catch (e1) {
              bridgeLog('❌ Lỗi Android Bridge: ' + e1.message);
            }
          }

          // iOS Bridge
          if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.m3u8Detected) {
            try {
              window.webkit.messageHandlers.m3u8Detected.postMessage(videoUrl);
              dispatched = true;
            } catch (e2) {
              bridgeLog('❌ Lỗi iOS Bridge: ' + e2.message);
            }
          }
                }

            }

            return result;

        } catch (err) {

            bridgeLog("[AES ERROR]");
            bridgeLog(err.stack || err);

            throw err;
        }

    };

    bridgeLog("✅ AES HOOK READY");

})();


  
(function initEnhancedVideoSniffer() {
  try {
    // Tập hợp lưu trữ các URL đã gửi check và cờ khóa 1 lần gửi duy nhất
    var processedUrls = {};
    var hasDispatchedAny = false;

    // ==========================================
    // 1. HELPER: LOGGING BRIDGE
    // ==========================================


    // Hàm Debounce
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

    bridgeLog('🎬 [Sniffer v3.2] Khởi chạy (Chỉ gửi 1 link SỐNG duy nhất sang Native).');

    // ==========================================
    // 2. HÀM KIỂM TRA LINK SỐNG / CHẾT
    // ==========================================
    function checkUrlPlayable(url, callback) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('HEAD', url, true);
        xhr.timeout = 3000; // Timeout 3 giây

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            var status = xhr.status;

            // Link sống (200-299, 206) hoặc Status 0 (CORS - nhường Native thử)
            if ((status >= 200 && status < 300) || status === 206 || status === 0) {
              bridgeLog('🟢 [URL OK - Status ' + status + ']: ' + url);
              callback(true);
            } else {
              bridgeLog('🚫 [URL Chết - Status ' + status + ']: Bỏ qua link -> ' + url);
              callback(false);
            }
          }
        };

        xhr.onerror = function () {
          // Lỗi mạng hoặc bị chặn CORS -> Cho qua Native thử cơ hội
          callback(true);
        };

        xhr.ontimeout = function () {
          bridgeLog('⏰ [URL Timeout 3s]: Bỏ qua link -> ' + url);
          callback(false);
        };

        xhr.send();
      } catch (e) {
        callback(true);
      }
    }

    // ==========================================
    // 3. HÀM TRUYỀN DỮ LIỆU SANG NATIVE (CHỈ 1 LẦN DUY NHẤT)
    // ==========================================
    function dispatchToNative(videoUrl) {
      try {
        if (!videoUrl || typeof videoUrl !== 'string') return;

        // Đã có 1 link gửi sang Native thành công trước đó -> Dừng ngay
        if (hasDispatchedAny) return;

        // Bỏ qua Blob URL & file .ts lẻ
        if (videoUrl.indexOf('blob:') === 0) return;
        if (videoUrl.indexOf('.ts') !== -1 && videoUrl.indexOf('.m3u8') === -1) return;

        // Tránh kiểm tra lại URL đã từng kiểm tra
        if (processedUrls[videoUrl]) return;
        processedUrls[videoUrl] = true;

        bridgeLog('🔍 Đang kiểm tra link candidate: ' + videoUrl);

        // Kiểm tra link trước khi gửi
        checkUrlPlayable(videoUrl, function(isPlayable) {
          // Nếu trong lúc chờ check mà đã có link khác gửi thành công -> Dừng
          if (hasDispatchedAny) return;

          // Nếu link CHẾT -> Bỏ qua, tiếp tục để các link khác có cơ hội check tiếp
          if (!isPlayable) {
            bridgeLog('🔄 Link không phát được, tiếp tục chờ link stream tiếp theo...');
            return;
          }

          // KÍCH HOẠT KHÓA: Đánh dấu đã gửi thành công 1 link duy nhất
          hasDispatchedAny = true;

          bridgeLog('📌 [SUCCESS] Link SỐNG! Gửi duy nhất link này sang Native: ' + videoUrl);

          var headersObj = {
            "Referer": window.location.href,
            "User-Agent": navigator.userAgent
          };
          var headersJson = JSON.stringify(headersObj);
          var dispatched = false;

          // Android Bridge
          if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
            try {
              window.SnifferBridge.play(videoUrl, headersJson);
              dispatched = true;
            } catch (e1) {
              bridgeLog('❌ Lỗi Android Bridge: ' + e1.message);
            }
          }

          // iOS Bridge
          if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.m3u8Detected) {
            try {
              window.webkit.messageHandlers.m3u8Detected.postMessage(videoUrl);
              dispatched = true;
            } catch (e2) {
              bridgeLog('❌ Lỗi iOS Bridge: ' + e2.message);
            }
          }

          if (!dispatched) {
            bridgeLog('⚠️ Không tìm thấy Native Bridge tương thích.');
          }
        });

      } catch (errDispatch) {
        bridgeLog('💥 [Fatal Error in dispatchToNative]: ' + errDispatch.message);
      }
    }

    // ==========================================
    // ƯU TIÊN 1 (TỨC THÌ): NETWORK INTERCEPTOR (XHR & FETCH STREAM)
    // ==========================================
    (function initNetworkInterceptor() {
      try {
        bridgeLog('📡 [Ưu tiên 1] Đang kích hoạt lắng nghe XHR & Fetch Stream...');

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

        // Ghi đè XMLHttpRequest
        if (typeof XMLHttpRequest !== 'undefined') {
          var originalOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function (method, url) {
            try {
              if (!hasDispatchedAny && isMediaUrl(url)) {
                var absoluteUrl = new URL(url, document.baseURI || window.location.href).href;
                bridgeLog('⚡ [Ưu tiên 1 - XHR Detected]: ' + absoluteUrl);
                dispatchToNative(absoluteUrl);
              }
            } catch (e) {}
            return originalOpen.apply(this, arguments);
          };
        }

        // Ghi đè Fetch API
        if (typeof window.fetch === 'function') {
          var originalFetch = window.fetch;
          window.fetch = function (input, init) {
            try {
              var url = '';
              if (typeof input === 'string') {
                url = input;
              } else if (input && input.url) {
                url = input.url;
              }

              if (!hasDispatchedAny && isMediaUrl(url)) {
                var absoluteUrl = new URL(url, document.baseURI || window.location.href).href;
                bridgeLog('⚡ [Ưu tiên 1 - Fetch Detected]: ' + absoluteUrl);
                dispatchToNative(absoluteUrl);
              }
            } catch (e) {}

            return originalFetch.apply(this, arguments);
          };
        }
      } catch (errInterceptor) {
        bridgeLog('💥 [Fatal Error in Interceptor]: ' + errInterceptor.message);
      }
    })();

    // ==========================================
    // ƯU TIÊN 2 (TỨC THÌ): QUÉT THẺ <video src> VÀ <source src>
    // ==========================================
    function scanVideoElements() {
      if (hasDispatchedAny) return;
      try {
        var videos = document.getElementsByTagName('video');
        for (var i = 0; i < videos.length; i++) {
          if (hasDispatchedAny) break;
          var v = videos[i];
          if (v.currentSrc && v.currentSrc.indexOf('blob:') !== 0) {
            bridgeLog('🎬 [Ưu tiên 2 - Video currentSrc]: ' + v.currentSrc);
            dispatchToNative(v.currentSrc);
          }
          if (v.src && v.src.indexOf('blob:') !== 0) {
            bridgeLog('🎬 [Ưu tiên 2 - Video src]: ' + v.src);
            dispatchToNative(v.src);
          }

          var sources = v.getElementsByTagName('source');
          for (var j = 0; j < sources.length; j++) {
            if (hasDispatchedAny) break;
            var s = sources[j];
            if (s.src && s.src.indexOf('blob:') !== 0) {
              bridgeLog('🎬 [Ưu tiên 2 - Source src]: ' + s.src);
              dispatchToNative(s.src);
            }
          }
        }
      } catch (e) {
        bridgeLog('⚠️ Lỗi quét thẻ Video/Source: ' + e.message);
      }
    }

    // ==========================================
    // ƯU TIÊN 3: QUÉT HTML BẰNG REGEX & THÔNG BÁO SAU 30S
    // ==========================================
    function scanFullHtml() {
      if (hasDispatchedAny) return;
      try {
        bridgeLog('🔍 [Ưu tiên 3] Đã chờ 30s không thấy link từ Ưu tiên 1 & 2. Tiến hành quét toàn bộ HTML/Script bằng Regex...');

        var mediaRegex = /https?:\\/\\/[^\\s"'<>]+\\.(?:m3u8|mp4)(?:[?#][^\\s"'<>]*)?/gi;

        // Quét attribute
        var elementsWithAttr = document.querySelectorAll('[src], [data-src], [data-url], [href]');
        for (var i = 0; i < elementsWithAttr.length; i++) {
          if (hasDispatchedAny) break;
          var el = elementsWithAttr[i];
          var attrs = ['src', 'data-src', 'data-url', 'href'];
          for (var a = 0; a < attrs.length; a++) {
            var val = el.getAttribute(attrs[a]);
            if (val && val.indexOf('blob:') !== 0 && (val.indexOf('.m3u8') !== -1 || val.indexOf('.mp4') !== -1)) {
              try {
                var absoluteUrl = new URL(val, document.baseURI || window.location.href).href;
                dispatchToNative(absoluteUrl);
              } catch (e) {
                dispatchToNative(val);
              }
            }
          }
        }

        // Quét thẻ script
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
      } catch (e) {
        bridgeLog('⚠️ Lỗi quét toàn bộ HTML: ' + e.message);
      }
    }

    function start30sTimeoutMonitor() {
      bridgeLog('⏱️ Khởi chạy bộ đếm ngược 30 giây...');
      setTimeout(function () {
        if (hasDispatchedAny) return; // Đã bắt được link sống rồi -> Bỏ qua

        // Chạy Ưu tiên 3 quét toàn bộ trang HTML
        scanFullHtml();

        // Dành ra 3.5s chờ các request check HEAD của Ưu tiên 3 phản hồi xong
        setTimeout(function () {
          if (!hasDispatchedAny) {
            var timeoutMsg = '❌ [30s Timeout Notification]: Quá 30 giây không tìm thấy link stream hoặc tất cả các link stream (m3u8/mp4) bắt được đều đã CHẾT!';
            callRun();
            bridgeLog(timeoutMsg);
            if (typeof console !== 'undefined' && console.log) {
              console.log(timeoutMsg);
            }
          }
        }, 3500);

      }, 30000);
    }

    // ==========================================
    // AUTO-CLICKER
    // ==========================================
    function autoClick(config) {
      try {
        var cfg = config || {};
        var selector = cfg.selector || 'div[aria-label="Phát"], #btnResume, button[id*="Resume"], button[id*="resume"]';
        var maxRetries = cfg.maxRetries || 10;
        var retryInterval = cfg.retryInterval || 500;

        setTimeout(function () {
          var currentClicks = 0;
          var retryCount = 0;

          var attemptClick = function () {
            try {
              var nodes = document.querySelectorAll(selector);
              if (!nodes || nodes.length === 0) {
                retryCount++;
                if (retryCount <= maxRetries) {
                  setTimeout(attemptClick, retryInterval);
                }
                return;
              }

              var targetEl = nodes[0];
              if (targetEl) {
                targetEl.click();
                currentClicks++;
                bridgeLog('✅ [AutoClick] Đã click nút phát.');
              }
            } catch (err) {}
          };

          attemptClick();
        }, cfg.delay || 500);
      } catch (errAutoClick) {}
    }

    // ==========================================
    // MÁY QUÉT DOM VÀ MUTATION OBSERVER
    // ==========================================
    function startDOMSniffing() {
      try {
        scanVideoElements();

        var debouncedVideoScan = debounce(scanVideoElements, 400);

        if (typeof MutationObserver !== 'undefined') {
          var observer = new MutationObserver(function () {
            if (!hasDispatchedAny) {
              debouncedVideoScan();
            }
          });

          observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'data-src', 'data-url']
          });
        }
      } catch (errSniff) {}
    }

    // ==========================================
    // ĐIỂM KHỞI CHẠY (ENTRY POINT)
    // ==========================================
    function handleMainExecution() {
      try {
        bridgeLog('🚀 [Main Execution] Bắt đầu tiến trình kiểm tra stream...');
        autoClick();
        startDOMSniffing();        // Khởi chạy Ưu tiên 2
        start30sTimeoutMonitor();  // Khởi chạy đếm ngược 30s & Ưu tiên 3
      } catch (errExec) {}
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      handleMainExecution();
    } else {
      window.addEventListener('load', handleMainExecution);
      setTimeout(handleMainExecution, 1000);
    }

  } catch (globalErr) {
    if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
      window.SnifferBridge.log('💥 [Fatal Error]: ' + globalErr.message);
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


