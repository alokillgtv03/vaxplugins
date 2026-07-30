// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "nguoncnew",
        "name": "Phim NguonC Xoá Quảng Cáo",
        "version": "1.29",
        "baseUrl": "https://phim.nguonc.com",
        "iconUrl": "https://raw.githubusercontent.com/youngbi/repo/main/plugins/nguonC.png",
        "isEnabled": true,
        debug: true,
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
        var customjs = rawJS();
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
                "Custom-Js": customjs.trim()
            },
            "subtitles": []
        });
        
    } catch (e) {
        return JSON.stringify({ "url": "", "headers": {} });
    }
}



function rawJS(stream) {
  return `
(function () {
    var LOGGER = true;
    var EMBED_STREAM_URL = ${JSON.stringify(stream || '')};
    var GAS_BASE_URL = 'https://script.google.com/macros/s/AKfycbyxM6-_Q-DG_2l1hm1bM_ASVA74OPywVPk3hpm2FbpT78gGzBEpDN81Ty6tla8DTO27/exec';

    function log(step, msg, err) {
        if (!LOGGER) return;
        try {
            var time = new Date().toISOString().split('T')[1].slice(0, 8);
            var logText = '[CustomJS][' + time + '][' + step + '] ' + String(msg);
            if (err) logText += ' | ❌ ERROR: ' + (err.stack || err.message || String(err));
            
            if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
                window.SnifferBridge.log(logText);
            } else if (typeof console !== 'undefined') {
                if (err) console.error(logText);
                else console.log(logText);
            }
        } catch (e) {}
    }

    log('INIT', 'Khởi tạo hệ thống với URL = ' + EMBED_STREAM_URL);

    function ensureDOMReady(callback) {
        if (document && document.body) {
            callback();
        } else {
            var checkCount = 0;
            var checkTimer = setInterval(function () {
                checkCount++;
                if (document && document.body) {
                    clearInterval(checkTimer);
                    callback();
                } else if (checkCount > 200) {
                    clearInterval(checkTimer);
                }
            }, 30);
        }
    }

    var SmartStorage = (function() {
        var memCache = {};
        return {
            getItem: function(key, defaultVal) {
                try {
                    var val = localStorage.getItem(key);
                    return val !== null ? val : defaultVal;
                } catch(e) {
                    return memCache[key] !== undefined ? memCache[key] : defaultVal;
                }
            },
            setItem: function(key, val) {
                memCache[key] = val;
                try {
                    localStorage.setItem(key, val);
                } catch(e) {}
            }
        };
    })();

    // Chống mở tab/popup rác
    (function applyAntiPopupShield() {
        try {
            var dummyWin = { focus: function () {}, blur: function () {}, close: function () {}, closed: true, postMessage: function () {} };
            window.open = function () { return dummyWin; };
            var blockHandler = function (e) {
                var target = e.target;
                while (target && target !== document) {
                    if (target.id && target.id.indexOf('v-') === 0) return;
                    if (target.tagName === 'A' && (target.getAttribute('target') === '_blank' || target.target === '_blank')) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                    target = target.parentNode;
                }
            };
            window.addEventListener('click', blockHandler, true);
            window.addEventListener('touchstart', blockHandler, true);
        } catch (e) {}
    })();

    function injectStyles() {
        try {
            if (document.getElementById('v-style-block')) return;
            const style = document.createElement('style');
            style.id = 'v-style-block';
            style.textContent = 
                'html, body { margin: 0 !important; padding: 0 !important; width: 100vw !important; height: 100vh !important; overflow: hidden !important; background: #000 !important; }' +
                '#v-top-bar { position: fixed !important; top: 12px !important; right: 12px !important; z-index: 2147483647 !important; display: flex !important; gap: 8px !important; align-items: center !important; font-family: sans-serif !important; transition: opacity 0.4s ease !important; opacity: 1; }' +
                '.v-btn-act { background: rgba(15, 15, 15, 0.9) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.3) !important; padding: 8px 14px !important; border-radius: 6px !important; font-size: 13px !important; font-weight: bold !important; cursor: pointer !important; backdrop-filter: blur(8px) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.6) !important; white-space: nowrap !important; }' +
                '.v-btn-act:active { background: #e50914 !important; }' +
                '#v-box-list, #v-hist-box, #v-server-box { display: none; position: absolute !important; top: 100% !important; right: 0 !important; margin-top: 8px !important; background: rgba(18, 18, 18, 0.95) !important; padding: 12px !important; border-radius: 8px !important; border: 1px solid rgba(255,255,255,0.2) !important; z-index: 2147483647 !important; backdrop-filter: blur(10px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.8) !important; }' +
                '#v-box-list { grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)) !important; gap: 6px !important; width: 240px !important; max-height: 220px !important; overflow-y: auto !important; }' +
                '#v-hist-box { width: 260px !important; max-width: 85vw !important; flex-direction: column !important; gap: 10px !important; font-family: sans-serif !important; }' +
                '#v-server-box { width: 180px !important; flex-direction: column !important; gap: 6px !important; }' +
                '#v-box-list.closed, #v-hist-box.closed, #v-server-box.closed { display: none !important; }' +
                '#v-box-list.open { display: grid !important; }' +
                '#v-hist-box.open, #v-server-box.open { display: flex !important; }' +
                '.v-item-node { background: #222 !important; color: #fff !important; border: 1px solid #444 !important; border-radius: 5px !important; padding: 6px 0 !important; font-size: 12px !important; font-weight: bold !important; cursor: pointer !important; text-align: center !important; }' +
                '.v-item-node.active { background: #e50914 !important; border-color: #ff333d !important; }' +
                '.v-srv-item { background: #222 !important; color: #fff !important; border: 1px solid #444 !important; border-radius: 5px !important; padding: 8px 10px !important; font-size: 12px !important; font-weight: bold !important; cursor: pointer !important; text-align: left !important; }' +
                '.v-srv-item.active { background: #e50914 !important; border-color: #ff333d !important; }' +
                '.v-hist-btn-group { display: flex !important; gap: 8px !important; width: 100% !important; }' +
                '.v-hist-sub-btn { flex: 1 !important; padding: 8px 6px !important; border-radius: 6px !important; font-size: 11px !important; font-weight: bold !important; cursor: pointer !important; border: none !important; text-align: center !important; color: #fff !important; }' +
                '.v-btn-seen { background: #f39c12 !important; } .v-btn-next { background: #27ae60 !important; }' +
                '.v-arrow-btn { position: fixed !important; top: 50% !important; transform: translateY(-50%) !important; z-index: 2147483647 !important; background: rgba(0,0,0,0.6) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.3) !important; width: 42px !important; height: 42px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 18px !important; cursor: pointer !important; user-select: none !important; transition: opacity 0.4s ease !important; opacity: 1; }' +
                '#v-arrow-prev { left: 12px !important; } #v-arrow-next { right: 12px !important; }' +
                '.v-idle-fade { opacity: 0.2 !important; }';
            (document.head || document.documentElement).appendChild(style);
        } catch (e) {}
    }

    function showLoadingScreen(msg) {
        try {
            var loadingDiv = document.getElementById('v-stage-layer');
            if (!loadingDiv) {
                loadingDiv = document.createElement('div');
                loadingDiv.id = 'v-stage-layer';
                loadingDiv.style.cssText = 
                    'position: fixed !important; top: 0 !important; left: 0 !important;' +
                    'width: 100vw !important; height: 100vh !important; background-color: #0d0d0d !important;' +
                    'display: flex !important; flex-direction: column !important; justify-content: center !important;' +
                    'align-items: center !important; z-index: 2147483646 !important; font-family: sans-serif !important;';

                loadingDiv.innerHTML = 
                    '<div class="v-ring-spin"></div>' +
                    '<div id="v-stage-text" style="color:#ccc; margin-top:16px; font-size:14px; text-align:center;">' + (msg || 'Đang tải luồng phát...') + '</div>' +
                    '<style>.v-ring-spin { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.1); border-left-color: #e50914; border-radius: 50%; animation: v-spin 0.8s linear infinite; } @keyframes v-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';

                (document.body || document.documentElement).appendChild(loadingDiv);
            } else {
                var txt = document.getElementById('v-stage-text');
                if (txt) txt.innerHTML = msg || 'Đang tải luồng phát...';
                loadingDiv.style.display = 'flex';
            }
        } catch(e) {}
    }

    function hideLoadingScreen() {
        try {
            var elem = document.getElementById('v-stage-layer');
            if (elem) elem.style.display = 'none';
        } catch(e) {}
    }

    var idleTimer = null;
    function resetIdleTimer() {
        var topBar = document.getElementById('v-top-bar');
        var prevBtn = document.getElementById('v-arrow-prev');
        var nextBtn = document.getElementById('v-arrow-next');

        var elements = [topBar, prevBtn, nextBtn];
        
        elements.forEach(function(el) {
            if (el) el.classList.remove('v-idle-fade');
        });

        if (idleTimer) clearTimeout(idleTimer);
        
        idleTimer = setTimeout(function() {
            var gridDiv = document.getElementById('v-box-list');
            var histDiv = document.getElementById('v-hist-box');
            var serverDiv = document.getElementById('v-server-box');

            if (gridDiv) gridDiv.className = 'closed';
            if (histDiv) histDiv.className = 'closed';
            if (serverDiv) serverDiv.className = 'closed';

            elements.forEach(function(el) {
                if (el) el.classList.add('v-idle-fade');
            });
        }, 5000);
    }

    function setupAutoFadeEvents() {
        ['mousemove', 'mousedown', 'touchstart', 'touchmove', 'click', 'scroll'].forEach(function(evt) {
            window.addEventListener(evt, resetIdleTimer, true);
        });
        resetIdleTimer();
    }

    var currentEpisode = 1;
    var rawServersData = [];
    var currentServerIndex = 0;
    var episodeList = [];
    var seriesKey = 'default_series';
    var savedHistoryEpi = null;
    var isFirstLoadWithHist = false;
    var adObserver = null;
    var isSkippingAd = false;

    function parseStreamUrl(urlStr) {
        var result = { current: 1, listEpisodesUrl: '', embedUrl: urlStr };
        try {
            if (!urlStr) throw new Error('URL Stream trống!');
            var urlObj = new URL(urlStr);

            result.embedUrl = urlObj.origin + urlObj.pathname + '?hash=' + urlObj.searchParams.get('hash');

            var listUrl = urlObj.searchParams.get('episodes');
            if (listUrl) result.listEpisodesUrl = listUrl;

            var currentFound = urlObj.searchParams.get('current');
            if (currentFound) result.current = parseInt(currentFound, 10);

            if (listUrl) {
                var parts = listUrl.split('/');
                seriesKey = parts[parts.length - 1] || parts[parts.length - 2] || 'default_series';
            } else {
                seriesKey = urlObj.searchParams.get('hash') || 'default_series';
            }
        } catch(e) {}
        return result;
    }

    function saveHistory(epiNum) {
        try {
            SmartStorage.setItem('watch_hist_' + seriesKey, JSON.stringify({
                lastEpi: parseInt(epiNum, 10),
                time: Date.now()
            }));
        } catch(e) {}
    }

    function getHistory() {
        try {
            var raw = SmartStorage.getItem('watch_hist_' + seriesKey, null);
            if (!raw) return null;
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch(e) {
            return null;
        }
    }

    // =========================================================================
    // HÀM LẤY HTML & NẠP VÀO IFRAME
    // - useGasProxy = false: Tải trực tiếp URL trang gốc (Dùng cho lượt đầu tiên)
    // - useGasProxy = true: Tải qua Google Apps Script API (Dùng khi chuyển tập)
    // =========================================================================
    function fetchAndInjectEmbed(embedUrl, iframeElem, useGasProxy, callback) {
        showLoadingScreen('Đang kết nối luồng phát...');

        // 1. LẦN ĐẦU TẢI TRANG: Lấy trực tiếp từ trang gốc
        if (!useGasProxy) {
            log('DIRECT_FETCH', 'Lần đầu tải trang: Đang fetch trực tiếp từ trang gốc: ' + embedUrl);
            fetch(embedUrl)
                .then(function (res) {
                    if (!res.ok) throw new Error('Trang gốc báo lỗi HTTP: ' + res.status);
                    return res.text();
                })
                .then(function (html) {
                    log('DIRECT_SUCCESS', 'Đã tải HTML trực tiếp thành công. Đang inject vào iframe...');
                    injectHtmlToIframe(html, embedUrl, iframeElem);
                    if (typeof callback === 'function') callback();
                })
                .catch(function (err) {
                    log('DIRECT_ERR', 'Tải trực tiếp thất bại (' + err.message + '). Chuyển sang gán src trực tiếp...');
                    iframeElem.src = embedUrl;
                    if (typeof callback === 'function') callback();
                });
            return;
        }

        // 2. CHUYỂN TẬP: Dùng qua Google Apps Script (GAS) Proxy
        log('GAS_FETCH', 'Chuyển tập: Đang cào HTML qua Google Apps Script cho URL: ' + embedUrl);
        
        function requestGAS(useCheckApi) {
            var gasTargetUrl = GAS_BASE_URL + '?url=' + encodeURIComponent(embedUrl) + '&check=' + (useCheckApi ? 'true' : 'false');
            log('GAS_REQUEST', 'Gửi request tới GAS: check=' + useCheckApi);

            fetch(gasTargetUrl)
                .then(function (res) {
                    if (!res.ok) throw new Error('Mã HTTP lỗi từ GAS: ' + res.status);
                    return res.text();
                })
                .then(function (html) {
                    var isBlockedOr403 = !html || 
                                         html.trim() === '' || 
                                         html.indexOf('403') !== -1 || 
                                         html.indexOf('Forbidden') !== -1 ||
                                         html.indexOf('Access Denied') !== -1;

                    if (isBlockedOr403) {
                        throw new Error('Trang đích phản hồi lỗi 403 (Forbidden) hoặc bị chặn!');
                    }

                    log('GAS_SUCCESS', 'Cào HTML qua GAS thành công (check=' + useCheckApi + '). Injecting...');
                    injectHtmlToIframe(html, embedUrl, iframeElem);

                    if (typeof callback === 'function') callback();
                })
                .catch(function (err) {
                    log('GAS_ERR', 'Thất bại khi cào qua GAS (check=' + useCheckApi + '): ' + err.message);

                    if (!useCheckApi) {
                        log('GAS_RETRY_API', '⚠️ Bị chặn/Lỗi 403! Tự động bật API Bypass (check=true)...');
                        showLoadingScreen('Bypass bảo mật server (check=true)...');
                        requestGAS(true);
                    } else {
                        log('GAS_FALLBACK', 'Đã thử check=true vẫn không được. Chuyển sang gán src trực tiếp...');
                        iframeElem.src = embedUrl;
                        if (typeof callback === 'function') callback();
                    }
                });
        }

        requestGAS(false);
    }

    function injectHtmlToIframe(html, embedUrl, iframeElem) {
        var baseUrl = new URL(embedUrl).origin + new URL(embedUrl).pathname;
        var baseTag = '<base href="' + baseUrl + '">';
        var injectedHtml = html;

        if (html.indexOf('<head>') !== -1) {
            injectedHtml = html.replace('<head>', '<head>' + baseTag);
        } else {
            injectedHtml = baseTag + html;
        }

        iframeElem.removeAttribute('src');
        iframeElem.srcdoc = injectedHtml;
    }

    // =========================================================================
    // QUY TRÌNH HÀM LẮNG NGHE QUẢNG CÁO & TỰ ĐỘNG PLAY KHI CHUYỂN TẬP
    // =========================================================================
    function startAdWatcherOnIframe(iframeElem) {
        if (adObserver) {
            adObserver.disconnect();
            adObserver = null;
        }

        log('ADS_WATCHER', 'Bắt đầu theo dõi Iframe (Lắng nghe .jw-skip & Autoplay)...');

        var checkIframeDoc = function() {
            try {
                var iDoc = iframeElem.contentDocument || (iframeElem.contentWindow && iframeElem.contentWindow.document);
                if (!iDoc || !iDoc.body) return;

                var executeTripleSkip = function() {
                    if (isSkippingAd) return;
                    isSkippingAd = true;

                    log('ADS_DETECTED', 'Phát hiện Quảng Cáo hoặc Video dừng đột ngột! Bắt đầu tiến trình Skip 3 lần...');

                    var count = 0;
                    var interval = setInterval(function() {
                        count++;
                        try {
                            var skipBtn = iDoc.querySelector('.jw-skip');
                            if (skipBtn) {
                                skipBtn.click();
                                log('ADS_SKIP', 'Đã nhấn .jw-skip thành công lần ' + count + '/3');
                            } else {
                                log('ADS_SKIP', 'Thử nhấn lần ' + count + '/3 nhưng không thấy nút .jw-skip');
                            }
                        } catch(e) {
                            log('ADS_SKIP_ERR', 'Lỗi khi click nút .jw-skip lần ' + count, e);
                        }

                        if (count >= 3) {
                            clearInterval(interval);
                            isSkippingAd = false;
                            log('ADS_SKIP_DONE', 'Hoàn tất quy trình 3 lần nhấn Skip.');

                            var video = iDoc.querySelector('video');
                            if (video && video.paused) {
                                video.play().then(function() {
                                    log('AUTOPLAY', 'Video đã tiếp tục phát thành công sau khi Skip.');
                                }).catch(function(err) {
                                    log('AUTOPLAY_WARN', 'Chưa thể tự phát video sau Skip: ' + err.message);
                                });
                            }
                        }
                    }, 1000);
                };

                var bindVideoEvents = function() {
                    var video = iDoc.querySelector('video');
                    if (!video || video.dataset.vWatched) return;

                    video.dataset.vWatched = 'true';
                    log('VIDEO_FOUND', 'Đã liên kết thành công với thẻ Video trong Iframe.');

                    var attemptPlay = function() {
                        if (video.paused) {
                            log('AUTOPLAY', 'Video đã sẵn sàng. Tiến hành kích hoạt Autoplay...');
                            
                            var playPromise = video.play();
                            if (playPromise !== undefined) {
                                playPromise.then(function() {
                                    log('AUTOPLAY_SUCCESS', 'Tự động Play video thành công!');
                                }).catch(function(err) {
                                    log('AUTOPLAY_BLOCKED', 'Trình duyệt chặn Autoplay có tiếng. Thử Mute để kích hoạt...', err);
                                    
                                    video.muted = true;
                                    video.play().then(function() {
                                        log('AUTOPLAY_MUTED_SUCCESS', 'Phát Autoplay Muted thành công!');
                                    }).catch(function(e2) {
                                        log('AUTOPLAY_FATAL', 'Thử mọi cách nhưng Autoplay vẫn bị từ chối', e2);
                                    });
                                });
                            }
                        }
                    };

                    video.addEventListener('canplay', attemptPlay);
                    video.addEventListener('loadeddata', attemptPlay);

                    video.addEventListener('pause', function() {
                        if (!video.ended) {
                            log('VIDEO_PAUSED', 'Video bị tạm dừng đột ngột! Kiểm tra quảng cáo...');
                            setTimeout(function() {
                                var skipBtn = iDoc.querySelector('.jw-skip');
                                if (skipBtn) {
                                    executeTripleSkip();
                                }
                            }, 500);
                        }
                    });

                    attemptPlay();
                };

                adObserver = new MutationObserver(function() {
                    bindVideoEvents();

                    var skipBtn = iDoc.querySelector('.jw-skip');
                    if (skipBtn && !isSkippingAd) {
                        executeTripleSkip();
                    }
                });

                adObserver.observe(iDoc.body || iDoc.documentElement, {
                    childList: true,
                    subtree: true,
                    attributes: true
                });

                bindVideoEvents();
                if (iDoc.querySelector('.jw-skip')) {
                    executeTripleSkip();
                }

            } catch (err) {
                log('ADS_ERR', 'Lỗi can thiệp DOM Iframe', err);
            }
        };

        iframeElem.onload = function() {
            hideLoadingScreen();
            iframeElem.style.visibility = 'visible';
            checkIframeDoc();
        };

        if (iframeElem.contentDocument && iframeElem.contentDocument.readyState === 'complete') {
            hideLoadingScreen();
            iframeElem.style.visibility = 'visible';
            checkIframeDoc();
        }
    }

    function updateEpisodeListFromCurrentServer() {
        if (!rawServersData[currentServerIndex]) return;
        var items = rawServersData[currentServerIndex].items || [];
        episodeList = [];
        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            var epNum = parseInt(item.name, 10) || (j + 1);
            episodeList.push({
                name: "Tập " + epNum,
                num: epNum,
                streamUrl: item.embed
            });
        }
    }

    function switchServer(serverIdx) {
        try {
            currentServerIndex = serverIdx;
            updateEpisodeListFromCurrentServer();

            var targetEpi = episodeList.find(function(x) { return Number(x.num) === Number(currentEpisode); });
            if (!targetEpi) targetEpi = episodeList[0];

            if (targetEpi) {
                loadEpisode(targetEpi);
            } else {
                buildUI();
            }
        } catch(e) {}
    }

    // =========================================================================
    // TẢI TẬP PHIM KHI NGƯỜI DÙNG BẤM CHUYỂN TẬP
    // =========================================================================
    function loadEpisode(epiItem) {
        try {
            showLoadingScreen('Đang chuyển sang Tập ' + epiItem.num + '...');
            currentEpisode = parseInt(epiItem.num, 10);
            
            saveHistory(currentEpisode);
            isFirstLoadWithHist = false; 

            var iframe = document.getElementById('v-media-frame');
            if (iframe) {
                iframe.style.visibility = 'hidden';
                
                // Bấm chuyển tập -> useGasProxy = true (Google Apps Script)
                fetchAndInjectEmbed(epiItem.streamUrl, iframe, true, function() {
                    startAdWatcherOnIframe(iframe);
                });
            }

            buildUI();
        } catch(e) {}
    }

    function buildUI() {
        try {
            injectStyles();
            var parent = document.body || document.documentElement;

            var oldHeader = document.getElementById('v-top-bar'); if (oldHeader) oldHeader.remove();
            var oldPrev = document.getElementById('v-arrow-prev'); if (oldPrev) oldPrev.remove();
            var oldNext = document.getElementById('v-arrow-next'); if (oldNext) oldNext.remove();

            const headerDiv = document.createElement('div');
            headerDiv.id = 'v-top-bar';

            // 1. SERVER TOGGLE
            const srvWrapper = document.createElement('div');
            srvWrapper.style.position = 'relative';

            if (rawServersData.length > 0) {
                const srvToggleBtn = document.createElement('button');
                srvToggleBtn.className = 'v-btn-act';
                var curSrvName = rawServersData[currentServerIndex] ? rawServersData[currentServerIndex].server_name : 'Server';
                srvToggleBtn.innerHTML = '🌐 ' + curSrvName + ' &#9660;';

                const srvDiv = document.createElement('div');
                srvDiv.id = 'v-server-box';
                srvDiv.className = 'closed';

                rawServersData.forEach(function(srv, idx) {
                    const btn = document.createElement('button');
                    btn.className = 'v-srv-item' + (idx === currentServerIndex ? ' active' : '');
                    btn.textContent = srv.server_name;
                    btn.onclick = function (e) {
                        e.stopPropagation();
                        srvDiv.className = 'closed';
                        if (idx !== currentServerIndex) switchServer(idx);
                    };
                    srvDiv.appendChild(btn);
                });

                srvWrapper.appendChild(srvToggleBtn);
                srvWrapper.appendChild(srvDiv);

                srvToggleBtn.onclick = function (e) {
                    e.stopPropagation();
                    gridDiv.className = 'closed';
                    histDiv.className = 'closed';
                    srvDiv.className = srvDiv.classList.contains('open') ? 'closed' : 'open';
                };
            }

            // 2. EPISODE TOGGLE
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'v-btn-act';
            toggleBtn.innerHTML = 'Tập ' + currentEpisode + ' &#9660;';

            const gridDiv = document.createElement('div');
            gridDiv.id = 'v-box-list';
            gridDiv.className = 'closed';

            episodeList.forEach(function(item) {
                const btn = document.createElement('button');
                const isCurrent = Number(item.num) === Number(currentEpisode);
                btn.className = 'v-item-node' + (isCurrent ? ' active' : '');
                btn.textContent = 'Tập ' + item.num;
                btn.onclick = function (e) {
                    e.stopPropagation();
                    gridDiv.className = 'closed';
                    if (Number(item.num) !== Number(currentEpisode)) loadEpisode(item);
                };
                gridDiv.appendChild(btn);
            });

            const epiWrapper = document.createElement('div');
            epiWrapper.style.position = 'relative';
            epiWrapper.appendChild(toggleBtn);
            epiWrapper.appendChild(gridDiv);

            toggleBtn.onclick = function (e) {
                e.stopPropagation();
                histDiv.className = 'closed';
                var srvDiv = document.getElementById('v-server-box');
                if (srvDiv) srvDiv.className = 'closed';
                gridDiv.className = gridDiv.classList.contains('open') ? 'closed' : 'open';
            };

            // 3. HISTORY TOGGLE
            const histBtn = document.createElement('button');
            histBtn.className = 'v-btn-act';
            histBtn.innerHTML = '📜 Lịch sử';

            const histDiv = document.createElement('div');
            histDiv.id = 'v-hist-box';
            
            var hasValidHist = savedHistoryEpi !== null && 
                               Number(currentEpisode) !== Number(savedHistoryEpi) && 
                               Number(currentEpisode) !== (Number(savedHistoryEpi) + 1);

            if (hasValidHist) {
                var nextEpiOfHist = Number(savedHistoryEpi) + 1;
                histDiv.innerHTML = 
                    '<div style="font-size: 13px; color: #fff; text-align: center;">Lần trước bạn đã xem ở <b>Tập ' + savedHistoryEpi + '</b></div>' +
                    '<div class="v-hist-btn-group">' +
                        '<button id="v-btn-hist-seen" class="v-hist-sub-btn v-btn-seen">Tập đã xem (' + savedHistoryEpi + ')</button>' +
                        '<button id="v-btn-hist-next" class="v-hist-sub-btn v-btn-next">Tập kế tiếp (' + nextEpiOfHist + ')</button>' +
                    '</div>';
            } else {
                histDiv.innerHTML = '<div style="font-size: 12px; color: #aaa; text-align: center;">Chưa có lịch sử phù hợp.</div>';
            }

            if (isFirstLoadWithHist && hasValidHist) {
                histDiv.className = 'open';
            } else {
                histDiv.className = 'closed';
            }

            const histWrapper = document.createElement('div');
            histWrapper.style.position = 'relative';
            histWrapper.appendChild(histBtn);
            histWrapper.appendChild(histDiv);

            histBtn.onclick = function (e) {
                e.stopPropagation();
                gridDiv.className = 'closed';
                var srvDiv = document.getElementById('v-server-box');
                if (srvDiv) srvDiv.className = 'closed';
                histDiv.className = histDiv.classList.contains('open') ? 'closed' : 'open';
            };

            var hideMenusOnOutsideClick = function (e) {
                var target = e.target;
                var srvDiv = document.getElementById('v-server-box');
                if (!epiWrapper.contains(target) && !histWrapper.contains(target) && (!srvWrapper || !srvWrapper.contains(target))) {
                    gridDiv.className = 'closed';
                    histDiv.className = 'closed';
                    if (srvDiv) srvDiv.className = 'closed';
                }
            };
            window.addEventListener('click', hideMenusOnOutsideClick, true);
            window.addEventListener('touchstart', hideMenusOnOutsideClick, true);

            if (rawServersData.length > 0) headerDiv.appendChild(srvWrapper);
            headerDiv.appendChild(epiWrapper);
            headerDiv.appendChild(histWrapper);
            parent.appendChild(headerDiv);

            if (hasValidHist) {
                var btnSeen = histDiv.querySelector('#v-btn-hist-seen');
                if (btnSeen) {
                    btnSeen.onclick = function(e) {
                        e.stopPropagation();
                        histDiv.className = 'closed';
                        var targetItem = episodeList.find(function(x) { return Number(x.num) === Number(savedHistoryEpi); });
                        if (targetItem) loadEpisode(targetItem);
                    };
                }

                var btnNext = histDiv.querySelector('#v-btn-hist-next');
                if (btnNext) {
                    btnNext.onclick = function(e) {
                        e.stopPropagation();
                        histDiv.className = 'closed';
                        var targetItem = episodeList.find(function(x) { return Number(x.num) === (Number(savedHistoryEpi) + 1); });
                        if (targetItem) loadEpisode(targetItem);
                    };
                }
            }

            // 4. PREV / NEXT ARROWS
            var currentIndex = episodeList.findIndex(function(x) { return Number(x.num) === Number(currentEpisode); });
            if (currentIndex > 0) {
                const prevBtn = document.createElement('div');
                prevBtn.className = 'v-arrow-btn';
                prevBtn.id = 'v-arrow-prev';
                prevBtn.innerHTML = '❮';
                prevBtn.onclick = function () { loadEpisode(episodeList[currentIndex - 1]); };
                parent.appendChild(prevBtn);
            }

            if (currentIndex >= 0 && currentIndex < episodeList.length - 1) {
                const nextBtn = document.createElement('div');
                nextBtn.className = 'v-arrow-btn';
                nextBtn.id = 'v-arrow-next';
                nextBtn.innerHTML = '❯';
                nextBtn.onclick = function () { loadEpisode(episodeList[currentIndex + 1]); };
                parent.appendChild(nextBtn);
            }

            setupAutoFadeEvents();
        } catch(e) {}
    }

    ensureDOMReady(function() {
        try {
            showLoadingScreen('Đang nạp luồng phát...');
            document.body.style.cssText = 'margin: 0 !important; padding: 0 !important; width: 100vw !important; height: 100vh !important; overflow: hidden !important; background-color: #000 !important;';
            document.body.innerHTML = '';

            var parsed = parseStreamUrl(EMBED_STREAM_URL);
            currentEpisode = parsed.current;

            var prevHist = getHistory();
            if (prevHist && prevHist.lastEpi) {
                savedHistoryEpi = parseInt(prevHist.lastEpi, 10);
                
                if (Number(currentEpisode) !== Number(savedHistoryEpi) && 
                    Number(currentEpisode) !== (Number(savedHistoryEpi) + 1)) {
                    isFirstLoadWithHist = true; 
                }
            }

            // Tạo Iframe
            var mainIframe = document.createElement('iframe');
            mainIframe.id = 'v-media-frame';
            mainIframe.style.cssText = 'width: 100vw; height: 100vh; border: 0; position: fixed; top: 0; left: 0; z-index: 1; visibility: hidden;';
            mainIframe.setAttribute('allowfullscreen', 'true');
            mainIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-presentation');
            document.body.appendChild(mainIframe);

            saveHistory(currentEpisode);

            // =========================================================================
            // LẦN ĐẦU TẢI TRANG: useGasProxy = false (Fetch trực tiếp từ trang gốc)
            // =========================================================================
            fetchAndInjectEmbed(EMBED_STREAM_URL, mainIframe, false, function() {
                startAdWatcherOnIframe(mainIframe);
            });

            if (parsed.listEpisodesUrl) {
                fetch(parsed.listEpisodesUrl)
                    .then(function(res) { return res.json(); })
                    .then(function(resData) {
                        if (resData && resData.status === 'success' && resData.movie && resData.movie.episodes) {
                            rawServersData = resData.movie.episodes || [];
                            
                            var tmIndex = rawServersData.findIndex(function(s) {
                                var name = (s.server_name || '').toLowerCase();
                                return name.indexOf('thuyết minh') !== -1 || name.indexOf('thuyet minh') !== -1;
                            });

                            if (tmIndex !== -1) {
                                currentServerIndex = tmIndex;
                            } else {
                                currentServerIndex = 0;
                            }

                            updateEpisodeListFromCurrentServer();

                            var curEpiObj = episodeList.find(function(x) { return Number(x.num) === Number(currentEpisode); });
                            if (curEpiObj && curEpiObj.streamUrl && curEpiObj.streamUrl !== EMBED_STREAM_URL) {
                                // Tải trang gốc cho lần đầu
                                fetchAndInjectEmbed(curEpiObj.streamUrl, mainIframe, false, function() {
                                    startAdWatcherOnIframe(mainIframe);
                                });
                            }

                            buildUI();
                        } else {
                            throw new Error('Cấu trúc JSON API không phù hợp');
                        }
                    })
                    .catch(function(err) {
                        log('API_ERR', 'Không fetch được danh sách tập', err);
                        episodeList = [{ num: currentEpisode, streamUrl: EMBED_STREAM_URL }];
                        buildUI();
                    });
            } else {
                episodeList = [{ num: currentEpisode, streamUrl: EMBED_STREAM_URL }];
                buildUI();
            }

        } catch(mainErr) {
            log('FATAL', 'Lỗi nghiêm trọng khi khởi tạo', mainErr);
            hideLoadingScreen();
        }
    });
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
