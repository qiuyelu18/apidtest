/**
 * 这个文件尝试解释加密数据的解密过程，并解密一些示例URL
 */

// 解密字母函数
function decryptChar(char) {
    if (!/[a-zA-Z]/.test(char)) return char;
    
    const base = char >= 'a' ? 97 : 65;
    // 凯撒密码变换：向左移动3位，确保在字母范围内
    return String.fromCharCode(((char.charCodeAt(0) - base - 3 + 26) % 26) + base);
}

// 解密字符串函数
function decryptString(encryptedString) {
    try {
        // 1. 先进行Base64解码
        const base64Decoded = atob(encryptedString);
        
        // 2. 逐字符使用凯撒密码解密
        const caesarDecrypted = base64Decoded.split('').map(decryptChar);
        
        // 3. 反转字符串
        const reversed = caesarDecrypted.reverse();
        
        // 4. 连接成最终结果
        return reversed.join('');
    } catch (error) {
        console.error("解密失败:", error);
        return "解密失败: " + error.message;
    }
}

// 格式化URL
function formatUrl(url) {
    return "https://" + url.replace(/-/g, '/').replace(/_/g, '.');
}

// 处理加密的URL
function processUrls(encryptedUrls) {
    const decrypted = decryptString(encryptedUrls);
    console.log("第一层解密结果:", decrypted);
    
    const [part1Encrypted, part2Encrypted] = decrypted.split('||');
    
    // 解密第一部分URLs
    const part1Decrypted = decryptString(part1Encrypted);
    console.log("第二层解密结果(part1):", part1Decrypted);
    
    // 解密第二部分URLs
    const part2Decrypted = decryptString(part2Encrypted);
    console.log("第二层解密结果(part2):", part2Decrypted);
    
    // 格式化URLs
    const part1Urls = part1Decrypted.split('\n').map(formatUrl);
    const part2Urls = part2Decrypted.split('\n').map(formatUrl);
    
    console.log("最终URLs (part1):", part1Urls);
    console.log("最终URLs (part2):", part2Urls);
    
    return { part1: part1Urls, part2: part2Urls };
}

// 这是从代码中提取的加密数据
const encryptedData = "eU1tUTJCY0Eyd0pDaUNaQndCR0M0SEdScUVXUW5rcFBjZmNRMURjUG5vcFAyUEdkNGZjUXJJR0M1SEdkTmZKQ2FQM2RpQzNkbjlvQ2sxYlA0akdQMGYyUDRmMkM0anBQcElHUjFUR2RySUdQcmsyUGFqcFAyQkdkc3NEZXlDcGQzOG9ndVUyQXBJWk9yQ0pRY0JtUW5rSlJyb1dkY0JXUHBvSkNjbnBQb0NaUXJVbVBibldQMmZtRnpNSmRuczJBMndKQ2lDWkJ3ZkdSYmZKUGFCWlJyWVpkNGZjUWNuR1IyZkdRY1BjUHJnSkNjbjJRYVRKUU5UMmZjOUpkdmcyQXoxSmZ3OTFldm9LZHdqWlJva1dRYmptQ3pIV1A0VFdRNUhHQzJmV0NzZ2NDb2dXQ29rV1E1VGNQTnZKZ3pDM2dpQzNkbjlvQ2sxRlAzSFdSMkxXUW9DR1AwTFdQcG9XUjFCWlAyTFdQY1RwUTFmR2RuUW1RMXJUQ3BncVBxOW9ndVUyQXBJWk8zSG1RMVhtUG9RY0Nwb1dQcFFHUGNuY1EwVEpDekJKUjBQV1ByZ1pSelhtRjFyS2ZyTWNBMndKQ2lDWkJ3bjJDblFtQ25NV2RjQmNQMGZaUXBrSkMwblpSMGptUXpCV1E1TEdkNW5tUE4wWkJzd1poaUMzZG45b0NrMVZQcW9HQ2NqbVBzQ2NDb29XUXFvSlFuQ0dRM2pwUXFrR2Ryb1dDelhKUTRyakI0cjJQdDlvZ3VVMkFwSVpPMG5aUTNYV1E0SFdQcENHQzFqR1FibjJRYmpjUTBIV2Rxb0dQck1jUXNFbUZwbzJQY0QzQTJ3SkNpQ1pCd0hHQ25rMlByWVdSMFRXQzFuSmQyWEdQMm5aUHBDMlB6WFdDY1RKUG9vY1BOQlpCb29XZ2lDM2RuOW9DazFGUTRUcFAyUGNQckVXUXFZR1JjRFdRNEJwUGFUSlBjUFdDMExHZDVYSlE0cnpkM0hXaGE5b2d1VTJBcElaTzRqR0Nva0dQYlRXUDJCR2Q0TFdScG9XUnBFR1E1WFdRblVjUXNrMlFjQnBGYlRtaHg5MkEyd0pDaUNaQndmSkNiamNQcUlXQ25ZY0MyTEdRcFVHQ29JV1EwQm1QYmZjUG9VbUNhWG1DfHw9PURlenNwZm85b2d1VTJBcElaT2JUY1AyajJDYmpKQzNYR2Q0VEpRblFjUTJuSlFxQ21RekxtUW5rcENiZnBGNm8yZzRyMkEyd0pDaUNaQnducENvVXBQNUxHUmJYV0NwTVdkelhaUTNYR2Rub0pDc2tHUTNmV2QyWHBD";

console.log("解密过程分析:");
console.log("==============");

// 尝试解密数据
const urls = processUrls(encryptedData);

// 分析解密出的URL结构和来源
console.log("\n解密URL分析:");
console.log("==============");
console.log("part1 URLs (可能是JSON API):");
urls.part1.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
});

console.log("\npart2 URLs (可能是HTML内容解析):");
urls.part2.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
});

console.log("\n解密分析总结:");
console.log("==============");
console.log("1. 加密方式采用了多层保护: Base64编码 + 凯撒密码 + 字符串反转");
console.log("2. 项目从两种不同类型的源获取账号信息:");
console.log("   a. 直接返回JSON的API接口");
console.log("   b. 需要从HTML页面中提取信息的网站");
console.log("3. 获取到的账号信息会以卡片形式展示，并包含国家/地区信息以及更新时间");
console.log("4. 项目通过定期从这些源获取最新可用的免费Apple ID账号信息"); 