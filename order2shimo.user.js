// ==UserScript==
// @name         异常快递记录石墨
// @namespace    http://it.ribs.com/
// @version      0.1
// @description  异常快递记录石墨
// @author       Ribs
// @match        https://*/*
// @updateURL    https://github.com/itribs/tampermonkeyJs/raw/master/order2shimo.user.js
// @downloadURL  https://github.com/itribs/tampermonkeyJs/raw/master/order2shimo.user.js
// @noframes
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';
    if(window.location.toString().startsWith('https://trade.taobao.com/trade/detail/trade_order_detail.htm?biz_order_id=')) {
        let kvs = window.location.toString().split('?')[1].split('&')
        let params = {}
        for (let i = 0; i < kvs.length; i++) {
            let kv = kvs[i].split('=')
            if (kv.length == 2) {
                params[kv[0]]=kv[1]
            }
        }
        if (params['biz_order_id'] && params['s'] == 'sm') {
            let html = document.body.innerHTML
            let matchResults = html.match(/JSON\.parse\('(.*)'\);/)
            if (matchResults && matchResults.length > 1) {
                try {
                    let data = eval(matchResults[0])
                    start(params['biz_order_id'], data)
                } catch (e) {
                    console.log(e)
                }
            } else {
                reject(new Error('not found data'))
            }
            return
        }
    }

    GM_registerMenuCommand("记录", function() {
        let order = prompt('输入订单号')
        GM_openInTab(`https://trade.taobao.com/trade/detail/trade_order_detail.htm?biz_order_id=${order}&s=sm`, {
            active: true
        })
    })

    async function start(order, data) {
        let nick = data.mainOrder.buyer.nick
        let logisticsName = ""
        let logisticsNum = ""
        let address = ""
        for (let i = 0; i < data.tabs.length; i++) {
            if (data.tabs[i].id == "logistics") {
                logisticsName = data.tabs[i].content.logisticsName
                logisticsNum = data.tabs[i].content.logisticsNum
                address = data.tabs[i].content.address
                break;
            }
        }
        let result = await submitShimo(order, nick, logisticsName, logisticsNum, address, '', '等待快递退回');
        if (result.error == null) {
            window.location = 'https://shimo.im/sheets/gtCGWV9xQ8WtyXC6/MODOC'
        } else {
            alert('提交失败~')
        }
    }

    async function submitShimo(order, nick, logisticsName, logisticsNum, address, problem, progress) {
        return request({
            method: "post",
            url: 'https://shimo.im/api/newforms/forms/9CrdxgCDG3wyYwhH/submit',
            headers: {
                "Content-Type": "application/json;charset=UTF-8"
            },
            data: {
                "formRev": 32,
                "userFinger": "-1",
                "userName": "",
                "responseContent": [
                    { "type": 0, "guid": "sgvrM0Qn", "text": { "content": order } },
                    { "type": 0, "guid": "Lc5AV5FW", "text": { "content": nick } },
                    { "type": 0, "guid": "MEQOYPza", "text": { "content": logisticsName } },
                    { "type": 0, "guid": "3TFSeaF8", "text": { "content": logisticsNum } },
                    { "type": 0, "guid": "fTgsQzWC", "text": { "content": address } },
                    { "type": 0, "guid": "DZTCxwBs", "text": { "content": problem } },
                    { "type": 0, "guid": "hlZ2eVYc", "text": { "content": progress } }
                ]
            }
        })
    }

    function request(opts) {
        if (opts.data && typeof(opts.data) == 'object') {
            if (opts.headers['Content-Type'].indexOf('json') > - 1) {
                opts.data = JSON.stringify(opts.data)
            } else {
                let kvs = ''
                for (var key in opts.data) {
                    if (kvs.length > 0) {
                        kvs += "&"
                    }
                    kvs += key + "=" + opts.data[key]
                }
                opts.data = kvs
            }
        }
        return new Promise(function(resolve) {
            GM_xmlhttpRequest({
                method: opts.method,
                url: opts.url,
                headers: opts.headers,
                data: opts.data,
                onreadystatechange: function(xhr) {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200 || xhr.status == 204) {
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
})();
