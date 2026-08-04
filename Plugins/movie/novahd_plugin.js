var BASEURL = "http://vkey.vn/novahd";
var BASEAPI = "http://vkey.vn/novahd/api";
// https://raw.githubusercontent.com/alokillgtv03/vaxplugins/main/img/phimchill.ico
var DEV = true;
function getManifest() {
  return JSON.stringify({
    id: "novahd",
    name: "Nguồn NovaHD",
    description: "Nguồn phim NovaHD",
    "version": "1.0",
    "author": "Alokillgtv",
    info: "Nguồn phim thuộc servers nước ngoài.\nDùng để sơ cua khi các nguồn trong nước bị sập.\nNguồn này có subtitle riêng nên có thể tự động dịch và lồng tiếng tự động.\nVì là nguồn nước ngoài nên đôi khi cần phải vượt DNS mới xem được.\nDo đó nếu không xem được hãy vào cài đặt bật DNS và DPI hoặc dùng ứng dụng 1.1.1.1 để vượt DNS.\nMột vài phim load sẽ hơi lâu, nhưng khi load được sẽ phát mượt. Nếu không load được hay bấm tải lại sẽ tự tìm link khác để phát",
    baseUrl: "http://vkey.vn/novahd",
    iconUrl: "https://raw.githubusercontent.com/alokillgtv03/vaxplugins/main/img/novahd.png",
    isEnabled: true,
    "adblock": false,
    "layoutType": "HORIZONTAL",
    type: "MOVIE",
    "subtitleCat": true,
    playerType: "exoplayer"
  });
}

function log(msg) {
  	console.log(msg);
}




function getHomeSections() {
    return JSON.stringify([
        {"slug": "/trending?type=all","title": "Xu Hướng","type": "Horizontal"},
        {"slug": "/shows?sort=popularity","title": "TV Show Thịnh Hành","type": "Horizontal"},
       {"slug": "/movies?sort=popularity","title": "Phim Lẻ Thịnh Hành","type": "Grid"},
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
        var resultUrl = BASEAPI;
        
        if (path) {
            resultUrl += (path.indexOf("/") === 0 ? "" : "/") + path;
        }

        // 4. Ghép tham số phân trang page (tự động nhận biết ? hay &)
        if (page > 0 && resultUrl.indexOf("page=") === -1) {
            resultUrl += "&page=" + page;
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
        var resultUrl = BASEAPI + "/search?search=" + encodedKeyword;

        // 3. Nếu page > 1 thì nối thêm &page=
        if (page > 1) {
            resultUrl += "&page=" + page;
        }

        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalUrl);
        return finalUrl;

    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
        var fallback = BASEAPI + "/search?search=" + encodeURIComponent(keyword || "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalFallback);
        return finalFallback;
    }
}

// http://vkey.vn/animevv
// /quoc-gia/M%E1%BB%B9
// /top
//filtersJson = "{page:5}"
//getUrlList("/top", filtersJson)
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

// https://novahd.cc/api/movies/337167
function getLanguageName(langCode) {
    // 1. Kiểm tra nếu không phải string hoặc chuỗi rỗng
    if (typeof langCode !== "string" || !langCode.trim()) {
        return "Không xác định";
    }
    const languageMap = { en: "Anh", vi: "Việt", ja: "Nhật", jp: "Nhật", ko: "Hàn", zh: "Trung", cn: "Trung", th: "Thái", fr: "Pháp", de: "Đức", ru: "Nga", es: "Tây Ban Nha", it: "Ý", pt: "Bồ Đào Nha", hi: "Ấn Độ", id: "Indonesia", tl: "Thái" };

    const code = langCode.trim().toLowerCase();

    // 2. Trả về tên tiếng Việt nếu có trong danh sách, ngược lại trả về mã gốc
    return languageMap[code] || langCode;
}


function parseListResponse(html, $url) {
    try {
        var tags = "shows";
        var $data = JSON.parse(html);
        var results = $data.results;
        if($url.indexOf("movies") > -1){
            tags = "movies"
        }
        else{
          tags = "shows"
        }
        var items = [];
        results.forEach(function(item){
            if($url.indexOf("search") > -1){
                tags = item.type + "s";
            }
            var id = BASEAPI + "/"+tags+"/" + item.tmdbId;
            var title = item.title;
            var poster = "https://image.tmdb.org/t/p/w780/" + item.posterPath;
            var background = poster;
            var genres = "";
            if (typeof item?.genres === "string") {
                genres = item.genres.replace(/,/g, " -");
            }
            var quality = getLanguageName(item.originalLanguage);
            var episode_current = "";
            var year = 2026;
            var lang = genres;
          
            if(title.length > 1 && poster.length > 5){
                items.push({
                    "id": id || "",
                    "title": title || "",
                    "quality": quality || "",
                    "episode_current": episode_current || "",
                    "posterUrl": poster || "",
                    "backdropUrl": background || "",
                    "year": year || 2026,
                    "lang": lang || ""
                });     
            }
        })
        //console.log(JSON.stringify(items))
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

// https://novahd.cc/api/sources?type=movie&tmdbId=216015
// https://novahd.cc/api/sources?type=show&tmdbId=1413&season=1&episode=1
// /api/sources?type=show&tmdbId=1413&season=1&episode=1
// http://vkey.vn/novahd/api/show/1413
function extractYear(dateString) {
    if (typeof dateString !== "string") {
        return null;
    }
    const regex = /^\d{4}-\d{2}-\d{2}$/;

    if (!regex.test(dateString.trim())) {
        return null; // Không đúng định dạng
    }
    const yearNumber = parseInt(dateString.slice(0, 4), 10);
    return isNaN(yearNumber) ? null : yearNumber;
}

function parseMovieDetail(html, url) {
    try {        
        log("parseMovieDetail[url]: \n" + url);
        // === BƯỚC 2: TRÍCH XUẤT THÔNG TIN PHIM ===
        var $data = JSON.parse(html);
        if($data.sources){        
          if($data.sources.length == 0){
            log("Dữ liệu phim rỗng, báo lỗi.\n")
          }
          else{
            log("Có dữ liệu tập phim.\n");
            var type = localStorage.getItem("typeMovie");
            if(type == "movies"){
              var servers = [];
              var episodes = [];             
              $data.sources.forEach(function(item, index){
                  var name = "Server: " + item.provider + " ["+ item.quality.replace("auto","Auto") + "]";
                  var id = localStorage.getItem("basicurl") + "&server=" + index;
                  
                  episodes.push({
                      id: id,
                      name: name,
                      slug: "full"
                  })
              })
              
              servers.push({
                  name: "Servers",
                  episodes: episodes
              })
              log("server Movie: \n" + JSON.stringify(servers))
            }
            else{
              var svstring = localStorage.getItem("servers");
              var servers = JSON.parse(svstring);
            }
            log("Servers từ localstore: " + servers)
          }
        }
        else{
          var id = url;
          var posterUrl = "https://image.tmdb.org/t/p/w780/" + $data.posterPath;
          var backdropUrl = "https://image.tmdb.org/t/p/w780/" + $data.backdropPath;
          var title = $data.title;
          var description = $data.overview;
          var director = $data.director;
          /*
          // menu casts
          var merge = [];
          $doc.find("#extras:content('Diễn|viên:')").find("a").each(function(){
          merge.push("[" + this.attr("title") + "](" + this.attr("href") + ")");
          })
          var casts = merge.join(", ");
          */
          var casts = $data.cast
          // menu casts
          /*
          // menu category
          var merge = [];
          $doc.find("#extras:content('Thể|loại:')").find("a").each(function(){
          merge.push("[" + this.attr("title") + "](" + this.attr("href") + ")");
          })
          var category = merge.join(", ");
          */
          var category = $data.genres;
          // menu category
          var duration = "";
          var status = "";
          var episode_current = "";
          var year = extractYear($data.releaseDate)
          var quality = "HD";
          var rating = "";
          var country = getLanguageName($data.originalLanguage);
          var tags = "movie";
          if (url) {
              if(url.indexOf("show") > -1){
                tags = "show";
              }         
          }
          var extra = ""; //BASEAPI + "/sources?type="+tags+"&tmdbId=" + $data.tmdbId;
          var checkExtra = ""
          var servers = [];
          // https://novahd.cc/api/sources?type=movie&tmdbId=216015
          // https://novahd.cc/api/sources?type=show&tmdbId=1413&season=1&episode=1
          // https://novahd.cc/api/sources?type=show&tmdbId=1413&season=1&episode=1
          localStorage.setItem("typeMovie","movies");
          if ($data.seasons) {
              localStorage.setItem("typeMovie","show");
              $data.seasons.forEach(function(item) {
                  var episodes = [];
                  var season = item.seasonNumber;
                  var nameSV = "Mùa " + season;
                  var idss = item.showId;
                  item.episodes.forEach(function(box, index) {
                      var id = BASEAPI + "/sources?type=show&tmdbId=" + idss + "&season=" + season + "&episode=" + box.episodeNumber;
                      var name = "Tập " + box.episodeNumber;
                      var slug = "tap-" + box.episodeNumber;
                      episodes.push({
                          id: id,
                          name: name,
                          slug: slug
                      })
                      if(season == 1 && box.episodeNumber == 1){
                        checkExtra = id;
                      }
                  })
                  servers.push({
                      name: nameSV,
                      episodes: episodes
                  })
              })
          } else {
              // https://novahd.cc/api/sources?type=movie&tmdbId=216015
              var id = BASEAPI + "/sources?type=movie&tmdbId=" + $data.tmdbId;
              localStorage.setItem("basicurl",id);
              servers.push({
                  name: "Server",
                  episodes: [{
                      id: id,
                      name: "Xem Ngay",
                      slug: "fullVideo"
                  }]            
             })
            checkExtra = id
          }
          log("Có extra url: " + checkExtra)
          extra = checkExtra; 
          localStorage.setItem("servers",JSON.stringify(servers));
            servers = [{
              name: "Dữ liệu phim này không có",
              episodes: [{
                id: "",
                name: "[Đã Lỗi] kiếm phim khác đi bạn ơi.",
                slug: ""
              }]
            }]
        }
      
        return JSON.stringify({
            id: url || "",
            title: title || "",
            posterUrl: posterUrl || "",
            backdropUrl: backdropUrl || "",
            description: description || "",
            quality: quality || "",
            year: year || 2026,
            rating: rating || 8.0,
            status: status || "",
            category: category || "",
            episode_current: episode_current || "",
            servers: servers || "",
            duration: duration || "",
            casts: casts || "",
            director: director || "",
            country: country || "",
            extra: extra || ""
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

//var url = "https://novahd.cc/api/show/1413"
//var url = "http://vkey.vn/novahd/api/show/1413"
// https://novahd.cc/api/shows/1413
//var html = sourceHTML;
//JSON.parse(parseMovieDetail(sourceHTML, url))


function parseDetailResponse(html, url) {
  try {
    console.log("parseDetailResponse dang xu ly: " + url);
    
    if (!html || typeof html !== "string") {
      throw new Error("Dữ liệu html rỗng hoặc không hợp lệ");
    }

    var $data = JSON.parse(html);
    var sources = $data.sources || [];
    var subtitles = $data.subtitles || [];

    // 1. Lọc tất cả các nguồn có link url hợp lệ
    var validSources = sources.filter(function(item) {
      return item.url && typeof item.url === "string" && item.url.trim() !== "";
    });

    var stream = "";
    if (validSources.length > 0) {
      var currentIndex = -1;

      // 2. Trích xuất tham số server=(number) từ URL truyền vào (nếu có)
      var serverMatch = url.match(/[?&]server=(\d+)/i);
      if (serverMatch) {
        var serverIndex = parseInt(serverMatch[1], 10);
        // Kiểm tra xem index từ server param có nằm trong khoảng danh sách nguồn không
        if (serverIndex >= 0 && serverIndex < validSources.length) {
          currentIndex = serverIndex;
          console.log("Lấy nguồn theo tham số server=" + currentIndex);
        }
      }

      // 3. Nếu trên URL không có server param hợp lệ, fallback về cơ chế xoay vòng localStorage
      var storageKey = "stream_index_" + url;
      if (currentIndex === -1) {
        var savedIndex = parseInt(localStorage.getItem(storageKey), 10);
        currentIndex = isNaN(savedIndex) ? 0 : savedIndex;

        if (currentIndex >= validSources.length) {
          currentIndex = 0;
        }

        // Tăng index sẵn cho lần retry/gọi tiếp theo
        var nextIndex = (currentIndex + 1) % validSources.length;
        localStorage.setItem(storageKey, nextIndex.toString());
      }

      // Lấy link stream tương ứng
      stream = validSources[currentIndex].url;
      console.log("Đang thử nguồn (" + (currentIndex + 1) + "/" + validSources.length + "): " + stream);

    } else {
      console.log("Không tìm thấy bất kỳ nguồn stream nào.");
    }

    // 4. Xử lý Subtitle
    var subtitleList = [];
    var baseUrlStr = typeof BASEURL !== "undefined" ? BASEURL : "";

    subtitles.forEach(function(item) {
      if (!item.lang || !item.url) return;
      if (item.lang.match(/en|eng|english/i)) {
        subtitleList.push({
          lang: "ENG",
          url: baseUrlStr + item.url
        });
      } else if (item.lang.match(/vi|vie|viet/i)) {
        subtitleList.push({
          lang: "VIET",
          url: baseUrlStr + item.url
        });
      }
    });

    return JSON.stringify({
      url: stream,
      mimeType: "application/x-mpegURL",
      isEmbed: false,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://novahd.cc/",
        "Origin": "https://novahd.cc"
      },
      subtitles: subtitleList,
    });
  } catch (e) {
    console.log("parseDetailResponse[err]:\n " + e);
    return JSON.stringify({
      url: "",
      isEmbed: false,
      headers: {},
      subtitles: [],
    });
  }
}


/**
 * HÀM BỔ SUNG: Báo lỗi khi Video Player không phát được.
 * Gọi hàm này từ sự kiện onError của Video Player để chuyển sang link kế tiếp.
 */
function reportStreamError(url) {
  var storageKey = "stream_index_" + url;
  var savedIndex = parseInt(localStorage.getItem(storageKey), 10);
  var currentIndex = isNaN(savedIndex) ? 0 : savedIndex;

  // Tăng index lên 1 để lần gọi parseDetailResponse tiếp theo lấy link mới
  localStorage.setItem(storageKey, (currentIndex + 1).toString());
  console.log("Đã chuyển index tiếp theo cho URL:", url, "Index mới:", currentIndex + 1);
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
    return `[
{"link":"/shows?sort=popularity","name":"TV Show"},
{"link":"/movies?sort=popularity","name":"Phim Lẻ"},
{"link":"/search?search=action","name":"Hành Động"},
{"link":"/search?search=horror","name":"Kinh Dị"},
{"link":"/search?search=fantasy","name":"Huyền Ảo"},
{"link":"/search?search=anime","name":"Anime"},
{"link":"/search?search=cartoon","name":"Hoạt Hình"},
{"link":"/search?search=romance","name":"Tình Cảm"},
{"link":"/search?search=comedy","name":"Hài Hước"},
{"link":"/search?search=scifi","name":"Viễn Tưởng"},
{"link":"/search?search=crime","name":"Trinh Thám"}
]`;
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
