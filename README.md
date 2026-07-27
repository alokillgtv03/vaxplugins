

Bạn giúp mình bọc try catch tất cả hàm và log ra lỗi nhé. cú phảp log("Tên Hàm[err]:\n " + lỗi), còn hàm nào có dữ liệu là url thì log ra với cú pháp log("Tên Hàm[url]: \n" + url)


DEV = "false"
function log(msg) {
  	if(DEV){
			if (typeof console !== 'undefined' && console.log) {
          console.log("[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg);
      }
    }
}



// https://yanhh3d.ac/moi-cap-nhat?page=2
function getHomeSections() {
    var listurl = `
[{"link":"/latest-updates/","name":"Hàng Mới"}]
`;
    var menulist = buildMenu(listurl,true);
    return JSON.stringify(menulist);
}

function getPrimaryCategories() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

// ĐÃ SỬA: Lỗi cú pháp khai báo biến trong JSON.stringify
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
                            return slug + page + "/";
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
    return BASEURL + "/vi/search/" + encodeURIComponent(keyword) + "/relevance/";
}

// https://www.1porn.tv/vi/categories/4k/5/
// https://www.1porn.tv/vi/search/blacked/relevance/3/

//var BASEURL = "https://motchille.cx";
//var filtersJson = '{page:11,category:[{"slug":"/movies?sort=year_desc&limit=24&category=18-plus","name":"Thiếu niên"}]}'; 
//var filtersJson = '{page:22}';
//getUrlSearch("naruto", filtersJson)
//console.log(getUrlList("https://www.1porn.tv/vi/search/blacked/relevance/", filtersJson));

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + "/" + slug;
}

function getUrlCategories() {
    return BASEURL;
}

function getUrlCountries() {
    return "";
}

function getUrlYears() {
    return "";
}

// =============================================================================
// PARSERS
// =============================================================================
function parseListResponse(html, $url) {
	try {
		var items = [];
		_$(html).find(".item").find("a").each(function() {
			var year = "";
			var lang = "";
			var current = "";
			var href = this.attr("href");
			if (href.indexOf("http") == -1) {
				href = BASEURL + href;
			}
			var quality = this.find('span[class*="is-"]').text();
			var title = this.find("img").attr("alt");
			var src = this.find("img").attr("data-original");
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
					"quality": quality,
					"lang": lang,
					"episode_current": current
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
// https://motchille.cx/danh-sach/4
// https://motchille.cx/the-loai/kinh-di/4
// https://motchille.cx/search/4?q=girl
//var BASEURL = "https://www.xasiat.com";
//var htmlsource = $("#labHtmlEditorWrap #labHtmlTreeContainer .lab-dom-pure-text").html();
//JSON.parse(parseListResponse(outerHTML, BASEURL));
//var html = outerHTML;


function parseSearchResponse(html) {
    return parseListResponse(html);
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
    cachedMovieDetailId = "";
	try {
		log(url);
		var id = "";
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
		var script = _$(html).find("script:content('video_categories')").html();
		var $dataVD = parseScript(script);
        if($dataVD.success == false){
            	return JSON.stringify({
                    id: cachedMovieDetailId || url || "error",
                    title: "Đây là video riêng tư",
                    description: "Video riêng tư nên bi cấm xem đó bạn ơi. Kiếm video khác nhé.",
                    posterUrl: "",
										backdropUrl: "",
                    servers: []
                });
        }
		var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html) ||
			/<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(html);
		id = idMatch ? idMatch[1] : (url || "");
		
		// Lưu ID vào bộ nhớ tạm toàn cục để Lượt 2 lấy ra đối chiếu
		cachedMovieDetailId = id;
		lname = $dataVD.data.video_title;
		limg = $dataVD.data.preview_url;
		ldes = $dataVD.data.video_tags;
		category = $dataVD.data.video_categories;
		lactor = $dataVD.data.video_models;
		var episodes = [];
		var servers = [];
		if ($dataVD.data.video_alt_url3) {
			var link = $dataVD.data.video_alt_url3;
			episodes.push({
				id: link.replace(/[\s\S]*?http/i, "http") + "#.m3u8",
				name: "Độ Phân Giải " + $dataVD.data.video_alt_url3_text,
				slug: "hd3"
			})
		}
		if ($dataVD.data.video_alt_url2) {
			var link = $dataVD.data.video_alt_url2;
			episodes.push({
				id: link.replace(/[\s\S]*?http/i, "http") + "#.m3u8",
				name: "Độ Phân Giải " + $dataVD.data.video_alt_url2_text,
				slug: "hd2"
			})
		}
		if ($dataVD.data.video_alt_url) {
			var link = $dataVD.data.video_alt_url;
			episodes.push({
				id: link.replace(/[\s\S]*?http/i, "http") + "#.m3u8",
				name: "Độ Phân Giải Cao",
				slug: "hd3"
			})
		}
		if ($dataVD.data.video_url) {
			var link = $dataVD.data.video_url;
			episodes.push({
				id: link.replace(/[\s\S]*?http/i, "http") + "#.m3u8",
				name: "Độ Phân Giải Tháp",
				slug: "hd4"
			})
		}
		servers.push({ name: "Server", episodes: episodes })
		log(JSON.stringify(servers))
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
			id: cachedMovieDetailId || url || "error",
			title: "error",
			servers: []
		});
	}
}




//BASEURL = "https://phimnganhdc.com";
//var html = outerHTML;
//var $url = "https://phimnganhdc.com/hot-babe-remy-cheats-with-bbc/";
//JSON.parse(parseMovieDetail(outerHTML,$url));


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

DEV = "false"
function log(msg) {
    try {
        if(DEV){
            if (typeof console !== 'undefined' && console.log) {
                console.log("[" + BASEURL.replace(/^(https?:\/\/)?(www\.)?/, "") + "]: " + msg);
            }
        }
    } catch (e) {
        // Dự phòng khi log bị lỗi
    }
}

// https://yanhh3d.ac/moi-cap-nhat?page=2
function getHomeSections() {
    try {
        var listurl = `\n/categories/4k/@@Video Mới@@true\n`;
        var menulist = buildMenu(listurl);
        log(menulist);
        return JSON.stringify(menulist);
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

// ĐÃ SỬA: Lỗi cú pháp khai báo biến trong JSON.stringify
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

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        // 1. Kiểm tra nếu slug là link tuyệt đối (chứa http)
        if (slug && slug.indexOf("http") > -1) {
            return slug;
        }
        
        var page = 1;
        var path = slug || "";
        
        // 2. Xử lý an toàn filtersJson cho các trường hợp link tương đối (không chứa http)
        if (filtersJson) {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            
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
                // Coi như bỏ qua nếu lỗi JSON
            }
        }
        
        // 3. Nối chuỗi URL kết quả cho link tương đối
        let resultUrl = BASEURL;
        if (path) {
            resultUrl += path;
        }
        if (page > 1) {
            resultUrl += page + "/";
        }
        
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
        
    } catch (e) {
        log("getUrlList[err]:\n " + e);
        if (slug && slug.indexOf("http") > -1) {
            return slug;
        }
        let fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        return BASEURL + "/search/" + encodeURIComponent(keyword) + "/?videos_per_page=200";
    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
    }
}

function getUrlDetail(slug) {
    try {
        if (!slug) return "";
        if (slug.indexOf('http') === 0) return slug;
        return BASEURL + "/" + slug;
    } catch (e) {
        log("getUrlDetail[err]:\n " + e);
    }
}

function getUrlCategories() {
    try {
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
function parseListResponse(html, $url) {
    try {
        if ($url) {
            log("parseListResponse[url]: \n" + $url);
        }
        var items = [];
        _$(html).find(".col").find("a").each(function() {
            var year = "";
            var lang = "";
            var current = "";
            var href = this.attr("href");
            if (href.indexOf("http") == -1 && href.indexOf("videos") > -1) {
                href = BASEURL + href;
            }
            if (!href.match(/pimpbunny[\s\S]*?\/videos\//g)) {
                href = "";
            }
            var quality = "";
            var title = this.find("img").attr("alt");
            var src = this.find("img").attr("data-original");
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
                    "quality": quality,
                    "lang": lang,
                    "episode_current": current
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

function parseSearchResponse(html) {
    try {
        return parseListResponse(html);
    } catch (e) {
        log("parseSearchResponse[err]:\n " + e);
    }
}

function decodeKVSUrl(url) {
    try {
        log("decodeKVSUrl[url]: \n" + url);
        // Bản đồ hoán vị chuẩn xác 100% sau khi đối chiếu cả 3 chất lượng video
        const PERFECT_MAP = [
            29, 3, 1, 16, 22, 6, 23, 8,
            2, 15, 31, 25, 10, 0, 12, 11,
            17, 24, 21, 28, 19, 30, 26, 13,
            5, 14, 18, 20, 27, 9, 7, 4
        ];
        
        // Tách chuỗi hash 42 ký tự từ URL
        const hashRegex = /\/([a-f0-9]{42})\//i;
        const match = url.match(hashRegex);
        
        if (!match) {
            return "Không tìm thấy chuỗi mã hóa hợp lệ.";
        }
        
        const fullHash = match[1];
        const encodedPart = fullHash.substring(0, 32); // 32 ký tự cần xếp lại
        const fixedPart = fullHash.substring(32); // 10 ký tự cuối giữ nguyên
        
        // Tiến hành hoán vị ký tự theo đúng sơ đồ hệ thống
        let decodedPart = "";
        for (let i = 0; i < 32; i++) {
            decodedPart += encodedPart[PERFECT_MAP[i]];
        }
        
        // Ghép lại thành chuỗi hash mới đã giải mã
        const newHash = decodedPart + fixedPart;
        let decodedUrl = url.replace(fullHash, newHash);
        
        // Làm mới tham số ?rnd chống cache theo thời gian thực
        const rnd = Date.now();
        if (decodedUrl.includes('#')) {
            decodedUrl = decodedUrl.replace('#', `?rnd=${rnd}#`);
        } else if (/\?rnd=\d+/.test(decodedUrl)) {
            decodedUrl = decodedUrl.replace(/\?rnd=\d+/, `?rnd=${rnd}`);
        } else {
            decodedUrl += `?rnd=${rnd}`;
        }
        
        return decodedUrl;
    } catch (e) {
        log("decodeKVSUrl[err]:\n " + e);
    }
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
        log("parseScript[err]:\n " + error);
    }
    
    return result;
}

function parseMovieDetail(html, url) {
    try {
        if (url) {
            log("parseMovieDetail[url]: \n" + url);
        }
        var id = "";
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
        var script = _$(html).find("script:content('video_categories')").html();
        var $dataVD = parseScript(script);
        var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html) ||
            /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(html);
        id = idMatch ? idMatch[1] : (url || "");
        
        // Lưu ID vào bộ nhớ tạm toàn cục để Lượt 2 lấy ra đối chiếu
        cachedMovieDetailId = id;
        lname = $dataVD.data.video_title;
        limg = $dataVD.data.preview_url;
        ldes = $dataVD.data.video_tags;
        category = $dataVD.data.video_categories;
        lactor = $dataVD.data.video_models;
        var episodes = [];
        var servers = [];
        if ($dataVD.data.video_alt_url3) {
            var link = decodeKVSUrl($dataVD.data.video_alt_url3);
            episodes.push({
                id: link.replace(/[\s\S]*?http/i, "http") + "#.m3u8",
                name: "Độ Phân Giải " + $dataVD.data.video_alt_url3_text,
                slug: "hd3"
            })
        }
        if ($dataVD.data.video_alt_url2) {
            var link = decodeKVSUrl($dataVD.data.video_alt_url2);
            episodes.push({
                id: link.replace(/[\s\S]*?http/i, "http") + "#.m3u8",
                name: "Độ Phân Giải " + $dataVD.data.video_alt_url2_text,
                slug: "hd2"
            })
        }
        if ($dataVD.data.video_alt_url) {
            var link = decodeKVSUrl($dataVD.data.video_alt_url);
            episodes.push({
                id: link.replace(/[\s\S]*?http/i, "http") + "#.m3u8",
                name: "Độ Phân Giải " + $dataVD.data.video_alt_url_text,
                slug: "hd3"
            })
        }
        if ($dataVD.data.video_url) {
            var link = decodeKVSUrl($dataVD.data.video_url);
            episodes.push({
                id: link.replace(/[\s\S]*?http/i, "http") + "#.m3u8",
                name: "Độ Phân Giải " + $dataVD.data.video_url_text,
                slug: "hd4"
            })
        }
        servers.push({ name: "Server", episodes: episodes })

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
        log("parseMovieDetail[err]:\n " + e);
        return JSON.stringify({
            id: typeof cachedMovieDetailId !== 'undefined' ? cachedMovieDetailId : (url || "error"),
            title: "error",
            servers: []
        });
    }
}

function parseDetailResponse(html, url) {
    try {
        if (url) {
            log("parseDetailResponse[url]: \n" + url);
        }
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
        log("parseDetailResponse[err]:\n " + e);
        return JSON.stringify({ "url": "", "headers": {} });
    }
}


function runJS(){
  function beginJS(){
    return ` Code `
  }
  function getLinkJS(){
    return ` Code `
  }
  function mainJS(){
    return ` Code `
  }
  retun ` Nối 3 hàm chứa Code bên trên lại và ko gây lỗi hay sai cú pháp `
}