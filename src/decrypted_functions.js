// 解密后的关键函数

/**
 * 计算与给定时间差的分钟数
 * @param {string} timestamp 时间戳
 * @returns {number} 分钟差
 */
const minsDiff = (timestamp) => Math.floor((new Date() - new Date(timestamp)) / 60000);

/**
 * 复制内容到剪贴板
 * @param {string} text 要复制的文本
 */
const copy = (text) => {
    const copyElement = $("#copy");
    copyElement.val(text).show().select();
    document.execCommand("copy");
    copyElement.hide();
    swal({
        title: "复制成功",
        icon: "success",
        timer: 1000,
        buttons: false
    });
};

/**
 * 加载国家/地区代码映射
 * @returns {Promise<Object>} 国家/地区代码映射
 */
const loadCountryMapping = async () => {
    const response = await fetch("./src/country.json");
    return response.json();
};

/**
 * 生成账号HTML显示
 * @param {Object} account 账号信息
 * @param {Object} countryMap 国家/地区代码映射
 * @returns {string} HTML字符串
 */
const generateAccountHTML = (account, countryMap) => {
    return `<div class="card border-success mb-3">
        <div class="card-header bg-transparent border-success">
            <span class="card-title h5">${account.username}</span>
            <span class="float-end fi fi-${countryMap[account.country] || 'un'}"></span>
        </div>
        <div class="card-body">
            <small class="text-muted">${account.country || ''}</small>
            <p class="text-break">${account.password} <code class="float-end">${minsDiff(account.time)}分钟前</code></p>
            <button class="btn btn-outline-secondary waves-effect" onclick="copy('${account.username}\\n${account.password}')">复制账号和密码</button>
        </div>
    </div>`;
};

/**
 * 加载并显示可用账号
 * @param {Array} accounts 账号列表
 * @param {Object} countryMap 国家/地区代码映射
 */
const load = (accounts, countryMap) => {
    const validAccounts = accounts.filter(acc => acc.status === 1);
    const accountsHTML = validAccounts.map(acc => generateAccountHTML(acc, countryMap)).join('');
    document.getElementById("apple").innerHTML = accountsHTML;
};

/**
 * 解密字符串
 * @param {string} encryptedString 加密的字符串
 * @returns {string} 解密后的字符串
 */
const decryptString = (encryptedString) => {
    // 解密字母的函数
    const decryptChar = (char) => {
        if (!/[a-zA-Z]/.test(char)) return char;
        
        // 确定是大写还是小写字母
        const base = char >= 'a' ? 97 : 65;
        
        // 凯撒密码变换：向左移动3位，然后确保在字母范围内
        return String.fromCharCode(((char.charCodeAt(0) - base - 3 + 26) % 26) + base);
    };
    
    // 先用base64解码，然后对每个字符进行解密，再反转，最后连接
    return atob(encryptedString).split('').map(decryptChar).reverse().join('');
};

/**
 * 格式化URL
 * @param {string} url 需要格式化的URL字符串
 * @returns {string} 格式化后的URL
 */
const formatUrl = (url) => {
    return "https://" + url.replace(/-/g, '/').replace(/_/g, '.');
};

/**
 * 处理加密的URL字符串
 * @param {string} encryptedUrls 加密的URL字符串
 * @returns {Object} 两部分URL
 */
const processUrls = (encryptedUrls) => {
    const [part1Encrypted, part2Encrypted] = decryptString(encryptedUrls).split('||');
    
    return {
        part1: decryptString(part1Encrypted).split('\n').map(formatUrl),
        part2: decryptString(part2Encrypted).split('\n').map(formatUrl)
    };
};

/**
 * 带超时的fetch请求
 * @param {string} url 请求URL
 * @param {Object} options fetch选项
 * @param {number} timeout 超时时间(毫秒)
 * @returns {Promise} fetch结果
 */
const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timeoutId));
};

/**
 * 带重试的fetch请求
 * @param {string} url 请求URL
 * @param {Object} options fetch选项
 * @param {number} retries 重试次数
 * @returns {Promise} fetch结果
 */
const fetchWithRetry = async (url, options = {}, retries = 3) => {
    try {
        const response = await fetchWithTimeout(url, options);
        if (response.ok) return response;
        throw new Error("Response error: " + response.status);
    } catch (error) {
        if (retries > 0) {
            // 等待1秒后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
};

/**
 * 处理并显示账号信息
 * @param {Object} urls 包含两部分URL的对象
 * @param {Object} countryMap 国家/地区代码映射
 */
const processAccounts = async (urls, countryMap) => {
    // 从JSON API获取账号数据
    const fetchJsonAccount = async (url) => {
        const response = await fetchWithRetry(url, {
            headers: { Accept: "application/json" }
        });
        return response.json();
    };
    
    // 从HTML内容中提取账号数据
    const fetchHtmlAccount = async (url) => {
        const response = await fetchWithRetry(url);
        const text = await response.text();
        const match = text.match(/ad\s*=\s*'([^']+)'/);
        return match ? JSON.parse(match[1]) : null;
    };
    
    try {
        // 并行获取两部分数据
        const jsonAccounts = await Promise.all(urls.part1.map(fetchJsonAccount));
        const htmlAccounts = await Promise.all(urls.part2.map(fetchHtmlAccount));
        
        // 合并两部分数据，筛选可用账号并显示
        [...jsonAccounts, ...htmlAccounts]
            .filter(acc => acc.status === "ok" && acc.data)
            .forEach(acc => load(acc.data, countryMap));
    } catch (error) {
        console.error("处理账号时出错", error);
    }
};

/**
 * 初始化应用
 * @param {string} affId 推广ID(可选)
 */
const initialize = async (affId) => {
    // 获取推广ID，默认为"123456"
    const aff = affId || new URLSearchParams(window.location.search).get("aff") || "123456";
    
    // 添加推广链接
    const promotionHTML = `
        <div class="mb-3">
            <a class="btn btn-outline-primary btn-lg" href="https://ssr.otakuyun.net/register?aff=${aff}">立即注册免费代理账号</a>
        </div>`;
    
    document.querySelector(".row").insertAdjacentHTML("beforeend", promotionHTML);
    
    try {
        // 加载国家/地区映射
        const countryMapping = await loadCountryMapping();
        
        // 这是加密的账号源数据
        const encryptedData = "eU1tUTJCY0Eyd0pDaUNaQndCR0M0SEdScUVXUW5rcFBjZmNRMURjUG5vcFAyUEdkNGZjUXJJR0M1SEdkTmZKQ2FQM2RpQzNkbjlvQ2sxYlA0akdQMGYyUDRmMkM0anBQcElHUjFUR2RySUdQcmsyUGFqcFAyQkdkc3NEZXlDcGQzOG9ndVUyQXBJWk9yQ0pRY0JtUW5rSlJyb1dkY0JXUHBvSkNjbnBQb0NaUXJVbVBibldQMmZtRnpNSmRuczJBMndKQ2lDWkJ3ZkdSYmZKUGFCWlJyWVpkNGZjUWNuR1IyZkdRY1BjUHJnSkNjbjJRYVRKUU5UMmZjOUpkdmcyQXoxSmZ3OTFldm9LZHdqWlJva1dRYmptQ3pIV1A0VFdRNUhHQzJmV0NzZ2NDb2dXQ29rV1E1VGNQTnZKZ3pDM2dpQzNkbjlvQ2sxRlAzSFdSMkxXUW9DR1AwTFdQcG9XUjFCWlAyTFdQY1RwUTFmR2RuUW1RMXJUQ3BncVBxOW9ndVUyQXBJWk8zSG1RMVhtUG9RY0Nwb1dQcFFHUGNuY1EwVEpDekJKUjBQV1ByZ1pSelhtRjFyS2ZyTWNBMndKQ2lDWkJ3bjJDblFtQ25NV2RjQmNQMGZaUXBrSkMwblpSMGptUXpCV1E1TEdkNW5tUE4wWkJzd1poaUMzZG45b0NrMVZQcW9HQ2NqbVBzQ2NDb29XUXFvSlFuQ0dRM2pwUXFrR2Ryb1dDelhKUTRyakI0cjJQdDlvZ3VVMkFwSVpPMG5aUTNYV1E0SFdQcENHQzFqR1FibjJRYmpjUTBIV2Rxb0dQck1jUXNFbUZwbzJQY0QzQTJ3SkNpQ1pCd0hHQ25rMlByWVdSMFRXQzFuSmQyWEdQMm5aUHBDMlB6WFdDY1RKUG9vY1BOQlpCb29XZ2lDM2RuOW9DazFGUTRUcFAyUGNQckVXUXFZR1JjRFdRNEJwUGFUSlBjUFdDMExHZDVYSlE0cnpkM0hXaGE5b2d1VTJBcElaTzRqR0Nva0dQYlRXUDJCR2Q0TFdScG9XUnBFR1E1WFdRblVjUXNrMlFjQnBGYlRtaHg5MkEyd0pDaUNaQndmSkNiamNQcUlXQ25ZY0MyTEdRcFVHQ29JV1EwQm1QYmZjUG9VbUNhWG1DfHw9PURlenNwZm85b2d1VTJBcElaT2JUY1AyajJDYmpKQzNYR2Q0VEpRblFjUTJuSlFxQ21RekxtUW5rcENiZnBGNm8yZzRyMkEyd0pDaUNaQnducENvVXBQNUxHUmJYV0NwTVdkelhaUTNYR2Rub0pDc2tHUTNmV2QyWHBD";
        
        // 处理并显示账号
        await processAccounts(processUrls(encryptedData), countryMapping);
    } finally {
        // 移除加载指示器
        document.getElementById("loading")?.remove();
    }
};

// 将初始化函数绑定到window对象
window.X = initialize; 