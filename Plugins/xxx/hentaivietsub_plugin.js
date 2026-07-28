var BASEURL = "https://hentaivietsub.com"; 
var DEV = true;
function getManifest() {
  return JSON.stringify({
    id: "hentaivietsub",
    name: "Nguồn Hentai Vietsub",
    description: "Nguồn phim Hentai mới.",
    "version": "1.0",
    info: "Đây là trang dự phòng của Hentaiz1 nhưng mượt mà hơn.\n\nNên các bác nên ưu tiên nguồn này..",
    baseUrl: "https://hentaivietsub.com",
    iconUrl: "https://storage.haiten.org/2026/01/fe9f7b29-bb66-48eb-8a6f-ddc42efa00a5.png",
    isEnabled: true,
    "isAdult": true,
    "adblock": false,
    type: "MOVIE",
    playerTpye: "embed",
  });
}


function log(msg) {
  	console.log(msg);
}


function getHomeSections() {
    try {
        var listurl = '[{\"link\":\"/",\"name\":\"Phim Mới\"}]';
        var menulist = buildMenu(listurl, true);
        return JSON.stringify(menulist);
    } catch (e) {
        log("getHomeSections[err]:\n " + e);
        return JSON.stringify([]);
    }
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

// =============================================================================
// HELPER: CURSOR BASE64 ENCODE / DECODE
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        log("getUrlList[url]: \n" + slug);

        // 1. Kiểm tra nếu slug là link tuyệt đối (chứa http)
        if (slug && slug.indexOf("http") > -1) {
            if (slug.indexOf("search") > -1 && filtersJson) {
                var fixedJson1 = filtersJson
                    .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                    .replace(/:,/g, ':');
                try {
                    var filtersSearch = JSON.parse(fixedJson1);
                    var pageSearch = parseInt(filtersSearch.page) || 1;

                    if (pageSearch > 1 && slug.indexOf("page=") === -1) {
                        var sepSearch = slug.indexOf("?") > -1 ? "&" : "?";
                        var resSearch = slug + sepSearch + "page=" + pageSearch;
                        log("getUrlList[url]: \n" + resSearch);
                        return resSearch;
                    }
                } catch (jsonErr) {}
            }
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
        if (page > 1 && resultUrl.indexOf("page=") === -1) {
            var separator = resultUrl.indexOf("?") > -1 ? "&" : "?";
            resultUrl += separator + "page=" + page;
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
        var resultUrl = BASEURL + "/tim-kiem/" + encodedKeyword;

        // 3. Nếu page > 1 thì nối thêm &page=
        if (page > 1) {
            resultUrl += "?page=" + page;
        }

        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalUrl);
        return finalUrl;

    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
        var fallback = BASEURL + "/tim-kiem/" + encodeURIComponent(keyword || "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalFallback);
        return finalFallback;
    }
}
// https://hentaivietsub.com/the-loai/big-boobs?page=3
// https://hentaivietsub.com/tim-kiem/girl?page=3
//var filtersJson = "{page:5}"

//getUrlList("the-loai/big-boobs", filtersJson)
//getUrlSearch("bad girl", filtersJson)
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
        log("parseListResponse[url]: \n" + $url);
        
        // Sử dụng Map để lọc trùng theo tiêu đề/ID chuẩn
        var itemsMap = new Map();

        _$(html).find(".item-box").each(function() {
            var href = this.find("a").attr("href");
            if (!href) return;

            if (href.indexOf("http") == -1) {
                href = BASEURL + href;
            }

            // --- BẮT ĐẦU SỬA ĐỔI TẠI ĐÂY ---
            // Regex hỗ trợ cả 2 dạng: -tap-123 VÀ -123 ở cuối URL
            // Match group 1 = clearhref, Match group 2 = epiNum
            var match = href.match(/^(.*?)(?:-tap-|-)(\d+)\/?$/i);
            
            var clearhref = href;
            var epiNum = 1;

            if (match) {
                clearhref = match[1];            // Ví dụ: https://.../the-animation
                epiNum = parseInt(match[2], 10); // Ví dụ: 1
            } else {
                // Trường hợp URL không có số tập ở cuối (phim lẻ / OVA 1 tập)
                clearhref = href.replace(/\/$/, "");
            }
            // --- KẾT THÚC SỬA ĐỔI ---

            log("clearhref: " + clearhref + " | epiNum: " + epiNum);

            var rawTitle = this.find("a").attr("title") || "";
            var title = rawTitle.replace(/([\s\S]*?) \-.*$/, "$1").trim();

            var episode_current_str = "Tập " + epiNum;
            var finalHref = href + "?current=1&maxEpi=" + epiNum;

            var src = this.find("img").attr("src") || "";
            if (src && src.indexOf("http") == -1) {
                src = BASEURL + src;
            }

            if (href && href.indexOf("http") > -1) {
                var cleanThumb = src.replace(/&amp;/g, '&');

                var newItem = {
                    "id": finalHref,
                    "title": title,
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "quality": "",
                    "lang": "",
                    "episode_current": episode_current_str,
                    "_epiNum": epiNum // Biến tạm để so sánh
                };

                // Dùng clearhref làm Key định danh phim
                var groupKey = clearhref.toLowerCase();

                if (!itemsMap.has(groupKey)) {
                    itemsMap.set(groupKey, newItem);
                } else {
                    // Nếu đã có -> Chỉ ghi đè nếu số tập LỚN HƠN
                    var existingItem = itemsMap.get(groupKey);
                    if (newItem._epiNum > existingItem._epiNum) {
                        itemsMap.set(groupKey, newItem);
                    }
                }
            }
        });

        // Chuyển Map thành Array và xóa bỏ trường tạm `_epiNum`
        var items = Array.from(itemsMap.values()).map(function(item) {
            delete item._epiNum;
            return item;
        });

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": 1,
                "totalPages": 999
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
function parseListResponse(html, $url) {
    try {
        log("parseListResponse[url]: \n" + $url);
        
        // Sử dụng Map để lọc trùng theo tiêu đề/ID chuẩn
        var itemsMap = new Map();

        _$(html).find(".item-box").each(function() {
            var href = this.find("a").attr("href");
            if (!href) return;

            if (href.indexOf("http") == -1) {
                href = BASEURL + href;
            }

            // --- BẮT ĐẦU SỬA ĐỔI TẠI ĐÂY ---
            // Regex hỗ trợ cả 2 dạng: -tap-123 VÀ -123 ở cuối URL
            // Match group 1 = clearhref, Match group 2 = epiNum
            var match = href.match(/^(.*?)(?:-tap-|-)(\d+)\/?$/i);
            
            var clearhref = href;
            var epiNum = 1;

            if (match) {
                clearhref = match[1];            // Ví dụ: https://.../the-animation
                epiNum = parseInt(match[2], 10); // Ví dụ: 1
            } else {
                // Trường hợp URL không có số tập ở cuối (phim lẻ / OVA 1 tập)
                clearhref = href.replace(/\/$/, "");
            }
            // --- KẾT THÚC SỬA ĐỔI ---

            log("clearhref: " + clearhref + " | epiNum: " + epiNum);

            var rawTitle = this.find("a").attr("title") || "";
            var title = rawTitle.replace(/([\s\S]*?) \-.*$/, "$1").trim();

            var episode_current_str = "Tập " + epiNum;
            var finalHref = href + "?current=1&maxEpi=" + epiNum;

            var src = this.find("img").attr("src") || "";
            if (src && src.indexOf("http") == -1) {
                src = BASEURL + src;
            }

            if (href && href.indexOf("http") > -1) {
                var cleanThumb = src.replace(/&amp;/g, '&');

                var newItem = {
                    "id": finalHref,
                    "title": title,
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "quality": "",
                    "lang": "",
                    "episode_current": episode_current_str,
                    "_epiNum": epiNum // Biến tạm để so sánh
                };

                // Dùng clearhref làm Key định danh phim
                var groupKey = clearhref.toLowerCase();

                if (!itemsMap.has(groupKey)) {
                    itemsMap.set(groupKey, newItem);
                } else {
                    // Nếu đã có -> Chỉ ghi đè nếu số tập LỚN HƠN
                    var existingItem = itemsMap.get(groupKey);
                    if (newItem._epiNum > existingItem._epiNum) {
                        itemsMap.set(groupKey, newItem);
                    }
                }
            }
        });

        // Chuyển Map thành Array và xóa bỏ trường tạm `_epiNum`
        var items = Array.from(itemsMap.values()).map(function(item) {
            delete item._epiNum;
            return item;
        });

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": 1,
                "totalPages": 999
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
}

function decodeHTMLEntities(str) {
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

        // === BƯỚC 1: ĐỒNG NHẤT ID PHIM BẰNG REGEX META ===
        var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html) ||
            /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(html);
        var id = idMatch ? idMatch[1] : (url || "");

        var slug = "";
        if (id) {
            var slugMatch = /\/phim\/([^/_.]+)/.exec(id);
            slug = slugMatch ? slugMatch[1] : id;
        }
        if (!slug) {
            var slugMatch2 = /\/phim\/([^/_.]+)/.exec(html);
            slug = slugMatch2 ? slugMatch2[1] : "";
        }

        // === BƯỚC 2: TRÍCH XUẤT THÔNG TIN PHIM ===
        var lurl = "";
        var limg = "";
        var lname = "Đang cập nhật...";
        var ldes = "Không có mô tả.";
        var ldirec = "";
        var lactor = "";
        var lduran = "";
        var status = "";
        var category = "";
        var episode_current = "";

        var rmatch = html.match(/meta\s+property="og:url"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lurl = rmatch[1];

        rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) limg = rmatch[1];

        lname = _$(html).find(".video-details__information__details__link").text().trim();
        ldes = _$(html).find(".video-details__contents__tags").next().text("\n\n");

        var year = 2026;
        var extra = "";
        ldirec = _$(html).find(".movie-tag-pill").textAll(" - ");
        var categoryResult = [];
        _$(html).find(".video-details__information__details").find(".mb-5").find("a").each(function() {
            var link = this.attr("href") || this.find("a").attr("href");
            var name = this.text().replace(/\s+/g, " ").trim();
            name = decodeHTMLEntities(name);
            if (name && link) {
                var slug = typeof getSlug === "function" ? getSlug(link) : link;
                categoryResult.push("[" + name + "](" + slug.replace(BASEURL, "") + ")");
            }
        });
        ldirec = categoryResult.join(", ");

        categoryResult = [];
        _$(html).find(".video-details__contents__tags").find("a").each(function() {
            var link = this.attr("href") || this.find("a").attr("href");
            var name = this.text().replace(/\s+/g, " ").trim();
            name = decodeHTMLEntities(name);
            if (name && link) {
                var slug = typeof getSlug === "function" ? getSlug(link) : link;
                categoryResult.push("[" + name + "](" + slug.replace(BASEURL, "") + ")");
            }
        });
        category = categoryResult.join(", ");

        status = _$(html).find(".video-details__information__details__heading").text();

        var servers = [];
        var rawUrl = url.replace(/([\s\S]*?)-tap-.*$/i, "$1");
        var maxSv = _$(html).find(".cdn-selector-wrapper").find("button").length;
        var match = url.match(/current=(\d+)&maxEpi=(\d+)/i);

        if (match && match[1] && match[2]) {
            var maxEpi = Number(match[2]) + 1;
            var tapped = "";
            if (url.indexOf("-tap") > -1) {
                tapped = "tap-"
            }
            // Giới hạn số lượng server tối đa (ví dụ từ 1 đến maxSv)
            for (var sv = 1; sv <= maxSv; sv++) {
                var episodes = [];
                for (var $j = 1; $j < maxEpi; $j++) {

                    episodes.push({
                        id: rawUrl + "-" + tapped + $j + "?current=" + $j + "&maxEpi=" + match[2] + "&server=" + sv,
                        name: "Tập " + $j,
                        slug: "tap-" + $j
                    });
                }
                servers.push({
                    name: "Server " + sv,
                    episodes: episodes
                });
            }
        }

        log("server: " + JSON.stringify(servers));
        return JSON.stringify({
            id: url,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
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
            id: slug || url || "error",
            title: "error",
            servers: []
        });
    }
}
//var html = sourceHTML;
//var url = "https://hentaivietsub.com/hentai/enjo-kouhai-tap-11?//current=1&maxEpi=11"
//JSON.parse(parseMovieDetail(sourceHTML, url))



function parseDetailResponse(html, url) {
  try {
    var baseLink = url;
    var stream = url;
    log("[parseDetailResponse Đang xử lý]: " + url);
    var body = html.length;
    if(body < 10){
        log("Trang bị lỗi, xử lý lại url.")
        if(baseLink.indexOf("-tap-") > -1){
          stream = baseLink.replace("-tap-","-");
        }    
        else{
          stream = baseLink.replace(/-(\d+)/,"-tap-$1");
        }
        log("url đã chưa xử lý: " + baseLink + "\n\n" + "url đã xử lý: " + stream)
    }
    var customJS = rawJS();
    return JSON.stringify({
      url: stream,
      isEmbed: false,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: BASEURL,
        "Custom-Js": customJS
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


function rawJS() {

  return `
(function () {
    var LOGGER = true;

    function log(msg) {
        if (!LOGGER) return;
        try {
            var strMsg = String(msg);
            var logMessage = '[CustomJS] ' + strMsg;
            if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
                window.SnifferBridge.log(logMessage);
            } else if (typeof console !== 'undefined' && console.log) {
                console.log(logMessage);
            }
        } catch (e) {}
    }

    function getSafeContainer() {
        var topBar = document.getElementById('v-top-bar');
        if (topBar) return topBar;
        return document.body || document.documentElement;
    }

    function showToast(msg, timer) {
        if (!timer) timer = 5000;
        log('[Toast] ' + msg);
        try {
            if (window.SnifferBridge && typeof window.SnifferBridge.toast === 'function') {
                window.SnifferBridge.toast(String(msg), timer);
            }
        } catch (e) {}

        try {
            var parent = getSafeContainer();
            if (!parent) return;

            var oldToast = document.getElementById('v-safe-notice');
            if (oldToast) oldToast.remove();

            var toast = document.createElement('div');
            toast.id = 'v-safe-notice';
            toast.style.cssText = 
                'position: fixed !important; top: 20px !important; left: 50% !important; ' +
                'transform: translateX(-50%) !important; z-index: 2147483647 !important; ' +
                'background: rgba(18, 18, 18, 0.95) !important; color: #fff !important; ' +
                'padding: 10px 18px !important; border-radius: 20px !important; ' +
                'font-family: sans-serif !important; font-size: 13px !important; font-weight: 600 !important; ' +
                'box-shadow: 0 4px 16px rgba(0,0,0,0.6) !important; border: 1px solid rgba(229,9,20,0.8) !important; ' +
                'pointer-events: none !important; backdrop-filter: blur(8px) !important; text-align: center !important; ' +
                'white-space: nowrap !important; transition: opacity 0.4s ease !important;';
            
            toast.textContent = String(msg);
            parent.appendChild(toast);

            setTimeout(function() {
                if (toast && toast.parentNode) {
                    toast.style.opacity = '0';
                    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 400);
                }
            }, 3000);
        } catch(e) {}
    }

    function ensureDOMReady(callback) {
        if (document && (document.body || document.documentElement)) {
            callback();
        } else {
            var checkTimer = setInterval(function () {
                if (document && (document.body || document.documentElement)) {
                    clearInterval(checkTimer);
                    callback();
                }
            }, 50);
        }
    }

    var SmartStorage = (function() {
        var memCache = {};

        function isStorageSupported(type) {
            try {
                var storage = window[type];
                if (!storage) return false;
                var testKey = '__test_stg__';
                storage.setItem(testKey, '1');
                storage.removeItem(testKey);
                return true;
            } catch (e) {
                return false;
            }
        }

        var hasLocal = isStorageSupported('localStorage');
        var hasSession = isStorageSupported('sessionStorage');

        function getCookie(name) {
            try {
                var nameEQ = encodeURIComponent(name) + "=";
                var ca = document.cookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i].trim();
                    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
                }
            } catch(e) { log('[Storage Error] Lỗi đọc Cookie: ' + e.message); }
            return null;
        }

        function setCookie(name, value, days) {
            try {
                var expires = "";
                if (days) {
                    var date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toUTCString();
                }
                document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value || "") + expires + "; path=/; SameSite=Lax";
                return true;
            } catch(e) { 
                log('[Storage Error] Lỗi ghi Cookie: ' + e.message);
                return false; 
            }
        }

        function getWinNameData() {
            try {
                if (window.name && window.name.indexOf('{') === 0) {
                    return JSON.parse(window.name);
                }
            } catch(e) {}
            return {};
        }

        function setWinNameData(key, val) {
            try {
                var data = getWinNameData();
                data[key] = val;
                window.name = JSON.stringify(data);
                return true;
            } catch(e) { return false; }
        }

        return {
            getItem: function(key, defaultVal) {
                var val = null;
                var src = '';
                if (hasLocal) { try { val = localStorage.getItem(key); if (val !== null) src = 'localStorage'; } catch(e) {} }
                if (val === null && hasSession) { try { val = sessionStorage.getItem(key); if (val !== null) src = 'sessionStorage'; } catch(e) {} }
                if (val === null) { val = getCookie(key); if (val !== null) src = 'cookie'; }
                if (val === null) {
                    var wData = getWinNameData();
                    if (wData[key] !== undefined) { val = wData[key]; src = 'window.name'; }
                }
                if (val === null && memCache[key] !== undefined) { val = memCache[key]; src = 'memCache'; }
                
                log('[Storage Get] Key=' + key + ' | Nguồn=' + (src || 'Không có') + ' | Val=' + val);
                return val !== null ? val : defaultVal;
            },

            setItem: function(key, val) {
                memCache[key] = val;
                var savedSources = [];
                if (hasLocal) { try { localStorage.setItem(key, val); savedSources.push('localStorage'); } catch(e) { log('[Storage Err] LocalStorage full/blocked'); } }
                if (hasSession) { try { sessionStorage.setItem(key, val); savedSources.push('sessionStorage'); } catch(e) {} }
                if (setCookie(key, val, 30)) savedSources.push('cookie');
                if (setWinNameData(key, val)) savedSources.push('window.name');
                
                log('[Storage Set] Key=' + key + ' | Val=' + val + ' | Đã lưu vào: [' + savedSources.join(', ') + ']');
            }
        };
    })();

    (function applyAntiPopupShield() {
        try {
            var dummyWin = { focus: function () {}, blur: function () {}, close: function () {}, closed: true, postMessage: function () {} };
            
            window.open = function (url) {
                log('[Anti-Popup] Chặn window.open: ' + url);
                return dummyWin;
            };

            try {
                window.location.assign = function (url) { log('[Anti-Redirect] Chặn assign: ' + url); };
                window.location.replace = function (url) { log('[Anti-Redirect] Chặn replace: ' + url); };
            } catch (e) {}

            var blockHandler = function (e) {
                var target = e.target;
                while (target && target !== document) {
                    if (target.id && target.id.indexOf('v-') === 0) {
                        return;
                    }

                    if (target.tagName === 'A') {
                        var href = target.getAttribute('href');
                        var attrTarget = target.getAttribute('target');
                        
                        if (attrTarget === '_blank' || target.target === '_blank' || (href && href.startsWith('http') && !href.includes(window.location.hostname))) {
                            e.preventDefault();
                            e.stopPropagation();
                            log('[Anti-Popup] Đã chặn click chuyển hướng/quảng cáo từ thẻ A: ' + href);
                            return false;
                        }
                    }
                    target = target.parentNode;
                }
            };

            window.addEventListener('click', blockHandler, true);
            window.addEventListener('touchstart', blockHandler, true);

        } catch (e) {}
    })();

    const CHECK_SPEED = 200;
    var urlInfo = null;
    var currentServers = [];
    var selectedServerIdx = 0;
    var selectedServerHost = '';

    // KHÔNG SỬ DỤNG CÁC SERVER CHỨA DOMAIN BÊN DƯỚI
    function isBlacklistedServer(urlStr) {
        if (!urlStr) return true;
        var blacklistedDomains = ['streamforester.name'];
        for (var i = 0; i < blacklistedDomains.length; i++) {
            if (urlStr.indexOf(blacklistedDomains[i]) !== -1) {
                log('[Server Filter] Đã loại bỏ server bị cấm: ' + urlStr);
                return true;
            }
        }
        return false;
    }

    function getHostFromUrl(urlStr) {
        try {
            if (!urlStr) return '';
            var a = document.createElement('a');
            a.href = urlStr;
            return a.hostname || '';
        } catch(e) {
            return '';
        }
    }

    function injectStyles() {
        try {
            if (document.getElementById('v-style-block')) return;
            const style = document.createElement('style');
            style.id = 'v-style-block';
            style.textContent = 
                '#underPlayerAdsContainer, #bottomBannerContainer { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }' +
                '#v-top-bar { position: fixed !important; top: 12px !important; right: 12px !important; z-index: 2147483647 !important; display: flex !important; gap: 8px !important; align-items: center !important; font-family: sans-serif !important; transition: opacity 0.4s ease !important; opacity: 1; }' +
                '.v-btn-act { background: rgba(15, 15, 15, 0.9) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.3) !important; padding: 8px 14px !important; border-radius: 6px !important; font-size: 13px !important; font-weight: bold !important; cursor: pointer !important; backdrop-filter: blur(8px) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.6) !important; }' +
                '.v-btn-act:active { background: #e50914 !important; }' +
                
                '#v-box-list, #v-hist-dropdown, #v-server-dropdown { display: none; position: absolute !important; top: 100% !important; right: 0 !important; margin-top: 6px !important; background: rgba(15, 15, 15, 0.95) !important; padding: 10px !important; border-radius: 8px !important; border: 1px solid rgba(255,255,255,0.2) !important; z-index: 2147483647 !important; backdrop-filter: blur(10px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.8) !important; }' +
                '#v-box-list { grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)) !important; gap: 6px !important; width: 230px !important; max-height: 220px !important; overflow-y: auto !important; }' +
                '#v-hist-dropdown, #v-server-dropdown { width: 220px !important; max-width: 80vw !important; flex-direction: column !important; gap: 6px !important; }' +
                
                '#v-box-list.closed, #v-hist-dropdown.closed, #v-server-dropdown.closed { display: none !important; }' +
                '#v-box-list.open { display: grid !important; }' +
                '#v-hist-dropdown.open, #v-server-dropdown.open { display: flex !important; }' +
                
                '.v-item-node { background: #222 !important; color: #fff !important; border: 1px solid #444 !important; border-radius: 5px !important; padding: 6px 0 !important; font-size: 12px !important; font-weight: bold !important; cursor: pointer !important; text-align: center !important; }' +
                '.v-item-node.active { background: #e50914 !important; border-color: #ff333d !important; }' +
                '.v-arrow-btn { position: fixed !important; top: 50% !important; transform: translateY(-50%) !important; z-index: 2147483647 !important; background: rgba(0,0,0,0.6) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.3) !important; width: 42px !important; height: 42px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 18px !important; cursor: pointer !important; user-select: none !important; transition: opacity 0.4s ease !important; opacity: 1; }' +
                '#v-arrow-prev { left: 12px !important; } #v-arrow-next { right: 12px !important; }';

            (document.head || document.documentElement).appendChild(style);
        } catch (e) {}
    }

    function applyMobileViewport() {
        try {
            var meta = document.querySelector('meta[name="viewport"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = 'viewport';
                (document.head || document.documentElement).appendChild(meta);
            }
            if (meta) meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        } catch (e) {}
    }

    var loadingTimeoutTimer = null;

    function showLoadingScreen() {
        var parent = document.body || document.documentElement;
        if (!parent) return;

        if (loadingTimeoutTimer) clearTimeout(loadingTimeoutTimer);

        var loadingDiv = document.getElementById('v-stage-layer');
        if (!loadingDiv) {
            loadingDiv = document.createElement('div');
            loadingDiv.id = 'v-stage-layer';
            loadingDiv.style.cssText = 
                'position: fixed !important; top: 0 !important; left: 0 !important;' +
                'width: 100vw !important; height: 100vh !important; background-color: #0d0d0d !important;' +
                'display: flex !important; flex-direction: column !important; justify-content: center !important;' +
                'align-items: center !important; z-index: 2147483646 !important; font-family: sans-serif !important; cursor: pointer !important;';

            loadingDiv.innerHTML = 
                '<div class="v-ring-spin"></div>' +
                '<div style="color:#ccc; margin-top:16px; font-size:14px; text-align:center;">Đang tải trình phát...<br><small style="color:#777; font-size:11px;">(Chạm vào màn hình để đóng)</small></div>' +
                '<style>' +
                '.v-ring-spin { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.1); border-left-color: #e50914; border-radius: 50%; animation: v-spin 0.8s linear infinite; }' +
                '@keyframes v-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' +
                '</style>';

            loadingDiv.onclick = function() { hideLoadingScreen(); };
            parent.appendChild(loadingDiv);
        } else {
            loadingDiv.style.display = 'flex';
        }

        loadingTimeoutTimer = setTimeout(function() {
            hideLoadingScreen();
        }, 8000);
    }

    function hideLoadingScreen() {
        try {
            if (loadingTimeoutTimer) clearTimeout(loadingTimeoutTimer);
            var elem = document.getElementById('v-stage-layer');
            if (elem) elem.remove();
        } catch (e) {}
    }

    ensureDOMReady(function() {
        applyMobileViewport();
        showLoadingScreen();
    });

    function parseUrlInfo() {
        try {
            const url = new URL(window.location.href);
            const pathParts = url.pathname.split('/').filter(Boolean);
            const lastSlug = pathParts[pathParts.length - 1] || '';

            var currentParam = url.searchParams.get('current');
            var current = currentParam ? parseInt(currentParam) : null;

            if (!current || isNaN(current)) {
                var match = lastSlug.match(/(?:tap|episode|ep)[-_]?(\\d+)/i) || lastSlug.match(/-(\\d+)$/);
                if (match) {
                    current = parseInt(match[1]);
                }
            }

            if (!current) current = 1;

            const maxEpi = parseInt(url.searchParams.get('maxEpi')) || Math.max(current, 1);
            const baseSlug = lastSlug.replace(/(?:[-_]tap|[-_]ep)?[-_]\\d+$/i, '');
            const seriesKey = baseSlug || 'default_series';

            const getEpiUrl = function (epiNum) {
                var newPath = url.pathname;
                if (lastSlug.match(/-\\d+$/) || lastSlug.match(/-tap-\\d+$/)) {
                    newPath = url.pathname.replace(lastSlug, baseSlug + '-' + epiNum);
                }
                return url.origin + newPath + '?current=' + epiNum + '&maxEpi=' + maxEpi;
            };

            log('[Parse URL] SeriesKey=' + seriesKey + ' | Tập hiện tại=' + current + ' | MaxEpi=' + maxEpi);
            return { current: current, maxEpi: maxEpi, baseSlug: baseSlug, seriesKey: seriesKey, getEpiUrl: getEpiUrl, fullUrl: url.href };
        } catch (e) {
            log('[Parse URL Error]: ' + e.message);
            return { current: 1, maxEpi: 1, baseSlug: '', seriesKey: 'default', getEpiUrl: function () { return window.location.href; } };
        }
    }

    function getFallbackUrl(baseLink) {
        var stream = "";
        if (baseLink.indexOf("-tap-") > -1) {
            stream = baseLink.replace("-tap-", "-");
        } else {
            stream = baseLink.replace(/-(\\d+)/, "-tap-$1");
        }
        return stream;
    }

    function extractDataSources(doc) {
        var sources = [];
        if (!doc) return sources;
        try {
            var btns = doc.querySelectorAll('[data-source]');
            for (var i = 0; i < btns.length; i++) {
                var src = btns[i].getAttribute('data-source');
                if (src && !isBlacklistedServer(src)) {
                    var sName = btns[i].textContent.trim() || btns[i].getAttribute('title') || ('Server ' + (sources.length + 1));
                    sources.push({
                        name: sName,
                        src: src
                    });
                }
            }
        } catch (e) {}
        return sources;
    }

    function getHistory(seriesKey) {
        var raw = SmartStorage.getItem('watch_hist_' + seriesKey, null);
        if (!raw) return null;
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
            log('[Get History Err] JSON Parse lỗi: ' + e.message);
            return null;
        }
    }

    function saveHistory(seriesKey, epiNum) {
        log('[Save History] Đang lưu lịch sử phim [' + seriesKey + '] -> Tập ' + epiNum);
        var data = JSON.stringify({
            lastEpi: parseInt(epiNum),
            time: Date.now()
        });
        SmartStorage.setItem('watch_hist_' + seriesKey, data);
    }

    var FIT_MODES = [
        { key: 'fill', label: '↔️ Co giãn' },
        { key: 'contain', label: '📐 Vừa khung' },
        { key: 'cover', label: '🔍 Phóng to' }
    ];

    var currentFitIndex = -1;

    function getCurrentFitIndex() {
        if (currentFitIndex === -1) {
            var savedFitKey = SmartStorage.getItem('watch_player_fit_mode', 'fill');
            currentFitIndex = FIT_MODES.findIndex(function(m) { return m.key === savedFitKey; });
            if (currentFitIndex === -1) currentFitIndex = 0;
        }
        return currentFitIndex;
    }

    function getScreenSize() {
        var w = Math.max(document.documentElement ? document.documentElement.clientWidth : 0, window.innerWidth || 0, screen.width || 0);
        var h = Math.max(document.documentElement ? document.documentElement.clientHeight : 0, window.innerHeight || 0, screen.height || 0);
        return { width: w, height: h };
    }

    function updatePlayerDimensions() {
        var player = document.getElementById('v-media-frame');
        if (!player) return;

        var sz = getScreenSize();
        var mode = FIT_MODES[getCurrentFitIndex()].key;

        player.style.position = 'fixed';
        player.style.margin = '0px';
        player.style.padding = '0px';
        player.style.border = '0px none';
        player.style.zIndex = '1';

        if (mode === 'fill') {
            player.style.top = '0px';
            player.style.left = '0px';
            player.style.width = sz.width + 'px';
            player.style.height = sz.height + 'px';
            player.style.transform = 'none';
        } else if (mode === 'contain' || mode === 'cover') {
            var targetRatio = 16 / 9;
            var currentRatio = sz.width / sz.height;
            var finalW, finalH;

            var isContain = (mode === 'contain');
            if ((currentRatio > targetRatio && isContain) || (currentRatio <= targetRatio && !isContain)) {
                finalH = sz.height;
                finalW = sz.height * targetRatio;
            } else {
                finalW = sz.width;
                finalH = sz.width / targetRatio;
            }

            player.style.width = Math.round(finalW) + 'px';
            player.style.height = Math.round(finalH) + 'px';
            player.style.top = Math.round((sz.height - finalH) / 2) + 'px';
            player.style.left = Math.round((sz.width - finalW) / 2) + 'px';
            player.style.transform = 'none';
        }
    }

    function applyFitMode(index) {
        currentFitIndex = index % FIT_MODES.length;
        var mode = FIT_MODES[currentFitIndex];

        SmartStorage.setItem('watch_player_fit_mode', mode.key);

        var fitBtn = document.getElementById('v-btn-mode');
        if (fitBtn) fitBtn.innerHTML = mode.label;

        updatePlayerDimensions();
    }

    window.addEventListener('resize', function() { updatePlayerDimensions(); });
    window.addEventListener('orientationchange', function() { setTimeout(updatePlayerDimensions, 300); });

    var idleTimer = null;
    const IDLE_TIMEOUT = 10000;

    function resetIdleTimer() {
        var topBar = document.getElementById('v-top-bar');
        var prevBtn = document.getElementById('v-arrow-prev');
        var nextBtn = document.getElementById('v-arrow-next');

        if (topBar) topBar.style.opacity = '1';
        if (prevBtn) prevBtn.style.opacity = '1';
        if (nextBtn) nextBtn.style.opacity = '1';

        if (idleTimer) clearTimeout(idleTimer);

        idleTimer = setTimeout(function () {
            var gridDiv = document.getElementById('v-box-list');
            var histDiv = document.getElementById('v-hist-dropdown');
            var serverDiv = document.getElementById('v-server-dropdown');
            if (gridDiv) gridDiv.className = 'closed';
            if (histDiv) histDiv.className = 'closed';
            if (serverDiv) serverDiv.className = 'closed';

            if (topBar) topBar.style.opacity = '0.2';
            if (prevBtn) prevBtn.style.opacity = '0.2';
            if (nextBtn) nextBtn.style.opacity = '0.2';
        }, IDLE_TIMEOUT);
    }

    function setupIdleEvents() {
        var events = ['mousemove', 'mousedown', 'touchstart', 'touchmove', 'click', 'keydown', 'scroll'];
        events.forEach(function (evt) {
            window.addEventListener(evt, resetIdleTimer, { passive: true });
        });
        resetIdleTimer();
    }

    function selectMatchedServer() {
        if (!currentServers || currentServers.length === 0) return 0;
        
        if (selectedServerHost) {
            for (var i = 0; i < currentServers.length; i++) {
                var h = getHostFromUrl(currentServers[i].src);
                if (h && h === selectedServerHost) {
                    log('[Server Match] Khớp Server theo Host: ' + h);
                    return i;
                }
            }
        }

        if (selectedServerIdx >= 0 && selectedServerIdx < currentServers.length) {
            return selectedServerIdx;
        }

        return 0;
    }

    function switchEpisode(targetUrl) {
        showLoadingScreen();
        
        var fetchUrlWithRetry = function(urlToFetch, isFallbackAttempt) {
            var bgFrame = document.createElement('iframe');
            bgFrame.style.display = 'none';
            bgFrame.id = 'bg-fetch-frame';
            bgFrame.src = urlToFetch;

            var oldFrame = document.getElementById('bg-fetch-frame');
            if (oldFrame) oldFrame.remove();

            (document.body || document.documentElement).appendChild(bgFrame);

            var attempts = 0;
            var maxAttempts = 35;
            
            var bgTimer = setInterval(function () {
                attempts++;
                try {
                    var doc = bgFrame.contentDocument || bgFrame.contentWindow.document;
                    if (doc) {
                        var sources = extractDataSources(doc);
                        var is404 = doc.title && (doc.title.includes('404') || doc.title.includes('Not Found'));

                        if (sources.length > 0) {
                            clearInterval(bgTimer);
                            bgFrame.remove();

                            currentServers = sources;

                            selectedServerIdx = selectMatchedServer();
                            var targetServer = currentServers[selectedServerIdx];
                            selectedServerHost = getHostFromUrl(targetServer.src);

                            var mainPlayer = document.getElementById('v-media-frame');
                            if (mainPlayer) {
                                mainPlayer.src = targetServer.src;
                                setTimeout(hideLoadingScreen, 1200);
                            } else {
                                hideLoadingScreen();
                            }
                            
                            window.history.pushState({}, '', urlToFetch);
                            urlInfo = parseUrlInfo();
                            
                            buildUI(false);
                            showToast('Đã chuyển sang Tập ' + urlInfo.current + ' (' + targetServer.name + ')');
                            return;
                        }

                        if ((is404 || attempts >= maxAttempts) && !isFallbackAttempt) {
                            clearInterval(bgTimer);
                            bgFrame.remove();
                            var fallbackUrl = getFallbackUrl(urlToFetch);
                            log('[Fetch Retry] Đang thử URL thay thế: ' + fallbackUrl);
                            fetchUrlWithRetry(fallbackUrl, true);
                            return;
                        }
                    }
                } catch (e) {}

                if (attempts >= maxAttempts) {
                    clearInterval(bgTimer);
                    bgFrame.remove();
                    hideLoadingScreen();
                    alert('Tập phim bị lỗi, Không thể tải được!');
                }
            }, CHECK_SPEED);
        };

        fetchUrlWithRetry(targetUrl, false);
    }

    function buildUI(isInitialLoad) {
        log('[Build UI] Tiến hành dựng giao diện... (isInitialLoad=' + isInitialLoad + ')');
        injectStyles();
        applyMobileViewport();

        var parent = document.body || document.documentElement;
        if (!parent) return;

        var oldHeader = document.getElementById('v-top-bar');
        if (oldHeader) oldHeader.remove();
        var oldPrev = document.getElementById('v-arrow-prev');
        if (oldPrev) oldPrev.remove();
        var oldNext = document.getElementById('v-arrow-next');
        if (oldNext) oldNext.remove();

        var prevHist = getHistory(urlInfo.seriesKey);
        var oldEpi = (prevHist && prevHist.lastEpi !== undefined) ? parseInt(prevHist.lastEpi) : null;

        saveHistory(urlInfo.seriesKey, urlInfo.current);

        const headerDiv = document.createElement('div');
        headerDiv.id = 'v-top-bar';

        const fitBtn = document.createElement('button');
        fitBtn.id = 'v-btn-mode';
        fitBtn.className = 'v-btn-act';
        fitBtn.innerHTML = FIT_MODES[getCurrentFitIndex()].label;
        fitBtn.onclick = function (e) {
            e.stopPropagation();
            applyFitMode(getCurrentFitIndex() + 1);
            resetIdleTimer();
        };

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'v-btn-epi';
        toggleBtn.className = 'v-btn-act';
        toggleBtn.innerHTML = 'Tập ' + urlInfo.current + ' &#9660;';

        const gridDiv = document.createElement('div');
        gridDiv.id = 'v-box-list';
        gridDiv.className = 'closed';

        for (let i = 1; i <= urlInfo.maxEpi; i++) {
            (function (epiNum) {
                const btn = document.createElement('button');
                btn.className = 'v-item-node' + (epiNum === urlInfo.current ? ' active' : '');
                btn.textContent = 'Tập ' + epiNum;
                btn.onclick = function (e) {
                    e.stopPropagation();
                    gridDiv.className = 'closed';
                    histDiv.className = 'closed';
                    if (serverDiv) serverDiv.className = 'closed';
                    if (epiNum !== urlInfo.current) switchEpisode(urlInfo.getEpiUrl(epiNum));
                };
                gridDiv.appendChild(btn);
            })(i);
        }

        const epiWrapper = document.createElement('div');
        epiWrapper.style.position = 'relative';
        epiWrapper.appendChild(toggleBtn);
        epiWrapper.appendChild(gridDiv);

        var serverWrapper = null;
        var serverDiv = null;

        if (currentServers && currentServers.length > 1) {
            const serverBtn = document.createElement('button');
            serverBtn.id = 'v-btn-server';
            serverBtn.className = 'v-btn-act';
            serverBtn.innerHTML = '🖥️ ' + (currentServers[selectedServerIdx] ? currentServers[selectedServerIdx].name : 'Server') + ' &#9660;';

            serverDiv = document.createElement('div');
            serverDiv.id = 'v-server-dropdown';
            serverDiv.className = 'closed';

            currentServers.forEach(function(s, idx) {
                const sBtn = document.createElement('button');
                sBtn.className = 'v-item-node' + (idx === selectedServerIdx ? ' active' : '');
                sBtn.style.padding = '8px';
                sBtn.textContent = s.name;
                sBtn.onclick = function(e) {
                    e.stopPropagation();
                    selectedServerIdx = idx;
                    selectedServerHost = getHostFromUrl(s.src);
                    
                    serverDiv.className = 'closed';
                    serverBtn.innerHTML = '🖥️ ' + s.name + ' &#9660;';
                    
                    showLoadingScreen();
                    var mainPlayer = document.getElementById('v-media-frame');
                    if (mainPlayer) {
                        mainPlayer.src = s.src;
                        setTimeout(hideLoadingScreen, 1200);
                    } else {
                        hideLoadingScreen();
                    }
                    showToast('Đã đổi sang ' + s.name);
                };
                serverDiv.appendChild(sBtn);
            });

            serverWrapper = document.createElement('div');
            serverWrapper.style.position = 'relative';
            serverWrapper.appendChild(serverBtn);
            serverWrapper.appendChild(serverDiv);

            serverBtn.onclick = function (e) {
                e.stopPropagation();
                gridDiv.className = 'closed';
                histDiv.className = 'closed';
                serverDiv.className = serverDiv.classList.contains('open') ? 'closed' : 'open';
                resetIdleTimer();
            };
        }

        const histBtn = document.createElement('button');
        histBtn.id = 'v-btn-hist';
        histBtn.className = 'v-btn-act';
        histBtn.innerHTML = '📜 Lịch sử';

        const histDiv = document.createElement('div');
        histDiv.id = 'v-hist-dropdown';
        histDiv.className = 'closed';

        var targetHistEpi = (oldEpi !== null && oldEpi !== urlInfo.current) ? oldEpi : urlInfo.current;
        var nextEpi = (targetHistEpi < urlInfo.maxEpi) ? targetHistEpi + 1 : targetHistEpi;

        if (oldEpi !== null) {
            histDiv.innerHTML = 
                '<div style="font-size: 12px; line-height: 1.4; color: #eee; font-weight: 500;">' +
                'Lần trước xem đến <b>Tập ' + oldEpi + '</b>.' +
                '</div>' +
                '<div style="display: flex; gap: 6px; flex-direction: column; margin-top: 2px;">' +
                    '<button id="v-btn-hist-prev" style="background: #e50914; color: #fff; border: none; padding: 7px 4px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Phát Tập ' + targetHistEpi + '</button>' +
                    '<button id="v-btn-hist-next" style="background: #2b2b2b; color: #fff; border: 1px solid #555; padding: 7px 4px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Phát Tập ' + nextEpi + '</button>' +
                '</div>';
        } else {
            histDiv.innerHTML = '<div style="font-size: 12px; color: #aaa; text-align: center;">Chưa có lịch sử tập cũ.</div>';
        }

        const histWrapper = document.createElement('div');
        histWrapper.style.position = 'relative';
        histWrapper.appendChild(histBtn);
        histWrapper.appendChild(histDiv);

        toggleBtn.onclick = function (e) {
            e.stopPropagation();
            histDiv.className = 'closed';
            if (serverDiv) serverDiv.className = 'closed';
            gridDiv.className = gridDiv.classList.contains('open') ? 'closed' : 'open';
            resetIdleTimer();
        };

        histBtn.onclick = function (e) {
            e.stopPropagation();
            gridDiv.className = 'closed';
            if (serverDiv) serverDiv.className = 'closed';
            histDiv.className = histDiv.classList.contains('open') ? 'closed' : 'open';
            resetIdleTimer();
        };

        document.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('#v-top-bar')) {
                return;
            }
            if (gridDiv) gridDiv.className = 'closed';
            if (histDiv) histDiv.className = 'closed';
            if (serverDiv) serverDiv.className = 'closed';
        });

        var btnPrev = histDiv.querySelector('#v-btn-hist-prev');
        if (btnPrev) {
            btnPrev.onclick = function(e) {
                e.stopPropagation();
                histDiv.className = 'closed';
                if (targetHistEpi !== urlInfo.current) switchEpisode(urlInfo.getEpiUrl(targetHistEpi));
            };
        }

        var btnNext = histDiv.querySelector('#v-btn-hist-next');
        if (btnNext) {
            btnNext.onclick = function(e) {
                e.stopPropagation();
                histDiv.className = 'closed';
                if (nextEpi !== urlInfo.current) switchEpisode(urlInfo.getEpiUrl(nextEpi));
            };
        }

        headerDiv.appendChild(fitBtn);
        headerDiv.appendChild(epiWrapper);
        if (serverWrapper) headerDiv.appendChild(serverWrapper);
        headerDiv.appendChild(histWrapper);
        parent.appendChild(headerDiv);

        if (urlInfo.current > 1) {
            const prevBtn = document.createElement('div');
            prevBtn.className = 'v-arrow-btn';
            prevBtn.id = 'v-arrow-prev';
            prevBtn.innerHTML = '❮';
            prevBtn.onclick = function () { 
                gridDiv.className = 'closed';
                histDiv.className = 'closed';
                if (serverDiv) serverDiv.className = 'closed';
                switchEpisode(urlInfo.getEpiUrl(urlInfo.current - 1)); 
            };
            parent.appendChild(prevBtn);
        }

        if (urlInfo.current < urlInfo.maxEpi) {
            const nextBtn = document.createElement('div');
            nextBtn.className = 'v-arrow-btn';
            nextBtn.id = 'v-arrow-next';
            nextBtn.innerHTML = '❯';
            nextBtn.onclick = function () { 
                gridDiv.className = 'closed';
                histDiv.className = 'closed';
                if (serverDiv) serverDiv.className = 'closed';
                switchEpisode(urlInfo.getEpiUrl(urlInfo.current + 1)); 
            };
            parent.appendChild(nextBtn);
        }

        updatePlayerDimensions();

        if (isInitialLoad) {
            if (oldEpi !== null && oldEpi !== urlInfo.current) {
                histDiv.className = 'open';
                showToast('Lần trước xem: Tập ' + oldEpi + '\\n\\nNếu video load hoài hãy nhấn tua nhanh 10s để phát tiếp nha bạn.', 10000);
            } else {
                showToast('Đang phát Tập ' + urlInfo.current + '\\n\\nNếu video load hoài hãy nhấn tua nhanh 10s để phát tiếp nha bạn.', 10000);
            }
        }

        setupIdleEvents();
    }

    ensureDOMReady(function() {
        var initAttempts = 0;
        var maxInitAttempts = 50;

        const initTimer = setInterval(function () {
            initAttempts++;
            try {
                if (document) {
                    const sources = extractDataSources(document);

                    if (sources.length > 0) {
                        clearInterval(initTimer);

                        currentServers = sources;
                        selectedServerIdx = 0;
                        selectedServerHost = getHostFromUrl(currentServers[0].src);

                        log('[Found Data Sources]: Total ' + sources.length + ' server(s). Using: ' + sources[0].src);
                        
                        document.body.style.cssText = 'margin: 0 !important; padding: 0 !important; width: 100vw !important; height: 100vh !important; overflow: hidden !important; background-color: #000 !important;';
                        document.body.innerHTML = '';
                        
                        var mainIframe = document.createElement('iframe');
                        mainIframe.id = 'v-media-frame';
                        mainIframe.src = currentServers[0].src;
                        mainIframe.setAttribute('allowfullscreen', 'true');
                        mainIframe.setAttribute('frameborder', '0');
                        mainIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-presentation');
                        document.body.appendChild(mainIframe);

                        urlInfo = parseUrlInfo();
                        buildUI(true);

                        setTimeout(hideLoadingScreen, 1500);

                        return;
                    }
                }
            } catch (e) {
                log('[Init Loop Error]: ' + e.message);
            }

            if (initAttempts >= maxInitAttempts) {
                clearInterval(initTimer);
                hideLoadingScreen();
                log('[Init Timeout] Không tìm thấy button data-source!');
            }
        }, CHECK_SPEED);
    });
})();
`;
}





function sortEpisodesByName(data) {
    try {
        if (data && Array.isArray(data)) {
            data.forEach(function(server) {
                if (server.episodes && Array.isArray(server.episodes)) {
                    server.episodes.sort(function(a, b) {
                        var matchA = a.name.match(/Tập\s*(\d+)/i);
                        var matchB = b.name.match(/Tập\s*(\d+)/i);
                        var numA = matchA ? parseInt(matchA[1], 10) : 0;
                        var numB = matchB ? parseInt(matchB[1], 10) : 0;
                        return numA - numB;
                    });
                }
            });
        }
        return data;
    } catch (e) {
        log("sortEpisodesByName[err]:\n " + e);
        return data;
    }
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

function getLISTmenu() {
    return `[{\"link\":\"/\",\"name\":\"Phim Mới\"},{\"link\":\"/the-loai/vietsub\",\"name\":\"Vietsub\"},{\"link\":\"/the-loai/big-boobs\",\"name\":\"Big Boobs\"},{\"link\":\"/the-loai/blow-job\",\"name\":\"Blow Job\"},{\"link\":\"/the-loai/rape\",\"name\":\"Hiếp dâm - Rape\"},{\"link\":\"/the-loai/school-girl\",\"name\":\"Nữ Sinh - School Girl\"},{\"link\":\"/the-loai/boob-job\",\"name\":\"Boob Job\"},{\"link\":\"/the-loai/stocking\",\"name\":\"Stocking\"},{\"link\":\"/the-loai/anal\",\"name\":\"Anal\"},{\"link\":\"/the-loai/virgin\",\"name\":\"Virgin\"},{\"link\":\"/the-loai/mind-break\",\"name\":\"Mind Break\"},{\"link\":\"/the-loai/threesome\",\"name\":\"Threesome\"},{\"link\":\"/the-loai/femdom\",\"name\":\"Femdom\"},{\"link\":\"/the-loai/ahegao\",\"name\":\"Ahegao\"},{\"link\":\"/the-loai/khong-che\",\"name\":\"Không Che\"},{\"link\":\"/the-loai/sex-toy\",\"name\":\"Sex Toy\"},{\"link\":\"/the-loai/plot\",\"name\":\"Plot\"},{\"link\":\"/the-loai/harem\",\"name\":\"Harem\"},{\"link\":\"/the-loai/bondage\",\"name\":\"Bondage\"},{\"link\":\"/the-loai/thu-dam\",\"name\":\"Thủ Dâm\"},{\"link\":\"/the-loai/vanilla\",\"name\":\"Vanilla\"},{\"link\":\"/the-loai/double-penetration\",\"name\":\"Double Penetration\"},{\"link\":\"/the-loai/gang-bang\",\"name\":\"Gang Bang\"},{\"link\":\"/the-loai/milf\",\"name\":\"Milf\"},{\"link\":\"/the-loai/loan-luan\",\"name\":\"Loạn Luân\"},{\"link\":\"/the-loai/mind-control\",\"name\":\"Mind Control\"},{\"link\":\"/the-loai/tsundere\",\"name\":\"Tsundere\"},{\"link\":\"/the-loai/yuri\",\"name\":\"Yuri\"},{\"link\":\"/the-loai/loli\",\"name\":\"Loli\"},{\"link\":\"/the-loai/romance\",\"name\":\"Romance\"},{\"link\":\"/the-loai/teacher\",\"name\":\"Teacher\"},{\"link\":\"/the-loai/megane\",\"name\":\"Megane\"},{\"link\":\"/the-loai/maid\",\"name\":\"Hầu gái - Maid\"},{\"link\":\"/the-loai/orgy\",\"name\":\"Orgy\"},{\"link\":\"/the-loai/bdsm\",\"name\":\"Bạo dâm - Bdsm\"},{\"link\":\"/the-loai/tentacle\",\"name\":\"Xúc tua - Tentacle\"},{\"link\":\"/the-loai/monster\",\"name\":\"Monster\"},{\"link\":\"/the-loai/do-boi\",\"name\":\"Đồ Bơi\"},{\"link\":\"/the-loai/y-ta\",\"name\":\"Y Tá\"},{\"link\":\"/the-loai/ugly-bastard\",\"name\":\"Ugly Bastard\"},{\"link\":\"/the-loai/lactation\",\"name\":\"Lactation\"},{\"link\":\"/the-loai/dark-skin\",\"name\":\"Dark Skin\"},{\"link\":\"/the-loai/guro\",\"name\":\"Guro\"},{\"link\":\"/the-loai/fantasy\",\"name\":\"Fantasy\"},{\"link\":\"/the-loai/futanari\",\"name\":\"Futanari\"},{\"link\":\"/the-loai/foot-job\",\"name\":\"Foot Job\"},{\"link\":\"/the-loai/x-ray\",\"name\":\"X-Ray\"},{\"link\":\"/the-loai/softcore\",\"name\":\"Softcore\"},{\"link\":\"/the-loai/tong-tinh\",\"name\":\"Tống tình\"},{\"link\":\"/the-loai/kemonomimi\",\"name\":\"Kemonomimi\"},{\"link\":\"/the-loai/shota\",\"name\":\"Shota\"},{\"link\":\"/the-loai/bao-cao-su\",\"name\":\"Bao cao su\"},{\"link\":\"/the-loai/scat\",\"name\":\"Scat\"},{\"link\":\"/the-loai/tieu-tien\",\"name\":\"Tiểu tiện\"},{\"link\":\"/the-loai/succubus\",\"name\":\"Succubus\"},{\"link\":\"/the-loai/quay-roi\",\"name\":\"Quấy rối\"},{\"link\":\"/the-loai/cosplay\",\"name\":\"Cosplay\"},{\"link\":\"/the-loai/thuoc\",\"name\":\"Thuốc\"},{\"link\":\"/the-loai/josei\",\"name\":\"Josei\"},{\"link\":\"/the-loai/thu-thai\",\"name\":\"Thụ thai\"},{\"link\":\"/the-loai/trap\",\"name\":\"Trap\"},{\"link\":\"/the-loai/yaoi\",\"name\":\"Yaoi\"},{\"link\":\"/the-loai/gel-boi-tron\",\"name\":\"Gel bôi trơn\"},{\"link\":\"/the-loai/ti-thut\",\"name\":\"Ti thụt\"},{\"link\":\"/the-loai/pregnant\",\"name\":\"Pregnant\"},{\"link\":\"/the-loai/impregnate\",\"name\":\"Impregnate\"}]`;
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


function _$(htmlOrBlock){ 
  if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; } var instance = { sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '', elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []), length: 0, find: function (selector) { if (selector.indexOf(',') !== -1) { var results = []; var selectors = selector.split(',').map(function (s) { return s.trim(); }); for (var s = 0; s < selectors.length; s++) { if (selectors[s] === "") continue; var subInstance = this.find(selectors[s]); for (var r = 0; r < subInstance.elements.length; r++) { var element = subInstance.elements[r]; if (results.indexOf(element) === -1) { results.push(element); } } } var multiInstance = _$(results); multiInstance.sourceHtml = this.sourceHtml; return multiInstance; } var results = []; var contentFilter = ""; if (selector.indexOf(":content(") !== -1) { var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/); if (contentMatch) { contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || ""; selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, ""); } } var attrNameFilter = ""; var attrValueFilter = ""; var attrOperator = "="; var hasAttrFilter = false; var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/); if (attrMatch) { hasAttrFilter = true; attrNameFilter = attrMatch[1]; attrOperator = attrMatch[2]; attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || ""; selector = selector.replace(/\[.*?\]/, ""); } var notSelector = ""; if (selector.indexOf(":not(") !== -1) { var notMatch = selector.match(/:not\(([^)]+)\)/); if (notMatch) { notSelector = notMatch[1]; selector = selector.replace(/:not\([^)]+\)/, ""); } } var isFirstFilter = selector.indexOf(":first") !== -1; var isLastFilter = selector.indexOf(":last") !== -1; selector = selector.replace(/:first|:last/g, ""); var targetTagName = ""; var targetId = ""; var targetClasses = []; var selectorToParse = selector.trim(); if (selectorToParse !== "") { var idIndex = selectorToParse.indexOf('#'); if (idIndex !== -1) { var afterId = selectorToParse.substring(idIndex + 1); var nextDot = afterId.indexOf('.'); targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot); selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1)); } var classParts = selectorToParse.split('.'); var possibleTag = classParts.shift(); if (possibleTag) { targetTagName = possibleTag.toLowerCase(); } targetClasses = classParts.filter(function (c) { return c.length > 0; }); } for (var i = 0; i < this.elements.length; i++) { var currentHtml = this.elements[i]; var pos = 0; var subResults = []; while ((pos = currentHtml.indexOf('<', pos)) !== -1) { if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; } var endOpenTag = -1; var insideQuote = false; var quoteChar = ''; for (var j = pos + 1; j < currentHtml.length; j++) { var char = currentHtml.charAt(j); if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') { if (!insideQuote) { insideQuote = true; quoteChar = char; } else if (char === quoteChar) { insideQuote = false; } } if (char === '>' && !insideQuote) { endOpenTag = j; break; } } if (endOpenTag === -1) break; var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1); var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/); var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : ""; var isMatched = true; if (targetTagName && targetTagName !== currentTagName) { isMatched = false; } var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : ""; var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : ""; if (isMatched && targetId && idMatchStr !== targetId) { isMatched = false; } if (isMatched && targetClasses.length > 0) { if (classMatchStr) { var currentClasses = classMatchStr.trim().split(/\s+/); for (var c = 0; c < targetClasses.length; c++) { if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; } } } else { isMatched = false; } } if (isMatched && hasAttrFilter) { var actualValue = ""; if (attrNameFilter === "class") { actualValue = classMatchStr; } else if (attrNameFilter === "id") { actualValue = idMatchStr; } else { var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : ""; } var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=', 'i')) !== -1; if (!attrExists) { isMatched = false; } else { if (attrOperator === "=") { if (attrNameFilter === "class") { var classes = actualValue.trim().split(/\s+/); if (classes.indexOf(attrValueFilter) === -1) isMatched = false; } else if (actualValue !== attrValueFilter) { isMatched = false; } } else if (attrOperator === "*=") { if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false; } else if (attrOperator === "^=") { if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false; } else if (attrOperator === "$=") { if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false; } } } if (isMatched) { var startTagPos = pos; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var closeRegex = new RegExp('</' + currentTagName + '\\s*>', 'i'); var subHtml = currentHtml.substring(endOpenTag + 1); var matchClose = subHtml.match(closeRegex); if (matchClose) { endTagPos = endOpenTag + 1 + matchClose.index + matchClose[0].length; } else { endTagPos = currentHtml.length; } } var foundBlock = currentHtml.substring(startTagPos, endTagPos); if (contentFilter) { var pureText = ""; if (currentTagName === "script" || currentTagName === "style") { var innerStart = foundBlock.indexOf('>') + 1; var innerEnd = foundBlock.search(/<\/(?:script|style)/i); pureText = innerEnd !== -1 ? foundBlock.substring(innerStart, innerEnd) : foundBlock.substring(innerStart); } else { pureText = foundBlock.replace(/<[^>]+>/g, "").trim(); } var keywords = contentFilter.split('|'); var isContentMatched = false; for (var k = 0; k < keywords.length; k++) { if (pureText.indexOf(keywords[k].trim()) !== -1) { isContentMatched = true; break; } } if (!isContentMatched) { pos = endTagPos; continue; } } if (notSelector) { var isNotClass = notSelector.indexOf('.') === 0; var isNotId = notSelector.indexOf('#') === 0; var notValue = notSelector.substring(1); var hasNot = false; if (isNotClass && classMatchStr.indexOf(notValue) !== -1) hasNot = true; if (isNotId && idMatchStr.indexOf(notValue) !== -1) hasNot = true; if (!hasNot) subResults.push(foundBlock); } else { subResults.push(foundBlock); } pos = endTagPos; } else { pos++; } } if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]]; if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]]; results = results.concat(subResults); } var newInstance = _$(results); newInstance.sourceHtml = this.sourceHtml || currentHtml; return newInstance; }, each: function (callback) { for (var i = 0; i < this.elements.length; i++) { var childInstance = _$(this.elements[i]); childInstance.sourceHtml = this.sourceHtml; callback.call(childInstance, i, this.elements[i]); } return this; }, eq: function (index) { if (index < 0) index = this.elements.length + index; var matchedElement = this.elements[index]; this.elements = matchedElement ? [matchedElement] : []; this.length = this.elements.length; return this; }, attr: function (attrName) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var getAttr = elem.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); return getAttr ? (getAttr[1] || getAttr[2] || getAttr[3] || "") : ""; }, html: function () { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var matchClose = elem.match(/<\/([a-zA-Z0-9_-]+)\s*>\s*$/i); if (matchClose) { var end = elem.lastIndexOf(matchClose[0]); if (start > 0 && end >= start) return elem.substring(start, end); } return start > 0 ? elem.substring(start) : ""; }, text: function (separator) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); if (typeof separator === 'string') { return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(separator); } return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); } return ""; }, textAll: function (separator) { if (this.elements.length === 0) return ""; var sep = typeof separator === 'string' ? separator : " "; var allTexts = []; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); var cleanText = pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); if (cleanText !== '') { allTexts.push(cleanText); } } } return allTexts.join(sep); }, next: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx === -1) continue; var scanPos = idx + elem.length; var nextOpen = this.sourceHtml.indexOf('<', scanPos); if (nextOpen !== -1) { if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue; var endOpenTag = this.sourceHtml.indexOf('>', nextOpen); if (endOpenTag === -1) continue; var fullOpenTag = this.sourceHtml.substring(nextOpen, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var startTagPos = nextOpen; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var closeRegex = new RegExp('</' + currentTagName + '\\s*>', 'i'); var subHtml = this.sourceHtml.substring(endOpenTag + 1); var matchClose = subHtml.match(closeRegex); if (matchClose) { endTagPos = endOpenTag + 1 + matchClose.index + matchClose[0].length; } else { endTagPos = this.sourceHtml.length; } } results.push(this.sourceHtml.substring(startTagPos, endTagPos)); } } var nextInstance = _$(results); nextInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, parent: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx <= 0) continue; var scanPos = idx - 1; while (scanPos >= 0) { var openTagPos = this.sourceHtml.lastIndexOf('<', scanPos); if (openTagPos === -1) break; if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') { var endOpenTag = this.sourceHtml.indexOf('>', openTagPos); if (endOpenTag !== -1 && endOpenTag > openTagPos) { var fullOpenTag = this.sourceHtml.substring(openTagPos, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var closeRegex = new RegExp('</' + currentTagName + '\\s*>', 'i'); var subHtml = this.sourceHtml.substring(endOpenTag + 1); var matchClose = subHtml.match(closeRegex); if (matchClose) { endTagPos = endOpenTag + 1 + matchClose.index + matchClose[0].length; } else { endTagPos = this.sourceHtml.length; } } if (endTagPos >= idx + elem.length) { var parentBlock = this.sourceHtml.substring(openTagPos, endTagPos); if (results.indexOf(parentBlock) === -1) results.push(parentBlock); break; } } } scanPos = openTagPos - 1; } } var parentInstance = _$(results); parentInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, closest: function (selector) { var results = []; if (!this.sourceHtml || this.elements.length === 0) return _$([]); for (var i = 0; i < this.elements.length; i++) { var currentElem = this.elements[i]; var currentObj = _$(currentElem); currentObj.sourceHtml = this.sourceHtml; var selfCheck = _$(this.sourceHtml).find(selector); var isSelfMatched = false; for (var s = 0; s < selfCheck.elements.length; s++) { if (selfCheck.elements[s] === currentElem) { isSelfMatched = true; break; } } if (isSelfMatched) { if (results.indexOf(currentElem) === -1) results.push(currentElem); continue; } var parentObj = currentObj.parent(); while (parentObj.elements.length > 0) { var parentElem = parentObj.elements[0]; var checkMatch = _$(this.sourceHtml).find(selector); var isMatched = false; for (var j = 0; j < checkMatch.elements.length; j++) { if (checkMatch.elements[j] === parentElem) { isMatched = true; break; } } if (isMatched) { if (results.indexOf(parentElem) === -1) results.push(parentElem); break; } parentObj = parentObj.parent(); } } var closestInstance = _$(results); closestInstance.sourceHtml = this.sourceHtml; return closestInstance; } }; instance.length = instance.elements.length; return instance; 
};