// ==UserScript==
// @name         阿里巴巴获取运费列表
// @namespace    http://it.ribs.com/
// @version      0.1
// @author       Ribs
// @updateURL    https://github.com/itribs/tampermonkeyJs/raw/master/alibaba-get-calculate-freight.user.js
// @downloadURL  https://github.com/itribs/tampermonkeyJs/raw/master/alibaba-get-calculate-freight.user.js
// @match        *://*.1688.com/*
// @run-at       document-end
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    let requestResolve = null;

    excJs(`
        function jQuery17209019498822421994_15837477531811(areas) {
            window.postMessage({ type:'getData', data: areas.data.areaList.CN_1001 }, "*")
        }
        function jQuery17209019498822421994_15837477531812(result) {
            window.postMessage({ type:'getData', data: result.data }, "*")
        }
    `);

    window.addEventListener("message", function (e) {
        if (e.data && e.data.type == 'getData') {
            if (requestResolve) {
                requestResolve(e.data.data);
                requestResolve = null;
            }
        }
    }, false);

    GM_registerMenuCommand('开始获取', async function () {
        let paramUrl = prompt("请输入您的参数URL");
        let params = getParams(paramUrl);
        let weight = params['weight'];
        let price = params['price'];
        let templateId = params['templateId'];
        let memberId = params['memberId'];
        let volume = params['volume'];
        let offerId = params['offerId'];
        let flow = params['flow'];
        let excludeAreaCode4FreePostage = params['excludeAreaCode4FreePostage'];

        let areas = await request("https://laputa.1688.com/offer/ajax/AreaList.do?callback=jQuery17209019498822421994_15837477531811");
        let content = '';
        for (let provinceKey in areas) {
            content += provinceKey.split('_')[0] + ':\n';
            for (let cityKey in areas[provinceKey]) {
                let city = areas[provinceKey][cityKey];
                let codes = city.split('_');
                let countryCode = codes[0];
                let provinceCode = codes[1];
                let cityCode = codes[2];

                let kdfs = await request(`https://laputa.1688.com/offer/ajax/CalculateFreight.do?callback=jQuery17209019498822421994_15837477531812&amount=1&weight=${weight}&price=${price}&templateId=${templateId}&memberId=${memberId}&volume=${volume}&offerId=${offerId}&flow=${flow}&excludeAreaCode4FreePostage=${excludeAreaCode4FreePostage}&countryCode=${countryCode}&provinceCode=${provinceCode}&cityCode=${cityCode}`);

                content += '——' + cityKey.split('_')[0] + '：' + kdfs.costs[0].cost + '\n';
            }
        }

        console.log(content);

    })

    function excJs (js) {
        let script = document.createElement('script');
        script.innerText = js;
        script.onload = function () {
            script.remove();
            resolve();
        }
        document.head.append(script);
    }

    function request (url) {
        return new Promise(function (resolve) {
            let script = document.createElement('script');
            script.src = url;
            script.onload = function () {
                script.remove();
            }
            requestResolve = resolve;
            document.head.append(script);
        });
    }

    function getParams (url) {
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
})();
