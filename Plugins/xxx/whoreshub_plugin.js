var BASEURL = "https://www.whoreshub.com"; 
// https://www.whoreshub.com/categories/4k-porn/
function getManifest() {
    return JSON.stringify({
        "id": "whoreshub",
        "name": "XXX Whoreshub 4K",
        "description": "XXX 4K",
        "version": "1.0.2",
        "info": "Phim chất lượng cao, nên đôi khi tải hởi chậm. Bạn chờ tí nhé.",
        "baseUrl": "https://www.whoreshub.com",
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/cnporn.jpg",
        "isEnabled": true,
        "layoutType": "HORIZONTAL",
        "type": "VIDEO",
     	 	"isAdult": true,
        "playerTpye": "exoplayer"
    })
};

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[gamomephim] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[gamomephim] " + msg);
    }
}

function getHomeSections() {
    return JSON.stringify([
      {"slug": "/categories/4k-porn/","title": "Phim 4K","type": "Horizontal"},
       {"slug": "/top-rated/","title": "Ưa Thích","type": "Horizontal"},
        {"slug": "/most-popular/","title": "Xem Nhiều","type": "Horizontal"},
        {"slug": "/latest-updates/","title": "Video Mới","type": "Grid"}
        
    ]);
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
// HELPER: CURSOR BASE64 ENCODE / DECODE
// =============================================================================
function getUrlList(slug, filtersJson) {
    log("urlList: " + slug);
    try {
        if (slug && slug.indexOf("http") > -1) {
            if (slug.indexOf("search") > -1) {
                if (filtersJson) {
                    var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
                    try {
                        var filters = JSON.parse(fixedJson);
                        var page = parseInt(filters.page) || 1;
                        if (page > 1) {
                            return slug + "?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&category_ids=&sort_by=&_=1784724639811&q=blacked&from_videos="+page+"&from_albums=" + page
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
            resultUrl += page + "/";
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
    return BASEURL + "/search/" + encodeURIComponent(keyword) + "/";
}
// https://www.whoreshub.com/search/blacked/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&category_ids=&sort_by=&_=1784724639811&q=blacked&from_videos=3&from_albums=3
// https://www.whoreshub.com/search/blacked/
// https://www.whoreshub.com/tags/threesome/
//var BASEURL = "https://www.whoreshub.com";
// JSON lỗi cú pháp (thiếu nháy kép) của bạn
//var filtersJson = '{page:11,category:[{"slug":"/movies?sort=year_desc&limit=24&category=18-plus","name":"Thiếu niên"}]}'; 
//var filtersJson = '{page:22}';
//console.log(getUrlList("https://www.whoreshub.com/search/blacked/", filtersJson));


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
        console.log("parseListResponse xử lý: " + $url)
        var items = [];
        var $doc = _$(html);
        $doc.find(".thumb").each(function() {
            var href = this.find(".item").attr("href");
            if (href.indexOf("http") == -1) {
                href = BASEURL + href;
            }
            var title = this.find("a").attr("title");
            var src = this.find("img").attr("data-src");

            if (src.indexOf("//") === 0) {
                src = "https:" + src;
            } else if (src.indexOf("http") === -1) {
                src = BASEURL + src;
            }

            var episode_current = ""
            var quality = this.find(".is-hd").text();
            if (href && href.indexOf("http") > -1 && href.indexOf("videos") > -1) {
                var cleanThumb = src.replace(/&amp;/g, '&');
                items.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "quality": quality,
                    "lang": "",
                    "episode_current": episode_current
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
        log("parseListResponse: " + e);
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

/*
var BASEURL = "https://narto-drama.com";
//var BASEAPI = "https://k8s.onflixcdn.com/api";
var htmlsource = $("#labHtmlEditorWrap #labHtmlTreeContainer .lab-dom-pure-text").html();
JSON.parse(parseListResponse(sourceHTML, BASEURL));
//var html = outerHTML;

*/



function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function attachRndToUrl(baseUrl) {
    if (!baseUrl) return '';
    
    // Tạo timestamp 13 chữ số tại thời điểm hiện tại
    const rnd = Date.now();
    
    // Đảm bảo URL kết thúc bằng '/' nếu chưa có (trước khi thêm query)
    let formattedUrl = baseUrl;
    if (!formattedUrl.includes('?') && !formattedUrl.endsWith('/')) {
        formattedUrl += '/';
    }

    // Nối tham số rnd vào URL
    const separator = formattedUrl.includes('?') ? '&' : '?';
    return `${formattedUrl}${separator}rnd=${rnd}`;
}

function parseScript(rawScript) {
    const result = {
        success: false,
        data: {},
        embedHtml: ''
    };

    // Kiểm tra đầu vào cơ bản
    if (!rawScript || typeof rawScript !== 'string') {
        return result;
    }

    try {
        // 1. Trích xuất hàm getEmbed nếu bạn cần dùng code iframe của họ
        const embedMatch = rawScript.match(/return\s+('(?:[^'\\]|\\.)*')/);
        if (embedMatch) {
            // Loại bỏ dấu nháy ở đầu/cuối chuỗi iframe được tìm thấy
            result.embedHtml = embedMatch[1].slice(1, -1);
        }

        // 2. Tìm phần nội dung bên trong dấu ngoặc nhọn của biến object (var xxxx = { ... })
        const objectContentMatch = rawScript.match(/var\s+\w+\s*=\s*\{([\s\S]*?)\};/);

        if (objectContentMatch) {
            const objectBody = objectContentMatch[1];

            // 3. Regex quét các cặp key: 'value' hoặc key: value (phòng khi họ bỏ dấu nháy cho số)
            // Group 1: Key, Group 2: Value dạng chuỗi có nháy, Group 3: Value không nháy (số/boolean)
            const pairRegex = /(\w+)\s*:\s*(?:'((?:[^'\\]|\\.)*)'|([^,\s}]+))/g;
            let match;

            while ((match = pairRegex.exec(objectBody)) !== null) {
                const key = match[1];
                let value = match[2] !== undefined ? match[2] : match[3];

                // Nếu là chuỗi, xử lý các ký tự bị escape (ví dụ \' đổi lại thành ')
                if (match[2] !== undefined) {
                    value = value.replace(/\\'/g, "'").replace(/\\"/g, '"');
                } else {
                    // Nếu là số hoặc boolean thuần (không nằm trong nháy) thì ép kiểu tương ứng
                    if (value === 'true') value = true;
                    else if (value === 'false') value = false;
                    else if (!isNaN(value)) value = Number(value);
                }

                result.data[key] = value;
            }

            // Đánh dấu thành công nếu lấy được dữ liệu
            if (Object.keys(result.data).length > 0) {
                result.success = true;
            }
        }
    } catch (error) {
        // Ghi nhận lỗi nội bộ ra console để debug nhưng KHÔNG làm sập script của bạn
        console.error("SafeParser Error:", error);
    }

    return result;
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

        rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) ldes = rmatch[1];
        var year = 2026;
        var extra = "";
        category = $doc.find("h4:content('Categories')").closest("ul").find("a").textAll(" - ");
        episode_current = $doc.find(".movie-sub").text();;
        var $objepi = "";
        var script = $doc.find("script:content('getEmbed\(')").html();
        if (!script) {
            script = $doc.find("script:content('flashvars')").html();
        }
        var $dataVD = parseScript(script);
        var servers = [];
        var episodes = [];
        var $rnd = $dataVD.data.rnd;
        if ($dataVD.data.video_alt_url3) {
            var link = $dataVD.data.video_alt_url3.replace(/[\s\S]*?http/i, "http");
            episodes.push({
                id: attachRndToUrl(link) + "#.m3u8",
                name: "HQ: " + $dataVD.data.video_alt_url3_text,
                slug: "hd3"
            })
        }
        if ($dataVD.data.video_alt_url2) {
            var link = $dataVD.data.video_alt_url2.replace(/[\s\S]*?http/i, "http");
            episodes.push({
                id: attachRndToUrl(link) + "#.m3u8",
                name: "HQ: " + $dataVD.data.video_alt_url2_text,
                slug: "hd2"
            })
        }
        if ($dataVD.data.video_alt_url) {
            var link = $dataVD.data.video_alt_url.replace(/[\s\S]*?http/i, "http");
            episodes.push({
                id: attachRndToUrl(link) + "#.m3u8",
                name: "HQ: " + $dataVD.data.video_alt_url_text,
                slug: "hd3"
            })
        }
        if ($dataVD.data.video_url) {
            var link = $dataVD.data.video_url.replace(/[\s\S]*?http/i, "http");
            episodes.push({
                id: attachRndToUrl(link) + "#.m3u8",
                name: "HQ: " + $dataVD.data.video_url_text,
                slug: "hd4"
            })
        }
        servers.push({
            name: "Server",
            episodes: episodes
        })
        // Tạo chuỗi mô tả ẩn JSON servers giống hệt tác giả
        // === BƯỚC 5: TRẢ VỀ KẾT QUẢ ĐỒNG NHẤT ID ===
        return JSON.stringify({
            id: id, // BẮT BUỘC: ID phải là slug rút gọn của bộ phim để cả 2 lần fetch khớp nhau
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
            year: year,
            rating: 8.5,
            status: status,
            category: category,
            episode_current: episode_current,
            servers: servers, // Lần 1 (trang chi tiết) sẽ là []. Lần 2 (khi chạy qua extra) sẽ có đầy đủ tập
            duration: lduran || "",
            casts: lactor || "",
            director: ldirec || "",
            extra: extra // Lần 2 (trang xem phim) extra sẽ rỗng để dừng chu kỳ tải ngầm
        });

    } catch (e) {
        log("parseMovieDetail:" + e)
        return JSON.stringify({
            id: slug || url || "error",
            title: "error",
            servers: []
        });
    }
}
/*
// https://edge.narto-drama.com/e/rs/detail/watch/tro-choi-cong-so/9/refresh-source?lang=vi-VN


BASEURL = "https://phimnganhdc.com";
var html = sourceHTML;
var $url = "https://phimnganhdc.com/hot-babe-remy-cheats-with-bbc/";
JSON.parse(parseMovieDetail(outerHTML, $url));
// https://edge.narto-drama.com/e/rs/detail/watch/tro-choi-cong-so/check-new-episodes?_t=1784684483895&_=1784684480875
*/

function parseDetailResponse(html, url) {
    try {
        return JSON.stringify({
            "url": "",
            "isEmbed": false, // Chuyển về false để ưu tiên ExoPlayer native
            "mimeType": "application/x-mpegURL", // Dùng biến mimeType đã xử lý
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
    } catch (e) {
        log("stream error: " + e);
        return JSON.stringify({
            "url": "",
            "headers": {}
        });
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

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// https://www.whoreshub.com/tags/solo/

function getLISTmenu() {
    return `[{\"link\":\"/categories/ai/\",\"name\":\"Ai\"},{\"link\":\"/categories/4k-porn/\",\"name\":\"4K Porn\"},{\"link\":\"/tags/solo/\",\"name\":\"solo\"},{\"link\":\"/tags/hardcore/\",\"name\":\"hardcore\"},{\"link\":\"/tags/lesbian/\",\"name\":\"lesbian\"},{\"link\":\"/tags/teen/\",\"name\":\"teen\"},{\"link\":\"/tags/9bf0cd6bf76106c1d87b93939cf483d3/\",\"name\":\"-\"},{\"link\":\"/tags/webcam/\",\"name\":\"webcam\"},{\"link\":\"/tags/blowjob/\",\"name\":\"blowjob\"},{\"link\":\"/tags/bigass/\",\"name\":\"bigass\"},{\"link\":\"/tags/fetish/\",\"name\":\"fetish\"},{\"link\":\"/tags/sex2/\",\"name\":\"sex\"},{\"link\":\"/tags/fuck/\",\"name\":\"fuck\"},{\"link\":\"/tags/missionary/\",\"name\":\"missionary\"},{\"link\":\"/tags/deepthroat/\",\"name\":\"deepthroat\"},{\"link\":\"/tags/blonde/\",\"name\":\"blonde\"},{\"link\":\"/tags/threesome/\",\"name\":\"threesome\"},{\"link\":\"/tags/pov/\",\"name\":\"pov\"},{\"link\":\"/tags/small-tits/\",\"name\":\"small tits\"},{\"link\":\"/tags/big-tits/\",\"name\":\"big tits\"},{\"link\":\"/tags/pawg/\",\"name\":\"pawg\"},{\"link\":\"/tags/fingering/\",\"name\":\"fingering\"},{\"link\":\"/tags/babe/\",\"name\":\"babe\"},{\"link\":\"/tags/facial/\",\"name\":\"facial\"},{\"link\":\"/tags/big-ass/\",\"name\":\"big ass\"},{\"link\":\"/tags/vr/\",\"name\":\"vr\"},{\"link\":\"/tags/porn/\",\"name\":\"porn\"},{\"link\":\"/tags/pussy/\",\"name\":\"pussy\"},{\"link\":\"/tags/cumshot/\",\"name\":\"cumshot\"},{\"link\":\"/tags/shemale/\",\"name\":\"shemale\"},{\"link\":\"/tags/brunette/\",\"name\":\"brunette\"},{\"link\":\"/tags/latin/\",\"name\":\"latin\"},{\"link\":\"/tags/busty/\",\"name\":\"busty\"},{\"link\":\"/tags/creampie/\",\"name\":\"creampie\"},{\"link\":\"/tags/big-cock/\",\"name\":\"big cock\"},{\"link\":\"/tags/bbc2/\",\"name\":\"bbc\"},{\"link\":\"/tags/milf/\",\"name\":\"milf\"},{\"link\":\"/tags/latina/\",\"name\":\"latina\"},{\"link\":\"/tags/asian/\",\"name\":\"asian\"},{\"link\":\"/tags/ass/\",\"name\":\"ass\"},{\"link\":\"/tags/mature/\",\"name\":\"mature\"},{\"link\":\"/tags/anal/\",\"name\":\"anal\"},{\"link\":\"/tags/doggystyle/\",\"name\":\"doggystyle\"},{\"link\":\"/tags/petite/\",\"name\":\"petite\"},{\"link\":\"/tags/masturbation/\",\"name\":\"masturbation\"},{\"link\":\"/tags/xxx/\",\"name\":\"xxx\"},{\"link\":\"/tags/interracial/\",\"name\":\"interracial\"},{\"link\":\"/tags/amateur/\",\"name\":\"amateur\"},{\"link\":\"/tags/big-dick/\",\"name\":\"big dick\"},{\"link\":\"/tags/lingerie/\",\"name\":\"lingerie\"},{\"link\":\"/tags/oral/\",\"name\":\"oral\"},{\"link\":\"/tags/handjob/\",\"name\":\"handjob\"},{\"link\":\"/tags/\",\"name\":\"Show All Tags\"}]`  
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
