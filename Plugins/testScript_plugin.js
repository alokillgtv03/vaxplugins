(function initEnhancedVideoSniffer() {
  try {
    // ==========================================
    // 1. HELPER: LOGGING & TOAST BRIDGE
    // ==========================================
    function bridgeLog(msg) {
      try {
        if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
          window.SnifferBridge.log(String(msg));
        } else {
          console.log('[LOG]', msg);
        }
      } catch (e) {
        console.error('[LOG ERROR]', e);
      }
    }

    function bridgeToast(msg) {
      try {
        if (window.SnifferBridge && typeof window.SnifferBridge.toast === 'function') {
          window.SnifferBridge.toast(String(msg));
        } else {
          console.log('[TOAST]', msg);
        }
      } catch (e) {
        console.error('[TOAST ERROR]', e);
      }
    }

    // Hàm Debounce gom các sự kiện DOM dồn dập
    function debounce(fn, delay) {
      let timer = null;
      return function () {
        const context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          fn.apply(context, args);
        }, delay);
      };
    }

    bridgeLog('🎬 [Sniffer v2.3] Script khởi tạo (Đã bật bộ lọc chặn Blob URL).');

    // Tập hợp lưu trữ URL đã gửi để tránh gửi lặp lại
    const processedUrls = new Set();

    // ==========================================
    // 2. HÀM TRUYỀN DỮ LIỆU SANG NATIVE BRIDGE (CÓ BỘ LỌC BLOB)
    // ==========================================
    function dispatchToNative(videoUrl) {
      try {
        if (!videoUrl || typeof videoUrl !== 'string') return;

        // --- BỘ LỌC 1: CHẶN BLOB URL ---
        if (videoUrl.indexOf('blob:') === 0 || videoUrl.startsWith('blob:')) {
          bridgeLog('🚫 [Filter Blob] Đã chặn link Blob (ExoPlayer không hỗ trợ): ' + videoUrl);
          return;
        }

        // --- BỘ LỌC 2: BỎ QUA CÁC PHÂN ĐOẠN .TS LẺ ---
        if (videoUrl.indexOf('.ts') !== -1 && videoUrl.indexOf('.m3u8') === -1) {
          bridgeLog('⏳ [Filter TS] Bỏ qua file phân đoạn .ts lẻ: ' + videoUrl);
          return;
        }

        // --- BỘ LỌC 3: KIỂM TRA TRÙNG LẶP ---
        if (processedUrls.has(videoUrl)) return;
        processedUrls.add(videoUrl);

        bridgeToast('🎉 Đã bắt được link media hợp lệ!');
        bridgeLog('📌 [RESULT] Stream URL gửi sang Native: ' + videoUrl);

        const headersObj = {
          "Referer": window.location.href,
          "User-Agent": navigator.userAgent
        };
        const headersJson = JSON.stringify(headersObj);

        let dispatched = false;

        // Android Native Bridge
        if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
          try {
            bridgeLog('📲 Đang gửi dữ liệu tới Android SnifferBridge.play()...');
            window.SnifferBridge.play(videoUrl, headersJson);
            dispatched = true;
          } catch (e) {
            bridgeLog('❌ Lỗi Android Bridge: ' + e.message);
          }
        }

        // iOS Native Bridge
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.m3u8Detected) {
          try {
            bridgeLog('📲 Đang gửi dữ liệu tới iOS Webkit MessageHandler...');
            window.webkit.messageHandlers.m3u8Detected.postMessage(videoUrl);
            dispatched = true;
          } catch (e) {
            bridgeLog('❌ Lỗi iOS Bridge: ' + e.message);
          }
        }

        if (!dispatched) {
          bridgeLog('⚠️ Không tìm thấy Native Bridge tương thích.');
        }
      } catch (errDispatch) {
        bridgeLog('💥 [Fatal Error in dispatchToNative]: ' + errDispatch.message);
      }
    }

    // ==========================================
    // 3. NETWORK INTERCEPTOR (GHI ĐÈ XHR & FETCH)
    // ==========================================
    (function initNetworkInterceptor() {
      try {
        bridgeLog('📡 [Interceptor] Đang kích hoạt lắng nghe XHR & Fetch...');

        const isMediaUrl = function (url) {
          if (!url || typeof url !== 'string') return false;
          
          // Bỏ qua Blob URL ngay từ khâu nhận dạng request
          if (url.indexOf('blob:') === 0) return false;

          return (
            url.indexOf('.m3u8') !== -1 ||
            url.indexOf('.mp4') !== -1 ||
            url.indexOf('manifest') !== -1 ||
            url.indexOf('playlist') !== -1
          );
        };

        // 3a. Ghi đè XMLHttpRequest
        try {
          const originalOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function (method, url) {
            try {
              if (isMediaUrl(url)) {
                const absoluteUrl = new URL(url, document.baseURI || window.location.href).href;
                bridgeLog('⚡ [XHR Detected]: ' + absoluteUrl);
                dispatchToNative(absoluteUrl);
              }
            } catch (e) {
              bridgeLog('⚠️ Lỗi xử lý URL trong XHR: ' + e.message);
            }
            return originalOpen.apply(this, arguments);
          };
          bridgeLog('✅ [Interceptor] Patch XMLHttpRequest thành công.');
        } catch (errXHR) {
          bridgeLog('❌ Lỗi Patch XHR: ' + errXHR.message);
        }

        // 3b. Ghi đè Fetch API
        try {
          if (window.fetch) {
            const originalFetch = window.fetch;
            window.fetch = function (input, init) {
              try {
                let url = '';
                if (typeof input === 'string') {
                  url = input;
                } else if (input && input.url) {
                  url = input.url;
                }

                if (isMediaUrl(url)) {
                  const absoluteUrl = new URL(url, document.baseURI || window.location.href).href;
                  bridgeLog('⚡ [Fetch Detected]: ' + absoluteUrl);
                  dispatchToNative(absoluteUrl);
                }
              } catch (e) {
                bridgeLog('⚠️ Lỗi xử lý URL trong Fetch: ' + e.message);
              }

              return originalFetch.apply(this, arguments);
            };
            bridgeLog('✅ [Interceptor] Patch Fetch API thành công.');
          }
        } catch (errFetch) {
          bridgeLog('❌ Lỗi Patch Fetch: ' + errFetch.message);
        }
      } catch (errInterceptor) {
        bridgeLog('💥 [Fatal Error in initNetworkInterceptor]: ' + errInterceptor.message);
      }
    })();

    // ==========================================
    // 4. TỐI ƯU HÓA LỌC HTML LOG (CLEAN SNAPSHOT)
    // ==========================================
    function getCleanHTML() {
      try {
        if (!document.documentElement) return 'DOM chưa sẵn sàng';
        const cloneNode = document.documentElement.cloneNode(true);

        const junkSelectors = ['script', 'style', 'svg', 'path', 'noscript', 'link[rel="stylesheet"]'];

        junkSelectors.forEach(function (selector) {
          try {
            const elements = cloneNode.querySelectorAll(selector);
            for (let i = 0; i < elements.length; i++) {
              const el = elements[i];
              if (el && el.parentNode) {
                el.parentNode.removeChild(el);
              }
            }
          } catch (e) {}
        });

        const allElements = cloneNode.querySelectorAll('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          if (el.hasAttribute && el.hasAttribute('style')) el.removeAttribute('style');
          if (el.src && el.src.indexOf('data:') === 0) el.removeAttribute('src');
        }

        return cloneNode.outerHTML
          .replace(/^\\s*[\\r\\n]/gm, '')
          .substring(0, 10000);
      } catch (e) {
        return '⚠️ Không thể rút gọn HTML: ' + e.message;
      }
    }

    bridgeLog('📄 [Clean DOM Snapshot]:\\n' + getCleanHTML());

    // ==========================================
    // 5. API AUTO-CLICKER (CÓ RETRY VÀ TRY-CATCH)
    // ==========================================
    function autoClick(config) {
      try {
        const cfg = Object.assign({
          selector: '',
          contains: null,
          eq: 0,
          maxClicks: 1,
          interval: 1000,
          delay: 500,
          maxRetries: 10,
          retryInterval: 500
        }, config);

        if (!cfg.selector) return;

        bridgeLog('🖱️ [AutoClick] Lên lịch cho selector: "' + cfg.selector + '"');

        setTimeout(function () {
          let currentClicks = 0;
          let retryCount = 0;

          const attemptClick = function () {
            try {
              let nodes = Array.from(document.querySelectorAll(cfg.selector));

              if (cfg.contains) {
                nodes = nodes.filter(function (el) {
                  return el.textContent && el.textContent.toLowerCase().indexOf(cfg.contains.toLowerCase()) !== -1;
                });
              }

              if (nodes.length === 0) {
                retryCount++;
                if (retryCount <= cfg.maxRetries) {
                  setTimeout(attemptClick, cfg.retryInterval);
                } else {
                  bridgeLog('⚠️ [AutoClick] Hết lượt thử lại, không tìm thấy nút: ' + cfg.selector);
                }
                return;
              }

              let targetEl = null;
              if (cfg.eq === 'first' || cfg.eq === 0) targetEl = nodes[0];
              else if (cfg.eq === 'last') targetEl = nodes[nodes.length - 1];
              else if (typeof cfg.eq === 'number' && nodes[cfg.eq]) targetEl = nodes[cfg.eq];
              else targetEl = nodes[0];

              if (targetEl) {
                targetEl.click();
                currentClicks++;
                bridgeLog('✅ [AutoClick] Đã click (' + currentClicks + '/' + cfg.maxClicks + ') vào <' + targetEl.tagName.toLowerCase() + '>');

                if (currentClicks < cfg.maxClicks) {
                  setTimeout(attemptClick, cfg.interval);
                }
              }
            } catch (err) {
              bridgeLog('❌ [AutoClick Error]: ' + err.message);
            }
          };

          attemptClick();
        }, cfg.delay);
      } catch (errAutoClick) {
        bridgeLog('💥 [Fatal Error in autoClick]: ' + errAutoClick.message);
      }
    }

    // ==========================================
    // 6. BỘ QUÉT URL TRONG DOM & SCRIPT TAGS
    // ==========================================
    function extractMediaUrls() {
      const foundUrls = new Set();
      const mediaRegex = /https?:\\/\\/[^\\s"'<>]+\\.(?:m3u8|mp4)(?:[?#][^\\s"'<>]*)?/gi;

      try {
        // 1. Thẻ video / source
        const videos = document.querySelectorAll('video');
        videos.forEach(function (v) {
          if (v.currentSrc && v.currentSrc.indexOf('blob:') !== 0) foundUrls.add(v.currentSrc);
          if (v.src && v.src.indexOf('blob:') !== 0) foundUrls.add(v.src);
          
          const sources = v.querySelectorAll('source');
          sources.forEach(function (s) { 
            if (s.src && s.src.indexOf('blob:') !== 0) foundUrls.add(s.src); 
          });
        });

        // 2. Thuộc tính chứa link
        const elementsWithAttr = document.querySelectorAll('[src], [data-src], [data-url], [href]');
        elementsWithAttr.forEach(function (el) {
          ['src', 'data-src', 'data-url', 'href'].forEach(function (attr) {
            const val = el.getAttribute(attr);
            if (val && val.indexOf('blob:') !== 0 && (val.indexOf('.m3u8') !== -1 || val.indexOf('.mp4') !== -1)) {
              try {
                const absoluteUrl = new URL(val, document.baseURI || window.location.href).href;
                foundUrls.add(absoluteUrl);
              } catch (e) {
                foundUrls.add(val);
              }
            }
          });
        });

        // 3. Quét các thẻ <script>
        const scripts = document.querySelectorAll('script');
        scripts.forEach(function (s) {
          if (s.textContent) {
            let match;
            while ((match = mediaRegex.exec(s.textContent)) !== null) {
              if (match[0].indexOf('blob:') !== 0) {
                foundUrls.add(match[0]);
              }
            }
          }
        });
      } catch (e) {
        bridgeLog('⚠️ Lỗi trích xuất URL từ DOM: ' + e.message);
      }

      return Array.from(foundUrls);
    }

    // ==========================================
    // 7. MÁY QUÉT DOM DỰ PHÒNG & THEO DÕI MUTATION
    // ==========================================
    function startDOMSniffing() {
      try {
        bridgeLog('👀 [DOM Sniffer] Bắt đầu quét media trong DOM...');

        const checkAllSources = function () {
          try {
            const urls = extractMediaUrls();
            if (urls.length > 0) {
              urls.forEach(function (url) { dispatchToNative(url); });
            }
          } catch (errCheck) {
            bridgeLog('⚠️ Lỗi trong checkAllSources: ' + errCheck.message);
          }
        };

        // Quét ngay lần đầu
        checkAllSources();

        // Debounce 400ms tránh quá tải CPU khi DOM thay đổi liên tục
        const debouncedCheck = debounce(checkAllSources, 400);

        const observer = new MutationObserver(function () {
          debouncedCheck();
        });

        try {
          observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'data-src', 'data-url']
          });
          bridgeLog('✅ [MutationObserver] Khởi tạo lắng nghe thành công.');
        } catch (err) {
          bridgeLog('❌ Lỗi MutationObserver: ' + err.message);
        }
      } catch (errSniff) {
        bridgeLog('💥 [Fatal Error in startDOMSniffing]: ' + errSniff.message);
      }
    }

    // ==========================================
    // 8. ĐIỂM KHỞI CHẠY (ENTRY POINT)
    // ==========================================
    const handleMainExecution = function () {
      try {
        bridgeLog('🚀 [Main Execution] Trang web đã sẵn sàng, tiến hành các thao tác...');

        // Cấu hình Auto Click
        autoClick({
          selector: 'div[aria-label="Phát"], #btnResume, button[id*="Resume"], button[id*="resume"]',
          eq: 'first',
          maxClicks: 1,
          delay: 500,
          maxRetries: 10
        });

        // Bắt đầu quét DOM bổ sung
        startDOMSniffing();
      } catch (errExec) {
        bridgeLog('💥 [Fatal Error in handleMainExecution]: ' + errExec.message);
      }
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      bridgeLog('⚡ Document đã ở trạng thái "' + document.readyState + '", chạy ngay.');
      handleMainExecution();
    } else {
      bridgeLog('⏳ Document chưa sẵn sàng, đang chờ sự kiện "load"...');
      window.addEventListener('load', handleMainExecution);
    }

  } catch (globalErr) {
    const msg = '💥 [Fatal Error]: ' + (globalErr && globalErr.message ? globalErr.message : String(globalErr));
    if (window.SnifferBridge && typeof window.SnifferBridge.log === 'function') {
      window.SnifferBridge.log(msg);
    } else {
      console.error(msg);
    }
  }
})();