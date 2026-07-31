// "version": "2.4" - Fixed Nested Tags Parsing
window.BASEURL = window.location.origin;
window.log = function(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[motchille] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[motchille] " + msg);
    }
}

window._$ = function _$(htmlOrNodes) {
    // ----------------------------------------------------------------------
    // 1. CORE ENGINE: PARSER (Chuyển String thành Object Tree)
    // ----------------------------------------------------------------------
    _$._cache = _$._cache || {};

    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'source'];

    function parseHTML(htmlString) {
        const root = { type: 'root', children: [], parent: null };
        let currentParent = root;
        const stack = [root];

        // Regex tách tag và text
        const tagRegex = /<\/?([a-zA-Z0-9_-]+)([^>]*)>|([^<]+)/g;
        let match;

        while ((match = tagRegex.exec(htmlString)) !== null) {
            const [fullMatch, tagName, attrs, text] = match;

            if (text) {
                if (text.trim() !== '') {
                    currentParent.children.push({ type: 'text', content: text, parent: currentParent });
                }
            } else if (fullMatch.startsWith('</')) {
                // Đóng tag: Quay lùi lại parent
                if (stack.length > 1) {
                    stack.pop();
                    currentParent = stack[stack.length - 1];
                }
            } else {
                // Mở tag
                const tag = tagName.toLowerCase();
                const node = {
                    type: 'element',
                    tagName: tag,
                    attributes: parseAttributes(attrs),
                    children: [],
                    parent: currentParent
                };

                currentParent.children.push(node);

                // Nếu không phải thẻ tự đóng, push vào stack
                const isSelfClosing = fullMatch.endsWith('/>') || selfClosingTags.indexOf(tag) !== -1;
                if (!isSelfClosing) {
                    stack.push(node);
                    currentParent = node;
                }
            }
        }
        return root.children;
    }

    function parseAttributes(attrString) {
        const attrs = {};
        if (!attrString) return attrs;
        const attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let match;
        while ((match = attrRegex.exec(attrString)) !== null) {
            const key = match[1].toLowerCase();
            const val = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : (match[4] !== undefined ? match[4] : ""));
            attrs[key] = val;
        }
        return attrs;
    }

    // ----------------------------------------------------------------------
    // 2. HELPER: SELECTOR ENGINE & RENDERER
    // ----------------------------------------------------------------------
    function matchNode(node, selector) {
        if (node.type !== 'element') return false;
        
        let sel = selector.trim();
        if (!sel) return false;

        // Xử lý Custom Pseudo (như bản gốc của bạn)
        if (sel.indexOf(':content(') !== -1) {
            const contentMatch = sel.match(/:content\((?:["']?)(.*?)(?:["']?)\)/);
            if (contentMatch) {
                const keywords = contentMatch[1].split('|');
                const nodeText = renderText([node]);
                if (!keywords.some(k => nodeText.indexOf(k.trim()) !== -1)) return false;
                sel = sel.replace(/:content\([^)]+\)/, "");
            }
        }

        let isNot = false;
        if (sel.indexOf(':not(') !== -1) {
            const notMatch = sel.match(/:not\((.*?)\)/);
            if (notMatch) {
                isNot = true;
                if (matchNode(node, notMatch[1])) return false;
                sel = sel.replace(/:not\([^)]+\)/, "");
            }
        }
        sel = sel.replace(/:first|:last/g, ""); // First/last xử lý sau

        if (!sel) return true; // Chỉ có pseudo

        // Tách tag, id, class, attr
        const tagMatch = sel.match(/^([a-zA-Z0-9_-]+)/);
        const tag = tagMatch ? tagMatch[1].toLowerCase() : null;
        const idMatch = sel.match(/#([a-zA-Z0-9_-]+)/);
        const id = idMatch ? idMatch[1] : null;
        const classMatches = [...sel.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
        const attrMatch = sel.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)?\s*(?:["']?)(.*?)(?:["']?)\]/);

        // Kiểm tra
        if (tag && node.tagName !== tag) return false;
        if (id && node.attributes['id'] !== id) return false;
        if (classMatches.length > 0) {
            const nodeClasses = (node.attributes['class'] || "").split(/\s+/);
            for (let c of classMatches) {
                if (nodeClasses.indexOf(c) === -1) return false;
            }
        }
        if (attrMatch) {
            const [_, attrName, operator, attrVal] = attrMatch;
            const nodeAttr = node.attributes[attrName];
            if (nodeAttr === undefined) return false;
            if (operator === "=" && nodeAttr !== attrVal) return false;
            if (operator === "*=" && nodeAttr.indexOf(attrVal) === -1) return false;
            if (operator === "^=" && !nodeAttr.startsWith(attrVal)) return false;
            if (operator === "$=" && !nodeAttr.endsWith(attrVal)) return false;
        }

        return true;
    }

    function walkDOM(nodes, callback) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.type === 'element') {
                callback(node);
                if (node.children) walkDOM(node.children, callback);
            }
        }
    }

    function renderHTML(nodes) {
        let html = '';
        for (let node of nodes) {
            if (node.type === 'text') {
                html += node.content;
            } else if (node.type === 'element') {
                html += `<${node.tagName}`;
                for (let key in node.attributes) {
                    html += node.attributes[key] ? ` ${key}="${node.attributes[key]}"` : ` ${key}`;
                }
                if (selfClosingTags.indexOf(node.tagName) !== -1) {
                    html += ` />`;
                } else {
                    html += `>${renderHTML(node.children)}</${node.tagName}>`;
                }
            }
        }
        return html;
    }

    function renderText(nodes, separator = "") {
        let textArr = [];
        for (let node of nodes) {
            if (node.type === 'text') {
                textArr.push(node.content.trim());
            } else if (node.type === 'element') {
                const childText = renderText(node.children, separator);
                if (childText) textArr.push(childText);
            }
        }
        return textArr.filter(t => t !== '').join(separator || ' ');
    }

    // ----------------------------------------------------------------------
    // 3. MAIN API
    // ----------------------------------------------------------------------
    
    // Khởi tạo đầu vào (chỉ Parse 1 lần duy nhất nếu là string)
    let elements = [];
    let rootNodes = [];
    if (typeof htmlOrNodes === 'string') {
        rootNodes = parseHTML(htmlOrNodes);
        elements = rootNodes.filter(n => n.type === 'element');
    } else if (Array.isArray(htmlOrNodes)) {
        elements = htmlOrNodes.filter(n => n.type === 'element');
        rootNodes = elements;
    } else if (htmlOrNodes && htmlOrNodes.type === 'element') {
        elements = [htmlOrNodes];
        rootNodes = elements;
    }

    const instance = {
        elements: elements,
        length: elements.length,

        find: function(selector) {
            if (selector.indexOf(',') !== -1) {
                const selectors = selector.split(',').map(s => s.trim());
                let allResults = [];
                selectors.forEach(sel => {
                    allResults = allResults.concat(this.find(sel).elements);
                });
                // Remove duplicates
                return _$([...new Set(allResults)]);
            }

            const results = [];
            walkDOM(this.elements, (node) => {
                if (matchNode(node, selector)) {
                    results.push(node);
                }
            });

            if (selector.indexOf(':first') !== -1 && results.length > 0) return _$([results[0]]);
            if (selector.indexOf(':last') !== -1 && results.length > 0) return _$([results[results.length - 1]]);

            return _$(results);
        },

        each: function(callback) {
            for (let i = 0; i < this.elements.length; i++) {
                callback.call(_$([this.elements[i]]), i, this.elements[i]);
            }
            return this;
        },

        eq: function(index) {
            if (index < 0) index = this.elements.length + index;
            return _$(this.elements[index] ? [this.elements[index]] : []);
        },

        attr: function(attrName) {
            if (this.elements.length === 0) return "";
            return this.elements[0].attributes[attrName.toLowerCase()] || "";
        },

        html: function() {
            if (this.elements.length === 0) return "";
            return renderHTML(this.elements[0].children); // innerHTML
        },

        outerHtml: function() {
            if (this.elements.length === 0) return "";
            return renderHTML([this.elements[0]]);
        },

        text: function(separator = " ") {
            if (this.elements.length === 0) return "";
            return renderText(this.elements[0].children, separator);
        },

        textAll: function(separator = " ") {
            return renderText(this.elements, separator);
        },

        next: function() {
            const results = [];
            for (let i = 0; i < this.elements.length; i++) {
                const node = this.elements[i];
                if (node.parent) {
                    const siblings = node.parent.children;
                    const index = siblings.indexOf(node);
                    // Tìm node kế tiếp là element (bỏ qua text)
                    for (let j = index + 1; j < siblings.length; j++) {
                        if (siblings[j].type === 'element') {
                            if (results.indexOf(siblings[j]) === -1) results.push(siblings[j]);
                            break;
                        }
                    }
                }
            }
            return _$(results);
        },

        parent: function() {
            const results = [];
            for (let i = 0; i < this.elements.length; i++) {
                const p = this.elements[i].parent;
                if (p && p.type === 'element' && results.indexOf(p) === -1) {
                    results.push(p);
                }
            }
            return _$(results);
        },

        closest: function(selector) {
            const results = [];
            for (let i = 0; i < this.elements.length; i++) {
                let current = this.elements[i];
                while (current && current.type === 'element') {
                    if (matchNode(current, selector)) {
                        if (results.indexOf(current) === -1) results.push(current);
                        break;
                    }
                    current = current.parent;
                }
            }
            return _$(results);
        }
    };

    let elements = [];
    let rootNodes = [];

    if (typeof htmlOrNodes === 'string') {
        // KIỂM TRA BỘ NHỚ ĐỆM Ở ĐÂY!
        if (_$._cache[htmlOrNodes]) {
            // Nếu chuỗi này đã từng được parse -> Lấy luôn cây Object từ Cache ra xài
            rootNodes = _$._cache[htmlOrNodes];
        } else {
            // Nếu đây là lần đầu tiên -> Phân tích và lưu vào Cache cho lần sau
            rootNodes = parseHTML(htmlOrNodes);
            _$._cache[htmlOrNodes] = rootNodes; 
        }
        elements = rootNodes.filter(n => n.type === 'element');
    } else if (Array.isArray(htmlOrNodes)) {
        elements = htmlOrNodes.filter(n => n.type === 'element');
        rootNodes = elements;
    } else if (htmlOrNodes && htmlOrNodes.type === 'element') {
        elements = [htmlOrNodes];
        rootNodes = elements;
    }

    // Khởi tạo Instance (Object trả về vẫn đóng vai trò là một Array-like)
    const instance = {
        elements: elements,
        length: elements.length,

        // ... [GIỮ NGUYÊN TOÀN BỘ CÁC HÀM CỦA BẠN NHƯ find, each, attr, text...] ...
    };

    return instance;
}