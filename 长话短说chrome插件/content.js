// 存储原始文本
let originalTexts = new Map();

// 创建悬浮控制面板
function createControlsOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'controls-overlay';
    overlay.innerHTML = `
        <button id="translate-toggle">翻译</button>
        <button id="summarize-toggle">总结</button>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#translate-toggle').addEventListener('click', toggleTranslation);
    overlay.querySelector('#summarize-toggle').addEventListener('click', toggleSummarization);
}

// 获取需要处理的文本元素
function getTextElements() {
    const selector = 'p, article, section, .article-content, .post-content';
    return Array.from(document.querySelectorAll(selector)).filter(el => {
        const text = el.innerText.trim();
        return text.length > 100; // 只处理较长的文本
    });
}

// 翻译功能
async function translateElement(element) {
    if (!originalTexts.has(element)) {
        originalTexts.set(element, element.innerText);
    }

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'translate',
            text: element.innerText
        });

        if (response.success) {
            element.innerHTML = `
                <div class="translated-text">
                    ${response.translatedText}
                    <button class="toggle-original" data-element-id="${element.id}">显示原文</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Translation failed:', error);
    }
}

// 总结功能
async function summarizeElement(element) {
    if (!originalTexts.has(element)) {
        originalTexts.set(element, element.innerText);
    }

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'summarize',
            text: element.innerText
        });

        if (response.success) {
            element.innerHTML = `
                <div class="summary-box">
                    <h4>摘要：</h4>
                    ${response.summary}
                    <button class="toggle-original" data-element-id="${element.id}">显示原文</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Summarization failed:', error);
    }
}

// 切换原文/翻译
function toggleTranslation() {
    const elements = getTextElements();
    elements.forEach(translateElement);
}

// 切换原文/总结
function toggleSummarization() {
    const elements = getTextElements();
    elements.forEach(summarizeElement);
}

// 恢复原文
function restoreOriginal(elementId) {
    const element = document.getElementById(elementId);
    if (element && originalTexts.has(element)) {
        element.innerText = originalTexts.get(element);
    }
}

// 调试信息处理
function log(...args) {
    console.log('%c[Content Script]', 'color: blue; font-weight: bold', ...args);
}

// 重试函数
async function retry(fn, maxAttempts = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            log(`尝试执行，第 ${attempt} 次`);
            return await fn();
        } catch (error) {
            lastError = error;
            log(`第 ${attempt} 次尝试失败:`, error);
            
            if (attempt < maxAttempts) {
                log(`等待 ${delay}ms 后重试`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

// 发送消息给扩展
async function sendMessageToExtension(message) {
    // 确保消息格式正确
    const messageToSend = {
        type: message.type,
        token: message.token,
        userid: message.userid,
        phone_num: message.phone_num,
        is_member: message.is_member,
        expiry_date: message.expiry_date
    };
    
    return retry(async () => {
        const response = await chrome.runtime.sendMessage(messageToSend);
        log('收到扩展响应:', response);
        return response;
    });
}

// 监听登录页面的消息
window.addEventListener('message', async function(event) {
    log('收到消息ee:', event.data);
    
    // 确保消息来自正确的源
    if (event.origin !== 'http://localhost:3000') {
        log('消息来源不匹配:', event.origin);
        return;
    }
    
    // 处理登录成功消息
    if (event.data.type === 'LOGIN_SUCCESS') {
        log('收到登录成功消息22:', event.data);
        log('数据已保存到 storage111111');
        try {
            // 先检查 userid 的值
            log('数据已保存到 storage1115551');
            const userid = event.data.userid;
            log('数据已保存到 storage22222');
            log('原始 userid:', userid, typeof userid);
            
            // 构造标准格式的存储数据
            const storageData = {
                type: 'LOGIN_SUCCESS',
                token: event.data.token || '',
                userid: String(userid || '1'),
                phone_num: event.data.phone_num || '',
                is_member: Boolean(event.data.is_member),
                expiry_date: event.data.expiry_date || '',
                timestamp: Date.now()
            };
            
            log('准备保存到 storage 的数据:', storageData);
            // 清除所有旧数据
            await chrome.storage.local.clear();
            // 保存新数据
            await chrome.storage.local.set(storageData);
            log('数据已保存到 storage');
            
            // 立即读取并验证保存的数据
            const savedData = await chrome.storage.local.get(null);
            log('从 storage 读取的数据:', savedData);
            log('验证 userid:', savedData.userid, typeof savedData.userid);
            
            // 使用 alert 显示保存的数据
           
            // 通知页面登录成功
            window.postMessage({
                type: 'LOGIN_CONFIRMED',
                success: true
            }, '*');
            
            log('已通知页面登录确认成功');
        } catch (error) {
            log('处理登录消息时出错:', error);
               window.postMessage({
                type: 'LOGIN_CONFIRMED',
                success: false,
                error: error.message
            }, '*');
        }
    } else if (event.data.type === 'LOGOUT') {
        log('收到登出消息');
        try {
            // 清除所有存储的数据
            await chrome.storage.local.clear();
            log('已清除所有存储的数据');
            
            // 通知页面登出成功
            window.postMessage({
                type: 'LOGOUT_CONFIRMED',
                success: true
            }, '*');
            
            log('已通知页面登出确认成功');
        } catch (error) {
            log('处理登出消息时出错:', error);
            window.postMessage({
                type: 'LOGOUT_CONFIRMED',
                success: false,
                error: error.message
            }, '*');
        }
    }
});

// 创建控件覆盖层
function createControlsOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'summary-controls-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000;
        display: none;
    `;
    
    const summarizeButton = document.createElement('button');
    summarizeButton.textContent = '总结选中文本';
    summarizeButton.onclick = handleSummarize;
    
    overlay.appendChild(summarizeButton);
    document.body.appendChild(overlay);
}

// 处理文本选择事件
function handleTextSelection() {
    const selection = window.getSelection();
    const overlay = document.getElementById('summary-controls-overlay');
    
    if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        overlay.style.display = 'block';
        overlay.style.top = `${rect.top + window.scrollY - 50}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
    } else {
        overlay.style.display = 'none';
    }
}

// 处理总结请求
async function handleSummarize() {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
        return;
    }
    
    const text = selection.toString().trim();
    log('选中的文本:', text);
    
    try {
        // 发送消息给扩展的后台脚本
        const response = await sendMessageToExtension({
            type: 'SUMMARIZE',
            text: text
        });
        
        if (response && response.summary) {
            alert(response.summary);
        }
    } catch (error) {
        log('发送总结请求时出错:', error);
        console.error('发送总结请求时出错:', error);
    }
}

// 初始化
function initialize() {
    createControlsOverlay();
    document.addEventListener('mouseup', handleTextSelection);
    log('Content script 已初始化');
}

// 启动插件
initialize();

log('Content script 已加载');
