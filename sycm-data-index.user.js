// ==UserScript==
// @name         生意参谋指数转换
// @namespace    http://it.ribs.com/
// @version      0.1
// @description  生意参谋指数转换
// @author       Ribs
// @match        https://sycm.taobao.com/*
// @updateURL    https://github.com/itribs/tampermonkeyJs/raw/master/sycm-data-index.user.js
// @downloadURL  https://github.com/itribs/tampermonkeyJs/raw/master/sycm-data-index.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

let cancel = false;
let rules = [
    { type: 'llzs', check: async(selection) => checkParentContainsValue(selection, 4, 'uvIndex') },
    { type: 'llzs', check: async(selection) => checkParentContainsValue(selection, 4, 'pvIndex') },
    { type: 'jyzs', check: async(selection) => checkParentContainsValue(selection, 4, 'tradeIndex') },
    { type: 'ssrq', check: async(selection) => checkParentContainsValue(selection, 4, 'seIpvUvHits') },
    { type: 'scrq', check: async(selection) => checkParentContainsValue(selection, 4, 'cltHits') },
    { type: 'scrq', check: async(selection) => checkParentContainsValue(selection, 4, 'cltByrCntIndex') },
    { type: 'jgrq', check: async(selection) => checkParentContainsValue(selection, 4, 'cartHits') },
    { type: 'zfzhlzs', check: async(selection) => checkParentContainsValue(selection, 4, 'payRateIndex') },
    { type: 'kqzs', check: async(selection) => checkParentContainsValue(selection, 4, 'payByrCntIndex') },
    {
        type: 'jyzs',
        check: async(selection) => {
            let parent = getParent(selection, 16);
            return parent && (parent.id.indexOf('itemAnalysisKeywordTablerivalItem') > -1 || parent.id == 'itemAnalysisKeywordTableselfItemId');
        }
    },
    {
        type: 'kqzs',
        check: async(selection) => {
            let parent = getParent(selection, 14);
            return parent && parent.id == 'sycm-mc-flow-analysis' && document.querySelector('#sycm-mc-flow-analysis input[value="payByrCntIndex"]').checked;
        }
    },
    {
        type: 'zfzhlzs',
        check: async(selection) => {
            let parent = getParent(selection, 14);
            return parent && parent.id == 'sycm-mc-flow-analysis' && document.querySelector('#sycm-mc-flow-analysis input[value="payRateIndex"]').checked;
        }
    },
    {
        type: 'jyzs',
        check: async(selection) => {
            let parent = getParent(selection, 14);
            return parent && parent.id == 'sycm-mc-flow-analysis' && document.querySelector('#sycm-mc-flow-analysis input[value="tradeIndex"]').checked;
        }
    },
    {
        type: 'llzs',
        check: async(selection) => {
            let parent = getParent(selection, 14);
            return parent && parent.id == 'sycm-mc-flow-analysis' && document.querySelector('#sycm-mc-flow-analysis input[value="uvIndex"]').checked;
        }
    },
    { type: 'jgrq', check: async(selection) => checkParentContainsClass(selection, 5, 'cartHits') },
    { type: 'kqzs', check: async(selection) => checkParentContainsClass(selection, 5, 'payByrCntIndex') },
    { type: 'scrq', check: async(selection) => checkParentContainsClass(selection, 5, 'cltHits') },
    { type: 'scrq', check: async(selection) => checkParentContainsClass(selection, 5, 'cltByrCntIndex') },
    { type: 'jyzs', check: async(selection) => checkParentContainsClass(selection, 5, 'tradeIndex') },
    { type: 'zfzhlzs', check: async(selection) => checkParentContainsClass(selection, 5, 'payRateIndex') },
    { type: 'llzs', check: async(selection) => checkParentContainsClass(selection, 5, 'uvIndex') },
    { type: 'llzs', check: async(selection) => checkParentContainsClass(selection, 5, 'pvIndex') },
    { type: 'ssrq', check: async(selection) => checkParentContainsClass(selection, 5, 'seIpvUvHits') },
    {
        type: 'llzs',
        check: async(selection) => {
            let parent = getParent(selection, 2);
            return parent && parent.children[0].innerText == '流量指数';
        }
    },
    {
        type: 'ssrq',
        check: async(selection) => {
            let parent = getParent(selection, 2);
            return parent && parent.children[0].innerText == '搜索人气';
        }
    },
    {
        type: 'jyzs',
        check: async(selection) => {
            let parent = getParent(selection, 2);
            return parent && parent.children[0].innerText == '交易指数';
        }
    }
];

(function() {
    'use strict';

    GM_registerMenuCommand("设置", function() {
        let apikey = prompt('apikey');
        let secretKey = prompt('secretKey');
        GM_setValue('apikey', apikey);
        GM_setValue('secretKey', secretKey);
    });

    createView();

    document.addEventListener('mouseup', async e => {
        let view = document.querySelector('#ribs_index_data');
        let select = view.querySelector('select');
        let input = view.querySelector('input');
        let dataView = view.querySelector('#ribs_data_view');
        if ([view, select, input, dataView].indexOf(e.target) > -1) {
            return;
        }
        let selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            let value = selection.toString().trim();
            let p = { x: 100, y: 100 }
            try {
                let range = selection.getRangeAt(0);
                let rect = range.getBoundingClientRect();
                p = {
                    x: rect.x + document.scrollingElement.scrollLeft + rect.width,
                    y: rect.y + document.scrollingElement.scrollTop - 70
                }
            } catch (e) {
                console.log(e)
            }

            cancel = false;
            if (selection.baseNode && selection.baseNode.children && selection.baseNode.children.length > 0 && selection.baseNode.children[0].tagName == 'IMG') {
                showLoading(p);
                value = await getImageText(selection.baseNode.children[0]);
            }
            value = value.replace(/[,\s]/g, '');
            if (!cancel && /^\d+(,\d+)?(.(\d+))?$/.test(value)) {
                onSelectedText(selection, value, p);
                return;
            }
        }
        hideData();
    })
})();

async function getAccessToken() {
    let accessToken = GM_getValue('baiduAccessToken', '');
    let apikey = GM_getValue('apikey', '');
    let secretKey = GM_getValue('secretKey', '');
    if (!apikey || !secretKey) {
        alert('apikey和secretKey已过期，需重新设置');
        return;
    }
    if (!accessToken) {
        let response = await request({
            method: 'GET',
            url: `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apikey}&client_secret=${secretKey}`,
        });
        if (response.data) {
            try {
                accessToken = response.data.access_token;
                GM_setValue('baiduAccessToken', accessToken);
            } catch (e) {
                console.log(e)
            }
        }
    }
    return accessToken;
}

async function ocrRequest(imageData) {
    return new Promise(async (resolve, reject) => {
        let accessToken = await getAccessToken();
        if (!accessToken) {
            resolve('');
            return;
        }
        let response = await request({
            method: 'post',
            url: `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: {
                image: imageData,
                language_type: 'ENG'
            }
        })
        if (response.data) {
            if (response.data.error_code > 0) {
                if (response.data.error_code == 110 || response.data.error_code == 111) {
                    GM_setValue('baiduAccessToken', '');
                    return ocrRequest(imageData);
                } else {
                    let error = new Error(response.data.error_msg);
                    error.code = response.data.error_code;
                    reject(error)
                }
            } else {
                let result = '';
                for (let i = 0; i < response.data.words_result.length; i++) {
                    result += response.data.words_result[i].words;
                }
                resolve(result)
            }
        }
    });
}

function transformDataRequest(t, vals) {
    return new Promise(async resolve => {
        if (vals && vals.length > 0) {
            let response = await request({
                method: 'post',
                url: 'http://www.aminggongju.com/switch',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "Host": "www.aminggongju.com",
                    "Origin": "http://www.aminggongju.com",
                    "Referer": "http://www.aminggongju.com/index.html",
                    "X-Requested-With": "XMLHttpRequest"
                },
                data: {
                    type: getTypeArg(t),
                    values: JSON.stringify(vals)
                }
            })
            if (response.data) {
                resolve(response.data.extData || []);
                return;
            }
        }
        resolve(Array.apply(null, Array(vals.length)).map(() => 0));
    });
}

function request(opts) {
    if (opts.data && typeof(opts.data) == 'object') {
        let kvs = '';
        for (var key in opts.data) {
            if (kvs.length > 0) {
                kvs += "&";
            }
            kvs += key + "=" + opts.data[key];
        }
        opts.data = kvs;
    }
    return new Promise(function(resolve) {
        GM_xmlhttpRequest({
            method: opts.method,
            url: opts.url,
            headers: opts.headers,
            data: opts.data,
            onreadystatechange: function(xhr) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200 || xhr.status == 304) {
                        let data = null;
                        if (xhr.responseText) {
                            try {
                                data = JSON.parse(xhr.responseText);
                            } catch (e) {}
                        }
                        resolve({data:data, error: null});
                    } else {
                        var err = new Error(`error-status-${xhr.status}`);
                        resolve({data:null, error: err});
                    }
                }
            }
        })
    })
}

function getImageData(img) {
    let canvas = document.createElement("canvas");
    canvas.width = img.width * 1.5;
    canvas.height = img.height * 1.5;
    let ctx = canvas.getContext("2d");
    ctx.fillStyle="#ffffff";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let dataURL = '';
    try {
        dataURL = canvas.toDataURL("image/png");
    } catch (e) {
        console.log(e);
    }
    return dataURL;
}

async function getImageText(img) {
    let imageData = getImageData(img).replace('data:image/png;base64,', '');
    let value = await ocrRequest(encodeURIComponent(imageData));
    let ms = value.match(/\d/g);
    value = (ms || []).join('');
    return value;
}

async function onSelectedText(selection, value, p) {
    let type = await checkType(selection);
    showData(type, value, p);
}

function checkParentContainsClass(selection, hierarchy, className) {
    let parent = selection.baseNode;
    for (let i = 0; i < hierarchy; i++) {
        parent = parent ? parent.parentNode : null;
        if (!parent) {
            return false;
        }
        if (parent.className.indexOf(className) > -1) {
            return true;
        }
    }
    return false;
}

function checkParentContainsValue(selection, hierarchy, value) {
    let parent = selection.baseNode;
    for (let i = 0; i < hierarchy; i++) {
        parent = parent ? parent.parentNode : null;
        if (!parent) {
            return false;
        }
        let attr = parent.getAttribute('value');
        if (attr && attr.indexOf(value) > -1) {
            return true;
        }
    }
    return false;
}

function getParent(selection, hierarchy) {
    let parent = selection.baseNode;
    for (let i = 0; i < hierarchy; i++) {
        parent = parent ? parent.parentNode : null;
        if (!parent) {
            return null;
        }
    }
    return parent;
}

async function checkType(selection) {
    for (let i = 0; i < rules.length; i++) {
        if (await rules[i].check(selection)) {
            return rules[i].type;
        }
    }
}

function getTypeName (type) {
    switch (type) {
        case 'jyzs':
            return '交易金额：';
        case 'llzs':
            return '访客人数：';
        case 'zfzhlzs':
            return '支付转化率：';
        case 'kqzs':
            return '支付人数：';
        case 'ssrq':
            return '搜索人数：';
        case 'jgrq':
            return '加购人数：';
        case 'scrq':
            return '收藏人数：';
        default:
            return '交易金额：';
    }
}

function getTypeArg (type) {
    if (type == 'zfzhlzs') {
        return 'pay';
    }
    return 'change';
}

function createView() {
    let view = document.createElement('div');
    view.id = 'ribs_index_data';
    view.style = `position: absolute;width: 230px;z-index: 1501;border-radius: 8px;background:#fff;left:100px;top:100px;box-shadow: 0 0 15px 5px rgba(0,0,0,0.2);display:none;`;

    let inputView = document.createElement('div');
    inputView.style = `padding: 10px;height: 40px;`;

    let select = document.createElement('select');
    select.style = `width: 80px;float: left;border:1px solid #ccc;border-radius: 5px;`;
    select.addEventListener('change', ()=> {
        queryData()
    });

    let opt1 = document.createElement('option');
    opt1.innerText = '交易指数';
    opt1.value = 'jyzs'
    select.appendChild(opt1)

    let opt2 = document.createElement('option');
    opt2.innerText = '流量指数';
    opt2.value = 'llzs'
    select.appendChild(opt2)

    let opt3 = document.createElement('option');
    opt3.innerText = '支付转化指数';
    opt3.value = 'zfzhlzs'
    select.appendChild(opt3)

    let opt4 = document.createElement('option');
    opt4.innerText = '客群指数';
    opt4.value = 'kqzs'
    select.appendChild(opt4)

    let opt5 = document.createElement('option');
    opt5.innerText = '搜索人气';
    opt5.value = 'ssrq'
    select.appendChild(opt5)

    let opt6 = document.createElement('option');
    opt6.innerText = '加购人气';
    opt6.value = 'jgrq'
    select.appendChild(opt6)

    let opt7 = document.createElement('option');
    opt7.innerText = '收藏人气';
    opt7.value = 'scrq'
    select.appendChild(opt7)

    inputView.appendChild(select);

    let input = document.createElement('input');
    input.style = `float: left;margin-left: 20px;width: 110px;height:23px;border:1px solid #ccc;border-radius: 5px;outline: none;padding:0 5px;`;
    inputView.appendChild(input);

    let dataView = document.createElement('div');
    dataView.id = 'ribs_data_view';
    dataView.style = `height: 30px;line-height: 20px;text-align: center;`;

    view.appendChild(inputView);
    view.appendChild(dataView);

    let loading = document.createElement('div');
    loading.id = 'ribs_loading_view';
    loading.style = `position: absolute;left:0;top:0;width:100%;height:100%;background:#fff;border-radius: 8px;opacity:0.8;text-align: center;line-height:60px;display:none;`;
    let img = document.createElement('img');
    img.src = 'https://img.lanrentuku.com/img/allimg/1212/5-121204193934-50.gif';
    loading.appendChild(img);
    view.appendChild(loading);

    document.body.appendChild(view);
}

function showData(type, value, p) {
    let view = document.querySelector('#ribs_index_data');
    view.style.left = p.x + 'px';
    view.style.top = p.y + 'px';
    let opts = view.querySelectorAll('select option');
    for (let i=0;i<opts.length;i++) {
        if (opts[i].value == type) {
            opts[i].selected = true;
            break;
        }
    }
    view.querySelector('input').value = value;
    view.style.display = 'block';
    view.querySelector('#ribs_loading_view').style.display = 'block';
    queryData()
}

function queryData() {
    let view = document.querySelector('#ribs_index_data');
    let type = view.querySelector('select').value;
    let value = view.querySelector('input').value;
    transformDataRequest(type, [value]).then((results) => {
        if (results && results.length > 0) {
            view.querySelector('#ribs_data_view').innerText = getTypeName(type) + results[0];
        }
        view.querySelector('#ribs_loading_view').style.display = 'none';
    })
}

function showLoading(p) {
    let view = document.querySelector('#ribs_index_data');
    view.style.left = p.x + 'px';
    view.style.top = p.y + 'px';
    view.style.display = 'block';
    view.querySelector('#ribs_loading_view').style.display = 'block';
}

function hideData() {
    cancel = true;
    let view = document.querySelector('#ribs_index_data');
    view.querySelector('input').value = '';
    view.querySelector('#ribs_data_view').innerText = '';
    view.style.display = 'none';
    view.querySelector('#ribs_loading_view').style.display = 'none';
}
