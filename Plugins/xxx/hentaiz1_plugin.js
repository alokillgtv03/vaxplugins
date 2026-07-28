var BASEURL = "https://hentaiz1.com";
var DEV = "false";
// https://www.whoreshub.com/categories/4k-porn/
function getManifest() {
  return JSON.stringify({
    id: "hentaiz1",
    name: "Nguồn HentaiVN",
    description: "Nguồn phim Hentai mới.",
    "version": "1.2.2",
    info: "Nguồn phim hentai vietsub của VN. Nguồn này dùng server của họ nên đôi lúc loading khá là chậm, ráng chờ nha.",
    baseUrl: "https://hentaiz1.com",
    iconUrl: "https://storage.haiten.org/2026/01/fe9f7b29-bb66-48eb-8a6f-ddc42efa00a5.png",
    isEnabled: true,
    "isAdult": true,
    type: "MOVIE",
    playerTpye: "embed",
  });
}

function log(msg) {
  if (DEV && typeof console !== "undefined" && console.log) {
    console.log(
      "[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg,
    );
  }
}

// https://hentaiz1.com/browse/2d?page=3
function getHomeSections() {
  try {
    var listurl =
      '[{\"link\":\"/browse/2d\",\"name\":\"Phim Mới\"}]';
    var menulist = buildMenu(listurl, true);
    return JSON.stringify(menulist);
  } catch (e) {
    log("getHomeSections[err]:\n " + e);
  }
}

function getPrimaryCategories() {
  try {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
  } catch (e) {
    log("getPrimaryCategories[err]:\n " + e);
  }
}

function getFilterConfig() {
  try {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl, "filter");
    return JSON.stringify({
      category: menulist,
    });
  } catch (e) {
    log("getFilterConfig[err]:\n " + e);
  }
}

// =============================================================================
// HELPER: CURSOR BASE64 ENCODE / DECODE
// =============================================================================
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
      resultUrl += path + "/__data.json";
    }
    if (page > 1) {
      resultUrl = resultUrl.replace(/(\d+)$/i, "");
      resultUrl += "?page=" + page;
    }

    var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
    log("getUrlList[url]: \n" + finalUrl);
    return finalUrl;
  } catch (e) {
    log("getUrlList[err]:\n " + e);
    if (slug && slug.indexOf("http") > -1) {
      return slug;
    }
    var fallback = BASEURL + (slug ? "/" + slug : "");
    return fallback.replace(/([^:]\/)\/+/g, "$1");
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
 // https://hentaiz1.com/browse/__data.json?q=girl&sort=publishedAt_desc&page=4&limit=24&animationType=ALL&contentRating=ALL&isTrailer=ALL&year=ALL&x-sveltekit-invalidated=011
          resultUrl =
            BASEURL +
            "/browse/__data.json?q=" +
            encodeURIComponent(keyword) +
            "&sort=publishedAt_desc&limit=24&page=" +
            page;
        } else {
          resultUrl = BASEURL + "/browse/__data.json?q=" + encodeURIComponent(keyword);
        }
      } catch (jsonErr) {
        resultUrl = BASEURL + "/browse/__data.json?q=" + encodeURIComponent(keyword);
      }
    } else {
      resultUrl = BASEURL + "/browse/__data.json?q=" + encodeURIComponent(keyword);
    }

    log("getUrlSearch[url]: \n" + resultUrl);
    return resultUrl;
  } catch (e) {
    log("getUrlSearch[err]:\n " + e);
  }
}
// https://hentaiz1.com/browse/2d?page=3
// https://hentaiz1.com/browse?q=girl&sort=publishedAt_desc&page=4&limit=24&animationType=ALL&contentRating=ALL&isTrailer=ALL&year=ALL
//filtersJson = "{page:2}"
//getUrlList("/browse/2d", filtersJson)
//getUrlSearch("girl bad", filtersJson)

function getUrlDetail(slug) {
  try {
    if (!slug) return "";
    var resultUrl = slug.indexOf("http") === 0 ? slug : BASEURL + "/" + slug;
    log("getUrlDetail[url]: \n" + resultUrl);
    return resultUrl;
  } catch (e) {
    log("getUrlDetail[err]:\n " + e);
  }
}


function getUrlCategories() {
  try {
    log("getUrlCategories[url]: \n" + BASEURL);
    return BASEURL;
  } catch (e) {
    log("getUrlCategories[err]:\n " + e);
  }
}

function getUrlCountries() {
  try {
    return "";
  } catch (e) {
    log("getUrlCountries[err]:\n " + e);
  }
}

function getUrlYears() {
  try {
    return "";
  } catch (e) {
    log("getUrlYears[err]:\n " + e);
  }
}



// =============================================================================
// PARSERS
// =============================================================================

function fixHref(href) {
  try {
    if (!href) return "";

    let cleanHref = href.trim();
    const ignorePattern =
      /^(#|https?:\/\/|\/\/|mailto:|tel:|javascript:|data:|blob:)/i;

    if (ignorePattern.test(cleanHref)) {
      return cleanHref;
    }

    if (cleanHref.startsWith("/")) {
      try {
        const urlObj = new URL(BASEURL);
        return urlObj.origin + cleanHref;
      } catch (e) {
        return BASEURL + cleanHref;
      }
    }

    return BASEURL + cleanHref;
  } catch (e) {
    log("fixHref[err]:\n " + e);
  }
}

function parseListResponse(html, $url) {
    try {
        if ($url) log("parseListResponse[url]: \n" + $url);

        // 1. Chuẩn bị chuỗi JSON gốc
        const rawJson = html.startsWith('var html =') ?
            html.replace(/^var\s+html\s*=\s*`?/, '').replace(/`?;?$/, '') :
            html;

        const parsed = JSON.parse(rawJson);

        // 2. Hàm đệ quy giải mã data SvelteKit
        function resolve(val, dataList) {
            if (val === null || val === undefined) return null;

            if (typeof val === 'number' && val >= 0 && val < dataList.length) {
                const target = dataList[val];
                if (typeof target === 'object' && target !== null) {
                    return unwrap(target, dataList);
                }
                return target;
            }

            if (typeof val === 'object') {
                return unwrap(val, dataList);
            }

            return val;
        }

        function unwrap(obj, dataList) {
            if (Array.isArray(obj)) {
                return obj.map(item => resolve(item, dataList));
            }
            const result = {};
            for (const key in obj) {
                result[key] = resolve(obj[key], dataList);
            }
            return result;
        }

        // 3. Tìm node chứa danh sách phim
        const pageNode = parsed?.nodes?.find(node => node.type === 'data' && node.data?.[0]?.episodes);

        if (pageNode) {
            const dataList = pageNode.data;
            const rootResolved = resolve(0, dataList);
            const rawEpisodes = rootResolved?.episodes || [];

            // 🟢 Khai báo mảng items rỗng
            var items = [];
            var baseUrl = (typeof BASEURL !== 'undefined' && BASEURL) ? BASEURL : "https://hentaiz1.com";

            // 🟢 Duyệt qua từng episode và items.push()
            if (Array.isArray(rawEpisodes)) {
                for (var i = 0; i < rawEpisodes.length; i++) {
                    var ep = rawEpisodes[i];
                    
                    // Bỏ qua nếu item rỗng hoặc thiếu slug
                    if (!ep || !ep.slug) continue;

                    var posterPath = ep?.posterImage?.filePath;
                    var backdropPath = ep?.backdropImage?.filePath;

                    // Xử lý URL ảnh: Tuyệt đối không để chuỗi rỗng "" để tránh lỗi OkHttp
                    var poster = posterPath 
                        ? `https://storage.haiten.org${posterPath}` 
                        : "https://via.placeholder.com/300x450";
                    
                    var backdrop = backdropPath 
                        ? `https://storage.haiten.org${backdropPath}` 
                        : poster;
                    var id = BASEURL + "/watch/" + ep.slug + "/__data.json?maxEpi=" + ep.episodeNumber
                    items.push({
                        id: id,
                        title: (ep.title || "").trim(),
                        posterUrl: poster,
                        backdropUrl: backdrop,
                        quality: ep.quality || "HD",
                        lang: ep.lang || "",
                        episode_current: ep.episodeNumber ? `Tập ${ep.episodeNumber}` : ""
                    });
                }
            }

            console.log("Parsed items count: " + items.length);

            return JSON.stringify({
                items: items,
                pagination: {
                    currentPage: 1,
                    totalPages: 999,
                },
            });
        }

        // Fallback 1: Trả về mảng rỗng nếu không có pageNode
        return JSON.stringify({
            items: [],
            pagination: { currentPage: 1, totalPages: 1 },
        });

    } catch (e) {
        log("parseListResponse[err]:\n " + e);
        // Fallback 2: Trả về mảng rỗng nếu bị crash/lỗi parse
        return JSON.stringify({
            items: [],
            pagination: { currentPage: 1, totalPages: 1 },
        });
    }
}

function parseSearchResponse(html, url) {
  try {
    if (url) log("parseSearchResponse[url]: \n" + url);
    return parseListResponse(html, url);
  } catch (e) {
    log("parseSearchResponse[err]:\n " + e);
  }
}

function parseMovieDetail(html, url) {
  try {
    if (url) log("parseMovieDetail[url]: \n" + url);

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
    var year = 2026;
    var extra = "";
    var rating = "";
    var quality = "";
    
function decodeNuxtData(data) {
  let parsed = data;

  // 1. Nếu lỡ truyền vào dạng String, xử lý làm sạch trước khi JSON.parse
  if (typeof data === 'string') {
    try {
      // Loại bỏ ký tự xuống dòng rác do copy-paste gây lỗi JSON
      const cleanString = data.trim().replace(/[\r\n]+/g, ' ');
      parsed = JSON.parse(cleanString);
    } catch (e) {
      console.error("Lỗi: Dữ liệu chuỗi JSON bị hỏng cú pháp!", e);
      return null;
    }
  }

  // 2. Tìm mảng dataList chứa 'episode'
  let dataList = null;
  let rootEpisodeIndex = null;

  if (parsed?.nodes) {
    for (const node of parsed.nodes) {
      if (node?.type === 'data' && Array.isArray(node.data)) {
        const first = node.data[0];
        if (first && typeof first === 'object' && 'episode' in first) {
          dataList = node.data;
          rootEpisodeIndex = first.episode;
          break;
        }
      }
    }
  } else if (Array.isArray(parsed)) {
    dataList = parsed;
    rootEpisodeIndex = parsed[0]?.episode ?? 0;
  }

  if (!dataList) {
    console.error("Không tìm thấy node chứa 'episode'!");
    return null;
  }

  // 3. Hàm đệ quy giải mã chỉ số (dereference)
  function resolve(val, visited = new Set()) {
    if (val === null || val === undefined) return val;

    if (typeof val === 'number' && Number.isInteger(val) && val >= 0 && val < dataList.length) {
      if (visited.has(val)) return dataList[val];
      visited.add(val);
      return resolve(dataList[val], visited);
    }

    if (Array.isArray(val)) {
      return val.map(item => resolve(item, new Set(visited)));
    }

    if (typeof val === 'object') {
      const result = {};
      for (const key in val) {
        result[key] = resolve(val[key], new Set(visited));
      }
      return result;
    }

    return val;
  }

  return resolve(rootEpisodeIndex);
}


// === CÁCH SỬ DỤNG ===
const result = decodeNuxtData(html);
lname = result.title;
ldes = result.description.replace(/<p>|<\/p>|<strong>|<\/strong>|&nbsp;/g,"").replace(/<br>/g,"\n\n");
// `https://storage.haiten.org${posterPath}` 
limg = "https://storage.haiten.org" + result.posterImage.filePath;
log("limg: " + limg)
id = url;
var vslug = result.slug.replace(/(\d+)$/g,"");
var maxEpi = url.match(/maxEpi=(\d+)$/i)[1];
maxEpi = Number(maxEpi);
var servers = [];
var episodes = [];
var maxMovie = (maxEpi + 1);
for(var $j = 1;$j < maxMovie;$j++){
    episodes.push({
        id: BASEURL + "/watch/" + vslug + $j + "?current=" + $j + "&maxEpi=" + maxEpi,
        name: "Tập " + $j,
        slug: "tap-" + $j
    })
}    
servers.push({
    name: "Server",
    episodes: episodes
})
    return JSON.stringify({
      id: id,
      title: lname,
      posterUrl: limg,
      backdropUrl: limg,
      description: ldes,
      quality: quality || "",
      year: "2026",
      status: status,
      category: category,
      episode_current: episode_current,
      servers: servers,
      duration: lduran || "",
      casts: lactor || "",
      director: ldirec || "",
      extra: extra,
    });
  } catch (e) {
    log("parseMovieDetail[err]:\n " + e);
    return JSON.stringify({
      id:  url || "error",
      title: "error",
      posterUrl: "",
      backdropUrl: "",
      description: "",
      quality: quality || "",
      year: "2026",
      status: "",
      category: "",
      episode_current: "",
      servers: [],
      duration: "",
      casts: lactor || "",
      director: ldirec || "",
      extra: ""
    });
  }
}



function sortEpisodesByName(data) {
  try {
    if (!Array.isArray(data)) return data;

    data.forEach(function (server) {
      if (server.episodes && Array.isArray(server.episodes)) {
        server.episodes.sort(function (a, b) {
          var nameA = a.name || "";
          var nameB = b.name || "";

          var matchA = nameA.match(/\d+(\.\d+)?/);
          var matchB = nameB.match(/\d+(\.\d+)?/);

          var numA = matchA ? parseFloat(matchA[0]) : null;
          var numB = matchB ? parseFloat(matchB[0]) : null;

          if (numA !== null && numB !== null) {
            if (numA !== numB) {
              return numA - numB;
            }
          }

          if (numA !== null) return -1;
          if (numB !== null) return 1;

          return nameA.localeCompare(nameB, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        });
      }
    });

    return data;
  } catch (e) {
    log("sortEpisodesByName[err]:\n " + e);
  }
}

function parseDetailResponse(html, url) {
  try {
    log("[parseDetailResponse Đang xử lý]: " + url);
    var customJS = rawJS();
    return JSON.stringify({
      url: url,
      isEmbed: false,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: url,
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

    function showToast(msg) {
        log('[Toast] ' + msg);
        try {
            if (window.SnifferBridge && typeof window.SnifferBridge.toast === 'function') {
                window.SnifferBridge.toast(String(msg));
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
            } catch(e) {}
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
            } catch(e) { return false; }
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
                if (hasLocal) { try { val = localStorage.getItem(key); } catch(e) {} }
                if (val === null && hasSession) { try { val = sessionStorage.getItem(key); } catch(e) {} }
                if (val === null) { val = getCookie(key); }
                if (val === null) {
                    var wData = getWinNameData();
                    if (wData[key] !== undefined) val = wData[key];
                }
                if (val === null && memCache[key] !== undefined) val = memCache[key];
                return val !== null ? val : defaultVal;
            },

            setItem: function(key, val) {
                memCache[key] = val;
                if (hasLocal) { try { localStorage.setItem(key, val); } catch(e) {} }
                if (hasSession) { try { sessionStorage.setItem(key, val); } catch(e) {} }
                setCookie(key, val, 30);
                setWinNameData(key, val);
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
            
            document.addEventListener('click', function(e) {
                if (e.isTrusted && window.location.href.includes('haiten')) {
                    if (e.target.closest && (e.target.closest('#v-top-bar') || e.target.closest('#v-arrow-prev') || e.target.closest('#v-arrow-next'))) {
                        return;
                    }
                }
            }, true);

        } catch (e) {}
    })();

    const TARGET_PATTERN = 'haiten.org';
    const CHECK_SPEED = 200;
    var urlInfo = null;

    function injectStyles() {
        try {
            if (document.getElementById('v-style-block')) return;
            const style = document.createElement('style');
            style.id = 'v-style-block';
            style.textContent = 
                '#v-top-bar { position: fixed !important; top: 12px !important; right: 12px !important; z-index: 2147483647 !important; display: flex !important; gap: 8px !important; align-items: center !important; font-family: sans-serif !important; transition: opacity 0.4s ease !important; opacity: 1; }' +
                '.v-btn-act { background: rgba(15, 15, 15, 0.9) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.3) !important; padding: 8px 14px !important; border-radius: 6px !important; font-size: 13px !important; font-weight: bold !important; cursor: pointer !important; backdrop-filter: blur(8px) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.6) !important; }' +
                '.v-btn-act:active { background: #e50914 !important; }' +
                
                '#v-box-list, #v-hist-dropdown { display: none; position: absolute !important; top: 100% !important; right: 0 !important; margin-top: 6px !important; background: rgba(15, 15, 15, 0.95) !important; padding: 10px !important; border-radius: 8px !important; border: 1px solid rgba(255,255,255,0.2) !important; z-index: 2147483647 !important; backdrop-filter: blur(10px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.8) !important; }' +
                '#v-box-list { grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)) !important; gap: 6px !important; width: 230px !important; max-height: 220px !important; overflow-y: auto !important; }' +
                '#v-hist-dropdown { width: 260px !important; max-width: 80vw !important; flex-direction: column !important; gap: 8px !important; }' +
                
                '#v-box-list.closed, #v-hist-dropdown.closed { display: none !important; }' +
                '#v-box-list.open { display: grid !important; }' +
                '#v-hist-dropdown.open { display: flex !important; }' +
                
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

    function showLoadingScreen() {
        var parent = document.body || document.documentElement;
        if (!parent || document.getElementById('v-stage-layer')) return;

        var loadingDiv = document.createElement('div');
        loadingDiv.id = 'v-stage-layer';
        loadingDiv.style.cssText = 
            'position: fixed !important; top: 0 !important; left: 0 !important;' +
            'width: 100vw !important; height: 100vh !important; background-color: #0d0d0d !important;' +
            'display: flex !important; flex-direction: column !important; justify-content: center !important;' +
            'align-items: center !important; z-index: 2147483646 !important; font-family: sans-serif !important; cursor: pointer !important;';

        loadingDiv.innerHTML = 
            '<div class="v-ring-spin"></div>' +
            '<div style="color:#ccc; margin-top:16px; font-size:14px; text-align:center;">Đang tải trình phát...<br><small style="color:#777; font-size:11px;">(Chạm vào màn hình để đóng nếu bị treo)</small></div>' +
            '<style>' +
            '.v-ring-spin { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.1); border-left-color: #e50914; border-radius: 50%; animation: v-spin 0.8s linear infinite; }' +
            '@keyframes v-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' +
            '</style>';

        loadingDiv.onclick = function() { hideLoadingScreen(); };
        parent.appendChild(loadingDiv);
    }

    function hideLoadingScreen() {
        try {
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
            const current = parseInt(url.searchParams.get('current')) || 1;
            const maxEpi = parseInt(url.searchParams.get('maxEpi')) || 1;

            const pathParts = url.pathname.split('/');
            const lastSlug = pathParts[pathParts.length - 1] || '';
            const baseSlug = lastSlug.replace(/-\\d+$/, '');
            const seriesKey = baseSlug || 'default_series';

            const getEpiUrl = function (epiNum) {
                const newPath = url.pathname.replace(lastSlug, baseSlug + '-' + epiNum);
                return url.origin + newPath + '?current=' + epiNum + '&maxEpi=' + maxEpi;
            };

            return { current: current, maxEpi: maxEpi, baseSlug: baseSlug, seriesKey: seriesKey, getEpiUrl: getEpiUrl, fullUrl: url.href };
        } catch (e) {
            return { current: 1, maxEpi: 1, baseSlug: '', seriesKey: 'default', getEpiUrl: function () { return window.location.href; } };
        }
    }

    function getHistory(seriesKey) {
        var raw = SmartStorage.getItem('watch_hist_' + seriesKey, null);
        if (!raw) return null;
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
            return null;
        }
    }

    function saveHistory(seriesKey, epiNum) {
        var data = JSON.stringify({
            lastEpi: epiNum,
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
            if (gridDiv) gridDiv.className = 'closed';
            if (histDiv) histDiv.className = 'closed';

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

    function switchEpisode(targetUrl) {
        showLoadingScreen();
        var bgFrame = document.createElement('iframe');
        bgFrame.style.display = 'none';
        bgFrame.id = 'bg-fetch-frame';
        bgFrame.src = targetUrl;

        var oldFrame = document.getElementById('bg-fetch-frame');
        if (oldFrame) oldFrame.remove();

        (document.body || document.documentElement).appendChild(bgFrame);

        var attempts = 0;
        var maxAttempts = 50;
        
        var bgTimer = setInterval(function () {
            attempts++;
            try {
                var doc = bgFrame.contentDocument || bgFrame.contentWindow.document;
                if (doc) {
                    var iframes = doc.querySelectorAll('iframe');
                    for (var i = 0; i < iframes.length; i++) {
                        var realSrc = iframes[i].src || iframes[i].getAttribute('data-src') || iframes[i].getAttribute('data-lazy-src');
                        if (realSrc && realSrc.includes(TARGET_PATTERN)) {
                            clearInterval(bgTimer);
                            var mainPlayer = document.getElementById('v-media-frame');
                            if (mainPlayer) mainPlayer.src = realSrc;
                            bgFrame.remove();
                            window.history.pushState({}, '', targetUrl);
                            urlInfo = parseUrlInfo();
                            
                            // CHỈ LƯU LỊCH SỬ KHI NGƯỜI DÙNG BẤM CHUYỂN TẬP
                            saveHistory(urlInfo.seriesKey, urlInfo.current);
                            
                            buildUI(false);
                            hideLoadingScreen();
                            showToast('Đã chuyển sang Tập ' + urlInfo.current);
                            return;
                        }
                    }
                }
            } catch (e) {}

            if (attempts >= maxAttempts) {
                clearInterval(bgTimer);
                bgFrame.remove();
                hideLoadingScreen();
                alert('Không thể tải tự động tập này!');
            }
        }, CHECK_SPEED);
    }

    // -------------------------------------------------------------
    // DỰNG GIAO DIỆN UI
    // -------------------------------------------------------------
    function buildUI(isInitialLoad) {
        log('[Build UI] Tiến hành dựng giao diện điều khiển...');
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
                    if (epiNum !== urlInfo.current) switchEpisode(urlInfo.getEpiUrl(epiNum));
                };
                gridDiv.appendChild(btn);
            })(i);
        }

        const epiWrapper = document.createElement('div');
        epiWrapper.style.position = 'relative';
        epiWrapper.appendChild(toggleBtn);
        epiWrapper.appendChild(gridDiv);

        // --- ĐỌC LỊCH SỬ CŨ ---
        var prevHist = getHistory(urlInfo.seriesKey);
        var prevEpi = (prevHist && prevHist.lastEpi !== undefined) ? parseInt(prevHist.lastEpi) : null;
        
        // Nếu vào xem bộ này lần đầu tiên (chưa có lịch sử), thì mới ghi nhận tập hiện tại làm mốc khởi đầu
        if (prevEpi === null && isInitialLoad) {
            saveHistory(urlInfo.seriesKey, urlInfo.current);
        }

        const histBtn = document.createElement('button');
        histBtn.id = 'v-btn-hist';
        histBtn.className = 'v-btn-act';
        histBtn.innerHTML = '📜 Lịch sử';

        const histDiv = document.createElement('div');
        histDiv.id = 'v-hist-dropdown';
        histDiv.className = 'closed';

        var nextEpi = (prevEpi !== null && prevEpi < urlInfo.maxEpi) ? prevEpi + 1 : (prevEpi || 1);

        if (prevEpi !== null && !isNaN(prevEpi)) {
            histDiv.innerHTML = 
                '<div style="font-size: 12px; line-height: 1.4; color: #eee; font-weight: 500;">' +
                'Lần trước xem đến <b>Tập ' + prevEpi + '</b>.' +
                '</div>' +
                '<div style="display: flex; gap: 6px; flex-direction: column; margin-top: 2px;">' +
                    '<button id="v-btn-hist-prev" style="background: #e50914; color: #fff; border: none; padding: 7px 4px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Phát Tập ' + prevEpi + '</button>' +
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
            gridDiv.className = gridDiv.classList.contains('open') ? 'closed' : 'open';
            resetIdleTimer();
        };

        histBtn.onclick = function (e) {
            e.stopPropagation();
            gridDiv.className = 'closed';
            histDiv.className = histDiv.classList.contains('open') ? 'closed' : 'open';
            resetIdleTimer();
        };

        // --- SỬA LỖI TỰ ĐÓNG SAU 0.5S ---
        // Chỉ đóng dropdown khi click ra ngoài vùng top-bar (không click nhầm vào menu)
        document.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('#v-top-bar')) {
                return;
            }
            if (gridDiv) gridDiv.className = 'closed';
            if (histDiv) histDiv.className = 'closed';
        });

        var btnPrev = histDiv.querySelector('#v-btn-hist-prev');
        if (btnPrev) {
            btnPrev.onclick = function(e) {
                e.stopPropagation();
                histDiv.className = 'closed';
                if (prevEpi !== urlInfo.current) switchEpisode(urlInfo.getEpiUrl(prevEpi));
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
                switchEpisode(urlInfo.getEpiUrl(urlInfo.current + 1)); 
            };
            parent.appendChild(nextBtn);
        }

        updatePlayerDimensions();

        if (isInitialLoad) {
            if (prevEpi !== null && prevEpi !== urlInfo.current) {
                histDiv.className = 'open';
                showToast('Lần trước xem: Tập ' + prevEpi);
            } else {
                showToast('Đang phát Tập ' + urlInfo.current);
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
                if (document && document.querySelectorAll) {
                    const iframes = document.querySelectorAll('iframe');

                    for (let i = 0; i < iframes.length; i++) {
                        const iframe = iframes[i];
                        const realSrc = iframe.src || iframe.getAttribute('data-src') || iframe.getAttribute('data-lazy-src');

                        if (realSrc && realSrc.includes(TARGET_PATTERN)) {
                            clearInterval(initTimer);

                            log('[Found Player]: ' + realSrc);
                            
                            document.body.style.cssText = 'margin: 0 !important; padding: 0 !important; width: 100vw !important; height: 100vh !important; overflow: hidden !important; background-color: #000 !important;';
                            document.body.innerHTML = '';
                            
                            var mainIframe = document.createElement('iframe');
                            mainIframe.id = 'v-media-frame';
                            mainIframe.src = realSrc;
                            mainIframe.setAttribute('allowfullscreen', 'true');
                            mainIframe.setAttribute('frameborder', '0');
                            mainIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-presentation');
                            document.body.appendChild(mainIframe);

                            urlInfo = parseUrlInfo();
                            
                            buildUI(true);
                            hideLoadingScreen();

                            return;
                        }
                    }
                }
            } catch (e) {
                log('[Init Loop Error]: ' + e.message);
            }

            if (initAttempts >= maxInitAttempts) {
                clearInterval(initTimer);
                hideLoadingScreen();
                log('[Init Timeout] Không tìm thấy iframe player!');
            }
        }, CHECK_SPEED);
    });
})();
`;
}


/*

BASEURL = "https://animehay09.site";
var html = sourceHTML;
//JSON.parse(parseDetailResponse(sourceHTML, BASEURL))
JSON.parse(parseEmbedResponse(sourceHTML, BASEURL))
// 'AHS': 'https://ahay.stream/embed-jw/75913'

*/

function parseCategoriesResponse(apiResponseJson) {
  var listurl = getLISTmenu();
  var menulist = buildMenu(listurl);
  return JSON.stringify(menulist);
}

function parseCountriesResponse(html) {
  return "[]";
}
function parseYearsResponse(html) {
  return "[]";
}

/*
{\"link\":\"/the-loai/phim-cap-nhat-1\",\"name\":\"Phim Mới\"},
{\"link\":\"/the-loai/phim-le-1\",\"name\":\"Phim Lẻ\"},
{\"link\":\"/the-loai/phim-bole-1\",\"name\":\"Phim Bộ\"},
{\"link\":\"/tuyen-tap-1\",\"name\":\"Loạt Phim\"},
/browse/2d
 */
function getLISTmenu() {
  return `[{\"link\":\"/browse/2d\",\"name\":\"Phim Mới\"},{\"link\":\"/genres/big-boobs\",\"name\":\"Big Boobs\"},{\"link\":\"/genres/bu-liem\",\"name\":\"Bú liếm\"},{\"link\":\"/genres/nu-sinh\",\"name\":\"Nữ sinh\"},{\"link\":\"/genres/du-vu\",\"name\":\"Đụ Vú\"},{\"link\":\"/genres/stocking\",\"name\":\"Stocking\"},{\"link\":\"/genres/hiep-dam\",\"name\":\"Hiếp dâm\"},{\"link\":\"/genres/virgin\",\"name\":\"Virgin\"},{\"link\":\"/genres/anal\",\"name\":\"Anal\"},{\"link\":\"/genres/mind-break\",\"name\":\"Mind Break\"},{\"link\":\"/genres/femdom\",\"name\":\"Femdom\"},{\"link\":\"/genres/ahegao\",\"name\":\"Ahegao\"},{\"link\":\"/genres/vanilla\",\"name\":\"Vanilla\"},{\"link\":\"/genres/threesome\",\"name\":\"Threesome\"},{\"link\":\"/genres/milf\",\"name\":\"MILF\"},{\"link\":\"/genres/sex-toy\",\"name\":\"Sex Toy\"},{\"link\":\"/genres/harem\",\"name\":\"Harem\"},{\"link\":\"/genres/plot\",\"name\":\"Plot\"},{\"link\":\"/genres/thu-dam\",\"name\":\"Thủ Dâm\"},{\"link\":\"/genres/loan-luan\",\"name\":\"Loạn luân\"},{\"link\":\"/genres/gang-bang\",\"name\":\"Gang Bang\"},{\"link\":\"/genres/bondage\",\"name\":\"Bondage\"},{\"link\":\"/genres/tsundere\",\"name\":\"Tsundere\"},{\"link\":\"/genres/ntr\",\"name\":\"NTR\"},{\"link\":\"/genres/double-penetration\",\"name\":\"Double Penetration\"},{\"link\":\"/genres/giao-vien\",\"name\":\"Giáo viên\"},{\"link\":\"/genres/loli\",\"name\":\"Loli\"},{\"link\":\"/genres/megane\",\"name\":\"Megane\"},{\"link\":\"/genres/yuri\",\"name\":\"Yuri\"},{\"link\":\"/genres/do-boi\",\"name\":\"Đồ Bơi\"},{\"link\":\"/genres/ugly-bastard\",\"name\":\"Ugly Bastard\"},{\"link\":\"/genres/thac-loan\",\"name\":\"Thác loạn\"},{\"link\":\"/genres/maid\",\"name\":\"Maid\"},{\"link\":\"/genres/bao-dam\",\"name\":\"Bạo dâm\"},{\"link\":\"/genres/thoi-mien\",\"name\":\"Thôi miên\"},{\"link\":\"/genres/sua-me\",\"name\":\"Sữa mẹ\"},{\"link\":\"/genres/tong-tinh\",\"name\":\"Tống tình\"},{\"link\":\"/genres/da-ngam\",\"name\":\"Da ngăm\"},{\"link\":\"/genres/3d\",\"name\":\"3D\"},{\"link\":\"/genres/bao-cao-su\",\"name\":\"Bao cao su\"},{\"link\":\"/genres/monster\",\"name\":\"Monster\"},{\"link\":\"/genres/y-ta\",\"name\":\"Y Tá\"},{\"link\":\"/genres/fantasy\",\"name\":\"Fantasy\"},{\"link\":\"/genres/xuc-tu\",\"name\":\"Xúc tu\"},{\"link\":\"/genres/foot-job\",\"name\":\"Foot Job\"},{\"link\":\"/genres/x-ray\",\"name\":\"X-Ray\"},{\"link\":\"/genres/guro\",\"name\":\"Guro\"},{\"link\":\"/genres/kemonomimi\",\"name\":\"Kemonomimi\"},{\"link\":\"/genres/shota\",\"name\":\"Shota\"},{\"link\":\"/genres/futanari\",\"name\":\"Futanari\"},{\"link\":\"/genres/wafuku\",\"name\":\"Wafuku\"},{\"link\":\"/genres/elf\",\"name\":\"Elf\"},{\"link\":\"/genres/softcore\",\"name\":\"Softcore\"},{\"link\":\"/genres/tieu-tien\",\"name\":\"Tiểu tiện\"},{\"link\":\"/genres/big-girls\",\"name\":\"Big girls\"},{\"link\":\"/genres/quay-roi\",\"name\":\"Quấy rối\"},{\"link\":\"/genres/josei\",\"name\":\"Josei\"},{\"link\":\"/genres/gai-quay\",\"name\":\"Gái quậy\"},{\"link\":\"/genres/scat\",\"name\":\"Scat\"},{\"link\":\"/genres/thuoc-kich-duc\",\"name\":\"Thuốc kích dục\"},{\"link\":\"/genres/idol\",\"name\":\"Idol\"},{\"link\":\"/genres/succubus\",\"name\":\"Succubus\"},{\"link\":\"/genres/cosplay\",\"name\":\"Cosplay\"},{\"link\":\"/genres/mang-thai\",\"name\":\"Mang thai\"},{\"link\":\"/genres/ngu\",\"name\":\"Ngủ\"},{\"link\":\"/genres/vu-lep\",\"name\":\"Vú lép\"},{\"link\":\"/genres/trap\",\"name\":\"Trap\"},{\"link\":\"/genres/thu-thai\",\"name\":\"Thụ thai\"},{\"link\":\"/genres/yaoi\",\"name\":\"Yaoi\"},{\"link\":\"/genres/de-con\",\"name\":\"Đẻ con\"},{\"link\":\"/genres/goblin\",\"name\":\"Goblin\"},{\"link\":\"/genres/furry\",\"name\":\"Furry\"}]`;
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
      menuItem = { slug: link, title: name, type: "Horizontal" };
    } else if (typeStr === "true") {
      menuItem = { slug: link, title: name, type: "Grid" };
    } else if (typeStr === "filter") {
      menuItem = { value: link, name: name };
    } else {
      menuItem = { slug: link, name: name };
    }
    menulist.push(menuItem);
  }
  return menulist;
}

function _$(htmlOrBlock) {
  if (htmlOrBlock && typeof htmlOrBlock === "object" && htmlOrBlock.elements) {
    return htmlOrBlock;
  }
  var instance = {
    sourceHtml: typeof htmlOrBlock === "string" ? htmlOrBlock : "",
    elements: Array.isArray(htmlOrBlock)
      ? htmlOrBlock
      : htmlOrBlock
        ? [htmlOrBlock]
        : [],
    length: 0,
    find: function (selector) {
      if (selector.indexOf(",") !== -1) {
        var results = [];
        var selectors = selector.split(",").map(function (s) {
          return s.trim();
        });
        for (var s = 0; s < selectors.length; s++) {
          if (selectors[s] === "") continue;
          var subInstance = this.find(selectors[s]);
          for (var r = 0; r < subInstance.elements.length; r++) {
            var element = subInstance.elements[r];
            if (results.indexOf(element) === -1) {
              results.push(element);
            }
          }
        }
        var multiInstance = _$(results);
        multiInstance.sourceHtml = this.sourceHtml;
        return multiInstance;
      }
      var results = [];
      var contentFilter = "";
      if (selector.indexOf(":content(") !== -1) {
        var contentMatch = selector.match(
          /:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/,
        );
        if (contentMatch) {
          contentFilter =
            contentMatch[1] || contentMatch[2] || contentMatch[3] || "";
          selector = selector.replace(
            /:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/,
            "",
          );
        }
      }
      var attrNameFilter = "";
      var attrValueFilter = "";
      var attrOperator = "=";
      var hasAttrFilter = false;
      var attrMatch = selector.match(
        /\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/,
      );
      if (attrMatch) {
        hasAttrFilter = true;
        attrNameFilter = attrMatch[1];
        attrOperator = attrMatch[2];
        attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || "";
        selector = selector.replace(/\[.*?\]/, "");
      }
      var notSelector = "";
      if (selector.indexOf(":not(") !== -1) {
        var notMatch = selector.match(/:not\(([^)]+)\)/);
        if (notMatch) {
          notSelector = notMatch[1];
          selector = selector.replace(/:not\([^)]+\)/, "");
        }
      }
      var isFirstFilter = selector.indexOf(":first") !== -1;
      var isLastFilter = selector.indexOf(":last") !== -1;
      selector = selector.replace(/:first|:last/g, "");
      var targetTagName = "";
      var targetId = "";
      var targetClasses = [];
      var selectorToParse = selector.trim();
      if (selectorToParse !== "") {
        var idIndex = selectorToParse.indexOf("#");
        if (idIndex !== -1) {
          var afterId = selectorToParse.substring(idIndex + 1);
          var nextDot = afterId.indexOf(".");
          targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot);
          selectorToParse =
            selectorToParse.substring(0, idIndex) +
            (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1));
        }
        var classParts = selectorToParse.split(".");
        var possibleTag = classParts.shift();
        if (possibleTag) {
          targetTagName = possibleTag.toLowerCase();
        }
        targetClasses = classParts.filter(function (c) {
          return c.length > 0;
        });
      }
      for (var i = 0; i < this.elements.length; i++) {
        var currentHtml = this.elements[i];
        var pos = 0;
        var subResults = [];
        while ((pos = currentHtml.indexOf("<", pos)) !== -1) {
          if (
            currentHtml.charAt(pos + 1) === "/" ||
            currentHtml.charAt(pos + 1) === "!"
          ) {
            pos++;
            continue;
          }
          var endOpenTag = -1;
          var insideQuote = false;
          var quoteChar = "";
          for (var j = pos + 1; j < currentHtml.length; j++) {
            var char = currentHtml.charAt(j);
            if (
              (char === '"' || char === "'") &&
              currentHtml.charAt(j - 1) !== "\\"
            ) {
              if (!insideQuote) {
                insideQuote = true;
                quoteChar = char;
              } else if (char === quoteChar) {
                insideQuote = false;
              }
            }
            if (char === ">" && !insideQuote) {
              endOpenTag = j;
              break;
            }
          }
          if (endOpenTag === -1) break;
          var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1);
          var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/);
          var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : "";
          var isMatched = true;
          if (targetTagName && targetTagName !== currentTagName) {
            isMatched = false;
          }
          var getClassAttr = fullOpenTag.match(
            /class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i,
          );
          var classMatchStr = getClassAttr
            ? getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || ""
            : "";
          var getIdAttr = fullOpenTag.match(
            /id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i,
          );
          var idMatchStr = getIdAttr
            ? getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || ""
            : "";
          if (isMatched && targetId && idMatchStr !== targetId) {
            isMatched = false;
          }
          if (isMatched && targetClasses.length > 0) {
            if (classMatchStr) {
              var currentClasses = classMatchStr.trim().split(/\s+/);
              for (var c = 0; c < targetClasses.length; c++) {
                if (currentClasses.indexOf(targetClasses[c]) === -1) {
                  isMatched = false;
                  break;
                }
              }
            } else {
              isMatched = false;
            }
          }
          if (isMatched && hasAttrFilter) {
            var actualValue = "";
            if (attrNameFilter === "class") {
              actualValue = classMatchStr;
            } else if (attrNameFilter === "id") {
              actualValue = idMatchStr;
            } else {
              var getAnyAttr = fullOpenTag.match(
                new RegExp(
                  attrNameFilter +
                    "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))",
                  "i",
                ),
              );
              actualValue = getAnyAttr
                ? getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || ""
                : "";
            }
            var attrExists =
              fullOpenTag.search(new RegExp(attrNameFilter + "\\s*=", "i")) !==
              -1;
            if (!attrExists) {
              isMatched = false;
            } else {
              if (attrOperator === "=") {
                if (attrNameFilter === "class") {
                  var classes = actualValue.trim().split(/\s+/);
                  if (classes.indexOf(attrValueFilter) === -1)
                    isMatched = false;
                } else if (actualValue !== attrValueFilter) {
                  isMatched = false;
                }
              } else if (attrOperator === "*=") {
                if (actualValue.indexOf(attrValueFilter) === -1)
                  isMatched = false;
              } else if (attrOperator === "^=") {
                if (actualValue.indexOf(attrValueFilter) !== 0)
                  isMatched = false;
              } else if (attrOperator === "$=") {
                if (
                  actualValue.slice(-attrValueFilter.length) !== attrValueFilter
                )
                  isMatched = false;
              }
            }
          }
          if (isMatched) {
            var startTagPos = pos;
            var endTagPos = endOpenTag + 1;
            var selfClosingTags = [
              "img",
              "source",
              "input",
              "br",
              "hr",
              "link",
              "meta",
            ];
            if (
              selfClosingTags.indexOf(currentTagName) === -1 &&
              fullOpenTag.indexOf("/>") === -1
            ) {
              var depth = 1;
              var tagRegex = new RegExp(
                "<(/?)" + currentTagName + "(?:\\s+[^>]*|\\s*>)",
                "gi",
              );
              tagRegex.lastIndex = endOpenTag + 1;
              var match;
              while ((match = tagRegex.exec(currentHtml)) !== null) {
                var isClose = match[1] === "/";
                var fullMatched = match[0];
                if (isClose) {
                  depth--;
                } else if (fullMatched.indexOf("/>") === -1) {
                  depth++;
                }
                if (depth === 0) {
                  endTagPos = tagRegex.lastIndex;
                  break;
                }
              }
              if (depth > 0) {
                endTagPos = currentHtml.length;
              }
            }
            var foundBlock = currentHtml.substring(startTagPos, endTagPos);
            if (contentFilter) {
              var pureText = "";
              if (currentTagName === "script" || currentTagName === "style") {
                var innerStart = foundBlock.indexOf(">") + 1;
                var innerEnd = foundBlock.search(/<\/(?:script|style)/i);
                pureText =
                  innerEnd !== -1
                    ? foundBlock.substring(innerStart, innerEnd)
                    : foundBlock.substring(innerStart);
              } else {
                pureText = foundBlock.replace(/<[^>]+>/g, "").trim();
              }
              var keywords = contentFilter.split("|");
              var isContentMatched = false;
              for (var k = 0; k < keywords.length; k++) {
                if (pureText.indexOf(keywords[k].trim()) !== -1) {
                  isContentMatched = true;
                  break;
                }
              }
              if (!isContentMatched) {
                pos = endTagPos;
                continue;
              }
            }
            if (notSelector) {
              var isNotClass = notSelector.indexOf(".") === 0;
              var isNotId = notSelector.indexOf("#") === 0;
              var notValue = notSelector.substring(1);
              var hasNot = false;
              if (isNotClass && classMatchStr.indexOf(notValue) !== -1)
                hasNot = true;
              if (isNotId && idMatchStr.indexOf(notValue) !== -1) hasNot = true;
              if (!hasNot) subResults.push(foundBlock);
            } else {
              subResults.push(foundBlock);
            }
            pos = endTagPos;
          } else {
            pos++;
          }
        }
        if (isFirstFilter && subResults.length > 0)
          subResults = [subResults[0]];
        if (isLastFilter && subResults.length > 0)
          subResults = [subResults[subResults.length - 1]];
        results = results.concat(subResults);
      }
      var newInstance = _$(results);
      newInstance.sourceHtml = this.sourceHtml || currentHtml;
      return newInstance;
    },
    each: function (callback) {
      for (var i = 0; i < this.elements.length; i++) {
        var childInstance = _$(this.elements[i]);
        childInstance.sourceHtml = this.sourceHtml;
        callback.call(childInstance, i, this.elements[i]);
      }
      return this;
    },
    eq: function (index) {
      if (index < 0) index = this.elements.length + index;
      var matchedElement = this.elements[index];
      this.elements = matchedElement ? [matchedElement] : [];
      this.length = this.elements.length;
      return this;
    },
    attr: function (attrName) {
      if (this.elements.length === 0) return "";
      var elem = this.elements[0];
      var getAttr = elem.match(
        new RegExp(
          attrName + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))",
          "i",
        ),
      );
      return getAttr ? getAttr[1] || getAttr[2] || getAttr[3] || "" : "";
    },
    html: function () {
      if (this.elements.length === 0) return "";
      var elem = this.elements[0];
      var start = elem.indexOf(">") + 1;
      var matchClose = elem.match(/<\/([a-zA-Z0-9_-]+)\s*>\s*$/i);
      if (matchClose) {
        var end = elem.lastIndexOf(matchClose[0]);
        if (start > 0 && end >= start) return elem.substring(start, end);
      }
      return start > 0 ? elem.substring(start) : "";
    },
    text: function (separator) {
      if (this.elements.length === 0) return "";
      var elem = this.elements[0];
      var start = elem.indexOf(">") + 1;
      var end = elem.lastIndexOf("</");
      if (start > 0 && end > start) {
        var content = elem.substring(start, end);
        var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n");
        if (typeof separator === "string") {
          return pureText
            .split("\n")
            .map(function (item) {
              return item.trim();
            })
            .filter(function (item) {
              return item !== "";
            })
            .join(separator);
        }
        return pureText
          .split("\n")
          .map(function (item) {
            return item.trim();
          })
          .filter(function (item) {
            return item !== "";
          })
          .join(" ");
      }
      return "";
    },
    textAll: function (separator) {
      if (this.elements.length === 0) return "";
      var sep = typeof separator === "string" ? separator : " ";
      var allTexts = [];
      for (var i = 0; i < this.elements.length; i++) {
        var elem = this.elements[i];
        var start = elem.indexOf(">") + 1;
        var end = elem.lastIndexOf("</");
        if (start > 0 && end > start) {
          var content = elem.substring(start, end);
          var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n");
          var cleanText = pureText
            .split("\n")
            .map(function (item) {
              return item.trim();
            })
            .filter(function (item) {
              return item !== "";
            })
            .join(" ");
          if (cleanText !== "") {
            allTexts.push(cleanText);
          }
        }
      }
      return allTexts.join(sep);
    },
    next: function () {
      var results = [];
      if (!this.sourceHtml) return this;
      for (var i = 0; i < this.elements.length; i++) {
        var elem = this.elements[i];
        var idx = this.sourceHtml.indexOf(elem);
        if (idx === -1) continue;
        var scanPos = idx + elem.length;
        var nextOpen = this.sourceHtml.indexOf("<", scanPos);
        if (nextOpen !== -1) {
          if (this.sourceHtml.charAt(nextOpen + 1) === "/") continue;
          var endOpenTag = this.sourceHtml.indexOf(">", nextOpen);
          if (endOpenTag === -1) continue;
          var fullOpenTag = this.sourceHtml.substring(nextOpen, endOpenTag + 1);
          var spacePos = fullOpenTag.indexOf(" ");
          var currentTagName =
            spacePos === -1
              ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase()
              : fullOpenTag.substring(1, spacePos).toLowerCase();
          var startTagPos = nextOpen;
          var endTagPos = endOpenTag + 1;
          var selfClosingTags = [
            "img",
            "source",
            "input",
            "br",
            "hr",
            "link",
            "meta",
          ];
          if (
            selfClosingTags.indexOf(currentTagName) === -1 &&
            fullOpenTag.indexOf("/>") === -1
          ) {
            var depth = 1;
            var tagRegex = new RegExp(
              "<(/?)" + currentTagName + "(?:\\s+[^>]*|\\s*>)",
              "gi",
            );
            tagRegex.lastIndex = endOpenTag + 1;
            var match;
            while ((match = tagRegex.exec(this.sourceHtml)) !== null) {
              if (match[1] === "/") depth--;
              else if (match[0].indexOf("/>") === -1) depth++;
              if (depth === 0) {
                endTagPos = tagRegex.lastIndex;
                break;
              }
            }
          }
          results.push(this.sourceHtml.substring(startTagPos, endTagPos));
        }
      }
      var nextInstance = _$(results);
      nextInstance.sourceHtml = this.sourceHtml;
      this.elements = results;
      this.length = results.length;
      return this;
    },
    parent: function () {
      var results = [];
      if (!this.sourceHtml) return this;
      for (var i = 0; i < this.elements.length; i++) {
        var elem = this.elements[i];
        var idx = this.sourceHtml.indexOf(elem);
        if (idx <= 0) continue;
        var scanPos = idx - 1;
        while (scanPos >= 0) {
          var openTagPos = this.sourceHtml.lastIndexOf("<", scanPos);
          if (openTagPos === -1) break;
          if (
            this.sourceHtml.charAt(openTagPos + 1) !== "/" &&
            this.sourceHtml.charAt(openTagPos + 1) !== "!"
          ) {
            var endOpenTag = this.sourceHtml.indexOf(">", openTagPos);
            if (endOpenTag !== -1 && endOpenTag > openTagPos) {
              var fullOpenTag = this.sourceHtml.substring(
                openTagPos,
                endOpenTag + 1,
              );
              var spacePos = fullOpenTag.indexOf(" ");
              var currentTagName =
                spacePos === -1
                  ? fullOpenTag
                      .substring(1, fullOpenTag.length - 1)
                      .toLowerCase()
                  : fullOpenTag.substring(1, spacePos).toLowerCase();
              var endTagPos = endOpenTag + 1;
              var selfClosingTags = [
                "img",
                "source",
                "input",
                "br",
                "hr",
                "link",
                "meta",
              ];
              if (
                selfClosingTags.indexOf(currentTagName) === -1 &&
                fullOpenTag.indexOf("/>") === -1
              ) {
                var depth = 1;
                var tagRegex = new RegExp(
                  "<(/?)" + currentTagName + "(?:\\s+[^>]*|\\s*>)",
                  "gi",
                );
                tagRegex.lastIndex = endOpenTag + 1;
                var match;
                while ((match = tagRegex.exec(this.sourceHtml)) !== null) {
                  if (match[1] === "/") depth--;
                  else if (match[0].indexOf("/>") === -1) depth++;
                  if (depth === 0) {
                    endTagPos = tagRegex.lastIndex;
                    break;
                  }
                }
              }
              if (endTagPos >= idx + elem.length) {
                var parentBlock = this.sourceHtml.substring(
                  openTagPos,
                  endTagPos,
                );
                if (results.indexOf(parentBlock) === -1)
                  results.push(parentBlock);
                break;
              }
            }
          }
          scanPos = openTagPos - 1;
        }
      }
      var parentInstance = _$(results);
      parentInstance.sourceHtml = this.sourceHtml;
      this.elements = results;
      this.length = results.length;
      return this;
    },
    closest: function (selector) {
      var results = [];
      if (!this.sourceHtml || this.elements.length === 0) return _$([]);
      for (var i = 0; i < this.elements.length; i++) {
        var currentElem = this.elements[i];
        var currentObj = _$(currentElem);
        currentObj.sourceHtml = this.sourceHtml;
        var selfCheck = _$(this.sourceHtml).find(selector);
        var isSelfMatched = false;
        for (var s = 0; s < selfCheck.elements.length; s++) {
          if (selfCheck.elements[s] === currentElem) {
            isSelfMatched = true;
            break;
          }
        }
        if (isSelfMatched) {
          if (results.indexOf(currentElem) === -1) results.push(currentElem);
          continue;
        }
        var parentObj = currentObj.parent();
        while (parentObj.elements.length > 0) {
          var parentElem = parentObj.elements[0];
          var checkMatch = _$(this.sourceHtml).find(selector);
          var isMatched = false;
          for (var j = 0; j < checkMatch.elements.length; j++) {
            if (checkMatch.elements[j] === parentElem) {
              isMatched = true;
              break;
            }
          }
          if (isMatched) {
            if (results.indexOf(parentElem) === -1) results.push(parentElem);
            break;
          }
          parentObj = parentObj.parent();
        }
      }
      var closestInstance = _$(results);
      closestInstance.sourceHtml = this.sourceHtml;
      return closestInstance;
    },
  };
  instance.length = instance.elements.length;
  return instance;
}
