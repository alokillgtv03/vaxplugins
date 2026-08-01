var BASEURL = "https://xem20.net";
var BASEAPI = "https://vsmov.com/api";
var DEV = true;
function getManifest() {
  return JSON.stringify({
    id: "xem20",
    name: "Nguồn Xem20",
    description: "Nguồn phim Xem20...",
    "version": "1.1",
    info: "Nguồn phim Xem20, có lẽ là tiền thân của nó là rophim.\nNguồn phim cũng khá là chất lượng.\nĐể sử dụng, các bạn cần vào ô đăng nhập ở plugin.\nCác bạn cần phải đăng ký tài khoản và dăng nhập mới có thể sử dụng.",
    baseUrl: "https://xem20.net",
    iconUrl: "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/phimchill.ico",
    isEnabled: true,
    "adblock": false,
    "layoutType": "HORIZONTAL",
    type: "MOVIE",
    playerType: "auto"
  });
}


function log(msg) {
  	console.log(msg);
}

function getHomeSections() {
    return JSON.stringify([
        {"slug": "/the-loai/phim-18","title": "Phim 18+","type": "Horizontal"},
       {"slug": "/danh-sach/phim-le","title": "Phim Lẻ","type": "Horizontal"},
       {"slug": "/danh-sach/phim-bo","title": "Phim Bộ","type": "Horizontal"},
        {"slug": "/danh-sach/phim-chieu-rap","title": "Phim Chiếu Rạp","type": "Horizontal"},
        {"slug": "/loc-phim","title": "Phim Mới","type": "Grid"}
    ]);
}



function getPrimaryCategories() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        log("getPrimaryCategories[err]:\n " + e);
        return JSON.stringify([]);
    }
}

function getFilterConfig() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify({
            category: menulist
        });
    } catch (e) {
        log("getFilterConfig[err]:\n " + e);
        return JSON.stringify({ category: [] });
    }
}

function getUrlList(slug, filtersJson) {
    try {
        log("getUrlList[url]: \n" + slug);

        // 1. Kiểm tra nếu slug là link tuyệt đối (chứa http)
        if (slug && slug.indexOf("http") > -1) {
            log("getUrlList[url]: \n" + slug);
            return slug;
        }

        var page = 1;
        var path = slug || "";

        // 2. Xử lý an toàn filtersJson cho link tương đối
        if (filtersJson) {
            var fixedJson2 = filtersJson
                .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/:,/g, ':');

            try {
                var filters = JSON.parse(fixedJson2);
                page = parseInt(filters.page) || 1;

                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug;
                    } else if (typeof filters.category === 'string') {
                        path = filters.category;
                    }
                }
            } catch (jsonErr) {}
        }

        // 3. Ghép URL an toàn với BASEURL
        var resultUrl = BASEURL;
        
        if (path) {
            resultUrl += (path.indexOf("/") === 0 ? "" : "/") + path;
        }

        // 4. Ghép tham số phân trang page (tự động nhận biết ? hay &)
        if (page > 0 && resultUrl.indexOf("page=") === -1) {
            resultUrl += "?page=" + page;
        }

        // 5. Làm sạch dấu // thừa ở path (giữ nguyên https://)
        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalUrl);
        return finalUrl;

    } catch (e) {
        log("getUrlList[err]:\n " + e);
        if (slug && slug.indexOf("http") > -1) {
            log("getUrlList[url]: \n" + slug);
            return slug;
        }
        var fallback = BASEURL + (slug ? (slug.indexOf("/") === 0 ? slug : "/" + slug) : "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalFallback);
        return finalFallback;
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var page = 1;

        // 1. Giải mã filtersJson lấy trang đúng chuẩn hàm gốc
        if (filtersJson) {
            var fixedJson = filtersJson
                .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/:,/g, ':');

            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
            } catch (jsonErr) {}
        }

        // 2. Khởi tạo URL tìm kiếm kèm cấu trúc /search?lang=vi-VN&q=
        var encodedKeyword = encodeURIComponent(keyword || "");
        var resultUrl = BASEURL + "/tim-kiem?keyword=" + encodedKeyword;

        // 3. Nếu page > 1 thì nối thêm &page=
        if (page > 1) {
            resultUrl += "&page=" + page;
        }

        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalUrl);
        return finalUrl;

    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
        var fallback = BASEAPI + "/tim-kiem?keyword=" + encodeURIComponent(keyword || "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalFallback);
        return finalFallback;
    }
}

// https://xem20.net/tim-kiem?keyword=naruto
// /type/hoat-hinh/
//filtersJson = "{page:5}"

//getUrlList("", filtersJson)

function getUrlDetail(slug) {
    try {
        log("getUrlDetail[url]: \n" + slug);
        if (!slug) return "";
        if (slug.indexOf('http') === 0) return slug;
        var detailUrl = BASEURL + "/" + slug;
        log("getUrlDetail[url]: \n" + detailUrl);
        return detailUrl;
    } catch (e) {
        log("getUrlDetail[err]:\n " + e);
        return "";
    }
}

function getUrlCategories() { 
    try {
        log("getUrlCategories[url]: \n" + BASEURL);
        return BASEURL; 
    } catch (e) {
        log("getUrlCategories[err]:\n " + e);
        return "";
    }
}


function getUrlCountries() { 
    try {
        return ""; 
    } catch (e) {
        log("getUrlCountries[err]:\n " + e);
        return "";
    }
}

function getUrlYears() { 
    try {
        return ""; 
    } catch (e) {
        log("getUrlYears[err]:\n " + e);
        return "";
    }
}

// =============================================================================
// PARSERS
// =============================================================================


function parseListResponse(html, $url) {
    try {
        var $html = _$(html);
        var items = [];
        $html.find(".grid .group").each(function(){
            var slug = this.find("a").attr("href");
            var name = this.find("h4").text();
            var poster = this.find("img").attr("src");
            var quality = this.find(".tracking-wider").text();;
            var current = this.find(".badge-system-primary").text();;
            var year = this.find(".items-center span").eq(0).text();
            year = Number(year.trim());
            
         // var img = typeof year === "number" ? year : 2026;
            if(slug.length > 5 && poster.length > 5 && name.length > 5){
                items.push({
                    "id": slug,
                    "title": name,
                    "quality": quality,
                    "episode_current": current,
                    "posterUrl": typeof poster === "string" ? poster : "",
                    "backdropUrl": typeof poster === "string" ? poster : "",
                    "year": typeof year === "number" ? year : 2026
                });
            }
        })
        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": 1,
                "totalPages": 9999
            }
        });
    } catch (e) {
        log("parseListResponse[err]:\n " + e);
        return JSON.stringify({
            "items": [{
                "id": $url || "error_url",
                "title": "Lỗi: " + e,
                "posterUrl": "",
                "backdropUrl": ""
            }],
            "pagination": {
                "currentPage": 1,
                "totalPages": 1
            }
        });
    }
}
//html = sourceHTML;
// https://vicdn.cc/api/type/hoat-hinh/1
// https://vicdn.cc/?q=ta
//JSON.parse(parseListResponse(sourceHTML, "https://vicdn.cc/api/type/hoat-hinh/1"))

//$data = parseJSDataIsolated(script);
function parseSearchResponse(html, url) {
    try {
        log("parseSearchResponse[url]: \n" + url);
        return parseListResponse(html, url);
    } catch (e) {
        log("parseSearchResponse[err]:\n " + e);
        return JSON.stringify({
            "items": [],
            "pagination": {
                "currentPage": 1,
                "totalPages": 1
            }
        });
    }

function decodeHTMLEntities(str) {
}
    try {
        if (!str) return "";
        return str.replace(/&#(\d+);|&#x([0-9a-fA-F]+);/g, (match, dec, hex) => {
            if (dec) {
                return String.fromCharCode(parseInt(dec, 10));
            }
            if (hex) {
                return String.fromCharCode(parseInt(hex, 16));
            }
            return match;
        });
    } catch (e) {
        log("decodeHTMLEntities[err]:\n " + e);
    }
}

function parseMovieDetail(html, url) {
    try {
        log("parseMovieDetail[url]: \n" + url);
        // === BƯỚC 2: TRÍCH XUẤT THÔNG TIN PHIM ===
        var $doc = _$(html);
        var lurl = "";
        var poster = $doc.find(".relative img.w-full").attr("src");
        var lname = $doc.find("h1").text();
        var ldes = $doc.find("p.synopsis-text").text();
        var ldirec = $doc.find(".director-link").text();
        var merge = [];
        $doc.find("p:content('Diễn|viên')").parent().find("div a").each(function() {
            merge.push("[" + this.text() + "](" + this.attr("href") + ")");

        });
        var lactor = merge.join(", ");
        var lduran = $doc.find(".items-center span:content('phút/tập')").text();
        var status = "";
        var category = "";
        var merge = [];
        $doc.find("p:content('Thê|loại')").parent().find("div a").each(function() {
            merge.push("[" + this.text() + "](" + this.attr("href") + ")");
        });
        category = merge.join(", ");
        var episode_current = $doc.find(".items-center span:content('Tập')").text();;
        var year = $doc.find(".flex .items-center span:content('IMDB')").closest("div").find("span:eq(4)").text();
        year = Number(year);
        var quality = $doc.find(".flex .items-center span:content('IMDB')").closest("div").find("span:eq(3)").text();
        var extra = "";
        var servers = [];
        $doc.find(".server-group").each(function() {
            var serverName = this.find(".server-name-row").text().replace("Server: ", "");
            var episodes = [];
            this.find("a").each(function() {
                var number = this.text();
                episodes.push({
                    id: this.attr("href"),
                    name: ("Tập " + number).replace("Tập Tập","Tập"),
                    slug: "tap-" + number
                })
            })
            servers.push({
                name: serverName,
                episodes: episodes
            })
        })

        return JSON.stringify({
            id: url,
            title: lname,
            posterUrl: poster,
            backdropUrl: poster,
            description: ldes,
            quality: quality,
            year: year,
            rating: 8.5,
            status: status,
            category: category,
            episode_current: episode_current,
            servers: servers,
            duration: lduran || "",
            casts: lactor || "",
            director: ldirec || "",
            extra: extra
        });

    } catch (e) {
        log("parseMovieDetail[err]:\n " + e);
        return JSON.stringify({
            id: url || url || "error",
            title: "error",
            servers: []
        });
    }
}

//var html = sourceHTML;
//var url = "https://hentaivietsub.com/hentai/enjo-kouhai-tap-11?//current=1&maxEpi=11"
//JSON.parse(parseMovieDetail(sourceHTML, "https://vicdn.cc/api/info/tv-278275-1"))

//$data = JSON.parse(sourceHTML)

/*
    var $doc = _$(html);
    var script = $doc.find("script:content('subtitles')").html()
    var match = script.match(/subtitles:\s*(\[\s*\{.*?\}\s*\])/s);
    var domain = url.replace(/^(https?:\/\/[^\/]+).*\/, "$1");
    var subs = [];
*/

function parseDetailResponse(html, url) {
  try {
    console.log("parseDetailResponse dang xu ly: " + url);
    var $doc = _$(html)
    stream = $doc.find("#video-iframe").attr("data-src");
    if(!stream){
        script = $doc.find("script:content('jwplayer(\"my-video\")')|m3u8").html();
        var match = script.match(/file:[^"']+["']([^"']+)["']/i);
        if(match && match[1]){
            stream = match[1];
            console.log("streamM3u8: " + stream)
            return JSON.stringify({
              url: stream,
              isEmbed: false,
              mimeType: "application/x-mpegURL",
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Referer: BASEURL
              },
              subtitles: [],
            });
        }
    }
    console.log("stream: " + stream);
    return JSON.stringify({
      url: stream,
      isEmbed: false,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: BASEURL,
        "Custom-Js": runjS()
      },
      subtitles: [],
    });
  } catch (e) {
    log("parseDetailResponse[err]:\n " + e);
    return JSON.stringify({
      url: "",
      isEmbed: false,
      headers: {},
      subtitles: [],
    });
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





function parseCategoriesResponse(apiResponseJson) {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        log("parseCategoriesResponse[err]:\n " + e);
        return JSON.stringify([]);
    }
}

function parseCountriesResponse(html) {
    try {
        return "[]";
    } catch (e) {
        log("parseCountriesResponse[err]:\n " + e);
        return "[]";
    }
}

function parseYearsResponse(html) {
    try {
        return "[]";
    } catch (e) {
        log("parseYearsResponse[err]:\n " + e);
        return "[]";
    }
}


// https://vsmov.com/api/the-loai/hanh-dong
function getLISTmenu() {
    return `[{\"link\":\"/the-loai/co-trang\",\"name\":\"Cổ trang\"},{\"link\":\"/the-loai/kiem-hiep\",\"name\":\"Kiếm hiệp\"},{\"link\":\"/the-loai/vo-thuat\",\"name\":\"Võ Thuật\"},{\"link\":\"/the-loai/hanh-dong\",\"name\":\"Hành động\"},{\"link\":\"/the-loai/tam-ly\",\"name\":\"Tâm Lý\"},{\"link\":\"/the-loai/chinh-kich\",\"name\":\"Chính kịch\"},{\"link\":\"/the-loai/chien-tranh\",\"name\":\"Chiến tranh\"},{\"link\":\"/the-loai/vien-tuong\",\"name\":\"Viễn tưởng\"},{\"link\":\"/the-loai/giat-gan\",\"name\":\"Giật gân\"},{\"link\":\"/the-loai/bi-an\",\"name\":\"Bí ẩn\"},{\"link\":\"/the-loai/kinh-di\",\"name\":\"Kinh dị\"},{\"link\":\"/the-loai/xa-hoi-den\",\"name\":\"Xã hội đen\"},{\"link\":\"/the-loai/hinh-su\",\"name\":\"Hình sự\"},{\"link\":\"/the-loai/hai-huoc\",\"name\":\"Hài hước\"},{\"link\":\"/the-loai/phim-chieu-rap\",\"name\":\"Phim chiếu rạp\"},{\"link\":\"/the-loai/than-thoai\",\"name\":\"Thần Thoại\"},{\"link\":\"/the-loai/tien-hiep\",\"name\":\"Tiên Hiệp\"},{\"link\":\"/the-loai/phieu-luu\",\"name\":\"Phiêu lưu\"},{\"link\":\"/the-loai/phim-hot\",\"name\":\"Phim Hot\"},{\"link\":\"/the-loai/tinh-cam\",\"name\":\"Tình cảm\"},{\"link\":\"/the-loai/phim-18\",\"name\":\"Phim 18+\"},{\"link\":\"/the-loai/18-cong\",\"name\":\"18 Cộng\"},{\"link\":\"/the-loai/hoat-hinh\",\"name\":\"Hoạt Hình\"},{\"link\":\"/the-loai/gia-dinh\",\"name\":\"Gia Đình\"},{\"link\":\"/the-loai/am-nhac\",\"name\":\"Âm Nhạc\"},{\"link\":\"/the-loai/tv-shows\",\"name\":\"TV Shows\"},{\"link\":\"/the-loai/tai-lieu\",\"name\":\"Tài Liệu\"},{\"link\":\"/the-loai/hoc-duong\",\"name\":\"Học Đường\"},{\"link\":\"/the-loai/dua-xe\",\"name\":\"Đua xe\"},{\"link\":\"/the-loai/the-thao\",\"name\":\"Thể Thao\"},{\"link\":\"/the-loai/lich-su\",\"name\":\"Lịch sử\"},{\"link\":\"/the-loai/uncategorized\",\"name\":\"Uncategorized\"},{\"link\":\"/the-loai/kinh-dien\",\"name\":\"Kinh Điển\"},{\"link\":\"/the-loai/lang-man\",\"name\":\"Lãng Mạn\"},{\"link\":\"/the-loai/khoa-hoc\",\"name\":\"Khoa Học\"},{\"link\":\"/the-loai/tre-em\",\"name\":\"Trẻ Em\"},{\"link\":\"/the-loai/mien-tay\",\"name\":\"Miền Tây\"},{\"link\":\"/the-loai/short-drama\",\"name\":\"Short Drama\"},{\"link\":\"/the-loai/gia-tuong\",\"name\":\"Giả Tưởng\"},{\"link\":\"/the-loai/phim-dang-chieu\",\"name\":\"Phim đang chiếu\"},{\"link\":\"/the-loai/phim-hai\",\"name\":\"Phim Hài\"},{\"link\":\"/the-loai/phim-ngan\",\"name\":\"Phim Ngắn\"},{\"link\":\"/the-loai/talk\",\"name\":\"Talk\"}]`;
}

function buildMenu(menuStr, type) { 
    var menuArray = JSON.parse(menuStr); 
    let menulist = []; 
    if (!menuArray || !Array.isArray(menuArray)) return menulist; 
    var typeStr = type !== undefined ? String(type).trim() : undefined; 
    for (var i = 0; i < menuArray.length; i++) { 
        var item = menuArray[i]; 
        if (!item) continue; 
        var link = item.link ? String(item.link).trim() : ""; 
        var name = item.name ? String(item.name).trim() : ""; 
        if (!link || !name) continue; 
        var menuItem = {}; 
        if (typeStr === "false") { 
            menuItem = { "slug": link, "title": name, "type": "Horizontal" }; 
        } else if (typeStr === "true") { 
            menuItem = { "slug": link, "title": name, "type": "Grid" }; 
        } else { 
            menuItem = { "slug": link, "name": name }; 
        } 
        menulist.push(menuItem); 
    } 
    return menulist; 
}

function _$(param) {
    // -------------------------------------------------------------
    // 1. HELPER PARSER & UTILS
    // -------------------------------------------------------------
    function parseHTML(htmlString) {
        let nodes = [];
        let root = { id: 0, tag: "ROOT", attrs: {}, childrenIds: [], parentId: null };
        nodes.push(root);

        try {
            let html = (htmlString || "").trim();
            if (!html) return { root, nodes };

            const VOID_TAGS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
            let stack = [0];
            let tagRegex = /<(?:\/([a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]+)([^>]*?)(\/)?)\s*>/g;
            
            let lastIndex = 0;
            let match;
            let maxIter = 50000;
            let iter = 0;

            while ((match = tagRegex.exec(html)) !== null && iter++ < maxIter) {
                let textBefore = html.slice(lastIndex, match.index).trim();
                let parentId = stack[stack.length - 1];

                if (textBefore) {
                    let textId = nodes.length;
                    nodes.push({ id: textId, tag: "#text", text: textBefore, attrs: {}, childrenIds: [], parentId: parentId });
                    nodes[parentId].childrenIds.push(textId);
                }

                lastIndex = tagRegex.lastIndex;
                let isCloseTag = !!match[1];
                let tagName = (match[1] || match[2] || "").toLowerCase();
                let attrStr = match[3] || "";
                let isSelfClosing = !!match[4] || VOID_TAGS.has(tagName);

                if (isCloseTag) {
                    for (let i = stack.length - 1; i > 0; i--) {
                        if (nodes[stack[i]].tag === tagName) {
                            stack.splice(i);
                            break;
                        }
                    }
                } else {
                    let attrs = {};
                    let attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
                    let attrMatch;
                    while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
                        attrs[attrMatch[1].toLowerCase()] = attrMatch[2] || attrMatch[3] || attrMatch[4] || "";
                    }

                    let nodeId = nodes.length;
                    let node = { id: nodeId, tag: tagName, attrs: attrs, childrenIds: [], parentId: parentId };
                    nodes.push(node);
                    nodes[parentId].childrenIds.push(nodeId);

                    if (!isSelfClosing) {
                        stack.push(nodeId);
                    }
                }
            }

            let remainingText = html.slice(lastIndex).trim();
            if (remainingText && stack.length > 0) {
                let parentId = stack[stack.length - 1];
                let textId = nodes.length;
                nodes.push({ id: textId, tag: "#text", text: remainingText, attrs: {}, childrenIds: [], parentId: parentId });
                nodes[parentId].childrenIds.push(textId);
            }
        } catch (err) {
            if (typeof window !== "undefined" && window.log) window.log("parseHTML error: " + err.message);
        }
        return { root, nodes };
    }

    function getNodeText(node, nodes, depth) {
        if (!node || (depth || 0) > 20) return "";
        if (node.tag === "#text") return node.text || "";
        let text = "";
        if (node.childrenIds) {
            for (let cid of node.childrenIds) {
                text += getNodeText(nodes[cid], nodes, (depth || 0) + 1) + " ";
            }
        }
        return text.trim();
    }

    // -------------------------------------------------------------
    // 2. QUERY ENGINE & SELECTOR MATCHING
    // -------------------------------------------------------------
    function matchSingleSelector(node, sel, nodes) {
        if (!node || node.tag === "#text" || node.tag === "ROOT") return false;

        let cleanSel = sel;
        
        // 1. Tách pseudo positional (:first, :last, :eq)
        cleanSel = cleanSel.replace(/:first|:last|:eq\([0-9]+\)/gi, "").trim();

        // 2. Tách pseudo :content(...)
        let pseudoContentArg = null;
        let contentMatch = cleanSel.match(/:content\((['"]?)(.*?)\1\)/i);
        if (contentMatch) {
            pseudoContentArg = contentMatch[2];
            cleanSel = cleanSel.replace(contentMatch[0], "").trim();
        }

        // 3. Khớp Selector gốc
        if (cleanSel && cleanSel !== "*") {
            let tagMatch = cleanSel.match(/^[a-zA-Z0-9_-]+/);
            if (tagMatch && node.tag !== tagMatch[0].toLowerCase()) return false;

            let idMatch = cleanSel.match(/#([a-zA-Z0-9_-]+)/);
            if (idMatch && (!node.attrs || node.attrs.id !== idMatch[1])) return false;

            // Class matching (hỗ trợ Tailwind)
            let classMatches = cleanSel.match(/\.([a-zA-Z0-9_\-\/\\:]+)/g);
            if (classMatches) {
                if (!node.attrs || !node.attrs.class) return false;
                let elClasses = node.attrs.class.split(/\s+/);
                for (let c of classMatches) {
                    let targetClass = c.substring(1);
                    if (!elClasses.includes(targetClass)) return false;
                }
            }

            let attrMatch = cleanSel.match(/\[([a-zA-Z0-9_-]+)(?:=['"]?(.*?)['"]?)?\]/);
            if (attrMatch) {
                let attrName = attrMatch[1].toLowerCase();
                let attrVal = attrMatch[2];
                if (!node.attrs || !(attrName in node.attrs)) return false;
                if (attrVal !== undefined && node.attrs[attrName] !== attrVal) return false;
            }
        }

        if (pseudoContentArg !== null) {
            let fullText = getNodeText(node, nodes, 0);
            let keywords = pseudoContentArg.split("|").map(k => k.trim().toLowerCase());
            let found = keywords.some(kw => fullText.toLowerCase().includes(kw));
            if (!found) return false;
        }

        return true;
    }

    function querySelectorAllSingleLevel(startNode, selector, nodes) {
        let results = [];
        function search(currentId, depth) {
            if (depth > 50) return;
            let current = nodes[currentId];
            if (!current) return;

            if (current.tag !== "ROOT" && current.tag !== "#text" && current.id !== startNode.id) {
                if (matchSingleSelector(current, selector, nodes)) {
                    results.push(current);
                }
            }
            if (current.childrenIds) {
                for (let cid of current.childrenIds) {
                    search(cid, depth + 1);
                }
            }
        }
        search(startNode.id, 0);

        if (selector.indexOf(":first") !== -1) return results.slice(0, 1);
        if (selector.indexOf(":last") !== -1) return results.slice(-1);
        
        let eqMatch = selector.match(/:eq\(([0-9]+)\)/i);
        if (eqMatch) {
            let idx = parseInt(eqMatch[1], 10);
            return results[idx] ? [results[idx]] : [];
        }

        return results;
    }

    function querySelectorAll(startNode, selector, nodes) {
        try {
            if (!startNode || !selector) return [];

            if (selector.indexOf(',') !== -1) {
                let groupSelectors = selector.split(',').map(s => s.trim());
                let resMap = new Map();
                for (let gSel of groupSelectors) {
                    let subRes = querySelectorAll(startNode, gSel, nodes);
                    for (let r of subRes) resMap.set(r.id, r);
                }
                return Array.from(resMap.values());
            }

            let spaceParts = selector.trim().split(/\s+/);
            if (spaceParts.length > 1) {
                let currentNodes = [startNode];
                for (let part of spaceParts) {
                    let nextLevelNodes = [];
                    let addedIds = new Set();
                    for (let cNode of currentNodes) {
                        let subResults = querySelectorAllSingleLevel(cNode, part, nodes);
                        for (let r of subResults) {
                            if (!addedIds.has(r.id)) {
                                addedIds.add(r.id);
                                nextLevelNodes.push(r);
                            }
                        }
                    }
                    currentNodes = nextLevelNodes;
                    if (currentNodes.length === 0) break;
                }
                return currentNodes;
            }

            return querySelectorAllSingleLevel(startNode, selector, nodes);
        } catch (err) {
            return [];
        }
    }

    // -------------------------------------------------------------
    // 3. MINIJQ CLASS CONSTRUCTOR & PROTOTYPE
    // -------------------------------------------------------------
    function MiniJQ(elements, nodesStore) {
        this.elements = Array.isArray(elements) ? elements : (elements ? [elements] : []);
        this.nodes = nodesStore || [];
        this.length = this.elements.length;
    }

    MiniJQ.prototype = {
        find: function(selector) {
            if (this.elements.length === 0) return new MiniJQ([], this.nodes);
            let matched = [];
            let addedIds = new Set();
            for (let el of this.elements) {
                let res = querySelectorAll(el, selector, this.nodes);
                for (let r of res) {
                    if (!addedIds.has(r.id)) {
                        addedIds.add(r.id);
                        matched.push(r);
                    }
                }
            }
            return new MiniJQ(matched, this.nodes);
        },

        text: function() {
            if (this.elements.length === 0) return "";
            return getNodeText(this.elements[0], this.nodes, 0);
        },

        html: function() {
            if (this.elements.length === 0) return "";
            let self = this;
            let serialize = function(nodeId, depth) {
                if (depth > 20) return "";
                let node = self.nodes[nodeId];
                if (!node) return "";
                if (node.tag === "#text") return node.text || "";
                let attrs = Object.entries(node.attrs || {}).map(([k, v]) => ` ${k}="${v}"`).join("");
                let childrenHTML = (node.childrenIds || []).map(cid => serialize(cid, depth + 1)).join("");
                return `<${node.tag}${attrs}>${childrenHTML}</${node.tag}>`;
            };
            return (this.elements[0].childrenIds || []).map(cid => serialize(cid, 0)).join("");
        },

        attr: function(name, value) {
            if (value !== undefined) {
                for (let el of this.elements) {
                    if (el && el.tag !== "#text") {
                        if (!el.attrs) el.attrs = {};
                        el.attrs[name] = value;
                    }
                }
                return this;
            }
            if (this.elements.length === 0 || !this.elements[0].attrs) return "";
            return this.elements[0].attrs[name] || "";
        },

        each: function(callback) {
            if (typeof callback !== 'function') return this;
            this.elements.forEach((el, index) => {
                let jqEl = new MiniJQ([el], this.nodes);
                callback.call(jqEl, index, jqEl);
            });
            return this;
        },

        textAll: function(delimiter) {
            if (delimiter === undefined) delimiter = " ";
            let texts = [];
            for (let el of this.elements) {
                texts.push(getNodeText(el, this.nodes, 0));
            }
            return texts.join(delimiter);
        },

        first: function() {
            return new MiniJQ(this.elements.length > 0 ? [this.elements[0]] : [], this.nodes);
        },

        last: function() {
            return new MiniJQ(this.elements.length > 0 ? [this.elements[this.elements.length - 1]] : [], this.nodes);
        },

        eq: function(index) {
            return new MiniJQ(this.elements[index] ? [this.elements[index]] : [], this.nodes);
        },

        parent: function() {
            let parents = [];
            let addedIds = new Set();
            for (let el of this.elements) {
                if (el && el.parentId !== null && el.parentId !== 0) {
                    let pNode = this.nodes[el.parentId];
                    if (pNode && !addedIds.has(pNode.id)) {
                        addedIds.add(pNode.id);
                        parents.push(pNode);
                    }
                }
            }
            return new MiniJQ(parents, this.nodes);
        },

        next: function() {
            let nexts = [];
            for (let el of this.elements) {
                if (!el || el.parentId === null) continue;
                let pNode = this.nodes[el.parentId];
                if (!pNode) continue;

                let siblings = pNode.childrenIds.map(cid => this.nodes[cid]).filter(c => c && c.tag !== "#text");
                let idx = siblings.findIndex(s => s.id === el.id);
                if (idx !== -1 && idx + 1 < siblings.length) {
                    nexts.push(siblings[idx + 1]);
                }
            }
            return new MiniJQ(nexts, this.nodes);
        },

        before: function() {
            let befores = [];
            for (let el of this.elements) {
                if (!el || el.parentId === null) continue;
                let pNode = this.nodes[el.parentId];
                if (!pNode) continue;

                let siblings = pNode.childrenIds.map(cid => this.nodes[cid]).filter(c => c && c.tag !== "#text");
                let idx = siblings.findIndex(s => s.id === el.id);
                if (idx > 0) {
                    befores.push(siblings[idx - 1]);
                }
            }
            return new MiniJQ(befores, this.nodes);
        },

        after: function() {
            return this.next();
        },

        closest: function(selector) {
            let matched = [];
            let addedIds = new Set();
            for (let el of this.elements) {
                let currParentId = el.parentId;
                let depth = 0;
                while (currParentId !== null && currParentId !== 0 && depth++ < 30) {
                    let curr = this.nodes[currParentId];
                    if (!curr) break;
                    if (matchSingleSelector(curr, selector, this.nodes)) {
                        if (!addedIds.has(curr.id)) {
                            addedIds.add(curr.id);
                            matched.push(curr);
                        }
                        break;
                    }
                    currParentId = curr.parentId;
                }
            }
            return new MiniJQ(matched, this.nodes);
        }
    };

    // -------------------------------------------------------------
    // 4. MAIN ENTRY POINT LOGIC FOR _$
    // -------------------------------------------------------------
    try {
        if (!param) return new MiniJQ([], []);
        if (param instanceof MiniJQ) return param;
        if (typeof param === "string") {
            let parsed = parseHTML(param);
            return new MiniJQ(parsed.root, parsed.nodes);
        }
        return new MiniJQ(param, []);
    } catch (err) {
        return new MiniJQ([], []);
    }
}
