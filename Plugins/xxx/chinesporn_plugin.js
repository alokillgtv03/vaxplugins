BASEURL = "https://ppp.porn";
DEV = "false";

function getManifest() {
    return JSON.stringify({
        "id": "chinesporn",          
        "name": "Sex Trung",
        "description": "Nguồn XXX trung quốc Hay",
        "version": "1.5",             
        "baseUrl": "https://ppp.porn",
        "info": "Nguồn XXX trung quốc khá hay.",
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/chinesporn.jpg", 
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "exoplayer"
    });
}

function log(msg) {
  	if(DEV){
			if (typeof console !== 'undefined' && console.log) {
          console.log("[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg);
      }
    }
}

function getHomeSections() {
    try {
        return JSON.stringify([
            { "slug": "/new/", "title": "Hàng Mới", "type": "Grid" }
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
            resultUrl += "/" + page + "/";
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
                // https://ppp.porn/search/girl/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&q=girl&category_ids=&sort_by=&from_videos=7&from_albums=7&_=1785072383129
                var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                    .replace(/:,/g, ':');
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                var url = BASEURL + "/search/" + encodeURIComponent(keyword) + "/?q=" + encodeURIComponent(keyword) + "&from_videos="+page+"&from_albums=" + page;
                log("getUrlSearch[url]: \n" + url);
                return url
                
            }
        
        var url = BASEURL + "/search/" + encodeURIComponent(keyword) + "/";
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
class[^>]+card-video[\\s\\S]*?
href="([^"']+)"[\\s\\S]*?
data-src=["']([^"']+)["'][^>]+
alt=["']([^"']+)["']
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

        var rmatch = html.match(/link\s+rel="canonical"\s+href=["']([^"]+)["']/i);
        if (rmatch && rmatch[1]) { lurl = rmatch[1] }

        rmatch = html.match(/property=["']og:image["']\s+content=["']([^"]+)["']/i);
        if (rmatch && rmatch[1]) { limg = rmatch[1]; }

        rmatch = html.match(/<title>([^<]+)/i);
        if (rmatch && rmatch[1]) { lname = rmatch[1]; }

        rmatch = html.match(/meta\s+property=["']og:description["']\s+content=["']([^"]+)["']/i);
        if (rmatch && rmatch[1]) { ldes = rmatch[1]; }

        var $stream = "";
        var epi = [];
        var $linkURL = html.match(/var\sstream[^"']+["']([^"']+)["']/i);
        if ($linkURL && $linkURL[1]) {
            $stream = $linkURL[1];
            epi.push({ id: $stream + "#video.m3u8", name: "Xem Ngay 1", slug: $url });
        }
        
        return JSON.stringify({
            id: $url,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
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
        });
    } catch (e) {
        log("parseMovieDetail[err]:\n " + e);
    }
}

function parseDetailResponse(html, url) {
    try {
        var $stream = url;
        var $linkURL = html.match(/var\sstream[^"']+["']([^"']+)["']/i);
        if ($linkURL && $linkURL[1]) {
            $stream = $linkURL[1];
        }
        return JSON.stringify({
            "url": $stream,
            "isEmbed": false,
            "mimeType": "video/mp4",
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
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        log("parseCategoriesResponse[err]:\n " + e);
    }
}

function parseCountriesResponse(html) {
    try {
        return "[]";
    } catch (e) {
        log("parseCountriesResponse[err]:\n " + e);
    }
}

function parseYearsResponse(html) {
    try {
        return "[]";
    } catch (e) {
        log("parseYearsResponse[err]:\n " + e);
    }
}

function getLISTmenu() {
    try {
        return `
/categories/china/@@Trung Quốc
/categories/taiwan/@@Đài Loan
/categories/japan/@@Nhật Bản
/categories/se-asia/@@Đông Nam Á
/categories/korea/@@Hàn Quốc
/categories/hongkong/@@Hongkong
/categories/cosplay/@@Cosplay
/categories/streamer/@@Stream
/categories/bdsm/@@BDSM
/categories/drama/@@Drama
/categories/threesome/@@Chơi Ba
/categories/91-tanhua/@@Điện Ảnh
/categories/released/@@Công Khai
/categories/uncensored/@@Không Che
/categories/exhibitionists/@@Lộ Liễu
`;
    } catch (e) {
        log("getLISTmenu[err]:\n " + e);
    }
}

function buildMenu(listurl) {
    try {
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
    } catch (e) {
        log("buildMenu[err]:\n " + e);
    }
}

