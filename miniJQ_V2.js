// Hàm khởi tạo chính _$
// "version": "2.4" - Fixed Nested Tags Parsing
window.BASEURL = window.location.origin;
window.log = function(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[motchille] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[motchille] " + msg);
    }
}

// --- 1. PARSER HTML ĐƠN GIẢN THÀNH OBJECT TREE ---
function parseHTML(htmlString) {
    // Làm sạch cơ bản
    let html = htmlString.trim();
    let root = { tag: "ROOT", attrs: {}, children: [], text: "" };
    let stack = [root];
    
    let i = 0;
    while (i < html.length) {
        let tagStart = html.indexOf("<", i);
        if (tagStart === -1) {
            // Chỉ còn text cuối
            let text = html.slice(i).trim();
            if (text && stack.length > 0) {
                stack[stack.length - 1].children.push({ tag: "#text", text: text, attrs: {}, children: [] });
            }
            break;
        }

        // Thêm text trước thẻ (nếu có)
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
            // Thẻ đóng
            if (stack.length > 1) stack.pop();
        } else if (tagContent.startsWith("!")) {
            // Comment hoặc Doctype, bỏ qua
            continue;
        } else {
            // Thẻ mở hoặc tự đóng
            let isSelfClosing = tagContent.endsWith("/");
            if (isSelfClosing) tagContent = tagContent.slice(0, -1).trim();

            let spaceIndex = tagContent.indexOf(" ");
            let tagName = spaceIndex === -1 ? tagContent : tagContent.slice(0, spaceIndex);
            let attrStr = spaceIndex === -1 ? "" : tagContent.slice(spaceIndex + 1);

            let attrs = {};
            // Parse attributes đơn giản
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
                parent: stack[stack.length - 1] // Gắn con trỏ parent để phục vụ hàm parent()
            };

            stack[stack.length - 1].children.push(node);

            if (!isSelfClosing) {
                stack.push(node);
            }
        }
    }
    return root;
}


// --- 2. HỆ THỐNG SELECTOR & QUERY ENGINE ---
function querySelectorAll(node, selector) {
    let results = [];
    
    // Tách các selector ngăn cách bởi dấu phẩy (vd: 'div, a')
    let selectors = selector.split(',').map(s => s.trim());

    function matchSelector(el, sel) {
        if (el.tag === "#text") return false;

        // Xử lý các pseudo-class mở rộng (:content, :first, :last, :eq)
        let pseudoMatch = sel.match(/:([a-zA-Z]+)(?:\((['"]?)(.*?)\2\))?/);
        let cleanSel = sel;
        let pseudoType = null;
        let pseudoArg = null;

        if (pseudoMatch) {
            pseudoType = pseudoMatch[1];
            pseudoArg = pseudoMatch[3];
            cleanSel = sel.slice(0, pseudoMatch.index).trim();
        }

        // Kiểm tra cơ bản tag, class, id, attr
        if (cleanSel && cleanSel !== "*") {
            // Phân tích cú pháp selector đơn giản: tag, .class, #id, [attr=val]
            let tag = cleanSel.match(/^[a-zA-Z0-9_-]+/);
            let id = cleanSel.match(/#([a-zA-Z0-9_-]+)/);
            let cls = cleanSel.match(/\.([a-zA-Z0-9_-]+)/);
            let attr = cleanSel.match(/\[([a-zA-Z0-9_-]+)(?:=['"](.*?)['"])?\]/);

            if (tag && el.tag !== tag[0].toLowerCase()) return false;
            if (id && el.attrs.id !== id[1]) return false;
            if (cls && (!el.attrs.class || !el.attrs.class.split(/\s+/).includes(cls[1]))) return false;
            if (attr) {
                let attrName = attr[1].toLowerCase();
                let attrVal = attr[2];
                if (!(attrName in el.attrs)) return false;
                if (attrVal !== undefined && el.attrs[attrName] !== attrVal) return false;
            }
        }

        // Xử lý Pseudo match
        if (pseudoType) {
            let fullText = getElementText(el);
            if (pseudoType === "content") {
                // Hỗ trợ multi-value dạng "abc|lop|mov"
                let keywords = pseudoArg.split("|").map(k => k.trim());
                let found = keywords.some(kw => fullText.includes(kw));
                if (!found) return false;
            }
        }

        return true;
    }

    function traverse(current) {
        if (current.tag !== "ROOT") {
            for (let sel of selectors) {
                if (matchSelector(current, sel)) {
                    results.push(current);
                    break;
                }
            }
        }
        for (let child of current.children) {
            traverse(child);
        }
    }

    traverse(node);

    // Xử lý các pseudo như :first, :last, :eq() trên tập kết quả
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
}

// Lấy toàn bộ text bên trong element
function getElementText(el) {
    if (el.tag === "#text") return el.text;
    let text = "";
    for (let child of el.children) {
        text += getElementText(child) + " ";
    }
    return text.trim();
}


// --- 3. WRAPPER MINI-JQ CLASS ---
class MiniJQ {
    constructor(elements) {
        this.elements = Array.isArray(elements) ? elements : [elements];
    }

    find(selector) {
        let matched = [];
        for (let el of this.elements) {
            let res = querySelectorAll(el, selector);
            matched.push(...res);
        }
        return new MiniJQ(matched);
    }

    text() {
        if (this.elements.length === 0) return "";
        return getElementText(this.elements[0]);
    }

    html() {
        // Trả về chuỗi HTML tượng trưng của phần tử đầu tiên
        if (this.elements.length === 0) return "";
        let el = this.elements[0];
        let serialize = (node) => {
            if (node.tag === "#text") return node.text;
            let attrs = Object.entries(node.attrs).map(([k, v]) => ` ${k}="${v}"`).join("");
            let childrenHTML = node.children.map(serialize).join("");
            return `<${node.tag}${attrs}>${childrenHTML}</${node.tag}>`;
        };
        return el.children.map(serialize).join("");
    }

    attr(name, value) {
        if (value !== undefined) {
            for (let el of this.elements) {
                if (el.tag !== "#text") el.attrs[name] = value;
            }
            return this;
        }
        if (this.elements.length === 0) return undefined;
        return this.elements[0].attrs[name];
    }

    each(callback) {
        this.elements.forEach((el, index) => {
            callback.call(new MiniJQ(el), index, el);
        });
        return this;
    }

    textAll(delimiter = " ") {
        let texts = [];
        for (let el of this.elements) {
            texts.push(getElementText(el));
        }
        return texts.join(delimiter);
    }

    // --- CÁC HÀM BỔ SUNG THEO YÊU CẦU ---
    first() {
        return new MiniJQ(this.elements.length > 0 ? [this.elements[0]] : []);
    }

    last() {
        return new MiniJQ(this.elements.length > 0 ? [this.elements[this.elements.length - 1]] : []);
    }

    eq(index) {
        return new MiniJQ(this.elements[index] ? [this.elements[index]] : []);
    }

    parent() {
        let parents = [];
        for (let el of this.elements) {
            if (el.parent && el.parent.tag !== "ROOT") {
                parents.push(el.parent);
            }
        }
        return new MiniJQ(parents);
    }

    next() {
        let nexts = [];
        for (let el of this.elements) {
            if (!el.parent) continue;
            let siblings = el.parent.children;
            let idx = siblings.indexOf(el);
            if (idx !== -1 && idx + 1 < siblings.length) {
                nexts.push(siblings[idx + 1]);
            }
        }
        return new MiniJQ(nexts);
    }

    before() {
        let befores = [];
        for (let el of this.elements) {
            if (!el.parent) continue;
            let siblings = el.parent.children;
            let idx = siblings.indexOf(el);
            if (idx > 0) {
                befores.push(siblings[idx - 1]);
            }
        }
        return new MiniJQ(befores);
    }

    after() {
        // Alias cho next() trong ngữ cảnh In-Memory Tree
        return this.next();
    }

    closest(selector) {
        let matched = [];
        for (let el of this.elements) {
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
    }
}


window._$ = function (htmlStringOrObject) {
    if (typeof htmlStringOrObject === "string") {
        let rootObj = parseHTML(htmlStringOrObject);
        return new MiniJQ(rootObj);
    }
    return new MiniJQ(htmlStringOrObject);
}
