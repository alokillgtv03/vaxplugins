// ============================================================================
// 1. MOCK BRIDGES (GIẢ LẬP BRIDGE TRÊN DESKTOP CONSOLE)
// ============================================================================
function runjS(){
return `
(function initMocks() {
  console.group('🔧 [INIT] Cấu hình Mock Bridges');

  // Android Bridge Mock
  if (!window.SnifferBridge) {
    window.SnifferBridge = {
      play: function (videoUrl, headers) {
        console.group('%c🚀 [Android Bridge Called]', 'color: #00ff00; font-weight: bold;');
        console.log('🔗 Video URL:', videoUrl);
        try {
          console.log('📋 Headers (Parsed):', JSON.parse(headers));
        } catch (e) {
          console.warn('⚠️ Không thể parse Headers JSON:', e);
          console.log('📋 Headers (Raw):', headers);
        }
        console.groupEnd();
      }
    };
    console.log('✅ Đã khởi tạo SnifferBridge Mock (Android)');
  } else {
    console.log('ℹ️ SnifferBridge Native đã sẵn sàng');
  }

  // iOS Webkit Mock
  if (!window.webkit) {
    window.webkit = {
      messageHandlers: {
        m3u8Detected: {
          postMessage: function (videoUrl) {
            console.group('%c🚀 [iOS Webkit Bridge Called]', 'color: #00bcff; font-weight: bold;');
            console.log('🔗 Video URL:', videoUrl);
            console.groupEnd();
          }
        }
      }
    };
    console.log('✅ Đã khởi tạo webkit.messageHandlers Mock (iOS)');
  } else {
    console.log('ℹ️ Webkit MessageHandlers Native đã sẵn sàng');
  }

  console.groupEnd();
})();

// ============================================================================
// 2. MAIN SNIFFER SCRIPT
// ============================================================================
(function initVideoSniffer() {
  console.log('🎬 [Sniffer] Script đã được nạp vào trang.');

  // --- Hàm 1: Trích xuất SRC từ Video Element ---
  function getVideoSrc(videoEl) {
    console.groupCollapsed('🔍 [getVideoSrc] Đang kiểm tra thẻ video...', videoEl);

    // Ưu tiên 1: currentSrc (URL thực tế trình duyệt đang nạp)
    if (videoEl.currentSrc && videoEl.currentSrc.trim() !== '') {
      console.log('👉 Tìm thấy từ "currentSrc":', videoEl.currentSrc);
      console.groupEnd();
      return videoEl.currentSrc;
    }

    // Ưu tiên 2: thuộc tính src của thẻ video
    if (videoEl.src && videoEl.src.trim() !== '') {
      console.log('👉 Tìm thấy từ "src":', videoEl.src);
      console.groupEnd();
      return videoEl.src;
    }

    // Ưu tiên 3: Tìm thẻ <source> bên trong
    const sourceEl = videoEl.querySelector('source[src]');
    if (sourceEl && sourceEl.src) {
      console.log('👉 Tìm thấy từ thẻ con "<source src=\\"...\\">":', sourceEl.src);
      console.groupEnd();
      return sourceEl.src;
    }

    console.warn('⚠️ Thẻ video hiện tại chưa có "src" hoặc "currentSrc".');
    console.groupEnd();
    return null;
  }

  // --- Hàm 2: Lắng nghe DOM để tìm Video ---
  function watchForVideo(onFound) {
    console.log('👀 [watchForVideo] Bắt đầu tiến trình theo dõi Video...');

    const checkAndProcess = function (videoEl, sourceLocation) {
      console.log('🎯 [Check] Phát hiện thẻ video từ source: "' + sourceLocation + '"');
      const src = getVideoSrc(videoEl);

      if (src) {
        console.log('🎉 [Success] Trích xuất thành công URL:', src);
        onFound(src, videoEl);
        return true;
      }
      return false;
    };

    // BƯỚC 1: Kiểm tra các thẻ <video> đã tồn tại sẵn trong DOM
    const existingVideos = document.querySelectorAll('video');
    console.log('🔎 [Step 1] Tìm trong DOM sẵn có: Thấy ' + existingVideos.length + ' thẻ <video>');

    for (let i = 0; i < existingVideos.length; i++) {
      if (checkAndProcess(existingVideos[i], 'DOM có sẵn (video #' + (i + 1) + ')')) {
        return; // Đã tìm thấy, dừng lại
      }
    }

    // BƯỚC 2: Nếu chưa có, bật MutationObserver lắng nghe DOM thay đổi
    console.log('📡 [Step 2] Chưa thấy video hợp lệ. Đang kích hoạt MutationObserver...');

    const observer = new MutationObserver(function (mutations) {
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];

        // Trường hợp A: Thêm node mới
        if (mutation.type === 'childList') {
          for (let j = 0; j < mutation.addedNodes.length; j++) {
            const node = mutation.addedNodes[j];
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            const tagName = node.tagName.toLowerCase();

            // Node mới chính là thẻ <video>
            if (tagName === 'video') {
              console.log('⚡ [Mutation] Phát hiện thẻ <video> mới được chèn vào DOM!');
              if (checkAndProcess(node, 'Mutation: Added <video>')) {
                observer.disconnect();
                console.log('🛑 [Observer] Đã ngắt MutationObserver.');
                return;
              }
            }

            // Node mới chứa thẻ <video> bên trong
            const videoInside = node.querySelector && node.querySelector('video');
            if (videoInside) {
              console.log('⚡ [Mutation] Phát hiện thẻ chứa <video> được chèn vào DOM!');
              if (checkAndProcess(videoInside, 'Mutation: Added parent element with <video>')) {
                observer.disconnect();
                console.log('🛑 [Observer] Đã ngắt MutationObserver.');
                return;
              }
            }
          }
        }

        // Trường hợp B: Thẻ <video> có sẵn nhưng vừa được gán attribute 'src' hoặc 'currentsrc'
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.tagName && target.tagName.toLowerCase() === 'video') {
            console.log('⚡ [Mutation] Thẻ <video> vừa cập nhật thuộc tính [' + mutation.attributeName + ']');
            if (checkAndProcess(target, 'Mutation: Attribute ' + mutation.attributeName + ' changed')) {
              observer.disconnect();
              console.log('🛑 [Observer] Đã ngắt MutationObserver.');
              return;
            }
          }
        }
      }
    });

    try {
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'currentsrc']
      });
      console.log('✅ [Observer] Lắng nghe DOM thành công.');
    } catch (err) {
      console.error('❌ [Error] Không thể khởi tạo MutationObserver:', err);
    }
  }

  // --- BƯỚC KHỞI CHẠY CHÍNH ---
  const handlePageLoad = function () {
    console.log('🌐 [Event] Trang web đã nạp xong (window.load). Bắt đầu quét...');

    watchForVideo(function (videoUrl, videoElement) {
      console.group('📌 [RESULT] Đã bắt được Video! Chuẩn bị gửi dữ liệu sang Native App');
      console.log('🔗 Raw Video URL:', videoUrl);
      console.log('🏷️ Video Element:', videoElement);

      // Lấy Referer & User-Agent
      const currentReferer = window.location.href;
      const userAgent = navigator.userAgent;

      const headersObj = {
        "Referer": currentReferer,
        "User-Agent": userAgent
      };
      const headersJson = JSON.stringify(headersObj);

      console.log('⚙️ Extracted Headers:', headersObj);

      // Định dạng lại URL nếu thiếu đuôi
      let finalUrl = videoUrl;
      if (!finalUrl.includes('.m3u8') && !finalUrl.includes('.mp4')) {
        finalUrl += '#.m3u8';
        console.log('🛠️ URL không chứa đuôi mở rộng, đã append "#.m3u8" ->', finalUrl);
      }

      // Gửi sang Native App
      let bridgeDispatched = false;

      // 1. Android Bridge
      if (window.SnifferBridge && typeof window.SnifferBridge.play === 'function') {
        try {
          console.log('📲 Đang gửi dữ liệu tới Android SnifferBridge...');
          window.SnifferBridge.play(finalUrl, headersJson);
          bridgeDispatched = true;
        } catch (err) {
          console.error('❌ Lỗi khi gọi Android SnifferBridge.play():', err);
        }
      }

      // 2. iOS Bridge
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.m3u8Detected) {
        try {
          console.log('📲 Đang gửi dữ liệu tới iOS Webkit MessageHandler...');
          window.webkit.messageHandlers.m3u8Detected.postMessage(finalUrl);
          bridgeDispatched = true;
        } catch (err) {
          console.error('❌ Lỗi khi gọi iOS messageHandlers.m3u8Detected:', err);
        }
      }

      if (!bridgeDispatched) {
        console.error('❌ [Error] Không tìm thấy bất kỳ Native Bridge nào (Cả Android lẫn iOS)!');
      }

      console.groupEnd();
    });
  };

  // Kiểm tra trạng thái document
  if (document.readyState === 'complete') {
    console.log('⚡ Document đã "complete", chạy thẳng handler.');
    handlePageLoad();
  } else {
    console.log('⏳ Document chưa load xong, đang đợi sự kiện "load"...');
    window.addEventListener('load', handlePageLoad);
  }
})();
`
}

eval(runjS())


