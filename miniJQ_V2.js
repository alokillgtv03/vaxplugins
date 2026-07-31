// "version": "2.5" - Fixed Nested Tags Parsing
window.BASEURL = window.location.origin;
window.log = function(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[motchille] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[motchille] " + msg);
    }
}

window._$ = (function () {
    // ----------------------------------------------------------------------
    // BỘ NHỚ ĐỆM (CACHE) - Parse chuỗi HTML 1 lần duy nhất
    // ----------------------------------------------------------------------
    var cache = {};
    var selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'base', 'embed', 'param', 'track', 'wbr'];

    // ----------------------------------------------------------------------
    // PARSER: Chuyển chuỗi HTML thành Virtual DOM Object Tree
    // ----------------------------------------------------------------------
    function parseHTML(htmlString) {
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
                    attributes: parseAttributes(attrs),
                    children: [],
                    parent: currentParent
                };

                currentParent.children.push(node);

                var isSelfClosing = fullMatch.slice(-2) === '/>' || selfClosingTags.indexOf(tag) !== -1;
                if (!isSelfClosing) {
                    stack.push(node);
                    currentParent = node;
                }
            }
        }
        return root.children;
    }

    function parseAttributes(attrString) {
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

    // ----------------------------------------------------------------------
    // QUERY & MATCH ENGINE
    // ----------------------------------------------------------------------
    function matchNode(node, selector) {
        if (!node || node.type !== 'element') return false;
        var sel = selector.trim();
        if (!sel) return false;

        // Content pseudo
        if (sel.indexOf(':content(') !== -1) {
            var contentMatch = sel.match(/:content\((?:["']?)(.*?)(?:["']?)\)/);
            if (contentMatch) {
                var keywords = contentMatch[1].split('|');
                var nodeText = renderText([node]);
                var hasContent = false;
                for (var k = 0; k < keywords.length; k++) {
                    if (nodeText.indexOf(keywords[k].trim()) !== -1) {
                        hasContent = true;
                        break;
                    }
                }
                if (!hasContent) return false;
                sel = sel.replace(/:content\([^)]+\)/, "");
            }
        }

        // Not pseudo
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

    function walkDOM(nodes, callback) {
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.type === 'element') {
                callback(node);
                if (node.children) walkDOM(node.children, callback);
            }
        }
    }

    function renderHTML(nodes) {
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
                if (selfClosingTags.indexOf(node.tagName) !== -1) {
                    html += ' />';
                } else {
                    html += '>' + renderHTML(node.children) + '</' + node.tagName + '>';
                }
            }
        }
        return html;
    }

    function renderText(nodes, separator) {
        var textArr = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.type === 'text') {
                textArr.push(node.content.trim());
            } else if (node.type === 'element') {
                var childText = renderText(node.children, separator);
                if (childText) textArr.push(childText);
            }
        }
        var clean = [];
        for (var j = 0; j < textArr.length; j++) {
            if (textArr[j] !== '') clean.push(textArr[j]);
        }
        return clean.join(separator || ' ');
    }

    // ----------------------------------------------------------------------
    // CONSTRUCTOR
    // ----------------------------------------------------------------------
    function Core(htmlOrNodes) {
        var elems = [];
        var rootNodes = [];

        if (typeof htmlOrNodes === 'string') {
            if (cache[htmlOrNodes]) {
                rootNodes = cache[htmlOrNodes];
            } else {
                rootNodes = parseHTML(htmlOrNodes);
                cache[htmlOrNodes] = rootNodes;
            }
            for (var i = 0; i < rootNodes.length; i++) {
                if (rootNodes[i].type === 'element') elems.push(rootNodes[i]);
            }
        } else if (Array.isArray(htmlOrNodes)) {
            for (var j = 0; j < htmlOrNodes.length; j++) {
                if (htmlOrNodes[j] && htmlOrNodes[j].type === 'element') elems.push(htmlOrNodes[j]);
            }
        } else if (htmlOrNodes && htmlOrNodes.type === 'element') {
            elems = [htmlOrNodes];
        }

        this.elements = elems;
        this.length = elems.length;
    }

    // ----------------------------------------------------------------------
    // PUBLIC METHODS (Mini jQuery API)
    // ----------------------------------------------------------------------
    Core.prototype.find = function (selector) {
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
            return new Core(allResults);
        }

        var results = [];
        walkDOM(this.elements, function (node) {
            if (matchNode(node, selector)) {
                results.push(node);
            }
        });

        if (selector.indexOf(':first') !== -1 && results.length > 0) return new Core([results[0]]);
        if (selector.indexOf(':last') !== -1 && results.length > 0) return new Core([results[results.length - 1]]);

        return new Core(results);
    };

    Core.prototype.each = function (callback) {
        for (var i = 0; i < this.elements.length; i++) {
            callback.call(new Core(this.elements[i]), i, this.elements[i]);
        }
        return this;
    };

    Core.prototype.eq = function (index) {
        if (index < 0) index = this.elements.length + index;
        return new Core(this.elements[index] ? [this.elements[index]] : []);
    };

    Core.prototype.attr = function (attrName) {
        if (this.elements.length === 0) return "";
        return this.elements[0].attributes[attrName.toLowerCase()] || "";
    };

    Core.prototype.html = function () {
        if (this.elements.length === 0) return "";
        return renderHTML(this.elements[0].children);
    };

    Core.prototype.text = function (separator) {
        if (this.elements.length === 0) return "";
        return renderText(this.elements[0].children, separator);
    };

    Core.prototype.textAll = function (separator) {
        return renderText(this.elements, separator);
    };

    Core.prototype.next = function () {
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
        return new Core(results);
    };

    Core.prototype.parent = function () {
        var results = [];
        for (var i = 0; i < this.elements.length; i++) {
            var p = this.elements[i].parent;
            if (p && p.type === 'element' && results.indexOf(p) === -1) {
                results.push(p);
            }
        }
        return new Core(results);
    };

    Core.prototype.closest = function (selector) {
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
        return new Core(results);
    };

    // Hàm factory chính
    return function (htmlOrNodes) {
        return new Core(htmlOrNodes);
    };
})();