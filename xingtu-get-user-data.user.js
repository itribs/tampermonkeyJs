// ==UserScript==
// @name         星图达人数据采集
// @namespace    http://it.ribs.com/
// @version      0.1
// @author       Ribs
// @updateURL    https://github.com/itribs/tampermonkeyJs/raw/master/xingtu-get-user-data.user.js
// @downloadURL  https://github.com/itribs/tampermonkeyJs/raw/master/xingtu-get-user-data.user.js
// @match        https://star.toutiao.com/*
// @require      https://cdn.jsdelivr.net/gh/emn178/js-md5/build/md5.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    GM_registerMenuCommand('开始获取', async function () {
        let el = document.querySelector('#xtcj_box');
        if (!el) {
            el = document.createElement('div');
            el.id = 'xtcj_box';
            el.innerHTML = `
<div style="position: fixed;top: 0;right: 0;left: 0;bottom: 0;background-color: rgba(245,246,250, 0.95);height: 100%;z-index: 9000;"></div>
<div style="position: fixed;overflow: auto;top: 0;right: 0;bottom: 0;left: 0;z-index: 9001;outline: 0;">
<div style="width:300px;height:380px;margin:100px auto;background:#fff;border-radius:8px;padding:20px;text-align: center;position: relative;overflow: hidden;box-shadow:0 0 15px 2px rgba(0,0,0,0.2)">
<textarea style="height: 280px;width: 100%;outline: none;border: 1px solid #eee;border-radius:8px;padding:10px;" placeholder="填写达人名称，一行一个。或者填写请求URL"></textarea>
<button class='xtcj_submit' style="height:36px;border-radius:18px;background:#4584e8;color:#fff;margin:10px auto;padding:0 20px;outline: 0;">开始采集</button>
<button class='xtcj_cancel' style="height:36px;border-radius:18px;background:#fff;color:#666;border:1px solid #ddd;margin:10px auto;padding:0 20px;outline: 0;">取消</button>
<div class="xtcj_loading" style="position: absolute;width: 100%;height: 100%;background: rgba(255,255,255,0.8);top: 0;left: 0;text-align: center;display:none;">
<div style="height: 100%;width: 0%;background: rgba(155,195,245, 0.5);transition:width 500ms;"></div>
<span style="position: absolute;left: 0;top: 100px;width: 100%;line-height: 46px;"></span>
</div>
</div>
</div>
`;
            document.body.append(el);
            el.querySelector('.xtcj_cancel').onclick = function () {
                el.style.display = 'none';
            }
            el.querySelector('.xtcj_submit').onclick = function () {
                let content = el.querySelector('textarea').value;
                if (!content) {
                    alert('需要填写达人名称或请求URL');
                    return;
                }
                if (content.startsWith('https://')) {
                    queryWithUrl(content);
                } else {
                    queryWithName(content);
                }
            }
        }
        el.style.display = 'block';
        el.querySelector('textarea').focus();
    });

    async function queryWithUrl (url) {

        loading(true);

        let uri = getURI(url);
        uri.params['limit'] = 30;
        uri.params['page'] = 1;

        let datas = [];
        let totalCount = -1;
        let index = 0;

        while (true) {

            let userDatas = await request({
                url: uri.getFullUrl(),
                responseType: 'json'
            });

            if (totalCount == -1) {
                totalCount = userDatas.data.data.pagination.total_count;
            }

            if (userDatas.data.data.authors.length <= 0) {
                break;
            } else {
                uri.params['page'] += 1;
            }

            for (let i = 0; i < userDatas.data.data.authors.length; i++) {

                let user = userDatas.data.data.authors[i];

                index++;
                loadingProgress(parseInt(index / totalCount * 100), user.nick_name);

                let userData = await getUserData(user);
                datas.push(userData);

            }
        }

        download([
            '达人',
            '粉丝数量',
            '报价',
            '日常完播率',
            '任务完播率',
            '日常互动率',
            '任务互动率',
            '日常播放量',
            '任务播放量',
            '传播指数',
            '重度用户',
            '女性占比',
            '苹果占比',
            '年龄占比'
        ], datas)

        loading(false);
    }

    async function queryWithName (names) {
        let nameArr = names.split('\n');
        let datas = [];

        loading(true);

        for (let i = 0; i < nameArr.length; i++) {

            loadingProgress(parseInt(i / nameArr.length * 100), nameArr[i]);

            let userDatas = await request({
                url: `https://star.toutiao.com/v/api/demand/author_list/?limit=20&need_detail=true&page=1&platform_source=1&key=${nameArr[i]}&task_category=1&order_by=score&only_nick_name=true`,
                responseType: 'json'
            });

            let user = null;
            for (let j = 0; j < userDatas.data.data.authors.length; j++) {
                if (userDatas.data.data.authors[j].nick_name == nameArr[i]) {
                    user = userDatas.data.data.authors[j];
                    break;
                }
            }

            if (!user) {
                datas.push([nameArr[i], 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ''])
                continue;
            }

            let userData = await getUserData(user);

            datas.push(userData)
        }

        download([
            '达人',
            '粉丝数量',
            '报价',
            '日常完播率',
            '任务完播率',
            '日常互动率',
            '任务互动率',
            '日常播放量',
            '任务播放量',
            '传播指数',
            '重度用户',
            '女性占比',
            '苹果占比',
            '年龄占比'
        ], datas)

        loading(false);
    }

    async function getUserData (user) {
        let userId = user.id;
        let follower = tranNumber(user.follower);
        let price = getPrice(user.price_info);

        let itemInfoData = await request({
            url: `https://star.toutiao.com/v/api/demand/author_item_info/?author_id=${userId}&platform_source=1&platform_channel=1`,
            responseType: 'json'
        });
        let rates = itemInfoData.data.data.data_description;
        let video_view_rate = (rates.video_view_rate.rate * 100).toFixed(1) + '%';
        let video_view_rate_enrollment = (rates.video_view_rate_enrollment.rate * 100).toFixed(1) + '%';
        let interaction = (rates.interaction.rate * 100).toFixed(1) + '%';
        let interaction_enrollment = (rates.interaction_enrollment.rate * 100).toFixed(1) + '%';
        let play_medium = tranNumber(rates.play_medium.rate);
        let play_medium_enrollment = tranNumber(rates.play_medium_enrollment.rate);

        let sign = getSign({
            author_id: userId,
            platform_source: 1,
            platform_channel: 1,
            service_name: "author.AdStarAuthorService",
            service_method: "AuthorScoreForDemander"
        })
        let indexDatas = await request({
            url: `https://star.toutiao.com/h/api/gateway/handler_get/?author_id=${userId}&platform_source=1&platform_channel=1&service_name=author.AdStarAuthorService&service_method=AuthorScoreForDemander&sign=${sign}`,
            responseType: 'json'
        });
        let spreadIndex = indexDatas.data.data.spread_index.toString();
        spreadIndex = parseFloat(spreadIndex.slice(0, 2) + '.' + spreadIndex.slice(2)).toFixed(0);

        let heavyFan = 0;
        let fanSum = 0;
        let female = 0;
        let genderSum = 0;
        let iphone = 0;
        let deviceSum = 0;
        let age = '';
        let ageValue = 0;
        let ageSum = 0;
        let distributionDatas = await request({
            url: `https://star.toutiao.com/v/api/demand/author_fans_distribution/?author_id=${userId}&scope=0&platform_source=1`,
            responseType: 'json'
        });
        for (let i = 0; i < distributionDatas.data.data.length; i++) {
            if (distributionDatas.data.data[i].type == 16) {
                for (let j = 0; j < distributionDatas.data.data[i].distribution_list.length; j++) {
                    if (distributionDatas.data.data[i].distribution_list[j].distribution_key == '重度') {
                        heavyFan = distributionDatas.data.data[i].distribution_list[j].distribution_value;
                    }
                    fanSum += distributionDatas.data.data[i].distribution_list[j].distribution_value;
                }
            } else if (distributionDatas.data.data[i].type == 1) {
                for (let j = 0; j < distributionDatas.data.data[i].distribution_list.length; j++) {
                    if (distributionDatas.data.data[i].distribution_list[j].distribution_key == 'female') {
                        female = distributionDatas.data.data[i].distribution_list[j].distribution_value;
                    }
                    genderSum += distributionDatas.data.data[i].distribution_list[j].distribution_value;
                }
            } else if (distributionDatas.data.data[i].type == 8) {
                for (let j = 0; j < distributionDatas.data.data[i].distribution_list.length; j++) {
                    if (distributionDatas.data.data[i].distribution_list[j].distribution_key == 'iPhone') {
                        iphone = distributionDatas.data.data[i].distribution_list[j].distribution_value;
                    }
                    deviceSum += distributionDatas.data.data[i].distribution_list[j].distribution_value;
                }
            } else if (distributionDatas.data.data[i].type == 2) {
                for (let j = 0; j < distributionDatas.data.data[i].distribution_list.length; j++) {
                    if (distributionDatas.data.data[i].distribution_list[j].distribution_value > ageValue) {
                        age = distributionDatas.data.data[i].distribution_list[j].distribution_key;
                        ageValue = distributionDatas.data.data[i].distribution_list[j].distribution_value;
                    }
                    ageSum += distributionDatas.data.data[i].distribution_list[j].distribution_value;
                }
            }
        }
        heavyFan = parseFloat(heavyFan / fanSum * 100).toFixed(0) + '%';
        female = parseFloat(female / genderSum * 100).toFixed(0) + '%';
        iphone = parseFloat(iphone / deviceSum * 100).toFixed(0) + '%';
        ageValue = parseFloat(ageValue / ageSum * 100).toFixed(0) + '%';

        return [
            user.nick_name,
            follower,
            price,
            video_view_rate,
            video_view_rate_enrollment,
            interaction,
            interaction_enrollment,
            play_medium,
            play_medium_enrollment,
            spreadIndex,
            heavyFan,
            female,
            iphone,
            age + '岁（' + ageValue + '）'
        ];
    }

    function loading (show) {
        document.querySelector('#xtcj_box .xtcj_loading').style.display = show ? 'block' : 'none';
    }

    function loadingProgress (percentage, text) {
        let el = document.querySelector('#xtcj_box .xtcj_loading');
        el.querySelector('div').style.width = percentage + '%';
        el.querySelector('span').innerHTML = `<font style="font-size:86px">${percentage}%</font><br />${text}`;
    }

    function saveContent (content, fileName) {
        let downLink = document.createElement('a')
        downLink.download = fileName
        let blob = new Blob([content])
        downLink.href = URL.createObjectURL(blob)
        document.body.appendChild(downLink)
        downLink.click()
        document.body.removeChild(downLink)
    }

    function download (titles, datas) {
        let content = `\uFEFF"${titles.join('","')}"\n`;
        for (let i = 0; i < datas.length; i++) {
            content += `"${datas[i].join('","')}"\n`;
        }
        saveContent(content, '达人数据.csv');
    }

    function getPrice (data) {
        for (let i = 0; i < data.length; i++) {
            if (data[i].desc == '1-20s视频') {
                return data[i].price;
            }
        }
        return '未知'
    }

    function tranNumber (num, point) {
        let numStr = num.toString()
        if (numStr.length < 5) {
            return numStr;
        }
        else if (numStr.length > 8) {
            return parseInt(num / 100000000) + '亿';
        }
        else if (numStr.length > 4) {
            return parseInt(num / 10000) + '万';
        }
    }

    function getSign (t) {
        for (var e = Object.keys(t).sort(), a = "", n = 0, r = e.length; n < r; n++) {
            var s = e[n]
                , l = t[s];
            null == l ? delete t[s] : ["string", "number"].includes(void 0 === l ? "undefined" : (typeof l)) ? a += s + l : a += s + s
        }
        return md5(a + "e39539b8836fb99e1538974d3ac1fe98")
    }

    function getURI (url) {
        let urls = url.split('?');
        let URI = {
            url: urls[0],
            params: {},
            getQuery: function () {
                let queryParams = [];
                for (let key in this.params) {
                    queryParams.push(key + '=' + this.params[key]);
                }
                return queryParams.join('&');
            },
            getFullUrl: function () {
                return this.url + '?' + this.getQuery();
            }
        }
        if (urls.length > 1) {
            let querys = urls[1].split('&');
            let params = {};
            for (let i = 0; i < querys.length; i++) {
                let nv = querys[i].split('=');
                if (nv.length > 1) {
                    params[nv[0]] = nv[1];
                }
            }
            URI.params = params;
        }
        return URI;
    }

    function request (opts) {
        if (opts.data && typeof (opts.data) == 'object') {
            let kvs = '';
            for (var key in opts.data) {
                if (kvs.length > 0) {
                    kvs += "&";
                }
                kvs += key + "=" + opts.data[key];
            }
            opts.data = kvs;
        }
        return new Promise(function (resolve) {
            opts.onreadystatechange = function (xhr) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200 || xhr.status == 304) {
                        resolve({ data: xhr.response, error: null });
                    } else {
                        var err = new Error(`error-status-${xhr.status}`);
                        resolve({ data: null, error: err });
                    }
                }
            }
            GM_xmlhttpRequest(opts);
        })
    }
})();
