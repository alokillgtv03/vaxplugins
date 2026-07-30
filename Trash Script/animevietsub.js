
BASEURL = "https://animevietsub.ad"
DEV = false;

function getManifest() {
    return JSON.stringify({
        "id": "animevietsub",
        "name": "AnimeVietSub",
        "version": "1.1.2",
        "baseUrl": "https://animevietsub.ad",
      	"info": "Nguồn phim Anime chất lượng. Nguồn này hay bị nhà mạng chặn. Các bạn hãy dùng APP 1.1.1.1 hoặc DNS và DPI trên app để xem nhé.",
        "iconUrl": "https://animevietsub.ad/statics/default/images/logo.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "embed"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'anime-moi-cap-nhat', title: 'Anime Mới Cập Nhật', type: 'Grid', path: '/' },
        { slug: 'anime-bo', title: 'Anime Bộ', type: 'Horizontal', path: 'anime-bo' },
        { slug: 'anime-le', title: 'Anime Lẻ/Movie', type: 'Horizontal', path: 'anime-le' },
        { slug: 'hoat-hinh-trung-quoc', title: 'HH Trung Quốc', type: 'Horizontal', path: 'hoat-hinh-trung-quoc' },
        { slug: 'anime-sap-chieu', title: 'Anime Sắp Chiếu', type: 'Horizontal', path: 'anime-sap-chieu' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Anime Bộ', slug: 'anime-bo' },
        { name: 'Anime Lẻ', slug: 'anime-le' },
        { name: 'HH Trung Quốc', slug: 'hoat-hinh-trung-quoc' },
        { name: 'Anime Sắp Chiếu', slug: 'anime-sap-chieu' },
        { name: 'Hành Động', slug: 'the-loai/hanh-dong' },
        { name: 'Phiêu Lưu', slug: 'the-loai/phieu-luu' },
        { name: 'Hài Hước', slug: 'the-loai/hai-huoc' },
        { name: 'Phép Thuật', slug: 'the-loai/phep-thuat' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'latest' },
            { name: 'Lượt xem', value: 'view' },
            { name: 'Bình chọn', value: 'rating' }
        ]
    });
}

// Helper log
function log(msg) {
    if (typeof console !== 'undefined' && console.log) {
        console.log("[AnimeVsubPlugin] " + msg);
    }
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var sort = filters.sort || "latest";

        var targetSlug = slug;
        if (filters.category) {
            targetSlug = "the-loai/" + filters.category;
        }

        // Clean slug
        if (targetSlug.startsWith("/")) targetSlug = targetSlug.substring(1);
        if (targetSlug.endsWith("/")) targetSlug = targetSlug.substring(0, targetSlug.length - 1);

        var baseUrl = BASEURL;
        
        // Handle Trang chủ (phim mới cập nhật)
        if (targetSlug === 'anime-moi-cap-nhat' || targetSlug === '') {
            if (page === 1) return baseUrl + "/";
            return baseUrl + "/anime-moi-cap-nhat/trang-" + page + ".html";
        }

        // Handle path format
        if (page === 1) {
            return baseUrl + "/" + targetSlug + "/";
        } else {
            return baseUrl + "/" + targetSlug + "/trang-" + page + ".html";
        }
    } catch (e) {
        return BASEURL;
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var cleanKeyword = encodeURIComponent(keyword.trim());
        
        if (page === 1) {
            return BASEURL + "/tim-kiem/" + cleanKeyword + "/";
        } else {
            return BASEURL + "/tim-kiem/" + cleanKeyword + "/trang-" + page + ".html";
        }
    } catch (e) {
        return BASEURL;
    }
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    // Clean slug
    var cleanSlug = slug;
    if (cleanSlug.startsWith("/")) cleanSlug = cleanSlug.substring(1);
    if (cleanSlug.startsWith("phim/")) cleanSlug = cleanSlug.substring(5);
    
    return BASEURL + "/phim/" + cleanSlug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return BASEURL; }
function getUrlYears() { return BASEURL; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(htmlContent) {
    try {
        var movies = [];
        var seen = {};

        // Helper: extract movie from card HTML
        function extractMovie(cardHtml) {
            var linkMatch = /<a\s+[^>]*href="([^"]*\/phim\/[^"]+)"[^>]*(?:title="([^"]+)")?/i.exec(cardHtml);
            if (!linkMatch) {
                linkMatch = /<a\s+href="([^"]+)"\s+title="([^"]+)"/i.exec(cardHtml);
            }
            if (!linkMatch) return null;

            var href = linkMatch[1];
            var slug = href;
            var slugMatch = /\/phim\/([^/]+)/.exec(href);
            if (slugMatch) {
                slug = slugMatch[1];
            } else {
                slug = href.substring(href.lastIndexOf('/') + 1) || href;
            }
            // Loại bỏ trailing slash
            slug = slug.replace(/\/$/, '');
            if (seen[slug]) return null;
            seen[slug] = true;

            var epMatch = /<span class="mli-eps">[\s\S]*?<i>([^<]+)<\/i>/i.exec(cardHtml);
            var episode_current = epMatch ? "Tập " + epMatch[1].trim() : "";

            var imgMatch = /<img[^>]*(?:src|data-src)="([^"]+)"/i.exec(cardHtml);
            var posterUrl = imgMatch ? imgMatch[1] : "";

            // Title: h2.Title hoặc div.Title hoặc fallback title attribute
            var titleMatch = /<h2[^>]*class="Title"[^>]*>([\s\S]*?)<\/h2>/i.exec(cardHtml)
                || /<div class="Title">([\s\S]*?)<\/div>/i.exec(cardHtml);
            var title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : (linkMatch[2] || "");

            var year = 0;
            var yearMatch = /<span class="Date[^"]*">\s*(\d{4})\s*<\/span>/i.exec(cardHtml)
                || /\((\d{4})\)/.exec(title);
            if (yearMatch) year = parseInt(yearMatch[1]);

            return {
                id: slug,
                title: title,
                posterUrl: posterUrl,
                backdropUrl: posterUrl,
                year: year,
                quality: "FHD",
                episode_current: episode_current,
                lang: "Vietsub"
            };
        }

        // Pattern 1: <article class="TPost C ..."> (trang danh mục)
        var articlePattern = /<article class="TPost[^"]*">[\s\S]*?<\/article>/gi;
        var match;
        while ((match = articlePattern.exec(htmlContent)) !== null) {
            var movie = extractMovie(match[0]);
            if (movie) movies.push(movie);
        }

        // Pattern 2: <li> trong <ul class="MovieList Newepisode"> (trang chủ)
        if (movies.length === 0) {
            var listBlock = /<ul class="MovieList Newepisode">[\s\S]*?<\/ul>/i.exec(htmlContent);
            if (listBlock) {
                var liPattern = /<li>[\s\S]*?<\/li>/gi;
                while ((match = liPattern.exec(listBlock[0])) !== null) {
                    var movie = extractMovie(match[0]);
                    if (movie) movies.push(movie);
                }
            }
        }

        // Pattern 3: Fallback - <div class="TPost B"> (sidebar cards)
        if (movies.length === 0) {
            var divPattern = /<div class="TPost[^"]*">[\s\S]*?<\/div>\s*<\/div>/gi;
            while ((match = divPattern.exec(htmlContent)) !== null) {
                var movie = extractMovie(match[0]);
                if (movie) movies.push(movie);
            }
        }

        // Parse phân trang
        var totalPages = 1;
        var lastPageMatch = /href="[^"]*trang-(\d+)\.html"[^>]*>Trang Cuối<\/a>/i.exec(htmlContent);
        if (lastPageMatch) {
            totalPages = parseInt(lastPageMatch[1]);
        } else {
            var pagePattern = /class="page[^"]*">(\d+)<\/a>/gi;
            var pMatch;
            while ((pMatch = pagePattern.exec(htmlContent)) !== null) {
                var pNum = parseInt(pMatch[1]);
                if (pNum > totalPages) totalPages = pNum;
            }
        }

        var currentPage = 1;
        var curPageMatch = /class="[^"]*current[^"]*">(\d+)<\/span>/i.exec(htmlContent);
        if (curPageMatch) currentPage = parseInt(curPageMatch[1]);

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages
            }
        });
    } catch (e) {
        log("parseListResponse error: " + e.message);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(htmlContent) {
    return parseListResponse(htmlContent);
}

function parseMovieDetail(htmlContent) {
    try {
        var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(htmlContent) || /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(htmlContent);
        var id = idMatch ? idMatch[1] : "";

        var titleMatch = /<h1[^>]* itemprop="name">([\s\S]*?)<\/h1>/i.exec(htmlContent) || /<h1 class="title">([\s\S]*?)<\/h1>/i.exec(htmlContent);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "";

        var descMatch = /<div class="Description[^"]*" itemprop="description">([\s\S]*?)<\/div>/i.exec(htmlContent) || /<div id="film-info-desc"[^>]*>([\s\S]*?)<\/div>/i.exec(htmlContent);
        var description = descMatch ? descMatch[1].replace(/<[^>]*>/g, "").trim() : "";

        var posterMatch = /<img[^>]*class="[^"]*attachment-img-mov-md[^"]*"[^>]*(?:src|data-src)="([^"]+)"/i.exec(htmlContent) || /<img class="poster"[^>]*(?:src|data-src)="([^"]+)"/i.exec(htmlContent);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var genres = [];
        var genreBlockMatch = /<li>\s*<span class="info-title">Thể loại:<\/span>([\s\S]*?)<\/li>/i.exec(htmlContent) || /Thể loại:([\s\S]*?)(?:<br|<\/li>)/i.exec(htmlContent);
        if (genreBlockMatch) {
            var genreMatch;
            var genrePattern = /<a[^>]*>([^<]+)<\/a>/gi;
            while ((genreMatch = genrePattern.exec(genreBlockMatch[1])) !== null) {
                genres.push(genreMatch[1].trim());
            }
        }

        var countries = [];
        var countryBlockMatch = /<li>\s*<span class="info-title">Quốc gia:<\/span>([\s\S]*?)<\/li>/i.exec(htmlContent);
        if (countryBlockMatch) {
            var countryMatch;
            var countryPattern = /<a[^>]*>([^<]+)<\/a>/gi;
            while ((countryMatch = countryPattern.exec(countryBlockMatch[1])) !== null) {
                countries.push(countryMatch[1].trim());
            }
        }

        var year = 0;
        var yearMatch = /<li>\s*<span class="info-title">Năm phát hành:<\/span>[\s\S]*?<a[^>]*>(\d{4})<\/a>/i.exec(htmlContent) || /Season:[\s\S]*?- (\d{4})/i.exec(htmlContent);
        if (yearMatch) year = parseInt(yearMatch[1]);

        var statusMatch = /<li>\s*<span class="info-title">Trạng thái:<\/span>\s*([\s\S]*?)<\/li>/i.exec(htmlContent);
        var status = statusMatch ? statusMatch[1].replace(/<[^>]*>/g, "").trim() : "";

        var episode_current = "";
        if (status) {
            var epMatch2 = /(Tập \d+|Full|Hoàn Tất)/i.exec(status);
            if (epMatch2) episode_current = epMatch2[1];
        }

        // Parse danh sách tập phim
        var episodes = [];
        var epPattern = /<a\s+[^>]*href="([^"]*\/tap-[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        var epMatch;
        while ((epMatch = epPattern.exec(htmlContent)) !== null) {
            var epUrl = epMatch[1];
            var epName = epMatch[2].replace(/<[^>]*>/g, "").trim();
            
            if (epUrl.indexOf('http') !== 0) {
                epUrl = BASEURL + (epUrl.startsWith('/') ? '' : '/') + epUrl;
            }
            
            // Tránh add trùng tập
            var isDuplicate = false;
            for (var i = 0; i < episodes.length; i++) {
                if (episodes[i].id === epUrl) {
                    isDuplicate = true;
                    break;
                }
            }
            if (!isDuplicate) {
                episodes.push({
                    id: epUrl,
                    name: epName,
                    slug: epUrl
                });
            }
        }

        // Sắp xếp các tập phim theo thứ tự tăng dần (ví dụ Tập 1 -> Tập 13)
        episodes.sort(function(a, b) {
            var epA = parseInt(a.name) || 0;
            var epB = parseInt(b.name) || 0;
            return epA - epB;
        });

        var servers = [];
        if (episodes.length > 0) {
            servers.push({
                name: "AnimeVsub",
                episodes: episodes
            });
        }

        // Trích xuất slug từ canonical URL hoặc og:url (id)
        var slug = "";
        if (id) {
            var slugMatch = /\/phim\/([^/]+)/.exec(id);
            slug = slugMatch ? slugMatch[1] : id;
        }
        if (!slug) {
            var slugMatch2 = /\/phim\/([^/]+)/.exec(htmlContent);
            slug = slugMatch2 ? slugMatch2[1] : "";
        }

        // Tạo extra url để tải đầy đủ tập từ trang xem-phim
        // Kiểm tra bằng canonical URL (biến id) thay vì search toàn HTML vì trang
        // detail có nav link chứa chuỗi "xem-phim" gây nhận nhầm.
        var extra = "";
        var isPlayPage = (id && id.indexOf("xem-phim") > -1) || htmlContent.indexOf("window.PLAYER_DATA") > -1;
        if (!isPlayPage && slug && slug !== "error") {
            extra = BASEURL + "/phim/" + slug + "/xem-phim.html";
        }

        return JSON.stringify({
            id: slug,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            year: year,
            servers: servers,
            episode_current: episode_current,
            lang: "Vietsub",
            quality: "FHD",
            category: genres.join(", "),
            country: countries.join(", "),
            status: status,
            extra: extra
        });
    } catch (e) {
        log("parseMovieDetail error: " + e.message);
        return JSON.stringify({ id: "error", title: "", servers: [] });
    }
}

function parseDetailResponse(htmlContent, pageUrl) {
    try {
        log("parseDetailResponse input pageUrl: " + pageUrl);

        var link = "";
        // Lấy link iframe từ trang hiện tại (PLAYER_DATA)
        var match = /window\.PLAYER_DATA\s*=\s*(\{[\s\S]*?\});/.exec(htmlContent);
        if (match) {
            try {
                var data = JSON.parse(match[1]);
                if (data && data.link) {
                    link = data.link;
                }
            } catch (err) {}
        }
        
        // Fallback quét iframe nếu không tìm thấy PLAYER_DATA
        if (!link) {
            var iframeMatch = htmlContent.match(/<iframe[^>]*src="([^"]+)"/i);
            if (iframeMatch) {
                link = iframeMatch[1];
            }
        }
        
        if (link && link.indexOf('//') === 0) {
            link = "https:" + link;
        }

        var bypassJs = customJS(link);
            
        return JSON.stringify({
            url: pageUrl,
            isEmbed: false,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": pageUrl || "https://animevietsub.wiki/",
              	"Block-Ads": "true",
                "Custom-Js": bypassJs,

            },
            subtitles: []
        });
    } catch (e) {
        log("parseDetailResponse error: " + e.message);
        return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });
    }
}

function customJS(initialLink){
  return `
(function() {
    // 0. XỬ LÝ LỖI LOCALSTORAGE (Memory Fallback tránh SecurityError)
    const memoryStore = {};
    function safeGetStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return memoryStore[key] || null;
        }
    }
    function safeSetStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            memoryStore[key] = String(value);
        }
    }

    // 1. CSS & LOADING LAYER (Tránh từ khóa 'overlay' hay 'popup' khiến AdBlocker ẩn)
    let styleTag = document.createElement('style');
    styleTag.textContent = \`
        margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; background: #000;
        @keyframes v-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    \`;
    if (document.head) document.head.appendChild(styleTag);
    else document.documentElement.appendChild(styleTag);

    let loaderBlock = document.createElement('section');
    loaderBlock.id = 'v-loader-layer';
    Object.assign(loaderBlock.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: '#000', zIndex: '80', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        pointerEvents: 'none', opacity: '1', transition: 'opacity 0.3s ease'
    });
    loaderBlock.innerHTML = \`
        <div style="border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #e50914; border-radius: 50%; width: 36px; height: 36px; animation: v-spin 0.8s linear infinite;"></div>
        <div style="margin-top: 12px; font-size: 12px; color: #a1a1aa;">Đang tải...</div>
    \`;
    
    if (document.body) document.body.appendChild(loaderBlock);
    else document.documentElement.appendChild(loaderBlock);

    // Vô hiệu hóa window.open an toàn
    try {
        window.open = function() { return null; };
    } catch(e) {}

    function init() {
        const episodeLinks = document.querySelectorAll(".episode .episode-link");
        const allEpisodes = [];
        episodeLinks.forEach((link, index) => {
            const url = link.getAttribute("href");
            const title = link.getAttribute("title") || ("Tập " + link.textContent.trim());
            if (url) allEpisodes.push({ index, title, url });
        });

        let currentPlayingIndex = 0;
        const currentUrl = window.location.href;
        allEpisodes.forEach((ep) => {
            if (currentUrl.includes(ep.url) || ep.url.includes(currentUrl.split('/').pop())) {
                currentPlayingIndex = ep.index;
            }
        });

        const storageKey = "v_hist_" + window.location.pathname.replace(/[^a-zA-Z0-9]/g, "_");
        let savedIndex = safeGetStorage(storageKey);

        if (savedIndex !== null) {
            savedIndex = parseInt(savedIndex, 10);
            if (currentPlayingIndex !== savedIndex && currentPlayingIndex !== savedIndex + 1) {
                if (loaderBlock) loaderBlock.remove();
                let savedEpObj = allEpisodes[savedIndex] || { title: "Tập " + (savedIndex + 1) };
                let currentEpObj = allEpisodes[currentPlayingIndex] || { title: "Tập " + (currentPlayingIndex + 1) };

                let confirmDialog = document.createElement('aside');
                confirmDialog.id = 'v-confirm-dialog';
                Object.assign(confirmDialog.style, {
                    position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)',
                    zIndex: '90', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                });

                confirmDialog.innerHTML = \`
                    <div style="background: #141416; border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; width: 290px; color: #fff; text-align: center;">
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">Phát hiện lịch sử xem</div>
                        <div style="font-size: 12px; color: #a1a1aa; margin-bottom: 16px; line-height: 1.4;">
                            Bạn đang mở <b style="color:#fff;">\${currentEpObj.title}</b>. Lần trước xem <b style="color:#e50914;">\${savedEpObj.title}</b>.
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <button id="btn-resume-saved" style="padding: 8px; border-radius: 6px; border: none; background: #e50914; color: #fff; font-weight: 600; cursor: pointer; font-size: 12px;">Chuyển tới \${savedEpObj.title}</button>
                            <button id="btn-resume-current" style="padding: 6px; border-radius: 6px; border: none; background: transparent; color: #71717a; cursor: pointer; font-size: 11px;">Xem tiếp tập này</button>
                        </div>
                    </div>
                \`;
                document.body.appendChild(confirmDialog);

                document.getElementById('btn-resume-saved').onclick = () => {
                    safeSetStorage(storageKey, savedIndex);
                    window.location.href = allEpisodes[savedIndex].url;
                };
                document.getElementById('btn-resume-current').onclick = () => {
                    safeSetStorage(storageKey, currentPlayingIndex);
                    confirmDialog.remove();
                    document.documentElement.appendChild(loaderBlock);
                    runApp(currentPlayingIndex, loaderBlock, allEpisodes);
                };
                return;
            }
        }

        safeSetStorage(storageKey, currentPlayingIndex);
        runApp(currentPlayingIndex, loaderBlock, allEpisodes);
    }

    function runApp(currentPlayingIndex, loaderBlock, allEpisodes) {
        let initLink = "` + (initialLink || '') + `";
        if (!initLink) {
            try {
                let scriptTags = document.querySelectorAll('script');
                for (let s of scriptTags) {
                    let m = s.textContent.match(/window\\.PLAYER_DATA\\s*=\\s*(\\{[\\s\\S]*?\\});/);
                    if (m) {
                        let d = JSON.parse(m[1]);
                        if (d && d.link) { initLink = d.link; break; }
                    }
                }
                if (!initLink) {
                    let f = document.querySelector('iframe');
                    if (f) initLink = f.src;
                }
            } catch(e) {}
        }
        if (initLink && initLink.indexOf('//') === 0) initLink = "https:" + initLink;

        document.documentElement.style.cssText = "margin:0;padding:0;width:100vw;height:100vh;overflow:hidden;background:#000;";
        document.body.innerHTML = "";
        document.body.style.cssText = "margin:0;padding:0;width:100vw;height:100vh;overflow:hidden;background:#000;position:relative;";

        if (loaderBlock) document.body.appendChild(loaderBlock);

        let isMenuOpen = false;

        function setAllUIOpacity(opacityValue) {
            navContainer.style.opacity = opacityValue;
            btnSidePrev.style.opacity = opacityValue;
            btnSideNext.style.opacity = opacityValue;
            epGridPanel.style.opacity = opacityValue;
        }

        // Đổi container thành thẻ <nav id="v-player-nav">
        let navContainer = document.createElement("nav");
        navContainer.id = "v-player-nav";
        Object.assign(navContainer.style, {
            position: "fixed", top: "12px", right: "16px", zIndex: "95",
            opacity: "0.2", transition: "opacity 0.2s ease", pointerEvents: "auto"
        });

        // Đổi popup grid thành thẻ <menu id="v-ep-grid">
        let epGridPanel = document.createElement("menu");
        epGridPanel.id = "v-ep-grid";
        Object.assign(epGridPanel.style, {
            position: "fixed", top: "46px", right: "16px", zIndex: "96",
            backgroundColor: "rgba(18, 18, 20, 0.95)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)", padding: "8px", borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.8)", width: "270px", maxHeight: "240px",
            overflowY: "auto", display: "none", gridTemplateColumns: "repeat(6, 1fr)", gap: "4px",
            opacity: "0.2", transition: "opacity 0.2s ease", pointerEvents: "auto", margin: "0"
        });

        let btnSidePrev = document.createElement("button");
        btnSidePrev.id = "v-btn-prev";
        btnSidePrev.innerHTML = "&#10094;";
        Object.assign(btnSidePrev.style, {
            position: "fixed", left: "12px", top: "50%", transform: "translateY(-50%)",
            width: "38px", height: "38px", borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", cursor: "pointer", zIndex: "94", userSelect: "none",
            border: "1px solid rgba(255,255,255,0.15)", opacity: "0.2", transition: "opacity 0.2s ease",
            pointerEvents: "auto"
        });

        let btnSideNext = document.createElement("button");
        btnSideNext.id = "v-btn-next";
        btnSideNext.innerHTML = "&#10095;";
        Object.assign(btnSideNext.style, {
            position: "fixed", right: "12px", top: "50%", transform: "translateY(-50%)",
            width: "38px", height: "38px", borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", cursor: "pointer", zIndex: "94", userSelect: "none",
            border: "1px solid rgba(255,255,255,0.15)", opacity: "0.2", transition: "opacity 0.2s ease",
            pointerEvents: "auto"
        });

        [navContainer, btnSidePrev, btnSideNext, epGridPanel].forEach(el => {
            el.addEventListener("mouseenter", () => setAllUIOpacity("1"));
            el.addEventListener("mouseleave", () => {
                if (!isMenuOpen) setAllUIOpacity("0.2");
            });
            el.addEventListener("touchstart", () => setAllUIOpacity("1"), { passive: true });
        });

        if (initLink) {
            let newIframe = document.createElement("iframe");
            newIframe.className = "frameMain";
            let autoUrl = initLink.includes("?") ? initLink + "&autoplay=1" : initLink + "?autoplay=1";
            newIframe.src = autoUrl;
            newIframe.setAttribute("frameborder", "0");
            newIframe.setAttribute("allowfullscreen", "");
            newIframe.setAttribute("allow", "autoplay; fullscreen");
            
            Object.assign(newIframe.style, {
                position: 'absolute', top: '0', left: '0',
                width: '100%', height: '100%', border: 'none',
                background: '#000', zIndex: '1'
            });

            newIframe.onload = function() {
                if (loaderBlock) {
                    loaderBlock.style.opacity = "0";
                    setTimeout(() => loaderBlock.remove(), 300);
                }
            };
            document.body.appendChild(newIframe);
        }

        document.body.appendChild(navContainer);
        document.body.appendChild(epGridPanel);
        document.body.appendChild(btnSidePrev);
        document.body.appendChild(btnSideNext);

        const listFrame = new Array(allEpisodes.length);
        if (allEpisodes[currentPlayingIndex] && initLink) {
            listFrame[currentPlayingIndex] = {
                title: allEpisodes[currentPlayingIndex].title,
                link: initLink,
                index: currentPlayingIndex,
                url: allEpisodes[currentPlayingIndex].url
            };
            updateSelectUI();
        }

        function fetchPage(episodeObj) {
            if (episodeObj.index === currentPlayingIndex) return;
            fetch(episodeObj.url)
                .then(r => r.text())
                .then(htmlText => {
                    const srcNext = htmlText.match(/window\\.PLAYER_DATA[\\s\\S]*?link["'][^"']["']([^"']+)["']/i);
                    if (srcNext && srcNext[1]) {
                        const framelink = decodeURIComponent(srcNext[1].replaceAll('\\\\/', '/'));
                        listFrame[episodeObj.index] = { title: episodeObj.title, link: framelink, index: episodeObj.index, url: episodeObj.url };
                        updateSelectUI();
                    }
                }).catch(() => {});
        }

        function changeEpisode(targetIndex) {
            const ep = listFrame[targetIndex];
            if (ep && ep.link) {
                currentPlayingIndex = targetIndex;
                const storageKey = "v_hist_" + window.location.pathname.replace(/[^a-zA-Z0-9]/g, "_");
                safeSetStorage(storageKey, currentPlayingIndex);

                const targetIframe = document.querySelector(".frameMain");
                if (targetIframe) {
                    let cleanLink = ep.link.split('&autoplay=')[0].split('?autoplay=')[0];
                    let autoUrl = cleanLink.includes("?") ? cleanLink + "&autoplay=1&t=" + Date.now() : cleanLink + "?autoplay=1&t=" + Date.now();
                    targetIframe.src = autoUrl;
                }
                toggleMenu(false);
                updateSelectUI();
            }
        }

        function toggleMenu(forceState) {
            isMenuOpen = forceState !== undefined ? forceState : !isMenuOpen;
            if (isMenuOpen) {
                epGridPanel.style.display = "grid";
                setAllUIOpacity("1");
            } else {
                epGridPanel.style.display = "none";
                setAllUIOpacity("0.2");
            }
        }

        const closeMenuOutside = (e) => {
            if (isMenuOpen && !navContainer.contains(e.target) && !epGridPanel.contains(e.target)) {
                toggleMenu(false);
            }
        };

        document.addEventListener("click", closeMenuOutside, true);
        document.addEventListener("touchstart", closeMenuOutside, true);

        function updateSelectUI() {
            const validFrames = listFrame.filter(Boolean);
            navContainer.innerHTML = "";

            let currentEpObj = listFrame[currentPlayingIndex];
            let currentTitleText = currentEpObj ? currentEpObj.title : ("Tập " + (currentPlayingIndex + 1));

            const btnEpRed = document.createElement("button");
            btnEpRed.id = "v-btn-selector";
            btnEpRed.innerHTML = \`<span>\${currentTitleText}</span> <span style="font-size: 9px; margin-left: 1px;">▼</span>\`;
            Object.assign(btnEpRed.style, {
                height: "26px", padding: "0 10px", borderRadius: "5px", border: "none",
                backgroundColor: "#e50914", color: "#fff", cursor: "pointer",
                fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center",
                gap: "3px", boxShadow: "0 2px 6px rgba(229, 9, 20, 0.4)"
            });
            btnEpRed.onclick = (e) => {
                e.stopPropagation();
                toggleMenu();
            };

            navContainer.appendChild(btnEpRed);

            btnSidePrev.onclick = (e) => {
                e.stopPropagation();
                setAllUIOpacity("1");
                if (currentPlayingIndex > 0 && listFrame[currentPlayingIndex - 1]) {
                    changeEpisode(currentPlayingIndex - 1);
                }
            };
            btnSideNext.onclick = (e) => {
                e.stopPropagation();
                setAllUIOpacity("1");
                if (currentPlayingIndex < listFrame.length - 1 && listFrame[currentPlayingIndex + 1]) {
                    changeEpisode(currentPlayingIndex + 1);
                }
            };

            epGridPanel.innerHTML = "";
            validFrames.forEach(item => {
                const epBtn = document.createElement("button");
                let shortName = item.title.replace(/Tập\\s*/i, '').trim();
                if (shortName.length === 1) shortName = '0' + shortName;
                epBtn.textContent = shortName;
                
                let isCurrent = (item.index === currentPlayingIndex);
                Object.assign(epBtn.style, {
                    height: "32px", borderRadius: "4px",
                    border: isCurrent ? "1px solid #e50914" : "1px solid rgba(255, 255, 255, 0.06)",
                    backgroundColor: isCurrent ? "#e50914" : "rgba(255, 255, 255, 0.05)",
                    color: "#fff", cursor: "pointer", fontSize: "11px",
                    fontWeight: isCurrent ? "700" : "400", display: "flex",
                    alignItems: "center", justifyContent: "center", padding: "0"
                });

                epBtn.onclick = (e) => {
                    e.stopPropagation();
                    changeEpisode(item.index);
                };
                epGridPanel.appendChild(epBtn);
            });
        }

        allEpisodes.forEach(episode => fetchPage(episode));
    }

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);
})();
  `;
}




/*
function parseEmbedResponse(htmlContent, url) {
    try {
        // Thử trích xuất direct HLS stream từ player page
        var m3u8Match = /["'](https?:\/\/[^"'\s]*\.m3u8[^"'\s]*?)["']/i.exec(htmlContent);
        if (m3u8Match) {
            log("Found m3u8 stream: " + m3u8Match[1]);
            return JSON.stringify({
                url: m3u8Match[1],
                isEmbed: false,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Referer": "https://animevietsub.wiki/"
                },
                subtitles: []
            });
        }

        // Không tìm thấy m3u8 → trả embed với Block-Scripts chặn avs-shield
        // Trích xuất nextUrl từ URL embed hiện tại để làm Referer chuẩn
        var nextUrlMatch = url.match(/nextUrl=([^&]+)/);
        var referer = nextUrlMatch ? decodeURIComponent(nextUrlMatch[1]) : "https://animevietsub.wiki/";

        return JSON.stringify({
            url: url,
            isEmbed: false,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": referer,
                "Block-Scripts": "avs-shield"
            },
            subtitles: []
        });
    } catch (e) {
        log("parseEmbedResponse error: " + e.message);
        return JSON.stringify({ url: url, isEmbed: true, headers: {}, subtitles: [] });
    }
}
*/
// =============================================================================
// CATEGORIES
// =============================================================================

function parseCategoriesResponse(htmlContent) {
    try {
        var categories = [];
        // Parse menu thể loại từ trang chủ
        var menuBlock = /<ul class="sub-menu[^"]*">([\s\S]*?)<\/ul>/i.exec(htmlContent);
        if (menuBlock) {
            var catPattern = /<a\s+href="[^"]*\/the-loai\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
            var catMatch;
            while ((catMatch = catPattern.exec(menuBlock[1])) !== null) {
                var catSlug = catMatch[1].replace(/\//g, "");
                var catName = catMatch[2].trim();
                if (catSlug && catName) {
                    categories.push({ name: catName, slug: catSlug });
                }
            }
        }
        // Fallback: quét toàn trang nếu không tìm thấy trong submenu
        if (categories.length === 0) {
            var fallbackPattern = /<a\s+href="[^"]*\/the-loai\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
            var fbMatch;
            while ((fbMatch = fallbackPattern.exec(htmlContent)) !== null) {
                var fbSlug = fbMatch[1].replace(/\//g, "");
                var fbName = fbMatch[2].trim();
                var exists = false;
                for (var i = 0; i < categories.length; i++) {
                    if (categories[i].slug === fbSlug) { exists = true; break; }
                }
                if (!exists && fbSlug && fbName) {
                    categories.push({ name: fbName, slug: fbSlug });
                }
            }
        }
        return JSON.stringify(categories);
    } catch (e) {
        log("parseCategoriesResponse error: " + e.message);
        return "[]";
    }
}

function parseCountriesResponse(htmlContent) { return "[]"; }
function parseYearsResponse(htmlContent) { return "[]"; }