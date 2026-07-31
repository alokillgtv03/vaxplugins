// "version": "2.5" - Fixed Nested Tags Parsing
window.BASEURL = window.location.origin;
window.log = function(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[motchille] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[motchille] " + msg);
    }
}

window._$ = function (htmlOrBlock) {
    var selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link', 'source'];

    // --- 1. PARSER CORE (Biến HTML String thành Object Tree) ---
    function parseToNodes(htmlString) {
        var root = { type: 'root', children: [], parent: null };
        var currentParent = root;
        var stack = [root];
        var tagRegex = /<\/?([a-zA-Z0-9_-]+)([^>]*)>|([^<]+)/g;
        var match;

        while ((match = tagRegex.exec(htmlString)) !== null) {
            var fullMatch = match[0];
            var tagName = match[1];
            var attrs = match[2];
            var text = match[3];

            if (text) {
                if (text.trim() !== '') {
                    currentParent.children.push({ type: 'text', content: text, parent: currentParent });
                }
            } else if (fullMatch.indexOf('</') === 0) {
                if (stack.length > 1) {
                    stack.pop();
                    currentParent = stack[stack.length - 1];
                }
            } else {
                var tag = tagName.toLowerCase();
                var node = {
                    type: 'element',
                    tagName: tag,
                    attributes: parseAttrs(attrs),
                    children: [],
                    parent: currentParent
                };

                currentParent.children.push(node);

                var isSelfClosing = fullMatch.slice(-2) === '/>' || selfClosing.indexOf(tag) !== -1;
                if (!isSelfClosing) {
                    stack.push(node);
                    currentParent = node;
                }
            }
        }
        return root.children;
    }

    function parseAttrs(attrString) {
        var attrs = {};
        if (!attrString) return attrs;
        var attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        var match;
        while ((match = attrRegex.exec(attrString)) !== null) {
            var key = match[1].toLowerCase();
            var val = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : (match[4] !== undefined ? match[4] : ""));
            attrs[key] = val;
        }
        return attrs;
    }

    // --- 2. SELECTOR MATCHING ---
    function matchNode(node, selector) {
        if (!node || node.type !== 'element') return false;
        var sel = selector.trim();
        if (!sel) return false;

        if (sel.indexOf(':content(') !== -1) {
            var contentMatch = sel.match(/:content\((?:["']?)(.*?)(?:["']?)\)/);
            if (contentMatch) {
                var keywords = contentMatch[1].split('|');
                var nodeText = getText([node]);
                var matched = false;
                for (var k = 0; k < keywords.length; k++) {
                    if (nodeText.indexOf(keywords[k].trim()) !== -1) {
                        matched = true;
                        break;
                    }
                }
                if (!matched) return false;
                sel = sel.replace(/:content\([^)]+\)/, "");
            }
        }

        if (sel.indexOf(':not(') !== -1) {
            var notMatch = sel.match(/:not\((.*?)\)/);
            if (notMatch) {
                if (matchNode(node, notMatch[1])) return false;
                sel = sel.replace(/:not\([^)]+\)/, "");
            }
        }
        sel = sel.replace(/:first|:last/g, "");

        if (!sel) return true;

        var tagMatch = sel.match(/^([a-zA-Z0-9_-]+)/);
        var tag = tagMatch ? tagMatch[1].toLowerCase() : null;
        var idMatch = sel.match(/#([a-zA-Z0-9_-]+)/);
        var id = idMatch ? idMatch[1] : null;

        var classMatches = [];
        var classRegex = /\.([a-zA-Z0-9_-]+)/g;
        var cMatch;
        while ((cMatch = classRegex.exec(sel)) !== null) {
            classMatches.push(cMatch[1]);
        }

        var attrMatch = sel.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)?\s*(?:["']?)(.*?)(?:["']?)\]/);

        if (tag && node.tagName !== tag) return false;
        if (id && node.attributes['id'] !== id) return false;

        if (classMatches.length > 0) {
            var nodeClasses = (node.attributes['class'] || "").split(/\s+/);
            for (var c = 0; c < classMatches.length; c++) {
                if (nodeClasses.indexOf(classMatches[c]) === -1) return false;
            }
        }

        if (attrMatch) {
            var attrName = attrMatch[1];
            var operator = attrMatch[2];
            var attrVal = attrMatch[3];
            var nodeAttr = node.attributes[attrName];
            if (nodeAttr === undefined) return false;
            if (operator === "=" && nodeAttr !== attrVal) return false;
            if (operator === "*=" && nodeAttr.indexOf(attrVal) === -1) return false;
            if (operator === "^=" && nodeAttr.indexOf(attrVal) !== 0) return false;
            if (operator === "$=" && nodeAttr.slice(-attrVal.length) !== attrVal) return false;
        }

        return true;
    }

    function walk(nodes, callback) {
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.type === 'element') {
                callback(node);
                if (node.children) walk(node.children, callback);
            }
        }
    }

    function getHTML(nodes) {
        var html = '';
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.type === 'text') {
                html += node.content;
            } else if (node.type === 'element') {
                html += '<' + node.tagName;
                for (var key in node.attributes) {
                    html += node.attributes[key] ? ' ' + key + '="' + node.attributes[key] + '"' : ' ' + key;
                }
                if (selfClosing.indexOf(node.tagName) !== -1) {
                    html += ' />';
                } else {
                    html += '>' + getHTML(node.children) + '</' + node.tagName + '>';
                }
            }
        }
        return html;
    }

    function getText(nodes, separator) {
        var textArr = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.type === 'text') {
                textArr.push(node.content.trim());
            } else if (node.type === 'element') {
                var childText = getText(node.children, separator);
                if (childText) textArr.push(childText);
            }
        }
        var clean = [];
        for (var j = 0; j < textArr.length; j++) {
            if (textArr[j] !== '') clean.push(textArr[j]);
        }
        return clean.join(separator || ' ');
    }

    // --- 3. KHỞI TẠO ĐẦU VÀO (LẤY TỪ CACHE NẾU ĐÃ PARSE) ---
    var elements = [];

    if (typeof htmlOrBlock === 'string') {
        if (window._$htmlCache[htmlOrBlock]) {
            // Lấy trực tiếp cây DOM đã parse sẵn
            var cached = window._$htmlCache[htmlOrBlock];
            for (var c = 0; c < cached.length; c++) {
                if (cached[c].type === 'element') elements.push(cached[c]);
            }
        } else {
            // Parse lần đầu và lưu vào cache
            var parsed = parseToNodes(htmlOrBlock);
            window._$htmlCache[htmlOrBlock] = parsed;
            for (var p = 0; p < parsed.length; p++) {
                if (parsed[p].type === 'element') elements.push(parsed[p]);
            }
        }
    } else if (Array.isArray(htmlOrBlock)) {
        elements = htmlOrBlock;
    } else if (htmlOrBlock && typeof htmlOrBlock === 'object') {
        if (htmlOrBlock.elements) {
            return htmlOrBlock; // Trả về nếu đã là instance
        }
        if (htmlOrBlock.type === 'element') {
            elements = [htmlOrBlock];
        }
    }

    // --- 4. TẠO INSTANCE OBJECT (Giữ đúng cấu trúc hàm gốc) ---
    var instance = {
        elements: elements,
        length: elements.length,

        find: function (selector) {
            if (selector.indexOf(',') !== -1) {
                var selectors = selector.split(',');
                var allResults = [];
                for (var s = 0; s < selectors.length; s++) {
                    var sub = this.find(selectors[s].trim());
                    for (var r = 0; r < sub.elements.length; r++) {
                        if (allResults.indexOf(sub.elements[r]) === -1) {
                            allResults.push(sub.elements[r]);
                        }
                    }
                }
                return _$(allResults);
            }

            var results = [];
            walk(this.elements, function (node) {
                if (matchNode(node, selector)) {
                    results.push(node);
                }
            });

            if (selector.indexOf(':first') !== -1 && results.length > 0) return _$([results[0]]);
            if (selector.indexOf(':last') !== -1 && results.length > 0) return _$([results[results.length - 1]]);

            return _$(results);
        },

        each: function (callback) {
            for (var i = 0; i < this.elements.length; i++) {
                var childInstance = _$(this.elements[i]);
                callback.call(childInstance, i, this.elements[i]);
            }
            return this;
        },

        eq: function (index) {
            if (index < 0) index = this.elements.length + index;
            var elem = this.elements[index];
            return _$(elem ? [elem] : []);
        },

        attr: function (attrName) {
            if (this.elements.length === 0) return "";
            return this.elements[0].attributes[attrName.toLowerCase()] || "";
        },

        html: function () {
            if (this.elements.length === 0) return "";
            return getHTML(this.elements[0].children);
        },

        text: function (separator) {
            if (this.elements.length === 0) return "";
            return getText(this.elements[0].children, separator);
        },

        textAll: function (separator) {
            return getText(this.elements, separator);
        },

        next: function () {
            var results = [];
            for (var i = 0; i < this.elements.length; i++) {
                var node = this.elements[i];
                if (node.parent) {
                    var siblings = node.parent.children;
                    var index = siblings.indexOf(node);
                    for (var j = index + 1; j < siblings.length; j++) {
                        if (siblings[j].type === 'element') {
                            if (results.indexOf(siblings[j]) === -1) results.push(siblings[j]);
                            break;
                        }
                    }
                }
            }
            return _$(results);
        },

        parent: function () {
            var results = [];
            for (var i = 0; i < this.elements.length; i++) {
                var p = this.elements[i].parent;
                if (p && p.type === 'element' && results.indexOf(p) === -1) {
                    results.push(p);
                }
            }
            return _$(results);
        },

        closest: function (selector) {
            var results = [];
            for (var i = 0; i < this.elements.length; i++) {
                var current = this.elements[i];
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

    return instance;
}