BASEURL = "https://heovl.im";
function getManifest() {
    return JSON.stringify({
        "id": "heovl",
        "name": "Heovl",
        "description": "XXX Hay",
        "version": "1.7.1",
      	"info": "Nguồn sex Việt. Nguồn này hay bị chặn bởi nhà mạng. Nếu không xem được hãy thử cài APP 1.1.1.1 hoặc dùng DNS và DPI có sẵn trên app để xem tiếp.",
        "baseUrl": "https://heovl.im",
        "iconUrl": "https://static.cdnsolutions.media/xh-desktop/images/favicon/favicon-v2-256x256.ico",
        "layoutType": "HORIZONTAL",
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "embedtoexoplay"
    });
}



// Hàm tách menu bằng list
function buildMenu(listurl){
// 2. Khởi tạo mảng chứa kết quả
let menulist = [];
let regex = /^([^@\r\n]+)@@([^@\r\n]+)(?:@@([^@\r\n]+))?/gm;
let match;

// 4. Vòng lặp duyệt qua từng hàng bằng RegExp
while ((match = regex.exec(listurl)) !== null) {
    let link = match[1].trim();
    let name = match[2].trim();
    let check = match[3] ? match[3].trim() : undefined; // Lấy giá trị check nếu có

    let item = {};

    // 5. Kiểm tra điều kiện biến check để tạo cấu trúc Object
    if (check === "false") {
        item = { 
            "slug": link, 
            "title": name, 
            "type": "Horizontal" 
        };
    } else if (check === "true") {
        item = { 
            "slug": link, 
            "title": name, 
            "type": "Grid" 
        };
    } else {
        // Trường hợp không có biến check (undefined)
        item = { 
            "slug": link, 
            "name": name 
        };
    }

    // 6. Push item vào mảng menulist
    menulist.push(item);
}


// 7. In kết quả ra để kiểm tra
    return menulist
}

//https://pornone.com/newest/
//https://pornone.com/newest/3/
//https://pornone.com/search?q=black
/*
{ "slug": "", "title": "", "type": "Horizontal" },
{ "slug": "", "title": "", "type": "Grid" }
*/

function getHomeSections() {
    var listurl = `
    categories/viet-nam@@Việt Nam@@true
    `
    var  menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

// https://pornone.com/anal/
/*
    { "slug": "", "name": ""},
    { "slug": "", "name": ""}
    
    
*/
function getPrimaryCategories() {
    var listurl = `
    categories/choi-lo-dit-anal-sex@@Lỗ Nhị
    categories/nga-russia@@Nga
    categories/vu-to@@Vú To
    categories/tap-the@@Tập Thể
    categories/hiep-dam@@Hiếp Dâm
    categories/loan-luan@@Loạn Luân
    categories/phim-cap-3@@Phim Cap 3
    `
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'latest' },
            { name: 'Đánh giá cao', value: 'rating' },
            { name: 'Xem nhiều', value: 'views' }
        ],
        category: [
            { name: "Huyền Huyễn", value: "huyen-huyen" },
            { name: "Xuyên Không", value: "xuyen-khong" },
            { name: "Trùng Sinh", value: "trung-sinh" },
            { name: "Tiên Hiệp", value: "tien-hiep" },
            { name: "Cổ Trang", value: "co-trang" },
            { name: "Hài Hước", value: "hai-huoc" },
            { name: "Kiếm Hiệp", value: "kiem-hiep" },
            { name: "Hiện Đại", value: "hien-dai" }
        ]
    });
}

// =============================================================================
// URL GENERATION (Bóc tách slug sạch theo khuôn mẫu mới)
// =============================================================================

// https://heovl.im/search/vang-anh?page=3
// https://heovl.im/categories/viet-nam?page=3

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        // Prioritize category filter if present
        if (filtersJson.category) {
            return BASEURL + "/" + filters.category + "/?page=" + page;
        }
        
        if (page > 1) {
            if (slug.indexOf("search") > -1) {
                return BASEURL + "/" + slug + "/?page=" + page;
            } else {
                return BASEURL + "/" + slug + "/?page=" + page;
            }
        }
        return BASEURL + "/" + slug;
    } catch (e) {
        return BASEURL + "/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/search/" + encodeURIComponent(keyword);
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

function parseListResponse(html) {
    try {
        var items = [];
        // Tách từng item phim để tránh regex chạy sai giữa các item
        var chunks = html.split('class="videos__box-wrapper"');
        
        // Bắt đầu từ 1 vì phần tử 0 là phần html trước class đầu tiên
        for (var i = 1; i < chunks.length; i++) {
            var blockHtml = chunks[i];
            
            // Kiểm tra xem block này có chứa các thẻ cốt lõi của video không
            if (!blockHtml.match(/img|href|video|src/i)) {
                continue;
            }
            
            // 1. Lấy link phim (Sửa lỗi logic || thành &&)
            var urlMatch = blockHtml.match(/a[\s\S]*?href="([^"]+)"/i);
            var url = "";
            if (urlMatch && urlMatch[1]) {
                url = urlMatch[1];
            } else {
                // Nếu không có url hợp lệ, bỏ qua chunk này luôn, không lấy rác
                continue;
            }
            
            if (!url.startsWith("http")) {
                url = BASEURL + url;
            }
            
            // 2. Lấy Title
            var title = "";
            var rmatch = blockHtml.match(/title="([^"]+)"/i);
            if (rmatch && rmatch[1]) {
                title = rmatch[1];
            }
            
            // 3. Lấy Poster (Toán tử 3 ngôi chuẩn)
            var posterMatch = blockHtml.match(/data-src="([^"]+)"/i) || blockHtml.match(/src="([^"]+)"/i);
            var poster = posterMatch ? posterMatch[1] : "";
            if (poster && !poster.startsWith("http")) {
                poster = BASEURL + poster;
            }
            
            items.push({
                id: url,
                title: title,
                posterUrl: poster
            });
        }
        
        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 999 }
        });
    } catch (e) {
        //console.error("Lỗi Parse:", e);
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}


function parseSearchResponse(html) {
    return parseListResponse(html);
}



//JSON.parse(parseMovieDetail(html,"https://heovl.im/videos/chich-nhan-tinh-cuc-pham-tren-ghe-sieu-nung"))
function parseMovieDetail(html,ourl) {
    var lurl = "";
    var limg = "";
    var lname = "Đang cập nhật...";
    var ldes = "Không có mô tả.";
    var year = 2026;
    var direc = "????";
    var cast = "????";
    var status = "????";
    var duration = "1:09:00 | 16 | 16";
    var servers = [];
    
    try {
        // 1. Parse Meta Tags
        var rmatch;
        rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) { limg = rmatch[1]; }
        
        rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) { lname = rmatch[1]; }
        
        rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) { ldes = rmatch[1]; }
        
        var episodes = [];
        
        // 2. Kiểm tra xem có nút bấm server hay không bằng Regex MatchAll
        // Tìm tất cả các đoạn có data-source="..." trong class button tương ứng
        var serverRegex = /data-source="([^"]+)"/gi;
        //var html = document.getElementsByTagName("html")[0].outerHTML;
        var serverMatches = html.match(serverRegex)
        
        if (serverMatches.length > 0) {
            // Nếu tìm thấy các nút server
            for (var j = 0; j < serverMatches.length; j++) {
                var sourcebutton = serverMatches[j]; // Lấy giá trị trong nhóm ngoặc đơn ([^"]+)
                var sourceUrl = sourcebutton.match(/data-source=["']([\s\S]*?)["']/i);
                if(sourceUrl && sourceUrl[1]){
                    //console.log(sourceUrl[1])
									if(sourceUrl[1].indexOf("zabitcdn.name") > -1){
                    episodes.push({
                        id: sourceUrl[1],
                        name: "Server " + (j + 1),
                        slug: "tap-" + (j + 1)
                    });
                  }
                }

            }
        } else {
            // 3. Nếu không có nút thì tìm iframe
            var iframeRegex = /class="[^"]*video-player[^"]*"[\s\S]*?iframe\s+src="([^"]+)"/i;
            var iframeMatch = html.match(iframeRegex);
            
            if (iframeMatch && iframeMatch[1]) {
                lurl = iframeMatch[1];
               if(lurl.indexOf("zabitcdn.name") > -1){
                  episodes.push({
                      id: lurl,
                      name: "Server 1",
                      slug: "tap-1"
                  });
               }
            }
        }
        
        servers = [{
            name: "Server",
            episodes: episodes
        }];
        
    } catch (e) {
        //console.error("Lỗi parse dữ liệu: ", e);
    }
    var $return = {
        id: ourl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: lurl,
        servers: servers,
        quality: "HD",
        year: year,
        status: status,
        duration: duration,
        casts: cast,
        director: direc
    }
    // Trả về kết quả (Dù lỗi hay không lỗi vẫn return đúng cấu trúc object mong muốn)
    return JSON.stringify($return);
}
//var html = document.getElementsByTagName("html")[0].outerHTML;
//JSON.parse(parseMovieDetail(html,""))
//var iframeRegex = /class="[^"]*video-player[^"]*"[\s\S]*?iframe\s+src="([^"]+)"/i;
//var iframeMatch = html.match(iframeRegex);

function checkRaw(scriptStr, returnFixed) {
  try {
    if (!scriptStr || typeof scriptStr !== 'string') {
      console.log("[Lỗi escape runJS]\r\n\t Dữ liệu đầu vào không phải là chuỗi hợp lệ!");
      return scriptStr || "";
    }

    var lines = scriptStr.split('\n');
    var fixedLines = [];
    var hasError = false;

    for (var i = 0; i < lines.length; i++) {
      var currentLine = lines[i];
      var lineNum = i + 1;
      var lineErrorFound = false;

      // 1. Kiểm tra lỗi escape newline/tab nguy hiểm nằm trần trong chuỗi quote
      // Trường hợp chưa được escape dạng '\\n' hoặc '\\t' trong chuỗi ghép
      if (/([^\\]|^)(\r\n|\r|\n)/.test(currentLine)) {
        console.log("[Lỗi escape runJS]\r\n\t Phát hiện xuống dòng chưa escape ở Dòng " + lineNum + ": " + currentLine.trim());
        lineErrorFound = true;
      }

      // 2. Kiểm tra lỗi quên escape ký tự Tab trần không hợp lệ
      if (/\t/.test(currentLine) && !/\\t/.test(currentLine)) {
        console.log("[Lỗi escape runJS]\r\n\t Phát hiện ký tự Tab trần ở Dòng " + lineNum + ": " + currentLine.trim());
        lineErrorFound = true;
      }

      // 3. Kiểm tra dấu xược ngược single trailing backlash ở cuối dòng (dễ làm gãy chuỗi)
      if (/([^\\])\\$/.test(currentLine)) {
        console.log("[Lỗi escape runJS]\r\n\t Dấu Backslash (\\) cô đơn ở cuối Dòng " + lineNum + ": " + currentLine.trim());
        lineErrorFound = true;
      }

      if (lineErrorFound) {
        hasError = true;
      }

      // Tiến hành SỬA LỖI tự động nếu tham số returnFixed = true
      var fixedLine = currentLine;
      if (returnFixed) {
        // Chuẩn hóa ký tự xuống dòng và tab đặc biệt
        fixedLine = fixedLine
          .replace(/\r/g, "")
          .replace(/\t/g, "  "); // Thay Tab trần bằng 2 khoảng trắng cho an toàn
      }

      fixedLines.push(fixedLine);
    }

    // 4. Kiểm tra cú pháp nhanh xem toàn bộ chuỗi có parse được JS không
    try {
      new Function(scriptStr);
    } catch (syntaxErr) {
      hasError = true;
      console.log("[Lỗi escape runJS]\r\n\t 💥 LỖI CÚ PHÁP (SyntaxError) toàn cục: " + syntaxErr.message);
    }

    if (!hasError) {
      console.log("[checkRaw] 🟢 Chuỗi Raw JS hoàn toàn sạch lỗi!");
    }

    // Trả về bản đã fix hoặc bản gốc theo tham số returnFixed
    return returnFixed ? fixedLines.join('\n') : scriptStr;

  } catch (e) {
    console.log("[Lỗi escape runJS]\r\n\t Lỗi ngoại lệ trong hàm checkRaw: " + e.message);
    return scriptStr; // Luôn an toàn: Fallback trả về chuỗi gốc chứ không làm sập script
  }
}


function parseDetailResponse(html,url) {
console.log("parseDetailResponse[Đang xử lý]: " + url)
console.log("parseDetailResponse[Raw]: " + html)
    try {

    // Đọc trực tiếp từ thuộc tính của BaseJSON đã lưu ở bước đầu tiên
        var $stream = url;
        var iframeRegex = /class="[^"]*video-player[^"]*"[\s\S]*?iframe\s+src="([^"]+)"/i;
        var iframeMatch = html.match(iframeRegex);
        if(iframeMatch && iframeMatch[1]){
            $stream = iframeMatch[1];
        }
        console.log("parseDetailResponse[Đang Fetch]: " + $stream)
        return JSON.stringify({
            url: $stream,
            isEmbed: true // Vẫn cần fetch tiếp
        });

    } catch (e) {
        return JSON.stringify({ "url": "", "headers": {} });
    }
}


function parseEmbedResponse(html, sourceUrl) {
        console.log("parseEmbedResponse[Đang Xử lý]: " + sourceUrl)
        console.log("parseEmbedResponse[Raw]: " + html)
        var customjs = checkRaw(runjS(), true);
        return JSON.stringify({
            url: sourceUrl,
            isEmbed: false, // Kết thúc, đây là link stream cuối
            mimeType: "application/x-mpegURL", // Báo App đây là HLS
            headers: { "Referer": sourceUrl,
                       
            "Custom-Js": customjs
            },
        });
    
    return JSON.stringify({ url: "", isEmbed: false });
}


function runjS() {

    // =========================================================================
    // 1. CONFIG JS: Cấu hình linh hoạt & Tối ưu tốc độ
    // =========================================================================
    function configJS() {
        return `
    SnifferBridge.toast("🎯 Đang xử lý dữ liệu. Chờ chút nhé...")
    // ⚙️ GLOBAL CONFIG
    var LOGGER = true; 
    var processedUrls = {};
    var hasDispatchedAny = false;
    var activeWorkerIndex = 0;

    var PLAYER_MODE = "EXO"; // "EXO": Phát qua Native App | "CUSTOM": Nhúng ArtPlayer
    var PROXY_ENABLED = true; 

    // 👉 TẮT CUSTOM DECODER ĐỂ PHÁT TRỰC TIẾP TỐC ĐỘ CAO
    var USE_CUSTOM_DECODER = false; 
    var SET_VIDEO_WAIT_MS = 2000; 

    var WORKER_POOL = [
      "https://soft-surf-c11d.alokillgtv.workers.dev",
      "https://soft-water-25b0.alokillgtv02.workers.dev"
    ];

    var CUSTOM_REFERER = window.location.href;

    // 🚀 REGEX TỔNG QUÁT BẮT LINK MEDIA & API (Hỗ trợ cả link tuyệt đối http:// và link tương đối /)
    var STREAM_URL_REGEX = /(?:https?:\\/\\/[^\\s"'<>]+|\\/[^\\s"'<>]+)(?:m3u8|mp4|streaming|stream|playlist|embed|sanstream\\.xyz|cdn=|\\/hls\\/|\\?id=)[^\\s"'>]*/i;

    // 🎯 HÀNG ĐỢI (QUEUE) LƯU TẤT CẢ LINK SNIFFER BẮT ĐƯỢC
    var snifferQueue = [];
    var setVideoSuccess = false;
    var setVideoTimer = null;

    var ENABLE_FILTER = false; 
    var BLOCKED_DOMAINS = ["ads.example.com", "*.adnetwork.com"];

    // ⏱️ TIMEOUT TOÀN CỤC CHỜ XHR & DOM RENDER
    var SNIFFER_TIMEOUT_MS = 20000;
    var HTMLRAW = false;
    var ENDEMBED = true; 
    
    // Biến hỗ trợ cơ chế retry & observer
    var executionRetries = 0;
    var maxExecutionRetries = 10;
    var videoObserver = null;

    activeWorkerIndex = Math.floor(Math.random() * WORKER_POOL.length);

    function bridgeLog(msg) {
      if (!LOGGER) return;
      try {
        var strMsg = String(msg);
        var formattedContent = strMsg;

        var match = strMsg.match(/^(\\S+\\s*\\[[^\\]]+\\]:?)(.*)$/);
        if (match) {
          var header = match[1].trim();
          var body = match[2].trim();
          formattedContent = header + "\\r\\n\\t" + body;
        }

        var logMessage = '[CustomJS][LOG] [SNIFFER LOG] ' + formattedContent;

        if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
          window.SnifferBridge.log(logMessage);
        } else if (typeof console !== 'undefined' && console.log) {
          console.log(logMessage);
        }
      } catch (e) {}
    }
    `;
    }

    // =========================================================================
    // 🚀 SETVIDEO JS: Dùng khi bật USE_CUSTOM_DECODER = true
    // =========================================================================
    function setVideoJS() {
        return `
  function setVideo(rawUrl, sourceName) {
    try {
      if (!USE_CUSTOM_DECODER) return false;

      bridgeLog('⏳ [setVideo - ĐANG XỬ LÝ ƯU TIÊN] Nguồn: [' + sourceName + ']');

      var html = document.documentElement ? document.documentElement.outerHTML : '';

      var idvideo = html.match(/videoId[^"']+["']([^"']+)["']/i);
      var urlvideo = html.match(/videoId[\\s\\S]*?(\\/\\?token1=[^"']+)["']/i);
      var linkVD = "";

      if (idvideo && idvideo[1] && urlvideo && urlvideo[1]) {
        linkVD = "https://cdn.neuronix.sbs/segment/" + idvideo[1] + urlvideo[1];
        bridgeLog("🎉 Đã tìm ra link video: " + linkVD);
      } else {
        bridgeLog("⚠️ Không tìm thấy regex videoId trong HTML!");
      }

      var decodedUrl = linkVD; 

      if (decodedUrl && typeof decodedUrl === 'string' && decodedUrl.length > 10) {
        setVideoSuccess = true;
        hasDispatchedAny = true;
        if (setVideoTimer) clearTimeout(setVideoTimer);

        bridgeLog('🎉 [setVideo - THÀNH CÔNG]: Đã lấy được link -> ' + decodedUrl);
        dispatchToPlayer(decodedUrl, "setVideo");
        return true;
      } else {
        bridgeLog('⚠️ [setVideo - KHÔNG THỎA MÃN]: Chờ Sniffer Fallback...');
        return false;
      }

    } catch (e) {
      bridgeLog('❌ [setVideo - LỖI XỬ LÝ]: ' + e.message);
      return false;
    }
  }
  `;
    }

    // =========================================================================
    // 📡 GET LINK JS: Tối ưu Bắt & Chuyển đổi Absolute URL
    // =========================================================================
    function getLinkJS(rawUrl, sourceName) {
        return `
    function getLinkJS(rawUrl, sourceName) {
      try {
        if (!rawUrl || typeof rawUrl !== 'string' || hasDispatchedAny) return;
        if (rawUrl.indexOf('blob:') === 0 || rawUrl.indexOf('data:') === 0) return;

        // 🛠️ TỰ ĐỘNG CHUYỂN DẠNG TƯƠNG ĐỐI (/videos/...) THÀNH TUYỆT ĐỐI (https://...)
        var absoluteUrl = new URL(rawUrl, document.baseURI || window.location.href).href;

        if (STREAM_URL_REGEX && !STREAM_URL_REGEX.test(absoluteUrl) && !STREAM_URL_REGEX.test(rawUrl)) return; 
        if (processedUrls[absoluteUrl]) return;
        processedUrls[absoluteUrl] = true;

        bridgeLog('🎯 [Sniffer - TÓM ĐƯỢC LINK] Nguồn [' + (sourceName || 'Unknown') + ']: ' + absoluteUrl);

        if (!isDomainAllowed(absoluteUrl)) {
          bridgeLog('🚫 [Sniffer - Bị Filter Domain]: ' + absoluteUrl);
          return; 
        }

        // 🚀 TỐI ƯU TỐC ĐỘ: BẮT ĐƯỢC LINK M3U8/MP4 LÀ BẮN SANG PLAYER NGAY
        if (absoluteUrl.indexOf('.m3u8') !== -1 || absoluteUrl.indexOf('.mp4') !== -1 || !USE_CUSTOM_DECODER) {
            dispatchToPlayer(absoluteUrl, "DirectSniffer (" + sourceName + ")");
            return;
        }

        // Luồng dự phòng nếu bật Decoder
        snifferQueue.push({ url: absoluteUrl, source: sourceName });

        if (typeof USE_CUSTOM_DECODER !== 'undefined' && USE_CUSTOM_DECODER && typeof setVideo === 'function') {
          var success = setVideo(absoluteUrl, sourceName);
          if (!success && !setVideoTimer && !setVideoSuccess) {
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
      if (hasDispatchedAny || setVideoSuccess) return;

      bridgeLog('🔄 [Sniffer Fallback]: Tiến hành xả hàng đợi Sniffer Queue (' + snifferQueue.length + ' link)...');

      if (snifferQueue.length > 0) {
        var fallbackItem = snifferQueue[0];
        bridgeLog('🚀 [Sniffer Fallback]: Lấy link từ Sniffer gửi Player -> ' + fallbackItem.url);
        
        hasDispatchedAny = true;
        dispatchToPlayer(fallbackItem.url, "SnifferFallback (" + fallbackItem.source + ")");
      } else {
        bridgeLog('⚠️ [Sniffer Fallback]: Hàng đợi rỗng, chờ Sniffer tìm thêm...');
      }
    }
    `;
    }

    // =========================================================================
    // 📡 ART PLAYER BUILDING
    // =========================================================================
    function artPlayer() {
        return `
function renderArtPlayer(playUrl, rawStreamUrl) {
  try {
    bridgeLog('🚀 [renderArtPlayer]: Khởi tạo ArtPlayer...');

    document.documentElement.style.cssText = 'background: #000 !important; background-image: none !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important;';
    document.body.innerHTML = '';
    document.body.style.cssText = 'background: #000 !important; background-image: none !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important;';

    var style = document.createElement('style');
    style.innerHTML = \`
      *:not(#artplayer-container *):not(.art-video) {
        background-image: none !important;
      }

      html, body { 
        width: 100vw !important; 
        height: 100vh !important; 
        margin: 0 !important; 
        padding: 0 !important; 
        overflow: hidden !important; 
        background: #0f172a !important; 
      } 

      #artplayer-container { 
        width: 100vw !important; 
        height: 100vh !important; 
        position: fixed !important; 
        top: 0 !important; 
        left: 0 !important; 
        z-index: 999999 !important; 
        outline: none !important; 
        background: #0f172a !important;
      }

      .art-poster, .art-poster-img {
        display: none !important;
      }

      .art-loading {
        background: #0f172a !important;
      }
      .art-loading-icon, .art-icon-loading { 
        display: none !important; 
      }
      
      .custom-art-loading-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .custom-art-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-left-color: #38bdf8;
        border-radius: 50%;
        animation: artSpin 0.8s linear infinite;
      }
      .custom-art-loading-text {
        margin-top: 15px;
        color: #f8fafc;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.5px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      @keyframes artSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    \`;
    document.head.appendChild(style);

    var container = document.createElement('div');
    container.id = 'artplayer-container';
    container.setAttribute('tabindex', '0');
    container.setAttribute('autofocus', 'true');
    document.body.appendChild(container);

    var lowerPlayUrl = (playUrl || '').toLowerCase();
    var lowerRawUrl = (rawStreamUrl || '').toLowerCase();
    
    var isProxyLink = PROXY_ENABLED && WORKER_POOL.some(function(worker) {
      return lowerPlayUrl.indexOf(worker.toLowerCase()) !== -1;
    });

    var isM3U8 = lowerRawUrl.indexOf('.m3u8') !== -1 || 
                 lowerPlayUrl.indexOf('.m3u8') !== -1 || 
                 lowerPlayUrl.indexOf('%2fm3u8') !== -1 ||
                 isProxyLink;

    var customSettings = [];
    if (PROXY_ENABLED && WORKER_POOL && WORKER_POOL.length > 0) {
      customSettings.push({
        html: 'Server Proxy',
        tooltip: 'Server ' + (activeWorkerIndex + 1),
        selector: WORKER_POOL.map(function(workerUrl, idx) {
          return {
            default: idx === activeWorkerIndex,
            html: 'Server ' + (idx + 1) + (idx === activeWorkerIndex ? ' (Đang chọn)' : ''),
            url: workerUrl,
            index: idx
          };
        }),
        onSelect: function (item) {
          bridgeLog('🔄 [ArtPlayer]: Chuyển sang ' + item.html);
          activeWorkerIndex = item.index;
          var newPlayUrl = buildProxyUrl(rawStreamUrl, activeWorkerIndex);
          window.art.switchUrl(newPlayUrl);
          return item.html;
        }
      });
    }

    customSettings.push({
      html: 'Tỉ lệ màn hình',
      tooltip: 'Mặc định',
      selector: [
        { default: true, html: 'Mặc định', value: 'default' },
        { html: '16:9', value: '16:9' },
        { html: '4:3', value: '4:3' },
        { html: 'Phủ kín (Crop)', value: 'cover' }
      ],
      onSelect: function (item) {
        window.art.aspectRatio = item.value;
        return item.html;
      }
    });

    window.art = new Artplayer({
      container: '#artplayer-container',
      url: playUrl,
      type: isM3U8 ? 'm3u8' : 'mp4',
      autoplay: true,
      volume: 0.8,
      isLive: false,
      hotkey: true,
      setting: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      pip: true,
      autoOrientation: true,
      airplay: true,
      screenshot: true,
      theme: '#38bdf8',

      customHTML: {
        loading: \`
          <div class="custom-art-loading-box">
            <div class="custom-art-spinner"></div>
            <div class="custom-art-loading-text">Đang tải video...</div>
          </div>
        \`
      },

      customType: {
        m3u8: function (video, url, art) {
          if (Hls.isSupported()) {
            if (art.hls) art.hls.destroy();
            var hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 90,
              maxBufferLength: 30,
              maxMaxBufferLength: 600
            });

            hls.loadSource(url);
            hls.attachMedia(video);
            art.hls = hls;

            art.on('destroy', function () {
              if (art.hls) art.hls.destroy();
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
          }
        }
      }
    });

    window.art.on('ready', function() {
      bridgeLog('🎉 [ArtPlayer]: Sẵn sàng!');
      setTimeout(function() {
        container.focus();
        if (window.art && window.art.template && window.art.template.$player) {
          window.art.template.$player.focus();
        }
      }, 300);

      window.art.play().catch(function() {
        window.art.muted = true;
        window.art.play();
      });
    });

    window.addEventListener('keydown', function(e) {
      if (!window.art) return;

      var code = e.keyCode || e.which;
      var key = e.key;

      if (code === 37 || code === 21 || code === 88 || code === 412 || key === 'ArrowLeft' || key === 'MediaRewind') {
        e.preventDefault();
        e.stopPropagation();
        var targetTime = Math.max(0, window.art.currentTime - 10);
        window.art.seek = targetTime;
        window.art.notice.show = '⏪ Lùi 10s (' + Math.floor(targetTime) + 's)';
      }
      else if (code === 39 || code === 22 || code === 87 || code === 417 || key === 'ArrowRight' || key === 'MediaFastForward') {
        e.preventDefault();
        e.stopPropagation();
        var targetTime = Math.min(window.art.duration || 99999, window.art.currentTime + 10);
        window.art.seek = targetTime;
        window.art.notice.show = '⏩ Tua 10s (' + Math.floor(targetTime) + 's)';
      }
      else if (code === 38 || code === 19 || key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        window.art.volume = Math.min(1, window.art.volume + 0.1);
        window.art.notice.show = '🔊 Âm lượng: ' + Math.round(window.art.volume * 100) + '%';
      }
      else if (code === 40 || code === 20 || key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        window.art.volume = Math.max(0, window.art.volume - 0.1);
        window.art.notice.show = '🔉 Âm lượng: ' + Math.round(window.art.volume * 100) + '%';
      }
      else if (code === 32 || code === 13 || code === 23 || code === 66 || code === 179 || key === ' ' || key === 'Enter' || key === 'Select') {
        e.preventDefault();
        e.stopPropagation();
        window.art.toggle();
      }
    }, true);

  } catch (e) {
    bridgeLog('❌ [renderArtPlayer - Lỗi]: ' + e.message);
  }
} 
    `;
    }

    // =========================================================================
    // 🎨 PLAYER DISPATCHER & MAIN EXECUTION
    // =========================================================================
    function mainJS() {
        return `
    function dispatchToPlayer(mediaUrl, dispatchSource) {
      try {
        hasDispatchedAny = true;
        if (videoObserver) videoObserver.disconnect();

        bridgeLog('🎬 [DISPATCH TO PLAYER] [Nguồn: ' + dispatchSource + '] -> ' + mediaUrl);

        if (PLAYER_MODE === "EXO") {
          var playUrl = PROXY_ENABLED ? buildProxyUrl(mediaUrl, activeWorkerIndex) : mediaUrl;
          bridgeLog('📱 [DISPATCH EXO NATIVE]: ' + playUrl);

          if (window.SnifferBridge && typeof window.SnifferBridge.onMediaFound === 'function') {
            window.SnifferBridge.onMediaFound(playUrl, CUSTOM_REFERER);
          } 
          else if (window.SnifferBridge && typeof window.SnifferBridge.playVideo === 'function') {
            window.SnifferBridge.playVideo(playUrl, CUSTOM_REFERER);
          } 
          else {
            window.location.href = "intent://" + playUrl.replace(/^https?:\\/\\//, '') + "#Intent;scheme=https;type=video/*;end";
          }
        } 
        else {
          bridgeLog('🎨 [DISPATCH CUSTOM ARTPLAYER] Rendering...');
          dispatchMediaStream(mediaUrl);
          if (window.SnifferBridge && typeof window.SnifferBridge.toast === 'function') {
            window.SnifferBridge.toast("Đã setup thành công, trình phát có hỗ trợ chuyển server.");
          }
        }
      } catch (e) {
        bridgeLog('❌ [dispatchToPlayer - Lỗi]: ' + e.message);
      }
    }

    // 👀 CƠ CHẾ CƠ ĐỘNG: LẮNG NGHE THẺ <VIDEO> ĐƯỢC CHÈN VÀO DOM SAU KHI WEB LOAD
    function startVideoObserver() {
      if (hasDispatchedAny) return;
      scanVideoElements();

      if (typeof MutationObserver !== 'undefined' && !videoObserver) {
        videoObserver = new MutationObserver(function(mutations) {
          if (hasDispatchedAny) {
            if (videoObserver) videoObserver.disconnect();
            return;
          }
          scanVideoElements();
        });

        var targetNode = document.body || document.documentElement;
        if (targetNode) {
          videoObserver.observe(targetNode, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
          bridgeLog('👀 [DOM Observer]: Đã bật MutationObserver theo dõi sự xuất hiện của thẻ <video>...');
        }
      }
    }

    function beginJS() {
      try {
        bridgeLog('🚀 [GIAI ĐOẠN 1] Khởi chạy Sniffer! Tiến hành gắn Interceptors...');

        // 📡 1. GẮN INTERCEPTORS XHR & FETCH
        if (typeof XMLHttpRequest !== 'undefined') {
          var originalOpen = XMLHttpRequest.prototype.open;
          var originalSend = XMLHttpRequest.prototype.send;
          
          XMLHttpRequest.prototype.open = function (method, url) {
            try { if (url) getLinkJS(url, 'XHR.' + method); } catch (e) {}
            return originalOpen.apply(this, arguments);
          };

          XMLHttpRequest.prototype.send = function () {
            this.addEventListener('load', function () {
              try {
                if (this.responseText) {
                  var match = this.responseText.match(/(?:https?:\\/\\/[^\\s"'<>]+|\\/[^\\s"'<>]+)\\.(?:m3u8|mp4)[^\\s"'>]*/i);
                  if (match && match[0]) {
                    bridgeLog('🔍 [Phát hiện từ XHR Response Body]');
                    getLinkJS(match[0], 'XHR-ResponseBody');
                  }
                }
              } catch (e) {}
            });
            return originalSend.apply(this, arguments);
          };
        }

        if (typeof window.fetch === 'function') {
          var originalFetch = window.fetch;
          window.fetch = function (input, init) {
            var url = (typeof input === 'string') ? input : (input && input.url ? input.url : '');
            if (url) getLinkJS(url, 'Fetch');

            return originalFetch.apply(this, arguments).then(function (response) {
              try {
                var cloned = response.clone();
                cloned.text().then(function (bodyText) {
                  var match = bodyText.match(/(?:https?:\\/\\/[^\\s"'<>]+|\\/[^\\s"'<>]+)\\.(?:m3u8|mp4)[^\\s"'>]*/i);
                  if (match && match[0]) {
                    bridgeLog('🔍 [Phát hiện từ Fetch Response Body]');
                    getLinkJS(match[0], 'Fetch-ResponseBody');
                  }
                });
              } catch (e) {}
              return response;
            });
          };
        }

        // 📡 2. HOOK HLS.JS NẾU CÓ
        setInterval(function() {
          if (window.Hls && window.Hls.prototype && !window.__hlsHooked__) {
            window.__hlsHooked__ = true;
            var origLoadSource = window.Hls.prototype.loadSource;
            window.Hls.prototype.loadSource = function(url) {
              bridgeLog('🎯 [GIAI ĐOẠN 2 - Bắt qua Hls.js]: ' + url);
              getLinkJS(url, 'Hls.js-Native');
              return origLoadSource.apply(this, arguments);
            };
          }
        }, 500);

        // 🛡️ ANTI-REDIRECT SHIELD
        (function blockNavigation() {
          try {
            var noop = function() {};
            Object.defineProperty(window, 'onbeforeunload', { configurable: false, get: function() { return null; }, set: function() {} });
            if (window.location) { window.location.assign = noop; window.location.replace = noop; }
            window.open = function() { return null; };
          } catch (err) {}
        })();

        // ⏱️ TIMER TIMEOUT TOÀN CỤC: Duy trì bộ lắng nghe trong suốt 20s
        setTimeout(function() {
          if (!hasDispatchedAny) {
            bridgeLog('⚠️ [CẢNH BÁO TIMEOUT] Đã hết thời gian chờ (' + (SNIFFER_TIMEOUT_MS/1000) + 's) nhưng chưa bắt được link nào!');
            onSnifferFailed();
          }
        }, SNIFFER_TIMEOUT_MS);

        // Bật ngay Observer và chạy vòng lặp quét ban đầu
        startVideoObserver();
        handleMainExecution();

        // Lắng nghe sự kiện load để quét bổ sung
        if (document.readyState !== 'complete') {
          window.addEventListener('load', function() {
            bridgeLog('🚀 [GIAI ĐOẠN 3] Sự kiện window.load đã kích hoạt, quét lại DOM & Video Tags...');
            handleMainExecution();
          });
        }

      } catch (e) {
        bridgeLog('❌ [beginJS - Lỗi]: ' + e.message);
      }
    }

    function onSnifferFailed() {
      try {
        if (hasDispatchedAny) return;

        if (snifferQueue.length > 0) {
          bridgeLog('🔄 [Sniffer Fallback]: Thử giải cứu bằng hàng đợi dự phòng...');
          triggerSnifferFallback();
          return;
        }

        bridgeLog('❌ [KẾT QUẢ THẤT BẠI HOÀN TOÀN]: Không thể tìm thấy bất kỳ link media nào hợp lệ!');

        if (typeof window.hideLoadingScreen === 'function') {
          window.hideLoadingScreen();
        }

        if (window.SnifferBridge && typeof window.SnifferBridge.toast === 'function') {
          window.SnifferBridge.toast("❌ Thất bại: Không tìm thấy link video nào!");
        }

        if (window.SnifferBridge && typeof window.SnifferBridge.onFailed === 'function') {
          window.SnifferBridge.onFailed("NOT_FOUND");
        }
      } catch (e) {
        bridgeLog('❌ [onSnifferFailed - Lỗi]: ' + e.message);
      }
    }

    function isDomainAllowed(url) {
      try {
        if (!ENABLE_FILTER) return true;
        var parsedUrl = new URL(url);
        var hostname = parsedUrl.hostname.toLowerCase();

        if (BLOCKED_DOMAINS && BLOCKED_DOMAINS.length > 0) {
          for (var i = 0; i < BLOCKED_DOMAINS.length; i++) {
            var blockPattern = BLOCKED_DOMAINS[i].toLowerCase().trim();
            if (hostname.indexOf(blockPattern.replace('*', '')) !== -1) return false;
          }
        }
        return true;
      } catch (e) {
        return true;
      }
    }

    function buildProxyUrl(targetUrl, workerIdx) {
      try {
        if (!PROXY_ENABLED || !WORKER_POOL || WORKER_POOL.length === 0) return targetUrl;
        var selectedWorker = WORKER_POOL[workerIdx % WORKER_POOL.length];
        return selectedWorker + "?url=" + encodeURIComponent(targetUrl) + "&referer=" + encodeURIComponent(CUSTOM_REFERER);
      } catch (e) {
        return targetUrl;
      }
    }

    function dispatchMediaStream(rawStreamUrl) {
      try {
        var playUrl = PROXY_ENABLED ? buildProxyUrl(rawStreamUrl, activeWorkerIndex) : rawStreamUrl;
        bridgeLog('🎨 [dispatchMediaStream]: Tải CDN ArtPlayer cho link -> ' + playUrl);
        loadAndRenderArtPlayer(playUrl, rawStreamUrl);
      } catch (e) {
        bridgeLog('❌ [dispatchMediaStream - Lỗi]: ' + e.message);
      }
    }

    function loadAndRenderArtPlayer(initialPlayUrl, rawStreamUrl) {
      try {
        if (!document.getElementById('artplayer-css')) {
          var linkCss = document.createElement('link');
          linkCss.id = 'artplayer-css';
          linkCss.rel = 'stylesheet';
          linkCss.href = 'https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.css';
          document.head.appendChild(linkCss);
        }

        var loadedCount = 0;
        function checkLoaded() {
          loadedCount++;
          if (loadedCount >= 2) renderArtPlayer(initialPlayUrl, rawStreamUrl);
        }

        if (typeof Hls === 'undefined') {
          var scriptHls = document.createElement('script');
          scriptHls.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
          scriptHls.onload = checkLoaded;
          document.head.appendChild(scriptHls);
        } else {
          checkLoaded();
        }

        if (typeof Artplayer === 'undefined') {
          var scriptArt = document.createElement('script');
          scriptArt.src = 'https://cdn.jsdelivr.net/npm/artplayer/dist/artplayer.js';
          scriptArt.onload = checkLoaded;
          document.head.appendChild(scriptArt);
        } else {
          checkLoaded();
        }
      } catch (e) {
        bridgeLog('❌ [loadAndRenderArtPlayer - Lỗi]: ' + e.message);
      }
    }

    ${artPlayer()}

    function scanVideoElements() {
      if (hasDispatchedAny) return;
      try {
        var videos = document.getElementsByTagName('video');
        if (videos.length > 0) {
          bridgeLog('🔍 [Quét DOM] Tìm thấy ' + videos.length + ' thẻ <video>');
          for (var i = 0; i < videos.length; i++) {
            if (hasDispatchedAny) break;
            var v = videos[i];
            if (v.currentSrc) getLinkJS(v.currentSrc, 'HTMLVideoElement.currentSrc');
            if (v.src) getLinkJS(v.src, 'HTMLVideoElement.src');
          }
        }
      } catch (e) {
        bridgeLog('❌ [scanVideoElements - Lỗi]: ' + e.message);
      }
    }

    // 🔍 VÒNG LẶP QUÉT TỰ ĐỘNG CÓ BỘ CHỜ (POLLING / RETRY LOOP)
    function handleMainExecution() {
      if (hasDispatchedAny) return;

      try {
        executionRetries++;
        bridgeLog('👉 [CHUỖI QUÉT THUẬN THỤC - LẦN ' + executionRetries + '/' + maxExecutionRetries + ']');
        
        // 1. Kiểm tra đối tượng window.videoData (dành cho các trang như JWPlayer nhúng config vào JS)
        try {
          if (window.videoData && window.videoData.sources) {
            for (var k = 0; k < window.videoData.sources.length; k++) {
              if (window.videoData.sources[k].file) {
                bridgeLog('🎉 [BƯỚC 1 - window.videoData]: Tìm thấy link video -> ' + window.videoData.sources[k].file);
                getLinkJS(window.videoData.sources[k].file, 'window.videoData');
                if (hasDispatchedAny) return;
              }
            }
          }
        } catch(e) {}

        // Thử Custom Decoder nếu bật
        if (typeof USE_CUSTOM_DECODER !== 'undefined' && USE_CUSTOM_DECODER && typeof setVideo === 'function') {
          var success = setVideo(window.location.href, 'DirectDOM');
          if (success) {
            bridgeLog('✅ [BƯỚC 1 THÀNH CÔNG]: Lấy được link qua Custom Decoder!');
            return;
          }
        }

        // 2. Quét thẻ <video> trong DOM
        scanVideoElements();
        if (hasDispatchedAny) {
          bridgeLog('✅ [BƯỚC 2 THÀNH CÔNG]: Đã bắt được link từ thẻ <video>!');
          return;
        }

        // 3. Quét mã nguồn HTML thô (Bắt cả link tuyệt đối http:// và link tương đối /videos/...)
        var fullHtml = document.documentElement ? document.documentElement.outerHTML : '';
        var rawMatches = fullHtml.match(/(?:https?:\\/\\/[^\\s"'<>]+|\\/[^\\s"'<>]+\\.(?:m3u8|mp4))[^\\s"'>]*/gi);
        
        if (rawMatches && rawMatches.length > 0) {
          for (var j = 0; j < rawMatches.length; j++) {
            var cleanUrl = rawMatches[j].replace(/["']/g, '');
            getLinkJS(cleanUrl, 'RawHTML-Scan');
            if (hasDispatchedAny) {
              bridgeLog('✅ [BƯỚC 3 THÀNH CÔNG]: Tìm thấy link trong HTML thô -> ' + cleanUrl);
              return;
            }
          }
        }

        // 🔄 NẾU CHƯA TÌM THẤY: Hẹn giờ quét lại lần tiếp theo (Không gọi onSnifferFailed ngay)
        if (!hasDispatchedAny && executionRetries < maxExecutionRetries) {
          bridgeLog('⏳ Chưa có link media nào xuất hiện, sẽ quét lại lần thứ ' + (executionRetries + 1) + ' sau 1s...');
          setTimeout(handleMainExecution, 1000);
        }

      } catch (e) {
        bridgeLog('❌ [handleMainExecution - Lỗi thực thi]: ' + e.message);
      }
    }

    `;
    }

    // =========================================================================
    // LOADING SCREEN JS
    // =========================================================================
    function loadingSC() {
        return `
  (function () {
  var loadingCSS = \`
    #custom-loading-screen {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background-color: #0f172a !important;
      z-index: 99999999 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      transition: opacity 0.4s ease, visibility 0.4s ease !important;
    }

    .custom-spinner {
      width: 50px !important;
      height: 50px !important;
      border: 4px solid rgba(255, 255, 255, 0.1) !important;
      border-left-color: #38bdf8 !important;
      border-radius: 50% !important;
      animation: custom-spin 1s linear infinite !important;
    }

    .custom-loading-text {
      margin-top: 16px !important;
      color: #f8fafc !important;
      font-size: 15px !important;
      font-weight: 500 !important;
      letter-spacing: 0.5px !important;
    }

    @keyframes custom-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  \`;

  function injectLoadingScreen() {
    if (document.getElementById('custom-loading-screen')) return;

    var styleNode = document.createElement('style');
    styleNode.id = 'custom-loading-style';
    styleNode.textContent = loadingCSS;

    var loadingNode = document.createElement('div');
    loadingNode.id = 'custom-loading-screen';
    loadingNode.innerHTML = \`
      <div class="custom-spinner"></div>
      <div class="custom-loading-text">Đang tải dữ liệu...</div>
    \`;

    var target = document.head || document.documentElement;
    target.appendChild(styleNode);
    document.documentElement.appendChild(loadingNode);
  }

  window.hideLoadingScreen = function () {
    var screen = document.getElementById('custom-loading-screen');
    if (screen) {
      screen.style.opacity = '0';
      screen.style.visibility = 'hidden';
      setTimeout(function () {
        if (screen && screen.parentNode) {
          screen.parentNode.removeChild(screen);
        }
      }, 400);
    }
  };

  injectLoadingScreen();

  if (document.readyState === 'complete') {
    window.hideLoadingScreen();
  } else {
    window.addEventListener('load', window.hideLoadingScreen);
  }
})();
  `;
    }

    // =========================================================================
    // KẾT NỐI TOÀN BỘ SCRIPT
    // =========================================================================
    return `
(function initEnhancedVideoSniffer() {
  if (window.__SNIFFER_INITIALIZED__) return;
  window.__SNIFFER_INITIALIZED__ = true;

  try {
    ${loadingSC()}
    ${configJS()}
    ${setVideoJS()}
    ${getLinkJS()}
    ${mainJS()}

    beginJS();

  } catch (globalErr) {
    if (typeof bridgeLog === 'function') {
      bridgeLog('❌ [initEnhancedVideoSniffer - Lỗi Toàn Cục]: ' + globalErr.message);
    }
  }
})();
  `;
}



// KHỚP MẪU ROPHIMFAKE: Trả về chuỗi text thuần túy thay vì gọi JSON.stringify
//function parseCategoriesResponse(html) { return "[]"}
function parseCategoriesResponse(apiResponseJson) {
    var listurl = `
categories/viet-nam@@Việt Nam
categories/nga-russia@@Nga(Russia)
categories/vu-to@@Vú To
categories/tap-the@@Tập Thể
categories/hiep-dam@@Hiếp Dâm
categories/loan-luan@@Loạn Luân
categories/phim-cap-3@@Phim Cap 3
categories/vietsub@@Vietsub
categories/choi-lo-dit-anal-sex@@Chơi lỗ đít(Anal Sex
categories/nhat-ban@@Nhật Bản
`
    var menulist = buildMenu(listurl);
    
    return JSON.stringify(menulist);
}
function parseCountriesResponse(html) { return "[]"}
function parseYearsResponse(html) { return "[]"}
