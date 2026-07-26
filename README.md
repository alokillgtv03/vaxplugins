function log(msg) {
  	if(DEV){
			if (typeof console !== 'undefined' && console.log) {
          console.log("[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg);
      }
    }
}


Bạn giúp mình bọc try catch tất cả hàm và log ra lỗi nhé, loại bỏ hàng log phía trên nha, ko tính nó vào. cú phảp log("Tên Hàm[err]:\n " + lỗi), còn hàm nào có dữ liệu là url thì log ra với cú pháp log("Tên Hàm[url]: \n" + url)




function getHomeSections() {
    var listurl = '[{\"link\":\"/the-loai/phim-cap-nhat-1\",\"name\":\"Phim Mới\"}]';
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
    var menulist = buildMenu(listurl,"filter");
    return JSON.stringify({
        category: menulist
    });
}

// =============================================================================
// HELPER: CURSOR BASE64 ENCODE / DECODE
// =============================================================================
function decodeHTMLEntities(str) {
    if (!str) return '';
    return str.replace(/&#(\d+);|&#x([0-9a-fA-F]+);/g, (match, dec, hex) => {
        if (dec) {
            return String.fromCharCode(parseInt(dec, 10));
        }
        if (hex) {
            return String.fromCharCode(parseInt(hex, 16));
        }
        return match;
    });
}


function getUrlList(slug, filtersJson) {
    try {
        if (slug && slug.indexOf("http") > -1) {
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
          	resultUrl = resultUrl.replace(/(\d+)$/i,"");
            resultUrl += page;
        }
      	log("urlList: " + resultUrl)
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
    if (filtersJson) {
        var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
        try {
            var filters = JSON.parse(fixedJson);
            var page = parseInt(filters.page) || 1;
            if (page > 1) {
                return BASEURL + "/search?k=" + encodeURIComponent(keyword) + "&page=" + page;
            } else {
                return BASEURL + "/search?k=" + encodeURIComponent(keyword);
            }
        } catch (jsonErr) {
            return BASEURL + "/search?k=" + encodeURIComponent(keyword);
        }
    }
    return BASEURL + "/search?k=" + encodeURIComponent(keyword);
}

// https://phimfun.net/tuyen-tap-3
// https://phimfun.net/the-loai/phim-le-245
// https://phimfun.net/the-loai/chien-tranh-6
// https://phimfun.net/search?k=t%C3%B4i
// https://phimfun.net/filter?filmForm=440&category=393&country=&sort=&release=
//var BASEURL = "https://phimfun.net";
//var filtersJson = '{page:2}';
//console.log(getUrlList("https://phimfun.net/search?k=t%C3%B4i", filtersJson));
//console.log(getUrlSearch("the boy",filtersJson))


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

function fixHref(href) {
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
}


function parseListResponse(html, $url) {
  	log("parseListResponse: " + $url)
    try {
      	var quality = "";
        var items = [];
        _$(html).find(".MovieList").find("li").each(function() {
            var href = this.find("a").attr("href");
            href = fixHref(href);
          	href = href.replace("/phim/","/xem-phim/");
            var title = this.find("img").attr("alt");
          	title =  decodeHTMLEntities(title)
            var src = this.find("img").attr("src");
          	if(src.indexOf("base64") > -1){
              src = this.find("img").attr("data-src");
            }
            src = fixHref(src)

            var episode_current = this.find(".mc__ep-badge").text().trim();
           // var quality = this.find(".Info").find("span.Qlty").text().trim();

            // Hàm kiểm tra URL có phải là link thật hay chứa mã JS rác
            function isValidMediaUrl(url) {
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
            }
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
var BASEURL = "https://animehay09.site/lich-su";
//var BASEAPI = "https://k8s.onflixcdn.com/api";
var htmlsource = $("#labHtmlEditorWrap #labHtmlTreeContainer .lab-dom-pure-text").html();
JSON.parse(parseListResponse(sourceHTML, BASEURL));
//var html = outerHTML;

*/



function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}
function parseMovieDetail(html, url) {
  	log("parseMovieDetail: " + url)
    try {
        // === BƯỚC 1: ĐỒNG NHẤT ID PHIM BẰNG REGEX META (Y hệt tác giả) ===
        var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html) ||
            /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(html);
        var id = idMatch ? idMatch[1] : (url || "");

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
        lname = _$(html).find("h1").text();
				lname =  decodeHTMLEntities(lname)
        var ldes = _$(html).find("h2:content('Thông tin về phim')").next().text();
      	ldes =  decodeHTMLEntities(ldes)
        var year = 2026;
        var extra = "";

        var rawText = _$(html).find(".Date").text();

        // 1. Dùng Regex lọc chính xác 4 chữ số năm (dạng 19xx hoặc 20xx)
        var match = rawText.match(/\b(19|20)\d{2}\b/);

        if (match) {
            // 2. Ép kiểu về Số Nguyên bằng parseInt với cơ số 10
            year = parseInt(match[0], 10);
        }

        // 3. Chốt chặn an toàn: Nếu parse thất bại (NaN), trả về năm mặc định
        if (isNaN(year)) {
            year = 2026;
        }
        status = _$(html).find(".aim-hero__meta").find(".aim-status--airing").text();

        var categoryResult = [];
        _$(html).find(".Description").find(".Genre").find("a").each(function() {
            var link = this.attr("href") || this.find("a").attr("href");
            var name = this.text().replace(/\s+/g, ' ').trim();
            name =  decodeHTMLEntities(name);

            if (name && link) {
                var slug = typeof getSlug === 'function' ? getSlug(link) : link;
                categoryResult.push("[" + name + "](" + slug + ")");
            }
        });

        // THÊM DÒNG NÀY: Chuyển mảng thành Chuỗi nối nhau bằng dấu phẩy
        category = categoryResult.join(", ");
        var actorResult = [];
        _$(html).find(".Description").find(".Cast").find("a").each(function() {
            var link = this.attr("href") || this.find("a").attr("href");
            var name = this.text().replace(/\s+/g, ' ').trim();
            name =  decodeHTMLEntities(name);

            if (name && link) {
                var slug = typeof getSlug === 'function' ? getSlug(link) : link;
                actorResult.push("[" + name + "](" + slug + ")");
            }
        });

        // THÊM DÒNG NÀY: Chuyển mảng thành Chuỗi nối nhau bằng dấu phẩy
        lactor = actorResult.join(", ");


        quality = _$(html).find("span.Time").text();
        episode_current = _$(html).find(".aim-hero__meta").find("span:last").text();
        rating = _$(html).find(".post-ratings").text();
        rating = parseInt(rating, 10);
        var servers = [];
        stastus = 0;
        numSV = 0;
        $listSV = _$(html).find(".SeasonBx:content('Danh sách máy chủ')").find("a").each(function() {
            numSV++;
            var nameSV = "Server " + numSV;
            var items = [];
            _$(html).find(".SeasonBx:content('Danh sách tập')").find("#halim-list-server").find("a").each(function() {
                var link = this.attr("href");
                link = fixHref(link);
                if(numSV > 1){
                    link = link + "?sv"+numSV+"=true";
                }
                var name = this.attr("title");
                items.push({
                    id: link,
                    name: name,
                    slug: name.replace(/[\s\S]*?(\d+)/, "tap-$1")
                })
                stastus++;
            });
            servers.push({
                name: nameSV,
                episodes: items
            })
            servers = sortEpisodesByName(servers);
        })
        episode_current = "Đang có: " + status;
				log("servers: " + JSON.stringify(servers))
        // === BƯỚC 5: TRẢ VỀ KẾT QUẢ ĐỒNG NHẤT ID ===
        return JSON.stringify({
            id: id, // BẮT BUỘC: ID phải là slug rút gọn của bộ phim để cả 2 lần fetch khớp nhau
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


BASEURL = "https://phimfun.net";
var html = sourceHTML;
var $url = "https://animehay09.site/thong-tin-phim/tenkou-saki-no-seiso-karen-na-bishoujo-ga-4780.html";
JSON.parse(parseMovieDetail(sourceHTML, $url));
// https://edge.narto-drama.com/e/rs/detail/watch/tro-choi-cong-so/check-new-episodes?_t=1784684483895&_=1784684480875
*/


function sortEpisodesByName(data) {
    if (!Array.isArray(data)) return data;

    data.forEach(function(server) {
        if (server.episodes && Array.isArray(server.episodes)) {
            server.episodes.sort(function(a, b) {
                var nameA = a.name || '';
                var nameB = b.name || '';

                // Bắt chuỗi số đầu tiên xuất hiện trong tên (hỗ trợ cả số thập phân như 2.5)
                var matchA = nameA.match(/\d+(\.\d+)?/);
                var matchB = nameB.match(/\d+(\.\d+)?/);

                var numA = matchA ? parseFloat(matchA[0]) : null;
                var numB = matchB ? parseFloat(matchB[0]) : null;

                // 1. Nếu cả 2 đều tìm thấy số -> so sánh theo giá trị số
                if (numA !== null && numB !== null) {
                    if (numA !== numB) {
                        return numA - numB;
                    }
                }

                // 2. Nếu 1 bên có số, 1 bên không -> ưu tiên item có số đứng trước
                if (numA !== null) return -1;
                if (numB !== null) return 1;

                // 3. Nếu cả 2 không có số (hoặc số bằng nhau) -> sắp xếp tự nhiên theo chuỗi
                return nameA.localeCompare(nameB, undefined, {
                    numeric: true,
                    sensitivity: 'base'
                });
            });
        }
    });

    return data;
}




function parseDetailResponse(html, url) {
    try {
        var dataSV = {};
        var $stream = _$(html).find("#iframeStream").attr("src");
        var servers = [];
        dataSV.stream = $stream;
      	dataSV.current = url;
        stastus = 0;
        numSV = 0;
        $listSV = _$(html).find(".SeasonBx:content('Danh sách máy chủ')").find("a").each(function() {
            numSV++;
            var nameSV = "Server " + numSV;
            var items = [];
            _$(html).find(".SeasonBx:content('Danh sách tập')").find("#halim-list-server").find("a").each(function() {
                var link = this.attr("href");
                link = fixHref(link);
                if (numSV > 1) {
                    link = link + "?sv" + numSV + "=true";
                }
                var name = this.attr("title");
                items.push({
                    id: link,
                    name: name,
                    slug: name.replace(/[\s\S]*?(\d+)/, "tap-$1")
                })
                stastus++;
            });
            servers.push({
                name: nameSV,
                episodes: items
            })
            servers = sortEpisodesByName(servers);
        })
        dataSV.servers = servers;
        var customJS = runJS(dataSV);
         return JSON.stringify({
            url: url,
            isEmbed: false,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": url,
                "Custom-Js": customJS
            },
            subtitles: []
        });
    } catch (e) {
        log("parseDetailResponse error: " + e.message);
        return JSON.stringify({
            url: "",
            isEmbed: false,
            headers: {},
            subtitles: []
        });
    }
}