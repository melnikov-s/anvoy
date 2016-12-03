import {default as $, hasServerDoc} from './dom';
import {error, extend} from './utils';

const ATTR = 'data-anvoy';
let rContainerSrc = `<\\s*@([^\\s<>/]+)([\\s\\S]*?)/\\s*>`;
let rContainerGlobal = new RegExp(rContainerSrc, 'g');
let rContainer = new RegExp(rContainerSrc);
let rAttr = /\s+@([^\s"'/]+)(?=([^"]*"[^"]*")*[^"]*$).*>/;
let rTags = /<[^/]\S*?[^<]*>+/g;
let rTextNodes = /({\s*@\S*?\s*})/g;
let rTextNodeName = /{\s*@(\S*?)\s*}/;
let rAttrEntry = /(.*?)="?(.*?)"?$/;

function stringAttrsToObj(stringAttrs) {
    let attrs = {};

    if (stringAttrs) {
        let parts = stringAttrs.trim().split(/\s+/);
        for (let part of parts) {
            if (rAttrEntry.test(part)) {
                let [, prop, value] = rAttrEntry.exec(part);
                attrs[prop] = value;
            } else {
                attrs[part] = '';
            }
        }
    }

    return attrs;
}

function getTextMetaData(rootEl, index, textNode, currentPath, stripWhiteSpace) {
    let textMeta = [];
    let delta = 0;
    let content = $.nodeValue(textNode);
    let lastNode = textNode;

    if (stripWhiteSpace && !content.trim() && content.indexOf('\n') >= 0) {
        $.remove(textNode);
        delta--;
    } else {
        let parts = content.split(rTextNodes);
        if (parts.length > 1) {
            delta--;

            for (let j = 0; j < parts.length; j++) {
                let part = parts[j];
                if (rTextNodes.test(part)) {
                    //if we are doing serer side rendering we need to put comment nodes in between the
                    //text nodes to prevent the browser from parsing what is supposed to be multiple
                    //text nodes as one.
                    if (hasServerDoc) {
                        $.insertAfter($.createComment(), lastNode);
                        lastNode = lastNode.nextSibling;
                        $.insertAfter($.createTextNode('--'), lastNode);
                        lastNode = lastNode.nextSibling;
                        $.insertAfter($.createComment(), lastNode);
                        lastNode = lastNode.nextSibling;
                        delta += 3;
                    } else {
                        //text nodes must be non-empty otherwise old IE will strip them out
                        //during cloneNode
                        $.insertAfter($.createTextNode('--'), lastNode);
                        lastNode = lastNode.nextSibling;
                        delta++;
                    }

                    let [, name] = rTextNodeName.exec(part);
                    textMeta.push({
                        type: 'text',
                        attrs: null,
                        i: -1,
                        path: currentPath.concat(index + delta - (hasServerDoc ? 1 : 0)),
                        name,
                        depth: $.depth(textNode, rootEl)
                    });
                } else if (part) {
                    $.insertAfter($.createTextNode(part), lastNode);
                    lastNode = lastNode.nextSibling;
                    delta++;
                }
            }

            $.remove(textNode);
        }
    }

    return {delta, meta: textMeta};
}

function getContainerMetaData(rootEl, index, scriptNode, currentPath, name) {
    let containerMeta = [];
    let delta = 0;

    let attrs = stringAttrsToObj(scriptNode.textContent);
    let commentNode = $.createComment(name);

    $.replace(commentNode, scriptNode);

    containerMeta.push({
        type: 'comment',
        attrs: Object.keys(attrs).length > 0 ? attrs : null,
        i: -1,
        path: currentPath.concat(index),
        name,
        depth: $.depth(commentNode, rootEl)
    });

    return {delta, meta: containerMeta};
}

function getElementsMetaData(rootEl) {
    let elementsMeta = [];
    //generate paths for all element nodes. Elements can be quickly retrieved in a consistent order
    //with getElementsByTagName('*')
    let allElems = $.getAllElements(rootEl);
    for (let i = 0; i < allElems.length; i++) {
        let elem = allElems[i];
        let name = $.getAttr(elem, ATTR);
        if (name) {
            elementsMeta.push({
                type: 'element',
                attrs: null,
                i,
                el: elem,
                path: null,
                name,
                depth: $.depth(elem, rootEl)
            });

            $.removeAttr(elem, ATTR);
        }
    }

    return elementsMeta;
}

//gather meta data from a DOM element template. Only runs once per template and the resulting data
//can be applied to any cloned template. Primarly used to generate paths to non-static nodes within
//a cloned template.
function getNodesMetaData(rootEl) {
    let elMeta = [];

    let toVisit = [rootEl];
    let current = {el: rootEl, path: [], isPre: $.tag(rootEl) === 'PRE'};

    //generate paths for comment and text nodes. There's no way to quickly retrieve them
    //need to deeply traverse the DOM tree
    while (current) {
        let {el, isPre, path} = current;
        let childNodes = $.childNodes(el);

        for (let i = 0; i < childNodes.length; i++) {
            let childNode = childNodes[i];

            if ($.isText(childNode)) {
                let {meta, delta} = getTextMetaData(rootEl, i, childNode, path, !isPre);
                elMeta.push(...meta);
                i += delta;
            } else if ($.isElement(childNode)) {
                let name = $.getAttr(childNode, ATTR);
                if (name && $.tag(childNode) === 'SCRIPT') {
                    let {meta, delta} = getContainerMetaData(rootEl, i, childNode, path, name);
                    elMeta.push(...meta);
                    i += delta;
                } else {
                    toVisit.push({
                        el: childNode,
                        path: path.concat(i),
                        isPre: current.isPre || $.tag(childNode) === 'PRE'
                    });
                }
            }
        }

        toVisit.shift();
        current = toVisit[0];
    }

    let elementMeta = getElementsMetaData(rootEl);
    elMeta.push(...elementMeta);

    //we need to sort the elements in order of their depth, so that they can be updated
    //from bottom up when ultimately passed to a component.
    return elMeta.sort((a, b) => b.depth - a.depth);
}

function resolveNodesMetaData(rootEl, elMeta) {
    let elsData = [];
    let allElems = $.getAllElements(rootEl);

    for (let {i, path, name, attrs} of elMeta) {
        if (path) {
            let el = rootEl;
            for (let index of path) {
                el = $.childNodes(el)[index];
            }

            elsData.push({el, name, attrs});
        } else {
            elsData.push({el: allElems[i], name, attrs});
        }
    }

    return elsData;
}

//transforms `<div><tag @element/></tag><div>` and `<div><@element/></div>` into valid HTML.
//and then creates a DOM Element
function createDomElementFromTemplate(html) {
    //match container markers like <@element/>
    let containerTags = html.match(rContainerGlobal) || [];

    for (let containerTag of containerTags) {
        let [, containerName, attrs = ''] = rContainer.exec(containerTag);
        let template = `<script type="x" ${ATTR}="${containerName}">${attrs.trim()}</script>`;

        html = html.split(containerTag).join(template);
    }

    //match attribute markers like <span @element></span>
    let allTags = html.match(rTags) || [];

    for (let tag of allTags) {
        let result = rAttr.exec(tag);

        if (result) {
            let elName = result[1];
            html = html.split(tag).join(tag.replace(`@${elName}`, `${ATTR}="${elName}"`));
        }
    }

    return $.create(html.trim());
}

export function parseTemplate(template) {
    if (template == null) template = '<!-- -->';

    if (typeof template !== 'string') {
        error(`not a valid el value, must be a HTML string got ${typeof template}`);
    }

    let el = createDomElementFromTemplate(template);
    let isElement = $.isElement(el);

    let rootElData = {el, name: 'root', type: isElement ? 'element' : 'comment'};
    let elMeta;

    if (isElement) {
        elMeta = getNodesMetaData(el);
    }

    return {rootElData, elMeta};
}

export function getNodesFromParsedTemplate({rootElData, elMeta}) {
    let clonedEl = $.clone(rootElData.el);
    let clonedRootElData = extend({}, rootElData, {el: clonedEl});
    let elsData = elMeta ? resolveNodesMetaData(clonedEl, elMeta) : [];

    return [clonedRootElData, ...elsData];
}
