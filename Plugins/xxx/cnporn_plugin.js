
BASEURL = "https://cnporn.org";

function getManifest() {
    return JSON.stringify({
        "id": "cnporn",
        "name": "Porn Gái Trung",
        "info": "Nguồn XXX Trung Quốc Hay.",
        "version": "1.8.2",
        "baseUrl": "https://cnporn.org",
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/cnporn.jpg",
        "isEnabled": true,
        "layoutType": "HORIZONTAL"
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "exoplayer"
    });
}

DEV = "false";

function log(msg) {
    try {
        if (DEV) {
            if (typeof console !== 'undefined' && console.log) {
                console.log("[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg);
            }
        }
    } catch (e) {
        // Tránh vòng lặp vô tận nếu log bị lỗi
    }
}

function getHomeSections() {
    try {
        return JSON.stringify([
            { "slug": "/", "title": "Hàng Mới", "type": "Grid" }
        ]);
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
        var menulist = buildMenu(listurl);
        return JSON.stringify({
            category: menulist
        });
    } catch (e) {
        log("getFilterConfig[err]:\n " + e);
    }
}

function getUrlList(slug, filtersJson) {
    try {
        if (slug && slug.indexOf("http") > -1 || slug.indexOf("search/") > -1) {
            log("getUrlList[url]: \n" + slug);
            return slug;
        }
        let page = 1;
        let path = slug || "";
        
        if (filtersJson) {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/:,/g, ':');
            
            try {
                let filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                
                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug;
                    } else if (typeof filters.category === 'string') {
                        path = filters.category;
                    }
                }
            } catch (jsonErr) {
                // Ignore inner json parse error
            }
        }
        
        let resultUrl = BASEURL;
        if (path) {
            resultUrl += path;
        }
        if (page > 1 && resultUrl.indexOf("filter=latest") == -1) {
            resultUrl += "/page/" + page + "/";
        }
        let finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalUrl);
        return finalUrl;
        
    } catch (e) {
        log("getUrlList[err]:\n " + e);
        let fallback = BASEURL + (slug ? "/" + slug : "");
        let finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalFallback);
        return finalFallback;
    }
}


function getUrlSearch(keyword, filtersJson) {
    try {
         var page = 1;
            if (filtersJson) {
                var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                    .replace(/:,/g, ':');
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                // https://cnporn.org/search/page/4?key=girl
                var url = BASEURL + "/search/page/"+page+"?key=" + encodeURIComponent(keyword);
                log("getUrlSearch[url]: \n" + url);
                return url
                
            }
        
        var url = BASEURL + "/search/?key=" + encodeURIComponent(keyword);
        log("getUrlSearch[url]: \n" + url);
        return url;
    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
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
        var url = BASEURL + slug;
        log("getUrlDetail[url]: \n" + url);
        return url;
    } catch (e) {
        log("getUrlDetail[err]:\n " + e);
    }
}

function getUrlCategories() {
    try {
        var url = BASEURL;
        log("getUrlCategories[url]: \n" + url);
        return url;
    } catch (e) {
        log("getUrlCategories[err]:\n " + e);
    }
}

function getUrlCountries() {
    try {
        log("getUrlCountries[url]: \n");
        return "";
    } catch (e) {
        log("getUrlCountries[err]:\n " + e);
    }
}

function getUrlYears() {
    try {
        log("getUrlYears[url]: \n");
        return "";
    } catch (e) {
        log("getUrlYears[err]:\n " + e);
    }
}

function parseListResponse(html, $url) {
    try {
        var items = [];
        var regexList = `
<div class=[^>]+tw-item[^>]*>[\\s\\S]*?
<a[^>]+href=["']([^"']+)["'][\\s\\S]*?
src=["']([^"']+)["'][^>]+
alt="([^"]+)"
`;
        regexList = regexList.replace(/\r|\n|\t/g, "");
        regmath = new RegExp(regexList, "g");
        var matchList;
        while ((matchList = regmath.exec(html)) !== null) {
            if (matchList[1] && matchList[1].indexOf("http") > -1) {
                var cleanThumb = matchList[2].replace(/&amp;/g, '&');
                
                items.push({
                    "id": matchList[1],
                    "title": matchList[3].trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb
                });
            }
        }
        
        var totalPages = 999;
        var currentPage = 1;
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": currentPage, "totalPages": totalPages }
        });
    } catch (e) {
        log("parseListResponse[err]:\n " + e);
        var items = [];
        items.push({
            "id": $url,
            "title": "Lỗi: " + e,
            "posterUrl": "",
            "backdropUrl": ""
        });
        return JSON.stringify({ "items": items, "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) {
    try {
        return parseListResponse(html);
    } catch (e) {
        log("parseSearchResponse[err]:\n " + e);
    }
}

function parseMovieDetail(html, $url) {
    try {
        var lurl = "";
        var limg = "";
        var lname = "Đang cập nhật...";
        var ldes = "Không có mô tả.";
        var streamUrl = "";

        var rmatch = html.match(/link\s+rel="canonical"\s+href=["']([^"']+)["']/i);
        if (rmatch && rmatch[1]) { lurl = rmatch[1] }

        rmatch = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
        if (rmatch && rmatch[1]) { limg = rmatch[1]; }

        rmatch = html.match(/<title>([^<]+)/i);
        if (rmatch && rmatch[1]) { lname = rmatch[1]; }

        ldes = lname;
        var epi = [];
        var stream1 = "";
        var stream2 = "";
        var stream3 = "";
        const regex = /data-server\s*=\s*["']([^"']+)["']/g;
        const servers = Array.from(html.matchAll(regex), match => match[1]);
        
        if (servers[0]) {
            stream1 = BASEURL + servers[0];
            epi.push({ id: stream1, name: "Server Full", slug: "full" });
        }
        if (servers[1]) {
            stream2 = BASEURL + servers[1];
            epi.push({ id: stream2, name: "Server 2", slug: "full" });      
        }
        if (servers[2]) {
            stream3 = BASEURL + servers[2];
            epi.push({ id: stream3, name: "Server 3", slug: "full" });
        }

        var $return = {
            id: $url,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: "",
            servers: [
                {
                    name: "Servers: ",
                    episodes: epi
                }
            ],
            quality: "HD",
            year: 2026,
            rating: 8.5,
            status: "Full",
            duration: "N/A",
            casts: "N/A",
            director: "N/A",
            category: "18+"
        };
        var $objreturn = $return;
        $return.description = ldes + "\r\n\r\n\r\n\r\n\r\n\r\n" + JSON.stringify($objreturn);
        return JSON.stringify($return);
    } catch (e) {
        log("parseMovieDetail[err]:\n " + e);
    }
}

function parseDetailResponse(html, url) {
    try {
        var epi = [];
        var stream1 = "";
        var stream2 = "";
        var stream3 = "";
        const regex = /data-server\s*=\s*["']([^"']+)["']/g;
        const servers = Array.from(html.matchAll(regex), match => match[1]);
        
        if (servers[0]) {
            stream1 = BASEURL + servers[0];
        }
        /*
        if (servers[1]) {
            stream2 = BASEURL + servers[1];
        }
        if (servers[2]) {
            stream3 = BASEURL + servers[2];
        }
        */
        return JSON.stringify({
            "url": stream1,
            "isEmbed": true,
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            "subtitles": []
        });
        
    } catch (e) {
        log("parseDetailResponse[err]:\n " + e);
        return JSON.stringify({ "url": "", "headers": {} });
    }
}

function parseEmbedResponse(html, url) {
    try {
        var streamlink = "";
        const matches = html.match(/https?[^\s"']+\.(?:m3u8|mp4)[^\s"']*/g);
        if (matches) {
            const allLinks = matches ? matches.map(link => link.replace(/\\/g, '')) : [];
            streamlink = [...new Set(allLinks)];
            if (streamlink[0]) {
                streamlink = streamlink[0];
            }
        }
        
        return JSON.stringify({
            "url": streamlink,
            "isEmbed": false,
            "mimeType": "application/x-mpegURL",
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            "subtitles": []
        });
        
    } catch (e) {
        log("parseDetailResponse[err]:\n " + e);
        return JSON.stringify({ "url": "", "headers": {} });
    }
}

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `
/historical/@@Cổ Trang
/incest/@@Loạn Luân
/big-tits/@@Vú Bự
/china-porn/@@Trung Quốc
/cuckold/@@Cuck Old
/teacher/@@Giáo Viên
/hidden-cam/@@Cam Ẩn
/rape/@@Hấp Diêm
/threesome/@@Chơi Ba
/younger-sister/@@Gái Trẻ
`;
}

function buildMenu(listurl) {
    let menulist = [];
    if (!listurl) return menulist;
    
    let lines = listurl.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.indexOf('@@') === -1) continue;
        
        let parts = line.split('@@');
        let link = parts[0] ? parts[0].trim() : "";
        let name = parts[1] ? parts[1].trim() : "";
        let check = parts[2] ? parts[2].trim() : undefined;
        
        if (!link || !name) continue;
        
        let item = {};
        if (check === "false") {
            item = { "slug": link, "title": name, "type": "Horizontal" };
        } else if (check === "true") {
            item = { "slug": link, "title": name, "type": "Grid" };
        } else {
            item = { "slug": link, "name": name };
        }
        menulist.push(item);
    }
    return menulist;
}


