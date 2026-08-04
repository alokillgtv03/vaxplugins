BASEURL = "https://viet69z.me";

function getManifest() {
    return JSON.stringify({
        "id": "viet69",          
        "name": "Viet69",
        "description": "XXX Hay",
        "version": "1.5.4",             
        "baseUrl": "https://viet69z.me",
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/viet69.png", 
        "isEnabled": true,
        "isAdult": true,
        "adblock": true,
        "layoutType": "HORIZONTAL",
        "type": "VIDEO",
        "playerType": "embed"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "?s=Vi%E1%BB%87t+nam", "title": "Việt Nam", "type": "HORIZONTA" },
        { "slug": "?s=Hi%E1%BA%BFp+d%C3%A2m", "title": "Hiếp Dâm", "type": "HORIZONTAL" },
        { "slug": "", "title": "Sex Mới", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "slug": "sinh-vien", "name": "Sinh Viên" },
        { "slug": "may-bay-ba-gia", "name": "Máy Bay" },
        { "slug": "?s=Vi%E1%BB%87t+nam", "name": "Việt Nam" },
        { "slug": "?s=T%E1%BA%ADp+th%E1%BB%83", "name": "Tập Thể" }, // ĐÃ SỬA: Thêm dấu phẩy ở đây
        { "slug": "?s=Hi%E1%BA%BFp+d%C3%A2m", "name": "Hiếp Dâm" }
    ]);
}

function getFilters() {
    return JSON.stringify({
        "sort": [
            { "name": "Mới nhất", "value": "newest" }
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
        if (filtersJson.category) {
            return BASEURL + "/" + filters.category + "/page/" + page;
        }
        if (page > 1) {
            if (slug.indexOf("s=") > -1) {
                 return BASEURL + "/page/" + page + "/" + slug;
            } else {
                 return BASEURL + "/" + slug + "/page/" + page;
            }
        }
        return BASEURL + "/" + slug;
    } catch (e) {
        return BASEURL + "/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/?s=" + encodeURIComponent(keyword);
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
        var pattern = /(?=<div[^>]*class="[^"]*entry-video__thumbnail[^"]*")/g;
        var splitItems = html.split(pattern).filter(Boolean);

        for (var j = 1; j < splitItems.length; j++) {
            var block = splitItems[j];
            var hrefMatch = block.match(/href="([^"]+)"/i);
            if (!hrefMatch) continue; 

            var id = hrefMatch[1].trim();
            var title = "";
            
            var altMatch = block.match(/title="([^"]+)"/i);
            if (altMatch) {
                title = altMatch[1].trim();
            } else {
                var labelMatch = block.match(/aria-label="([^"]+)"/i); // ĐÃ SỬA: Fallback sang aria-label thay vì trùng lặp quét title
                title = labelMatch ? labelMatch[1].trim() : "";
            }
            
            if (!title || title === "Video không tiêu đề") {
                continue; 
            }
            
            var srcMatch = block.match(/img[\s\S]*?src="([^"]+)"/i);
            var posterUrl = srcMatch ? srcMatch[1].trim() : "https://ic-vt-nss.cdnsolutions.media/a/YjgwNDg0MGRkZWVjZjQ1ZGVhZjc5MzQ0ZWJkMDlhOTA/s(w:1280,h:720),webp/026/522/500/1280x720.17475568.jpg";
            
            items.push({
                "id": id,          
                "title": title, 
                "posterUrl": posterUrl, 
                "backdropUrl": posterUrl
            });
        }
		
        // ĐÃ SỬA: Loại bỏ khai báo trùng lặp var/const cho biến currentPage
        var currentRegex = /aria-current="page"[^>]*>([\d]+)<\/span>/;
        var currentMatch = html.match(currentRegex);
        var parsedCurrentPage = currentMatch ? parseInt(currentMatch[1], 10) : 1;

        // Tìm trang cuối cùng (Last Page)
        var pageNumRegex = /\/page\/([\d]+)\//g;
        var match;
        var maxPage = 1; 

        while ((match = pageNumRegex.exec(html)) !== null) {
            var pageNum = parseInt(match[1], 10);
            if (pageNum > maxPage) {
                maxPage = pageNum;
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { 
                "currentPage": parsedCurrentPage, 
                "totalPages": maxPage, 
                "totalItems": 20 * maxPage,
                "itemsPerPage": 20
            }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    var lurl = "";
    var limg = "";
    var lname = "Đang cập nhật...";
    var ldes = "Không có mô tả.";

    var rmatch = html.match(/<meta[^>]*?property="og:url"[^>]*?content="([^"\s]+)"|<meta[^>]*?content="([^"\s]+)"[^>]*?property="og:url"/i);
    if (rmatch) { lurl = rmatch[1] || rmatch[2]; }

    rmatch = html.match(/property="og:image" content="([^"]+)"/i);
if (rmatch && rmatch[1]) { limg = rmatch[1].replace(/\?[\s\S]*?$/i, ""); }

    rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { lname = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { ldes = rmatch[1]; }   
     
    var streamUrl = "";
    var iframeMatch = html.match(/src="(https:\/\/emb\.cd-vs\.com\/embed\/[^"]+)"/i);
   	if (iframeMatch && iframeMatch[1]) { streamUrl = iframeMatch[1]; }
    var $return = {
        id: lurl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: ldes,
        servers: [
            {
                name: "Server",
                episodes: [
                    { id: lurl, name: "Xem Ngay", slug: "full" }
                ]
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
    };
    var jsonreturn = JSON.stringify($return);
    $return.description = jsonreturn;
    return JSON.stringify($return);
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

function parseDetailResponse(html, url) {
  console.log("parseDetailResponse [Tầng 1]: " + url); //console.log("parseDetailResponse [Raw]: " + html);
  try {    
    return JSON.stringify({
        url: url,
        isEmbed: false,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": BASEURL,
          "Origin": BASEURL,
          "Block-Ads": true,
          "Block-Css": "html,body",
          "Custom-Js": runJS()
        }
   });
  }
  catch (e) {
    console.log("[Lỗi parseDetailResponse]", e);
    return JSON.stringify({ url: "", isEmbed: false, headers: {} });
  }
}
/*
function parseEmbedResponse(html, url) {
  console.log("parseEmbedResponse [Tầng tiếp theo]: " + url); //console.log("parseEmbedResponse [Raw]: " + html);
  try {
    log("embedRaw:\n" + html);
    return JSON.stringify({
      url: url,
      isEmbed: false, // Tự động trả về false khi đã bóc tới tầng cuối!
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": url,
          "Origin": url,
          "Custom-Js": runJS(url)
      }
    });
  } catch (e) {
    console.log("[Lỗi parseEmbedResponse]", e);
    return JSON.stringify({ url: "", isEmbed: false, headers: {} });
  }
}
*/


function runJS(framesrc) {
return `
HTMLRAW = 0; // Lấy html raw để coi thử
BODYRAW = 0; // lấy body để coi thử
CSSBLOCK = 1; // bật tắt css block
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
    const cssStyle = "body,html,body *{display:none!important,backgroud:black!important;opacity:0!important;z-index:-999999}";
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


window.addEventListener('load', function() {
  var iframe = document.getElementById('jsVideoIframe');
  var listServers = document.getElementById('jsListServers');

  if (!iframe) return;

  // 1. Trích xuất dữ liệu Server từ #jsListServers
  var serverOptions = [];
  if (listServers) {
    var items = listServers.querySelectorAll('li');
    items.forEach(function(item) {
      var name = item.textContent.trim();
      var rawBase64 = item.getAttribute('data-url');
      if (rawBase64) {
        serverOptions.push({ name: name, base64: rawBase64 });
      }
    });
  }

  // 2. Lấy cây DOM tổ tiên của iframe để giữ lại
  var keepNodes = new Set();
  var current = iframe;
  while (current) {
    keepNodes.add(current);
    current = current.parentNode;
  }

  // 3. Xóa sạch các DOM thừa khác
  function cleanDOM(parent) {
    Array.from(parent.childNodes).forEach(function(child) {
      if (!keepNodes.has(child)) {
        parent.removeChild(child);
      } else if (child.hasChildNodes()) {
        cleanDOM(child);
      }
    });
  }
  cleanDOM(document.documentElement);

  // 4. Tạo thẻ div wrapper để căn giữa iframe
  var wrapper = document.createElement('div');
  wrapper.id = 'videoWrapper';
  iframe.parentNode.insertBefore(wrapper, iframe);
  wrapper.appendChild(iframe);

  // 5. Tạo thẻ select đổi Server
  var selectEl = document.createElement('select');
  selectEl.id = 'customServerSelect';

  serverOptions.forEach(function(srv) {
    var opt = document.createElement('option');
    opt.value = srv.base64;
    opt.textContent = srv.name;
    selectEl.appendChild(opt);
  });

  // 6. Tạo Popup thông báo nền đen giữa màn hình
  var popup = document.createElement('div');
  popup.id = 'customPopup';

  var popupText = document.createElement('span');
  popupText.innerHTML = 'Nếu video tải quá lâu hoặc bị lỗi.<br>Vui lòng đổi sang Server khác ở góc trên bên phải!';

  var closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.id = 'closePopupBtn';

  popup.appendChild(popupText);
  popup.appendChild(closeBtn);

  // Xử lý đóng Popup khi nhấn nút ✕
  function hidePopup() {
    if (popup && popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
  }
  closeBtn.addEventListener('click', hidePopup);

  // Tự động ẩn Popup sau 5 giây (5000ms)
  setTimeout(hidePopup, 5000);

  // 7. Hàm decode base64 và đổi link iframe
  function changeServer(base64Data) {
    try {
      var decodedUrl = atob(base64Data);
      iframe.src = 'https://emb.cd-vs.com/embed/' + decodedUrl;
    } catch (e) {
      console.error('Lỗi decode base64:', e);
    }
  }

  selectEl.addEventListener('change', function(e) {
    changeServer(e.target.value);
  });

  if (serverOptions.length > 0) {
    changeServer(serverOptions[0].base64);
  }

  // 8. Thẻ style nén 1 dòng (chứa CSS cho wrapper, select và popup)
  var styleEl = document.createElement('style');
  styleEl.textContent = 'html,body{width:100vw !important;height:100vh !important;margin:0 !important;padding:0 !important;overflow:hidden !important;background:#000 !important;}#videoWrapper{position:fixed !important;top:0 !important;left:0 !important;width:100vw !important;height:100vh !important;display:flex !important;justify-content:center !important;align-items:center !important;z-index:1 !important;background:#000 !important;}#jsVideoIframe{width:100% !important;height:90% !important;max-width:100vw !important;max-height:100vh !important;border:none !important;margin:0 !important;padding:0 !important;display:block !important;}#customServerSelect{position:fixed !important;top:15px !important;right:15px !important;z-index:99999999 !important;padding:8px 14px !important;font-size:14px !important;font-weight:600 !important;color:#fff !important;background:rgba(30,30,30,0.85) !important;backdrop-filter:blur(8px) !important;border:1px solid rgba(255,255,255,0.25) !important;border-radius:8px !important;outline:none !important;cursor:pointer !important;box-shadow:0 4px 12px rgba(0,0,0,0.5) !important;}#customServerSelect option{background:#222 !important;color:#fff !important;padding:6px !important;}#customPopup{position:fixed !important;top:50% !important;left:50% !important;transform:translate(-50%,-50%) !important;z-index:999999999 !important;background:rgba(10,10,10,0.92) !important;backdrop-filter:blur(10px) !important;color:#fff !important;padding:16px 20px !important;border-radius:10px !important;border:1px solid rgba(255,255,255,0.2) !important;box-shadow:0 10px 30px rgba(0,0,0,0.8) !important;display:flex !important;align-items:center !important;gap:15px !important;font-size:14px !important;font-weight:500 !important;max-width:90vw !important;text-align:center !important;}#closePopupBtn{background:transparent !important;border:none !important;color:#fff !important;font-size:22px !important;font-weight:bold !important;cursor:pointer !important;padding:0 5px !important;line-height:1 !important;opacity:0.8 !important;}#closePopupBtn:hover{opacity:1 !important;}';

  // 9. Chèn style, select và popup vào cạnh wrapper
  wrapper.parentNode.insertBefore(styleEl, wrapper);
  wrapper.parentNode.insertBefore(selectEl, wrapper);
  wrapper.parentNode.insertBefore(popup, wrapper);
});



` 
}


function parseCategoriesResponse(html) { return JSON.stringify([
    { "slug": "sinh-vien", "name": "Sinh Viên" },
    { "slug": "may-bay-ba-gia", "name": "Máy Bay" },
    { "slug": "?s=Vi%E1%BB%87t+nam", "name": "Việt Nam" },
    { "slug": "?s=T%E1%BA%ADp+th%E1%BB%83", "name": "Tập Thể" }, // ĐÃ SỬA: Thêm dấu phẩy ở đây
    { "slug": "?s=Hi%E1%BA%BFp+d%C3%A2m", "name": "Hiếp Dâm" }
])}
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
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