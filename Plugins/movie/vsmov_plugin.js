var BASEURL = "https://vsmov.com";
var BASEAPI = "https://vsmov.com/api";
var DEV = true;
function getManifest() {
  return JSON.stringify({
    id: "vsmov",
    name: "Nguồn Vsmov",
    description: "Nguồn phim Vsmov...",
    "version": "1.3.2",
    info: "Nguồn phim vietsub và thuyết minh mới.\n\n Hỗ trợ lồng tiếng và có tốc độ phát rất nhanh.",
    baseUrl: "https://vsmov.com",
    iconUrl: "https://vsmov.com/favicon-vsm.png",
    isEnabled: true,
    "adblock": false,
    debug: true,
    "layoutType": "HORIZONTAL",
    type: "MOVIE",
    playerType: "embed",
  });
}


function log(msg) {
  	console.log(msg);
}

function getHomeSections() {
    return JSON.stringify([
        {
            "slug": "/danh-sach/long-tieng",
            "title": "Phim Lồng Tiếng",
            "type": "Horizontal"
        },
       {
            "slug": "/danh-sach/phim-le",
            "title": "Phim Lẻ",
            "type": "Horizontal"
        },
       {
            "slug": "/danh-sach/phim-bo",
            "title": "Phim Bộ",
            "type": "Horizontal"
        },
        {
            "slug": "/danh-sach/thuyet-minh",
            "title": "Thuyét Minh",
            "type": "Horizontal"
        },
        {
            "slug": "/danh-sach/phim-moi-cap-nhat/",
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
        if(path.indexOf("/danh-sach/phim-le") > -1 || path.indexOf("/danh-sach/phim-bo") > -1 || path.indexOf("/danh-sach/thuyet-minh") > -1 || path.indexOf("/danh-sach/long-tieng") > -1){
            var resultUrl = BASEURL;
        }
        else{
            var resultUrl = BASEAPI;
        }
        
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
        var fallback = BASEAPI + (slug ? (slug.indexOf("/") === 0 ? slug : "/" + slug) : "");
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
        var resultUrl = BASEAPI + "/tim-kiem?keyword=" + encodedKeyword;

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

// /type/hoat-hinh/
//filtersJson = "{page:5}"
//getUrlList("/danh-sach/phim-moi-cap-nhat", filtersJson)
//getUrlSearch("girl", filtersJson)

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
        if ($url.indexOf("/api") > -1) {
            log("api parse")
            return parseAPI(html, $url)
        } else {
            return parseRAW(html, $url)
        }
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
function parseAPI(html, $url) {
    var $data = JSON.parse(html);
    var $items = $data.items;
    var items = [];
    for (var $j = 0; $j < $items.length; $j++) {
        var item = $items[$j];
        items.push({
            "id": BASEAPI + "/phim/" + item.slug,
            "title": item.name,
            "posterUrl": item.poster_url,
            "backdropUrl": item.thumb_url,
            "year": item.year
        });
    }
    return JSON.stringify({
        "items": items,
        "pagination": {
            "currentPage": 1,
            "totalPages": 9999
        }
    });
}

function parseRAW(html, $url) {
    var $html = _$(html);
    var items = [];
    $html.find("tbody tr[class*='group/tr']").each(function(){
        var slug = this.find("a").attr("href");
        slug = slug.replace(BASEURL,BASEAPI);
        var name = this.find("h4").text();
        var poster = this.find("img").attr("data-original");
        var year = this.find("img.object-cover").closest("td").next().text();
        year = Number(year.trim());
        items.push({
            "id": slug,
            "title": name,
            "posterUrl": poster,
            "backdropUrl": poster,
            "year": year
        });
    })
    return JSON.stringify({
        "items": items,
        "pagination": {
            "currentPage": 1,
            "totalPages": 9999
        }
    });
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
        var year = 2026;
        var extra = "";
        var lang = "";
        var country = "";
        var quality = "";
        var director = "";
        var $movie = JSON.parse(html)
        $data = $movie.movie
        limg = $data.thumb_url;
        lname = $data.name;
        ldes = $data.content;
        lactor = $data.actor.join(" - ");
        lduran = $data.time;
        status = $data.status.replace("completed","Hoàn Thành");
        var categoryArray =  [];
        // Dùng forEach để duyệt qua từng object
        $data.category.forEach(function (item) {
          if (item.name && item.slug) {
            categoryArray.push("[" + item.name + "](/the-loai/" + item.slug + "/)");
          }
        });
        // Nối lại thành chuỗi phân cách bởi dấu phẩy
        category = categoryArray.join(", ");
        
        episode_current = $data.episode_current;
        year = $data.year;
        lang = $data.lang;
        var countryArray =  [];
        // Dùng forEach để duyệt qua từng object
        $data.country.forEach(function (item) {
          if (item.name && item.slug) {
            countryArray.push("[" + item.name + "](/quoc-gia/" + item.slug + ")");
          }
        });
        // Nối lại thành chuỗi phân cách bởi dấu phẩy
        country = countryArray.join(", ");
        director = $data.director.join(" - ");;
        quality = $data.quality;

        var rawData = $movie.episodes;

        var servers = [];

        rawData.forEach(function(serverItem) {
          var episodes = [];
        
          // Duyệt qua từng tập phim trong server_data
          serverItem.server_data.forEach(function(episode) {
            episodes.push({
              id: episode.link_embed + "?currennt=" + episode.name + "&list=" + url, 
              name: "Tập " + episode.name,
              slug: episode.slug
            });
          });
        
          // Làm sạch tên server (xóa khoảng trắng và ký tự \r\n thừa)
          var cleanServerName = serverItem.server_name.replace(/\r?\n|\r/g, "").trim().replace(/\s+/g," ");
        
          // Đẩy vào mảng server
          servers.push({
            name: cleanServerName,
            episodes: episodes
          });
            servers.sort(function(a, b) {
              var aIsThuyetMinh = a.name.toLowerCase().includes("thuyết minh");
              var bIsThuyetMinh = b.name.toLowerCase().includes("thuyết minh");
            
              if (aIsThuyetMinh && !bIsThuyetMinh) return -1; // a lên trước b
              if (!aIsThuyetMinh && bIsThuyetMinh) return 1;  // b lên trước a
              return 0; // Giữ nguyên vị trí nếu cùng loại
            });
        });
        
        return JSON.stringify({
            id: url,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
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
            director: director || "",
            lang: lang,
            country: country,
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
function checkRaw(scriptStr, returnFixed) {
  try {
    if (!scriptStr || typeof scriptStr !== 'string') {
      console.log("[Lỗi escape runJS]\r\n\t Dữ liệu đầu vào không phải là chuỗi hợp lệ!");
      return scriptStr || "";
    }

    var lines = scriptStr.split('\n');
    var fixedLines = [];
    var hasError = false;

    for (var i = 0; i < lines.length; i++) {
      var currentLine = lines[i];
      var lineNum = i + 1;
      var lineErrorFound = false;

      // 1. Kiểm tra lỗi escape newline/tab nguy hiểm nằm trần trong chuỗi quote
      // Trường hợp chưa được escape dạng '\\n' hoặc '\\t' trong chuỗi ghép
      if (/([^\\]|^)(\r\n|\r|\n)/.test(currentLine)) {
        console.log("[Lỗi escape runJS]\r\n\t Phát hiện xuống dòng chưa escape ở Dòng " + lineNum + ": " + currentLine.trim());
        lineErrorFound = true;
      }

      // 2. Kiểm tra lỗi quên escape ký tự Tab trần không hợp lệ
      if (/\t/.test(currentLine) && !/\\t/.test(currentLine)) {
        console.log("[Lỗi escape runJS]\r\n\t Phát hiện ký tự Tab trần ở Dòng " + lineNum + ": " + currentLine.trim());
        lineErrorFound = true;
      }

      // 3. Kiểm tra dấu xược ngược single trailing backlash ở cuối dòng (dễ làm gãy chuỗi)
      if (/([^\\])\\$/.test(currentLine)) {
        console.log("[Lỗi escape runJS]\r\n\t Dấu Backslash (\\) cô đơn ở cuối Dòng " + lineNum + ": " + currentLine.trim());
        lineErrorFound = true;
      }

      if (lineErrorFound) {
        hasError = true;
      }

      // Tiến hành SỬA LỖI tự động nếu tham số returnFixed = true
      var fixedLine = currentLine;
      if (returnFixed) {
        // Chuẩn hóa ký tự xuống dòng và tab đặc biệt
        fixedLine = fixedLine
          .replace(/\r/g, "")
          .replace(/\t/g, "  "); // Thay Tab trần bằng 2 khoảng trắng cho an toàn
      }

      fixedLines.push(fixedLine);
    }

    // 4. Kiểm tra cú pháp nhanh xem toàn bộ chuỗi có parse được JS không
    try {
      new Function(scriptStr);
    } catch (syntaxErr) {
      hasError = true;
      console.log("[Lỗi escape runJS]\r\n\t 💥 LỖI CÚ PHÁP (SyntaxError) toàn cục: " + syntaxErr.message);
    }

    if (!hasError) {
      console.log("[checkRaw] 🟢 Chuỗi Raw JS hoàn toàn sạch lỗi!");
    }

    // Trả về bản đã fix hoặc bản gốc theo tham số returnFixed
    return returnFixed ? fixedLines.join('\n') : scriptStr;

  } catch (e) {
    console.log("[Lỗi escape runJS]\r\n\t Lỗi ngoại lệ trong hàm checkRaw: " + e.message);
    return scriptStr; // Luôn an toàn: Fallback trả về chuỗi gốc chứ không làm sập script
  }
}
function parseDetailResponse(html, url) {
  try {
    console.log("parseDetailResponse dang xu ly: " + url);
    //var customJS = checkRaw(rawJS(url),true);
    var customJS = "";
    return JSON.stringify({
      url: "",
      isEmbed: false,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: BASEURL,
       "Custom-Js": customJS
      },
      subtitles:[],
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

function rawJS(stream) {
  return `
(function () {
    var LOGGER = true;
    var EMBED_STREAM_URL = ${JSON.stringify(stream || '')};

    function log(step, msg, err) {
        if (!LOGGER) return;
        try {
            var time = new Date().toISOString().split('T')[1].slice(0, 8);
            var logText = '[CustomJS][' + time + '][' + step + '] ' + String(msg);
            if (err) logText += ' | ❌ ERROR: ' + (err.stack || err.message || String(err));
            
            if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
                window.SnifferBridge.log(logText);
            } else if (typeof console !== 'undefined') {
                if (err) console.error(logText);
                else console.log(logText);
            }
        } catch (e) {}
    }

    log('INIT', 'Bắt đầu khởi tạo CustomJS với EMBED_STREAM_URL = ' + EMBED_STREAM_URL);

    function ensureDOMReady(callback) {
        if (document && document.body) {
            callback();
        } else {
            var checkCount = 0;
            var checkTimer = setInterval(function () {
                checkCount++;
                if (document && document.body) {
                    clearInterval(checkTimer);
                    callback();
                } else if (checkCount > 200) {
                    clearInterval(checkTimer);
                }
            }, 30);
        }
    }

    var SmartStorage = (function() {
        var memCache = {};
        return {
            getItem: function(key, defaultVal) {
                try {
                    var val = localStorage.getItem(key);
                    return val !== null ? val : defaultVal;
                } catch(e) {
                    return memCache[key] !== undefined ? memCache[key] : defaultVal;
                }
            },
            setItem: function(key, val) {
                memCache[key] = val;
                try {
                    localStorage.setItem(key, val);
                } catch(e) {}
            }
        };
    })();

    (function applyAntiPopupShield() {
        try {
            var dummyWin = { focus: function () {}, blur: function () {}, close: function () {}, closed: true, postMessage: function () {} };
            window.open = function (url) { return dummyWin; };
            var blockHandler = function (e) {
                var target = e.target;
                while (target && target !== document) {
                    if (target.id && target.id.indexOf('v-') === 0) return;
                    if (target.tagName === 'A' && (target.getAttribute('target') === '_blank' || target.target === '_blank')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                    target = target.parentNode;
                }
            };
            window.addEventListener('click', blockHandler, true);
            window.addEventListener('touchstart', blockHandler, true);
        } catch (e) {}
    })();

    function injectStyles() {
        try {
            if (document.getElementById('v-style-block')) return;
            const style = document.createElement('style');
            style.id = 'v-style-block';
            style.textContent = 
                'html, body { margin: 0 !important; padding: 0 !important; width: 100vw !important; height: 100vh !important; overflow: hidden !important; background: #000 !important; }' +
                '#v-top-bar { position: fixed !important; top: 12px !important; right: 12px !important; z-index: 2147483647 !important; display: flex !important; gap: 8px !important; align-items: center !important; font-family: sans-serif !important; transition: opacity 0.4s ease !important; opacity: 1; }' +
                '.v-btn-act { background: rgba(15, 15, 15, 0.9) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.3) !important; padding: 8px 14px !important; border-radius: 6px !important; font-size: 13px !important; font-weight: bold !important; cursor: pointer !important; backdrop-filter: blur(8px) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.6) !important; }' +
                '.v-btn-act:active { background: #e50914 !important; }' +
                '#v-box-list, #v-hist-box { display: none; position: absolute !important; top: 100% !important; right: 0 !important; margin-top: 8px !important; background: rgba(18, 18, 18, 0.95) !important; padding: 12px !important; border-radius: 8px !important; border: 1px solid rgba(255,255,255,0.2) !important; z-index: 2147483647 !important; backdrop-filter: blur(10px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.8) !important; }' +
                '#v-box-list { grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)) !important; gap: 6px !important; width: 250px !important; max-height: 220px !important; overflow-y: auto !important; }' +
                '#v-hist-box { width: 260px !important; max-width: 85vw !important; flex-direction: column !important; gap: 10px !important; font-family: sans-serif !important; }' +
                '#v-box-list.closed, #v-hist-box.closed { display: none !important; }' +
                '#v-box-list.open { display: grid !important; }' +
                '#v-hist-box.open { display: flex !important; }' +
                '.v-item-node { background: #222 !important; color: #fff !important; border: 1px solid #444 !important; border-radius: 5px !important; padding: 6px 0 !important; font-size: 12px !important; font-weight: bold !important; cursor: pointer !important; text-align: center !important; }' +
                '.v-item-node.active { background: #e50914 !important; border-color: #ff333d !important; }' +
                '.v-hist-btn-group { display: flex !important; gap: 8px !important; width: 100% !important; }' +
                '.v-hist-sub-btn { flex: 1 !important; padding: 8px 6px !important; border-radius: 6px !important; font-size: 11px !important; font-weight: bold !important; cursor: pointer !important; border: none !important; text-align: center !important; color: #fff !important; }' +
                '.v-btn-seen { background: #f39c12 !important; } .v-btn-next { background: #27ae60 !important; }' +
                '.v-arrow-btn { position: fixed !important; top: 50% !important; transform: translateY(-50%) !important; z-index: 2147483647 !important; background: rgba(0,0,0,0.6) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.3) !important; width: 42px !important; height: 42px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 18px !important; cursor: pointer !important; user-select: none !important; transition: opacity 0.4s ease !important; opacity: 1; }' +
                '#v-arrow-prev { left: 12px !important; } #v-arrow-next { right: 12px !important; }' +
                '.v-idle-fade { opacity: 0.2 !important; }';
            (document.head || document.documentElement).appendChild(style);
        } catch (e) {}
    }

    var idleTimer = null;
    function resetIdleTimer() {
        var topBar = document.getElementById('v-top-bar');
        var prevBtn = document.getElementById('v-arrow-prev');
        var nextBtn = document.getElementById('v-arrow-next');

        var elements = [topBar, prevBtn, nextBtn];
        elements.forEach(function(el) {
            if (el) el.classList.remove('v-idle-fade');
        });

        if (idleTimer) clearTimeout(idleTimer);
        
        idleTimer = setTimeout(function() {
            var gridDiv = document.getElementById('v-box-list');
            var histDiv = document.getElementById('v-hist-box');

            if (gridDiv) gridDiv.className = 'closed';
            if (histDiv) histDiv.className = 'closed';

            elements.forEach(function(el) {
                if (el) el.classList.add('v-idle-fade');
            });
        }, 5000);
    }

    function setupAutoFadeEvents() {
        ['mousemove', 'mousedown', 'touchstart', 'touchmove', 'click', 'scroll'].forEach(function(evt) {
            window.addEventListener(evt, resetIdleTimer, true);
        });
        resetIdleTimer();
    }

    var loadingTimer = null;
    function showLoadingScreen(msg) {
        try {
            if (loadingTimer) clearTimeout(loadingTimer);
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
                    '<div id="v-stage-text" style="color:#ccc; margin-top:16px; font-size:14px; text-align:center;">' + (msg || 'Đang tải tập phim...') + '<br><small style="color:#777; font-size:11px;">(Chạm để đóng)</small></div>' +
                    '<style>.v-ring-spin { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.1); border-left-color: #e50914; border-radius: 50%; animation: v-spin 0.8s linear infinite; } @keyframes v-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';

                loadingDiv.onclick = function() { hideLoadingScreen(); };
                (document.body || document.documentElement).appendChild(loadingDiv);
            } else {
                var txt = document.getElementById('v-stage-text');
                if (txt) txt.innerHTML = (msg || 'Đang tải tập phim...') + '<br><small style="color:#777; font-size:11px;">(Chạm để đóng)</small>';
                loadingDiv.style.display = 'flex';
            }
        } catch(e) {}
    }

    function hideLoadingScreen() {
        try {
            if (loadingTimer) clearTimeout(loadingTimer);
            var elem = document.getElementById('v-stage-layer');
            if (elem) elem.remove();
        } catch(e) {}
    }

    var currentEpisode = '1';
    var isFullMovie = false;
    var episodeList = [];
    var seriesKey = 'default_series';
    var savedHistoryEpi = null;
    var isFirstLoadWithHist = false;
    var listEpisodesUrl = '';

    function parseStreamUrl(urlStr) {
        var result = { current: '1', listEpisodesUrl: '', streamUrl: urlStr };
        try {
            if (!urlStr) throw new Error('URL Stream trống!');
            var urlObj = new URL(urlStr);
            
            // Lấy param 'list' hoặc 'episodes'
            var listUrl = urlObj.searchParams.get('list') || urlObj.searchParams.get('episodes');
            if (listUrl) result.listEpisodesUrl = listUrl;

            // Lấy param 'current' hoặc 'currennt' (chú ý typo)
            var currentFound = urlObj.searchParams.get('current') || urlObj.searchParams.get('currennt');
            if (currentFound) {
                result.current = currentFound;
            }

            // Tạo key lưu storage dựa trên slug trang list
            if (listUrl) {
                try {
                    var listUrlObj = new URL(listUrl);
                    var parts = listUrlObj.pathname.split('/').filter(Boolean);
                    seriesKey = parts[parts.length - 1] || 'default_series';
                } catch(e) {
                    seriesKey = 'default_series';
                }
            }
        } catch(e) {}
        return result;
    }

    function saveHistory(epiNum) {
        if (isFullMovie || isNaN(parseInt(epiNum, 10))) return;
        try {
            SmartStorage.setItem('watch_hist_' + seriesKey, JSON.stringify({
                lastEpi: parseInt(epiNum, 10),
                time: Date.now()
            }));
        } catch(e) {}
    }

    function getHistory() {
        if (isFullMovie) return null;
        try {
            var raw = SmartStorage.getItem('watch_hist_' + seriesKey, null);
            if (!raw) return null;
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch(e) {
            return null;
        }
    }

    function tryPlayIframeVideo() {
        try {
            var iframe = document.getElementById('v-media-frame');
            if (!iframe) return;
            var iDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iDoc) {
                var video = iDoc.querySelector('video');
                if (video) {
                    video.play();
                    return;
                }
                var playBtn = iDoc.querySelector('.vjs-big-play-button, .jw-display-icon-container, .play-btn, [aria-label="Play"]');
                if (playBtn) playBtn.click();
            }
        } catch(e) {}
    }

    function loadEpisode(epiItem) {
        try {
            showLoadingScreen('Đang chuyển sang Tập ' + epiItem.num + '...');
            currentEpisode = String(epiItem.num);
            
            saveHistory(currentEpisode);
            isFirstLoadWithHist = false; 

            // Tạo URL mới kết hợp thông tin stream, current và list
            var nextStreamUrl = epiItem.streamUrl;
            if (listEpisodesUrl) {
                var joinChar = nextStreamUrl.indexOf('?') !== -1 ? '&' : '?';
                nextStreamUrl += joinChar + 'current=' + encodeURIComponent(currentEpisode) + '&list=' + encodeURIComponent(listEpisodesUrl);
            }

            var iframe = document.getElementById('v-media-frame');
            if (iframe) iframe.src = nextStreamUrl;

            loadingTimer = setTimeout(function() {
                hideLoadingScreen();
                tryPlayIframeVideo();
            }, 3000);

            buildUI();
        } catch(e) {}
    }

    // Dùng Iframe ẩn để lấy dữ liệu JSON thay vì dùng Fetch
    function fetchJsonViaIframe(jsonUrl, callback) {
        try {
            var hiddenIframe = document.createElement('iframe');
            hiddenIframe.style.display = 'none';
            hiddenIframe.src = jsonUrl;

            var isDone = false;
            var cleanup = function() {
                if (hiddenIframe && hiddenIframe.parentNode) {
                    hiddenIframe.parentNode.removeChild(hiddenIframe);
                }
            };

            hiddenIframe.onload = function() {
                if (isDone) return;
                isDone = true;
                try {
                    var iDoc = hiddenIframe.contentDocument || hiddenIframe.contentWindow.document;
                    var bodyText = iDoc.body ? (iDoc.body.innerText || iDoc.body.textContent) : '';
                    var parsedData = JSON.parse(bodyText);
                    cleanup();
                    callback(null, parsedData);
                } catch(err) {
                    cleanup();
                    callback(err, null);
                }
            };

            hiddenIframe.onerror = function(err) {
                if (isDone) return;
                isDone = true;
                cleanup();
                callback(err, null);
            };

            (document.body || document.documentElement).appendChild(hiddenIframe);

            // Timeout phòng trường hợp iframe bị đơ
            setTimeout(function() {
                if (!isDone) {
                    isDone = true;
                    cleanup();
                    callback(new Error('Timeout loading JSON iframe'), null);
                }
            }, 10000);

        } catch(e) {
            callback(e, null);
        }
    }

    function buildUI() {
        try {
            injectStyles();
            var parent = document.body || document.documentElement;

            var oldHeader = document.getElementById('v-top-bar'); if (oldHeader) oldHeader.remove();
            var oldPrev = document.getElementById('v-arrow-prev'); if (oldPrev) oldPrev.remove();
            var oldNext = document.getElementById('v-arrow-next'); if (oldNext) oldNext.remove();

            const headerDiv = document.createElement('div');
            headerDiv.id = 'v-top-bar';

            // 1. NÚT CHỌN TẬP
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'v-btn-act';
            toggleBtn.innerHTML = (isFullMovie ? 'Tập Full' : 'Tập ' + currentEpisode) + ' &#9660;';

            const gridDiv = document.createElement('div');
            gridDiv.id = 'v-box-list';
            gridDiv.className = 'closed';

            episodeList.forEach(function(item) {
                const btn = document.createElement('button');
                const isCurrent = String(item.num) === String(currentEpisode);
                btn.className = 'v-item-node' + (isCurrent ? ' active' : '');
                btn.textContent = (item.num === 'Full' || item.name === 'Full') ? 'Full' : 'Tập ' + item.num;
                btn.onclick = function (e) {
                    e.stopPropagation();
                    gridDiv.className = 'closed';
                    if (String(item.num) !== String(currentEpisode)) loadEpisode(item);
                };
                gridDiv.appendChild(btn);
            });

            const epiWrapper = document.createElement('div');
            epiWrapper.style.position = 'relative';
            epiWrapper.appendChild(toggleBtn);
            epiWrapper.appendChild(gridDiv);

            toggleBtn.onclick = function (e) {
                e.stopPropagation();
                if (histDiv) histDiv.className = 'closed';
                gridDiv.className = gridDiv.classList.contains('open') ? 'closed' : 'open';
            };

            headerDiv.appendChild(epiWrapper);

            // 2. NÚT LỊCH SỬ (Chỉ hiện khi KHÔNG PHẢI là phim Full)
            var histDiv = null;
            if (!isFullMovie) {
                const histBtn = document.createElement('button');
                histBtn.className = 'v-btn-act';
                histBtn.innerHTML = '📜 Lịch sử';

                histDiv = document.createElement('div');
                histDiv.id = 'v-hist-box';
                
                var currentNum = parseInt(currentEpisode, 10);
                var savedNum = parseInt(savedHistoryEpi, 10);

                var hasValidHist = savedHistoryEpi !== null && 
                                   !isNaN(currentNum) && !isNaN(savedNum) &&
                                   currentNum !== savedNum && 
                                   currentNum !== (savedNum + 1);

                if (hasValidHist) {
                    var nextEpiOfHist = savedNum + 1;
                    histDiv.innerHTML = 
                        '<div style="font-size: 13px; color: #fff; text-align: center;">Lần trước bạn đã xem ở <b>Tập ' + savedHistoryEpi + '</b></div>' +
                        '<div class="v-hist-btn-group">' +
                            '<button id="v-btn-hist-seen" class="v-hist-sub-btn v-btn-seen">Tập đã xem (' + savedHistoryEpi + ')</button>' +
                            '<button id="v-btn-hist-next" class="v-hist-sub-btn v-btn-next">Tập kế tiếp (' + nextEpiOfHist + ')</button>' +
                        '</div>';
                } else {
                    histDiv.innerHTML = '<div style="font-size: 12px; color: #aaa; text-align: center;">Chưa có lịch sử phù hợp.</div>';
                }

                if (isFirstLoadWithHist && hasValidHist) {
                    histDiv.className = 'open';
                } else {
                    histDiv.className = 'closed';
                }

                const histWrapper = document.createElement('div');
                histWrapper.style.position = 'relative';
                histWrapper.appendChild(histBtn);
                histWrapper.appendChild(histDiv);

                histBtn.onclick = function (e) {
                    e.stopPropagation();
                    gridDiv.className = 'closed';
                    histDiv.className = histDiv.classList.contains('open') ? 'closed' : 'open';
                };

                headerDiv.appendChild(histWrapper);

                if (hasValidHist) {
                    var btnSeen = histDiv.querySelector('#v-btn-hist-seen');
                    if (btnSeen) {
                        btnSeen.onclick = function(e) {
                            e.stopPropagation();
                            histDiv.className = 'closed';
                            var targetItem = episodeList.find(function(x) { return String(x.num) === String(savedHistoryEpi); });
                            if (targetItem) loadEpisode(targetItem);
                        };
                    }

                    var btnNext = histDiv.querySelector('#v-btn-hist-next');
                    if (btnNext) {
                        btnNext.onclick = function(e) {
                            e.stopPropagation();
                            histDiv.className = 'closed';
                            var targetItem = episodeList.find(function(x) { return String(x.num) === String(savedNum + 1); });
                            if (targetItem) loadEpisode(targetItem);
                        };
                    }
                }
            }

            // CHỨC NĂNG ĐÓNG MENU KHI CHẠM / NHẤN RA NGOÀI
            var hideMenusOnOutsideClick = function (e) {
                var target = e.target;
                if (!headerDiv.contains(target)) {
                    gridDiv.className = 'closed';
                    if (histDiv) histDiv.className = 'closed';
                }
            };
            window.addEventListener('click', hideMenusOnOutsideClick, true);
            window.addEventListener('touchstart', hideMenusOnOutsideClick, true);

            parent.appendChild(headerDiv);

            // 3. MŨI TÊN CHUYỂN TẬP BÊN TRÁI / PHẢI
            if (!isFullMovie && episodeList.length > 1) {
                var currentIndex = episodeList.findIndex(function(x) { return String(x.num) === String(currentEpisode); });
                if (currentIndex > 0) {
                    const prevBtn = document.createElement('div');
                    prevBtn.className = 'v-arrow-btn';
                    prevBtn.id = 'v-arrow-prev';
                    prevBtn.innerHTML = '❮';
                    prevBtn.onclick = function () { loadEpisode(episodeList[currentIndex - 1]); };
                    parent.appendChild(prevBtn);
                }

                if (currentIndex >= 0 && currentIndex < episodeList.length - 1) {
                    const nextBtn = document.createElement('div');
                    nextBtn.className = 'v-arrow-btn';
                    nextBtn.id = 'v-arrow-next';
                    nextBtn.innerHTML = '❯';
                    nextBtn.onclick = function () { loadEpisode(episodeList[currentIndex + 1]); };
                    parent.appendChild(nextBtn);
                }
            }

            setupAutoFadeEvents();
        } catch(e) {}
    }

    ensureDOMReady(function() {
        try {
            showLoadingScreen('Đang chuẩn bị trình phát...');
            document.body.style.cssText = 'margin: 0 !important; padding: 0 !important; width: 100vw !important; height: 100vh !important; overflow: hidden !important; background-color: #000 !important;';
            document.body.innerHTML = '';

            var parsed = parseStreamUrl(EMBED_STREAM_URL);
            currentEpisode = parsed.current;
            listEpisodesUrl = parsed.listEpisodesUrl;

            if (String(currentEpisode).toLowerCase() === 'full') {
                isFullMovie = true;
            }

            var prevHist = getHistory();
            if (prevHist && prevHist.lastEpi) {
                savedHistoryEpi = parseInt(prevHist.lastEpi, 10);
                var curNum = parseInt(currentEpisode, 10);
                if (!isNaN(curNum) && curNum !== savedHistoryEpi && curNum !== (savedHistoryEpi + 1)) {
                    isFirstLoadWithHist = true; 
                }
            }

            var mainIframe = document.createElement('iframe');
            mainIframe.id = 'v-media-frame';
            mainIframe.src = EMBED_STREAM_URL;
            mainIframe.style.cssText = 'width: 100vw; height: 100vh; border: 0; position: fixed; top: 0; left: 0; z-index: 1;';
            mainIframe.setAttribute('allowfullscreen', 'true');
            mainIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-presentation');
            document.body.appendChild(mainIframe);

            saveHistory(currentEpisode);

            if (listEpisodesUrl) {
                // Sử dụng Iframe ẩn để tải link JSON thay vì dùng fetch
                fetchJsonViaIframe(listEpisodesUrl, function(err, resData) {
                    if (!err && resData && resData.episodes && Array.isArray(resData.episodes) && resData.episodes.length > 0) {
                        episodeList = [];
                        var serverData = resData.episodes[0].server_data || [];
                        
                        for (var j = 0; j < serverData.length; j++) {
                            var item = serverData[j];
                            var epNum = item.name || item.filename || (j + 1);
                            
                            episodeList.push({
                                id: item.slug || ("tap-" + epNum),
                                name: item.name || ("Tập " + epNum),
                                slug: item.slug,
                                num: epNum,
                                streamUrl: item.link_embed
                            });
                        }

                        if (episodeList.length === 1 && String(episodeList[0].num).toLowerCase() === 'full') {
                            isFullMovie = true;
                        }

                        buildUI();
                    } else {
                        // Fallback nếu tải danh sách qua Iframe thất bại
                        episodeList = [{ num: currentEpisode, streamUrl: EMBED_STREAM_URL, name: currentEpisode }];
                        buildUI();
                    }
                });
            } else {
                episodeList = [{ num: currentEpisode, streamUrl: EMBED_STREAM_URL, name: currentEpisode }];
                buildUI();
            }

            loadingTimer = setTimeout(function() {
                hideLoadingScreen();
                tryPlayIframeVideo();
            }, 3000);

        } catch(mainErr) {
            hideLoadingScreen();
        }
    });
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
    return `[{"link":"/the-loai/action-adventure/","name":"Action & Adventure"},{"link":"/the-loai/bi-an/","name":"Bí Ẩn"},{"link":"/the-loai/chien-tranh/","name":"Chiến Tranh"},{"link":"/the-loai/chinh-kich/","name":"Chính Kịch"},{"link":"/the-loai/chinh-tri-chien-tranh/","name":"Chính Trị - Chiến Tranh"},{"link":"/the-loai/chu-de-thuc-te/","name":"Chủ Đề Thực Tế"},{"link":"/the-loai/co-trang/","name":"Cổ Trang"},{"link":"/the-loai/drama/","name":"Drama"},{"link":"/the-loai/gia-dinh/","name":"Gia Đình"},{"link":"/the-loai/gia-tuong/","name":"Giả Tưởng"},{"link":"/the-loai/giat-gan/","name":"Giật Gân"},{"link":"/the-loai/hai/","name":"Hài"},{"link":"/the-loai/hanh-dong/","name":"Hành Động"},{"link":"/the-loai/hanh-dong-phieu-luu/","name":"Hành Động & Phiêu Lưu"},{"link":"/the-loai/hinh-su/","name":"Hình Sự"},{"link":"/the-loai/hoat-hinh/","name":"Hoạt Hình"},{"link":"/the-loai/hoc-duong/","name":"Học Đường"},{"link":"/the-loai/hon-nhan/","name":"Hôn Nhân"},{"link":"/the-loai/hu-cau/","name":"Hư Cấu"},{"link":"/the-loai/khoa-hoc-vien-tuong/","name":"Khoa Học Viễn Tưởng"},{"link":"/the-loai/khoa-hoc-vien-tuong-gia-tuong/","name":"Khoa Học Viễn Tưởng & Giả Tưởng"},{"link":"/the-loai/kiem-hiep/","name":"Kiếm hiệp"},{"link":"/the-loai/kinh-di/","name":"Kinh Dị"},{"link":"/the-loai/lang-man/","name":"Lãng Mạng"},{"link":"/the-loai/lang-mang/","name":"Lãng Mạng"},{"link":"/the-loai/lgbt/","name":"LGBT"},{"link":"/the-loai/phieu-luu/","name":"Phiêu Lưu"},{"link":"/the-loai/phim-nhac/","name":"Phim Nhạc"},{"link":"/the-loai/phuctrangcodai/","name":"Phụctrangcổđại"},{"link":"/the-loai/sci-fi-fantasy/","name":"Sci-Fi & Fantasy"},{"link":"/the-loai/thanh-xuan/","name":"Thanh Xuân"},{"link":"/the-loai/thieu-nhi/","name":"Thiếu Nhi"},{"link":"/the-loai/thuong-truong/","name":"Thương Trường"},{"link":"/the-loai/tien-hiep/","name":"Tiên Hiệp"},{"link":"/the-loai/tieu-thuyet-chuyen-the/","name":"Tiểu Thuyết Chuyển Thể"},{"link":"/the-loai/tinh-ban/","name":"Tình Bạn"},{"link":"/the-loai/tinh-tiet/","name":"Tình Tiết"},{"link":"/the-loai/tinh-yeu-ngot-ngao/","name":"Tình Yêu Ngọt Ngào"},{"link":"/the-loai/toi-pham/","name":"Tội Phạm"},{"link":"/the-loai/tra-thu/","name":"Trả Thù"},{"link":"/the-loai/truyen-hinh-thuc-te/","name":"Truyền Hình Thực Tế"},{"link":"/the-loai/vien-tuong/","name":"Viễn Tưởng"},{"link":"/the-loai/vo-hiep/","name":"Võ hiệp"},{"link":"/the-loai/vo-thuat/","name":"Võ Thuật"},{"link":"/the-loai/xa-hoi-den/","name":"Xã Hội Đen"}]`;
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
        window.log("parseHTML error: " + err.message);
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

// --- 2. MATCH SINGLE SELECTOR (ĐÃ HỖ TRỢ DẤU XƯỢC TAILWIND CSS) ---
function matchSingleSelector(node, sel, nodes) {
    if (!node || node.tag === "#text" || node.tag === "ROOT") return false;

    let cleanSel = sel;
    
    // 1. Tách pseudo positional (:first, :last, :eq) ra trước để không làm hỏng class
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

        // Bóc tách Class đúng chuẩn cả ký tự / \ : [ ]
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

// --- QUERY ENGINE XỬ LÝ VI TÍCH VỊ TRÍ (:first, :last, :eq) ---
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

    // Lọc danh sách theo :first, :last, :eq trên danh sách kết quả thực tế
    if (selector.indexOf(":first") !== -1) {
        return results.slice(0, 1);
    }
    if (selector.indexOf(":last") !== -1) {
        return results.slice(-1);
    }
    let eqMatch = selector.match(/:eq\(([0-9]+)\)/i);
    if (eqMatch) {
        let idx = parseInt(eqMatch[1], 10);
        return results[idx] ? [results[idx]] : [];
    }

    return results;
}

// --- 3. QUERY ENGINE DỮ LIỆU CÓ HỖ TRỢ TÌM THEO DẤU CÁCH ("tr .class") ---
function querySelectorAll(startNode, selector, nodes) {
    try {
        if (!startNode || !selector) return [];

        // Nếu có dấu phẩy (mẫu selector nhóm)
        if (selector.indexOf(',') !== -1) {
            let groupSelectors = selector.split(',').map(s => s.trim());
            let resMap = new Map();
            for (let gSel of groupSelectors) {
                let subRes = querySelectorAll(startNode, gSel, nodes);
                for (let r of subRes) resMap.set(r.id, r);
            }
            return Array.from(resMap.values());
        }

        // Nếu có dấu cách (Mẫu selector phân cấp: "tr .class1")
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


// --- 4. WRAPPER MINIJQ ---
var MiniJQ = function(elements, nodesStore) {
    this.elements = Array.isArray(elements) ? elements : (elements ? [elements] : []);
    this.nodes = nodesStore || [];
    this.length = this.elements.length;
};

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

function _$(param) {
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
};