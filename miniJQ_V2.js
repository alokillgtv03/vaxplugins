// Global scope definition
// "version": "1.1"
if (typeof window === 'undefined') {
    var window = this;
}

window.BASEURL = typeof window.location !== 'undefined' ? window.location.origin : '';
window.log = function(msg) {
    try {
        if (typeof nativeLog !== 'undefined') {
            nativeLog("[motchille] " + msg);
        } else if (typeof console !== 'undefined' && console.log) {
            console.log("[motchille] " + msg);
        }
    } catch(e) {}
};

// --- 1. PARSER HTML ĐƠN GIẢN THÀNH OBJECT TREE ---
function parseHTML(htmlString) {
    let root = { tag: "ROOT", attrs: {}, children: [], text: "" };
    try {
        let html = (htmlString || "").trim();
        if (!html) return root;

        let stack = [root];
        let i = 0;
        
        while (i < html.length) {
            let tagStart = html.indexOf("<", i);
            if (tagStart === -1) {
                let text = html.slice(i).trim();
                if (text && stack.length > 0) {
                    stack[stack.length - 1].children.push({ tag: "#text", text: text, attrs: {}, children: [] });
                }
                break;
            }

            if (tagStart > i) {
                let text = html.slice(i, tagStart).trim();
                if (text && stack.length > 0) {
                    stack[stack.length - 1].children.push({ tag: "#text", text: text, attrs: {}, children: [] });
                }
            }

            let tagEnd = html.indexOf(">", tagStart);
            if (tagEnd === -1) break;

            let tagContent = html.slice(tagStart + 1, tagEnd).trim();
            i = tagEnd + 1;

            if (tagContent.startsWith("/")) {
                if (stack.length > 1) stack.pop();
            } else if (tagContent.startsWith("!")) {
                continue;
            } else {
                let isSelfClosing = tagContent.endsWith("/");
                if (isSelfClosing) tagContent = tagContent.slice(0, -1).trim();

                let spaceIndex = tagContent.indexOf(" ");
                let tagName = spaceIndex === -1 ? tagContent : tagContent.slice(0, spaceIndex);
                let attrStr = spaceIndex === -1 ? "" : tagContent.slice(spaceIndex + 1);

                let attrs = {};
                let attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
                let match;
                while ((match = attrRegex.exec(attrStr)) !== null) {
                    attrs[match[1].toLowerCase()] = match[2] || match[3] || match[4] || "";
                }

                let node = {
                    tag: tagName.toLowerCase(),
                    attrs: attrs,
                    children: [],
                    text: "",
                    parent: stack[stack.length - 1]
                };

                stack[stack.length - 1].children.push(node);

                if (!isSelfClosing) {
                    stack.push(node);
                }
            }
        }
    } catch (err) {
        window.log("parseHTML error: " + err.message);
    }
    return root;
}

// --- 2. HỆ THỐNG SELECTOR & QUERY ENGINE ---
function querySelectorAll(node, selector) {
    try {
        if (!node || !selector) return [];
        let results = [];
        let selectors = selector.split(',').map(s => s.trim());

        function matchSelector(el, sel) {
            if (!el || el.tag === "#text") return false;

            let pseudoMatch = sel.match(/:([a-zA-Z]+)(?:\((['"]?)(.*?)\2\))?/);
            let cleanSel = sel;
            let pseudoType = null;
            let pseudoArg = null;

            if (pseudoMatch) {
                pseudoType = pseudoMatch[1];
                pseudoArg = pseudoMatch[3];
                cleanSel = sel.slice(0, pseudoMatch.index).trim();
            }

            if (cleanSel && cleanSel !== "*") {
                let tag = cleanSel.match(/^[a-zA-Z0-9_-]+/);
                let id = cleanSel.match(/#([a-zA-Z0-9_-]+)/);
                let cls = cleanSel.match(/\.([a-zA-Z0-9_-]+)/);
                let attr = cleanSel.match(/\[([a-zA-Z0-9_-]+)(?:=['"](.*?)['"])?\]/);

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

            if (pseudoType) {
                let fullText = getElementText(el);
                if (pseudoType === "content") {
                    let keywords = (pseudoArg || "").split("|").map(k => k.trim());
                    let found = keywords.some(kw => fullText.includes(kw));
                    if (!found) return false;
                }
            }

            return true;
        }

        function traverse(current) {
            if (!current) return;
            if (current.tag !== "ROOT") {
                for (let sel of selectors) {
                    if (matchSelector(current, sel)) {
                        results.push(current);
                        break;
                    }
                }
            }
            if (current.children) {
                for (let child of current.children) {
                    traverse(child);
                }
            }
        }

        traverse(node);

        for (let sel of selectors) {
            let m = sel.match(/:([a-z]+)(?:\(([0-9]+)\))?/);
            if (m) {
                let type = m[1];
                let idx = m[2] ? parseInt(m[2], 10) : 0;
                if (type === "first") results = results.slice(0, 1);
                if (type === "last") results = results.slice(-1);
                if (type === "eq") results = results[idx] ? [results[idx]] : [];
            }
        }

        return results;
    } catch (err) {
        window.log("querySelectorAll error: " + err.message);
        return [];
    }
}

function getElementText(el) {
    try {
        if (!el) return "";
        if (el.tag === "#text") return el.text || "";
        let text = "";
        if (el.children) {
            for (let child of el.children) {
                text += getElementText(child) + " ";
            }
        }
        return text.trim();
    } catch(e) {
        return "";
    }
}

// --- 3. WRAPPER MINI-JQ CLASS (Dùng prototype để tránh tái khai báo class trong QuickJS) ---
var MiniJQ = function(elements) {
    try {
        if (!elements) {
            this.elements = [];
        } else if (elements instanceof MiniJQ) {
            this.elements = elements.elements;
        } else if (Array.isArray(elements)) {
            this.elements = elements;
        } else {
            this.elements = [elements];
        }
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
            window.log("find error: " + err.message);
            return new MiniJQ([]);
        }
    },

    text: function() {
        try {
            if (this.elements.length === 0) return "";
            return getElementText(this.elements[0]);
        } catch (err) {
            window.log("text error: " + err.message);
            return "";
        }
    },

    html: function() {
        try {
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
        } catch (err) {
            window.log("html error: " + err.message);
            return "";
        }
    },

    attr: function(name, value) {
        try {
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
        } catch (err) {
            window.log("attr error: " + err.message);
            return "";
        }
    },

    each: function(callback) {
        try {
            if (typeof callback !== 'function') return this;
            this.elements.forEach((el, index) => {
                let jqEl = new MiniJQ(el);
                callback.call(jqEl, index, jqEl);
            });
        } catch (err) {
            window.log("each error: " + err.message);
        }
        return this;
    },

    textAll: function(delimiter) {
        if (delimiter === undefined) delimiter = " ";
        try {
            let texts = [];
            for (let el of this.elements) {
                texts.push(getElementText(el));
            }
            return texts.join(delimiter);
        } catch (err) {
            window.log("textAll error: " + err.message);
            return "";
        }
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
        try {
            let parents = [];
            for (let el of this.elements) {
                if (el && el.parent && el.parent.tag !== "ROOT") {
                    parents.push(el.parent);
                }
            }
            return new MiniJQ(parents);
        } catch (err) {
            return new MiniJQ([]);
        }
    },

    next: function() {
        try {
            let nexts = [];
            for (let el of this.elements) {
                if (!el || !el.parent) continue;
                let siblings = el.parent.children || [];
                let idx = siblings.indexOf(el);
                if (idx !== -1 && idx + 1 < siblings.length) {
                    nexts.push(siblings[idx + 1]);
                }
            }
            return new MiniJQ(nexts);
        } catch (err) {
            return new MiniJQ([]);
        }
    },

    before: function() {
        try {
            let befores = [];
            for (let el of this.elements) {
                if (!el || !el.parent) continue;
                let siblings = el.parent.children || [];
                let idx = siblings.indexOf(el);
                if (idx > 0) {
                    befores.push(siblings[idx - 1]);
                }
            }
            return new MiniJQ(befores);
        } catch (err) {
            return new MiniJQ([]);
        }
    },

    after: function() {
        return this.next();
    },

    closest: function(selector) {
        try {
            let matched = [];
            for (let el of this.elements) {
                if (!el) continue;
                let curr = el.parent;
                while (curr && curr.tag !== "ROOT") {
                    let tempJQ = new MiniJQ([curr]);
                    let res = tempJQ.find(selector);
                    if (res.elements.length > 0) {
                        matched.push(curr);
                        break;
                    }
                    curr = curr.parent;
                }
            }
            return new MiniJQ(matched);
        } catch (err) {
            return new MiniJQ([]);
        }
    }
};

// Hàm khởi tạo chính _$
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
        window.log("_$ init error: " + err.message);
        return new MiniJQ([]);
    }
};