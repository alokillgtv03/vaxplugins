var BASEURL = "https://www.1porn.tv"; 

function getManifest() {
    return JSON.stringify({
        "id": "1porn",
        "name": "1Porn",
        "description": "XXX 4K",
        "version": "1.3",
        "baseUrl": "https://www.1porn.tv",
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/cnporn.jpg",
        "info": "Nguồn phim chất lượng 4K nên load hơi lâu, bạn chịu khó đợi tí nha.",
        "isEnabled": true,
        "isAdult": true,
        "type": "MOVIE",
        "playerType": "exoplayer"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[gamomephim] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[gamomephim] " + msg);
    }
}

function getHomeSections() {
    var listurl = "[{\"link\":\"/vi/categories/4k/\",\"name\":\"4K\"}]";
    var menulist = buildMenu(listurl, true);
    return JSON.stringify(menulist);
}

function getPrimaryCategories() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function getFilterConfig() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify({
        category: menulist
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    log("list url: " + slug);
    try {
        var page = 1;

        if (slug && slug.indexOf("http") > -1) {
            if (slug.indexOf("search") > -1 && filtersJson) {
                var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
                try {
                    var filters = JSON.parse(fixedJson);
                    page = parseInt(filters.page) || 1;
                    if (page > 1) {
                        var cleanSlug = slug.replace(/\/+$/, "") + "/";
                        return (cleanSlug + page + "/").replace(/([^:]\/)\/+/g, "$1");
                    }
                } catch (jsonErr) {}
            }
            return slug;
        }

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

        var baseUrlClean = (typeof BASEURL !== 'undefined' ? BASEURL : "").replace(/\/+$/, "");
        var pathClean = path ? path.replace(/^\/+|\/+$/g, "") : "";

        var resultUrl = baseUrlClean + (pathClean ? "/" + pathClean : "");

        if (page > 1) {
            resultUrl += "/" + page + "/";
        } else {
            if (pathClean && pathClean.indexOf("?") !== 0) {
                resultUrl += "/";
            }
        }

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");

    } catch (e) {
        console.log(e);
        if (slug && slug.indexOf("http") > -1) {
            return slug;
        }
        var fallbackBase = typeof BASEURL !== 'undefined' ? BASEURL : "";
        var fallback = fallbackBase + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var page = 1;

        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
            } catch (jsonErr) {}
        }

        var baseUrlClean = (typeof BASEURL !== 'undefined' ? BASEURL : "").replace(/\/+$/, "");
        var encodedKeyword = encodeURIComponent(keyword || "");

        var resultUrl = baseUrlClean + "/vi/search/" + encodedKeyword + "/relevance/";

        if (page > 1) {
            resultUrl += page + "/";
        }

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");

    } catch (e) {
        console.log(e);
        var fallbackBase = typeof BASEURL !== 'undefined' ? BASEURL : "";
        var fallback = fallbackBase + "/vi/search/" + encodeURIComponent(keyword || "") + "/relevance/";
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + "/" + slug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS (VANILLA JS - NO JQUERY)
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        // Regex lấy khối <div class="item">...</div>
        var itemRegex = /<div[^>]*class=["'][^"']*item[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
        var itemMatch;

        while ((itemMatch = itemRegex.exec(html)) !== null) {
            var itemHtml = itemMatch[1];

            // Lấy thẻ a đầu tiên
            var aMatch = itemHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
            if (!aMatch) continue;

            var href = aMatch[1];
            var innerA = aMatch[2];

            if (href.indexOf("http") === -1) {
                href = BASEURL + href;
            }
            if (!href.match(/videos/) && href.indexOf(BASEURL) < 0) {
                href = "";
            }

            // Lấy duration
            var durationMatch = innerA.match(/class=["'][^"']*duration[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
            var current = durationMatch ? durationMatch[1].replace(/<[^>]+>/g, "").trim().replace(/^[\s\S]*?(\d)/i, "$1") : "";

            // Lấy Quality (span class="is-...")
            var qualityMatch = innerA.match(/<span[^>]+class=["'][^"']*is-[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
            var quality = qualityMatch ? qualityMatch[1].replace(/<[^>]+>/g, "").trim() : "";

            // Lấy thẻ img và các thuộc tính alt, src, data-src
            var imgMatch = innerA.match(/<img[^>]+>/i);
            var title = "";
            var src = "";

            if (imgMatch) {
                var imgTag = imgMatch[0];
                var altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
                var srcMatch = imgTag.match(/src=["']([^"']*)["']/i);
                var dataSrcMatch = imgTag.match(/data-src=["']([^"']*)["']/i);

                title = altMatch ? altMatch[1] : "";
                src = srcMatch ? srcMatch[1] : "";

                if (src.indexOf("data:image") > -1 && dataSrcMatch) {
                    src = dataSrcMatch[1];
                }
            }

            if (src && src.indexOf("http") === -1) {
                src = BASEURL + src;
            }

            if (href && href.indexOf("http") > -1) {
                var cleanThumb = src.replace(/&amp;/g, '&');
                items.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "quality": quality,
                    "lang": "",
                    "episode_current": current
                });
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": 1,
                "totalPages": 999
            }
        });

    } catch (e) {
        log(e);
        return JSON.stringify({
            "items": [{
                "id": $url,
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
    return parseListResponse(html, url);
}

function parseMovieDetail(html, url) {
    try {
        log(url);
        var id = url;
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        var category = "";
        var episode_current = "";
        var quality = "";
        var year = 2026;
        var rating = 0;
        var servers = [];
        var extra = "";
        var lactor = "";
        var ldirec = "";
        var lduran = "";
        var status = "";

        // Trích xuất <h1>Title</h1>
        var h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (h1Match) lname = h1Match[1].replace(/<[^>]+>/g, "").trim();

        // Trích xuất Meta og:image
        var imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (imgMatch) limg = imgMatch[1];

        // Trích xuất Meta og:description
        var desMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
        if (desMatch) ldes = desMatch[1];

        // Trích xuất Meta video:release_date (Duration)
        var durMatch = html.match(/<meta[^>]+property=["']video:release_date["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']video:release_date["']/i);
        if (durMatch) {
            var durVal = parseInt(durMatch[1]);
            if (!isNaN(durVal)) {
                lduran = Math.floor(durVal / 60) + " phút";
            }
        }

        // Trích xuất Thể loại (Categories) & Diễn viên (Pornstars) qua Helper
        category = extractLinksByLabel(html, ["Thể loại:", "Categories:"]);
        lactor = extractLinksByLabel(html, ["Pornstars:", "Diễn viên:"]);

        // Trích xuất danh sách video <source>
        var $items = [];
        var sourceRegex = /<source[^>]+>/gi;
        var sourceMatch;
        while ((sourceMatch = sourceRegex.exec(html)) !== null) {
            var tag = sourceMatch[0];
            var srcAttr = tag.match(/src=["']([^"']+)["']/i);
            var labelAttr = tag.match(/label=["']([^"']+)["']/i);

            if (srcAttr) {
                var link = srcAttr[1] + "#.m3u8";
                var name = labelAttr ? labelAttr[1] : "Default";
                $items.push({
                    id: link,
                    name: "HQ: " + name,
                    slug: name
                });
            }
        }

        servers.push({
            name: "Server",
            episodes: $items
        });

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
            extra: extra
        });

    } catch (e) {
        log(e);
        return JSON.stringify({
            id: url || "error",
            title: "Lỗi tải thông tin chi tiết",
            servers: []
        });
    }
}

function parseDetailResponse(html, url) {
    try {
        var stream = "";
        var sourceMatch = html.match(/<source[^>]+src=["']([^"']+)["']/i);
        if (sourceMatch) {
            stream = sourceMatch[1];
        }

        return JSON.stringify({
            "url": stream,
            "isEmbed": false,
            "mimeType": "application/x-mpegURL",
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": "", "headers": {} });
    }
}

// Helper thuần JS dùng cho trích xuất Nhãn -> Thẻ A đính kèm
function extractLinksByLabel(html, labels) {
    for (var i = 0; i < labels.length; i++) {
        var label = labels[i];
        var pos = html.indexOf(label);
        if (pos !== -1) {
            // Lấy đoạn HTML ngắn xung quanh nhãn
            var snippet = html.substring(pos, pos + 1000);
            var aRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
            var match;
            var results = [];
            while ((match = aRegex.exec(snippet)) !== null) {
                var text = match[1].replace(/<[^>]+>/g, "").trim();
                if (text) results.push(text);
            }
            if (results.length > 0) {
                return results.join(" - ");
            }
        }
    }
    return "";
}

function sortEpisodesByName(data) {
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
    return data;
}

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `[{\"link\":\"/vi/categories/4k/\",\"name\":\"4K\"},{\"link\":\"/vi/latest-updates/\",\"name\":\"Video Mới\"},{\"link\":\"/vi/categories/facial/\",\"name\":\"Xuất Lên mặt\"},{\"link\":\"/vi/categories/big-cock/\",\"name\":\"Cu Bự\"},{\"link\":\"/vi/categories/anal/\",\"name\":\"Hậu Môn\"},{\"link\":\"/vi/categories/pov/\",\"name\":\"POV\"},{\"link\":\"/vi/categories/solo/\",\"name\":\"Một Mình\"},{\"link\":\"/vi/categories/sex-toys/\",\"name\":\"đồ chơi tình dục\"},{\"link\":\"/vi/categories/masturbation/\",\"name\":\"Thủ Dâm\"},{\"link\":\"/vi/categories/amateur/\",\"name\":\"Nghiệp Dư\"},{\"link\":\"/vi/categories/lesbian/\",\"name\":\"Đồng Tính Nữ\"},{\"link\":\"/vi/categories/spanking/\",\"name\":\"Tét Đít\"},{\"link\":\"/vi/categories/interracial/\",\"name\":\"Khác Chủng Tộc\"},{\"link\":\"/vi/categories/threesome/\",\"name\":\"Có Ba Người\"},{\"link\":\"/vi/categories/ass-fingering/\",\"name\":\"Móc Đít\"},{\"link\":\"/vi/categories/outdoor/\",\"name\":\"Ngoài Trời\"},{\"link\":\"/vi/categories/creampie/\",\"name\":\"Creampie\"},{\"link\":\"/vi/categories/gagging/\",\"name\":\"Nghẹn\"},{\"link\":\"/vi/categories/fetish/\",\"name\":\"Ái Vật\"},{\"link\":\"/vi/categories/rimming/\",\"name\":\"Bú Đít\"},{\"link\":\"/vi/categories/couple/\",\"name\":\"Cặp Đôi\"},{\"link\":\"/vi/categories/ass-to-mouth/\",\"name\":\"Vào-Đít-Vào-Miệng\"},{\"link\":\"/vi/categories/striptease/\",\"name\":\"Thoát y\"},{\"link\":\"/vi/categories/squirt/\",\"name\":\"Squirt\"},{\"link\":\"/vi/categories/gaping/\",\"name\":\"Lỗ Rộng\"},{\"link\":\"/vi/categories/casting/\",\"name\":\"Tuyển Diễn Viên\"}]`;
}

function buildMenu(menuStr, type) { 
    var menuArray = JSON.parse(menuStr); 
    var menulist = []; 
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