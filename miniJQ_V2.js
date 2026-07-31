// Global scope definition
// "version": "1.4"
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

// --- 1. PARSER HTML AN TOÀN (SỬ DỤNG ID THAY CHO CẤU TRÚC VÒNG PARENT) ---
function parseHTML(htmlString) {
    let nodes = [];
    let root = { id: 0, tag: "ROOT", attrs: {}, childrenIds: [], parentId: null };
    nodes.push(root);

    try {
        let html = (htmlString || "").trim();
        if (!html) return { root, nodes };

        const VOID_TAGS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
        let stack = [0]; // Lưu ID của parent
        let tagRegex = /<(?:\/([a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]+)([^>]*?)(\/)?)\s*>/g;
        
        let lastIndex = 0;
        let match;
        let maxIter = 30000;
        let iter = 0;

        while ((match = tagRegex.exec(html)) !== null && iter++ < maxIter) {
            let textBefore = html.slice(lastIndex, match.index).trim();
            let parentId = stack[stack.length - 1];

            if (textBefore) {
                let textId = nodes.length;
                let textNode = { id: textId, tag: "#text", text: textBefore, attrs: {}, childrenIds: [], parentId: parentId };
                nodes.push(textNode);
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

// --- 2. QUERY ENGINE TÁCH SELECTOR CHÍNH XÁC ---
function matchSingleSelector(node, sel, nodes) {
    if (!node || node.tag === "#text" || node.tag === "ROOT") return false;

    // Tách phần :content(...) nếu dính liền
    let cleanSel = sel;
    let pseudoContentArg = null;

    let contentMatch = sel.match(/:content\((['"]?)(.*?)\1\)/i);
    if (contentMatch) {
        pseudoContentArg = contentMatch[2];
        cleanSel = sel.replace(contentMatch[0], "").trim();
    }

    // Checking phần selector gốc (VD: td.py-2)
    if (cleanSel && cleanSel !== "*") {
        let tagMatch = cleanSel.match(/^[a-zA-Z0-9_-]+/);
        if (tagMatch && node.tag !== tagMatch[0].toLowerCase()) return false;

        let idMatch = cleanSel.match(/#([a-zA-Z0-9_-]+)/);
        if (idMatch && (!node.attrs || node.attrs.id !== idMatch[1])) return false;

        let classMatches = cleanSel.match(/\.([a-zA-Z0-9_-]+)/g);
        if (classMatches) {
            if (!node.attrs || !node.attrs.class) return false;
            let elClasses = node.attrs.class.split(/\s+/);
            for (let c of classMatches) {
                if (!elClasses.includes(c.substring(1))) return false;
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

    // Checking nội dung :content
    if (pseudoContentArg !== null) {
        let fullText = getNodeText(node, nodes, 0);
        let keywords = pseudoContentArg.split("|").map(k => k.trim().toLowerCase());
        let found = keywords.some(kw => fullText.toLowerCase().includes(kw));
        if (!found) return false;
    }

    return true;
}

function querySelectorAll(startNode, selector, nodes) {
    try {
        if (!startNode || !selector) return [];
        let groupSelectors = selector.split(',').map(s => s.trim());
        let results = [];

        function search(currentId, depth) {
            if (depth > 50) return;
            let current = nodes[currentId];
            if (!current) return;

            if (current.tag !== "ROOT" && current.tag !== "#text") {
                for (let sel of groupSelectors) {
                    if (matchSingleSelector(current, sel, nodes)) {
                        results.push(current);
                        break;
                    }
                }
            }
            if (current.childrenIds) {
                for (let cid of current.childrenIds) {
                    search(cid, depth + 1);
                }
            }
        }

        search(startNode.id, 0);

        // Filter vị trí (:first, :last, :eq)
        for (let sel of groupSelectors) {
            let m = sel.match(/:([a-z]+)(?:\(([0-9]+)\))?/i);
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
        return [];
    }
}

// --- 3. WRAPPER MINIJQ AN TOÀN TRUYỀN DỮ LIỆU ---
var MiniJQ = function(elements, nodesStore) {
    this.elements = Array.isArray(elements) ? elements : (elements ? [elements] : []);
    this.nodes = nodesStore || [];
    this.length = this.elements.length;
};

MiniJQ.prototype = {
    find: function(selector) {
        if (this.elements.length === 0) return new MiniJQ([], this.nodes);
        let matched = [];
        for (let el of this.elements) {
            let res = querySelectorAll(el, selector, this.nodes);
            matched.push(...res);
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