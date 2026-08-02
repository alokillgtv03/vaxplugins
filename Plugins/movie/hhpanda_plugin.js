var BASEURL = "http://vkey.vn/hhpanda"; 
var LOGGER = false;
// https://www.whoreshub.com/categories/4k-porn/
function getManifest() {
    return JSON.stringify({
      "id": "hhpanda",
      "name": "Nguồn HHPanda",
      "description": "Anime siêu hay.",
      "version": "1.2.1",
      "info": "Nguồn phim hoạt hình chất lượng cao, tuy nhiên cơ chế chiếu phát của nó rất khó chịu. Chỉ phát được trên máy chủ của họ còn phát qua app sẽ bị mất góc không tràn viền.\r\nVì thế đã tích hợp bộ chỉnh kích cỡ video vào bên trong video. Bạn có thể chỉnh sao cho vừa màn hình. Chỉ cần chỉnh 1 lần là các lần sau sẽ dùng như vậy.",
      "baseUrl": "http://vkey.vn/hhpanda",
      "iconUrl": "http://vkey.vn/hhpanda/wp-content/uploads/2024/10/logo.webp",
      "isEnabled": true,
      "layoutType": "HORIZONTAL",
      "adblock": false,
      "type": "MOVIE",
      "playerTpye": "embedtoexoplay"
    })
};

function log(msg) {
  	if(LOGGER == "true"){
			if (typeof console !== 'undefined' && console.log) {
          console.log("[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg);
      }
    }
}

function getHomeSections() {
    return JSON.stringify([
       {
            "slug": "/hoan-thanh",
            "title": "Phim Hoàn Thành",
            "type": "Horizontal"
        },
       {
            "slug": "/most-viewed",
            "title": "Phim Xem Nhiều",
            "type": "Horizontal"
        },
        {
            "slug": "/the-loai/tu-tien",
            "title": "Tu Tiên",
            "type": "Horizontal"
        },
        {
            "slug": "/the-loai/do-thi",
            "title": "Đô thị",
            "type": "Horizontal"
        },
        {
            "slug": "/moi-cap-nhat/",
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
        var menulist = buildMenu(listurl, "filter");
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
        if (slug && slug.indexOf("http") > -1) {
            log("getUrlList[url]: \n" + slug);
            return slug;
        }

        var page = 1;
        var path = slug || "";

        if (filtersJson) {
            var fixedJson2 = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
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

        var resultUrl = BASEURL;
        if (path) {
            resultUrl += path;
        }
        if (page > 1) {
            resultUrl += "/page/" + page;
        }
        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalUrl);
        return finalUrl;
    } catch (e) {
        log("getUrlList[err]:\n " + e);
        if (slug && slug.indexOf("http") > -1) {
            log("getUrlList[url]: \n" + slug);
            return slug;
        }
        var fallback = BASEURL + (slug ? "/" + slug : "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalFallback);
        return finalFallback;
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var resUrl = "";
        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                var page = parseInt(filters.page) || 1;
                if (page > 1) {
                    resUrl = BASEURL + "/page/" + page + "?s=" + encodeURIComponent(keyword);
                } else {
                    resUrl = BASEURL + "?s=" + encodeURIComponent(keyword);
                }
            } catch (jsonErr) {
                resUrl = BASEURL + "?s=" + encodeURIComponent(keyword);
            }
        } else {
            resUrl = BASEURL + "?s=" + encodeURIComponent(keyword);
        }
        log("getUrlSearch[url]: \n" + resUrl);
        return resUrl;
    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
        var fallbackUrl = BASEURL + "?s=" + encodeURIComponent(keyword || "");
        log("getUrlSearch[url]: \n" + fallbackUrl);
        return fallbackUrl;
    }
}

function getUrlDetail(slug) {
    try {
        if (!slug) {
            log("getUrlDetail[url]: \n");
            return "";
        }
        if (slug.indexOf('http') === 0) {
            log("getUrlDetail[url]: \n" + slug);
            return slug;
        }
        var resUrl = BASEURL + "/" + slug;
        log("getUrlDetail[url]: \n" + resUrl);
        return resUrl;
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
        log("getUrlCountries[url]: \n");
        return "";
    } catch (e) {
        log("getUrlCountries[err]:\n " + e);
        return "";
    }
}

function getUrlYears() {
    try {
        log("getUrlYears[url]: \n");
        return "";
    } catch (e) {
        log("getUrlYears[err]:\n " + e);
        return "";
    }
}

// =============================================================================
// PARSERS
// =============================================================================

function fixHref(href) {
    try {
        if (!href) return '';

        // 1. Loại bỏ khoảng trắng thừa ở đầu và cuối
        let cleanHref = href.trim();

        // 2. Các mẫu đường dẫn cần bỏ qua (không gắn thêm BASEURL)
        const ignorePattern = /^(#|https?:\/\/|\/\/|mailto:|tel:|javascript:|data:|blob:)/i;

        if (ignorePattern.test(cleanHref)) {
            return cleanHref;
        }

        // 3. Xử lý trường hợp đường dẫn bắt đầu bằng dấu / (server-relative path)
        if (cleanHref.startsWith('/')) {
            try {
                const urlObj = new URL(BASEURL);
                return urlObj.origin + cleanHref;
            } catch (e) {
                return BASEURL + cleanHref;
            }
        }

        // 4. Đường dẫn tương đối thông thường
        return BASEURL + cleanHref;
    } catch (e) {
        log("fixHref[err]:\n " + e);
        return href || '';
    }
}

function isValidMediaUrl(url) {
    try {
        if (!url || typeof url !== 'string') return false;

        var cleanUrl = url.trim();

        // 1. Loại bỏ nếu dính chuỗi nối code JS, biến hoặc hàm (như _spEsc, +, ', ${...)
        if (cleanUrl.indexOf('_spEsc') > -1 ||
            cleanUrl.indexOf("'+") > -1 ||
            cleanUrl.indexOf("+'") > -1 ||
            cleanUrl.indexOf("${") > -1 ||
            cleanUrl.indexOf("javascript:") > -1) {
            return false;
        }

        // 2. Kiểm tra định dạng URL http/https hợp lệ (không chứa khoảng trắng, ngoặc đơn/kép, dấu +)
        var httpPattern = /^https?:\/\/[^\s"'<>+]+$/i;
        return httpPattern.test(cleanUrl);
    } catch (e) {
        log("isValidMediaUrl[err]:\n " + e);
        return false;
    }
}

function parseListResponse(html, $url) {
    try {
        var items = [];
        var $doc = _$(html);
        $doc.find("article").each(function() {
            var href = this.find("a").attr("href");
            href = fixHref(href);
            var title = this.find("a").attr("title");
            var src = this.find("img").attr("src");
            src = fixHref(src);

            var episode_current = this.find(".status").text().trim();
            var quality = this.find(".mc__score").text().trim();

            if (isValidMediaUrl(href)) {
                var cleanThumb = (src || "").replace(/&amp;/g, '&').trim();

                // Đảm bảo cleanThumb cũng là link ảnh hợp lệ, nếu không có thì fallback
                if (cleanThumb && cleanThumb.indexOf('http') !== 0) {
                    cleanThumb = 'https:' + cleanThumb;
                }

                items.push({
                    "id": href.trim(),
                    "title": (title || "").trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "quality": quality || "",
                    "lang": "",
                    "episode_current": episode_current || ""
                });
            }
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
        return parseListResponse(html, url);
    } catch (e) {
        log("parseSearchResponse[err]:\n " + e);
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseMovieDetail(html, url) {
    try {
        // === BƯỚC 1: ĐỒNG NHẤT ID PHIM BẰNG REGEX META (Y hệt tác giả) ===
        var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html) ||
            /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(html);
        var id = idMatch ? idMatch[1] : (url || "");
        var $doc = _$(html);
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
        var rating = 5;
        var rmatch = html.match(/meta\s+property="og:url"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lurl = rmatch[1];

        rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) limg = rmatch[1];

        if (limg.indexOf("//") === 0) {
            limg = "https:" + limg;
        } else if (limg.indexOf("http") === -1) {
            limg = BASEURL + limg;
        }
        rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lname = rmatch[1];

        var ldes = $doc.find(".video-item").find("article").text();
        var year = 2026;
        var extra = "";

        status = $doc.find(".hh3d-info").find("span").parent().text(" - ");

        var categoryResult = [];
        $doc.find(".list_cate").find("a").each(function() {
            var link = this.attr("href") || this.find("a").attr("href");
            var name = this.text().replace(/\s+/g, ' ').trim();

            if (name && link) {
                var slug = typeof getSlug === 'function' ? getSlug(link) : link;
                slug = slug.replace(BASEURL, "");
                categoryResult.push("[" + name + "](" + slug + ")");
            }
        });

        category = categoryResult.join(", ");
        episode_current = $doc.find("span.new-ep").text();

        var servers = [];

        $doc.find("#halim-list-server").find(".halim-server").each(function() {
            var $namesv = this.find(".halim-server-name").text();
            var items = [];
            this.find(".halim-list-eps").each(function() {
                this.find("a").each(function() {
                    var id = this.attr("href");
                    var name = this.attr("title");
                    var slug = this.attr("data-ep");
                    items.push({
                        id: id,
                        name: name,
                        slug: slug
                    });
                });
            });
            servers.push({
                name: $namesv,
                episodes: items
            });
        });
        servers = sortEpisodesByName(servers);

        // === BƯỚC 5: TRẢ VỀ KẾT QUẢ ĐỒNG NHẤT ID ===
        return JSON.stringify({
            id: id,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
            year: year,
            rating: rating,
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

function sortEpisodesByName(data) {
    try {
        if (!Array.isArray(data)) return data;

        data.forEach(function(server) {
            if (server.episodes && Array.isArray(server.episodes)) {
                server.episodes.sort(function(a, b) {
                    var nameA = a.name || '';
                    var nameB = b.name || '';

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
                        sensitivity: 'base'
                    });
                });
            }
        });

        return data;
    } catch (e) {
        log("sortEpisodesByName[err]:\n " + e);
        return data;
    }
}
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

function parseDetailResponse(html, pageUrl) {
    try {
        var $doc = _$(html);
        var currentlink = $doc.find("meta[property='og:url']").attr("content");
        var matchC = currentlink.match(/sv(\d+)/i);
        var currentserver = 1;
        var currenttap = 1;
        var matchA = currentlink.match(/(tap-\d+)/i);
        if (matchC && matchC[1]) {
            currentserver = matchC[1];
        }
        if (matchA && matchA[1]) {
            currenttap = matchA[1];
        }
        var currentid = $doc.find("#main-contents").attr("data-id");
        var typecurrent = $doc.find("#halim-ajax-list-server").find("span:first").attr("data-type");
        var framelink = `https://hhpanda.st/player/player.php?action=dox_ajax_player&post_id=${currentid}&chapter_st=${currenttap}&type=${typecurrent}&sv=${currentserver}`;
        var $dataSv = {};
        $dataSv.movieid = currentid;
        $dataSv.serverhientai = currentserver;
        $dataSv.hqhientai = typecurrent;
        $dataSv.taphientai = currenttap;

        var servers = [];
        $doc.find(".halim-server").each(function() {
            var $namesv = this.find(".halim-server-name").text();
            var items = [];
            var type = 1;
            var maxEpi = 1;
            maxEpi = this.find(".halim-episode").find("a").length;

            this.find(".halim-episode").each(function() {
                type = this.find("a:first").attr("data-sv");
            });

            servers.push({
                name: $namesv,
                type: type,
                maxEpi: maxEpi
            });
        });
        $dataSv.servers = servers;

        var serverHQ = [];
        $doc.find("#halim-ajax-list-server").find("span").each(function() {
            var name = this.text();
            var type = this.attr("data-type");
            serverHQ.push({
                nname: name,
                type: type
            });
        });
        $dataSv.HQ = serverHQ;

        var bypassJs = checkRaw(customJS($dataSv),true);
        log("parseDetailResponse[url]: \n" + framelink);
        return JSON.stringify({
            url: framelink,
            isEmbed: false,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": pageUrl,
                "Block-Ads": false,
                "Custom-Js": bypassJs
            },
            subtitles: []
        });
    } catch (e) {
        log("parseDetailResponse[err]:\n " + e);
        return JSON.stringify({
            url: "",
            isEmbed: false,
            headers: {},
            subtitles: []
        });
    }
}

/*

BASEURL = "https://animehay09.site";
var html = sourceHTML;
//JSON.parse(parseDetailResponse(sourceHTML, BASEURL))
JSON.parse(parseEmbedResponse(sourceHTML, BASEURL))
// 'AHS': 'https://ahay.stream/embed-jw/75913'

*/

function customJS(config) {
    const configStr = JSON.stringify(config);

    return `
(function() {
    // 1. CLEAR DỮ LIỆU CŨ LỖI
    console.log('[PhimHDCS] SCRIPT RELOADED SUCCESSFULLY!');

    const CONFIG = ${configStr};
    
    // Đọc số tập chính xác từ CONFIG truyền vào
    let currentTapNum = 1;
    if (CONFIG.taphientai) {
        let extracted = String(CONFIG.taphientai).replace(/[^0-9]/g, '');
        if (extracted) currentTapNum = parseInt(extracted, 10);
    }

    // Đọc Scale và làm tròn chính xác 1 chữ số thập phân
    function getCleanScale() {
        let raw = localStorage.getItem("anime_player_iframe_scale") || "1.0";
        let parsed = parseFloat(raw);
        if (isNaN(parsed)) return 1.0;
        return Math.round(parsed * 10) / 10; // Đảm bảo luôn ra 1.8, 1.9, 2.0 chuẩn 100%
    }

    // 2. HÀM RENDER ĐIỀU KHIỂN SCALE & TẬP
    window.forceUpdateUI = function() {
        const activeScale = getCleanScale();
        
        // Cập nhật Nút Scale trên Control Bar
        const scaleBtn = document.getElementById("v-scale-trigger");
        if (scaleBtn) scaleBtn.textContent = "Scale " + activeScale.toFixed(1) + "x ▼";

        // Cập nhật Nút Tập trên Control Bar
        const epBtn = document.getElementById("v-ep-trigger");
        if (epBtn) epBtn.textContent = "Tập " + currentTapNum + " ▼";

        // Cập nhật Grid Modal Scale
        const scaleGrid = document.getElementById("v-scale-grid");
        if (scaleGrid) {
            scaleGrid.innerHTML = "";
            for (let i = 5; i <= 40; i++) {
                let val = Math.round(i) / 10; // 0.5, 0.6 ... 1.8, 1.9
                let btn = document.createElement("span");
                btn.textContent = val.toFixed(1) + "x";
                
                // SO SÁNH CHÍNH XÁC NGUYÊN THỂ NUMERIC
                let isSelect = (val === activeScale);
                
                btn.style.cssText = "padding:6px; border-radius:4px; text-align:center; font-weight:bold; cursor:pointer; background:" + (isSelect ? "#e50914" : "#2a2a2a") + "; color:#fff;";
                
                btn.onclick = function(e) {
                    e.stopPropagation();
                    localStorage.setItem("anime_player_iframe_scale", val.toString());
                    
                    // Apply style scale lên iframe
                    let iframe = document.getElementById("v-main-frame");
                    if(iframe) {
                        iframe.style.transform = "translate(-50%, -50%) scale(" + val + ")";
                    }
                    
                    // Đóng modal & render lại
                    document.getElementById("v-modal-overlay").style.display = "none";
                    document.getElementById("v-scale-dialog").style.display = "none";
                    window.forceUpdateUI();
                };
                scaleGrid.appendChild(btn);
            }
        }

        // Cập nhật Grid Modal Tập
        const epGrid = document.getElementById("v-ep-grid");
        if (epGrid) {
            epGrid.innerHTML = "";
            let maxEpi = 40;
            if (CONFIG.servers && CONFIG.servers[0] && CONFIG.servers[0].maxEpi) {
                maxEpi = CONFIG.servers[0].maxEpi;
            }
            for (let i = 1; i <= maxEpi; i++) {
                let btn = document.createElement("span");
                btn.textContent = i;
                let isSelect = (i === currentTapNum);
                btn.style.cssText = "padding:6px; border-radius:4px; text-align:center; font-weight:bold; cursor:pointer; background:" + (isSelect ? "#e50914" : "#2a2a2a") + "; color:#fff;";
                
                btn.onclick = function(e) {
                    e.stopPropagation();
                    currentTapNum = i;
                    document.getElementById("v-modal-overlay").style.display = "none";
                    document.getElementById("v-ep-dialog").style.display = "none";
                    
                    // Reload Iframe
                    let iframe = document.getElementById("v-main-frame");
                    if(iframe) {
                        iframe.src = "https://hhpanda.st/player/player.php?action=dox_ajax_player&post_id=" + CONFIG.movieid + "&chapter_st=tap-" + i + "&type=" + (CONFIG.hqhientai||"1080p") + "&sv=" + (CONFIG.serverhientai||"Vietsub");
                    }
                    window.forceUpdateUI();
                };
                epGrid.appendChild(btn);
            }
        }
    };

    // Chạy ngay khi khởi tạo
    setTimeout(window.forceUpdateUI, 200);
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

// https://hhpanda.st/moi-cap-nhat/page/3
// {\"link\":\"/moi-cap-nhat/\",\"name\":\"Phim Mới\"},
function getLISTmenu() {
    return `[{\"link\":\"/moi-cap-nhat/\",\"name\":\"Phim Mới\"},{\"link\":\"/the-loai/tu-tien\",\"name\":\"Tu Tiên\"},{\"link\":\"/the-loai/kiem-hiep\",\"name\":\"Kiếm Hiệp\"},{\"link\":\"/the-loai/co-trang\",\"name\":\"Cổ Trang\"},{\"link\":\"/the-loai/huyen-huyen\",\"name\":\"Huyền Huyễn\"},{\"link\":\"/the-loai/khoa-huyen\",\"name\":\"Khoa Huyễn\"},{\"link\":\"/the-loai/ky-ao\",\"name\":\"Kỳ Ảo\"},{\"link\":\"/the-loai/huyen-nghi\",\"name\":\"Huyền Nghi\"},{\"link\":\"/the-loai/canh-ky\",\"name\":\"Cạnh Kỹ\"},{\"link\":\"/the-loai/da-su\",\"name\":\"Dã Sử\"},{\"link\":\"/the-loai/do-thi\",\"name\":\"Đô Thị\"},{\"link\":\"/the-loai/dong-nhan\",\"name\":\"Đồng Nhân\"}]`  
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
        } else if(typeStr === "filter"){
          	menuItem = { "value": link, "name": name}; 
        }
        
        else { 
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
