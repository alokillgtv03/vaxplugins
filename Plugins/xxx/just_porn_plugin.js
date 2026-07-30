var BASEURL = "https://www.justporn.com";

function getManifest() {
  return JSON.stringify({
    "id": "justporn",
    "name": "Just Porn",
    "description": "XXX Hay",
    "version": "1.5.8",
    "info": "Nguồn phim XXX chất lượng cao.",
    "baseUrl": "https://www.justporn.com",
    "iconUrl": "https://c847a9a666.mjedge.net/contents/pkehlvuovbaw/theme/logo.png",
    "isEnabled": true,
    "isAdult": true,
    "layoutType": "HORIZONTAL",
    "type": "VIDEO",
    debug: true,
    "playerType": "embed"
  });
}
// https://www.justporn.com/latest-updates/1/
function getHomeSections() {
  return JSON.stringify([{
    "slug": "/latest-updates/",
    "title": "Hàng Mới",
    "type": "Grid"
  }]);
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
// https://www.justporn.com/latest-updates/4/
// https://www.justporn.com/categories/big-dick/5/
// https://www.justporn.com/search/blacked/5/

function getUrlList(slug, filtersJson) {
  try {
    // 1. Kiểm tra nếu slug là link tuyệt đối (chứa http) và không có bộ lọc thì trả về luôn
    if (slug && slug.indexOf("http") !== -1 && slug.indexOf("/search/") !== -1) {
      // thường là link search sẽ bị trả về ở đây
      return slug;
    }
    let page = 1;
    let path = slug || "";

    // 2. Xử lý an toàn filtersJson nếu có truyền vào
    if (filtersJson) {
      // Nếu có số trang hoặc  có menu categ
      // Sửa lỗi nếu JSON thiếu dấu ngoặc kép ở key hoặc sai cú pháp cơ bản
      let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/:,/g, ':'); // Sửa lỗi nếu truyền kiểu {"page",24} thành {"page":24}

      try {
        let filters = JSON.parse(fixedJson);
        page = parseInt(filters.page) || 1;

        // Nếu có category trong JSON, ưu tiên lấy category làm đường dẫn (path)
        if (filters.category) {
          if (Array.isArray(filters.category) && filters.category.length > 0) {
            path = filters.category[0].slug;
          } else if (typeof filters.category === 'string') {
            path = filters.category;
          }
        }
      } catch (jsonErr) {
        //console.log("JSON parse lỗi, dùng giá trị mặc định");
      }
    }

    // 4. Chuẩn hóa path (Xóa dấu gạch chéo thừa ở đầu/cuối để tránh nhân đôi dấu //)        
    // 5. Nối chuỗi URL kết quả
    let resultUrl = BASEURL;
    if (path) {
      resultUrl += path;
    }

    if (page > 1) {
      resultUrl += page + "/";
    }

    // Trả về kết quả, chỉ gộp dấu // ở phần path, giữ nguyên https://
    return resultUrl.replace(/([^:]\/)\/+/g, "$1");

  } catch (e) {
    // console.log("Lỗi hệ thống: " + e.message);
    // Trả về URL gốc an toàn nếu có lỗi
    let fallback = BASEURL + (slug ? "/" + slug : "");
    return fallback.replace(/([^:]\/)\/+/g, "$1");
  }
}

// --- KHU VỰC TEST CÁC TRƯỜNG HỢP ---
// https://www.justporn.com/latest-updates/4/
// https://www.justporn.com/categories/big-dick/5/
// https://www.justporn.com/search/blacked/5/
//BASEURL = "https://www.justporn.com";
//filtersJson = '{"page":1,"category":[{"slug":"/categories/big-dick/","name":"big-dick"}]}';
//filtersJson = '{"page":3}';
//console.log(getUrlList("/latest-updates/", filtersJson));

function getUrlSearch(keyword, filtersJson) {
  return BASEURL + "/search/" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
  if (!slug) return "";
  if (slug.indexOf('http') === 0) return slug;
  return BASEURL + slug;
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
    //.thumb_rel item
    var regexList =
      /thumb_rel[^"]+item[\s\S]*?href="([^"']+)"[^>]+title="([^"']+)"[\s\S]*?data-webp="([^"']+)"/g;
    var matchList;
    // regexList.exec(html)
    while ((matchList = regexList.exec(html)) !== null) {
      if (matchList[1] && matchList[1].indexOf("http") > -1) {
        var cleanThumb = matchList[3].replace(/&amp;/g, '&');
        items.push({
          "id": matchList[1],
          "title": matchList[2].trim(),
          "posterUrl": cleanThumb,
          "backdropUrl": cleanThumb
        });
      }
    }

    var totalPages = 999;
    var currentPage = 1;

    return JSON.stringify({
      "items": items,
      "pagination": {
        "currentPage": currentPage,
        "totalPages": totalPages
      }
    });
  } catch (e) {
    var items = [];
    items.push({
      "id": $url,
      "title": "Lỗi: " + e,
      "posterUrl": "",
      "backdropUrl": ""
    });
    return JSON.stringify({
      "items": items,
      "pagination": {
        "currentPage": 1,
        "totalPages": 1
      }
    });
  }
}
//var html = $("html")[0].outerHTML;
//JSON.parse(parseListResponse(html))

function parseSearchResponse(html) {
  return parseListResponse(html);
}

function parseMovieDetail(html, $url) {
  var lurl = "";
  var limg = "";
  var lname = "Đang cập nhật...";
  var ldes = "Không có mô tả.";
  var streamUrl = ""; // ĐÃ SỬA: Khai báo rõ ràng biến streamUrl tránh lỗi Global leak

  var rmatch = html.match(/link\s+rel="canonical"\s+href="([^"]+)"/i);
  if (rmatch && rmatch[1]) {
    lurl = rmatch[1].replace("https://xhamster.com", BASEURL);
  }

  rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (rmatch && rmatch[1]) {
    limg = rmatch[1];
  }

  rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
  if (rmatch && rmatch[1]) {
    lname = rmatch[1];
  }

  rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
  if (rmatch && rmatch[1]) {
    ldes = rmatch[1];
  }
  var stream1 = "";
  var stream2 = "";
  var streamname1 = "";
  var streamname2 = "";
  var epi = [];
  var script = html.match(/var\s+flashvars\s+=\s+({[\s\S]*?}\;)/i);
  if (script && script[1]) {
    var jsonObj = new Function(`return ${script[1]}`)();
    if (jsonObj.video_alt_url && jsonObj.video_alt_url.match(/http|.mp4/)) {
      stream1 = jsonObj.video_alt_url;
      streamname1 = "Độ Phân Giải: " + jsonObj.video_alt_url_text;
      epi.push({id: stream1 + "#video.m3u8",name: streamname1,slug: "full"});
      stream2 = jsonObj.video_url;
      streamname2 = "Độ Phân Giải: " + jsonObj.video_url_text;
      epi.push({id: stream2 + "#video.m3u8",name: streamname2,slug: "full"});
    } else {
      stream1 = jsonObj.video_url;
      streamname1 = "Độ Phân Giải: " + jsonObj.video_url_text;
      epi.push({id: stream1 + "#video.m3u8",name: streamname1,slug: "full"});
    }
  }
  
  

  return JSON.stringify({
    id: $url,
    title: lname,
    posterUrl: limg,
    backdropUrl: limg,
    description: ldes,
    servers: [{
      name: "Servers: ",
      episodes: epi
    }],
    quality: "HD",
    year: 2026,
    rating: 8.5,
    status: "Full",
    duration: "N/A",
    casts: "N/A",
    director: "N/A",
    category: "18+"
  });
}
//BASEURL = "https://www.justporn.com";
//var html = $("html")[0].outerHTML;
//var $url = "https://www.justporn.com/video/18058/hot-babe-remy-cheats-with-bbc/";
//JSON.parse(parseMovieDetail(html,$url))
// var flashvars = {

function parseDetailResponse(html, url) {
    try {
console.log("parseDetailResponse: " + url)
  var stream1 = "";
  var script = html.match(/var\s+flashvars\s+=\s+({[\s\S]*?}\;)/i);
  if (script && script[1]) {
    var jsonObj = new Function(`return ${script[1]}`)();
    if (jsonObj.video_alt_url && jsonObj.video_alt_url.match(/http|.mp4/)) {
      stream1 = jsonObj.video_alt_url;
    } else {
      stream1 = jsonObj.video_url;
    }
  }
console.log("Stream: " + stream1)

        return JSON.stringify({
          "url": stream1,
          "isEmbed": false,
          "mimeType": "video/mp4",
          "headers": {
            "Referer": BASEURL,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Custom-Js": customjs()
          },
          "subtitles": []
        });
        
    } catch (e) {
        return JSON.stringify({ "url": "", "headers": {} });
    }
}


function customjs(){
  return `
  // 1. Hàm khởi tạo ArtPlayer
(function () {
  // 1. Hàm tạo Log chuẩn chuẩn đoán lỗi
  function log(type, message, detail) {
    const time = new Date().toISOString().split('T')[1].slice(0, -1);
    const prefix = \`[ArtPlayer-Loader ${time}] [${type.toUpperCase()}]\`;
    if (detail !== undefined) {
      console[type](\`${prefix} ${message}\`, detail);
    } else {
      console[type](\`${prefix} ${message}\`);
    }
  }

  // Log ngay lập tức khi file JS vừa được nạp vào browser
  log('info', '🚀 Script đã bắt đầu nạp vào trang web...');
  log('info', 'Trạng thái DOM hiện tại (readyState):', document.readyState);

  // 2. Hàm khởi tạo ArtPlayer
  function initArtPlayer(videoSrc) {
    log('info', 'Đang tìm container chứa ArtPlayer...');
    const playerContainer = document.querySelector('#artplayer') || document.querySelector('.artplayer-app');

    if (!playerContainer) {
      log('error', '❌ LỖI: Không tìm thấy container (#artplayer hoặc .artplayer-app) trên DOM!');
      return false;
    }

    if (typeof Artplayer === 'undefined') {
      log('error', '❌ LỖI: Chưa nhúng thư viện ArtPlayer! Vui lòng thêm file artplayer.js vào HTML.');
      return false;
    }

    log('info', 'Đang khởi tạo ArtPlayer với URL:', videoSrc);

    try {
      const art = new Artplayer({
        container: playerContainer,
        url: videoSrc,
        autoplay: false,
        pip: true,
        screenshot: true,
        setting: true,
        fullscreen: true,
        fullscreenWeb: true,
      });

      log('info', '🎉 Khởi tạo thành công ArtPlayer!', art);
      return true;
    } catch (err) {
      log('error', '💥 Khởi tạo ArtPlayer thất bại:', err);
      return false;
    }
  }

  // 3. Hàm trích xuất SRC từ thẻ video
  function getVideoSourceAndInit() {
    log('info', 'Đang truy tìm thẻ <video>...');
    const videoElement = document.querySelector('video');

    if (!videoElement) {
      log('warn', 'Chưa phát hiện thẻ <video> nào trên trang.');
      return false;
    }

    log('info', 'Thẻ <video> đã tìm thấy:', videoElement);

    // Tìm URL nguồn video
    let src = videoElement.src;
    if (!src) {
      log('info', 'Thẻ <video> không có thuộc tính src trực tiếp, đang tìm thẻ <source> bên trong...');
      const sourceElement = videoElement.querySelector('source');
      if (sourceElement) {
        src = sourceElement.src;
      }
    }

    if (!src || src.trim() === '' || src.startsWith('blob:http') === false && src.startsWith('http') === false && !src.startsWith('data:')) {
      log('warn', 'Thẻ video tồn tại nhưng thuộc tính src bị rỗng hoặc chưa load xong link!');
      return false;
    }

    log('info', '🔍 Đã lấy được link video thành công:', src);

    // Dừng và ẩn video HTML5 gốc
    try {
      videoElement.pause();
      videoElement.style.display = 'none';
      log('info', 'Đã ẩn và dừng thẻ <video> gốc thành công.');
    } catch (e) {
      log('warn', 'Không thể tạm dừng video gốc:', e);
    }

    // Tiến hành tạo ArtPlayer
    return initArtPlayer(src);
  }

  // 4. Lắng nghe và xử lý đa kịch bản (DOM Ready, Window Loaded, MutationObserver)
  function startProcess() {
    log('info', 'Bắt đầu quá trình tìm kiếm video và khởi tạo...');
    const isSuccess = getVideoSourceAndInit();

    if (!isSuccess) {
      log('info', 'Kích hoạt MutationObserver để theo dõi sự thay đổi DOM (dành cho trang load bằng Ajax/React/Vue)...');
      
      const observer = new MutationObserver((mutations, obs) => {
        log('info', 'Phát hiện DOM thay đổi, thử kiểm tra lại thẻ <video>...');
        if (getVideoSourceAndInit()) {
          log('info', 'Đã tìm thấy video qua MutationObserver! Tiến hành hủy lắng nghe Observer.');
          obs.disconnect();
        }
      });

      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src']
      });
    }
  }

  // Kiểm tra thời điểm khởi chạy
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    log('info', 'Trang đã sẵn sàng (DOM/Window loaded), chạy startProcess ngay.');
    startProcess();
  } else {
    log('info', 'Trang chưa tải xong, đăng ký sự kiện DOMContentLoaded và load...');
    document.addEventListener('DOMContentLoaded', () => {
      log('info', 'Sự kiện DOMContentLoaded vừa kích hoạt.');
      startProcess();
    });
    window.addEventListener('load', () => {
      log('info', 'Sự kiện window.load vừa kích hoạt.');
      startProcess();
    });
  }
})();
  `
}


function parseCategoriesResponse(apiResponseJson) {
  var listurl = getLISTmenu();
  var menulist = buildMenu(listurl);
  return JSON.stringify(menulist);
}

function parseCountriesResponse(html) {
  return "[]";
}

function parseYearsResponse(html) {
  return "[]";
}

function getLISTmenu() {
  return `
/categories/big-tits/@@Big Tits
/categories/blonde/@@Blonde
/categories/handjob/@@Handjob
/categories/cumshot/@@Cumshot
/categories/milf/@@MILF
/categories/teen/@@Teen (18+)
/categories/big-dick/@@Big Dick
/categories/blowjob/@@Blowjob
/categories/facial/@@Facial
/categories/interracial/@@Interracial
/categories/brunette/@@Brunette
/categories/bisexual-male/@@Bisexual Male
/categories/big-ass/@@Big Ass
/categories/homemade/@@Homemade
/categories/webcam/@@Webcam
/categories/asian/@@Asian
/categories/tattooed-women/@@Tattooed Women
/categories/creampie/@@Creampie
/categories/deepthroat/@@Deepthroat
/categories/small-tits/@@Small Tits
/categories/casting/@@Casting
/categories/toys/@@Toys
/categories/anal/@@Anal
/categories/cowgirl/@@Cowgirl
/categories/hentai/@@Hentai
/categories/amateur/@@Amateur
/categories/czech/@@Czech
/categories/hq-porn/@@HQ Porn
/categories/outdoor/@@Outdoor
/categories/rimming/@@Rimming
/categories/public/@@Public
/categories/lingerie/@@Lingerie
/categories/pussy-licking/@@Pussy Licking
/categories/porn-for-women/@@Porn For Women
/categories/fingering/@@Fingering
/categories/hairy/@@Hairy
/categories/pornstars/@@Pornstars
/categories/old-young/@@Old/Young (18+)
/categories/solo-female/@@Solo Female
/categories/petite/@@Petite (18+)
/categories/rough-sex/@@Rough Sex
/categories/bondage/@@Bondage
/categories/latina/@@Latina
/categories/compilation/@@Compilation
/categories/bukkake/@@Bukkake
/categories/threesome/@@Threesome
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
      item = {
        "slug": link,
        "name": name
      };
    }
    menulist.push(item);
  }
  return menulist;
}