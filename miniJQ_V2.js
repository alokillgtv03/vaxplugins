// Global scope definition
// "version": "1.3"
if (typeof window === 'undefined') {
    var window = this;
}

window.BASEURL = typeof window.location !== 'undefined' ? window.location.origin : '';
window.log = function(msg) {
    try {
        if (typeof nativeLog !== 'undefined') nativeLog("[motchille] " + msg);
        else if (typeof console !== 'undefined' && console.log) console.log("[motchille] " + msg);
    } catch(e) {}
};

// --- 1. PARSER HTML TỐI ƯU & CHỐNG TREO ---
function parseHTML(htmlString) {
    let root = { tag: "ROOT", attrs: {}, children: [], parent: null, _id: 0 };
    try {
        let html = (htmlString || "").trim();
        if (!html) return root;

        const VOID_TAGS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
        let stack = [root];
        let tagRegex = /<(?:\/([a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]+)([^>]*?)(\/)?)\s*>/g;
        
        let lastIndex = 0;
        let nodeCounter = 1;
        let match;

        // Giới hạn chống đơ khi HTML quá lớn hoặc có lỗi thẻ
        let maxIterations = 50000;
        let iter = 0;

        while ((match = tagRegex.exec(html)) !== null && iter++ < maxIterations) {
            let textBefore = html.slice(lastIndex, match.index).trim();
            let parentNode = stack[stack.length - 1];

            if (textBefore) {
                parentNode.children.push({
                    _id: nodeCounter++,
                    tag: "#text",
                    text: textBefore,
                    parent: parentNode,
                    children: [],
                    attrs: {}
                });
            }

            lastIndex = tagRegex.lastIndex;
            let isCloseTag = !!match[1];
            let tagName = (match[1] || match[2] || "").toLowerCase();
            let attrStr = match[3] || "";
            let isSelfClosing = !!match[4] || VOID_TAGS.has(tagName);

            if (isCloseTag) {
                for (let i = stack.length - 1; i > 0; i--) {
                    if (stack[i].tag === tagName) {
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

                let node = {
                    _id: nodeCounter++,
                    tag: tagName,
                    attrs: attrs,
                    children: [],
                    parent: parentNode
                };
                parentNode.children.push(node);

                if (!isSelfClosing) {
                    stack.push(node);
                }
            }
        }

        let remainingText = html.slice(lastIndex).trim();
        if (remainingText && stack.length > 0) {
            stack[stack.length - 1].children.push({
                _id: nodeCounter++,
                tag: "#text",
                text: remainingText,
                parent: stack[stack.length - 1],
                children: [],
                attrs: {}
            });
        }
    } catch (err) {
        window.log("parseHTML error: " + err.message);
    }
    return root;
}

function getElementText(el, depth) {
    if (!el || (depth || 0) > 30) return "";
    if (el.tag === "#text") return el.text || "";
    let text = "";
    if (el.children) {
        for (let i = 0; i < el.children.length; i++) {
            text += getElementText(el.children[i], (depth || 0) + 1) + " ";
        }
    }
    return text.trim();
}

// --- 2. SELECTOR ENGINE CHÍNH XÁC ---
function matchSingleSelector(el, sel) {
    if (!el || el.tag === "#text" || el.tag === "ROOT") return false;

    // Tách pseudo-class như :content(...)
    let pseudoType = null;
    let pseudoArg = null;
    let cleanSel = sel;

    let pseudoIdx = sel.indexOf(":");
    if (pseudoIdx !== -1) {
        cleanSel = sel.substring(0, pseudoIdx).trim();
        let pseudoStr = sel.substring(pseudoIdx);
        let m = pseudoStr.match(/^:([a-zA-Z]+)(?:\((['"]?)(.*?)\2\))?/);
        if (m) {
            pseudoType = m[1].toLowerCase();
            pseudoArg = m[3];
        }
    }

    // Checking phần selector cơ bản (tag, .class, #id, [attr])
    if (cleanSel && cleanSel !== "*") {
        let tagMatch = cleanSel.match(/^[a-zA-Z0-9_-]+/);
        if (tagMatch && el.tag !== tagMatch[0].toLowerCase()) return false;

        let idMatch = cleanSel.match(/#([a-zA-Z0-9_-]+)/);
        if (idMatch && (!el.attrs || el.attrs.id !== idMatch[1])) return false;

        let classMatches = cleanSel.match(/\.([a-zA-Z0-9_-]+)/g);
        if (classMatches) {
            if (!el.attrs || !el.attrs.class) return false;
            let elClasses = el.attrs.class.split(/\s+/);
            for (let c of classMatches) {
                let className = c.substring(1);
                if (!elClasses.includes(className)) return false;
            }
        }

        let attrMatch = cleanSel.match(/\[([a-zA-Z0-9_-]+)(?:=['"]?(.*?)['"]?)?\]/);
        if (attrMatch) {
            let attrName = attrMatch[1].toLowerCase();
            let attrVal = attrMatch[2];
            if (!el.attrs || !(attrName in el.attrs)) return false;
            if (attrVal !== undefined && el.attrs[attrName] !== attrVal) return false;
        }
    }

    // Checking Pseudo: content
    if (pseudoType === "content") {
        let fullText = getElementText(el);
        let keywords = (pseudoArg || "").split("|").map(k => k.trim().toLowerCase());
        let found = keywords.some(kw => fullText.toLowerCase().includes(kw));
        if (!found) return false;
    }

    return true;
}

function querySelectorAll(node, selector) {
    try {
        if (!node || !selector) return [];
        let groupSelectors = selector.split(',').map(s => s.trim());
        let results = [];

        function search(current, depth) {
            if (!current || depth > 100) return;
            if (current.tag !== "ROOT" && current.tag !== "#text") {
                for (let sel of groupSelectors) {
                    if (matchSingleSelector(current, sel)) {
                        results.push(current);
                        break;
                    }
                }
            }
            if (current.children) {
                for (let i = 0; i < current.children.length; i++) {
                    search(current.children[i], depth + 1);
                }
            }
        }

        search(node, 0);

        // Filter vị trí (:first, :last, :eq)
        for (let sel of groupSelectors) {
            let m = sel.match(/:([a-z]+)(?:\(([0-9]+)\))?/);
            if (m) {
                let type = m[1].toLowerCase();
                let idx = m[2] ? parseInt(m[2], 10) : 0;
                if (type === "first") return results.slice(0, 1);
                if (type === "last") return results.slice(-1);
                if (type === "eq") return results[idx] ? [results[idx]] : [];
            }
        }

        return results;
    } catch (err) {
        window.log("querySelectorAll error: " + err.message);
        return [];
    }
}

// --- 3. WRAPPER MINIJQ AN TOÀN TRUYỀN DỮ LIỆU ---
var MiniJQ = function(elements) {
    try {
        if (!elements) this.elements = [];
        else if (elements instanceof MiniJQ) this.elements = elements.elements;
        else if (Array.isArray(elements)) this.elements = elements;
        else this.elements = [elements];
    } catch (e) {
        this.elements = [];
    }
    this.length = this.elements.length;
};

MiniJQ.prototype = {
    find: function(selector) {
        try {
            if (this.elements.length === 0) return new MiniJQ([]);
            let matched = [];
            for (let el of this.elements) {
                let res = querySelectorAll(el, selector);
                matched.push(...res);
            }
            return new MiniJQ(matched);
        } catch (err) {
            return new MiniJQ([]);
        }
    },

    text: function() {
        if (this.elements.length === 0) return "";
        return getElementText(this.elements[0]);
    },

    html: function() {
        if (this.elements.length === 0) return "";
        let el = this.elements[0];
        let serialize = function(node, depth) {
            if (!node || depth > 30) return "";
            if (node.tag === "#text") return node.text || "";
            let attrs = Object.entries(node.attrs || {}).map(([k, v]) => ` ${k}="${v}"`).join("");
            let childrenHTML = (node.children || []).map(child => serialize(child, depth + 1)).join("");
            return `<${node.tag}${attrs}>${childrenHTML}</${node.tag}>`;
        };
        return (el.children || []).map(child => serialize(child, 0)).join("");
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
            let jqEl = new MiniJQ(el);
            callback.call(jqEl, index, jqEl);
        });
        return this;
    },

    textAll: function(delimiter) {
        if (delimiter === undefined) delimiter = " ";
        let texts = [];
        for (let el of this.elements) {
            texts.push(getElementText(el));
        }
        return texts.join(delimiter);
    },

    first: function() {
        return new MiniJQ(this.elements.length > 0 ? [this.elements[0]] : []);
    },

    last: function() {
        return new MiniJQ(this.elements.length > 0 ? [this.elements[this.elements.length - 1]] : []);
    },

    eq: function(index) {
        return new MiniJQ(this.elements[index] ? [this.elements[index]] : []);
    },

    parent: function() {
        let parents = [];
        let addedIds = new Set();
        for (let el of this.elements) {
            if (el && el.parent && el.parent.tag !== "ROOT") {
                if (!addedIds.has(el.parent._id)) {
                    addedIds.add(el.parent._id);
                    parents.push(el.parent);
                }
            }
        }
        return new MiniJQ(parents);
    },

    next: function() {
        let nexts = [];
        for (let el of this.elements) {
            if (!el || !el.parent) continue;
            // Chỉ lọc các phần tử HTML thực sự, không lấy #text
            let siblings = el.parent.children.filter(c => c.tag !== "#text");
            // Dùng ID để tìm chính xác chỉ mục (tránh lỗi tham chiếu Object trong QuickJS)
            let idx = siblings.findIndex(s => s._id === el._id);
            if (idx !== -1 && idx + 1 < siblings.length) {
                nexts.push(siblings[idx + 1]);
            }
        }
        return new MiniJQ(nexts);
    },

    before: function() {
        let befores = [];
        for (let el of this.elements) {
            if (!el || !el.parent) continue;
            let siblings = el.parent.children.filter(c => c.tag !== "#text");
            let idx = siblings.findIndex(s => s._id === el._id);
            if (idx > 0) {
                befores.push(siblings[idx - 1]);
            }
        }
        return new MiniJQ(befores);
    },

    after: function() {
        return this.next();
    },

    closest: function(selector) {
        let matched = [];
        let addedIds = new Set();
        for (let el of this.elements) {
            let curr = el.parent;
            let depth = 0;
            while (curr && curr.tag !== "ROOT" && depth++ < 50) {
                if (matchSingleSelector(curr, selector)) {
                    if (!addedIds.has(curr._id)) {
                        addedIds.add(curr._id);
                        matched.push(curr);
                    }
                    break;
                }
                curr = curr.parent;
            }
        }
        return new MiniJQ(matched);
    }
};

window._$ = function (param) {
    try {
        if (!param) return new MiniJQ([]);
        if (param instanceof MiniJQ) return param;
        if (typeof param === "string") {
            let rootObj = parseHTML(param);
            return new MiniJQ(rootObj);
        }
        return new MiniJQ(param);
    } catch (err) {
        return new MiniJQ([]);
    }
};