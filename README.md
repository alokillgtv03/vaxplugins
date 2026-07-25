
Bạn giúp mình bọc try catch tất cả hàm và log ra lỗi nhé, cú phảp log("Tên Hàm[err]:\n " + lỗi), còn hàm nào có dữ liệu là url thì log ra với cú pháp log("Tên Hàm[url]: \n" + url)





function getHomeSections() {
    var listurl = "[{\"link\":\"/phim-moi\",\"name\":\"Hàng Mới\"}]";
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
    try {
        if (slug && slug.indexOf("http") > -1) {
            if (slug.indexOf("search") > -1) {
                if (filtersJson) {
                    var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
                    try {
                        var filters = JSON.parse(fixedJson);
                        var page = parseInt(filters.page) || 1;
                        if (page > 1) {
                            return slug + "?from_videos=" + page + "&from_albums=" + page;
                        } else {
                            return slug;
                        }
                    } catch (jsonErr) {
                        return slug;
                    }
                }
            }
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
            resultUrl += "?page=" + page;
        }
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        console.log(e);
        if (slug && slug.indexOf("http") > -1) {
            return slug;
        }
        var fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/tim-kiem/" + encodeURIComponent(keyword);
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
// PARSERS
// =============================================================================
function parseListResponse(html, $url) {
    try {
        var items = [];
        var calculatedPage = 1;
        if ($url && $url.indexOf("page=") > -1) {
            var matchPage = $url.match(/page=(\d+)/);
            if (matchPage) calculatedPage = parseInt(matchPage[1]) || 1;
        }

        _$(html).find(".grid").find(".relative").find("a").each(function() {
            var href = this.attr("href").replace("/phim", "");
            if (href.indexOf("http") == -1) {
                href = BASEURL + href;
            }
            var title = this.attr("title");
            var src = this.find("img").attr("src");
            if (src.indexOf("http") == -1) {
                src = BASEURL + src;
            }
            
            if (href && href.indexOf("http") > -1) {
                var cleanThumb = src.replace(/&amp;/g, '&');
                items.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "quality": "",
                    "lang": "",
                    "episode_current": ""
                });
            }
        });
        
        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": calculatedPage,
                "totalPages": 999
            }
        });
    } catch (e) {
        log(e);
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
    return parseListResponse(html, url);
}

function parseNextPayload(raw) {
    try {
        var match = raw.match(/self\.__next_f\.push\((.*)\)/);
        if (!match) return null;
        var pushArgs = JSON.parse(match[1]);
        var rawString = pushArgs[1];
        var cleanJsonStr = rawString.replace(/^\w+:/, '').replace(/\n$/, '');
        return JSON.parse(cleanJsonStr);
    } catch (e) {
        return null;
    }
}

// Thay thế các cú pháp ES6 như const/let thành var để tương thích hoàn toàn QuickJS cổ điển
function extractCleanData(data) {
    var result = { video: null, episodes: [], related: [], collection: [] };
    function traverse(node) {
        if (!node) return;
        if (typeof node === 'object' && !Array.isArray(node)) {
            if (node.video && typeof node.video === 'object') {
                result.video = node.video;
            }
            if (Array.isArray(node.episodes)) {
                result.episodes = node.episodes;
            }
            if (Array.isArray(node.related)) {
                result.related = node.related;
            }
            if (Array.isArray(node.collection)) {
                result.collection = node.collection;
            }
            for (var key in node) {
                if (node.hasOwnProperty(key)) traverse(node[key]);
            }
        } else if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) {
                traverse(node[i]);
            }
        }
    }
    traverse(data);
    return result;
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
        
        var script = _$(html).find("script:content('m3u8Url')").text();
        if (!script) {
            script = _$(html).find("script:content('audioType')").text();
        }
        
        var rawVD = parseNextPayload(script);
        var dataVD = extractCleanData(rawVD);
        var video = dataVD.video;
        
        if (video) {
            lname = video.title || lname;
            limg = video.thumbnailUrl || limg;
            ldes = video.description || ldes;
            year = video.releaseYear || year;
            lactor = video.cast || lactor;
            lduran = video.durationString || lduran;
            status = video.status || status;
        }
        
        var listepi = dataVD.episodes || [];
        var items = [];
        for (var $j = 0; $j < listepi.length; $j++) {
            var name = listepi[$j].audioType ? listepi[$j].audioType.replace(/VIETSUB/i, "Việt Sub").replace(/THUYET_MINH/i, "Thuyết Minh") : "Tập " + ($j + 1);
            var link = listepi[$j].m3u8Url || "";
            items.push({
                "name": name,
                "id": link + "#.m3u8",
                "slug": "type1"
            });
        }
        
        servers.push({ "name": "Server Gà Mờ", "episodes": items });
        
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
        return JSON.stringify({
            "url": "",
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