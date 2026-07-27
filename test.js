function runjS() {

    // =========================================================================
    // 1. CONFIG JS: Cấu hình & Hàm Log Luồng (Lifecycle Tracer)
    // =========================================================================
    function configJS() {
        return `
    SnifferBridge.toast("🎯 Đang khởi chạy Sniffer Tracer...");
    
    // ⚙️ CẤU HÌNH TOÀN CỤC
    var LOGGER = 1;                 // 1: Bật Log | 0: Tắt Log
    var PLAYER_MODE = 1;            // 1: Native EXO Player | 0: ArtPlayer
    var PROXY_ENABLED = 0;          
    var USE_CUSTOM_DECODER = 0;     
    var ENABLE_FILTER = 0;          

    // 🎯 BỘ LỌC TỪ KHÓA
    var ENABLE_KEYWORD_FILTER = 0;  // 0: Tắt lọc từ khóa domain
    var KEYWORD_MATCH_MODE = "ANY"; 
    var TARGET_KEYWORDS = ["mp4", "m3u8", "get_file"]; 

    // ⏱️ BIẾN TRẠNG THÁI & CHỐNG SPAM
    var processedUrls = {};
    var loggedDropReasons = {};     // Giới hạn log bỏ qua trùng lặp
    var hasDispatchedAny = 0;       
    var activeWorkerIndex = 0;
    var executionRetries = 0;
    var maxExecutionRetries = 8;
    var videoObserver = null;
    var SNIFFER_TIMEOUT_MS = 15000;

    var WORKER_POOL = [
      "https://soft-surf-c11d.alokillgtv.workers.dev",
      "https://soft-water-25b0.alokillgtv02.workers.dev"
    ];
    var CUSTOM_REFERER = window.location.href;

    // 🚀 HÀM IN LOG THEO TẦNG DỄ DEBUG
    function bridgeLog(tag, msg) {
      if (LOGGER !== 1) return;
      try {
        var formatted = '[CustomJS][' + tag + '] ' + String(msg);
        if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
          window.SnifferBridge.log(formatted);
        } else if (typeof console !== 'undefined' && console.log) {
          console.log(formatted);
        }
      } catch (e) {}
    }

    // Kiểm tra link Stream
    function isMediaStreamUrl(url) {
      if (!url || typeof url !== 'string') return false;
      var lower = url.toLowerCase();
      return lower.indexOf('.m3u8') !== -1 || 
             lower.indexOf('.mp4') !== -1 || 
             lower.indexOf('get_file') !== -1 || 
             lower.indexOf('/hls/') !== -1;
    }

    // Kiểm tra từ khóa
    function checkKeywordMatch(url) {
      if (ENABLE_KEYWORD_FILTER !== 1 || !TARGET_KEYWORDS || TARGET_KEYWORDS.length === 0) return 1;
      var lowerUrl = String(url).toLowerCase();

      if (KEYWORD_MATCH_MODE === "ALL") {
        return TARGET_KEYWORDS.every(function(kw) {
          return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1;
        }) ? 1 : 0;
      } else {
        return TARGET_KEYWORDS.some(function(kw) {
          return lowerUrl.indexOf(String(kw).toLowerCase().trim()) !== -1;
        }) ? 1 : 0;
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
      bridgeLog('DECODER', '⏳ [setVideo] Đang thử giải mã từ nguồn: ' + sourceName);

      var videoElem = document.querySelector("video source") || document.querySelector("video");
      var decodedUrl = videoElem ? videoElem.src : "";

      if (decodedUrl && typeof decodedUrl === 'string' && decodedUrl.length > 10) {
        bridgeLog('DECODER', '🎉 [setVideo - THÀNH CÔNG] Link: ' + decodedUrl);
        dispatchToPlayer(decodedUrl, "setVideo");
        return 1;
      }
      return 0;
    } catch (e) {
      bridgeLog('DECODER-ERR', '❌ Lỗi setVideo: ' + e.message);
      return 0;
    }
  }
  `;
    }

    // =========================================================================
    // 3. GET LINK JS: Log lý do Bỏ qua / Chấp nhận cụ thể
    // =========================================================================
    function getLinkJS() {
        return `
    function getLinkJS(rawUrl, sourceName) {
      try {
        if (hasDispatchedAny === 1) return;
        if (!rawUrl || typeof rawUrl !== 'string') return;

        // Bỏ qua Blob / Data URL
        if (rawUrl.indexOf('blob:') === 0 || rawUrl.indexOf('data:') === 0) {
          logDropOnce(rawUrl, 'Bỏ qua link Blob/Data');
          return;
        }

        var absoluteUrl = "";
        try {
          absoluteUrl = new URL(rawUrl.trim(), document.baseURI || window.location.href).href;
        } catch(errUrl) {
          logDropOnce(rawUrl, 'URL không hợp lệ');
          return;
        }

        // Bỏ qua file rác web (.js, .css, .png, .html,...)
        if (/\\.(html|php|css|js|png|jpg|jpeg|gif|svg|webp)(\\?.*)?$/i.test(absoluteUrl)) {
          logDropOnce(absoluteUrl, 'File tài nguyên Web (.js/.css/.png/.html)');
          return;
        }

        // Kiểm tra từ khóa
        if (checkKeywordMatch(absoluteUrl) !== 1) {
          logDropOnce(absoluteUrl, 'Không khớp danh sách TARGET_KEYWORDS');
          return;
        }

        // Kiểm tra đuôi media
        if (!isMediaStreamUrl(absoluteUrl)) {
          logDropOnce(absoluteUrl, 'Không chứa định dạng Stream (.m3u8, .mp4, get_file)');
          return;
        }

        // Kiểm tra trùng
        if (processedUrls[absoluteUrl]) {
          logDropOnce(absoluteUrl, 'Link trùng đã xử lý trước đó');
          return;
        }
        processedUrls[absoluteUrl] = 1;

        // 🎯 BẮT THÀNH CÔNG
        bridgeLog('MATCH-SUCCESS', '🎯 [BẮT ĐƯỢC LINK MEDIA] Nguồn: [' + sourceName + ']\\n -> Link: ' + absoluteUrl);

        dispatchToPlayer(absoluteUrl, "DirectSniffer (" + sourceName + ")");

      } catch (e) {
        bridgeLog('SNIFFER-ERR', '❌ Lỗi getLinkJS: ' + e.message);
      }
    }

    // Log lý do bị Reject (In 1 lần/URL để không làm ngợp màn hình)
    function logDropOnce(url, reason) {
      var key = url + '|' + reason;
      if (!loggedDropReasons[key]) {
        loggedDropReasons[key] = true;
        bridgeLog('FILTER-DROP', '⛔ [BỎ QUA] ' + reason + ' -> ' + url.substring(0, 80) + '...');
      }
    }
    `;
    }

    // =========================================================================
    // 4. ART PLAYER
    // =========================================================================
    function artPlayer() {
        return `
function renderArtPlayer(playUrl, rawStreamUrl) {
  try {
    bridgeLog('ARTPLAYER', '🎨 Đang nhúng ArtPlayer vào giao diện...');
    document.documentElement.style.cssText = 'background: #000 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important;';
    document.body.innerHTML = '';

    var container = document.createElement('div');
    container.id = 'artplayer-container';
    container.style.cssText = 'width: 100vw; height: 100vh; position: fixed; top: 0; left: 0; z-index: 999999; background: #000;';
    document.body.appendChild(container);

    var isM3U8 = (playUrl || '').indexOf('.m3u8') !== -1;

    window.art = new Artplayer({
      container: '#artplayer-container',
      url: playUrl,
      type: isM3U8 ? 'm3u8' : 'mp4',
      autoplay: true,
      fullscreen: true,
      theme: '#38bdf8'
    });
  } catch (e) {
    bridgeLog('ARTPLAYER-ERR', '❌ Lỗi Render ArtPlayer: ' + e.message);
  }
}
    `;
    }

    // =========================================================================
    // 5. MAIN JS: Quản lý Luồng Thực Thi & Log Điểm Dừng
    // =========================================================================
    function mainJS() {
        return `
    function dispatchToPlayer(mediaUrl, dispatchSource) {
      try {
        hasDispatchedAny = 1;
        
        // DỪNG CÁC CƠ CHẾ QUÉT KHÁC
        if (videoObserver) {
          videoObserver.disconnect();
          bridgeLog('HALT', '🛑 Đã ngắt kết nối MutationObserver.');
        }

        bridgeLog('DISPATCH', '🚀 [CHUYỂN HƯỚNG SANG PLAYER] Nguồn: [' + dispatchSource + ']\\n -> Link: ' + mediaUrl);

        if (PLAYER_MODE === 1) {
          if (window.SnifferBridge && typeof window.SnifferBridge.onMediaFound === 'function') {
            window.SnifferBridge.onMediaFound(mediaUrl, CUSTOM_REFERER);
          } else if (window.SnifferBridge && typeof window.SnifferBridge.playVideo === 'function') {
            window.SnifferBridge.playVideo(mediaUrl, CUSTOM_REFERER);
          } else {
            window.location.href = "intent://" + mediaUrl.replace(/^https?:\\/\\//, '') + "#Intent;scheme=https;type=video/*;end";
          }
        } else {
          renderArtPlayer(mediaUrl, mediaUrl);
        }
      } catch (e) {
        bridgeLog('DISPATCH-ERR', '❌ Lỗi Dispatch: ' + e.message);
      }
    }

    function beginJS() {
      try {
        bridgeLog('INIT', '🎬 === BẮT ĐẦU KHỞI TẠO CÁC CƠ CHẾ CẮT CẦU (INTERCEPTORS) ===');

        // 1. Gài XHR
        if (typeof XMLHttpRequest !== 'undefined') {
          var originalOpen = XMLHttpRequest.prototype.open;
          var originalSend = XMLHttpRequest.prototype.send;

          XMLHttpRequest.prototype.open = function (method, url) {
            try { 
              if (url) {
                bridgeLog('HOOK-XHR', '⚡ Catch Request: [' + method + '] ' + url);
                getLinkJS(url, 'XHR.' + method); 
              }
            } catch (e) {}
            return originalOpen.apply(this, arguments);
          };

          XMLHttpRequest.prototype.send = function () {
            this.addEventListener('load', function () {
              try {
                if (this.responseText) {
                  var match = this.responseText.match(/(?:https?:\\/\\/[^\\s"'<>]+|\\/[^\\s"'<>]+)(?:\\.(?:m3u8|mp4)|get_file)[^\\s"'>]*/i);
                  if (match && match[0]) {
                    bridgeLog('HOOK-XHR-BODY', '⚡ Tìm thấy chuỗi Media trong Response Text XHR!');
                    getLinkJS(match[0], 'XHR-ResponseBody');
                  }
                }
              } catch (e) {}
            });
            return originalSend.apply(this, arguments);
          };
          bridgeLog('INIT', '✅ Gài thành công: XHR Interceptor');
        }

        // 2. Gài Fetch
        if (typeof window.fetch === 'function') {
          var originalFetch = window.fetch;
          window.fetch = function (input, init) {
            var url = (typeof input === 'string') ? input : (input && input.url ? input.url : '');
            if (url) {
              bridgeLog('HOOK-FETCH', '⚡ Catch Fetch: ' + url);
              getLinkJS(url, 'Fetch');
            }

            return originalFetch.apply(this, arguments).then(function (response) {
              try {
                var cloned = response.clone();
                cloned.text().then(function (bodyText) {
                  var match = bodyText.match(/(?:https?:\\/\\/[^\\s"'<>]+|\\/[^\\s"'<>]+)(?:\\.(?:m3u8|mp4)|get_file)[^\\s"'>]*/i);
                  if (match && match[0]) {
                    bridgeLog('HOOK-FETCH-BODY', '⚡ Tìm thấy chuỗi Media trong Response Fetch Body!');
                    getLinkJS(match[0], 'Fetch-ResponseBody');
                  }
                });
              } catch (e) {}
              return response;
            });
          };
          bridgeLog('INIT', '✅ Gài thành công: Fetch Interceptor');
        }

        // 3. Gài DOM MutationObserver
        if (typeof MutationObserver !== 'undefined') {
          videoObserver = new MutationObserver(function(mutations) {
            if (hasDispatchedAny === 1) return;
            scanVideoElements('MutationObserver');
          });
          var targetNode = document.body || document.documentElement;
          if (targetNode) {
            videoObserver.observe(targetNode, { childList: true, subtree: true });
            bridgeLog('INIT', '✅ Gài thành công: DOM MutationObserver (Lắng nghe thay đổi DOM)');
          }
        }

        // 4. Chạy vòng lặp chính
        handleMainExecution();

        // 5. Hẹn giờ Timeout kết thúc
        setTimeout(function() {
          if (hasDispatchedAny !== 1) {
            bridgeLog('HALT-TIMEOUT', '⏹️ [KẾT THÚC] Hết thời gian chờ (' + (SNIFFER_TIMEOUT_MS/1000) + 's) nhưng không bắt được link hợp lệ.');
            if (window.SnifferBridge && typeof window.SnifferBridge.toast === 'function') {
              window.SnifferBridge.toast("⚠️ Timeout: Không tìm thấy link video!");
            }
          }
        }, SNIFFER_TIMEOUT_MS);

      } catch (e) {
        bridgeLog('INIT-ERR', '❌ Lỗi khởi tạo beginJS: ' + e.message);
      }
    }

    function scanVideoElements(triggerSource) {
      if (hasDispatchedAny === 1) return;
      try {
        var videos = document.getElementsByTagName('video');
        if (videos.length > 0) {
          bridgeLog('SCAN-DOM', '👀 [' + triggerSource + '] Phát hiện ' + videos.length + ' thẻ <video> trong DOM.');
          for (var i = 0; i < videos.length; i++) {
            if (hasDispatchedAny === 1) break;
            var v = videos[i];

            // Thử kích hoạt Play
            try { if (v.paused) v.play().catch(function(){}); } catch(e){}

            if (v.currentSrc) getLinkJS(v.currentSrc, triggerSource + ' -> <video currentSrc>');
            if (v.src) getLinkJS(v.src, triggerSource + ' -> <video src>');
          }
        }
      } catch (e) {
        bridgeLog('SCAN-ERR', '❌ Lỗi scanVideoElements: ' + e.message);
      }
    }

    function handleMainExecution() {
      if (hasDispatchedAny === 1) {
        bridgeLog('HALT', '🛑 Tiến trình quét chính dừng lại do đã tìm thấy Link.');
        return;
      }

      try {
        executionRetries++;
        bridgeLog('SCAN-LOOP', '🔄 [BẮT ĐẦU VÒNG QUÉT ' + executionRetries + '/' + maxExecutionRetries + ']');

        // Quét thẻ video
        scanVideoElements('MainLoop');
        if (hasDispatchedAny === 1) return;

        // Quét HTML Thô
        var fullHtml = document.documentElement ? document.documentElement.outerHTML : '';
        bridgeLog('SCAN-HTML', '📄 Đang quét mã nguồn HTML thô (Độ dài: ' + fullHtml.length + ' ký tự)...');

        var rawMatches = fullHtml.match(/(?:https?:[^\\s"'<>]+|\\/[^\\s"'<>]+)(?:\\.(?:m3u8|mp4)|get_file)/gi);
        
        if (rawMatches && rawMatches.length > 0) {
          bridgeLog('SCAN-HTML', '🔍 Tìm thấy ' + rawMatches.length + ' chuỗi nghi vấn trong HTML.');
          for (var j = 0; j < rawMatches.length; j++) {
            getLinkJS(rawMatches[j].replace(/["']/g, ''), 'RawHTML-RegEx');
            if (hasDispatchedAny === 1) return;
          }
        } else {
          bridgeLog('SCAN-HTML', '⚪ Không phát hiện chuỗi .m3u8/.mp4 nào trong HTML thô.');
        }

        // Lặp lại hoặc dừng
        if (hasDispatchedAny !== 1) {
          if (executionRetries < maxExecutionRetries) {
            bridgeLog('SCAN-LOOP', '⏳ Chờ 1.2s trước khi quét lần tiếp theo...');
            setTimeout(handleMainExecution, 1200);
          } else {
            bridgeLog('HALT-MAX', '🛑 [DỪNG TIẾN TRÌNH QUÉT] Đã thử đủ ' + maxExecutionRetries + ' lần nhưng chưa bắt được luồng media.');
          }
        }

      } catch (e) {
        bridgeLog('LOOP-ERR', '❌ Lỗi handleMainExecution: ' + e.message);
      }
    }
    `;
    }

    // =========================================================================
    // 6. KẾT NỐI
    // =========================================================================
    return `
(function initEnhancedVideoSniffer() {
  if (window.__SNIFFER_INITIALIZED__) {
    if (typeof bridgeLog === 'function') bridgeLog('INIT-WARN', '⚠️ Script đã được nạp trước đó, bỏ qua khởi tạo lại.');
    return;
  }
  window.__SNIFFER_INITIALIZED__ = true;

  try {
    ${configJS()}
    ${setVideoJS()}
    ${getLinkJS()}
    ${mainJS()}

    beginJS();

  } catch (globalErr) {
    if (typeof bridgeLog === 'function') {
      bridgeLog('GLOBAL-ERR', '❌ Lỗi Toàn Cục (Global Crash): ' + globalErr.message);
    }
  }
})();
  `;
}
