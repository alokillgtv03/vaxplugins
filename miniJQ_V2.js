// Global scope definition
// "version": "1.2"
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

// --- 1. PARSER HTML CHUẨN XÁC VỚI VOID TAGS ---
function parseHTML(htmlString) {
    let root = { tag: "ROOT", attrs: {}, children: [], parent: null };
    try {
        let html = (htmlString || "").trim();
        if (!html) return root;

        // Các thẻ tự đóng chuẩn HTML
        const VOID_TAGS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
        let stack = [root];
        let tagRegex = /<(?:\/([a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]+)([^>]*?)(\/)?)\s*>/g;
        
        let lastIndex = 0;
        let match;

        while ((match = tagRegex.exec(html)) !== null) {
            let textBefore = html.slice(lastIndex, match.index).trim();
            let parentNode = stack[stack.length - 1];

            if (textBefore) {
                parentNode.children.push({ tag: "#text", text: textBefore, parent: parentNode, children: [], attrs: {} });
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

                let node = { tag: tagName, attrs: attrs, children: [], parent: parentNode };
                parentNode.children.push(node);

                if (!isSelfClosing) {
                    stack.push(node);
                }
            }
        }

        let remainingText = html.slice(lastIndex).trim();
        if (remainingText && stack.length > 0) {
            stack[stack.length - 1].children.push({ tag: "#text", text: remainingText, parent: stack[stack.length - 1], children: [], attrs: {} });
        }
    } catch (err) {
        window.log("parseHTML error: " + err.message);
    }
    return root;
}

function getElementText(el) {
    if (!el) return "";
    if (el.tag === "#text") return el.text || "";
    let text = "";
    if (el.children) {
        for (let child of el.children) {
            text += getElementText(child) + " ";
        }
    }
    return text.trim();
}

// --- 2. QUERY ENGINE MỚI ---
function matchSingleSelector(el, sel) {
    if (!el || el.tag === "#text" || el.tag === "ROOT") return false;

    // Tách pseudo selector
    let pseudoType = null;
    let pseudoArg = null;
    let cleanSel = sel;

    let pseudoMatch = sel.match(/:([a-zA-Z]+)(?:\((['"]?)(.*?)\2\))?/);
    if (pseudoMatch) {
        pseudoType = pseudoMatch[1].toLowerCase();
        pseudoArg = pseudoMatch[3];
        cleanSel = sel.slice(0, pseudoMatch.index).trim();
    }

    // Checking Selector Cơ Bản
    if (cleanSel && cleanSel !== "*") {
        let tag = cleanSel.match(/^[a-zA-Z0-9_-]+/);
        let id = cleanSel.match(/#([a-zA-Z0-9_-]+)/);
        let cls = cleanSel.match(/\.([a-zA-Z0-9_-]+)/);
        let attr = cleanSel.match(/\[([a-zA-Z0-9_-]+)(?:=['"]?(.*?)['"]?)?\]/);

        if (tag && el.tag !== tag[0].toLowerCase()) return false;
        if (id && (!el.attrs || el.attrs.id !== id[1])) return false;
        if (cls && (!el.attrs || !el.attrs.class || !el.attrs.class.split(/\s+/).includes(cls[1]))) return false;
        if (attr) {
            let attrName = attr[1].toLowerCase();
            let attrVal = attr[2];
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

        function search(current) {
            if (!current) return;
            if (current.tag !== "ROOT" && current.tag !== "#text") {
                for (let sel of groupSelectors) {
                    if (matchSingleSelector(current, sel)) {
                        results.push(current);
                        break;
                    }
                }
            }
            if (current.children) {
                for (let child of current.children) {
                    search(child);
                }
            }
        }

        search(node);

        // Xử lý pseudo vị trí trên tập kết quả (:first, :last, :eq)
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

// --- 3. WRAPPER MINIJQ ---
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
        let serialize = function(node) {
            if (!node) return "";
            if (node.tag === "#text") return node.text || "";
            let attrs = Object.entries(node.attrs || {}).map(([k, v]) => ` ${k}="${v}"`).join("");
            let childrenHTML = (node.children || []).map(serialize).join("");
            return `<${node.tag}${attrs}>${childrenHTML}</${node.tag}>`;
        };
        return (el.children || []).map(serialize).join("");
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
        for (let el of this.elements) {
            if (el && el.parent && el.parent.tag !== "ROOT") {
                if (!parents.includes(el.parent)) parents.push(el.parent);
            }
        }
        return new MiniJQ(parents);
    },

    next: function() {
        let nexts = [];
        for (let el of this.elements) {
            if (!el || !el.parent) continue;
            let siblings = el.parent.children.filter(c => c.tag !== "#text");
            let idx = siblings.indexOf(el);
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
            let idx = siblings.indexOf(el);
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
        for (let el of this.elements) {
            let curr = el.parent;
            while (curr && curr.tag !== "ROOT") {
                if (matchSingleSelector(curr, selector)) {
                    if (!matched.includes(curr)) matched.push(curr);
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