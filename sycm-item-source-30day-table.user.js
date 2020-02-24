// ==UserScript==
// @name         生意参谋最近30日数据
// @namespace    http://it.ribs.com/
// @version      0.1
// @description  生意参谋最近30日数据
// @author       Ribs
// @updateURL    https://ribs.coding.net/p/tampermonkeyJs/d/tampermonkeyJs/git/raw/master/sycm-item-source-30day-table.user.js
// @downloadURL  https://ribs.coding.net/p/tampermonkeyJs/d/tampermonkeyJs/git/raw/master/sycm-item-source-30day-table.user.js
// @match        https://sycm.taobao.com/flow/monitor/itemsource*
// @require      https://cdn.bootcss.com/moment.js/2.24.0/moment.min.js
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jsgrid/1.5.3/jsgrid.min.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    let link1 = document.createElement('link');
    link1.type='text/css';
    link1.rel = 'stylesheet';
    link1.href = 'https://cdnjs.cloudflare.com/ajax/libs/jsgrid/1.5.3/jsgrid.min.css';
    let link2 = document.createElement('link');
    link2.type='text/css';
    link2.rel = 'stylesheet';
    link2.href = 'https://cdnjs.cloudflare.com/ajax/libs/jsgrid/1.5.3/jsgrid-theme.min.css';

    document.head.append(link1);
    document.head.append(link2);

    let data = [];
    let tableShowing = false;
    let lastRequestUrl = '';
    let tableContaier = $('<div style="background:#fff;position: absolute;left:0;top:55px;right:0;bottom:0;"><div id="ribs_flow_item_table"></div></div>').hide();

    let flowItemTableLink = $('<a style="display: inline-block;float: right; margin-right: 20px;">显示表格</a>');
    flowItemTableLink.click(function() {
        toggleTable();

        if (tableShowing) {
            getData();
        }
    });

    function getData() {
        let requestUrl = $('.item-source-dialog-download').attr('href');
        if (lastRequestUrl == requestUrl) {
            showTable();
            return;
        } else {
            lastRequestUrl = requestUrl;
            data = [];
        }

        let urlParams = getParams(requestUrl);
        let pageId = urlParams['pageId'];
        let pPageId = urlParams['pPageId'];
        let pageName = urlParams['pageName'];
        let itemId = urlParams['itemId'];
        let dateRange = urlParams['dateRange'];
        let device = urlParams['device'];
        let dateType = urlParams['dateType'];
        let belong = urlParams['belong'];
        let indexCodes = ['uv', 'cltCnt', 'cartByrCnt', 'payAmt', 'payItmCnt', 'payByrCnt'];
        let tableHeaders = {
            '日期': 'date',
            '访客数': 'uv',
            '收藏人数': 'cltCnt',
            '加购人数': 'cartByrCnt',
            '支付件数': 'payItmCnt',
            '支付买家数': 'payByrCnt',
            '支付金额': 'payAmt',
            '近3天坑产': 'payAmt3',
            '近7天坑产': 'payAmt7',
            '转化率': 'cvr',
            '近3天转化率': 'cvr3',
            '近7天转化率': 'cvr7',
            '收藏加购率': 'cpr',
            '近3天收藏加购率': 'cpr3',
            '近7天收藏加购率': 'cpr7'
        }

        let endDate = dateRange.split('|')[1];
        let requests = [];

        for (let i = 0; i < indexCodes.length; i++) {
            requests.push(request({
                method: 'GET',
                url: `https://sycm.taobao.com/flow/v3/source/item/flow/trend.json?dateType=${dateType}&dateRange=${dateRange}&indexCode=${indexCodes[i]}&pageId=${pageId}&pPageId=${pPageId}&pageName=${pageName}&device=${device}&itemId=${itemId}&belong=${belong}`
            }))
        }

        Promise.all(requests).then(function(results) {
            let resultData = {};
            for(let i = 0; i < results.length; i++) {
                resultData[indexCodes[i]] = JSON.parse(results[i].data).data.my;
            }

            let len = resultData['uv'].length;
            for(let i = 0; i < len; i++) {
                let item = {};
                for(let key in tableHeaders) {
                    let field = tableHeaders[key];
                    switch(field) {
                        case 'date':
                            item[key] = moment(endDate).add(-i, 'day').format('YYYY-MM-DD');
                            break;
                        case 'payAmt3':
                            item[key] = (getLastDataSum(resultData['payAmt'], i, 3) / 3).toFixed(0);
                            break;
                        case 'payAmt7':
                            item[key] = (getLastDataSum(resultData['payAmt'], i, 7) / 7).toFixed(0);
                            break;
                        case 'cvr': {
                            let payByrCnt = resultData['payByrCnt'][i];
                            item[key] = ((payByrCnt > 0 ? payByrCnt/ resultData['uv'][i] : 0) * 100).toFixed(1) + '%';
                            break;
                        }
                        case 'cvr3': {
                            let payByrCnt3 = getLastDataSum(resultData['payByrCnt'], i, 3);
                            item[key] = ((payByrCnt3 > 0 ? payByrCnt3 / getLastDataSum(resultData['uv'], i, 3) : 0) * 100).toFixed(1) + '%';
                            break;
                        }
                        case 'cvr7': {
                            let payByrCnt7 = getLastDataSum(resultData['payByrCnt'], i, 7);
                            item[key] = ((payByrCnt7 > 0 ? payByrCnt7 / getLastDataSum(resultData['uv'], i, 7) : 0) * 100).toFixed(1) + '%';
                            break;
                        }
                        case 'cpr': {
                            let cltCnt_cartByrCnt = resultData['cltCnt'][i] + resultData['cartByrCnt'][i];
                            item[key] = ((cltCnt_cartByrCnt > 0 ? cltCnt_cartByrCnt / resultData['uv'][i] : 0) * 100).toFixed(0) + '%';
                            break;
                        }
                        case 'cpr3': {
                            let cltCnt_cartByrCnt3 = getLastDataSum(resultData['cltCnt'], i, 3) + getLastDataSum(resultData['cartByrCnt'], i, 3);
                            item[key] = ((cltCnt_cartByrCnt3 > 0 ? cltCnt_cartByrCnt3 / getLastDataSum(resultData['uv'], i, 3) : 0) * 100).toFixed(0) + '%';
                            break;
                        }
                        case 'cpr7': {
                            let cltCnt_cartByrCnt7 = getLastDataSum(resultData['cltCnt'], i, 7) + getLastDataSum(resultData['cartByrCnt'], i, 7);
                            item[key] = ((cltCnt_cartByrCnt7 > 0 ? cltCnt_cartByrCnt7 / getLastDataSum(resultData['uv'], i, 7) : 0) * 100).toFixed(0) + '%';
                            break;
                        }
                        default:
                            item[key] = resultData[field][i].toFixed(0);
                            break;
                    }
                }
                data.push(item);
            }
            showTable();
        });
    }

    function showTable() {
        $('#ribs_flow_item_table').jsGrid({
            width: "100%",
            height: "100%",
            sorting: true,
            data: data,
            fields: [
                { name: "日期", type: "text", width: 80 },
                { name: "访客数", type: "number", width: 60 },
                { name: "收藏人数", type: "number", width: 70 },
                { name: "加购人数", type: "number", width: 70 },
                { name: "支付件数", type: "number", width: 70 },
                { name: "支付买家数", type: "number", width: 80 },
                { name: "支付金额", type: "number", width: 70 },
                { name: "近3天坑产", type: "number", width: 80 },
                { name: "近7天坑产", type: "number", width: 80 },
                { name: "转化率", type: "number", width: 60 },
                { name: "近3天转化率", type: "number", width: 90 },
                { name: "近7天转化率", type: "number", width: 90 },
                { name: "收藏加购率", type: "number", width: 80 },
                { name: "近3天收藏加购率", type: "number", width: 100 },
                { name: "近7天收藏加购率", type: "number", width: 100 }
            ]
        });
    }

    function getLastDataSum(data, index, days) {
        let result = 0;
        if (index >= days - 1) {
            for (let i = 0; i < days; i++) {
                result += data[index - i];
            }
        }
        return result;
    }

    function toggleTable() {
        if (tableShowing) {
            tableContaier.hide();
        } else {
            tableContaier.show();
        }
        tableShowing = tableContaier.css('display') != 'none';
        flowItemTableLink.text(tableShowing ? '显示图表': '显示表格');
    }

    function getParams(url) {
        let urls = url.split('?');
        let querys = urls[1].split('&');
        let params = {};
        for (let i = 0; i < querys.length; i++) {
            let nv = querys[i].split('=');
            if (nv.length > 1) {
                params[nv[0]] = nv[1];
            }
        }
        return params;
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
                data: opts.data,
                onreadystatechange: function(xhr) {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200 || xhr.status == 304) {
                            resolve({data:xhr.responseText, error: null});
                        } else {
                            var err = new Error(`error-status-${xhr.status}`);
                            resolve({data:null, error: err});
                        }
                    }
                }
            })
        })
    }


    $(function(){
        $(document).on('click', '.source-detail-trend', function() {
            let parent = $('.sycm-flow-item-source-modal');
            let downlink = parent.find('.item-source-dialog-download');
            tableShowing = tableContaier.css('display') != 'none';

            if (flowItemTableLink.parent().length <= 0) {
                downlink.parent().append(flowItemTableLink);
                parent.append(tableContaier);
                parent.css({'width': 'auto', 'margin':'auto 150px'})
            }

            flowItemTableLink.text(tableShowing ? '显示图表': '显示表格');
        })
    })
})();