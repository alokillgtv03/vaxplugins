var BASEURL = "https://hentaiz1.com";
var DEV = "false";
// https://www.whoreshub.com/categories/4k-porn/
function getManifest() {
  return JSON.stringify({
    id: "hentaiz1",
    name: "Nguồn HentaiVN",
    description: "Nguồn phim Hentai mới.",
    "version": "1.2.4",
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
var episodeNumber = result.episodeNumber;
    
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
    var json = "";
    var match = html.match(/episode[^"']+id[^"']+["']([^"']+)["']/);
    if(match && match[1]){
      json = `[["__skrao",1],{"episodeId":2},"${match[1]}"]`;
      json = BASEURL + "/_app/remote/1edhnia/getEpisodeEmbedUrl?payload=" + BASE64ENCODE(json);
      console.log("key: " + json);
      // https://hentaiz1.com/_app/remote/1edhnia/getEpisodeEmbedUrl?payload=W1siX19za3JhbyIsMV0seyJlcGlzb2RlSWQiOjJ9LCJzYjhsUkVRWC1NWCJd
    }
    return JSON.stringify({
      url: json,
      isEmbed: true,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: url
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

function parseEmbedResponse(html, url) {
  console.log("parseEmbedResponse [Tầng tiếp theo]: " + url);
  //console.log("parseEmbedResponse [Raw]: " + html);
  
  try {
      var embedUrl = "";
      var match = html.match(/https?:\/\/[^\s"\\]+/);
      var rawJS = runJS();
        if (match) {
            var embedUrl = match[0];
            console.log("URL bóc được:", embedUrl);
           return JSON.stringify({
                url: embedUrl,
                isEmbed: false,
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                  Referer: url,
                  "Block-Ads": false,
                  "Block-Css": "",
                  "Custom-Js": rawJS
                },
                subtitles: [],
              });
            // Kết quả: https://x.haiten.org/watch?v=d635d67c-8f2b-47b5-a61a-b61d22f5fafd
        }
        console.log("parseEmbedResponse [Next URL]: " + embedUrl);
      
  } catch (e) {
    console.log("[Lỗi parseEmbedResponse]", e);
    return JSON.stringify({ "url": "", "isEmbed": false, "headers": {} });
  }
}


function runJS() {
    return `
HTMLRAW = 0;
BODYRAW = 0;
CSSBLOCK = 0;
VIDEOEND = 0;
NUMBERRAW = 0;

(function() {
    'use strict';
    
    console.log("[Anti-Redirect] Đã kích hoạt bảo vệ!");

    // 1. Chặn window.open (chặn mở tab/popup mới)
    window.open = function(url, target, features) {
        console.log("[Anti-Redirect] Đã chặn window.open ->", url);
        return null; // Trả về null để vô hiệu hóa
    };

    // 2. Chặn các phương thức chuyển hướng location
    try {
        // Lưu lại origin ban đầu để so sánh
        var initialOrigin = window.location.origin;

        // Ghi đè location.assign và location.replace
        window.location.assign = function(url) {
            console.log("[Anti-Redirect] Đã chặn location.assign ->", url);
        };
        
        window.location.replace = function(url) {
            console.log("[Anti-Redirect] Đã chặn location.replace ->", url);
        };

        // Chặn ghi đè location.href trực tiếp bằng Property Descriptor
        var originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            configurable: true,
            enumerable: true,
            get: function() {
                return originalLocation;
            },
            set: function(val) {
                console.log("[Anti-Redirect] Đã chặn đổi location.href ->", val);
                return originalLocation.href;
            }
        });
    } catch (e) {
        console.log("[Anti-Redirect Warning] Không thể khóa location descriptor:", e.message);
    }

    // 3. Chặn sự kiện перед/khi chuyển trang (beforeunload & unload trap)
    window.addEventListener('beforeunload', function(e) {
        // Vô hiệu hóa các script cố tình trigger chuyển hướng bằng unload
        e.stopPropagation();
    }, true);

    // 4. Bắt và chặn click vào thẻ <a> có target="_blank" hoặc link nhảy ra ngoài domain
    document.addEventListener('click', function(e) {
        var target = e.target;
        
        // Tìm thẻ <a> gần nhất nếu click vào phần tử con bên trong
        while (target && target.tagName !== 'A') {
            target = target.parentNode;
        }

        if (target && target.tagName === 'A') {
            var href = target.getAttribute('href');
            var targetAttr = target.getAttribute('target');

            // Chặn nếu link mở tab mới (_blank) hoặc link chứa javascript:
            if (targetAttr === '_blank' || (href && href.startsWith('javascript:'))) {
                console.log("[Anti-Redirect] Đã chặn click thẻ A nguy hiểm ->", href);
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }
    }, true);

    // 5. Chặn tự động submit Form nhảy trang quảng cáo
    document.addEventListener('submit', function(e) {
        var form = e.target;
        if (form && form.getAttribute('target') === '_blank') {
            console.log("[Anti-Redirect] Đã chặn Form submit _blank");
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

})();


function bridgeLog(msg, check) {
    try {
      if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
        window.SnifferBridge.log(msg);
        if (check === true && typeof window.SnifferBridge.toast === 'function') {
          window.SnifferBridge.toast(msg, 1000);
        }
      } else if (typeof console !== 'undefined' && console.log) {
        console.log(msg);
      }
    } catch(e) {}
  }

function envideo(){
  if(VIDEOEND == 1){
    window.SnifferBridge.play("https://google.com", "");
  }
}
  
(function injectCSS() {
  try {
    // 1. Khai báo nội dung CSS của bạn ở đây
    const cssStyle = "body,html,*{display:none!important,backgroud:black!important;opacity:0!important;z-index:-999999}";

    // 2. Tạo thẻ <style>
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.setAttribute('data-injected-by', 'custom-script');

    if (styleElement.styleSheet) {
      // Dành cho các trình duyệt IE cũ
      styleElement.styleSheet.cssText = cssStyle;
    } else {
      // Dành cho trình duyệt hiện đại
      if(CSSBLOCK == 1){
        styleElement.appendChild(document.createTextNode(cssStyle));
      }
    }

    // 3. Tìm vị trí để chèn (ưu tiên <head>, nếu chưa có head thì lấy documentElement)
    const targetNode = document.head || document.getElementsByTagName('head')[0] || document.documentElement;

    if (targetNode) {
      if(CSSBLOCK == 1){
        targetNode.appendChild(styleElement);
        bridgeLog("Chèn css ngay lập tức.")
      }
    } else {
      // Fallback: Nếu DOM chưa sẵn sàng, chờ DOMContentLoaded rồi mới chèn
      document.addEventListener('DOMContentLoaded', function () {
        (document.head || document.documentElement).appendChild(styleElement);
        setTimeout(function(){
          if(HTMLRAW == 1 && NUMBERRAW == 0){
            NUMBERRAW = 1;
            if(BODYRAW == 1){
              var rawhtml = document.getElementsByTagName("body")[0].outerHTML;
              bridgeLog("RAWHTML: " + rawhtml)
            }
            else{
              var rawhtml = document.getElementsByTagName("html")[0].outerHTML;
              bridgeLog("RAWHTML: " + rawhtml)
            }
            
          }
        },2000)
        bridgeLog("Chèn Css sau khi load xong")

       
      });
    }
  } catch (error) {
    // Bắt toàn bộ lỗi để đảm bảo script chính vẫn tiếp tục chạy bình thường
    bridgeLog('Không thể chèn CSS tự động, bỏ qua lỗi:', error);
  }
})();

(function initLocalBlobSniffer() {
  if (window.__BLOB_SNIFFER_INITIALIZED__) return;
  window.__BLOB_SNIFFER_INITIALIZED__ = 1;

  var hasDispatchedAny = 0;
  var isFinished = 0;
  var timeoutTimer = null;

  

  // =========================================================================
  // 1. GIỚI HẠN THỜI GIAN 10 GIÂY (TIMEOUT)
  // =========================================================================
  bridgeLog("Đang tiến hành tìm link Video, xin chờ....", true);

  timeoutTimer = setTimeout(function() {
    if (hasDispatchedAny === 0 && isFinished === 0) {
      isFinished = 1;
      bridgeLog("❌ [TIMEOUT] Đã quá 10 giây nhưng không tìm thấy Blob M3U8!", false);
      bridgeLog("Không tìm thấy link video (Hết thời gian 10s).", true);
      
      // Fallback khi không tìm thấy
      if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
        envideo();
      }
    }
  }, 20000); // 10,000 ms = 10 giây

  function stopTimeout() {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  }

  // =========================================================================
  // 2. KIỂM TRA M3U8 HỢP LỆ
  // =========================================================================
  function isValidM3U8(content) {
    if (typeof content !== 'string') return false;
    var trimmed = content.trim();
    return trimmed.indexOf('#EXTM3U') === 0 && 
          (trimmed.indexOf('#EXTINF') !== -1 || trimmed.indexOf('#EXT-X-STREAM-INF') !== -1);
  }

  // =========================================================================
  // 3. CHUYỂN NỘI DUNG M3U8 VỀ APP (LOCAL SERVER)
  // =========================================================================
  function dispatchM3u8ToApp(m3u8Content) {
    if (!m3u8Content || hasDispatchedAny === 1) return;
    hasDispatchedAny = 1;
    isFinished = 1;
    stopTimeout(); // Hủy đếm ngược 10s khi đã lấy thành công

    bridgeLog('🎯 [LOCAL-DISPATCH] Đã tìm thấy M3U8! Đang nạp vào Local Player...');
    bridgeLog("🎯 Bắt link thành công! Đang phát video...", true);

    try {
      if (window.SnifferBridge && typeof window.SnifferBridge.playM3u8Content === 'function') {
        // Truyền trực tiếp nội dung M3U8 thô + URL hiện tại làm Referer/BaseURL
        window.SnifferBridge.playM3u8Content(m3u8Content, window.location.href);
      } else {
        bridgeLog('❌ SnifferBridge.playM3u8Content không khả dụng!');
      }
    } catch(e) {
      bridgeLog('❌ [DISPATCH ERROR]: ' + e.message);
    }
  }

  // =========================================================================
  // 4. HOOK URL.createObjectURL (BẮT TRỰC TIẾP DỮ LIỆU BLOB M3U8)
  // =========================================================================
  try {
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      var originalCreateObjectURL = URL.createObjectURL;
      
      URL.createObjectURL = function(blob) {
        var blobUrl = originalCreateObjectURL.apply(this, arguments);

        if (isFinished === 0 && blob && (blob instanceof Blob || blob instanceof File)) {
          var processContent = function(content) {
            if (isValidM3U8(content)) {
              //bridgeLog('🎯 [FOUND-BLOB]: Phát hiện M3U8 từ Blob RAM!');
              dispatchM3u8ToApp(content);
            }
          };

          if (typeof blob.text === 'function') {
            blob.text().then(processContent).catch(function(){});
          } else {
            var reader = new FileReader();
            reader.onload = function(e) {
              processContent(e.target.result);
            };
            reader.readAsText(blob);
          }
        }

        return blobUrl;
      };
      
      bridgeLog('🚀 [INIT] Đã Hook thành công.');
      setTimeout(function(){
          if(HTMLRAW == 1 && NUMBERRAW == 0){
            NUMBERRAW = 1;
            if(BODYRAW == 1){
              var rawhtml = document.getElementsByTagName("body")[0].outerHTML;
              bridgeLog("RAWHTML: " + rawhtml)
            }
            else{
              var rawhtml = document.getElementsByTagName("html")[0].outerHTML;
              bridgeLog("RAWHTML: " + rawhtml)
            }
            
          }
        },2000)
    }
  } catch (e) {
    bridgeLog('❌ [INIT-ERROR]: ' + e.message);
  }
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

function BASE64ENCODE(str) {
    try {
        if (!str) return "";

        // 1. Encode String ra mảng UTF-8 Bytes trước
        var utf8Bytes = [];
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i);
            if (code < 128) {
                utf8Bytes.push(code);
            } else if (code < 2048) {
                utf8Bytes.push((code >> 6) | 192, (code & 63) | 128);
            } else if ((code & 0xFC00) === 0xD800 && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
                // Ký tự Surrogate Pair
                code = 0x10000 + ((code & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
                utf8Bytes.push((code >> 18) | 240, ((code >> 12) & 63) | 128, ((code >> 6) & 63) | 128, (code & 63) | 128);
            } else {
                utf8Bytes.push((code >> 12) | 224, ((code >> 6) & 63) | 128, (code & 63) | 128);
            }
        }

        // 2. Chuyển mảng UTF-8 Bytes thành chuỗi Base64
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var encoded = '';
        var byte1, byte2, byte3;
        var b1, b2, b3, b4;

        for (var j = 0; j < utf8Bytes.length; j += 3) {
            byte1 = utf8Bytes[j];
            byte2 = j + 1 < utf8Bytes.length ? utf8Bytes[j + 1] : NaN;
            byte3 = j + 2 < utf8Bytes.length ? utf8Bytes[j + 2] : NaN;

            b1 = byte1 >> 2;
            b2 = ((byte1 & 3) << 4) | (isNaN(byte2) ? 0 : byte2 >> 4);
            b3 = isNaN(byte2) ? 64 : ((byte2 & 15) << 2) | (isNaN(byte3) ? 0 : byte3 >> 6);
            b4 = isNaN(byte3) ? 64 : byte3 & 63;

            encoded += chars.charAt(b1) + chars.charAt(b2) + chars.charAt(b3) + chars.charAt(b4);
        }

        return encoded;
    } catch (e) {
        console.log("[BASE64ENCODE Error]:", e.message || e);
        return "";
    }
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
