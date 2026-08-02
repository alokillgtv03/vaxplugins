// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "nguoncnew",
        "name": "Phim NguonC Xoá Quảng Cáo",
        "version": "1.3",
        "baseUrl": "https://phim.nguonc.com",
        "iconUrl": "https://raw.githubusercontent.com/youngbi/repo/main/plugins/nguonC.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "embed"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'the-loai' },
        { slug: 'phim-moi-cap-nhat', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'phim-moi-cap-nhat' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'TV Shows', slug: 'tv-shows' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'updated' },
            { name: 'Mới nhất', value: 'new' },
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
        var sort = filters.sort || "updated"; // updated, view, year

        // Handle "Phim Mới Cập Nhật" specially if no filter
        if (slug === 'phim-moi-cap-nhat' && !filters.category && !filters.country && !filters.year) {
            return "https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=" + page;
        }

        // Priority 1: Category Support //v1/api/the-loai/{slug}
        if (filters.category) {
            return "https://phim.nguonc.com/api/films/the-loai/" + filters.category + "?page=" + page + "&sort=" + sort;
        }

        // Priority 2: Country Support //v1/api/quoc-gia/{slug}
        if (filters.country) {
            return "https://phim.nguonc.com/api/films/quoc-gia/" + filters.country + "?page=" + page + "&sort=" + sort;
        }

        // Priority 3: Year Support //v1/api/nam-phat-hanh/{year}
        if (filters.year) {
            return "https://phim.nguonc.com/api/films/nam-phat-hanh/" + filters.year + "?page=" + page + "&sort=" + sort;
        }

        // --- Slug-based Logic (if no active filter) ---

        // Handle Years (4 digits)
        if (/^\d{4}$/.test(slug)) {
            return "https://phim.nguonc.com/api/films/nam-phat-hanh/" + slug + "?page=" + page + "&sort=" + sort;
        }

        // Handle specific Lists (Danh sách)
        var listSlugs = ['phim-le', 'phim-bo', 'phim-dang-chieu', 'tv-shows', 'subteam'];
        // Note: 'hoat-hinh' is sometimes a list, sometimes a category. 
        // On NguonC, 'hoat-hinh' is usually in 'the-loai' but let's check standard lists.
        // NguonC commonly puts 'phim-hoat-hinh' in lists or 'hoat-hinh' in genres.

        if (listSlugs.indexOf(slug) >= 0) {
            // If slug is 'hoat-hinh', prefer 'the-loai' logic unless we know it's a list
            if (slug !== 'hoat-hinh') {
                return "https://phim.nguonc.com/api/films/danh-sach/" + slug + "?page=" + page + "&sort=" + sort;
            }
        }

        // Handle Countries (Fallback if slug matches country list)
        var countrySlugs = [
            'au-my', 'anh', 'trung-quoc', 'indonesia', 'viet-nam', 'phap', 'hong-kong',
            'han-quoc', 'nhat-ban', 'thai-lan', 'dai-loan', 'nga', 'ha-lan',
            'philippines', 'an-do', 'quoc-gia-khac'
        ];
        if (countrySlugs.indexOf(slug) >= 0) {
            return "https://phim.nguonc.com/api/films/quoc-gia/" + slug + "?page=" + page + "&sort=" + sort;
        }

        // Default to Genres (Thể loại)
        return "https://phim.nguonc.com/api/films/the-loai/" + slug + "?page=" + page + "&sort=" + sort;

    } catch (e) {
        return "https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=1";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    return "https://phim.nguonc.com/api/films/search?keyword=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    return "https://phim.nguonc.com/api/film/" + slug;
}

// Just returning the home page to trigger the parser, which will return hardcoded data
function getUrlCategories() { return "https://phim.nguonc.com"; }
function getUrlCountries() { return "https://phim.nguonc.com"; }
function getUrlYears() { return "https://phim.nguonc.com"; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        // Handle NguonC structure: sometimes data is array directly (search), sometimes an object (list)
        var data = response.data || {};
        var items = [];

        if (Array.isArray(data)) {
            items = data;
        } else if (Array.isArray(response.items)) {
            items = response.items;
        } else if (data.items && Array.isArray(data.items)) {
            items = data.items;
        }

        // Handle NguonC 'paginate' structure
        // User provided: "paginate": { "current_page": 1, ... }
        var paginate = response.paginate || response.pagination || (data.params && data.params.pagination) || {};

        var movies = items.map(function (item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: getImageUrl(item.thumb_url),
                backdropUrl: getImageUrl(item.poster_url),
                year: item.year || 0,
                quality: item.quality || "",
                // Handle different field names for current episode
                episode_current: item.current_episode || item.episode_current || "",
                // Handle different field names for language
                lang: item.language || item.lang || ""
            };
        });

        // Determine pagination values
        var currentPage = paginate.current_page || paginate.currentPage || 1;
        var totalItems = paginate.total_items || paginate.totalItems || 0;
        var itemsPerPage = paginate.items_per_page || paginate.itemsPerPage || paginate.totalItemsPerPage || 24;

        // Calculate total pages if not provided directly
        var totalPages = paginate.total_page || paginate.totalPages || 0;
        if (totalPages === 0 && itemsPerPage > 0) {
            totalPages = Math.ceil(totalItems / itemsPerPage);
        }
        if (totalPages === 0) totalPages = 1;

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: itemsPerPage
            }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(apiResponseJson) {
    return parseListResponse(apiResponseJson);
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        // Normalize movie object (supports standard and potential variants)
        var movie = response.movie || response.data?.item || response.data || {};

        // Normalize episodes
        var rawEpisodes = movie.episodes || response.episodes || response.data?.item?.episodes || [];

        var servers = [];
        if (Array.isArray(rawEpisodes)) {
            rawEpisodes.forEach(function (server) {
                var episodes = [];
                var serverItems = server.items || server.server_data || [];

                if (Array.isArray(serverItems)) {
                    serverItems.forEach(function (ep) {
                        var embed = ep.embed || ep.link_embed || "";
                        var m3u8 = ep.m3u8 || ep.link_m3u8 || "";

                        // Use Embed URL as ID to allow scraping Referer/M3u8 details
                        // If no embed, use m3u8 directly.
                        var link = embed || m3u8;

                        if (link) {
                            episodes.push({
                                id: link,
                                name: ep.name || ep.episode_name || "",
                                slug: ep.slug || ep.episode_slug || ""
                            });
                        }
                    });
                }

                if (episodes.length > 0) {
                    servers.push({
                        name: server.server_name || server.name || "Server",
                        episodes: episodes
                    });
                }
            });
        }

        // Helper to extract category/country/year
        // Handles both { "1": { group: ..., list: [...] } } AND typical arrays
        var extractGroup = function (categoryObj, groupName) {
            if (!categoryObj) return "";

            // If it's an object with keys "1", "2"...
            for (var key in categoryObj) {
                var group = categoryObj[key];
                if (group && group.group && group.group.name === groupName && group.list && group.list.length > 0) {
                    return group.list.map(function (item) { return item.name; }).join(", ");
                }
            }
            return "";
        };

        var extractedYear = extractGroup(movie.category, "Năm");

        return JSON.stringify({
            id: movie.slug || "",
            title: movie.name || "",
            posterUrl: getImageUrl(movie.thumb_url),
            backdropUrl: getImageUrl(movie.poster_url),
            description: (movie.description || movie.content || "").replace(/<[^>]*>/g, ""),
            year: parseInt(movie.year || extractedYear) || 0,
            rating: parseFloat(movie.view) || 0,
            quality: movie.quality || "",
            servers: servers,
            episode_current: movie.current_episode || movie.episode_current || "",
            lang: movie.language || movie.lang || "",
            casts: movie.casts || movie.actor || "", // Fallback to 'actor' if casts is missing
            director: movie.director || "",
            category: extractGroup(movie.category, "Thể loại"),
            country: extractGroup(movie.category, "Quốc gia"),
            view: parseInt(movie.view) || 0,
            status: movie.status || ""
        });
    } catch (error) {
        return "{}";
    }
}


function parseDetailResponse(html, url) {
    try {
        var customjs = runjS();
        return JSON.stringify({
            "url": url,
            "headers": {
                "Referer": "https://embed.streamc.xyz/",
                "Origin": "https://embed.streamc.xyz/",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                // Đánh lừa thuật toán Client Hints của tường lửa
                "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                "Sec-Ch-Ua-Mobile": "?1",
                "Sec-Ch-Ua-Platform": '"Android"',
                
                // Khai báo kiểu dữ liệu được chấp nhận giống như trình duyệt thật
                "Accept": "*/*",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
                "X-Requested-With": "com.android.chrome",
                "Block-Ads": true,
                "Block-Css": "html,body,*",
                "Custom-Js": customjs.trim()
            },
            "subtitles": []
        });
        
    } catch (e) {
        return JSON.stringify({ "url": "", "headers": {} });
    }
}





function runjS() {

    // =========================================================================
    // 1. CONFIG JS & TRACER LOGS
    // =========================================================================
    function configJS() {
        return `
    var USE_GAS_PROXY = 1;          
    var LOGGER = 1;                 
    var PROXY_ENABLED = 0;          
    var HTMLRAW = 0;                
    var USE_CUSTOM_DECODER = 0;     
    var ENABLE_KEYWORD_FILTER = 0;  
    var ENABLE_EXCLUDE_FILTER = 1;  
    var ENABLE_FILTER = 0;          

    // ⚙️ CHUYỂN SANG CHẾ ĐỘ "ART" PLAYER
    var PLAYER_MODE = "EXO";        // "ART" | "EXO" | "HTML5"
    
    // 🌐 DANH SÁCH WORKER POOL TỪ NHIỀU TÀI KHOẢN CLOUDFLARE
    var WORKER_POOL = [
      "https://soft-surf-c11d.alokillgtv.workers.dev",
      "https://soft-water-25b0.alokillgtv02.workers.dev"
      
      // Bạn có thể thêm các link worker khác vào đây:
      // "https://worker-account-2.yourdomain.workers.dev",
      // 
      // "https://worker-account-3.yourdomain.workers.dev"
    ];
    
    var activeWorkerIndex = 0; // Bắt đầu từ Worker đầu tiên
    
    var processedUrls = {};
    var loggedDropReasons = {}; 
    var hasDispatchedAny = 0;       
    var STARTRUN = 0;
    var setVideoSuccess = 0;
    var setVideoTimer = null;
    var SET_VIDEO_WAIT_MS = 2000; 
    var SNIFFER_TIMEOUT_MS = 20000;
    var executionRetries = 0;
    var maxExecutionRetries = 10;
    var videoObserver = null;

    var KEYWORD_MATCH_MODE = "ALL";   
    var TARGET_KEYWORDS = ["www.1porn.tv", "get_file", "mp4"];

    var EXCLUDE_MATCH_MODE = "SOME"; 
    var EXCLUDE_KEYWORDS = ["/config?", "/style", "/title", "/script", "/head", "vast.flimora", "ads", "preview", "trailer", ".png", ".jpg", ".css"];

    var BLOCKED_DOMAINS = ["ads.example.com", "*.adnetwork.com", "streamLib.js"];

    var junkLinksQueue = [];
    var snifferQueue = [];

    var CUSTOM_REFERER = window.location.href;

    var STREAM_URL_REGEX = /(?:\\.m3u8|\\.mp4|\\.ts|googlevideo\\.com|googleusercontent\\.com|bp\\.blogspot\\.com|\\/hls\\/|playlist|token=|expires=|sig=|signature=|=m18|=m22|=m37)/i;

    if (window.SnifferBridge && typeof window.SnifferBridge.toast === 'function') {
      SnifferBridge.toast("🎯 Đang xử lý dữ liệu. Chờ chút nhé...", 3000);
    }

    function saveJunkLink(url, category, reason) {
      if (!url || typeof url !== 'string' || url.trim() === "") return;
      junkLinksQueue.push({
        url: url,
        category: category,
        reason: reason,
        time: new Date().toLocaleTimeString()
      });
    }

    function checkKeywordMatch(url) {
      if (!url || typeof url !== 'string' || url.trim() === "") return { pass: 0, reason: "URL rỗng" };
      var lowerUrl = String(url).toLowerCase();

      if (ENABLE_EXCLUDE_FILTER === 1 && EXCLUDE_KEYWORDS && EXCLUDE_KEYWORDS.length > 0) {
        if (EXCLUDE_MATCH_MODE === "ALL") {
          var isAllMatch = EXCLUDE_KEYWORDS.every(function(kw) { 
            return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1; 
          });
          if (isAllMatch) return { pass: 0, reason: "Chứa tất cả từ khóa LOẠI TRỪ" };
        } else {
          var isSomeMatch = EXCLUDE_KEYWORDS.some(function(kw) { 
            return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1; 
          });
          if (isSomeMatch) return { pass: 0, reason: "Chứa từ khóa LOẠI TRỪ" };
        }
      }

      if (ENABLE_KEYWORD_FILTER === 1 && TARGET_KEYWORDS && TARGET_KEYWORDS.length > 0) {
        if (KEYWORD_MATCH_MODE === "ALL") {
          var passAll = TARGET_KEYWORDS.every(function(kw) { 
            return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1; 
          });
          if (!passAll) return { pass: 0, reason: "Không chứa đủ từ khóa TARGET_KEYWORDS" };
        } else {
          var passSome = TARGET_KEYWORDS.some(function(kw) { 
            return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1; 
          });
          if (!passSome) return { pass: 0, reason: "Không khớp từ khóa TARGET_KEYWORDS" };
        }
      }

      return { pass: 1 };
    }

    function isValidM3U8(content) {
      if (typeof content !== 'string') return 0;
      var trimmed = content.trim();

      if (trimmed.indexOf('#EXTM3U') !== 0) return 0;
      if (trimmed.indexOf('#EXTINF') === -1 && trimmed.indexOf('#EXT-X-STREAM-INF') === -1) return 0;

      if (trimmed.indexOf('var exports') !== -1 || 
          trimmed.indexOf('function(') !== -1 || 
          trimmed.indexOf('Object.defineProperty') !== -1 ||
          trimmed.indexOf('module.exports') !== -1) {
        return 0;
      }

      return 1;
    }

    function decodeRawUrl(str) {
      if (!str) return '';
      try {
        return String(str)
          .replace(/\\\\u0026/g, '&')
          .replace(/\\\\u003d/g, '=')
          .replace(/\\\\u002f/g, '/')
          .replace(/\\\\/g, '');
      } catch(e) {
        return str;
      }
    }

    function bridgeLog(msg) {
      if (LOGGER !== 1) return;
      try {
        var strMsg = String(msg);
        var formattedContent = strMsg;
        var match = strMsg.match(/^(\\S+\\s*\\[[^\\]]+\\]:?)(.*)$/);
        if (match) {
          formattedContent = match[1].trim() + "\\r\\n\\t" + match[2].trim();
        }
        var logMessage = '[CustomJS] ' + formattedContent;
        if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
          window.SnifferBridge.log(logMessage);
        } else if (typeof console !== 'undefined' && console.log) {
          console.log(logMessage);
        }
      } catch (e) {}
    }

    function logDropOnce(url, reason) {
      if (!url) return;
      var key = reason + '|' + url;
      if (!loggedDropReasons[key]) {
        loggedDropReasons[key] = 1;
        bridgeLog('⛔ [BỎ QUA LÝ DO: ' + reason + ']: -> ' + url);
      }
    }
    `;
    }

    // =========================================================================
    // 2. SETVIDEO JS
    // =========================================================================
    function setVideoJS() {
        return `
  function setVideo(rawUrl, sourceName) {
    try {
      if (USE_CUSTOM_DECODER !== 1) return 0;
      
      var videoElem = document.querySelector("video source") || document.querySelector("video");
      var decodedUrl = videoElem ? videoElem.src : "";

      if (decodedUrl && typeof decodedUrl === 'string' && decodedUrl.trim().length > 10 && (decodedUrl.indexOf('http') === 0 || decodedUrl.indexOf('//') === 0)) {
        if (typeof checkKeywordMatch === 'function') {
          var checkRes = checkKeywordMatch(decodedUrl);
          if (checkRes.pass !== 1) {
            logDropOnce(decodedUrl, checkRes.reason);
            saveJunkLink(decodedUrl, "other", checkRes.reason);
            return 0;
          }
        }
        
        bridgeLog('⏳ [setVideo - ĐANG XỬ LÝ ƯU TIÊN] Nguồn: [' + sourceName + ']');
        setVideoSuccess = 1;
        if (setVideoTimer) clearTimeout(setVideoTimer);

        bridgeLog('🎉 [setVideo - THÀNH CÔNG]: Đã lấy được link -> ' + decodedUrl);
        dispatchToPlayer(decodedUrl, "setVideo");
        return 1;
      }
      return 0;
    } catch (e) {
      bridgeLog('❌ [setVideo - LỖI XỬ LÝ]: ' + e.message);
      return 0;
    }
  }
  `;
    }

    // =========================================================================
    // 3. GET LINK & WORKER POOL PROCESSOR JS (KIỂM TRA & ĐỔI WORKER KHI LỖI)
    // =========================================================================
    function getLinkJS() {
        return `
    function sendM3U8ToGAS(m3u8Content, sourceInfo, workerIndexToTry) {
      if (USE_GAS_PROXY !== 1) {
        bridgeLog('ℹ️ [WORKER-SKIPPED] Luồng Proxy đang TẮT (USE_GAS_PROXY = 0).');
        return;
      }

      if (hasDispatchedAny === 1 && typeof workerIndexToTry === 'undefined') return;

      var currentIdx = (typeof workerIndexToTry === 'number') ? workerIndexToTry : activeWorkerIndex;
      
      if (currentIdx >= WORKER_POOL.length) {
        bridgeLog('❌ [WORKER-POOL-EXHAUSTED] Tất cả ' + WORKER_POOL.length + ' Worker đều lỗi hoặc không phản hồi!');
        hasDispatchedAny = 0;
        onSnifferFailed();
        return;
      }

      var currentWorkerBase = WORKER_POOL[currentIdx].replace(/\\/+$/, '');
      var uploadEndpoint = currentWorkerBase + "/upload-m3u8";

      bridgeLog('📤 [WORKER-TRY ' + (currentIdx + 1) + '/' + WORKER_POOL.length + '] Đang gửi M3U8 tới: ' + uploadEndpoint);
      showLoadingScreen("Đang thử giải mã qua Worker [" + (currentIdx + 1) + "/" + WORKER_POOL.length + "]...");

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
        if (!res.ok) {
          throw new Error("HTTP Status " + res.status);
        }
        return res.text();
      })
      .then(function(textData) {
        if (!textData || textData.trim() === "") {
          throw new Error("Worker trả về dữ liệu rỗng!");
        }

        var cleanText = textData.trim();
        var targetPlayUrl = "";

        try {
          var jsonData = JSON.parse(cleanText);
          if (jsonData && jsonData.m3u8_url) {
            targetPlayUrl = jsonData.m3u8_url;
          } else if (jsonData && jsonData.url) {
            targetPlayUrl = jsonData.url;
          }
        } catch (e) {}

        if (!targetPlayUrl) {
          if (cleanText.indexOf('http://') === 0 || cleanText.indexOf('https://') === 0) {
            targetPlayUrl = cleanText;
          }
        }

        if (targetPlayUrl) {
          bridgeLog('🎯 [WORKER-SUCCESS] Đã lấy link phát từ Worker [' + (currentIdx + 1) + ']: ' + targetPlayUrl);
          activeWorkerIndex = currentIdx; // Lưu lại worker chạy thành công
          hasDispatchedAny = 1;
          dispatchToPlayer(targetPlayUrl, "WorkerProxy[" + (currentIdx + 1) + "] (" + sourceInfo + ")");
        } else {
          throw new Error("Dữ liệu phản hồi không chứa link M3U8 hợp lệ: " + cleanText.substring(0, 100));
        }
      })
      .catch(function(err) {
        bridgeLog('⚠️ [WORKER-FAIL] Worker [' + (currentIdx + 1) + '] lỗi: ' + err.message + ' -> Tự động thử Worker tiếp theo...');
        // Thử Worker tiếp theo trong Pool
        sendM3U8ToGAS(m3u8Content, sourceInfo, currentIdx + 1);
      });
    }

    function getLinkJS(rawUrl, sourceName) {
      try {
        if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === "" || hasDispatchedAny === 1) return;
        
        var cleanRawUrl = typeof decodeRawUrl === 'function' ? decodeRawUrl(rawUrl) : rawUrl;

        if (cleanRawUrl.indexOf('data:') === 0) {
          logDropOnce(cleanRawUrl, "Link Data URL");
          saveJunkLink(cleanRawUrl, "other", "Link Data URL");
          return;
        }

        if (cleanRawUrl.indexOf('/embed/') !== -1 || cleanRawUrl.indexOf('blogger.com/video.g') !== -1 || cleanRawUrl.indexOf('youtube.googleapis.com/embed') !== -1) {
          logDropOnce(cleanRawUrl, "Trang Embed/Iframe Wrapper");
          saveJunkLink(cleanRawUrl, "embed", "Iframe/Embed Wrapper Page");
          return;
        }

        var absoluteUrl = cleanRawUrl.indexOf('blob:') === 0 ? cleanRawUrl : new URL(cleanRawUrl, document.baseURI || window.location.href).href;

        if (typeof checkKeywordMatch === 'function') {
          var checkRes = checkKeywordMatch(absoluteUrl);
          if (checkRes.pass !== 1) {
            logDropOnce(absoluteUrl, checkRes.reason);
            saveJunkLink(absoluteUrl, "other", checkRes.reason);
            return;
          }
        }

        if (STREAM_URL_REGEX && !STREAM_URL_REGEX.test(absoluteUrl) && !STREAM_URL_REGEX.test(cleanRawUrl)) {
          logDropOnce(absoluteUrl, "Không chứa định dạng Stream Media chuẩn");
          saveJunkLink(absoluteUrl, "other", "Không chứa định dạng Stream Media");
          return;
        }

        if (processedUrls[absoluteUrl]) return;
        processedUrls[absoluteUrl] = 1;

        bridgeLog('🎯 [Sniffer - KHỚP ĐIỀU KIỆN] Nguồn [' + (sourceName || 'Unknown') + ']: ' + absoluteUrl);

        if (absoluteUrl.indexOf('.m3u8') !== -1 || absoluteUrl.indexOf('.mp4') !== -1 || absoluteUrl.indexOf('googlevideo.com') !== -1 || absoluteUrl.indexOf('googleusercontent.com') !== -1 || USE_CUSTOM_DECODER !== 1) {
            dispatchToPlayer(absoluteUrl, "DirectSniffer (" + sourceName + ")");
            return;
        }

        snifferQueue.push({ url: absoluteUrl, source: sourceName });

        if (USE_CUSTOM_DECODER === 1 && typeof setVideo === 'function') {
          var success = setVideo(absoluteUrl, sourceName);
          if (success !== 1 && !setVideoTimer && setVideoSuccess !== 1) {
            setVideoTimer = setTimeout(function() {
              triggerSnifferFallback();
            }, SET_VIDEO_WAIT_MS);
          }
        }
      } catch (e) {
        bridgeLog('❌ [getLinkJS - Lỗi]: ' + e.message);
      }
    }

    function triggerSnifferFallback() {
      if (hasDispatchedAny === 1 || setVideoSuccess === 1) return;
      bridgeLog('🔄 [Sniffer Fallback]: Tiến hành xả hàng đợi Sniffer Queue (' + snifferQueue.length + ' link)...');

      if (snifferQueue.length > 0) {
        var fallbackItem = snifferQueue[0];
        bridgeLog('🚀 [Sniffer Fallback]: Lấy link từ Sniffer gửi Player -> ' + fallbackItem.url);
        dispatchToPlayer(fallbackItem.url, "SnifferFallback (" + fallbackItem.source + ")");
      }
    }
    `;
    }

    // =========================================================================
    // 4. ARTPLAYER WITH DATA BASE64 REDIRECT
    // =========================================================================
    function artPlayer() {
        return `
function renderArtPlayerBase64(playUrl) {
  try {
    bridgeLog('🎨 [ARTPLAYER]: Khởi tạo giao diện ArtPlayer dưới dạng Base64 Data URL...');

    var htmlContent = '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">' +
      '<title>ArtPlayer Stream</title>' +
      '<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>' +
      '<script src="https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.js"></script>' +
      '<style>' +
        'html, body { margin:0; padding:0; width:100%; height:100%; background:#000; overflow:hidden; }' +
        '#artplayer { width:100vw; height:100vh; }' +
      '</style>' +
    '</head>' +
    '<body>' +
      '<div id="artplayer"></div>' +
      '<script>' +
        'var playUrl = "' + playUrl + '";' +
        'var art = new Artplayer({' +
          'container: "#artplayer",' +
          'url: playUrl,' +
          'type: playUrl.indexOf(".m3u8") !== -1 || playUrl.indexOf("blob:") === 0 ? "m3u8" : "",' +
          'autoplay: true,' +
          'isLive: false,' +
          'muted: false,' +
          'fullscreen: true,' +
          'fullscreenWeb: true,' +
          'autoSize: true,' +
          'pip: true,' +
          'setting: true,' +
          'customType: {' +
            'm3u8: function(video, url, art) {' +
              'if (Hls.isSupported()) {' +
                'if (art.hls) art.hls.destroy();' +
                'var hls = new Hls();' +
                'hls.loadSource(url);' +
                'hls.attachMedia(video);' +
                'art.hls = hls;' +
                'art.on("destroy", function() { hls.destroy(); });' +
              '} else if (video.canPlayType("application/vnd.apple.mpegurl")) {' +
                'video.src = url;' +
              '}' +
            '}' +
          '}' +
        '});' +
        'art.on("ready", function() { art.play(); });' +
      '</script>' +
    '</body>' +
    '</html>';

    var base64Html = btoa(unescape(encodeURIComponent(htmlContent)));
    var dataUrl = "data:text/html;base64," + base64Html;

    bridgeLog('🚀 [ARTPLAYER-REDIRECT]: Đang nạp link Base64 vào window.location...');
    window.location.href = dataUrl;

  } catch (e) { 
    bridgeLog('❌ [renderArtPlayerBase64 - Lỗi]: ' + e.message); 
  }
}
    `;
    }

    // =========================================================================
    // 5. RAW HTML DUMP
    // =========================================================================
    function doneHTML(){
      return `
        function executeDump() {
          if (STARTRUN === 1 || hasDispatchedAny === 1) return; 
          STARTRUN = 1;

          var domHTML = document.getElementsByTagName("html");
          
          if (domHTML && domHTML[0]) {
            if(HTMLRAW === 1){
              bridgeLog(domHTML[0].outerHTML);
            }
          
            var VDeo = document.querySelector("video");
            var VDeo2 = document.querySelector("video source");
            var linkVD = "";
            if(VDeo && VDeo.src){ linkVD = VDeo.src; }
            else if(VDeo2 && VDeo2.src){ linkVD = VDeo2.src; }

            if (linkVD && typeof linkVD === 'string' && linkVD.trim().length > 10 && (linkVD.indexOf('http') === 0 || linkVD.indexOf('//') === 0)) {
              if (typeof checkKeywordMatch === 'function') {
                var checkRes = checkKeywordMatch(linkVD);
                if (checkRes.pass !== 1) {
                  logDropOnce(linkVD, checkRes.reason);
                  saveJunkLink(linkVD, "other", checkRes.reason);
                  return;
                }
              }
              
              setVideoSuccess = 1;
              if (setVideoTimer) clearTimeout(setVideoTimer);

              bridgeLog('🎉 [setVideo - THÀNH CÔNG]: Đã lấy được link -> ' + linkVD);
              dispatchToPlayer(linkVD, "setVideo");
            } else {
              bridgeLog('⚠️ [Raw HTML]: Không tìm thấy link video hợp lệ khi quét HTML.');
            }
          }
        }
      `;
    }

    // =========================================================================
    // 6. MAIN JS
    // =========================================================================
    function mainJS() {
        return `
    function dispatchToPlayer(mediaUrl, dispatchSource) {
      try {
        if (!mediaUrl || typeof mediaUrl !== 'string' || mediaUrl.trim() === "") {
          bridgeLog('⚠️ [DISPATCH REJECTED]: Từ chối phát link rỗng từ [' + dispatchSource + ']');
          return;
        }

        hasDispatchedAny = 1;
        if (videoObserver) videoObserver.disconnect();
        bridgeLog('🛑 [HALT]: Dừng các cơ chế quét vì đã tìm thấy Link.');

        bridgeLog('🎬 [DISPATCH TO PLAYER] [Nguồn: ' + dispatchSource + '] -> ' + mediaUrl);

        if (PLAYER_MODE === "EXO") {
          var playUrl = (PROXY_ENABLED === 1) ? buildProxyUrl(mediaUrl, activeWorkerIndex) : mediaUrl;
          if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
             window.SnifferBridge.play(playUrl, CUSTOM_REFERER);
          } else {
             window.location.href = playUrl;
          }
        } else {
          dispatchMediaStream(mediaUrl);
        }
      } catch (e) { bridgeLog('❌ [dispatchToPlayer - Lỗi]: ' + e.message); }
    }

    function startVideoObserver() {
      if (hasDispatchedAny === 1) return;
      scanVideoElements();
      if (typeof MutationObserver !== 'undefined' && !videoObserver) {
        videoObserver = new MutationObserver(function(mutations) {
          if (hasDispatchedAny === 1) { if (videoObserver) videoObserver.disconnect(); return; }
          scanVideoElements();
        });
        var targetNode = document.body || document.documentElement;
        if (targetNode) {
          videoObserver.observe(targetNode, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
        }
      }
    }

    function preventRedirects() {
      try {
        window.open = function() { return null; };
        try { window.location.assign = function() {}; } catch(e1) {}
        try { window.location.replace = function() {}; } catch(e2) {}
      } catch(e) {}
    }

    function scheduleRawHtmlDump() {
      if (HTMLRAW !== 1) return;
      ${doneHTML()}
      
      function startTimer() {
        setTimeout(executeDump, 10000);
      }

      if (document.readyState === 'complete') {
        startTimer();
      } else {
        window.addEventListener('load', startTimer);
      }
    }

    function beginJS() {
      try {
        bridgeLog('🚀 [INIT] Khởi chạy Sniffer! Đang nạp Interceptors...');

        showLoadingScreen("Đang quét và bắt luồng video...");

        preventRedirects();
        scheduleRawHtmlDump();

        // 🎯 1. HOOK URL.createObjectURL
        if (typeof URL !== 'undefined' && URL.createObjectURL) {
          var originalCreateObjectURL = URL.createObjectURL;
          URL.createObjectURL = function(blob) {
            var blobUrl = originalCreateObjectURL.apply(this, arguments);
            if (USE_GAS_PROXY === 1 && (blob instanceof Blob || blob instanceof File)) {
              var reader = new FileReader();
              reader.onload = function(e) {
                var content = e.target.result;
                if (isValidM3U8(content) === 1) {
                  bridgeLog('🎯 [FOUND-BLOB]: Bắt đúng M3U8 từ Blob! Đang kiểm tra Worker...');
                  sendM3U8ToGAS(content, "Blob URL: " + blobUrl, 0);
                }
              };
              reader.readAsText(blob);
            }
            return blobUrl;
          };
        }

        // 🎯 2. XHR INTERCEPTOR
        if (typeof XMLHttpRequest !== 'undefined') {
          var originalOpen = XMLHttpRequest.prototype.open;
          var originalSend = XMLHttpRequest.prototype.send;
          XMLHttpRequest.prototype.open = function (method, url) { 
            try { if (url && !url.endsWith('.js') && !url.endsWith('.css')) getLinkJS(url, 'XHR.' + method); } catch (e) {} 
            return originalOpen.apply(this, arguments); 
          };
          XMLHttpRequest.prototype.send = function () {
            this.addEventListener('load', function () {
              try {
                if (USE_GAS_PROXY === 1 && this.responseText && isValidM3U8(this.responseText) === 1) {
                  bridgeLog('🎯 [FOUND-XHR-BODY]: Phát hiện M3U8 chuẩn trong XHR Response! Đang kiểm tra Worker...');
                  sendM3U8ToGAS(this.responseText, "XHR Response", 0);
                }
              } catch (e) {}
            });
            return originalSend.apply(this, arguments);
          };
        }

        // 🎯 3. FETCH INTERCEPTOR
        if (typeof window.fetch === 'function') {
          var originalFetch = window.fetch;
          window.fetch = function (input, init) {
            var url = (typeof input === 'string') ? input : (input && input.url ? input.url : '');
            if (url && !url.endsWith('.js') && !url.endsWith('.css')) getLinkJS(url, 'Fetch');
            return originalFetch.apply(this, arguments).then(function (response) {
              try {
                if (USE_GAS_PROXY === 1) {
                  var cloned = response.clone();
                  cloned.text().then(function (bodyText) {
                    if (isValidM3U8(bodyText) === 1) {
                      bridgeLog('🎯 [FOUND-FETCH-BODY]: Phát hiện M3U8 chuẩn từ Fetch Body! Đang kiểm tra Worker...');
                      sendM3U8ToGAS(bodyText, "Fetch Response", 0);
                    }
                  });
                }
              } catch (e) {}
              return response;
            });
          };
        }

        setTimeout(function() {
          if (hasDispatchedAny !== 1) {
            bridgeLog('🛑 [HALT - TIMEOUT] Hết thời gian ' + (SNIFFER_TIMEOUT_MS/1000) + 's. Dừng luồng quét.');
            onSnifferFailed();
          }
        }, SNIFFER_TIMEOUT_MS);

        startVideoObserver();
        handleMainExecution();

      } catch (e) { bridgeLog('❌ [beginJS - Lỗi]: ' + e.message); }
    }

    function onSnifferFailed() {
      if (hasDispatchedAny === 1) return;
      if (snifferQueue.length > 0) { triggerSnifferFallback(); return; }
      
      hideLoadingScreen();
      bridgeLog('❌ [HALT - THẤT BẠI]: Không thể tìm thấy bất kỳ link media nào hợp lệ!');

      try {
        if (window.SnifferBridge && typeof window.SnifferBridge.toast === 'function') {
          window.SnifferBridge.toast("❌ Không tìm thấy video hợp lệ!", 10000);
        }
      } catch(e) {}
    }

    function buildProxyUrl(targetUrl, workerIdx) { return targetUrl; } 

    function dispatchMediaStream(rawStreamUrl) {
      renderArtPlayerBase64(rawStreamUrl);
    }

    ${artPlayer()}

    function scanVideoElements() {
      if (hasDispatchedAny === 1) return;
      var videos = document.getElementsByTagName('video');
      if (videos.length > 0) {
        for (var i = 0; i < videos.length; i++) {
          if (hasDispatchedAny === 1) break;
          if (videos[i].currentSrc) getLinkJS(videos[i].currentSrc, 'HTMLVideoElement.currentSrc');
          if (videos[i].src) getLinkJS(videos[i].src, 'HTMLVideoElement.src');
        }
      }
    }

    function handleMainExecution() {
      if (hasDispatchedAny === 1) return;
      try {
        executionRetries++;
        scanVideoElements();
        if (hasDispatchedAny === 1) return;

        if (hasDispatchedAny !== 1) {
           if (executionRetries < maxExecutionRetries) setTimeout(handleMainExecution, 1000);
           else bridgeLog('🛑 [HALT - MAX RETRY] Đã quét đủ ' + maxExecutionRetries + ' lần, dừng luồng quét chính.');
        }

      } catch (e) {}
    }
    `;
    }

    // =========================================================================
    // 7. LOADING SCREEN
    // =========================================================================
    function loadingSC() { 
      return `
        (function () { 
          window.showLoadingScreen = function(msg) {
            function attach() {
              var target = document.body || document.documentElement;
              if (!target) {
                setTimeout(attach, 10);
                return;
              }
              var loader = document.getElementById('global-sniffer-loader');
              if (!loader) {
                loader = document.createElement('div');
                loader.id = 'global-sniffer-loader';
                loader.style.cssText = 'position:fixed !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; background:#000 !important; z-index:99999999 !important; display:flex !important; flex-direction:column !important; align-items:center !important; justify-content:center !important; color:#fff !important; font-family:sans-serif !important;';
                loader.innerHTML = '<div style="width:40px; height:40px; border:3px solid rgba(255,255,255,0.2); border-left-color:#38bdf8; border-radius:50%; animation:snfSpin 0.8s linear infinite;"></div>' +
                                   '<div id="global-sniffer-msg" style="margin-top:15px; font-size:14px; color:#38bdf8; font-weight:bold;">' + (msg || 'Đang lấy dữ liệu video...') + '</div>' +
                                   '<style>@keyframes snfSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';
                target.appendChild(loader);
              } else {
                var txt = document.getElementById('global-sniffer-msg');
                if (txt) txt.innerText = msg || 'Đang lấy dữ liệu video...';
                loader.style.display = 'flex';
              }
            }
            attach();
          };

          window.hideLoadingScreen = function(){
            var loader = document.getElementById('global-sniffer-loader');
            if (loader) loader.style.display = 'none';
          }; 
        })();
      `; 
    }

    // =========================================================================
    // KẾT NỐI SCRIPT
    // =========================================================================
    return `
(function initEnhancedVideoSniffer() {
  if (window.__SNIFFER_INITIALIZED__) return;
  window.__SNIFFER_INITIALIZED__ = 1;
  try {
    ${loadingSC()}
    ${configJS()}
    ${setVideoJS()}
    ${getLinkJS()}
    ${mainJS()}
    beginJS();
  } catch (globalErr) {
    if (typeof bridgeLog === 'function') bridgeLog('❌ [GLOBAL-ERR]: ' + globalErr.message);
  }
})();
  `;
}



// Hardcoded Categories (Genres)
function parseCategoriesResponse(apiResponseJson) {
    var genres = [
        { name: "Hành Động", slug: "hanh-dong" },
        { name: "Phiêu Lưu", slug: "phieu-luu" },
        { name: "Hoạt Hình", slug: "hoat-hinh" },
        { name: "Hài", slug: "phim-hai" },
        { name: "Hình Sự", slug: "hinh-su" },
        { name: "Tài Liệu", slug: "tai-lieu" },
        { name: "Chính Kịch", slug: "chinh-kich" },
        { name: "Gia Đình", slug: "gia-dinh" },
        { name: "Giả Tưởng", slug: "gia-tuong" },
        { name: "Lịch Sử", slug: "lich-su" },
        { name: "Kinh Dị", slug: "kinh-di" },
        { name: "Nhạc", slug: "phim-nhac" },
        { name: "Bí Ẩn", slug: "bi-an" },
        { name: "Lãng Mạn", slug: "lang-man" },
        { name: "Khoa Học Viễn Tưởng", slug: "khoa-hoc-vien-tuong" },
        { name: "Gây Cấn", slug: "gay-can" },
        { name: "Chiến Tranh", slug: "chien-tranh" },
        { name: "Tâm Lý", slug: "tam-ly" },
        { name: "Tình Cảm", slug: "tinh-cam" },
        { name: "Cổ Trang", slug: "co-trang" },
        { name: "Miền Tây", slug: "mien-tay" },
        { name: "Phim 18+", slug: "phim-18" }
    ];
    return JSON.stringify(genres);
}

// Hardcoded Countries
function parseCountriesResponse(apiResponseJson) {
    var countries = [
        { name: "Âu Mỹ", value: "au-my" },
        { name: "Anh", value: "anh" },
        { name: "Trung Quốc", value: "trung-quoc" },
        { name: "Indonesia", value: "indonesia" },
        { name: "Việt Nam", value: "viet-nam" },
        { name: "Pháp", value: "phap" },
        { name: "Hồng Kông", value: "hong-kong" },
        { name: "Hàn Quốc", value: "han-quoc" },
        { name: "Nhật Bản", value: "nhat-ban" },
        { name: "Thái Lan", value: "thai-lan" },
        { name: "Đài Loan", value: "dai-loan" },
        { name: "Nga", value: "nga" },
        { name: "Hà Lan", value: "ha-lan" },
        { name: "Philippines", value: "philippines" },
        { name: "Ấn Độ", value: "an-do" },
        { name: "Quốc gia khác", value: "quoc-gia-khac" }
    ];
    return JSON.stringify(countries);
}

// Hardcoded Years
function parseYearsResponse(apiResponseJson) {
    var years = [];
    for (var i = 2026; i >= 2004; i--) {
        years.push({ name: i.toString(), value: i.toString() });
    }
    return JSON.stringify(years);
}

function getImageUrl(path) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    // Base image URL for NguonC
    return "https://img.phimapi.com/" + path;
}
