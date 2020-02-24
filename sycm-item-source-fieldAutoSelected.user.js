// ==UserScript==
// @name         生意参谋选择数据字段
// @namespace    http://it.ribs.com/
// @version      0.1
// @description  生意参谋选择数据字段!
// @author       Ribs
// @updateURL    https://ribs.coding.net/p/tampermonkeyJs/d/tampermonkeyJs/git/raw/master/sycm-item-source-fieldAutoSelected.user.js
// @downloadURL  https://ribs.coding.net/p/tampermonkeyJs/d/tampermonkeyJs/git/raw/master/sycm-item-source-fieldAutoSelected.user.js
// @match        https://sycm.taobao.com/flow/monitor/itemsource*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function check () {
        if (document.querySelectorAll('.ant-checkbox-input:not([disabled])').length > 1) {
            select();
            document.addEventListener('click', function (e) {
                if (e.target.className == "oui-index-picker-reset") {
                    select();
                }
            })
        } else {
            setTimeout(check, 500);
        }
    }

    function select () {
        let inputs = document.querySelectorAll('.ant-checkbox-input');
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i].value != 'uv' && inputs[i].value != 'payAmt' && inputs[i].value != 'payItmCnt' && inputs[i].value != 'payByrCnt' && inputs[i].value != 'payRate' && inputs[i].checked) {
                inputs[i].click();
            }
        }
        let input = document.querySelector('.oui-index-picker-list input[value="uv"]');
        if (input && !input.checked) {
            input.click()
        }
        input = document.querySelector('.oui-index-picker-list input[value="payAmt"]');
        if (input && !input.checked) {
            input.click()
        }
        input = document.querySelector('.oui-index-picker-list input[value="payItmCnt"]');
        if (input && !input.checked) {
            input.click()
        }
        input = document.querySelector('.oui-index-picker-list input[value="payByrCnt"]');
        if (input && !input.checked) {
            input.click()
        }
        input = document.querySelector('.oui-index-picker-list input[value="payRate"]');
        if (input && !input.checked) {
            input.click()
        }
    }

    setTimeout(check, 500);
})();