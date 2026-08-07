// ==UserScript==
// @name         Web Network Sniffer Pro Master
// @namespace    http://tampermonkey.net/
// @version      6.7
// @description  Full Page Source Viewer, Response Search Lock, Multi-tab Scratchpad, Mini Console, Storage Viewer (Local/Session/Cookies/Cache).
// @author       You
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // BỌC TRY-CATCH TOÀN BỘ SCRIPT
    try {
        // 1. TIỆN ÍCH LƯU TRỮ VÀ LOGGING (TRY-CATCH AN TOÀN)
        const store = {
            get: (k, def) => {
                try { return localStorage.getItem(k) !== null ? localStorage.getItem(k) : def; } catch (e) { return def; }
            },
            set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
            remove: (k) => { try { localStorage.removeItem(k); } catch (e) {} }
        };

        const logs = [];
        const Logger = {
            error: (context, err) => {
                console.group(`[Sniffer Error] ${context}`);
                console.error(err);
                console.groupEnd();
                logs.unshift({ type: 'error', time: new Date().toLocaleTimeString(), msg: `${context}: ${err.message || err}` });
                if (activeRightTab === 'scratchpad' && activeNoteIndex === -1) renderConsole();
            },
            info: (msg) => {
                logs.unshift({ type: 'info', time: new Date().toLocaleTimeString(), msg });
                if (activeRightTab === 'scratchpad' && activeNoteIndex === -1) renderConsole();
            }
        };

        // 2. TẠO SHADOW DOM ĐỂ CÁCH LY TUYỆT ĐỐI VỚI WEBSITE
        const hostContainer = document.createElement('div');
        hostContainer.id = 'sniffer-master-root-host';
        hostContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
        (document.documentElement || document.body).appendChild(hostContainer);
        const shadow = hostContainer.attachShadow({ mode: 'open' });

        // DỮ LIỆU & TRẠNG THÁI TOÀN CỤC
        const networkData = [];
        const uniqueRequests = new Set();
        let isPanelOpen = store.get('sniff_auto_open') === 'true';
        let isFullScreen = store.get('sniff_fullscreen') === 'true';
        let isHoveringPanel = false;
        let isSnifferPaused = false;
        let isWordWrapEnabled = false;
        let activeDetailTab = 'd-response';
        let currentSelectedReq = null;
        let currentFilter = { type: 'All', text: '' };
        let jsonViewMode = 'tree';
        let listWidthRaw = store.get('sniff_list_width', '30%');
        let rightWidthRaw = store.get('sniff_right_width', '25%');
        let persistentSearchKeyword = '';
        let responseMatches = [];
        let visitedMatches = new Set();
        let activeMatchIndex = -1;
        let activeRightTab = 'search';
        let isRightPanelVisible = true;
        let scratchpads = [];
        try { scratchpads = JSON.parse(store.get('sniff_scratchpads', '[""]')); } catch (e) { scratchpads = [""]; }
        let activeNoteIndex = -1;

        const hlsScript = document.createElement('script');
        hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        document.head.appendChild(hlsScript);

        function cleanRawSourceCode(rawCode) {
            if (typeof rawCode !== 'string') return rawCode;
            return rawCode.replace(/<!---->/g, '').trim();
        }

        function escapeHtml(text) {
            if (typeof text !== 'string') return text;
            return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function getFullUrl(url) {
            if (url.startsWith('http')) return url;
            if (url.startsWith('//')) return location.protocol + url;
            if (url.startsWith('/')) return location.origin + url;
            return location.origin + '/' + url;
        }

        function silentCopy(text) {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            } catch (e) { Logger.error('Lỗi khi Copy', e); }
        }

        function copyToClipboard(text) {
            silentCopy(text);
            showToast('Đã copy vào clipboard!', 'success');
        }

        function showToast(msg, type = 'info', duration = 3000) {
            try {
                let container = shadow.getElementById('sniff-toast-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'sniff-toast-container';
                    shadow.appendChild(container);
                }
                const toast = document.createElement('div');
                toast.className = `sniff-toast toast-${type}`;
                toast.innerText = msg;
                container.appendChild(toast);
                setTimeout(() => toast.classList.add('show'), 10);
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, duration);
            } catch (e) { console.error('Lỗi showToast', e); }
        }

        // 3. INTERCEPT FETCH & XHR
        const origFetch = window.fetch;
        window.fetch = async function (...args) {
            let reqObj = null;
            try {
                let url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
                let method = args[1]?.method || 'GET';
                let reqHeaders = args[1]?.headers || {};
                let body = args[1]?.body || '';
                reqObj = {
                    id: generateId(), url, method, reqHeaders, body,
                    resHeaders: {}, response: null, type: 'Fetch', status: 'Pending',
                    time: new Date().toLocaleTimeString(), timestamp: Date.now()
                };
                addRequest(reqObj);
            } catch (e) { Logger.error('Lỗi khởi tạo Intercept Fetch', e); }

            try {
                const response = await origFetch.apply(this, args);
                if (reqObj) {
                    const clone = response.clone();
                    reqObj.status = response.status;
                    response.headers.forEach((val, key) => { reqObj.resHeaders[key] = val; });
                    clone.text().then(text => {
                        reqObj.response = cleanRawSourceCode(text);
                        if (!isSnifferPaused) updateRequestUI();
                        if (currentSelectedReq?.id === reqObj.id && activeDetailTab === 'd-response') loadTabContent(reqObj);
                    }).catch(e => { Logger.error('Lỗi khi đọc clone text fetch', e); });
                }
                return response;
            } catch (e) {
                if (reqObj) { reqObj.status = 'Error'; if (!isSnifferPaused) updateRequestUI(); }
                Logger.error('Lỗi Fetch Request: ' + (reqObj ? reqObj.url : 'Unknown URL'), e);
                throw e;
            }
        };

        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;
        const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;

        XMLHttpRequest.prototype.open = function (method, url) {
            try { this._reqId = generateId(); this._method = method; this._url = url; this._reqHeaders = {}; }
            catch (e) { Logger.error('Lỗi XHR Open', e); }
            return origOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
            try { this._reqHeaders[header] = value; } catch (e) {}
            return origSetHeader.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function (body) {
            let reqObj = null;
            try {
                reqObj = {
                    id: this._reqId, url: this._url, method: this._method,
                    reqHeaders: this._reqHeaders, body: body,
                    resHeaders: {}, response: null, type: 'XHR', status: 'Pending',
                    time: new Date().toLocaleTimeString(), timestamp: Date.now()
                };
                addRequest(reqObj);
                this.addEventListener('load', function () {
                    try {
                        reqObj.status = this.status;
                        let resData = (this.responseType === '' || this.responseType === 'text') ? this.responseText : this.response;
                        reqObj.response = typeof resData === 'string' ? cleanRawSourceCode(resData) : resData;
                        const headersArr = this.getAllResponseHeaders().trim().split(/[\r\n]+/);
                        headersArr.forEach(line => {
                            const parts = line.split(': ');
                            const header = parts.shift();
                            if (header) reqObj.resHeaders[header] = parts.join(': ');
                        });
                        if (!isSnifferPaused) updateRequestUI();
                        if (currentSelectedReq?.id === reqObj.id && activeDetailTab === 'd-response') loadTabContent(reqObj);
                    } catch (e) { Logger.error('Lỗi XHR Load event', e); }
                });
                this.addEventListener('error', function () {
                    reqObj.status = 'Error';
                    if (!isSnifferPaused) updateRequestUI();
                });
            } catch (e) { Logger.error('Lỗi XHR Send', e); }
            return origSend.apply(this, arguments);
        };

        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.initiatorType !== 'xmlhttprequest' && entry.initiatorType !== 'fetch') {
                        let type = 'Resource';
                        if (entry.name.match(/\.(mp4|m3u8|ts|webm)$/i)) type = 'Media';
                        if (entry.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) type = 'Image';
                        if (entry.name.match(/\.(js|css)$/i)) type = 'Resource';
                        addRequest({
                            id: generateId(), url: entry.name, method: 'GET',
                            reqHeaders: {}, body: '', resHeaders: {}, response: null,
                            type: type, status: 'N/A',
                            time: new Date().toLocaleTimeString(), timestamp: Date.now()
                        });
                    }
                });
            });
            observer.observe({ entryTypes: ['resource'] });
        } catch(e) { Logger.error('Lỗi PerformanceObserver', e); }

        function generateId() { return Math.random().toString(36).substr(2, 9); }

        function addRequest(req) {
            const uniqueKey = req.method + req.url;
            if (uniqueRequests.has(uniqueKey)) return;
            uniqueRequests.add(uniqueKey);
            networkData.push(req);
            if (!isSnifferPaused) updateRequestUI();
        }

        function generateCurl(req) {
            let curl = `curl '${getFullUrl(req.url)}' \\\n -X ${req.method} \\\n`;
            for (let key in req.reqHeaders) curl += ` -H '${key}: ${req.reqHeaders[key]}' \\\n`;
            if (req.body && typeof req.body === 'string') curl += ` --data-raw '${req.body.replace(/'/g, "\\'")}' \\\n`;
            return curl.trim().replace(/\\$/, '');
        }

        // 4. PHÍM TẮT & GIAO DIỆN CHÍNH
       window.addEventListener('keydown', (e) => {
    // Đổi sang Ctrl + Shift + Y (hoặc Cmd + Shift + Y)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'u')) {
        e.preventDefault();
        togglePanelVisibility(!isPanelOpen);
        return;
    }

    if (!isPanelOpen) return;

    const activeEl = shadow.activeElement || document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

    if (isHoveringPanel) {
        // Cập nhật ngoại lệ cho Ctrl + Shift + T
        if (!((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 't' || e.key === 'T')) && e.key !== 'Escape')
            e.stopPropagation();
    }

    if (e.key === 'Escape') {
        togglePanelVisibility(false);
        return;
    }

    // Đổi sang Ctrl + Shift + T (hoặc Cmd + Shift + T)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'i')) {
        e.preventDefault();
        toggleMaximize();
        return;
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const visibleReqs = getFilteredRequests();
        if (visibleReqs.length === 0) return;
        e.preventDefault();
        let currentIndex = visibleReqs.findIndex(r => r.id === currentSelectedReq?.id);
        if (currentIndex === -1) currentIndex = 0;
        if (e.key === 'ArrowUp') currentIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        else if (e.key === 'ArrowDown') currentIndex = currentIndex < visibleReqs.length - 1 ? currentIndex + 1 : visibleReqs.length - 1;
        currentSelectedReq = visibleReqs[currentIndex];
        silentCopy(currentSelectedReq.url);
        updateRequestUI();
        if (persistentSearchKeyword) {
            visitedMatches.clear();
            activeMatchIndex = 0;
            Logger.info(`[Nav] Chuyển request (keyboard), reset search index cho keyword: "${persistentSearchKeyword}"`);
        }
        renderDetail(currentSelectedReq);
        if (persistentSearchKeyword) {
            Logger.info(`[AutoSearch] Chuyển request mới (keyboard), tự động search keyword: "${persistentSearchKeyword}"`);
            setTimeout(() => {
                const searchInput = shadow.getElementById('resp-search-input');
                if (searchInput) {
                    searchInput.value = persistentSearchKeyword;
                    const btn = shadow.getElementById('btn-search-res');
                    if (btn) btn.click();
                }
            }, 50);
        }
        return;
    }
}, true);


        function getFilteredRequests() {
            return networkData.filter(req => {
                if (currentFilter.type !== 'All' && !(currentFilter.type === 'XHR' && (req.type === 'XHR' || req.type === 'Fetch')) && req.type !== currentFilter.type)
                    return false;
                if (currentFilter.text && !req.url.toLowerCase().includes(currentFilter.text))
                    return false;
                return true;
            }).reverse();
        }

        function toggleMaximize() {
            isFullScreen = !isFullScreen;
            store.set('sniff_fullscreen', isFullScreen);
            applyFullscreenState();
        }

        function applyFullscreenState() {
            try {
                const panel = shadow.getElementById('sniffer-devtools-panel');
                const fsBtn = shadow.getElementById('sniff-fullscreen');
                const floatBtn = shadow.getElementById('sniff-floating-btn');
                if (!panel) return;
                if (isFullScreen) {
                    panel.style.bottom = '0';
                    panel.style.left = '0';
                    panel.style.width = '100vw';
                    panel.style.height = 'calc(100vh - 70px)';
                    if(fsBtn) fsBtn.innerHTML = '🗗 Thu nhỏ';
                    if(floatBtn) floatBtn.style.display = 'none';
                } else {
                    panel.style.bottom = '12px';
                    panel.style.left = '12px';
                    panel.style.width = 'calc(100vw - 24px)';
                    panel.style.height = '55vh';
                    if(fsBtn) fsBtn.innerHTML = '🗖 Phóng to';
                    if(floatBtn) floatBtn.style.display = 'block';
                }
            } catch(e) { Logger.error('Lỗi khi apply fullscreen', e); }
        }

        function togglePanelVisibility(show) {
            try {
                isPanelOpen = show;
                store.set('sniff_auto_open', show);
                const panel = shadow.getElementById('sniffer-devtools-panel');
                const floatBtn = shadow.getElementById('sniff-floating-btn');
                if (panel) panel.style.display = show ? 'flex' : 'none';
                if (!show && isHoveringPanel) {
                    isHoveringPanel = false;
                    document.body.style.removeProperty('overflow');
                }
                if (show) {
                    applyFullscreenState();
                } else {
                    if (floatBtn && !isFullScreen) floatBtn.style.display = 'block';
                }
            } catch(e) { Logger.error('Lỗi khi toggle panel', e); }
        }

        // 5. KHỞI TẠO SHADOW DOM & CSS
        function initUI() {
            try {
                const style = document.createElement('style');
                style.innerHTML = `
                    * { box-sizing: border-box; }
                    #sniff-floating-btn {
                        position: fixed; top: 10px; right: 10px; z-index: 2147483647;
                        pointer-events: auto; background: #252526; color: #4ec9b0;
                        padding: 8px 12px; border: 1px solid #4ec9b0; border-radius: 4px;
                        cursor: pointer; font-family: Arial, sans-serif; font-size: 16px;
                        font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.5); user-select: none;
                    }
                    #sniffer-devtools-panel {
                        position: fixed; bottom: 12px; left: 12px; width: calc(100vw - 24px);
                        height: 55vh; max-height: calc(100vh - 24px); background: #1e1e1e;
                        color: #d4d4d4; z-index: 2147483646; pointer-events: auto; display: none;
                        flex-direction: column; font-family: Consolas, monospace;
                        border: 1px solid #007acc; border-top: 3px solid #007acc;
                        border-radius: 4px; font-size: 13px; box-shadow: 0 -5px 25px rgba(0,0,0,0.8);
                    }
                    #sniff-toast-container {
                        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                        z-index: 99999999; display: flex; flex-direction: column; gap: 8px;
                        pointer-events: none;
                    }
                    .sniff-toast {
                        padding: 10px 16px; border-radius: 4px; color: #fff; font-size: 13px;
                        font-family: Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.6);
                        opacity: 0; transform: translateY(20px); transition: all 0.3s ease;
                        white-space: nowrap;
                    }
                    .sniff-toast.show { opacity: 1; transform: translateY(0); }
                    .toast-info { background: #007acc; }
                    .toast-success { background: #137333; }
                    .toast-error { background: #c53030; }
                    .sniff-filter { background: transparent; color: #ccc; border: none; cursor: pointer; padding: 4px 8px; font-size:12px; }
                    .sniff-filter.active { background: #094771; color: #fff; border-radius: 3px; }
                    .sniff-filter:hover { background: #333; }
                    .sniff-action-btn { background: #333; color: #ccc; border: 1px solid #555; padding: 3px 8px; cursor: pointer; border-radius: 3px; font-size: 11px; display:flex; align-items:center; gap:4px;}
                    .sniff-action-btn:hover { background: #444; color: #fff; }
                    #sniff-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                    #sniff-table th, #sniff-table td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                    #sniff-table tr:hover { background: #2a2d2e; cursor: pointer; }
                    #sniff-table tr.selected { background: #094771 !important; color: #fff !important; }
                    .sniff-btn { background: #333; color: #ccc; border: 1px solid #555; padding: 4px 8px; cursor: pointer; margin: 2px; border-radius: 2px; font-size: 12px; }
                    .sniff-btn:hover { background: #005a9e; color: #fff; }
                    .sniff-btn.active-tab { background: #007acc !important; color: #fff !important; font-weight: bold; border-color: #007acc; }
                    ::-webkit-scrollbar { width: 8px; height: 8px; }
                    ::-webkit-scrollbar-track { background: #1e1e1e; }
                    ::-webkit-scrollbar-thumb { background: #424242; border-radius: 4px; }
                    ::-webkit-scrollbar-thumb:hover { background: #4f4f4f; }
                    .hl-key { color: #9cdcfe !important; font-weight: bold; }
                    .hl-str { color: #ce9178 !important; cursor: pointer; }
                    .hl-num { color: #b5cea8 !important; }
                    .hl-bool { color: #569cd6 !important; }
                    .hl-kw { color: #569cd6 !important; font-weight: bold; }
                    .hl-url { color: #4fc1ff !important; text-decoration: underline; cursor: pointer; font-weight: bold; }
                    .hl-url:hover { color: #9cdcfe !important; background: rgba(0,122,204,0.3) !important; }
                    .hl-html-tag { color: #569cd6 !important; font-weight: bold; }
                    .hl-html-attr { color: #9cdcfe !important; }
                    .hl-html-val { color: #ce9178 !important; }
                    .hl-html-cmnt { color: #6a9955 !important; font-style: italic; }
                    .wrap-enabled { white-space: pre-wrap !important; word-break: break-all !important; overflow-wrap: anywhere !important; }
                    .wrap-disabled { white-space: pre !important; word-break: normal !important; overflow-x: auto; }
                    mark.sniff-search-hl { background: #613214 !important; color: #fff !important; border-radius: 2px; padding: 0 1px; }
                    mark.sniff-search-hl.active-hl { background: #f6b73c !important; color: #000 !important; font-weight: bold; outline: 2px solid #ff9900; }
                    .search-res-item { padding: 5px 8px; border-bottom: 1px solid #333; cursor: pointer; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; gap: 6px; align-items: center; }
                    .search-res-item:hover { background: #094771; color: #fff; }
                    .search-res-item.active { background: #007acc !important; color: #fff !important; font-weight: bold; }
                    .search-res-item.visited { color: #888 !important; background: #202020; }
                    .search-res-item.visited .res-num { background: #444 !important; }
                    .res-num { background: #094771; color: #fff; padding: 1px 4px; border-radius: 3px; font-size: 10px; font-weight: bold; }
                    .sniff-splitter { width: 4px; cursor: col-resize; background: #333; z-index: 10; flex-shrink: 0; transition: background 0.2s;}
                    .sniff-splitter:hover, .sniff-splitter.dragging { background: #007acc; }
                `;
                shadow.appendChild(style);

                const btn = document.createElement('div');
                btn.id = 'sniff-floating-btn';
                btn.innerHTML = '🌐';
                btn.title = 'Nhấn để mở / Ctrl+Y. Chuột phải để ẩn 30s';
                btn.onclick = () => togglePanelVisibility(!isPanelOpen);
                btn.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    btn.style.display = 'none';
                    showToast('Đã ẩn nút Sniffer 30 giây', 'info', 30000);
                    setTimeout(() => {
                        if (!isFullScreen) btn.style.display = 'block';
                    }, 30000);
                });
                shadow.appendChild(btn);

                const panel = document.createElement('div');
                panel.id = 'sniffer-devtools-panel';
                panel.addEventListener('mouseenter', () => {
                    isHoveringPanel = true;
                    document.body.style.setProperty('overflow', 'hidden', 'important');
                });
                panel.addEventListener('mouseleave', () => {
                    isHoveringPanel = false;
                    document.body.style.removeProperty('overflow');
                });

                const topbar = document.createElement('div');
                topbar.style.cssText = `display: flex; height: 38px; flex: none; padding: 6px 10px; background: #2d2d2d; gap: 8px; align-items: center; border-bottom: 1px solid #3c3c3c;`;
                topbar.innerHTML = `
                    <input type="text" id="sniff-search" placeholder="Lọc URL..." style="background:#3c3c3c; color:#fff; border:1px solid #555; padding:3px 8px; width:130px; outline:none; border-radius:2px;">
                    <button class="sniff-filter active" data-type="All">All</button>
                    <button class="sniff-filter" data-type="XHR">XHR/Fetch</button>
                    <button class="sniff-filter" data-type="Media">Media</button>
                    <button class="sniff-filter" data-type="Image">Img</button>
                    <button class="sniff-filter" data-type="Resource">Res</button>
                    <div style="flex-grow: 1;"></div>
                    <button id="sniff-btn-reset-layout" class="sniff-action-btn" title="Phục hồi kích thước cột">⟲ Reset</button>
                    <button id="sniff-toggle-pause" class="sniff-action-btn">⏸ Pause</button>
                    <button id="sniff-view-page-source" class="sniff-action-btn" style="color:#4ec9b0; border-color:#4ec9b0;">📄 T.Trang</button>
                    <button id="sniff-toggle-right-panel" class="sniff-action-btn">◧ Ẩn/Hiện</button>
                    <button id="sniff-fullscreen" class="sniff-action-btn">🗖 Phóng to</button>
                    <button id="sniff-clear" style="background:#800; color:#fff; border:none; padding:3px 8px; cursor:pointer; border-radius:3px;">🗑 Xoá</button>
                `;

                const contentArea = document.createElement('div');
                contentArea.style.cssText = `display: flex; flex-direction: row; flex: 1; overflow: hidden; min-height: 0;`;

                const listWrapper = document.createElement('div');
                listWrapper.id = 'sniff-list-wrapper';
                listWrapper.style.cssText = `width: ${listWidthRaw}; flex-shrink: 0; overflow-y: auto; background:#1e1e1e; min-height: 0;`;
                listWrapper.innerHTML = `<table id="sniff-table"><thead><tr><th style="width:45%">URL</th><th style="width:15%">Method</th><th style="width:12%">Status</th><th style="width:18%">Type</th><th style="width:10%">Time</th></tr></thead><tbody id="sniff-tbody"></tbody></table>`;

                const splitter1 = document.createElement('div');
                splitter1.className = 'sniff-splitter';

                const detailWrapper = document.createElement('div');
                detailWrapper.id = 'sniff-detail-view';
                detailWrapper.style.cssText = `flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; background: #1e1e1e; min-height: 0;`;
                detailWrapper.innerHTML = `<div style="padding: 20px; color: #666; text-align: center;">Dùng phím ↑ ↓ (chọn link), ← → (đổi tab), Enter (tìm trong Response)</div>`;

                const splitter2 = document.createElement('div');
                splitter2.className = 'sniff-splitter';
                splitter2.style.display = isRightPanelVisible ? 'block' : 'none';

                const rightPanel = document.createElement('div');
                rightPanel.id = 'sniff-right-panel';
                rightPanel.style.cssText = `width: ${rightWidthRaw}; flex-shrink: 0; display: ${isRightPanelVisible?'flex':'none'}; flex-direction: column; background: #252526; min-height: 0;`;
                rightPanel.innerHTML = `
                    <div style="padding: 4px; background: #2d2d2d; border-bottom: 1px solid #3c3c3c; display:flex; gap:4px;">
                        <button class="sniff-btn right-tab-btn active-tab" data-tab="search" style="flex:1;">🔍 KQ (<span id="search-count-badge">0</span>)</button>
                        <button class="sniff-btn right-tab-btn" data-tab="scratchpad" style="flex:1;">📝 Nháp</button>
                    </div>
                    <div id="right-panel-search" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; background: #181818; min-height: 0;">
                        <div style="padding:10px; color:#777; text-align:center; font-size:11px;" id="search-status-text">Nhập từ khóa và bấm Enter ở tab Response để tìm</div>
                        <div id="search-results-list"></div>
                    </div>
                    <div id="right-panel-scratchpad" style="flex: 1; display: none; flex-direction: column; min-height: 0;">
                        <div id="scratch-tabs-bar" style="display:flex; flex-wrap:wrap; gap:2px; padding:4px; background:#2d2d2d; border-bottom:1px solid #444;"></div>
                        <div id="scratch-content-area" style="flex: 1; display: flex; flex-direction: column; min-height:0;"></div>
                    </div>
                `;

                contentArea.appendChild(listWrapper);
                contentArea.appendChild(splitter1);
                contentArea.appendChild(detailWrapper);
                contentArea.appendChild(splitter2);
                contentArea.appendChild(rightPanel);
                panel.appendChild(topbar);
                panel.appendChild(contentArea);
                shadow.appendChild(panel);

                // Sửa logic tính toán cho Resize (Splitters)
                function initDrag(splitterEl, leftEl, rightEl, isLeftSplitter) {
                    let isDragging = false;
                    splitterEl.addEventListener('mousedown', function(e) {
                        isDragging = true;
                        splitterEl.classList.add('dragging');
                        document.body.style.cursor = 'col-resize';
                        const startX = e.clientX;
                        const startLeftWidth = leftEl.getBoundingClientRect().width;
                        const startRightWidth = rightEl.getBoundingClientRect().width;
                        const containerWidth = contentArea.getBoundingClientRect().width;
                        function onMouseMove(e) {
                            if (!isDragging) return;
                            const delta = e.clientX - startX;
                            if (isLeftSplitter) {
                                const newWidth = startLeftWidth + delta;
                                const percentage = (newWidth / containerWidth) * 100;
                                if(percentage > 10 && percentage < 80) {
                                    leftEl.style.width = percentage + '%';
                                    store.set('sniff_list_width', percentage + '%');
                                }
                            } else {
                                const newWidth = startRightWidth - delta;
                                const percentage = (newWidth / containerWidth) * 100;
                                if(percentage > 10 && percentage < 80) {
                                    rightEl.style.width = percentage + '%';
                                    store.set('sniff_right_width', percentage + '%');
                                }
                            }
                        }
                        function onMouseUp() {
                            isDragging = false;
                            splitterEl.classList.remove('dragging');
                            document.body.style.cursor = '';
                            window.removeEventListener('mousemove', onMouseMove);
                            window.removeEventListener('mouseup', onMouseUp);
                        }
                        window.addEventListener('mousemove', onMouseMove);
                        window.addEventListener('mouseup', onMouseUp);
                    });
                }
                initDrag(splitter1, listWrapper, detailWrapper, true);
                initDrag(splitter2, detailWrapper, rightPanel, false);

                shadow.getElementById('sniff-btn-reset-layout').onclick = () => {
                    listWrapper.style.width = '30%';
                    rightPanel.style.width = '25%';
                    store.set('sniff_list_width', '30%');
                    store.set('sniff_right_width', '25%');
                };

                shadow.getElementById('sniff-search').addEventListener('input', (e) => {
                    currentFilter.text = e.target.value.toLowerCase();
                    updateRequestUI();
                });

                shadow.querySelectorAll('.sniff-filter').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        shadow.querySelectorAll('.sniff-filter').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        currentFilter.type = e.target.getAttribute('data-type');
                        updateRequestUI();
                    });
                });

                shadow.getElementById('sniff-toggle-pause').onclick = (e) => {
                    isSnifferPaused = !isSnifferPaused;
                    e.target.innerText = isSnifferPaused ? '▶ Play' : '⏸ Pause';
                    e.target.style.background = isSnifferPaused ? '#b8860b' : '#333';
                    if (!isSnifferPaused) updateRequestUI();
                };

                shadow.getElementById('sniff-clear').addEventListener('click', () => {
                    networkData.length = 0;
                    uniqueRequests.clear();
                    currentSelectedReq = null;
                    shadow.getElementById('sniff-detail-view').innerHTML = `<div style="padding: 20px; color: #666; text-align: center;">Đã xóa lịch sử</div>`;
                    updateRequestUI();
                });

                shadow.getElementById('sniff-fullscreen').onclick = toggleMaximize;

                shadow.getElementById('sniff-view-page-source').onclick = () => {
                    const pageHtml = document.documentElement.outerHTML.replace(/<div id="sniffer-master-root-host"[\s\S]*?<\/div>/, '');
                    const pageReq = {
                        id: 'page-source-synthetic', url: window.location.href, method: 'GET',
                        status: 200, type: 'Resource', time: new Date().toLocaleTimeString(),
                        reqHeaders: {}, resHeaders: { 'content-type': 'text/html; charset=utf-8' },
                        response: cleanRawSourceCode(pageHtml)
                    };
                    currentSelectedReq = pageReq;
                    activeDetailTab = 'd-response';
                    renderDetail(pageReq);
                };

                shadow.getElementById('sniff-toggle-right-panel').onclick = () => {
                    isRightPanelVisible = !isRightPanelVisible;
                    rightPanel.style.display = isRightPanelVisible ? 'flex' : 'none';
                    splitter2.style.display = isRightPanelVisible ? 'block' : 'none';
                };

                shadow.querySelectorAll('.right-tab-btn').forEach(btn => {
                    btn.onclick = (e) => {
                        shadow.querySelectorAll('.right-tab-btn').forEach(b => b.classList.remove('active-tab'));
                        e.target.classList.add('active-tab');
                        activeRightTab = e.target.getAttribute('data-tab');
                        shadow.getElementById('right-panel-search').style.display = activeRightTab === 'search' ? 'flex' : 'none';
                        shadow.getElementById('right-panel-scratchpad').style.display = activeRightTab === 'scratchpad' ? 'flex' : 'none';
                        if(activeRightTab === 'scratchpad') updateScratchpadUI();
                    };
                });

                setTimeout(() => { if(isPanelOpen) togglePanelVisibility(true); }, 50);
            } catch (e) { console.error('[Sniffer Init Error]', e); }
        }

        // --- SCRATCHPAD ĐA TAB ---
        function updateScratchpadUI() {
            const topBar = shadow.getElementById('scratch-tabs-bar');
            const contentArea = shadow.getElementById('scratch-content-area');
            if(!topBar || !contentArea) return;
            let tabsHtml = `<button class="sniff-btn s-tab ${activeNoteIndex === -1 ? 'active-tab' : ''}" data-idx="-1">Console</button>`;
            scratchpads.forEach((s, i) => {
                tabsHtml += `<button class="sniff-btn s-tab ${activeNoteIndex === i ? 'active-tab' : ''}" data-idx="${i}">Nháp ${i+1}</button>`;
            });
            tabsHtml += `<button class="sniff-btn s-tab-add" style="background:#094771; color:#fff;">+</button>`;
            topBar.innerHTML = tabsHtml;
            topBar.querySelectorAll('.s-tab').forEach(b => {
                b.onclick = () => { activeNoteIndex = parseInt(b.getAttribute('data-idx')); updateScratchpadUI(); };
            });
            topBar.querySelector('.s-tab-add').onclick = () => {
                scratchpads.push('');
                store.set('sniff_scratchpads', JSON.stringify(scratchpads));
                activeNoteIndex = scratchpads.length - 1;
                updateScratchpadUI();
            };
            if (activeNoteIndex === -1) {
                contentArea.innerHTML = `<div id="scratch-console-area" style="flex:1; overflow-y:auto; padding:5px; font-family:Consolas; font-size:11px; background:#181818;"></div>`;
                renderConsole();
            } else {
                contentArea.innerHTML = `
                    <textarea id="scratch-textarea" style="flex: 1; background: #1e1e1e; color: #d4d4d4; border: none; padding: 8px; resize: none; outline: none; font-family:Consolas; font-size:12px;">${scratchpads[activeNoteIndex]}</textarea>
                    <button id="btn-delete-scratch" style="background:#800; color:#fff; border:none; padding:4px; font-size:11px; cursor:pointer;">Xóa Trang Nháp ${activeNoteIndex+1}</button>
                `;
                shadow.getElementById('scratch-textarea').oninput = (e) => {
                    scratchpads[activeNoteIndex] = e.target.value;
                    store.set('sniff_scratchpads', JSON.stringify(scratchpads));
                };
                shadow.getElementById('btn-delete-scratch').onclick = () => {
                    scratchpads.splice(activeNoteIndex, 1);
                    store.set('sniff_scratchpads', JSON.stringify(scratchpads));
                    activeNoteIndex = -1;
                    updateScratchpadUI();
                };
            }
        }

        function renderConsole() {
            const cArea = shadow.getElementById('scratch-console-area');
            if(!cArea) return;
            cArea.innerHTML = logs.map(l => `<div style="color:${l.type==='error'?'#f48771':'#9cdcfe'}; border-bottom:1px solid #333; padding:4px 0; word-wrap:break-word;">[${l.time}] ${l.msg}</div>`).join('');
        }

        // --- VIEW STORAGE TAB (Dởi vào Tab chính) ---
        async function renderStorageTab(container) {
            let html = '<div style="padding:10px; font-size: 11px;">';
            html += '<h4 style="color:#569cd6; margin:0 0 5px 0;">Local Storage</h4>' + getStorageHtml(localStorage);
            html += '<hr style="border-color:#333; margin:10px 0;"><h4 style="color:#569cd6; margin:0 0 5px 0;">Session Storage</h4>' + getStorageHtml(sessionStorage);
            html += '<hr style="border-color:#333; margin:10px 0;"><h4 style="color:#569cd6; margin:0 0 5px 0;">Cookies</h4>' + getCookiesHtml();
            html += '<hr style="border-color:#333; margin:10px 0;"><h4 style="color:#569cd6; margin:0 0 5px 0;">Cache Storage</h4><div id="cache-storage-box">Đang tải...</div>';
            html += '</div>';
            container.innerHTML = html;
            try {
                const cacheBox = shadow.getElementById('cache-storage-box');
                if(!window.caches) { cacheBox.innerHTML = '<div style="color:#888;">Trình duyệt không hỗ trợ Cache API</div>'; return; }
                const keys = await caches.keys();
                if(keys.length === 0) cacheBox.innerHTML = '<div style="color:#888;">Trống</div>';
                else {
                    let r = '<ul style="margin:0; padding-left:15px; color:#4fc1ff;">';
                    keys.forEach(k => r += `<li>${k}</li>`);
                    cacheBox.innerHTML = r + '</ul>';
                }
            } catch(e) { Logger.error('Lấy Cache Storage', e); }
        }

        function getStorageHtml(storage) {
            try {
                if(!storage || storage.length === 0) return '<div style="color:#888;">Trống</div>';
                let res = '<table style="width:100%; border-collapse:collapse; table-layout:fixed; word-wrap:break-word;">';
                for(let i=0; i<storage.length; i++) {
                    let k = storage.key(i);
                    let v = storage.getItem(k) || '';
                    res += `<tr><td style="width:35%; border:1px solid #444; padding:4px; color:#9cdcfe;">${k}</td><td style="border:1px solid #444; padding:4px; color:#ce9178;">${v.length > 200 ? v.substring(0,200)+'...' : v}</td></tr>`;
                }
                return res + '</table>';
            } catch(e) { return `<div style="color:#f48771;">Không thể đọc: ${e.message}</div>`; }
        }

        function getCookiesHtml() {
            try {
                if(!document.cookie) return '<div style="color:#888;">Trống</div>';
                let res = '<table style="width:100%; border-collapse:collapse; table-layout:fixed; word-wrap:break-word;">';
                document.cookie.split(';').forEach(c => {
                    let parts = c.split('=');
                    if(parts.length >= 2) res += `<tr><td style="width:35%; border:1px solid #444; padding:4px; color:#9cdcfe;">${parts[0].trim()}</td><td style="border:1px solid #444; padding:4px; color:#ce9178;">${parts.slice(1).join('=')}</td></tr>`;
                });
                return res + '</table>';
            } catch(e) { return `<div style="color:#f48771;">Không thể đọc: ${e.message}</div>`; }
        }

        // 6. RENDER DATA TABLE & CHI TIẾT
        function updateRequestUI() {
            try {
                const tbody = shadow.getElementById('sniff-tbody');
                if(!tbody) return;
                tbody.innerHTML = '';
                const visibleReqs = getFilteredRequests();
                visibleReqs.forEach(req => {
                    const tr = document.createElement('tr');
                    if (currentSelectedReq && currentSelectedReq.id === req.id) tr.classList.add('selected');
                    let name = req.url;
                    try {
                        const urlObj = new URL(req.url, window.location.href);
                        name = urlObj.pathname.split('/').pop() || urlObj.pathname;
                        if(name.length < 2) name = req.url.substring(0, 45) + '...';
                    } catch(e) {}
                    tr.innerHTML = `<td title="${req.url}">${name}</td><td>${req.method}</td><td style="color: ${req.status == 200 ? '#89d185' : '#f48771'}">${req.status}</td><td>${req.type}</td><td>${req.time}</td>`;
                    tr.onclick = () => {
                        currentSelectedReq = req;
                        silentCopy(req.url);
                        shadow.querySelectorAll('#sniff-table tr').forEach(r => r.classList.remove('selected'));
                        tr.classList.add('selected');
                        if (persistentSearchKeyword) {
                            visitedMatches.clear();
                            activeMatchIndex = 0;
                            Logger.info(`[Nav] Click chọn request, reset search index cho keyword: "${persistentSearchKeyword}"`);
                        }
                        renderDetail(req);
                        if (persistentSearchKeyword) {
                            Logger.info(`[AutoSearch] Chuyển request mới, tự động search keyword: "${persistentSearchKeyword}"`);
                            setTimeout(() => {
                                const searchInput = shadow.getElementById('resp-search-input');
                                if (searchInput) {
                                    searchInput.value = persistentSearchKeyword;
                                    const btn = shadow.getElementById('btn-search-res');
                                    if (btn) btn.click();
                                }
                            }, 50);
                        }
                    };
                    tbody.appendChild(tr);
                });
            } catch (e) { Logger.error('Lỗi Update Bảng UI', e); }
        }

        async function renderDetail(req) {
            try {
                const detail = shadow.getElementById('sniff-detail-view');
                detail.innerHTML = `
                    <div style="background: #2d2d2d; padding: 5px; display: flex; gap: 4px; border-bottom: 1px solid #3c3c3c; align-items:center;">
                        <button class="sniff-btn detail-tab ${activeDetailTab === 'd-headers' ? 'active-tab' : ''}" data-target="d-headers">Headers</button>
                        <button class="sniff-btn detail-tab ${activeDetailTab === 'd-response' ? 'active-tab' : ''}" data-target="d-response">Response</button>
                        <button class="sniff-btn detail-tab ${activeDetailTab === 'd-curl' ? 'active-tab' : ''}" data-target="d-curl">cURL</button>
                        <button class="sniff-btn detail-tab ${activeDetailTab === 'd-preview' ? 'active-tab' : ''}" data-target="d-preview">Preview</button>
                        <button class="sniff-btn detail-tab ${activeDetailTab === 'd-storage' ? 'active-tab' : ''}" data-target="d-storage">Storage</button>
                        <div style="flex-grow:1"></div>
                        <button class="sniff-btn" id="d-copy-url">Copy</button>
                        <button class="sniff-btn" id="d-open-tab">Mở</button>
                    </div>
                    <div style="flex:1; overflow-y:auto; padding: 10px; display:flex; flex-direction:column; min-height:0;" id="d-content"></div>
                `;
                shadow.querySelectorAll('.detail-tab').forEach(btn => {
                    btn.onclick = (e) => { activeDetailTab = e.target.getAttribute('data-target'); renderDetail(req); };
                });
                shadow.getElementById('d-copy-url').onclick = () => copyToClipboard(getFullUrl(req.url));
                shadow.getElementById('d-open-tab').onclick = () => window.open(getFullUrl(req.url), '_blank');
                loadTabContent(req);
            } catch (e) { Logger.error('Lỗi Render Detail', e); }
        }

        async function loadTabContent(req) {
            const content = shadow.getElementById('d-content');
            if (!content) return;
            content.innerHTML = '';
            try {
                if (activeDetailTab === 'd-headers') {
                    content.innerHTML = `
                        <div style="display:flex; gap:6px; margin-bottom:8px;">
                            <button class="sniff-btn" id="btn-copy-headers">Copy</button>
                        </div>
                        <h4 style="margin-top:0; color:#569cd6; font-size:12px;">General</h4>
                        <div style="font-size:12px; word-break:break-all;"><b>URL:</b> ${req.url}</div>
                        <div style="font-size:12px;"><b>Method:</b> ${req.method} | <b>Status:</b> ${req.status}</div>
                        <hr style="border-color:#333;">
                        <h4 style="color:#569cd6; font-size:12px;">Response Headers</h4>
                        <pre style="white-space: pre-wrap; font-size: 11px; color: #ce9178;">${JSON.stringify(req.resHeaders, null, 2)}</pre>
                        <hr style="border-color:#333;">
                        <h4 style="color:#569cd6; font-size:12px;">Request Headers</h4>
                        <pre style="white-space: pre-wrap; font-size: 11px; color: #9cdcfe;">${JSON.stringify(req.reqHeaders, null, 2)}</pre>
                    `;
                    const copyHeadersBtn = shadow.getElementById('btn-copy-headers');
                    if (copyHeadersBtn) {
                        copyHeadersBtn.onclick = () => {
                            const headersText = `URL: ${req.url}
Method: ${req.method}
Status: ${req.status}

Response Headers:
${JSON.stringify(req.resHeaders, null, 2)}

Request Headers:
${JSON.stringify(req.reqHeaders, null, 2)}`;
                            copyToClipboard(headersText);
                        };
                    }
                } else if (activeDetailTab === 'd-storage') {
                    renderStorageTab(content);
                } else if (activeDetailTab === 'd-response') {
                    if (!req.response && req.status === 'N/A') {
                        content.innerHTML = `<div style="color:#dcdcaa;">Đang tải nội dung resource...</div>`;
                        try {
                            const res = await fetch(req.url);
                            req.status = res.status;
                            req.response = cleanRawSourceCode(await res.text());
                        } catch (err) {
                            req.response = 'Không thể fetch resource: ' + err.message;
                            Logger.error('Lỗi Fetch Preview Resource', err);
                        }
                    }
                    let rawResponse = '';
                    let isJson = false;
                    let parsedJson = null;
                    if (typeof req.response === 'object' && req.response !== null) {
                        parsedJson = req.response;
                        isJson = true;
                        rawResponse = JSON.stringify(parsedJson);
                    } else {
                        rawResponse = req.response ? req.response.toString() : '';
                        try { parsedJson = JSON.parse(rawResponse); isJson = true; } catch(e) {}
                    }

                    const toolContainer = document.createElement('div');
                    toolContainer.style.cssText = 'display:flex; gap:6px; margin-bottom:8px; align-items:center;';
                    toolContainer.innerHTML = `
                        <button class="sniff-btn" id="btn-copy-res">Copy</button>
                        <button class="sniff-btn" id="btn-toggle-wrap" style="color:#4ec9b0;">${isWordWrapEnabled ? '↩️ Wrap: ON' : '➡️ Wrap: OFF'}</button>
                        ${isJson ? `<button class="sniff-btn" id="btn-toggle-json-tree" style="background:#094771; border-color:#007acc;">${jsonViewMode === 'tree' ? '🌐 Chuyển Code' : '🌳 Chuyển Tree'}</button>` : ''}
                        <input type="text" id="resp-search-input" value="${persistentSearchKeyword.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}" placeholder="Nhập từ khóa + nhấn Enter / ↑↓ để duyệt..." style="background:#3c3c3c; color:#fff; border:1px solid #555; padding:3px 6px; font-size:12px; flex:1; outline:none;">
                        <button class="sniff-btn" id="btn-search-res" style="background:#007acc; border-color:#005a9e; color:#fff;">🔍 Search</button>
                        <span id="search-match-nav" style="color:#999; font-size:11px; white-space:nowrap;"></span>
                    `;
                    content.appendChild(toolContainer);

                    shadow.getElementById('btn-copy-res').onclick = () => copyToClipboard(typeof req.response === 'object' ? JSON.stringify(req.response, null, 2) : rawResponse);
                    shadow.getElementById('btn-toggle-wrap').onclick = () => {
                        isWordWrapEnabled = !isWordWrapEnabled;
                        const area = shadow.getElementById('resp-display-area');
                        if (area) area.className = isWordWrapEnabled ? 'wrap-enabled' : 'wrap-disabled';
                        shadow.getElementById('btn-toggle-wrap').innerText = isWordWrapEnabled ? '↩️ Wrap: ON' : '➡️ Wrap: OFF';
                    };
                    if (isJson && shadow.getElementById('btn-toggle-json-tree')) {
                        shadow.getElementById('btn-toggle-json-tree').onclick = () => {
                            jsonViewMode = jsonViewMode === 'tree' ? 'code' : 'tree';
                            loadTabContent(req);
                        };
                    }

                    const displayArea = document.createElement('div');
                    displayArea.id = 'resp-display-area';
                    displayArea.className = isWordWrapEnabled ? 'wrap-enabled' : 'wrap-disabled';
                    displayArea.style.cssText = 'flex:1; overflow-y:auto; background:#141414; padding:8px; border-radius:3px; font-size:12px; font-family:Consolas, monospace; min-height:0; white-space: pre-wrap;';
                    displayArea.dataset.rawText = rawResponse;
                    content.appendChild(displayArea);

                    function renderContent() {
                        if (isJson && jsonViewMode === 'tree') {
                            displayArea.innerHTML = '';
                            displayArea.appendChild(createJsonTreeDOM(parsedJson));
                            if (persistentSearchKeyword) {
                                const searchTargetText = isJson ? JSON.stringify(parsedJson, null, 2) : rawResponse;
                                executeResponseSearch(searchTargetText, persistentSearchKeyword, true);
                                updateSearchMatchNav();
                            }
                            return;
                        }
                        if (persistentSearchKeyword) {
                            const targetText = isJson ? JSON.stringify(parsedJson, null, 2) : rawResponse;
                            let lang = 'auto';
                            if (isJson) lang = 'json';
                            else if (req.id === 'page-source-synthetic' || req.url.match(/\.(html|htm)(\?.*)?$/i)) lang = 'html';
                            else if (req.url.match(/\.js(\?.*)?$/i)) lang = 'js';
                            else if (req.url.match(/\.css(\?.*)?$/i)) lang = 'css';
                            displayArea.innerHTML = renderTextWithSearch(targetText, persistentSearchKeyword, lang);
                            executeResponseSearch(targetText, persistentSearchKeyword, true);
                            updateSearchMatchNav();
                            return;
                        }
                        if (isJson && jsonViewMode === 'code') {
                            displayArea.innerHTML = highlightSyntax(JSON.stringify(parsedJson, null, 2), 'json');
                        } else if (req.id === 'page-source-synthetic' || req.url.match(/\.(html|htm)(\?.*)?$/i)) {
                            displayArea.innerHTML = highlightHTML(rawResponse);
                        } else if (req.url.match(/\.js(\?.*)?$/i)) {
                            displayArea.innerHTML = highlightSyntax(beautifyJS(rawResponse), 'js');
                        } else if (req.url.match(/\.css(\?.*)?$/i)) {
                            displayArea.innerHTML = highlightSyntax(beautifyCSS(rawResponse), 'css');
                        } else {
                            displayArea.innerHTML = highlightSyntax(rawResponse, 'text');
                        }
                    }
                    renderContent();

                    function updateSearchMatchNav() {
                        const nav = shadow.getElementById('search-match-nav');
                        if (!nav) return;
                        if (responseMatches.length > 0) {
                            nav.innerText = `${activeMatchIndex + 1}/${responseMatches.length}`;
                        } else if (persistentSearchKeyword) {
                            nav.innerText = '0/0';
                        } else {
                            nav.innerText = '';
                        }
                    }

                    const searchInput = shadow.getElementById('resp-search-input');
                    const btnSearch = shadow.getElementById('btn-search-res');
                    const matchNav = shadow.getElementById('search-match-nav');
                    const performSearch = (newKeyword) => {
                        if (!newKeyword) {
                            persistentSearchKeyword = '';
                            responseMatches = [];
                            activeMatchIndex = -1;
                            visitedMatches.clear();
                            renderContent();
                            updateSearchResultsUI();
                            updateSearchMatchNav();
                            Logger.info('[Search] Đã xóa keyword.');
                            return;
                        }
                        Logger.info(`[Search] Thực hiện search keyword: "${newKeyword}"`);
                        if (newKeyword !== persistentSearchKeyword) {
                            persistentSearchKeyword = newKeyword;
                            visitedMatches.clear();
                            activeMatchIndex = -1;
                        }
                        activeRightTab = 'search';
                        shadow.querySelectorAll('.right-tab-btn').forEach(b => b.classList.remove('active-tab'));
                        const searchTabBtn = shadow.querySelector('.right-tab-btn[data-tab="search"]');
                        if(searchTabBtn) searchTabBtn.classList.add('active-tab');
                        shadow.getElementById('right-panel-search').style.display = 'flex';
                        shadow.getElementById('right-panel-scratchpad').style.display = 'none';
                        if (!isRightPanelVisible) {
                            const rp = shadow.getElementById('sniff-right-panel');
                            const sp = shadow.querySelectorAll('.sniff-splitter')[1];
                            if(rp) rp.style.display = 'flex';
                            if(sp) sp.style.display = 'block';
                            isRightPanelVisible = true;
                        }
                        renderContent();
                        const searchTargetText = isJson ? JSON.stringify(parsedJson, null, 2) : rawResponse;
                        executeResponseSearch(searchTargetText, persistentSearchKeyword);
                        if (responseMatches.length > 0) {
                            activeMatchIndex = 0;
                            focusOnMatch(0);
                            updateSearchMatchNav();
                            showToast(`Tìm xong! Có ${responseMatches.length} kết quả.`, 'success');
                            Logger.info(`[Search] Tìm thấy ${responseMatches.length} kết quả cho "${persistentSearchKeyword}".`);
                        } else {
                            updateSearchMatchNav();
                            showToast('Không tìm thấy kết quả.', 'info');
                            Logger.info(`[Search] Không tìm thấy kết quả cho "${persistentSearchKeyword}".`);
                        }
                    };
                    const navigateMatches = (direction) => {
                        if (responseMatches.length === 0) return;
                        if (direction === 'down') {
                            activeMatchIndex = (activeMatchIndex + 1) % responseMatches.length;
                        } else {
                            activeMatchIndex = (activeMatchIndex - 1 + responseMatches.length) % responseMatches.length;
                        }
                        focusOnMatch(activeMatchIndex);
                        updateSearchMatchNav();
                        Logger.info(`[Search] Đang xem kết quả ${activeMatchIndex + 1} / ${responseMatches.length}.`);
                    };
                    if (btnSearch) {
                        btnSearch.addEventListener('click', () => {
                            performSearch(searchInput.value.trim());
                        });
                    }
                    if (searchInput) {
                        searchInput.onkeydown = (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                performSearch(searchInput.value.trim());
                                return;
                            }
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                e.preventDefault();
                                navigateMatches(e.key === 'ArrowDown' ? 'down' : 'up');
                                return;
                            }
                        };
                    }

                } else if (activeDetailTab === 'd-curl') {
                    const curlData = generateCurl(req);
                    content.innerHTML = `<button class="sniff-btn" id="btn-copy-curl" style="margin-bottom:8px; align-self:flex-start;">Copy</button><pre style="white-space: pre-wrap; font-size: 11px; color: #dcdcaa; background: #111; padding: 8px; border-radius:3px; overflow-y:auto; min-height:0;">${curlData}</pre>`;
                    shadow.getElementById('btn-copy-curl').onclick = () => copyToClipboard(curlData);
                } else if (activeDetailTab === 'd-preview') {
                    if (req.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
                        content.innerHTML = `<img src="${req.url}" style="max-width: 100%; border: 1px solid #555; background:#111;">`;
                    } else if (req.url.match(/\.mp4$/i)) {
                        content.innerHTML = `<video src="${req.url}" controls style="width: 100%; max-height: 350px;"></video>`;
                    } else if (req.url.match(/\.(m3u8|ts)$/i)) {
                        content.innerHTML = `<video id="hls-video-preview" controls style="width: 100%; max-height: 350px;"></video>`;
                        setTimeout(() => {
                            const video = shadow.getElementById('hls-video-preview');
                            if (window.Hls && Hls.isSupported()) {
                                const hls = new Hls();
                                hls.loadSource(req.url);
                                hls.attachMedia(video);
                            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                                video.src = req.url;
                            }
                        }, 400);
                    } else {
                        content.innerHTML = `<i style="color:#888;">Không hỗ trợ Preview định dạng này.</i>`;
                    }
                }
            } catch (err) {
                Logger.error(`Lỗi Load Tab [${activeDetailTab}]`, err);
            }
        }

        // 7. THỰC THI TÌM KIẾM ĐÁNH DẤU CHÍNH XÁC
        function renderTextWithSearch(text, keyword, lang) {
            if (!text) return '';
            text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            if (!keyword) {
                if (lang === 'json') return highlightSyntax(text, 'json');
                if (lang === 'html') return highlightHTML(text);
                if (lang === 'js') return highlightSyntax(beautifyJS(text), 'js');
                if (lang === 'css') return highlightSyntax(beautifyCSS(text), 'css');
                return escapeHtml(text).replace(/\n/g, '<br>');
            }
            const lowerText = text.toLowerCase();
            const lowerKey = keyword.toLowerCase();
            let out = '';
            let pos = 0;
            let idx = 0;
            while (true) {
                const found = lowerText.indexOf(lowerKey, pos);
                if (found === -1) break;
                const before = text.substring(pos, found);
                if (lang === 'html') out += inlineHighlightHTML(before);
                else if (lang === 'json' || lang === 'js' || lang === 'css') out += inlineHighlightCode(before, lang);
                else out += escapeHtml(before);
                out += `<mark class="sniff-search-hl" id="sniff-mark-${idx}">${escapeHtml(text.substring(found, found + keyword.length))}</mark>`;
                pos = found + keyword.length;
                idx++;
            }
            const after = text.substring(pos);
            if (lang === 'html') out += inlineHighlightHTML(after);
            else if (lang === 'json' || lang === 'js' || lang === 'css') out += inlineHighlightCode(after, lang);
            else out += escapeHtml(after);
            return `<pre style="margin:0; color:#d4d4d4;">${out.replace(/\n/g, '<br>')}</pre>`;
        }

        function executeResponseSearch(fullText, keyword, keepIndex = false) {
            responseMatches = [];
            if (!keyword) {
                updateSearchResultsUI();
                return;
            }
            const lowerText = fullText.toLowerCase();
            const lowerKey = keyword.toLowerCase();
            let startIndex = 0;
            let matchCounter = 0;
            while ((startIndex = lowerText.indexOf(lowerKey, startIndex)) > -1) {
                let startSnip = Math.max(0, startIndex - 40);
                let endSnip = Math.min(fullText.length, startIndex + keyword.length + 60);
                let snippet = fullText.substring(startSnip, endSnip).replace(/[\n\r]/g, ' ');
                let lineNum = fullText.substring(0, startIndex).split('\n').length;
                responseMatches.push({
                    id: `sniff-mark-${matchCounter}`,
                    lineNum: lineNum,
                    snippetText: (startSnip > 0 ? '...' : '') + snippet + (endSnip < fullText.length ? '...' : '')
                });
                matchCounter++;
                startIndex += keyword.length;
            }
            updateSearchResultsUI();
            if (responseMatches.length > 0) {
                activeMatchIndex = keepIndex && activeMatchIndex < responseMatches.length ? activeMatchIndex : 0;
                focusOnMatch(activeMatchIndex);
            } else {
                activeMatchIndex = -1;
            }
        }

        function jumpToNextSearchMatch() {
            if (responseMatches.length === 0) return;
            activeMatchIndex = (activeMatchIndex + 1) % responseMatches.length;
            focusOnMatch(activeMatchIndex);
        }

        function jumpToPrevSearchMatch() {
            if (responseMatches.length === 0) return;
            activeMatchIndex = (activeMatchIndex - 1 + responseMatches.length) % responseMatches.length;
            focusOnMatch(activeMatchIndex);
        }

        function focusOnMatch(index) {
            if (index < 0 || index >= responseMatches.length) return;
            visitedMatches.add(index);
            shadow.querySelectorAll('.search-res-item.active').forEach(i => i.classList.remove('active'));
            const resItem = shadow.getElementById(`search-res-item-${index}`);
            if (resItem) {
                resItem.classList.add('active', 'visited');
                resItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
            const displayArea = shadow.getElementById('resp-display-area');
            if (displayArea) {
                displayArea.querySelectorAll('mark.sniff-search-hl').forEach(m => m.classList.remove('active-hl'));
                const targetMark = displayArea.querySelector(`mark#sniff-mark-${index}`);
                if (targetMark) {
                    targetMark.classList.add('active-hl');
                    // Dùng setTimeout nhỏ để đảm bảo DOM đã cập nhật trước khi scroll
                    setTimeout(() => {
                        targetMark.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }, 50);
                }
            }
            const badge = shadow.getElementById('search-count-badge');
            if (badge) badge.innerText = `${index + 1}/${responseMatches.length}`;
        }

        function updateSearchResultsUI() {
            const badge = shadow.getElementById('search-count-badge');
            const container = shadow.getElementById('search-results-list');
            const statusText = shadow.getElementById('search-status-text');
            if (badge) badge.innerText = responseMatches.length;
            if (!container) return;
            if (responseMatches.length === 0) {
                if(statusText) {
                    statusText.innerText = persistentSearchKeyword ? 'Không tìm thấy kết quả khớp nào' : 'Nhập từ khóa và bấm Enter ở tab Response để tìm';
                    statusText.style.display = 'block';
                }
                container.innerHTML = '';
                return;
            }
            if(statusText) statusText.style.display = 'none';
            let html = '';
            responseMatches.forEach((m, idx) => {
                const isVisited = visitedMatches.has(idx);
                html += `<div class="search-res-item ${isVisited ? 'visited' : ''}" id="search-res-item-${idx}" data-idx="${idx}" title="Dòng ${m.lineNum}: ${m.snippetText}"><span class="res-num">#${idx + 1}</span><span style="color:#007acc; font-weight:bold;">L${m.lineNum}:</span><span style="overflow:hidden; text-overflow:ellipsis;">${m.snippetText.replace(/</g, '&lt;')}</span></div>`;
            });
            container.innerHTML = html;
            container.querySelectorAll('.search-res-item').forEach(item => {
                item.onclick = () => {
                    const idx = parseInt(item.getAttribute('data-idx'));
                    activeMatchIndex = idx;
                    // Nếu đang không ở tab Response, tự động chuyển sang tab Response
                    if (activeDetailTab !== 'd-response' && currentSelectedReq) {
                        activeDetailTab = 'd-response';
                        renderDetail(currentSelectedReq);
                        // Sau khi render xong mới focus
                        setTimeout(() => focusOnMatch(idx), 60);
                    } else {
                        focusOnMatch(idx);
                    }
                };
            });
        }

        // 8. HIGHLIGHT TEXT/JSON/HTML
        function inlineHighlightHTML(html) {
            let escaped = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            escaped = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-html-cmnt">$1</span>');
            escaped = escaped.replace(/(&lt;\/?[a-zA-Z0-9\-]+)(?=\s|&gt;|\/&gt;)/g, '<span class="hl-html-tag">$1</span>');
            escaped = escaped.replace(/([a-zA-Z0-9\-]+)=(".*?"|'.*?'|[^\s&gt;]+)/g, '<span class="hl-html-attr">$1</span>=<span class="hl-html-val">$2</span>');
            return escaped;
        }
        function highlightHTML(html) {
            return `<pre style="margin:0; color:#d4d4d4;">${inlineHighlightHTML(html)}</pre>`;
        }

        function createJsonTreeDOM(obj) {
            if (obj === null) return createSpan('null', 'hl-bool');
            if (typeof obj === 'boolean') return createSpan(obj.toString(), 'hl-bool');
            if (typeof obj === 'number') return createSpan(obj.toString(), 'hl-num');
            if (typeof obj === 'string') return createInteractiveStringDOM(obj);
            const isArray = Array.isArray(obj);
            const container = document.createElement('div');
            container.style.cssText = 'padding-left: 14px; font-family: Consolas, monospace; line-height: 1.5;';
            const keys = Object.keys(obj);
            if (keys.length === 0) {
                container.innerText = isArray ? '[]' : '{}';
                return container;
            }
            const toggle = document.createElement('span');
            toggle.innerText = '▼ ';
            toggle.style.cssText = 'cursor: pointer; color: #888; user-select: none; font-size: 10px; font-weight: bold;';
            const header = document.createElement('span');
            header.innerText = isArray ? `Array(${keys.length}) [` : `Object {`;
            header.style.color = '#888';
            const contentDiv = document.createElement('div');
            contentDiv.style.display = 'block';
            toggle.onclick = () => {
                if (contentDiv.style.display === 'none') {
                    contentDiv.style.display = 'block';
                    toggle.innerText = '▼ ';
                } else {
                    contentDiv.style.display = 'none';
                    toggle.innerText = '▶ ';
                }
            };
            const startLine = document.createElement('div');
            startLine.appendChild(toggle);
            startLine.appendChild(header);
            container.appendChild(startLine);
            container.appendChild(contentDiv);
            keys.forEach((key, idx) => {
                const row = document.createElement('div');
                row.style.cssText = 'display: flex; align-items: flex-start;';
                if (!isArray) {
                    const keySpan = document.createElement('span');
                    keySpan.className = 'hl-key';
                    keySpan.innerText = `"${key}": `;
                    keySpan.style.cssText = 'margin-right: 4px; cursor: pointer;';
                    keySpan.onclick = (e) => selectAndPopMenu(keySpan, e, key);
                    row.appendChild(keySpan);
                }
                row.appendChild(createJsonTreeDOM(obj[key]));
                if (idx < keys.length - 1) {
                    const comma = document.createElement('span');
                    comma.innerText = ',';
                    comma.style.color = '#888';
                    row.appendChild(comma);
                }
                contentDiv.appendChild(row);
            });
            const endLine = document.createElement('div');
            endLine.innerText = isArray ? ']' : '}';
            endLine.style.color = '#888';
            container.appendChild(endLine);
            return container;
        }

        function createSpan(text, className) {
            const span = document.createElement('span');
            span.className = className;
            span.innerText = text;
            return span;
        }

        function createInteractiveStringDOM(str) {
            const span = document.createElement('span');
            if (/^https?:\/\/[^\s"]+/i.test(str)) {
                span.innerText = `"${str}"`;
                span.className = 'hl-url';
                span.onclick = (e) => selectAndPopMenu(span, e, str);
            } else {
                span.innerText = `"${str}"`;
                span.className = 'hl-str';
                span.onclick = (e) => selectAndPopMenu(span, e, str);
            }
            return span;
        }

        function selectAndPopMenu(element, event, textContent) {
            event.stopPropagation();
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(element);
            selection.removeAllRanges();
            selection.addRange(range);
            showSelectionMenu(event.clientX, event.clientY, textContent);
        }

        function beautifyJS(code) {
            let indent = 0;
            let output = '';
            let inString = false;
            let stringChar = '';
            for (let i = 0; i < code.length; i++) {
                let char = code[i];
                if ((char === '"' || char === "'" || char === '`') && code[i-1] !== '\\') {
                    if (!inString) { inString = true; stringChar = char; }
                    else if (stringChar === char) inString = false;
                }
                if (!inString) {
                    if (char === '{' || char === '[') {
                        indent++;
                        output += char + '\n' + ' '.repeat(indent);
                        continue;
                    }
                    if (char === '}' || char === ']') {
                        indent = Math.max(0, indent - 1);
                        output += '\n' + ' '.repeat(indent) + char;
                        continue;
                    }
                    if (char === ';') {
                        output += char + '\n' + ' '.repeat(indent);
                        continue;
                    }
                }
                output += char;
            }
            return output;
        }

        function beautifyCSS(code) {
            return code.replace(/\{/g, ' {\n ').replace(/;/g, ';\n ').replace(/\}/g, '\n}\n').replace(/\n\s*\n/g, '\n');
        }

        function inlineHighlightCode(code, lang) {
            let txt = escapeHtml(code);
            txt = txt.replace(/(https?:\/\/[^\s"',]+)/g, '<span class="hl-url">$1</span>');
            txt = txt.replace(/(".*?"|'.*?'|`.*?`)/g, (m) => { if(m.includes('class="hl-url"')) return m; return '<span class="hl-str">'+m+'</span>'; });
            if (lang === 'js' || lang === 'json')
                txt = txt.replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|async|await|try|catch|new|null|true|false)\b/g, '<span class="hl-kw">$1</span>');
            return '<span style="color:#d4d4d4;">'+txt+'</span>';
        }
        function highlightSyntax(code, lang) {
            let escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            escaped = escaped.replace(/(https?:\/\/[^\s"',]+)/g, `<span class="hl-url">$1</span>`);
            escaped = escaped.replace(/(".*?"|'.*?'|`.*?`)/g, (match) => {
                if(match.includes('class="hl-url"')) return match;
                return `<span class="hl-str">${match}</span>`;
            });
            if (lang === 'js' || lang === 'json')
                escaped = escaped.replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|async|await|try|catch|new|null|true|false)\b/g, `<span class="hl-kw">$1</span>`);
            return `<pre style="margin:0; color:#d4d4d4;">${escaped}</pre>`;
        }

        // 9. POPUP MENU NGỮ CẢNH BÔI ĐEN VĂN BẢN
        const selectionMenu = document.createElement('div');
        selectionMenu.style.cssText = `position: fixed; display: none; z-index: 2147483647; pointer-events: auto; background: #2d2d2d; border: 1px solid #007acc; border-radius: 4px; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); font-family: Consolas, monospace; font-size: 11px;`;
        selectionMenu.innerHTML = `<button class="sel-tool-btn" data-action="b64-enc">B64 Enc</button><button class="sel-tool-btn" data-action="b64-dec">B64 Dec</button><button class="sel-tool-btn" data-action="smart-dec">Smart Dec</button><button class="sel-tool-btn" data-action="url-enc">URL Enc</button><button class="sel-tool-btn" data-action="open-link" style="color:#4ec9b0;">Mở Link</button>`;
        shadow.appendChild(selectionMenu);

        const selStyle = document.createElement('style');
        selStyle.innerHTML = `.sel-tool-btn { background: #333; color: #fff; border: none; padding: 4px 8px; cursor: pointer; border-radius: 2px; margin-right: 2px; } .sel-tool-btn:hover { background: #007acc; }`;
        shadow.appendChild(selStyle);

        let lastSelectedText = '';
        function showSelectionMenu(x, y, text) {
            if (!text || !text.trim()) return;
            lastSelectedText = text.trim();
            selectionMenu.style.top = (y + 10) + 'px';
            selectionMenu.style.left = (x) + 'px';
            selectionMenu.style.display = 'block';
        }

        let lastSelectionRange = null;
        shadow.addEventListener('contextmenu', (e) => {
            if (selectionMenu.contains(e.target)) return;
            const selection = shadow.getSelection ? shadow.getSelection() : window.getSelection();
            const text = selection.toString().trim();
            if (text.length > 0) {
                lastSelectedText = text;
                try { lastSelectionRange = selection.getRangeAt(0).cloneRange(); } catch(err) { lastSelectionRange = null; }
                e.preventDefault();
                showSelectionMenu(e.clientX, e.clientY, text);
            } else {
                selectionMenu.style.display = 'none';
                lastSelectionRange = null;
            }
        });

        selectionMenu.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            if (!action) return;
            selectionMenu.style.display = 'none';
            try {
                let result = null;
                if (action === 'b64-enc') result = btoa(unescape(encodeURIComponent(lastSelectedText)));
                else if (action === 'b64-dec') result = decodeURIComponent(escape(atob(lastSelectedText)));
                else if (action === 'smart-dec') {
                    result = lastSelectedText;
                    if (result.includes('%')) result = decodeURIComponent(result);
                    if (result.includes('\\')) {
                        try {
                            let parsed = JSON.parse('"' + result.replace(/"/g, '\\"').replace(/\\([^u0-9a-fA-F])/g, '\\\\$1') + '"');
                            if (parsed) result = parsed;
                        } catch(ex) {
                            result = result.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                        }
                    }
                }
                else if (action === 'url-enc') result = encodeURIComponent(lastSelectedText);
                else if (action === 'open-link') {
                    window.open(getFullUrl(lastSelectedText), '_blank');
                    return;
                }
                if (result !== null) {
                    if (lastSelectionRange) {
                        lastSelectionRange.deleteContents();
                        lastSelectionRange.insertNode(document.createTextNode(result));
                        lastSelectionRange = null;
                    } else {
                        copyToClipboard(result);
                    }
                }
            } catch(err) {
                Logger.error('Lỗi khi thực hiện action menu', err);
                showToast('Xảy ra lỗi, xem Console', 'error');
            }
        });

        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI);
        else initUI();

    } catch (globalErr) {
        console.error("[Web Network Sniffer Pro Master] CRITICAL ERROR:", globalErr);
    }
})();
