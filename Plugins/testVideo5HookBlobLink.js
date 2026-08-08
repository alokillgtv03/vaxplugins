// =============================================================================
// VAAPP Plugin - Crophim Pro (Đồng bộ cấu trúc 100% theo chuẩn RophimFake)
// Tên file bắt buộc khi lưu: crophim_plugin.js
// =============================================================================
BASEURL = "https://ophim1.com";
BASEAPI = "https://ophim1.com/v1/api";
BASECDN = "https://ophim1.com/uploads/movies/";
LISTURL = `
https://www.viduki.net/
https://www.viduki.net/1/movie/1368337?autoPlay=true
`;
function getManifest() {
  return JSON.stringify({
    id: "testvideo3",
    name: "Test EMBED TO Exoplayer",
    description: "Nguồn xem phim Online ổn định",
    version: "1.5.2",
    baseUrl: "https://ophim1.com",
    iconUrl:
      "https://crimescenesolutions.co.za/wp-content/uploads/2026/04/phimhayok-io-fav.jpg",
    isEnabled: true,
    debug: true,
    type: "MOVIE",
    adblock: false,
    playerType: "embed",
  });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-moi', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'Shows', slug: 'tv-shows' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' },
        { name: 'Phim vietsub', slug: 'phim-vietsub' },
        { name: 'Phim thuyết minh', slug: 'phim-thuyet-minh' },
        { name: 'Phim lồng tiếng', slug: 'phim-long-tien' },
        { name: 'Phim bộ đang chiếu', slug: 'phim-bo-dang-chieu' },
        { name: 'Phim bộ đã hoàn thành', slug: 'phim-bo-hoan-thanh' },
        { name: 'Phim sắp chiếu', slug: 'phim-sap-chieu' },
        { name: 'Subteam', slug: 'subteam' },
        { name: 'Phim chiếu rạp', slug: 'phim-chieu-rap' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'update' },
            { name: 'Năm xuất bản', value: 'year' },
            { name: 'Lượt xem', value: 'view' }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var limit = filters.limit || 24;

        var baseUrl = BASEAPI;
        var finalPath = "";
        var mainLists = ['phim-le', 'phim-bo', 'hoat-hinh', 'tv-shows', 'phim-chieu-rap', 'phim-moi', 'sap-chieu'];

        if (mainLists.indexOf(slug) >= 0) {
            finalPath = "/danh-sach/" + slug;
        } else if (/^\d{4}$/.test(slug)) {
            finalPath = "/nam-phat-hanh/" + slug;
        } else if (filters.year) {
            finalPath = "/nam-phat-hanh/" + filters.year;
        } else if (filters.category) {
            if (filters.category.indexOf(',') > -1) {
                finalPath = "/danh-sach/" + filters.category;
            } else {
                finalPath = "/the-loai/" + filters.category;
            }
        } else if (filters.country) {
            finalPath = "/quoc-gia/" + filters.country;
        } else {
            finalPath = "/the-loai/" + slug;
        }

        var url = baseUrl + finalPath + "?page=" + page + "&limit=" + limit;

        if (filters.category && finalPath.indexOf(filters.category) === -1) {
            url += "&category=" + filters.category;
        }
        if (filters.country && finalPath.indexOf(filters.country) === -1) {
            url += "&country=" + filters.country;
        }
        if (filters.year && finalPath.indexOf(filters.year) === -1) {
            url += "&year=" + filters.year;
        }
        if (filters.sort) {
            url += "&sort_field=" + filters.sort;
        }

        return url;
    } catch (e) {
        return BASEAPI + "/danh-sach/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    return BASEAPI + "/tim-kiem?keyword=" + encodeURIComponent(keyword || "") + "&page=" + page;
}

function getUrlDetail(slug) {
    return BASEAPI + "/phim/" + slug;
}

function getUrlCategories() { return BASEAPI + "/the-loai"; }
function getUrlCountries() { return BASEAPI + "/quoc-gia"; }
function getUrlYears() { return BASEAPI + "/nam-phat-hanh"; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson, url) {
    try {
        console.log("parseListResponse: \n" + url);
        var response = JSON.parse(apiResponseJson);

        var root = (response && response.data) ? response.data : response;
        var items = (root && root.items) ? root.items : [];
        var params = (root && root.params) ? root.params : {};
        var pagination = (params && params.pagination) ? params.pagination : {};

        var movies = items.map(function (item) {
            if (!item) return null;
            return {
                id: item.slug || "",
                title: item.name || "",
                posterUrl: getImageUrl(item.thumb_url),
                backdropUrl: getImageUrl(item.poster_url),
                year: item.year || 0,
                quality: item.quality || "",
                episode_current: item.episode_current || "",
                lang: item.lang || ""
            };
        }).filter(Boolean);

        var totalItems = pagination.totalItems || 0;
        var itemsPerPage = pagination.totalItemsPerPage || 24;
        var totalPages = pagination.totalPages || Math.ceil(totalItems / itemsPerPage) || 1;

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: pagination.currentPage || 1,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: itemsPerPage
            }
        });
    } catch (error) {
        console.log("Error in parseListResponse: " + error);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(apiResponseJson, url) {
    return parseListResponse(apiResponseJson, url);
}

function parseMovieDetail(apiResponseJson) {
    try {
var listobj = LISTURL.trim().split("\n");
    var furl = "";
    var path = "";
    for (var $j = 0; $j < listobj.length; $j++) {
      furl = listobj[0];
      if ($j > 0) {
        path += listobj[$j] + "###";
      }
    }
    path = BASE64ENCODE(path.replace(/###$/, ""));
    if (furl.indexOf("?") > -1) {
      furl += "&split=" + path;
    } else {
      furl += "?split=" + path;
    }
      
        var response = JSON.parse(apiResponseJson);
        var movie = response.movie || (response.data && response.data.item) || response.item || {};
        var rawEpisodes = response.episodes || (response.data && response.data.item && response.data.item.episodes) || [];

        var servers = [];
        rawEpisodes.forEach(function (server) {
            if (!server) return;
            var episodes = [];
            if (server.server_data) {
                server.server_data.forEach(function (ep) {
                    if (!ep) return;
                    episodes.push({
                        id: furl,
                        name: ep.name || "",
                        slug: ep.slug || ""
                    });
                });
            }
            if (episodes.length > 0) {
                servers.push({ name: server.server_name || "SV", episodes: episodes });
            }
        });

        var rating = 0;
        if (movie.tmdb && movie.tmdb.vote_average) {
            rating = movie.tmdb.vote_average;
        } else if (movie.imdb && movie.imdb.vote_average) {
            rating = movie.imdb.vote_average;
        }

        var categories = (movie.category || []).map(function (c) { return c ? c.name : ""; }).filter(Boolean).join(", ");
        var countries = (movie.country || []).map(function (c) { return c ? c.name : ""; }).filter(Boolean).join(", ");
        var directors = (movie.director || []).join(", ");
        var actors = (movie.actor || []).join(", ");

        var tmdbId = movie.tmdb && movie.tmdb.id ? movie.tmdb.id : "";
        var tmdbSeason = movie.tmdb && movie.tmdb.season ? parseInt(movie.tmdb.season, 10) : 0;
        var tmdbType = movie.tmdb && movie.tmdb.type ? movie.tmdb.type : "";

        return JSON.stringify({
            id: movie.slug || "",
            title: movie.name || "",
            originName: movie.origin_name || "",
            posterUrl: getImageUrl(movie.thumb_url),
            backdropUrl: getImageUrl(movie.poster_url),
            description: (movie.content || "").replace(/<[^>]*>/g, ""),
            year: movie.year || 0,
            rating: rating,
            quality: movie.quality || "",
            servers: servers,
            episode_current: movie.episode_current || "",
            lang: movie.lang || "",
            category: categories,
            country: countries,
            director: directors,
            casts: actors,
            tmdbId: String(tmdbId),
            tmdbSeason: tmdbSeason || 0,
            tmdbType: tmdbType || ""
        });
    } catch (error) { return "null"; }
}


function parseDetailResponse(html, url) {
  console.log("parseDetailResponse [Tầng 1]: " + url); //console.log("parseDetailResponse [Raw]: " + html);
  try {
    var rawJS = checkRaw(runJS(), true);
    var result = getNextFetchStep(url);

    console.log("parseDetailResponse [Next URL]: " + result.nextUrl);
    console.log("parseDetailResponse [isEmbed]: " + result.isEmbed);
    if (result.isEmbed == true) {
      console.log("Gọi hàm embed với link: " + result.nextUrl);
      return JSON.stringify({
        url: result.nextUrl,
        isEmbed: result.isEmbed,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: getCleanReferer(url),
        },
      });
    }
    return JSON.stringify({
      url: result.nextUrl,
      isEmbed: result.isEmbed,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: getCleanReferer(url),
        "Custom-Js": rawJS,
      },
    });
  } catch (e) {
    console.log("[Lỗi parseDetailResponse]", e);
    return JSON.stringify({ url: "", isEmbed: false, headers: {} });
  }
}

function parseEmbedResponse(html, url) {
  console.log("parseEmbedResponse [Tầng tiếp theo]: " + url); //console.log("parseEmbedResponse [Raw]: " + html);
  try {
    var rawJS = checkRaw(runJS(), true);
    var result = getNextFetchStep(url);

    console.log("parseEmbedResponse [Next URL]: " + result.nextUrl);
    console.log("parseEmbedResponse [isEmbed]: " + result.isEmbed);

    return JSON.stringify({
      url: result.nextUrl,
      isEmbed: result.isEmbed, // Tự động trả về false khi đã bóc tới tầng cuối!
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: getCleanReferer(url),
        "Block-Ads": false,
        "Block-Css": "",
        "Custom-Js": rawJS,
      },
    });
  } catch (e) {
    console.log("[Lỗi parseEmbedResponse]", e);
    return JSON.stringify({ url: "", isEmbed: false, headers: {} });
  }
}
/**
 * 🚀 HÀM WATERFALL TỪNG BƯỚC (STEP-BY-STEP)
 * Chỉ bóc tách ĐÚNG 1 TẦNG fetchUrl tiếp theo để App Fetch tiếp.
 */
function appendParamWithRegex(url, myParam) {
  // Pattern kiểm tra xem URL đã chứa dấu '?' chưa
  // (Bỏ qua trường hợp dấu '?' nằm trong phần anchor # nếu có)
  const hasQuery = /\?/.test(url);
  // Nếu đã có '?' thì nối thêm '&', chưa có thì nối '?'
  return hasQuery ? `${url}&${myParam}` : `${url}?${myParam}`;
}
function BASE64DECODE(base64String) {
  try {
    if (!base64String) return "";

    // 1. Dọn dẹp chuỗi & xử lý nếu App tự động mã hóa URL (ví dụ: %2B, %2F)
    var str = decodeURIComponent(base64String.trim());

    // Chuyển URL-safe base64 về base64 chuẩn
    str = str.replace(/-/g, "+").replace(/_/g, "/");

    // Bảng ký tự Base64
    var chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = [];
    var buffer = 0,
      bits = 0;

    // 2. Decode Base64 thành Mảng Byte (Uint8Array)
    for (var i = 0; i < str.length; i++) {
      var char = str.charAt(i);
      if (char === "=") break; // Bỏ qua padding
      var index = chars.indexOf(char);
      if (index === -1) continue; // Bỏ qua ký tự không hợp lệ

      buffer = (buffer << 6) | index;
      bits += 6;

      if (bits >= 8) {
        bits -= 8;
        output.push((buffer >> bits) & 0xff);
      }
    }

    // 3. Decode UTF-8 từ mảng Byte ra String (không dùng TextDecoder)
    var result = "";
    var j = 0;
    while (j < output.length) {
      var c = output[j++];
      if (c < 128) {
        result += String.fromCharCode(c);
      } else if (c > 191 && c < 224) {
        var c2 = output[j++];
        result += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
      } else if (c > 223 && c < 240) {
        var c2 = output[j++];
        var c3 = output[j++];
        result += String.fromCharCode(
          ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63),
        );
      } else if (c >= 240) {
        var c2 = output[j++];
        var c3 = output[j++];
        var c4 = output[j++];
        var u =
          (((c & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) -
          0x10000;
        result += String.fromCharCode(0xd800 + (u >> 10), 0xdc00 + (u & 0x3ff));
      }
    }

    return result;
  } catch (e) {
    console.log("[BASE64DECODE Error]:", e.message || e);
    return "";
  }
}

function BASE64ENCODE(str) {
  try {
    if (!str) return "";

    // 1. Encode String ra mảng UTF-8 Bytes trước
    var utf8Bytes = [];
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (code < 128) {
        utf8Bytes.push(code);
      } else if (code < 2048) {
        utf8Bytes.push((code >> 6) | 192, (code & 63) | 128);
      } else if (
        (code & 0xfc00) === 0xd800 &&
        i + 1 < str.length &&
        (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00
      ) {
        // Ký tự Surrogate Pair
        code =
          0x10000 + ((code & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
        utf8Bytes.push(
          (code >> 18) | 240,
          ((code >> 12) & 63) | 128,
          ((code >> 6) & 63) | 128,
          (code & 63) | 128,
        );
      } else {
        utf8Bytes.push(
          (code >> 12) | 224,
          ((code >> 6) & 63) | 128,
          (code & 63) | 128,
        );
      }
    }

    // 2. Chuyển mảng UTF-8 Bytes thành chuỗi Base64
    var chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var encoded = "";
    var byte1, byte2, byte3;
    var b1, b2, b3, b4;

    for (var j = 0; j < utf8Bytes.length; j += 3) {
      byte1 = utf8Bytes[j];
      byte2 = j + 1 < utf8Bytes.length ? utf8Bytes[j + 1] : NaN;
      byte3 = j + 2 < utf8Bytes.length ? utf8Bytes[j + 2] : NaN;

      b1 = byte1 >> 2;
      b2 = ((byte1 & 3) << 4) | (isNaN(byte2) ? 0 : byte2 >> 4);
      b3 = isNaN(byte2)
        ? 64
        : ((byte2 & 15) << 2) | (isNaN(byte3) ? 0 : byte3 >> 6);
      b4 = isNaN(byte3) ? 64 : byte3 & 63;

      encoded +=
        chars.charAt(b1) +
        chars.charAt(b2) +
        chars.charAt(b3) +
        chars.charAt(b4);
    }

    return encoded;
  } catch (e) {
    console.log("[BASE64ENCODE Error]:", e.message || e);
    return "";
  }
}

function checkRaw(scriptStr, returnFixed) {
  try {
    if (!scriptStr || typeof scriptStr !== "string") {
      console.log(
        "[Lỗi escape runJS]\r\n\t Dữ liệu đầu vào không phải là chuỗi hợp lệ!",
      );
      return scriptStr || "";
    }

    var lines = scriptStr.split("\n");
    var fixedLines = [];
    var hasError = false;

    for (var i = 0; i < lines.length; i++) {
      var currentLine = lines[i];
      var lineNum = i + 1;
      var lineErrorFound = false; // 1. Kiểm tra lỗi escape newline/tab nguy hiểm nằm trần trong chuỗi quote
      // Trường hợp chưa được escape dạng '\\n' hoặc '\\t' trong chuỗi ghép

      if (/([^\\]|^)(\r\n|\r|\n)/.test(currentLine)) {
        console.log(
          "[Lỗi escape runJS]\r\n\t Phát hiện xuống dòng chưa escape ở Dòng " +
            lineNum +
            ": " +
            currentLine.trim(),
        );
        lineErrorFound = true;
      } // 2. Kiểm tra lỗi quên escape ký tự Tab trần không hợp lệ

      if (/\t/.test(currentLine) && !/\\t/.test(currentLine)) {
        console.log(
          "[Lỗi escape runJS]\r\n\t Phát hiện ký tự Tab trần ở Dòng " +
            lineNum +
            ": " +
            currentLine.trim(),
        );
        lineErrorFound = true;
      } // 3. Kiểm tra dấu xược ngược single trailing backlash ở cuối dòng (dễ làm gãy chuỗi)

      if (/([^\\])\\$/.test(currentLine)) {
        console.log(
          "[Lỗi escape runJS]\r\n\t Dấu Backslash (\\) cô đơn ở cuối Dòng " +
            lineNum +
            ": " +
            currentLine.trim(),
        );
        lineErrorFound = true;
      }

      if (lineErrorFound) {
        hasError = true;
      } // Tiến hành SỬA LỖI tự động nếu tham số returnFixed = true

      var fixedLine = currentLine;
      if (returnFixed) {
        // Chuẩn hóa ký tự xuống dòng và tab đặc biệt
        fixedLine = fixedLine.replace(/\r/g, "").replace(/\t/g, "  "); // Thay Tab trần bằng 2 khoảng trắng cho an toàn
      }

      fixedLines.push(fixedLine);
    } // 4. Kiểm tra cú pháp nhanh xem toàn bộ chuỗi có parse được JS không

    try {
      new Function(scriptStr);
    } catch (syntaxErr) {
      hasError = true;
      console.log(
        "[Lỗi escape runJS]\r\n\t 💥 LỖI CÚ PHÁP (SyntaxError) toàn cục: " +
          syntaxErr.message,
      );
    }

    if (!hasError) {
      console.log("[checkRaw] 🟢 Chuỗi Raw JS hoàn toàn sạch lỗi!");
    } // Trả về bản đã fix hoặc bản gốc theo tham số returnFixed

    return returnFixed ? fixedLines.join("\n") : scriptStr;
  } catch (e) {
    console.log(
      "[Lỗi escape runJS]\r\n\t Lỗi ngoại lệ trong hàm checkRaw: " + e.message,
    );
    return scriptStr; // Luôn an toàn: Fallback trả về chuỗi gốc chứ không làm sập script
  }
}


/**
 * Hàm Decode sạch các HTML entities trong URL
 */

function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * 🚀 HÀM WATERFALL ĐA NĂNG (GÉNÉRIC FOR ALL SERVERS)
 * Tự động gom đúng tất cả các token/param đi kèm về đúng fetchUrl tương ứng.
 */

function getNextFetchStep(urlsplit) {
  try {
    var split = urlsplit.split("split=");
    var nexturl = "";
    var furl = "";
    var path = "";
    if (split && split[1]) {
      var stringurl = BASE64DECODE(split[1]);
      var strSplit = stringurl.split("###"); // có link đằng sau fetch tiếp.
      if (strSplit.length > 1) {
        for (var $j = 0; $j < strSplit.length; $j++) {
          furl = strSplit[0];
          if ($j > 0) {
            path += strSplit[$j] + "###";
          }
        }
        path = BASE64ENCODE(path.replace(/###$/, ""));
        if (furl.indexOf("?") > -1) {
          furl += "&split=" + path;
        } else {
          furl += "?split=" + path;
        }
        log("fetch tiếp: " + furl);
        return {
          nextUrl: furl,
          isEmbed: true, // Nếu vẫn còn fetchUrl phía sau -> Tiếp tục bật isEmbed để chạy tiếp tầng tiếp theo
        };
      } else {
        furl = strSplit[0];
        log("link cuối ko fetch: " + furl);
        return {
          nextUrl: strSplit[0],
          isEmbed: false, // Nếu vẫn còn fetchUrl phía sau -> Tiếp tục bật isEmbed để chạy tiếp tầng tiếp theo
        };
      }
    }
  } catch (e) {
    console.log(e);
  }
}

/**
 * 🛡️ REFERER ĐỘNG ĐA NĂNG
 * Tự động cắt lấy Base URL của tầng hiện tại làm Referer hợp lệ cho tầng sau.
 */
function getCleanReferer(url) {
  try {
    var clean = decodeHtmlEntities(url);
    var qIndex = clean.indexOf("?");
    if (qIndex !== -1) {
      return clean.substring(0, qIndex);
    }
    return clean;
  } catch (e) {
    return url;
  }
}



/**
 * =====================================================================================================
 * 📖 HƯỚNG DẪN CẤU HÌNH HỆ THỐNG SNIFFER (GLOBAL CONFIGURATION GUIDE)
 * =====================================================================================================
 *
 * 🟢 NÚT BẬT/TẮT CHÍNH (0 = TẮT, 1 = BẬT):
 * -----------------------------------------------------------------------------------------------------
 * - USE_GAS_PROXY       : [0|1] 1 = Bật bắt Blob M3U8 & gửi lên Google Apps Script; 0 = Tắt hẳn luồng GAS.
 * - LOGGER              : [0|1] 1 = Xuất log chi tiết ra Console/Toast; 0 = Tắt log.
 * - PROXY_ENABLED       : [0|1] 1 = Chạy URL qua Cloudflare Worker Proxy; 0 = Chạy link gốc.
 * - HTMLRAW             : [0|1] 1 = Xuất DOM HTML thô sau 10 giây để debug; 0 = Tắt.
 * - USE_CUSTOM_DECODER  : [0|1] 1 = Sử dụng hàm giải mã DOM custom (setVideo); 0 = Tắt.
 * - ENABLE_KEYWORD_FILTER: [0|1] 1 = Bắt buộc URL phải chứa từ khóa trong TARGET_KEYWORDS; 0 = Tắt.
 * - ENABLE_EXCLUDE_FILTER: [0|1] 1 = Loại trừ URL chứa từ khóa trong EXCLUDE_KEYWORDS; 0 = Tắt.
 * - ENABLE_FILTER         : [0|1] 1 = Bật lọc domain quảng cáo từ BLOCKED_DOMAINS; 0 = Tắt.
 *
 * ⚙️ CHẾ ĐỘ & ĐƯỜNG DẪN:
 * -----------------------------------------------------------------------------------------------------
 * - PLAYER_MODE        : "ART" = Render trình phát ArtPlayer HTML5; "EXO" = Bắn Intent ra App ngoài.
 * - GAS_WEB_APP_URL    : URL endpoint của Google Apps Script (Chỉ chạy khi USE_GAS_PROXY = 1).
 * - SET_VIDEO_WAIT_MS  : Thời gian chờ setVideo trước khi fallback (mặc định 2000ms).
 * - SNIFFER_TIMEOUT_MS : Thời gian tối đa quét media (mặc định 20000ms = 20s).
 * =====================================================================================================
 */
// https://script.google.com/macros/s/AKfycbxo8zZaqIcehS3s1P-NGGJrrUp0kVzzbzybuFptH1DZqNI5oc8tqZ1r1ZA4aDdWe4L-/exec

function runJS() {
  return `
HTMLRAW = 0; // Lấy html raw để coi thử
BODYRAW = 0; // lấy body để coi thử
CSSBLOCK = 0; // bật tắt css block
VIDEOEND = 0; // ngưng phát video nếu ko có link
NUMBERRAW = 0; // Số lần cho in html
HOOK_NETWORK_AND_DOM = 0; // Hook bằng xhr hoặc dom
ENABLE_PRIORITY_FILTER = 0; // 1 = Bật luồng ưu tiên quét Raw HTML (chờ 5s), 0 = Tắt (phát ngay khi bắt được M3U8)
FILTER_KEYWORDS = ["google", "playlist", "mp4", "m3u8", "hls","master", "master.txt"]; // Các từ khóa lọc link trong Raw HTML

(function() {
    'use strict';
    
    console.log("[Anti-Redirect] Đã kích hoạt bảo vệ!");

    // 1. Chặn window.open
    window.open = function(url, target, features) {
        console.log("[Anti-Redirect] Đã chặn window.open ->", url);
        return null;
    };

    // 2. Chặn chuyển hướng location
    try {
        var initialOrigin = window.location.origin;

        window.location.assign = function(url) {
            console.log("[Anti-Redirect] Đã chặn location.assign ->", url);
        };
        
        window.location.replace = function(url) {
            console.log("[Anti-Redirect] Đã chặn location.replace ->", url);
        };

        var originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            configurable: true,
            enumerable: true,
            get: function() {
                return originalLocation;
            },
            set: function(val) {
                console.log("[Anti-Redirect] Đã chặn đổi location.href ->", val);
                return originalLocation.href;
            }
        });
    } catch (e) {
        console.log("[Anti-Redirect Warning] Không thể khóa location descriptor:", e.message);
    }

    // 3. Chặn beforeunload
    window.addEventListener('beforeunload', function(e) {
        e.stopPropagation();
    }, true);

    // 4. Chặn thẻ A
    document.addEventListener('click', function(e) {
        var target = e.target;
        while (target && target.tagName !== 'A') {
            target = target.parentNode;
        }

        if (target && target.tagName === 'A') {
            var href = target.getAttribute('href');
            var targetAttr = target.getAttribute('target');

            if (targetAttr === '_blank' || (href && href.startsWith('javascript:'))) {
                console.log("[Anti-Redirect] Đã chặn click thẻ A nguy hiểm ->", href);
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }
    }, true);

    // 5. Chặn Form submit
    document.addEventListener('submit', function(e) {
        var form = e.target;
        if (form && form.getAttribute('target') === '_blank') {
            console.log("[Anti-Redirect] Đã chặn Form submit _blank");
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

})();


function bridgeLog(msg, check) {
    try {
      if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
        window.SnifferBridge.log(msg);
        if (check === true && typeof window.SnifferBridge.toast === 'function') {
          window.SnifferBridge.toast(msg, 1000);
        }
      } else if (typeof console !== 'undefined' && console.log) {
        console.log(msg);
      }
    } catch(e) {}
}

function envideo(){
  if(VIDEOEND == 1){
    window.SnifferBridge.play("https://google.com", "");
  }
}
  
(function injectCSS() {
  try {
    const cssStyle = "body,html,*{display:none!important,backgroud:black!important;opacity:0!important;z-index:-999999}";
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.setAttribute('data-injected-by', 'custom-script');

    if (styleElement.styleSheet) {
      styleElement.styleSheet.cssText = cssStyle;
    } else {
      if(CSSBLOCK == 1){
        styleElement.appendChild(document.createTextNode(cssStyle));
      }
    }

    const targetNode = document.head || document.getElementsByTagName('head')[0] || document.documentElement;

    if (targetNode) {
      if(CSSBLOCK == 1){
        targetNode.appendChild(styleElement);
        bridgeLog("Chèn css ngay lập tức.")
      }
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        (document.head || document.documentElement).appendChild(styleElement);
        setTimeout(function(){
          if(HTMLRAW == 1 && NUMBERRAW == 0){
            NUMBERRAW = 1;
            if(BODYRAW == 1){
              var rawhtml = document.getElementsByTagName("body")[0].outerHTML;
              bridgeLog("RAWHTML: " + rawhtml)
            }
            else{
              var rawhtml = document.getElementsByTagName("html")[0].outerHTML;
              bridgeLog("RAWHTML: " + rawhtml)
            }
          }
        },2000)
        bridgeLog("Chèn Css sau khi load xong")
      });
    }
  } catch (error) {
    bridgeLog('Không thể chèn CSS tự động, bỏ qua lỗi:', error);
  }
})();

(function initLocalBlobSniffer() {
  if (window.__BLOB_SNIFFER_INITIALIZED__) return;
  window.__BLOB_SNIFFER_INITIALIZED__ = 1;

  var hasDispatchedAny = 0;
  var isFinished = 0;
  var timeoutTimer = null;
  var domScanInterval = null;

  var stagedM3u8Content = null; 
  var priorityScanCompleted = false; 

  bridgeLog("Đang tiến hành tìm link Video, xin chờ....", true);

  // =========================================================================
  // XỬ LÝ UNESCAPE CHUỖI & TÌM LINK TỪ KHÓA TRONG RAW HTML
  // =========================================================================
  function unescapeUrl(str) {
    if (!str) return '';
    return str
      .replace(/\\\\\\\\\\//g, '/')
      .replace(/\\\\\\\\/g, '')
      .replace(/\\\\\\\\u002F/gi, '/')
      .replace(/\\\\\\\\u0026/gi, '&')
      .replace(/&amp;/g, '&');
  }

  function scanPriorityKeywordsInHtml() {
    bridgeLog("⚡ [PRIORITY] Đang tiến hành quét HTML Raw theo bộ lọc...");
    try {
      var rawHtml = document.documentElement ? document.documentElement.outerHTML : '';
      if (!rawHtml) return null;

      var urlRegex = /(https?:[\\\\\\\\\\/A-Za-z0-9_\\.\\-\\~\\%\\?\\&=\\+\\#\\:\\@]+)/gi;
      var matches = rawHtml.match(urlRegex) || [];

      for (var i = 0; i < matches.length; i++) {
        var cleanUrl = unescapeUrl(matches[i]);
        
        var isMatched = FILTER_KEYWORDS.some(function(keyword) {
          return cleanUrl.toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
        });

        if (isMatched) {
          cleanUrl = cleanUrl.replace(/[\\"'>]+$/, '');
          return cleanUrl;
        }
      }
    } catch(e) {
      bridgeLog("❌ [PRIORITY ERROR]: " + e.message);
    }
    return null;
  }

  // =========================================================================
  // KÍCH HOẠT LUỒNG ƯU TIÊN KHI ENABLE_PRIORITY_FILTER = 1
  // =========================================================================
  if (ENABLE_PRIORITY_FILTER === 1) {
    function triggerPriorityScan() {
      setTimeout(function() {
        if (isFinished === 1) return;

        var foundPriorityUrl = scanPriorityKeywordsInHtml();
        priorityScanCompleted = true;

        if (foundPriorityUrl) {
          bridgeLog("🎯 [PRIORITY-MATCH] Bắt thành công link ưu tiên từ Raw HTML: " + foundPriorityUrl);
          dispatchDirectLinkToApp(foundPriorityUrl);
        } else {
          bridgeLog("⚠️ [PRIORITY] Không tìm thấy link khớp bộ lọc trong Raw HTML.");
          if (stagedM3u8Content) {
            bridgeLog("🔄 [FALLBACK] Phát lại M3U8 đã lưu từ luồng song song...");
            dispatchM3u8ToApp(stagedM3u8Content, true);
          }
        }
      }, 5000);
    }

    if (document.readyState === 'complete') {
      triggerPriorityScan();
    } else {
      window.addEventListener('load', triggerPriorityScan);
    }
  }

  // Timeout tổng thể 25s
  timeoutTimer = setTimeout(function() {
    if (hasDispatchedAny === 0 && isFinished === 0) {
      isFinished = 1;
      if (domScanInterval) clearInterval(domScanInterval);
      bridgeLog("❌ [TIMEOUT] Đã quá thời gian chờ nhưng không tìm thấy link phù hợp!", false);
      bridgeLog("Không tìm thấy link video.", true);
      
      if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
        envideo();
      }
    }
  }, 25000);

  function stopTimeout() {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
    if (domScanInterval) {
      clearInterval(domScanInterval);
      domScanInterval = null;
    }
  }

  function isValidM3U8(content) {
    if (typeof content !== 'string') return false;
    var trimmed = content.trim();
    return trimmed.indexOf('#EXTM3U') === 0 && 
          (trimmed.indexOf('#EXTINF') !== -1 || trimmed.indexOf('#EXT-X-STREAM-INF') !== -1);
  }

  function dispatchDirectLinkToApp(directUrl) {
    if (!directUrl || hasDispatchedAny === 1) return;
    hasDispatchedAny = 1;
    isFinished = 1;
    stopTimeout();

    bridgeLog("🎯 Bắt link trực tiếp thành công! Đang phát...", true);
    try {
      if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
        window.SnifferBridge.play(directUrl, window.location.href);
      } else {
        bridgeLog('❌ SnifferBridge.play không khả dụng!');
      }
    } catch(e) {
      bridgeLog('❌ [DISPATCH DIRECT ERROR]: ' + e.message);
    }
  }

  function dispatchM3u8ToApp(m3u8Content, forceDispatch) {
    if (!m3u8Content || hasDispatchedAny === 1) return;

    // Nếu BẬT bộ lọc ưu tiên VÀ luồng ưu tiên CHƯA chạy xong -> tạm thời lưu lại
    if (ENABLE_PRIORITY_FILTER === 1 && !priorityScanCompleted && !forceDispatch) {
      bridgeLog('⏳ [STAGING] Đã bắt được M3U8 từ luồng song song, đang chờ luồng ưu tiên (5s) quét xong...');
      stagedM3u8Content = m3u8Content;
      return;
    }

    hasDispatchedAny = 1;
    isFinished = 1;
    stopTimeout();

    bridgeLog('🎯 [LOCAL-DISPATCH] Đang nạp M3U8 vào Local Player...');
    bridgeLog("🎯 Bắt link thành công! Đang phát video...", true);

    try {
      if (window.SnifferBridge && typeof window.SnifferBridge.playM3u8Content === 'function') {
        bridgeLog(m3u8Content);
        window.SnifferBridge.playM3u8Content(m3u8Content, window.location.href);
      } else {
        bridgeLog('❌ SnifferBridge.playM3u8Content không khả dụng!');
      }
    } catch(e) {
      bridgeLog('❌ [DISPATCH ERROR]: ' + e.message);
    }
  }

  // =========================================================================
  // HOOK NETWORK (FETCH / XHR) VÀ SCAN DOM
  // =========================================================================
  if (HOOK_NETWORK_AND_DOM === 1) {
    try {
      if (typeof window.fetch !== 'undefined') {
        var originalFetch = window.fetch;
        window.fetch = function() {
          var args = arguments;
          return originalFetch.apply(this, args).then(function(response) {
            if (isFinished === 0 && response && response.clone) {
              var url = (typeof args[0] === 'string') ? args[0] : (args[0] && args[0].url ? args[0].url : '');
              var clone = response.clone();
              clone.text().then(function(text) {
                if (isValidM3U8(text)) {
                  bridgeLog('🎯 [NETWORK-FETCH] Bắt được M3U8 từ Fetch Request: ' + url);
                  dispatchM3u8ToApp(text, false);
                }
              }).catch(function(){});
            }
            return response;
          });
        };
        bridgeLog('🚀 [INIT] Đã Hook Fetch thành công.');
      }
    } catch (e) {
      bridgeLog('❌ [HOOK-FETCH-ERROR]: ' + e.message);
    }

    try {
      if (typeof XMLHttpRequest !== 'undefined') {
        var originalXHR = XMLHttpRequest.prototype.open;
        var originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url) {
          this._url = url;
          return originalXHR.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function() {
          this.addEventListener('load', function() {
            if (isFinished === 0 && this.responseText) {
              if (isValidM3U8(this.responseText)) {
                bridgeLog('🎯 [NETWORK-XHR] Bắt được M3U8 từ XHR Request: ' + (this._url || ''));
                dispatchM3u8ToApp(this.responseText, false);
              }
            }
          });
          return originalSend.apply(this, arguments);
        };
        bridgeLog('🚀 [INIT] Đã Hook XHR thành công.');
      }
    } catch (e) {
      bridgeLog('❌ [HOOK-XHR-ERROR]: ' + e.message);
    }

    domScanInterval = setInterval(function() {
      if (isFinished === 1) return;
      var videos = document.getElementsByTagName('video');
      for (var i = 0; i < videos.length; i++) {
        var src = videos[i].src || videos[i].currentSrc;
        if (src && src.startsWith('blob:')) {
          bridgeLog('🔍 [DOM-SCAN] Đã phát hiện thẻ Video chứa Blob URL: ' + src);
        }
      }
    }, 1000);
  }

  // =========================================================================
  // HOOK URL.createObjectURL
  // =========================================================================
  try {
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      var originalCreateObjectURL = URL.createObjectURL;
      
      URL.createObjectURL = function(blob) {
        var blobUrl = originalCreateObjectURL.apply(this, arguments);

        if (isFinished === 0 && blob && (blob instanceof Blob || blob instanceof File)) {
          var processContent = function(content) {
            if (isValidM3U8(content)) {
              bridgeLog('🎯 [FOUND-BLOB]: Phát hiện M3U8 từ Blob RAM!');
              dispatchM3u8ToApp(content, false);
            }
          };

          if (typeof blob.text === 'function') {
            blob.text().then(processContent).catch(function(){});
          } else {
            var reader = new FileReader();
            reader.onload = function(e) {
              processContent(e.target.result);
            };
            reader.readAsText(blob);
          }
        }

        return blobUrl;
      };
      
      bridgeLog('🚀 [INIT] Đã Hook URL.createObjectURL thành công.');
      setTimeout(function(){
          if(HTMLRAW == 1 && NUMBERRAW == 0){
            NUMBERRAW = 1;
            if(BODYRAW == 1){
              var rawhtml = document.getElementsByTagName("body")[0].outerHTML;
              bridgeLog("RAWHTML: " + rawhtml)
            }
            else{
              var rawhtml = document.getElementsByTagName("html")[0].outerHTML;
              bridgeLog("RAWHTML: " + rawhtml)
            }
          }
        },2000);
    }
  } catch (e) {
    bridgeLog('❌ [INIT-ERROR]: ' + e.message);
  }
})();
  `;
}

// js dùng proxy của cloudflare
/*
function runJS() {
    return `
(function initBlobWorkerSniffer() {
if (window.__BLOB_SNIFFER_INITIALIZED__) return;
  window.__BLOB_SNIFFER_INITIALIZED__ = 1;

  // =========================================================================
  // 1. CẤU HÌNH WORKER POOL & BIẾN TRẠNG THÁI
  // =========================================================================
  var WORKER_POOL = [
    "https://soft-surf-c11d.alokillgtv.workers.dev",
    "https://soft-water-25b0.alokillgtv02.workers.dev",
    "https://raspy-king-7894.alokillgtv03.workers.dev"
  ];

  var activeWorkerIndex = 0;
  var hasDispatchedAny = 0;
  var isFinished = 0; // Đánh dấu đã kết thúc (thành công hoặc hết giờ)
  var CUSTOM_REFERER = window.location.href;
  var timeoutTimer = null;

  function bridgeLog(msg, check) {
    try {
      var logMsg = msg;
      if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
        window.SnifferBridge.log(logMsg);
        if (check === true) {
          window.SnifferBridge.toast(logMsg, 1000);
        }
      } else if (typeof console !== 'undefined' && console.log) {
        console.log(logMsg);
      }
    } catch(e) {}
  }

  // =========================================================================
  // 2. GIỚI HẠN THỜI GIAN 30 GIÂY (TIMEOUT)
  // =========================================================================
  bridgeLog("Đang tiến hành lấy link Video, xin chờ....", true);

  timeoutTimer = setTimeout(function() {
    if (hasDispatchedAny === 0 && isFinished === 0) {
      isFinished = 1;
      bridgeLog("❌ [TIMEOUT] Đã quá 30 giây nhưng không tìm thấy link Blob M3U8!", false);
      bridgeLog("Không tìm thấy link video (Hết thời gian 10s). Hãy thử lại sau!", true);
      window.SnifferBridge.play("https://google.com", "");
    }
  }, 10000); // 30,000 ms = 30 giây

  function stopTimeout() {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  }

  // =========================================================================
  // 3. KIỂM TRA M3U8 HỢP LỆ
  // =========================================================================
  function isValidM3U8(content) {
    if (typeof content !== 'string') return false;
    var trimmed = content.trim();
    if (trimmed.indexOf('#EXTM3U') !== 0) return false;
    if (trimmed.indexOf('#EXTINF') === -1 && trimmed.indexOf('#EXT-X-STREAM-INF') === -1) return false;
    return true;
  }

  // =========================================================================
  // 4. ĐIỀU HƯỚNG PHÁT LUỒNG (DISPATCH)
  // =========================================================================
  function dispatchToPlayer(mediaUrl) {
    if (!mediaUrl || hasDispatchedAny === 1) return;
    hasDispatchedAny = 1;
    isFinished = 1;
    stopTimeout(); // Hủy đếm ngược 30s khi thành công

    bridgeLog('🎬 [DISPATCH TO PLAYER]: ' + mediaUrl);

    try {
      if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
        window.SnifferBridge.play(mediaUrl, CUSTOM_REFERER);
      } else {
        window.location.href = mediaUrl;
      }
    } catch(e) {
      bridgeLog('❌ [DISPATCH ERROR]: ' + e.message);
    }
  }

  // =========================================================================
  // 5. XỬ LÝ WORKER POOL
  // =========================================================================
  function sendM3U8ToGAS(m3u8Content, workerIndexToTry) {
    if (isFinished === 1 && typeof workerIndexToTry === 'undefined') return;

    var currentIdx = (typeof workerIndexToTry === 'number') ? workerIndexToTry : activeWorkerIndex;

    if (currentIdx >= WORKER_POOL.length) {
      bridgeLog('❌ [WORKER-POOL-EXHAUSTED] Tất cả Worker trong Pool đều lỗi!');
      bridgeLog("Không lấy được link video.. Hãy quay lại sau..", true);
      window.SnifferBridge.play("https://google.com", "");
      isFinished = 1;
      stopTimeout();
      return;
    }

    var currentWorkerBase = WORKER_POOL[currentIdx].replace(/\\/+$/, '');
    var uploadEndpoint = currentWorkerBase + "/upload-m3u8";

    bridgeLog('📤 [WORKER-TRY ' + (currentIdx + 1) + '/' + WORKER_POOL.length + '] Gửi M3U8 tới: ' + uploadEndpoint);
    bridgeLog("Đã lấy được Blob, đang giải mã, xin chờ....", true);

    fetch(uploadEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({
        content: m3u8Content,
        baseUrl: window.location.href,
        referer: CUSTOM_REFERER
      })
    })
    .then(function(res) {
      if (!res.ok) throw new Error("HTTP Status " + res.status);
      return res.text();
    })
    .then(function(textData) {
      if (!textData || textData.trim() === "") throw new Error("Worker trả về dữ liệu rỗng!");

      var cleanText = textData.trim();
      var targetPlayUrl = "";

      try {
        var jsonData = JSON.parse(cleanText);
        targetPlayUrl = jsonData.m3u8_url || jsonData.url || "";
      } catch (e) {}

      if (!targetPlayUrl && (cleanText.indexOf('http://') === 0 || cleanText.indexOf('https://') === 0)) {
        targetPlayUrl = cleanText;
      }

      if (targetPlayUrl) {
        bridgeLog('🎯 [WORKER-SUCCESS] Lấy link thành công từ Worker [' + (currentIdx + 1) + ']: ' + targetPlayUrl);
        bridgeLog("🎯 Đã có link video phát được. Chúc vui.", true);
        activeWorkerIndex = currentIdx;
        dispatchToPlayer(targetPlayUrl);
      } else {
        bridgeLog("⚠️ Không chứa link M3U8 hợp lệ từ Worker.", true);
        window.SnifferBridge.play("https://google.com", "");
        throw new Error("Phản hồi không chứa link M3U8 hợp lệ");
      }
    })
    .catch(function(err) {
      if (isFinished === 1) return;
      bridgeLog('⚠️ [WORKER-FAIL] Worker [' + (currentIdx + 1) + '] lỗi: ' + err.message + ' -> Chuyển sang Worker tiếp theo...');
      bridgeLog("⚠️ Lỗi giải mã, đang thử lại với Server dự phòng...", true);
      sendM3U8ToGAS(m3u8Content, currentIdx + 1);
    });
  }

  // =========================================================================
  // 6. HOOK URL.createObjectURL (ĐỌC VÀ LỌC BLOB M3U8)
  // =========================================================================
  try {
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      var originalCreateObjectURL = URL.createObjectURL;
      
      URL.createObjectURL = function(blob) {
        var blobUrl = originalCreateObjectURL.apply(this, arguments);

        if (isFinished === 0 && blob && (blob instanceof Blob || blob instanceof File)) {
          var processContent = function(content) {
            if (isValidM3U8(content)) {
              bridgeLog('🎯 [FOUND-BLOB]: Phát hiện M3U8 chuẩn từ Blob!');
              bridgeLog('🎯 Đã tìm được link video. Tiếp theo sẽ giải mã. xin chờ...', true);
              sendM3U8ToGAS(content, 0);
            }
          };

          if (typeof blob.text === 'function') {
            blob.text().then(processContent).catch(function(){});
          } else {
            var reader = new FileReader();
            reader.onload = function(e) {
              processContent(e.target.result);
            };
            reader.readAsText(blob);
          }
        }

        return blobUrl;
      };
      
      bridgeLog('🚀 [INIT] Đã Hook thành công URL.createObjectURL.');
      bridgeLog('🚀 Đã phát hiện nguồn link video.');
      
    }
  } catch (e) {
    bridgeLog('❌ [INIT-ERROR]: ' + e.message);
  }
})();
  `;
}
*/

function parseCategoriesResponse(html) {
  return "[]";
}
function parseCountriesResponse(html) {
  return "[]";
}
function parseYearsResponse(html) {
  return "[]";
}
function getImageUrl(path) {
    if (!path || typeof path !== "string") return "";
    if (path.indexOf("http") === 0) return path;
    return BASECDN + path;
}