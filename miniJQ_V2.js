// Global scope definition
// "version": "1.5"
if (typeof window === 'undefined') {
    var window = this;
}

window.BASE64DECODE function(base64String) {
    try {
        if (!base64String) return "";

        // 1. Dọn dẹp chuỗi & xử lý nếu App tự động mã hóa URL (ví dụ: %2B, %2F)
        var str = decodeURIComponent(base64String.trim());
        
        // Chuyển URL-safe base64 về base64 chuẩn
        str = str.replace(/-/g, '+').replace(/_/g, '/');

        // Bảng ký tự Base64
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var output = [];
        var buffer = 0, bits = 0;

        // 2. Decode Base64 thành Mảng Byte (Uint8Array)
        for (var i = 0; i < str.length; i++) {
            var char = str.charAt(i);
            if (char === '=') break; // Bỏ qua padding
            var index = chars.indexOf(char);
            if (index === -1) continue; // Bỏ qua ký tự không hợp lệ

            buffer = (buffer << 6) | index;
            bits += 6;

            if (bits >= 8) {
                bits -= 8;
                output.push((buffer >> bits) & 0xFF);
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
                result += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            } else if (c >= 240) {
                var c2 = output[j++];
                var c3 = output[j++];
                var c4 = output[j++];
                var u = (((c & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) - 0x10000;
                result += String.fromCharCode(0xD800 + (u >> 10), 0xDC00 + (u & 0x3FF));
            }
        }

        return result;

    } catch (e) {
        console.log("[BASE64DECODE Error]:", e.message || e);
        return "";
    }
}
window.BASE64ENCODE function(str) {
    try {
        if (!str) return "";

        // 1. Encode String ra mảng UTF-8 Bytes trước
        var utf8Bytes = [];
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i);
            if (code < 128) {
                utf8Bytes.push(code);
            } else if (code < 2048) {
                utf8Bytes.push((code >> 6) | 192, (code & 63) | 128);
            } else if ((code & 0xFC00) === 0xD800 && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
                // Ký tự Surrogate Pair
                code = 0x10000 + ((code & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
                utf8Bytes.push((code >> 18) | 240, ((code >> 12) & 63) | 128, ((code >> 6) & 63) | 128, (code & 63) | 128);
            } else {
                utf8Bytes.push((code >> 12) | 224, ((code >> 6) & 63) | 128, (code & 63) | 128);
            }
        }

        // 2. Chuyển mảng UTF-8 Bytes thành chuỗi Base64
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var encoded = '';
        var byte1, byte2, byte3;
        var b1, b2, b3, b4;

        for (var j = 0; j < utf8Bytes.length; j += 3) {
            byte1 = utf8Bytes[j];
            byte2 = j + 1 < utf8Bytes.length ? utf8Bytes[j + 1] : NaN;
            byte3 = j + 2 < utf8Bytes.length ? utf8Bytes[j + 2] : NaN;

            b1 = byte1 >> 2;
            b2 = ((byte1 & 3) << 4) | (isNaN(byte2) ? 0 : byte2 >> 4);
            b3 = isNaN(byte2) ? 64 : ((byte2 & 15) << 2) | (isNaN(byte3) ? 0 : byte3 >> 6);
            b4 = isNaN(byte3) ? 64 : byte3 & 63;

            encoded += chars.charAt(b1) + chars.charAt(b2) + chars.charAt(b3) + chars.charAt(b4);
        }

        return encoded;
    } catch (e) {
        console.log("[BASE64ENCODE Error]:", e.message || e);
        return "";
    }
}

window.BASEURL = typeof window.location !== 'undefined' ? window.location.origin : '';
window.log = function(msg) {
    try {
        if (typeof nativeLog !== 'undefined') nativeLog(msg);
        else if (typeof console !== 'undefined' && console.log) console.log(msg);
    } catch(e) {}
};

// --- 1. PARSER HTML TỐI ƯU ---
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
        window.log("parseHTML error: " + err.message);
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

// --- 2. MATCH SINGLE SELECTOR (ĐÃ HỖ TRỢ DẤU XƯỢC TAILWIND CSS) ---
// --- MATCH SINGLE SELECTOR ĐÃ KHẮC PHỤC HOÀN TOÀN ---
function matchSingleSelector(node, sel, nodes) {
    if (!node || node.tag === "#text" || node.tag === "ROOT") return false;

    let cleanSel = sel;
    
    // 1. Tách pseudo positional (:first, :last, :eq) ra trước để không làm hỏng class
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

        // Bóc tách Class đúng chuẩn cả ký tự / \ : [ ]
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

// --- QUERY ENGINE XỬ LÝ VI TÍCH VỊ TRÍ (:first, :last, :eq) ---
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

    // Lọc danh sách theo :first, :last, :eq trên danh sách kết quả thực tế
    if (selector.indexOf(":first") !== -1) {
        return results.slice(0, 1);
    }
    if (selector.indexOf(":last") !== -1) {
        return results.slice(-1);
    }
    let eqMatch = selector.match(/:eq\(([0-9]+)\)/i);
    if (eqMatch) {
        let idx = parseInt(eqMatch[1], 10);
        return results[idx] ? [results[idx]] : [];
    }

    return results;
}

// --- 3. QUERY ENGINE DỮ LIỆU CÓ HỖ TRỢ TÌM THEO DẤU CÁCH ("tr .class") ---
function querySelectorAll(startNode, selector, nodes) {
    try {
        if (!startNode || !selector) return [];

        // Nếu có dấu phẩy (mẫu selector nhóm)
        if (selector.indexOf(',') !== -1) {
            let groupSelectors = selector.split(',').map(s => s.trim());
            let resMap = new Map();
            for (let gSel of groupSelectors) {
                let subRes = querySelectorAll(startNode, gSel, nodes);
                for (let r of subRes) resMap.set(r.id, r);
            }
            return Array.from(resMap.values());
        }

        // Nếu có dấu cách (Mẫu selector phân cấp: "tr .class1")
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



// --- 4. WRAPPER MINIJQ ---
var MiniJQ = function(elements, nodesStore) {
    this.elements = Array.isArray(elements) ? elements : (elements ? [elements] : []);
    this.nodes = nodesStore || [];
    this.length = this.elements.length;
};

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

window._$ = function (param) {
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
};