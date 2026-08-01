var BASEURL = "https://phimfun.net";
var DEV = "";
// https://www.whoreshub.com/categories/4k-porn/
function getManifest() {
  return JSON.stringify({
    id: "phimfun",
    name: "Nguồn Phim Fun",
    description: "Nguồn phim mới.",
    version: "1.1.2",
    info: "Nguồn phim dự phòng, có server riêng có thể sơ cưa khi những nguồn khác bị lỗi. Có cơ chế lưu lại tập vừa xem và có thể chuyển tập không cần quay lại menu phim.",
    baseUrl: "https://phimfun.net",
    iconUrl: "https://phimfun.net/Content/PhimFun/Imgs/phimFun.png",
    isEnabled: true,
    "layoutType": "HORIZONTAL",
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

function getHomeSections() {
    return JSON.stringify([
        {
            "slug": "/tuyen-tap-1",
            "title": "Phim Lồng Tiếng",
            "type": "Horizontal"
        },
       {
            "slug": "/the-loai/phim-chieu-rap-1",
            "title": "Phim Lẻ",
            "type": "Horizontal"
        },
       {
            "slug": "/the-loai/phim-le-1",
            "title": "Phim Bộ",
            "type": "Horizontal"
        },
        {
            "slug": "/the-loai/phim-bo-1",
            "title": "Thuyét Minh",
            "type": "Horizontal"
        },
        {
            "slug": "/the-loai/phim-cap-nhat-1",
            "title": "Phim Mới",
            "type": "Grid"
        }
    ]);
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
      resultUrl += path;
    }
    if (page > 1) {
      resultUrl = resultUrl.replace(/(\d+)$/i, "");
      resultUrl += page;
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
          resultUrl =
            BASEURL +
            "/search?k=" +
            encodeURIComponent(keyword) +
            "&page=" +
            page;
        } else {
          resultUrl = BASEURL + "/search?k=" + encodeURIComponent(keyword);
        }
      } catch (jsonErr) {
        resultUrl = BASEURL + "/search?k=" + encodeURIComponent(keyword);
      }
    } else {
      resultUrl = BASEURL + "/search?k=" + encodeURIComponent(keyword);
    }

    log("getUrlSearch[url]: \n" + resultUrl);
    return resultUrl;
  } catch (e) {
    log("getUrlSearch[err]:\n " + e);
  }
}

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
    var $doc = _$(html)
    var quality = "";
    var items = [];
     $doc
      .find(".MovieList")
      .find("li")
      .each(function () {
        var href = this.find("a").attr("href");
        href = fixHref(href);
        href = href.replace("/phim/", "/xem-phim/");
        var title = this.find("img").attr("alt");
        title = decodeHTMLEntities(title);
        var src = this.find("img").attr("src");
        if (src.indexOf("base64") > -1) {
          src = this.find("img").attr("data-src");
        }
        src = fixHref(src);

        var episode_current = this.find(".mc__ep-badge").text().trim();

        function isValidMediaUrl(url) {
          if (!url || typeof url !== "string") return false;

          var cleanUrl = url.trim();

          if (
            cleanUrl.indexOf("_spEsc") > -1 ||
            cleanUrl.indexOf("'+") > -1 ||
            cleanUrl.indexOf("+'") > -1 ||
            cleanUrl.indexOf("${") > -1 ||
            cleanUrl.indexOf("javascript:") > -1
          ) {
            return false;
          }

          var httpPattern = /^https?:\/\/[^\s"'<>+]+$/i;
          return httpPattern.test(cleanUrl);
        }

        if (isValidMediaUrl(href)) {
          var cleanThumb = (src || "").replace(/&amp;/g, "&").trim();

          if (cleanThumb && cleanThumb.indexOf("http") !== 0) {
            cleanThumb = "https:" + cleanThumb;
          }

          items.push({
            id: href.trim(),
            title: (title || "").trim(),
            posterUrl: cleanThumb,
            backdropUrl: cleanThumb,
            quality: quality || "",
            lang: "",
            episode_current: episode_current || "",
          });
        }
      });

    return JSON.stringify({
      items: items,
      pagination: {
        currentPage: 1,
        totalPages: 999,
      },
    });
  } catch (e) {
    log("parseListResponse[err]:\n " + e);
    return JSON.stringify({
      items: [
        {
          id: $url || "error_url",
          title: "Lỗi: " + e,
          posterUrl: "",
          backdropUrl: "",
        },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
      },
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

    var idMatch =
      /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html) ||
      /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(html);
    var id = idMatch ? idMatch[1] : url || "";

    var slug = "";
    if (id) {
      var slugMatch = /\/phim\/([^/_.]+)/.exec(id);
      slug = slugMatch ? slugMatch[1] : id;
    }
    if (!slug) {
      var slugMatch2 = /\/phim\/([^/_.]+)/.exec(html);
      slug = slugMatch2 ? slugMatch2[1] : "";
    }

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
    var $doc = _$(html);
    
    var rmatch = html.match(/meta\s+property="og:url"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) lurl = rmatch[1];

    rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) limg = rmatch[1];

    if (limg.indexOf("//") === 0) {
      limg = "https:" + limg;
    } else if (limg.indexOf("http") === -1) {
      limg = BASEURL + limg;
    }
    lname = $doc.find("h1").text();
    lname = decodeHTMLEntities(lname);
    var ldes = $doc.find("h2:content('Thông tin về phim')").next().text();
    ldes = decodeHTMLEntities(ldes);
    var year = 2026;
    var extra = "";

    var rawText = $doc.find(".Date").text();
    var match = rawText.match(/\b(19|20)\d{2}\b/);

    if (match) {
      year = parseInt(match[0], 10);
    }

    if (isNaN(year)) {
      year = 2026;
    }
    status = $doc
      .find(".aim-hero__meta")
      .find(".aim-status--airing")
      .text();

    var categoryResult = [];
    $doc
      .find(".Description")
      .find(".Genre")
      .find("a")
      .each(function () {
        var link = this.attr("href") || this.find("a").attr("href");
        var name = this.text().replace(/\s+/g, " ").trim();
        name = decodeHTMLEntities(name);

        if (name && link) {
          var slug = typeof getSlug === "function" ? getSlug(link) : link;
          categoryResult.push("[" + name + "](" + slug + ")");
        }
      });

    category = categoryResult.join(", ");
    var actorResult = [];
    $doc
      .find(".Description")
      .find(".Cast")
      .find("a")
      .each(function () {
        var link = this.attr("href") || this.find("a").attr("href");
        var name = this.text().replace(/\s+/g, " ").trim();
        name = decodeHTMLEntities(name);

        if (name && link) {
          var slug = typeof getSlug === "function" ? getSlug(link) : link;
          actorResult.push("[" + name + "](" + slug + ")");
        }
      });

    lactor = actorResult.join(", ");

    quality = $doc.find("span.Time").text();
    episode_current = $doc.find(".aim-hero__meta").find("span:last").text();
    rating = $doc.find(".post-ratings").text();
    rating = parseInt(rating, 10);
    var servers = [];
    stastus = 0;
    numSV = 0;
    $listSV = $doc
      .find(".SeasonBx:content('Danh sách máy chủ')")
      .find("a")
      .each(function () {
        numSV++;
        var nameSV = "Server " + numSV;
        var items = [];
         $doc
          .find(".SeasonBx:content('Danh sách tập')")
          .find("#halim-list-server")
          .find("a")
          .each(function () {
            var link = this.attr("href");
            link = fixHref(link);
            if (numSV > 1) {
              link = link + "?sv" + numSV + "=true";
            }
            var name = this.attr("title");
            items.push({
              id: link,
              name: name,
              slug: name.replace(/[\s\S]*?(\d+)/, "tap-$1"),
            });
            stastus++;
          });
        servers.push({
          name: nameSV,
          episodes: items,
        });
        servers = sortEpisodesByName(servers);
      });
    episode_current = "Đang có: " + status;

    return JSON.stringify({
      id: id,
      title: lname,
      posterUrl: limg,
      backdropUrl: limg,
      description: ldes,
      quality: quality,
      year: year,
      rating: rating,
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
      id: slug || url || "error",
      title: "error",
      servers: [],
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
    if (url) log("parseDetailResponse[url]: \n" + url);
    var $doc = _$(html);
    var dataSV = {};
    var $stream = $doc.find("#iframeStream").attr("src");
    var servers = [];
    dataSV.stream = $stream;
    dataSV.current = url;
    stastus = 0;
    numSV = 0;
    $listSV = $doc
      .find(".SeasonBx:content('Danh|sách|máy|chủ')")
      .find("a")
      .each(function () {
        numSV++;
        var nameSV = "Server " + numSV;
        var items = [];
        $doc
          .find(".SeasonBx:content('Danh|sách|tập')")
          .find("#halim-list-server")
          .find("a")
          .each(function () {
            var link = this.attr("href");
            link = fixHref(link);
            if (numSV > 1) {
              link = link + "?sv" + numSV + "=true";
            }
            var name = this.attr("title");
            items.push({
              id: link,
              name: name,
              slug: name.replace(/[\s\S]*?(\d+)/, "tap-$1"),
            });
            stastus++;
          });
        servers.push({
          name: nameSV,
          episodes: items,
        });
        servers = sortEpisodesByName(servers);
      });
    dataSV.servers = servers;
    var customJS = runJS(dataSV);
    return JSON.stringify({
      url: url,
      isEmbed: false,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: url,
        "Custom-Js": customJS,
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

// 1. MODULE CHẶN POPUP VÀ TỰ ĐỘNG CHUYỂN LINK

// Hàm bọc duy nhất chứa toàn bộ 3 hàm chức năng
function runJS(config) {
  // 1. Hàm chống chuyển hướng (Anti-Redirect)
  // 1. MODULE CHẶN REDIRECT & POPUP TỐI ƯU TRIỆT ĐỂ
  function getAntiRedirectCode() {
    return `
    (function() {
        'use strict';

        // --- A. CHẶN POPUP & WINDOW OPEN ---
        const dummyWindow = { focus: function(){}, close: function(){}, postMessage: function(){} };
        window.open = function() {
            console.log("[Protected] Blocked window.open popup");
            return dummyWindow;
        };
        window.showModalDialog = function() { return null; };

        // --- B. ĐÓNG BĂNG NAVIGATION (location & history) ---
        const preventNav = function(msg) {
            console.log("[Protected] Blocked navigation attempt: " + msg);
        };

        try {
            // Chặn replace & assign
            window.location.replace = function() { preventNav("location.replace"); };
            window.location.assign = function() { preventNav("location.assign"); };
            
            // Chặn history push/replace
            if (window.history) {
                window.history.pushState = function() { preventNav("history.pushState"); };
                window.history.replaceState = function() { preventNav("history.replaceState"); };
            }

            // Khóa cứng setter của location.href
            const originalHref = window.location.href;
            Object.defineProperty(window, 'location', {
                configurable: false,
                enumerable: true,
                get: function() { return window.location; },
                set: function(val) { preventNav("setting window.location directly"); }
            });

            // Chặn thay đổi top.location hoặc parent.location
            try {
                Object.defineProperty(window, 'top', {
                    get: function() { return window; }
                });
            } catch(e) {}

        } catch(e) {
            console.warn("[Protected] Advanced location freeze warning:", e);
        }

        // --- C. CHẶN CLICK & MOUSEDOWN TRÊN TOÀN BỘ TRANG (Cả capture phase) ---
        const blockEvent = function(e) {
            let target = e.target || e.srcElement;
            while (target && target !== document) {
                if (target.tagName === 'A') {
                    let href = target.getAttribute('href');
                    let targetAttr = target.getAttribute('target');
                    
                    // Nếu là link mở tab mới hoặc link chứa domain ngoài -> Chặn ngay
                    if (targetAttr === '_blank' || (href && href.startsWith('http') && !href.includes(window.location.hostname))) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        console.log("[Protected] Blocked external link click:", href);
                        return false;
                    }
                }
                target = target.parentNode;
            }
        };

        // Bắt sớm ở phase capture cho cả click, mousedown, mouseup, pointerdown
        ['click', 'mousedown', 'mouseup', 'pointerdown', 'touchend'].forEach(function(evtName) {
            window.addEventListener(evtName, blockEvent, true);
        });

        // --- D. CHẶN RỜI TRANG (beforeunload) ---
        window.addEventListener('beforeunload', function(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, true);

    })();
    `;
  }

  // 2. MODULE PLAYER & LOGIC GIAO DIỆN CHÍNH (Đã bổ sung sandbox & referrerpolicy cho Iframe)
  function getMainLogicCode(config) {
    var safeConfigString = JSON.stringify(config || {});

    return `
        if (document.head) { 
            document.head.innerHTML = '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'; 
        }
        document.documentElement.style.cssText = 'margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important;';
        document.body.innerHTML = '';
        document.body.style.cssText = 'margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important; position:fixed !important; top:0 !important; left:0 !important; z-index:0 !important;';

        const DATA = ${safeConfigString};
        const INITIAL_STREAM = DATA.stream || "";
        const CURRENT_URL = DATA.current || "";
        const SERVERS = Array.isArray(DATA.servers) ? DATA.servers : [];
        const AUTO_HIDE_TIME = 5000;
        const movieId = DATA.movieId || "movie_default_id";
        const storageKey = "anime_history_" + movieId;
        const widthStorageKey = "anime_player_iframe_width";
        const heightStorageKey = "anime_player_iframe_height";
        const scaleStorageKey = "anime_player_iframe_scale";

        let currentServerIndex = 0;
        let currentEpisodeIndex = 0;
        let hideTimer = null;

        let styleTag = document.createElement('style');
        styleTag.textContent = \\\`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            * { box-sizing: border-box !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; }
            #framePlay { position: fixed !important; top: 50% !important; left: 50% !important; transform-origin: center center !important; border: none !important; margin: 0 !important; padding: 0 !important; z-index: 1 !important; display: block !important; transition: width 0.15s ease, height 0.15s ease, transform 0.15s ease !important; }
            #iframe-event-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 10 !important;
    background: transparent !important;
    cursor: pointer !important;
    touch-action: manipulation !important;
}
            .floating-control-ui { opacity: 0 !important; pointer-events: none !important; transition: opacity 0.4s ease !important; }
            .floating-control-ui.active-show { opacity: 1 !important; pointer-events: auto !important; }
            #center-play-notice { position: fixed !important; top: calc(50% + 50px) !important; left: 50% !important; transform: translate(-50%, -50%) !important; z-index: 999999 !important; background: rgba(15, 15, 18, 0.92) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; color: #fff !important; padding: 12px 24px !important; border-radius: 30px !important; font-size: 14px !important; font-weight: 600 !important; box-shadow: 0 8px 32px rgba(0,0,0,0.7) !important; pointer-events: none !important; transition: opacity 0.3s ease, transform 0.3s ease !important; opacity: 0; text-align: center !important; white-space: nowrap !important; }
            #server-select-box { appearance: none !important; -webkit-appearance: none !important; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e") !important; background-repeat: no-repeat !important; background-position: right 6px center !important; background-size: 10px !important; padding-right: 22px !important; }
            .dim-btn { background: rgba(255, 255, 255, 0.12) !important; color: #fff !important; border: none !important; border-radius: 4px !important; width: 22px !important; height: 22px !important; cursor: pointer !important; font-size: 13px !important; font-weight: bold !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; padding: 0 !important; line-height: 1 !important; }
            .dim-btn:hover { background: rgba(255, 255, 255, 0.25) !important; }
            .dim-input { width: 38px !important; background: transparent !important; border: none !important; color: #fff !important; text-align: center !important; font-size: 12px !important; font-weight: 700 !important; outline: none !important; padding: 0 !important; }
            .dim-input::-webkit-outer-spin-button, .dim-input::-webkit-inner-spin-button { -webkit-appearance: none !important; margin: 0 !important; }
            .dim-input[type=number] { -moz-appearance: textfield !important; }
            .ep-grid-btn { display: flex !important; align-items: center !important; justify-content: center !important; padding: 8px 12px !important; border-radius: 6px !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; color: #fff !important; cursor: pointer !important; font-size: 12px !important; font-weight: 700 !important; text-align: center !important; white-space: nowrap !important; transition: all 0.2s ease !important; user-select: none !important; box-sizing: border-box !important; width: 100% !important; min-height: 36px !important; }
            .ep-grid-btn:hover { border-color: rgba(255, 255, 255, 0.3) !important; }
            .ep-grid-btn.active { background-color: #e50914 !important; border-color: #e50914 !important; }
            .ep-grid-btn.inactive { background-color: rgba(255, 255, 255, 0.08) !important; }
            .toast-action-btn { background: rgba(255, 255, 255, 0.15) !important; color: #fff !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; padding: 5px 10px !important; border-radius: 5px !important; font-size: 11px !important; font-weight: 700 !important; cursor: pointer !important; transition: background 0.2s ease !important; display: inline-flex !important; align-items: center !important; }
            .toast-action-btn:hover { background: rgba(255, 255, 255, 0.3) !important; }
            .toast-action-btn.primary { background: #e50914 !important; border-color: #e50914 !important; }
            .toast-action-btn.primary:hover { background: #b80710 !important; }
        \\\`;
        document.head.appendChild(styleTag);

        let overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: '#000', zIndex: '999998', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: '#fff'
        });

        function showLoading(msg) {
            msg = msg || 'Đang tải...';
            overlay.innerHTML = '<div style="border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #e50914; border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite;"></div><div style="margin-top: 14px; font-size: 13px; color: #ccc; font-weight: 500;">' + msg + '</div>';
            overlay.style.opacity = '1';
            overlay.style.display = 'flex';
            if (!document.getElementById('loading-overlay')) document.body.appendChild(overlay);
        }

        function hideLoading() {
            var initLoader = document.getElementById('raw-initial-loading');
            if (initLoader) initLoader.remove();
            var initStyle = document.getElementById('loading-screen-style');
            if (initStyle) initStyle.remove();

            overlay.style.transition = 'opacity 0.25s ease';
            overlay.style.opacity = '0';
            setTimeout(function() { overlay.style.display = 'none'; }, 250);
        }

        function showCenterPlayNotice(text) {
            let notice = document.getElementById('center-play-notice');
            if (!notice) {
                notice = document.createElement('div');
                notice.id = 'center-play-notice';
                document.body.appendChild(notice);
            }
            notice.textContent = text;
            requestAnimationFrame(function() { notice.style.opacity = '1'; });
           let overlayEvt = document.getElementById('iframe-event-overlay');
if (overlayEvt) overlayEvt.style.pointerEvents = 'auto';
        }

        function hideCenterPlayNotice() {
            let notice = document.getElementById('center-play-notice');
            if (notice) notice.style.opacity = '0';
            let overlayEvt = document.getElementById('iframe-event-overlay');
if (overlayEvt) overlayEvt.style.pointerEvents = 'none';
        }

        function showHistoryPrompt(savedSrvIdx, savedEpIdx, savedEpName, nextEpIdx, nextEpName) {
            let toast = document.getElementById('mini-action-toast');
            if (toast) toast.remove();
            toast = document.createElement('div');
            toast.id = 'mini-action-toast';
            toast.className = 'floating-control-ui active-show';
            toast.style.cssText = 'position: fixed !important; bottom: 20px !important; right: 20px !important; z-index: 2147483647 !important; background-color: rgba(22, 22, 26, 0.95) !important; backdrop-filter: blur(12px) !important; border: 1px solid rgba(255,255,255,0.2) !important; color: #fff !important; padding: 12px 16px !important; border-radius: 8px !important; font-size: 12px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important; transition: opacity 0.4s ease !important; opacity: 0; display: flex !important; flex-direction: column !important; gap: 10px !important; max-width: 380px !important;';

            let title = document.createElement('div');
            title.innerHTML = '📍 Lần trước bạn đã xem đến <b>' + savedEpName + '</b>.';

            let btnGroup = document.createElement('div');
            btnGroup.style.cssText = 'display: flex !important; gap: 6px !important; align-items: center !important;';

            let btnHistory = document.createElement('button');
            btnHistory.className = 'toast-action-btn primary';
            btnHistory.textContent = savedEpName;
            btnHistory.onclick = function(e) { e.stopPropagation(); toast.remove(); fetchAndPlayEpisode(savedSrvIdx, savedEpIdx); };

            let btnNext = null;
            if (nextEpIdx !== null) {
                btnNext = document.createElement('button');
                btnNext.className = 'toast-action-btn';
                btnNext.textContent = 'Xem ' + nextEpName;
                btnNext.onclick = function(e) { e.stopPropagation(); toast.remove(); fetchAndPlayEpisode(savedSrvIdx, nextEpIdx); };
            }

            let btnCancel = document.createElement('button');
            btnCancel.className = 'toast-action-btn';
            btnCancel.textContent = 'Hủy ✕';
            btnCancel.onclick = function(e) { e.stopPropagation(); toast.remove(); };

            btnGroup.appendChild(btnHistory);
            if (btnNext) btnGroup.appendChild(btnNext);
            btnGroup.appendChild(btnCancel);
            toast.appendChild(title);
            toast.appendChild(btnGroup);
            document.body.appendChild(toast);

            requestAnimationFrame(function() { toast.classList.add('active-show'); });
            resetAutoHideTimer();
        }

        function resetAutoHideTimer() {
            let elements = document.querySelectorAll('.floating-control-ui');
            elements.forEach(function(el) { el.classList.add('active-show'); });
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(function() {
                elements.forEach(function(el) { el.classList.remove('active-show'); });
                let popupGrid = document.getElementById("episode-grid-popup");
                let scalePopupGrid = document.getElementById("scale-grid-popup");
                if (popupGrid) popupGrid.style.display = "none";
                if (scalePopupGrid) scalePopupGrid.style.display = "none";
                let overlayEvt = document.getElementById('iframe-event-overlay');
if (overlayEvt) overlayEvt.style.pointerEvents = 'auto';
            }, AUTO_HIDE_TIME);
        }

        function matchCurrentEpisode() {
            let foundServer = 0;
            let foundEpisode = 0;
            if (CURRENT_URL) {
                SERVERS.forEach(function(srv, sIdx) {
                    if (srv && Array.isArray(srv.episodes)) {
                        srv.episodes.forEach(function(ep, eIdx) {
                            if (ep.id === CURRENT_URL || ep.url === CURRENT_URL || (ep.id && CURRENT_URL.includes(ep.id))) {
                                foundServer = sIdx;
                                foundEpisode = eIdx;
                            }
                        });
                    }
                });
            }
            currentServerIndex = foundServer;
            currentEpisodeIndex = foundEpisode;

            let savedHistoryRaw = localStorage.getItem(storageKey);
            if (savedHistoryRaw) {
                try {
                    let savedHistory = JSON.parse(savedHistoryRaw);
                    let savedSrvIdx = savedHistory.serverIndex || 0;
                    let savedEpIdx = savedHistory.episodeIndex || 0;
                    let diff = Math.abs(currentEpisodeIndex - savedEpIdx);

                    if (diff > 2) {
                        let savedSrv = SERVERS[savedSrvIdx];
                        let savedEp = savedSrv && savedSrv.episodes ? savedSrv.episodes[savedEpIdx] : null;
                        if (savedEp) {
                            let savedEpName = savedEp.name || savedEp.slug || ('Tập ' + (savedEpIdx + 1));
                            let nextEpIdx = (savedEpIdx + 1 < savedSrv.episodes.length) ? (savedEpIdx + 1) : null;
                            let nextEpName = "";
                            if (nextEpIdx !== null) {
                                let nextEp = savedSrv.episodes[nextEpIdx];
                                nextEpName = nextEp ? (nextEp.name || nextEp.slug || ('Tập ' + (nextEpIdx + 1))) : ('Tập ' + (nextEpIdx + 1));
                            }
                            setTimeout(function() { showHistoryPrompt(savedSrvIdx, savedEpIdx, savedEpName, nextEpIdx, nextEpName); }, 800);
                        }
                    }
                } catch (e) { console.error("Error reading history", e); }
            }
            saveCurrentState();
        }

        function saveCurrentState() {
            localStorage.setItem(storageKey, JSON.stringify({ serverIndex: currentServerIndex, episodeIndex: currentEpisodeIndex, timestamp: Date.now() }));
        }

        function getSavedWidth() { return parseInt(localStorage.getItem(widthStorageKey), 10) || window.innerWidth; }
        function getSavedHeight() { return parseInt(localStorage.getItem(heightStorageKey), 10) || window.innerHeight; }
        function getSavedScale() { return parseFloat(localStorage.getItem(scaleStorageKey)) || 1.0; }

        function applyIframeDimensions(w, h, s) {
            w = Math.max(150, parseInt(w, 10) || window.innerWidth);
            h = Math.max(100, parseInt(h, 10) || window.innerHeight);
            s = parseFloat(s) || 1.0;

            let iframe = document.getElementById("framePlay");
            if (iframe) {
                iframe.style.setProperty('width', w + 'px', 'important');
                iframe.style.setProperty('height', h + 'px', 'important');
                iframe.style.setProperty('transform', 'translate(-50%, -50%) scale(' + s + ')', 'important');
            }
            localStorage.setItem(widthStorageKey, w);
            localStorage.setItem(heightStorageKey, h);
            localStorage.setItem(scaleStorageKey, s);

            let wInput = document.getElementById("iframe-w-input");
            let hInput = document.getElementById("iframe-h-input");
            let scaleTrigger = document.getElementById("scale-select-trigger");

            if (wInput && document.activeElement !== wInput) wInput.value = w;
            if (hInput && document.activeElement !== hInput) hInput.value = h;
            if (scaleTrigger) scaleTrigger.textContent = "Scale " + s.toFixed(1) + "x ▼";
        }

        function setupIframeSecurity(iframeEl) {
            // Cấu hình Sandbox để chặn triệt để iframe con tự chuyển hướng trang mẹ
            // Bỏ "allow-top-navigation" và "allow-top-navigation-by-user-activation"
            iframeEl.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-presentation");
            iframeEl.setAttribute("referrerpolicy", "no-referrer");
            iframeEl.setAttribute("allowfullscreen", "true");
            iframeEl.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
        }

        function fetchAndPlayEpisode(serverIdx, epIdx) {
            currentServerIndex = serverIdx;
            currentEpisodeIndex = epIdx;
            saveCurrentState();

            let activeServer = SERVERS[currentServerIndex];
            let activeEpisode = activeServer && activeServer.episodes ? activeServer.episodes[currentEpisodeIndex] : null;
            if (!activeEpisode || !activeEpisode.id) return;

            let epName = activeEpisode.name || ('Tập ' + (currentEpisodeIndex + 1));
            showLoading('Đang tải ' + epName.toLowerCase() + '...');

            fetch(activeEpisode.id, { headers: { 'Accept': 'text/html' } })
                .then(function(res) { return res.text(); })
                .then(function(htmlText) {
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(htmlText, 'text/html');
                    let iframeStream = doc.querySelector('#iframeStream');
                    if (iframeStream && iframeStream.getAttribute('src')) {
                        let realStreamUrl = iframeStream.getAttribute('src').trim();
                        if (realStreamUrl.startsWith("//")) realStreamUrl = "https:" + realStreamUrl;
                        let framePlay = document.getElementById('framePlay');
                        if (framePlay) {
                            setupIframeSecurity(framePlay);
                            framePlay.src = realStreamUrl;
                            framePlay.onload = function() {
                                hideLoading();
                                showCenterPlayNotice('▶ Đã chuyển ' + epName + '. Vui lòng nhấn Play để tiếp tục xem!');
                            };
                        }
                    } else { hideLoading(); }
                })
                .catch(function(err) { console.error(err); hideLoading(); })
                .finally(function() {
                    updateEpisodeGridState();
                    updateNavState();
                    resetAutoHideTimer();
                });
        }

        function initBaseLayout() {
            matchCurrentEpisode();
            showLoading("Đang tải...");

            let framePlay = document.createElement("iframe");
            framePlay.id = "framePlay";
            framePlay.scrolling = "no";
            setupIframeSecurity(framePlay);

            let cleanInitialStream = INITIAL_STREAM;
            if (cleanInitialStream.startsWith("//")) cleanInitialStream = "https:" + cleanInitialStream;
            framePlay.src = cleanInitialStream;
framePlay.onload = function() {
    hideLoading();
    applyIframeDimensions(getSavedWidth(), getSavedHeight(), getSavedScale());

    //showCenterPlayNotice('▶ Vui lòng nhấn Play để xem video!');

    clearTimeout(window.__noticeHideTimer);

    window.__noticeHideTimer = setTimeout(function() {
        hideCenterPlayNotice();
    }, 2500);
};
            document.body.appendChild(framePlay);

            let eventOverlay = document.createElement("div");
            eventOverlay.id = "iframe-event-overlay";
function handleOverlayTrigger() {
    resetAutoHideTimer();

    //showCenterPlayNotice('▶ Vui lòng nhấn Play để xem video!');

    clearTimeout(window.__noticeHideTimer);

    window.__noticeHideTimer = setTimeout(function() {
        hideCenterPlayNotice();
    }, 2500);
}
document.addEventListener('mousemove', handleOverlayTrigger);
document.addEventListener('click', handleOverlayTrigger);
document.addEventListener('touchstart', handleOverlayTrigger, { passive: true });
            document.body.appendChild(eventOverlay);

            let container = document.createElement("div");
            container.id = "floating-select-box";
            container.className = "floating-control-ui active-show";
            Object.assign(container.style, {
                position: "fixed", top: "16px", right: "20px", zIndex: "999999",
                backgroundColor: "rgba(22, 22, 26, 0.92)", backdropFilter: "blur(16px)",
                webkitBackdropFilter: "blur(16px)", padding: "5px 8px", borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.15)", boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
                color: "#fff", fontSize: "12px", display: "flex", flexDirection: "row",
                alignItems: "center", gap: "6px", boxSizing: "border-box", flexShrink: "0"
            });

            function createDimensionControl(type) {
                let isW = (type === 'W');
                let group = document.createElement("div");
                Object.assign(group.style, {
                    display: "flex", alignItems: "center", gap: "2px",
                    backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "2px 5px",
                    borderRadius: "5px", border: "1px solid rgba(255,255,255,0.1)", boxSizing: "border-box"
                });

                let lbl = document.createElement("span");
                lbl.textContent = isW ? "W:" : "H:";
                lbl.style.cssText = "font-size: 11px !important; color: #aaa !important; font-weight: 700 !important; margin-right: 2px !important;";

                let btnMinus = document.createElement("button");
                btnMinus.className = "dim-btn";
                btnMinus.textContent = "-";
                btnMinus.onclick = function(e) {
                    e.stopPropagation();
                    let curW = getSavedWidth(), curH = getSavedHeight(), curS = getSavedScale();
                    applyIframeDimensions(isW ? curW - 20 : curW, isW ? curH : curH - 20, curS);
                };

                let input = document.createElement("input");
                input.id = isW ? "iframe-w-input" : "iframe-h-input";
                input.type = "number";
                input.className = "dim-input";
                input.value = isW ? getSavedWidth() : getSavedHeight();
                input.onchange = function(e) {
                    let val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                        let curW = getSavedWidth(), curH = getSavedHeight(), curS = getSavedScale();
                        applyIframeDimensions(isW ? val : curW, isW ? curH : val, curS);
                    }
                };
                input.onkeydown = function(e) { e.stopPropagation(); };

                let btnPlus = document.createElement("button");
                btnPlus.className = "dim-btn";
                btnPlus.textContent = "+";
                btnPlus.onclick = function(e) {
                    e.stopPropagation();
                    let curW = getSavedWidth(), curH = getSavedHeight(), curS = getSavedScale();
                    applyIframeDimensions(isW ? curW + 20 : curW, isW ? curH : curH + 20, curS);
                };

                group.appendChild(lbl); group.appendChild(btnMinus); group.appendChild(input); group.appendChild(btnPlus);
                return group;
            }

            let widthCtrl = createDimensionControl('W');
            let heightCtrl = createDimensionControl('H');

            let scaleTrigger = document.createElement("span");
            scaleTrigger.id = "scale-select-trigger";
            scaleTrigger.textContent = "Scale " + getSavedScale().toFixed(1) + "x ▼";
            styleClickable(scaleTrigger, "rgba(255, 255, 255, 0.08)");

            let serverSelect = document.createElement("select");
            serverSelect.id = "server-select-box";
            styleSelect(serverSelect);

            SERVERS.forEach(function(srv, idx) {
                let opt = document.createElement("option");
                opt.value = idx;
                opt.textContent = srv.name || ("Server " + (idx + 1));
                opt.style.backgroundColor = "#1c1c1e";
                opt.style.color = "#fff";
                serverSelect.appendChild(opt);
            });
            serverSelect.value = currentServerIndex;
            serverSelect.onchange = function(e) {
                let newSrvIdx = parseInt(e.target.value, 10) || 0;
                currentServerIndex = newSrvIdx;
                renderEpisodeGrid();
                fetchAndPlayEpisode(currentServerIndex, currentEpisodeIndex);
            };

            let epTrigger = document.createElement("span");
            epTrigger.id = "ep-select-trigger";
            styleClickable(epTrigger, "#e50914");

            container.appendChild(widthCtrl);
            container.appendChild(heightCtrl);
            container.appendChild(scaleTrigger);
            container.appendChild(serverSelect);
            container.appendChild(epTrigger);

            let scalePopupGrid = createPopup("scale-grid-popup", "240px");
            let popupGrid = createPopup("episode-grid-popup", "340px");

            scaleTrigger.onclick = function(e) {
                e.stopPropagation();
                popupGrid.style.display = "none";
                scalePopupGrid.style.display = (scalePopupGrid.style.display === "grid") ? "none" : "grid";
            };

            epTrigger.onclick = function(e) {
                e.stopPropagation();
                scalePopupGrid.style.display = "none";
                popupGrid.style.display = (popupGrid.style.display === "grid") ? "none" : "grid";
            };

            function handleOutsideClick(e) {
                if (!container.contains(e.target) && !popupGrid.contains(e.target) && !scalePopupGrid.contains(e.target)) {
                    popupGrid.style.display = "none";
                    scalePopupGrid.style.display = "none";
                }
            }
            document.addEventListener("click", handleOutsideClick);
            document.addEventListener("touchstart", handleOutsideClick, { passive: true });

            let navPrev = createNavButton("nav-prev-item", "&#10094;", "left", "30px");
            navPrev.onclick = function(e) {
                e.stopPropagation();
                if (currentEpisodeIndex > 0) fetchAndPlayEpisode(currentServerIndex, currentEpisodeIndex - 1);
            };

            let navNext = createNavButton("nav-next-item", "&#10095;", "right", "30px");
            navNext.onclick = function(e) {
                e.stopPropagation();
                let activeServer = SERVERS[currentServerIndex];
                if (activeServer && activeServer.episodes && currentEpisodeIndex < activeServer.episodes.length - 1) {
                    fetchAndPlayEpisode(currentServerIndex, currentEpisodeIndex + 1);
                }
            };

            document.body.appendChild(container);
            document.body.appendChild(popupGrid);
            document.body.appendChild(scalePopupGrid);
            document.body.appendChild(navPrev);
            document.body.appendChild(navNext);

            resetAutoHideTimer();
            renderEpisodeGrid();
            renderScaleGrid();
            applyIframeDimensions(getSavedWidth(), getSavedHeight(), getSavedScale());
        }

        function createPopup(id, width) {
            let el = document.createElement("div");
            el.id = id;
            el.className = "floating-control-ui active-show";
            Object.assign(el.style, {
                position: "fixed", top: "58px", right: "20px", zIndex: "1000000",
                backgroundColor: "rgba(22, 22, 26, 0.95)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.15)", padding: "10px", borderRadius: "10px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.8)", width: width, maxHeight: "250px",
                overflowY: "auto", display: "none", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px"
            });
            return el;
        }

        function createNavButton(id, arrow, side, offset) {
            let btn = document.createElement("span");
            btn.id = id;
            btn.className = "floating-control-ui active-show";
            btn.innerHTML = arrow;
            Object.assign(btn.style, {
                position: "fixed", top: "50%", zIndex: "999999", transform: "translateY(-50%)",
                width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "rgba(20, 20, 20, 0.6)",
                backdropFilter: "blur(8px)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff",
                fontSize: "16px", fontWeight: "bold", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", userSelect: "none"
            });
            btn.style[side] = offset;
            return btn;
        }

        function renderEpisodeGrid() {
            let popupGrid = document.getElementById("episode-grid-popup");
            if (!popupGrid) return;
            popupGrid.innerHTML = "";
            let activeServer = SERVERS[currentServerIndex];
            let episodes = activeServer ? (activeServer.episodes || []) : [];
            episodes.forEach(function(ep, idx) {
                let epItem = document.createElement("div");
                epItem.className = "ep-grid-btn " + (idx === currentEpisodeIndex ? "active" : "inactive");
                epItem.textContent = ep.name || ep.slug || ("Tập " + (idx + 1));
                epItem.onclick = function(e) {
                    e.stopPropagation();
                    popupGrid.style.display = "none";
                    fetchAndPlayEpisode(currentServerIndex, idx);
                };
                popupGrid.appendChild(epItem);
            });
            updateEpisodeGridState();
        }

        function updateEpisodeGridState() {
            let epTrigger = document.getElementById("ep-select-trigger");
            if (epTrigger) {
                let activeServer = SERVERS[currentServerIndex];
                let ep = activeServer && activeServer.episodes ? activeServer.episodes[currentEpisodeIndex] : null;
                epTrigger.textContent = (ep ? (ep.name || ep.slug) : "Chọn Tập") + " ▼";
            }
        }

        function updateNavState() {
            let navPrev = document.getElementById("nav-prev-item");
            let navNext = document.getElementById("nav-next-item");
            let activeServer = SERVERS[currentServerIndex];
            let maxEp = activeServer && activeServer.episodes ? activeServer.episodes.length : 0;
            if (navPrev) navPrev.style.opacity = currentEpisodeIndex <= 0 ? "0.3" : "1";
            if (navNext) navNext.style.opacity = currentEpisodeIndex >= maxEp - 1 ? "0.3" : "1";
        }

        function renderScaleGrid() {
            let scalePopupGrid = document.getElementById("scale-grid-popup");
            if (!scalePopupGrid) return;
            scalePopupGrid.innerHTML = "";
            let curSavedScale = getSavedScale();
            for (let sVal = 0.5; sVal <= 2.05; sVal += 0.1) {
                let formattedVal = Math.round(sVal * 10) / 10;
                let item = document.createElement("div");
                item.className = "ep-grid-btn " + ((Math.abs(formattedVal - curSavedScale) < 0.05) ? "active" : "inactive");
                item.textContent = formattedVal.toFixed(1) + "x";
                item.onclick = function(e) {
                    e.stopPropagation();
                    scalePopupGrid.style.display = "none";
                    applyIframeDimensions(getSavedWidth(), getSavedHeight(), formattedVal);
                };
                scalePopupGrid.appendChild(item);
            }
        }

        function styleSelect(el) {
            Object.assign(el.style, {
                padding: "4px 8px", borderRadius: "5px", border: "1px solid rgba(255, 255, 255, 0.12)",
                backgroundColor: "rgba(255, 255, 255, 0.08)", color: "#fff", cursor: "pointer",
                fontSize: "12px", outline: "none", boxSizing: "border-box", fontWeight: "600"
            });
        }

        function styleClickable(el, bgColor) {
            Object.assign(el.style, {
                padding: "4px 10px", borderRadius: "5px", border: "1px solid rgba(255, 255, 255, 0.1)",
                backgroundColor: bgColor, color: "#fff", cursor: "pointer", fontSize: "12px",
                fontWeight: "700", textAlign: "center", transition: "background 0.2s", display: "inline-block",
                userSelect: "none", boxSizing: "border-box", flexShrink: "0"
            });
        }

        initBaseLayout();
    `;
  }

  // 3. HÀM TỔNG KHỞI TẠO
  function rawJS(config) {
    var antiRedirectCode = getAntiRedirectCode();
    var mainLogicCode = getMainLogicCode(config);

    return `
(function() {
    // 1. CHẠY SỚM NHẤT MODULE CHẶN REDIRECT
    ${antiRedirectCode}

    // 2. CHÈN LOADING SCREEN
    var styleLoading = document.createElement('style');
    styleLoading.id = 'loading-screen-style';
    styleLoading.textContent = \`
        @keyframes rawSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        #raw-initial-loading {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background-color: #000000 !important;
            z-index: 2147483647 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            color: #ffffff !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        #raw-initial-loading .spinner {
            border: 3px solid rgba(255,255,255,0.1) !important;
            border-top: 3px solid #e50914 !important;
            border-radius: 50% !important;
            width: 45px !important;
            height: 45px !important;
            animation: rawSpin 0.8s linear infinite !important;
        }
        #raw-initial-loading .text {
            margin-top: 16px !important;
            font-size: 14px !important;
            color: #cccccc !important;
            font-weight: 500 !important;
            letter-spacing: 0.5px !important;
        }
    \`;

    var loaderDiv = document.createElement('div');
    loaderDiv.id = 'raw-initial-loading';
    loaderDiv.innerHTML = '<div class="spinner"></div><div class="text">Đang khởi tạo trình phát...</div>';

    var targetHead = document.head || document.documentElement;
    if (targetHead) {
        targetHead.appendChild(styleLoading);
        targetHead.appendChild(loaderDiv);
    }

    // 3. CHỜ TẢI XONG DOM RỒI MỚI CHÈN LOGIC CHÍNH
    function injectScriptOnLoad() {
        var scriptTag = document.createElement('script');
        scriptTag.type = 'text/javascript';
        scriptTag.textContent = \`${mainLogicCode}\`;
        if (document.body) {
            document.body.appendChild(scriptTag);
        } else {
            document.documentElement.appendChild(scriptTag);
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        injectScriptOnLoad();
    } else {
        window.addEventListener('DOMContentLoaded', injectScriptOnLoad);
    }
})();
`;
  }

  // TỰ ĐỘNG CHẠY NGAY KHI HÀM BỌC ĐƯỢC KHỞI TẠO
  return rawJS(config);
}

// Gọi hàm bọc chạy ngay tại đây (truyền biến config của bạn vào)

// 2. MODULE PLAYER & LOGIC GIAO DIỆN CHÍNH
function getMainLogicCode(config) {
  var safeConfigString = JSON.stringify(config || {});

  return `
        if (document.head) { 
            document.head.innerHTML = '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'; 
        }
        document.documentElement.style.cssText = 'margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important;';
        document.body.innerHTML = '';
        document.body.style.cssText = 'margin:0 !important; padding:0 !important; width:100vw !important; height:100vh !important; overflow:hidden !important; background:#000 !important; position:fixed !important; top:0 !important; left:0 !important; z-index:0 !important;';

        const DATA = ${safeConfigString};
        const INITIAL_STREAM = DATA.stream || "";
        const CURRENT_URL = DATA.current || "";
        const SERVERS = Array.isArray(DATA.servers) ? DATA.servers : [];
        const AUTO_HIDE_TIME = 15000;
        const movieId = DATA.movieId || "movie_default_id";
        const storageKey = "anime_history_" + movieId;
        const widthStorageKey = "anime_player_iframe_width";
        const heightStorageKey = "anime_player_iframe_height";
        const scaleStorageKey = "anime_player_iframe_scale";

        let currentServerIndex = 0;
        let currentEpisodeIndex = 0;
        let hideTimer = null;

        let styleTag = document.createElement('style');
        styleTag.textContent = \\\`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            * { box-sizing: border-box !important; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; }
            #framePlay { position: fixed !important; top: 50% !important; left: 50% !important; transform-origin: center center !important; border: none !important; margin: 0 !important; padding: 0 !important; z-index: 1 !important; display: block !important; transition: width 0.15s ease, height 0.15s ease, transform 0.15s ease !important; }
            #iframe-event-overlay { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 10 !important; background: transparent !important; cursor: pointer !important; }
            .floating-control-ui { opacity: 0 !important; pointer-events: none !important; transition: opacity 0.4s ease !important; }
            .floating-control-ui.active-show { opacity: 1 !important; pointer-events: auto !important; }
            #center-play-notice { position: fixed !important; top: calc(50% + 50px) !important; left: 50% !important; transform: translate(-50%, -50%) !important; z-index: 999999 !important; background: rgba(15, 15, 18, 0.92) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; color: #fff !important; padding: 12px 24px !important; border-radius: 30px !important; font-size: 14px !important; font-weight: 600 !important; box-shadow: 0 8px 32px rgba(0,0,0,0.7) !important; pointer-events: none !important; transition: opacity 0.3s ease, transform 0.3s ease !important; opacity: 0; text-align: center !important; white-space: nowrap !important; }
            #server-select-box { appearance: none !important; -webkit-appearance: none !important; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e") !important; background-repeat: no-repeat !important; background-position: right 6px center !important; background-size: 10px !important; padding-right: 22px !important; }
            .dim-btn { background: rgba(255, 255, 255, 0.12) !important; color: #fff !important; border: none !important; border-radius: 4px !important; width: 22px !important; height: 22px !important; cursor: pointer !important; font-size: 13px !important; font-weight: bold !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; padding: 0 !important; line-height: 1 !important; }
            .dim-btn:hover { background: rgba(255, 255, 255, 0.25) !important; }
            .dim-input { width: 38px !important; background: transparent !important; border: none !important; color: #fff !important; text-align: center !important; font-size: 12px !important; font-weight: 700 !important; outline: none !important; padding: 0 !important; }
            .dim-input::-webkit-outer-spin-button, .dim-input::-webkit-inner-spin-button { -webkit-appearance: none !important; margin: 0 !important; }
            .dim-input[type=number] { -moz-appearance: textfield !important; }
            .ep-grid-btn { display: flex !important; align-items: center !important; justify-content: center !important; padding: 8px 12px !important; border-radius: 6px !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; color: #fff !important; cursor: pointer !important; font-size: 12px !important; font-weight: 700 !important; text-align: center !important; white-space: nowrap !important; transition: all 0.2s ease !important; user-select: none !important; box-sizing: border-box !important; width: 100% !important; min-height: 36px !important; }
            .ep-grid-btn:hover { border-color: rgba(255, 255, 255, 0.3) !important; }
            .ep-grid-btn.active { background-color: #e50914 !important; border-color: #e50914 !important; }
            .ep-grid-btn.inactive { background-color: rgba(255, 255, 255, 0.08) !important; }
            .toast-action-btn { background: rgba(255, 255, 255, 0.15) !important; color: #fff !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; padding: 5px 10px !important; border-radius: 5px !important; font-size: 11px !important; font-weight: 700 !important; cursor: pointer !important; transition: background 0.2s ease !important; display: inline-flex !important; align-items: center !important; }
            .toast-action-btn:hover { background: rgba(255, 255, 255, 0.3) !important; }
            .toast-action-btn.primary { background: #e50914 !important; border-color: #e50914 !important; }
            .toast-action-btn.primary:hover { background: #b80710 !important; }
        \\\`;
        document.head.appendChild(styleTag);

        let overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: '#000', zIndex: '999998', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: '#fff'
        });

        function showLoading(msg) {
            msg = msg || 'Đang tải...';
            overlay.innerHTML = '<div style="border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #e50914; border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite;"></div><div style="margin-top: 14px; font-size: 13px; color: #ccc; font-weight: 500;">' + msg + '</div>';
            overlay.style.opacity = '1';
            overlay.style.display = 'flex';
            if (!document.getElementById('loading-overlay')) document.body.appendChild(overlay);
        }

        function hideLoading() {
            var initLoader = document.getElementById('raw-initial-loading');
            if (initLoader) initLoader.remove();
            var initStyle = document.getElementById('loading-screen-style');
            if (initStyle) initStyle.remove();

            overlay.style.transition = 'opacity 0.25s ease';
            overlay.style.opacity = '0';
            setTimeout(function() { overlay.style.display = 'none'; }, 250);
        }

        function showCenterPlayNotice(text) {
            let notice = document.getElementById('center-play-notice');
            if (!notice) {
                notice = document.createElement('div');
                notice.id = 'center-play-notice';
                document.body.appendChild(notice);
            }
            notice.textContent = text;
            requestAnimationFrame(function() { notice.style.opacity = '1'; });
            let overlayEvt = document.getElementById('iframe-event-overlay');
            if (overlayEvt) overlayEvt.style.display = 'block';
        }

        function hideCenterPlayNotice() {
            let notice = document.getElementById('center-play-notice');
            if (notice) notice.style.opacity = '0';
            let overlayEvt = document.getElementById('iframe-event-overlay');
            if (overlayEvt) overlayEvt.style.display = 'none';
        }

        function showHistoryPrompt(savedSrvIdx, savedEpIdx, savedEpName, nextEpIdx, nextEpName) {
            let toast = document.getElementById('mini-action-toast');
            if (toast) toast.remove();
            toast = document.createElement('div');
            toast.id = 'mini-action-toast';
            toast.className = 'floating-control-ui active-show';
            toast.style.cssText = 'position: fixed !important; bottom: 20px !important; right: 20px !important; z-index: 2147483647 !important; background-color: rgba(22, 22, 26, 0.95) !important; backdrop-filter: blur(12px) !important; border: 1px solid rgba(255,255,255,0.2) !important; color: #fff !important; padding: 12px 16px !important; border-radius: 8px !important; font-size: 12px !important; box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important; transition: opacity 0.4s ease !important; opacity: 0; display: flex !important; flex-direction: column !important; gap: 10px !important; max-width: 380px !important;';

            let title = document.createElement('div');
            title.innerHTML = '📍 Lần trước bạn đã xem đến <b>' + savedEpName + '</b>.';

            let btnGroup = document.createElement('div');
            btnGroup.style.cssText = 'display: flex !important; gap: 6px !important; align-items: center !important;';

            let btnHistory = document.createElement('button');
            btnHistory.className = 'toast-action-btn primary';
            btnHistory.textContent = savedEpName;
            btnHistory.onclick = function(e) { e.stopPropagation(); toast.remove(); fetchAndPlayEpisode(savedSrvIdx, savedEpIdx); };

            let btnNext = null;
            if (nextEpIdx !== null) {
                btnNext = document.createElement('button');
                btnNext.className = 'toast-action-btn';
                btnNext.textContent = 'Xem ' + nextEpName;
                btnNext.onclick = function(e) { e.stopPropagation(); toast.remove(); fetchAndPlayEpisode(savedSrvIdx, nextEpIdx); };
            }

            let btnCancel = document.createElement('button');
            btnCancel.className = 'toast-action-btn';
            btnCancel.textContent = 'Hủy ✕';
            btnCancel.onclick = function(e) { e.stopPropagation(); toast.remove(); };

            btnGroup.appendChild(btnHistory);
            if (btnNext) btnGroup.appendChild(btnNext);
            btnGroup.appendChild(btnCancel);
            toast.appendChild(title);
            toast.appendChild(btnGroup);
            document.body.appendChild(toast);

            requestAnimationFrame(function() { toast.classList.add('active-show'); });
            resetAutoHideTimer();
        }

        function resetAutoHideTimer() {
            let elements = document.querySelectorAll('.floating-control-ui');
            elements.forEach(function(el) { el.classList.add('active-show'); });
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(function() {
                elements.forEach(function(el) { el.classList.remove('active-show'); });
                let popupGrid = document.getElementById("episode-grid-popup");
                let scalePopupGrid = document.getElementById("scale-grid-popup");
                if (popupGrid) popupGrid.style.display = "none";
                if (scalePopupGrid) scalePopupGrid.style.display = "none";
                let overlayEvt = document.getElementById('iframe-event-overlay');
                if (overlayEvt) overlayEvt.style.display = 'block';
            }, AUTO_HIDE_TIME);
        }

        function matchCurrentEpisode() {
            let foundServer = 0;
            let foundEpisode = 0;
            if (CURRENT_URL) {
                SERVERS.forEach(function(srv, sIdx) {
                    if (srv && Array.isArray(srv.episodes)) {
                        srv.episodes.forEach(function(ep, eIdx) {
                            if (ep.id === CURRENT_URL || ep.url === CURRENT_URL || (ep.id && CURRENT_URL.includes(ep.id))) {
                                foundServer = sIdx;
                                foundEpisode = eIdx;
                            }
                        });
                    }
                });
            }
            currentServerIndex = foundServer;
            currentEpisodeIndex = foundEpisode;

            let savedHistoryRaw = localStorage.getItem(storageKey);
            if (savedHistoryRaw) {
                try {
                    let savedHistory = JSON.parse(savedHistoryRaw);
                    let savedSrvIdx = savedHistory.serverIndex || 0;
                    let savedEpIdx = savedHistory.episodeIndex || 0;
                    let diff = Math.abs(currentEpisodeIndex - savedEpIdx);

                    if (diff > 2) {
                        let savedSrv = SERVERS[savedSrvIdx];
                        let savedEp = savedSrv && savedSrv.episodes ? savedSrv.episodes[savedEpIdx] : null;
                        if (savedEp) {
                            let savedEpName = savedEp.name || savedEp.slug || ('Tập ' + (savedEpIdx + 1));
                            let nextEpIdx = (savedEpIdx + 1 < savedSrv.episodes.length) ? (savedEpIdx + 1) : null;
                            let nextEpName = "";
                            if (nextEpIdx !== null) {
                                let nextEp = savedSrv.episodes[nextEpIdx];
                                nextEpName = nextEp ? (nextEp.name || nextEp.slug || ('Tập ' + (nextEpIdx + 1))) : ('Tập ' + (nextEpIdx + 1));
                            }
                            setTimeout(function() { showHistoryPrompt(savedSrvIdx, savedEpIdx, savedEpName, nextEpIdx, nextEpName); }, 800);
                        }
                    }
                } catch (e) { console.error("Error reading history", e); }
            }
            saveCurrentState();
        }

        function saveCurrentState() {
            localStorage.setItem(storageKey, JSON.stringify({ serverIndex: currentServerIndex, episodeIndex: currentEpisodeIndex, timestamp: Date.now() }));
        }

        function getSavedWidth() { return parseInt(localStorage.getItem(widthStorageKey), 10) || window.innerWidth; }
        function getSavedHeight() { return parseInt(localStorage.getItem(heightStorageKey), 10) || window.innerHeight; }
        function getSavedScale() { return parseFloat(localStorage.getItem(scaleStorageKey)) || 1.0; }

        function applyIframeDimensions(w, h, s) {
            w = Math.max(150, parseInt(w, 10) || window.innerWidth);
            h = Math.max(100, parseInt(h, 10) || window.innerHeight);
            s = parseFloat(s) || 1.0;

            let iframe = document.getElementById("framePlay");
            if (iframe) {
                iframe.style.setProperty('width', w + 'px', 'important');
                iframe.style.setProperty('height', h + 'px', 'important');
                iframe.style.setProperty('transform', 'translate(-50%, -50%) scale(' + s + ')', 'important');
            }
            localStorage.setItem(widthStorageKey, w);
            localStorage.setItem(heightStorageKey, h);
            localStorage.setItem(scaleStorageKey, s);

            let wInput = document.getElementById("iframe-w-input");
            let hInput = document.getElementById("iframe-h-input");
            let scaleTrigger = document.getElementById("scale-select-trigger");

            if (wInput && document.activeElement !== wInput) wInput.value = w;
            if (hInput && document.activeElement !== hInput) hInput.value = h;
            if (scaleTrigger) scaleTrigger.textContent = "Scale " + s.toFixed(1) + "x ▼";
        }

        function fetchAndPlayEpisode(serverIdx, epIdx) {
            currentServerIndex = serverIdx;
            currentEpisodeIndex = epIdx;
            saveCurrentState();

            let activeServer = SERVERS[currentServerIndex];
            let activeEpisode = activeServer && activeServer.episodes ? activeServer.episodes[currentEpisodeIndex] : null;
            if (!activeEpisode || !activeEpisode.id) return;

            let epName = activeEpisode.name || ('Tập ' + (currentEpisodeIndex + 1));
            showLoading('Đang tải ' + epName.toLowerCase() + '...');

            fetch(activeEpisode.id, { headers: { 'Accept': 'text/html' } })
                .then(function(res) { return res.text(); })
                .then(function(htmlText) {
                    let parser = new DOMParser();
                    let doc = parser.parseFromString(htmlText, 'text/html');
                    let iframeStream = doc.querySelector('#iframeStream');
                    if (iframeStream && iframeStream.getAttribute('src')) {
                        let realStreamUrl = iframeStream.getAttribute('src').trim();
                        if (realStreamUrl.startsWith("//")) realStreamUrl = "https:" + realStreamUrl;
                        let framePlay = document.getElementById('framePlay');
                        if (framePlay) {
                            framePlay.setAttribute("referrerpolicy", "no-referrer");
                            framePlay.src = realStreamUrl;
                            framePlay.onload = function() {
                                hideLoading();
                                showCenterPlayNotice('▶ Đã chuyển ' + epName + '. Vui lòng nhấn Play để tiếp tục xem!');

clearTimeout(window.__noticeHideTimer);

window.__noticeHideTimer = setTimeout(function() {
    hideCenterPlayNotice();
}, 2500);
                            };
                        }
                    } else { hideLoading(); }
                })
                .catch(function(err) { console.error(err); hideLoading(); })
                .finally(function() {
                    updateEpisodeGridState();
                    updateNavState();
                    resetAutoHideTimer();
                });
        }

        function initBaseLayout() {
            matchCurrentEpisode();
            showLoading("Đang tải...");

            let framePlay = document.createElement("iframe");
            framePlay.id = "framePlay";
            framePlay.scrolling = "no";
            framePlay.setAttribute("referrerpolicy", "no-referrer");
            framePlay.setAttribute("allowfullscreen", "true");
            framePlay.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");

            let cleanInitialStream = INITIAL_STREAM;
            if (cleanInitialStream.startsWith("//")) cleanInitialStream = "https:" + cleanInitialStream;
            framePlay.src = cleanInitialStream;
            framePlay.onload = function() {
                hideLoading();
                applyIframeDimensions(getSavedWidth(), getSavedHeight(), getSavedScale());
                //showCenterPlayNotice('▶ Vui lòng nhấn Play để xem video!');
            };
            document.body.appendChild(framePlay);

            let eventOverlay = document.createElement("div");
            eventOverlay.id = "iframe-event-overlay";
function handleOverlayTrigger() {
    resetAutoHideTimer();

    showCenterPlayNotice('▶ Vui lòng nhấn Play để xem video!');

    clearTimeout(window.__noticeHideTimer);

    window.__noticeHideTimer = setTimeout(function() {
        hideCenterPlayNotice();
    }, 2500);
}
            eventOverlay.addEventListener('mousemove', handleOverlayTrigger);
            eventOverlay.addEventListener('click', handleOverlayTrigger);
            eventOverlay.addEventListener('touchstart', handleOverlayTrigger, { passive: true });
            document.body.appendChild(eventOverlay);

            let container = document.createElement("div");
            container.id = "floating-select-box";
            container.className = "floating-control-ui active-show";
            Object.assign(container.style, {
                position: "fixed", top: "16px", right: "20px", zIndex: "999999",
                backgroundColor: "rgba(22, 22, 26, 0.92)", backdropFilter: "blur(16px)",
                webkitBackdropFilter: "blur(16px)", padding: "5px 8px", borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.15)", boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
                color: "#fff", fontSize: "12px", display: "flex", flexDirection: "row",
                alignItems: "center", gap: "6px", boxSizing: "border-box", flexShrink: "0"
            });

            function createDimensionControl(type) {
                let isW = (type === 'W');
                let group = document.createElement("div");
                Object.assign(group.style, {
                    display: "flex", alignItems: "center", gap: "2px",
                    backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "2px 5px",
                    borderRadius: "5px", border: "1px solid rgba(255,255,255,0.1)", boxSizing: "border-box"
                });

                let lbl = document.createElement("span");
                lbl.textContent = isW ? "W:" : "H:";
                lbl.style.cssText = "font-size: 11px !important; color: #aaa !important; font-weight: 700 !important; margin-right: 2px !important;";

                let btnMinus = document.createElement("button");
                btnMinus.className = "dim-btn";
                btnMinus.textContent = "-";
                btnMinus.onclick = function(e) {
                    e.stopPropagation();
                    let curW = getSavedWidth(), curH = getSavedHeight(), curS = getSavedScale();
                    applyIframeDimensions(isW ? curW - 20 : curW, isW ? curH : curH - 20, curS);
                };

                let input = document.createElement("input");
                input.id = isW ? "iframe-w-input" : "iframe-h-input";
                input.type = "number";
                input.className = "dim-input";
                input.value = isW ? getSavedWidth() : getSavedHeight();
                input.onchange = function(e) {
                    let val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                        let curW = getSavedWidth(), curH = getSavedHeight(), curS = getSavedScale();
                        applyIframeDimensions(isW ? val : curW, isW ? curH : val, curS);
                    }
                };
                input.onkeydown = function(e) { e.stopPropagation(); };

                let btnPlus = document.createElement("button");
                btnPlus.className = "dim-btn";
                btnPlus.textContent = "+";
                btnPlus.onclick = function(e) {
                    e.stopPropagation();
                    let curW = getSavedWidth(), curH = getSavedHeight(), curS = getSavedScale();
                    applyIframeDimensions(isW ? curW + 20 : curW, isW ? curH : curH + 20, curS);
                };

                group.appendChild(lbl); group.appendChild(btnMinus); group.appendChild(input); group.appendChild(btnPlus);
                return group;
            }

            let widthCtrl = createDimensionControl('W');
            let heightCtrl = createDimensionControl('H');

            let scaleTrigger = document.createElement("span");
            scaleTrigger.id = "scale-select-trigger";
            scaleTrigger.textContent = "Scale " + getSavedScale().toFixed(1) + "x ▼";
            styleClickable(scaleTrigger, "rgba(255, 255, 255, 0.08)");

            let serverSelect = document.createElement("select");
            serverSelect.id = "server-select-box";
            styleSelect(serverSelect);

            SERVERS.forEach(function(srv, idx) {
                let opt = document.createElement("option");
                opt.value = idx;
                opt.textContent = srv.name || ("Server " + (idx + 1));
                opt.style.backgroundColor = "#1c1c1e";
                opt.style.color = "#fff";
                serverSelect.appendChild(opt);
            });
            serverSelect.value = currentServerIndex;
            serverSelect.onchange = function(e) {
                let newSrvIdx = parseInt(e.target.value, 10) || 0;
                currentServerIndex = newSrvIdx;
                renderEpisodeGrid();
                fetchAndPlayEpisode(currentServerIndex, currentEpisodeIndex);
            };

            let epTrigger = document.createElement("span");
            epTrigger.id = "ep-select-trigger";
            styleClickable(epTrigger, "#e50914");

            container.appendChild(widthCtrl);
            container.appendChild(heightCtrl);
            container.appendChild(scaleTrigger);
            container.appendChild(serverSelect);
            container.appendChild(epTrigger);

            let scalePopupGrid = createPopup("scale-grid-popup", "240px");
            let popupGrid = createPopup("episode-grid-popup", "340px");

            scaleTrigger.onclick = function(e) {
                e.stopPropagation();
                popupGrid.style.display = "none";
                scalePopupGrid.style.display = (scalePopupGrid.style.display === "grid") ? "none" : "grid";
            };

            epTrigger.onclick = function(e) {
                e.stopPropagation();
                scalePopupGrid.style.display = "none";
                popupGrid.style.display = (popupGrid.style.display === "grid") ? "none" : "grid";
            };

            function handleOutsideClick(e) {
                if (!container.contains(e.target) && !popupGrid.contains(e.target) && !scalePopupGrid.contains(e.target)) {
                    popupGrid.style.display = "none";
                    scalePopupGrid.style.display = "none";
                }
            }
            document.addEventListener("click", handleOutsideClick);
            document.addEventListener("touchstart", handleOutsideClick, { passive: true });

            let navPrev = createNavButton("nav-prev-item", "&#10094;", "left", "30px");
            navPrev.onclick = function(e) {
                e.stopPropagation();
                if (currentEpisodeIndex > 0) fetchAndPlayEpisode(currentServerIndex, currentEpisodeIndex - 1);
            };

            let navNext = createNavButton("nav-next-item", "&#10095;", "right", "30px");
            navNext.onclick = function(e) {
                e.stopPropagation();
                let activeServer = SERVERS[currentServerIndex];
                if (activeServer && activeServer.episodes && currentEpisodeIndex < activeServer.episodes.length - 1) {
                    fetchAndPlayEpisode(currentServerIndex, currentEpisodeIndex + 1);
                }
            };

            document.body.appendChild(container);
            document.body.appendChild(popupGrid);
            document.body.appendChild(scalePopupGrid);
            document.body.appendChild(navPrev);
            document.body.appendChild(navNext);

            resetAutoHideTimer();
            renderEpisodeGrid();
            renderScaleGrid();
            applyIframeDimensions(getSavedWidth(), getSavedHeight(), getSavedScale());
        }

        function createPopup(id, width) {
            let el = document.createElement("div");
            el.id = id;
            el.className = "floating-control-ui active-show";
            Object.assign(el.style, {
                position: "fixed", top: "58px", right: "20px", zIndex: "1000000",
                backgroundColor: "rgba(22, 22, 26, 0.95)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.15)", padding: "10px", borderRadius: "10px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.8)", width: width, maxHeight: "250px",
                overflowY: "auto", display: "none", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px"
            });
            return el;
        }

        function createNavButton(id, arrow, side, offset) {
            let btn = document.createElement("span");
            btn.id = id;
            btn.className = "floating-control-ui active-show";
            btn.innerHTML = arrow;
            Object.assign(btn.style, {
                position: "fixed", top: "50%", zIndex: "999999", transform: "translateY(-50%)",
                width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "rgba(20, 20, 20, 0.6)",
                backdropFilter: "blur(8px)", border: "1px solid rgba(255, 255, 255, 0.12)", color: "#fff",
                fontSize: "16px", fontWeight: "bold", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", userSelect: "none"
            });
            btn.style[side] = offset;
            return btn;
        }

        function renderEpisodeGrid() {
            let popupGrid = document.getElementById("episode-grid-popup");
            if (!popupGrid) return;
            popupGrid.innerHTML = "";
            let activeServer = SERVERS[currentServerIndex];
            let episodes = activeServer ? (activeServer.episodes || []) : [];
            episodes.forEach(function(ep, idx) {
                let epItem = document.createElement("div");
                epItem.className = "ep-grid-btn " + (idx === currentEpisodeIndex ? "active" : "inactive");
                epItem.textContent = ep.name || ep.slug || ("Tập " + (idx + 1));
                epItem.onclick = function(e) {
                    e.stopPropagation();
                    popupGrid.style.display = "none";
                    fetchAndPlayEpisode(currentServerIndex, idx);
                };
                popupGrid.appendChild(epItem);
            });
            updateEpisodeGridState();
        }

        function updateEpisodeGridState() {
            let epTrigger = document.getElementById("ep-select-trigger");
            if (epTrigger) {
                let activeServer = SERVERS[currentServerIndex];
                let ep = activeServer && activeServer.episodes ? activeServer.episodes[currentEpisodeIndex] : null;
                epTrigger.textContent = (ep ? (ep.name || ep.slug) : "Chọn Tập") + " ▼";
            }
        }

        function updateNavState() {
            let navPrev = document.getElementById("nav-prev-item");
            let navNext = document.getElementById("nav-next-item");
            let activeServer = SERVERS[currentServerIndex];
            let maxEp = activeServer && activeServer.episodes ? activeServer.episodes.length : 0;
            if (navPrev) navPrev.style.opacity = currentEpisodeIndex <= 0 ? "0.3" : "1";
            if (navNext) navNext.style.opacity = currentEpisodeIndex >= maxEp - 1 ? "0.3" : "1";
        }

        function renderScaleGrid() {
            let scalePopupGrid = document.getElementById("scale-grid-popup");
            if (!scalePopupGrid) return;
            scalePopupGrid.innerHTML = "";
            let curSavedScale = getSavedScale();
            for (let sVal = 0.5; sVal <= 2.05; sVal += 0.1) {
                let formattedVal = Math.round(sVal * 10) / 10;
                let item = document.createElement("div");
                item.className = "ep-grid-btn " + ((Math.abs(formattedVal - curSavedScale) < 0.05) ? "active" : "inactive");
                item.textContent = formattedVal.toFixed(1) + "x";
                item.onclick = function(e) {
                    e.stopPropagation();
                    scalePopupGrid.style.display = "none";
                    applyIframeDimensions(getSavedWidth(), getSavedHeight(), formattedVal);
                };
                scalePopupGrid.appendChild(item);
            }
        }

        function styleSelect(el) {
            Object.assign(el.style, {
                padding: "4px 8px", borderRadius: "5px", border: "1px solid rgba(255, 255, 255, 0.12)",
                backgroundColor: "rgba(255, 255, 255, 0.08)", color: "#fff", cursor: "pointer",
                fontSize: "12px", outline: "none", boxSizing: "border-box", fontWeight: "600"
            });
        }

        function styleClickable(el, bgColor) {
            Object.assign(el.style, {
                padding: "4px 10px", borderRadius: "5px", border: "1px solid rgba(255, 255, 255, 0.1)",
                backgroundColor: bgColor, color: "#fff", cursor: "pointer", fontSize: "12px",
                fontWeight: "700", textAlign: "center", transition: "background 0.2s", display: "inline-block",
                userSelect: "none", boxSizing: "border-box", flexShrink: "0"
            });
        }

        initBaseLayout();
    `;
}

// 3. HÀM TỔNG KHỞI TẠO (CHÈN LOADING SCREEN VÀ KẾT HỢP CÁC MODULE)
function rawJS(config) {
  var antiRedirectCode = getAntiRedirectCode();
  var mainLogicCode = getMainLogicCode(config);

  return `
(function() {
    // 1. KÍCH HOẠT ANTI-REDIRECT VÀ POPUP BLOCKER
    ${antiRedirectCode}

    // 2. CHÈN LOADING SCREEN NGAY LẬP TỨC VÀO HEAD/DOCUMENT
    var styleLoading = document.createElement('style');
    styleLoading.id = 'loading-screen-style';
    styleLoading.textContent = \`
        @keyframes rawSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        #raw-initial-loading {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background-color: #000000 !important;
            z-index: 2147483647 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            color: #ffffff !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        #raw-initial-loading .spinner {
            border: 3px solid rgba(255,255,255,0.1) !important;
            border-top: 3px solid #e50914 !important;
            border-radius: 50% !important;
            width: 45px !important;
            height: 45px !important;
            animation: rawSpin 0.8s linear infinite !important;
        }
        #raw-initial-loading .text {
            margin-top: 16px !important;
            font-size: 14px !important;
            color: #cccccc !important;
            font-weight: 500 !important;
            letter-spacing: 0.5px !important;
        }
    \`;

    var loaderDiv = document.createElement('div');
    loaderDiv.id = 'raw-initial-loading';
    loaderDiv.innerHTML = '<div class="spinner"></div><div class="text">Đang khởi tạo trình phát...</div>';

    var targetHead = document.head || document.documentElement;
    if (targetHead) {
        targetHead.appendChild(styleLoading);
        targetHead.appendChild(loaderDiv);
    }

    // 3. CHỜ BODY TẢI XONG MỚI CHÈN SCRIPT LOGIC CHÍNH
    function injectScriptOnLoad() {
        var scriptTag = document.createElement('script');
        scriptTag.type = 'text/javascript';
        scriptTag.textContent = \`${mainLogicCode}\`;
        if (document.body) {
            document.body.appendChild(scriptTag);
        } else {
            document.documentElement.appendChild(scriptTag);
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        injectScriptOnLoad();
    } else {
        window.addEventListener('DOMContentLoaded', injectScriptOnLoad);
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

/*
{\"link\":\"/the-loai/phim-cap-nhat-1\",\"name\":\"Phim Mới\"},
{\"link\":\"/the-loai/phim-le-1\",\"name\":\"Phim Lẻ\"},
{\"link\":\"/the-loai/phim-bole-1\",\"name\":\"Phim Bộ\"},
{\"link\":\"/tuyen-tap-1\",\"name\":\"Loạt Phim\"},
 */
function getLISTmenu() {
  return `[{\"link\":\"/the-loai/phim-cap-nhat-1\",\"name\":\"Phim Mới\"},{\"link\":\"/the-loai/phim-le-1\",\"name\":\"Phim Lẻ\"},{\"link\":\"/the-loai/phim-bo-1\",\"name\":\"Phim Bộ\"},{\"link\":\"/the-loai/than-thoai-co-trang-1\",\"name\":\"Cổ trang\"},{\"link\":\"/the-loai/hanh-dong-1\",\"name\":\"Hành động\"},{\"link\":\"/the-loai/tam-ly-1\",\"name\":\"Tâm lý\"},{\"link\":\"/the-loai/chien-tranh-1\",\"name\":\"Chiến tranh\"},{\"link\":\"/the-loai/vo-thuat-kiem-hiep-1\",\"name\":\"Võ thuật - Kiếm hiệp\"},{\"link\":\"/the-loai/nhac-kich-1\",\"name\":\"Nhạc kịch\"},{\"link\":\"/the-loai/kinh-di-1\",\"name\":\"Kinh dị\"},{\"link\":\"/the-loai/toi-pham-hinh-su-1\",\"name\":\"Tội phạm - Hình sự\"},{\"link\":\"/the-loai/phieu-luu-1\",\"name\":\"Phiêu lưu\"},{\"link\":\"/the-loai/hai-huoc-1\",\"name\":\"Hài hước\"},{\"link\":\"/the-loai/vien-tuong-1\",\"name\":\"Viễn tưởng\"},{\"link\":\"/the-loai/khoa-hoc-tai-lieu-1\",\"name\":\"Khoa học - Tài liệu\"},{\"link\":\"/the-loai/hoat-hinh-1\",\"name\":\"Hoạt hình\"},{\"link\":\"/the-loai/the-thao-1\",\"name\":\"Thể thao\"},{\"link\":\"/the-loai/tinh-cam-lang-man-1\",\"name\":\"Tình cảm - Lãng mạn\"},{\"link\":\"/the-loai/ky-ao-1\",\"name\":\"Kỳ ảo\"},{\"link\":\"/the-loai/giat-gan-1\",\"name\":\"Giật gân\"},{\"link\":\"/the-loai/gia-dinh-1\",\"name\":\"Gia đình\"},{\"link\":\"/the-loai/bi-an-1\",\"name\":\"Bí ẩn\"},{\"link\":\"/the-loai/lich-su-1\",\"name\":\"Lịch sử\"},{\"link\":\"/the-loai/vien-tay-1\",\"name\":\"Viễn Tây\"},{\"link\":\"/the-loai/tieu-su-1\",\"name\":\"Tiểu sử\"},{\"link\":\"/the-loai/chuong-trinh-truyen-hinh-1\",\"name\":\"GameShow\"},{\"link\":\"/the-loai/dramatv-1\",\"name\":\"DramaTV\"}]`;
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
