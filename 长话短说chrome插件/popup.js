import { CONFIG } from './config.js';

// 调试信息处理
function log(...args) {
    console.log('[Popup]', ...args);
}

// 处理手机号脱敏
function maskPhoneNumber(phone) {
    if (!phone) return '';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

// 检查登录状态
async function checkLoginStatus() {
    try {
        log('开始检查登录状态...');
        // 一次性获取所有数据
        const data = await chrome.storage.local.get(null);
        log('从 storage 获取到的数据:', data);
        
        const loginStatusElement = document.getElementById('userInfo');
        const clickTipElement = document.querySelector('.click-tip');
        
        if (data.type === 'LOGIN_SUCCESS' && data.token) {
            // 用户已登录
            log('用户已登录，更新UI');
            const maskedPhone = maskPhoneNumber(data.phone_num);
            loginStatusElement.textContent = maskedPhone;
            loginStatusElement.className = 'logged-in';
            
            if (data.is_member) {
                loginStatusElement.classList.add('is-member');
            }
            
            if (clickTipElement) {
                clickTipElement.textContent = '点击此处退出';
            }
        } else {
            // 用户未登录
            log('用户未登录');
            loginStatusElement.textContent = '未登录';
            loginStatusElement.className = 'not-logged-in';
            
            if (clickTipElement) {
                clickTipElement.textContent = '点击此处登录';
            }
        }
    } catch (error) {
        console.error('检查登录状态时出错:', error);
        log('检查登录状态时出错:', error);
    }
}

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', async () => {
    log('Popup 页面已加载，开始检查登录状态');
    await checkLoginStatus();
    
    // 添加点击事件监听器
    const userStatusElement = document.getElementById('userStatus');
    const clickTipElement = document.querySelector('.click-tip');
    
    if (userStatusElement) {
        userStatusElement.addEventListener('click', handleUserInfoClick);
    }
    
    if (clickTipElement) {
        clickTipElement.addEventListener('click', handleUserInfoClick);
    }
});

// 处理用户信息区域点击
async function handleUserInfoClick() {
    try {
        const data = await chrome.storage.local.get(null);
        log('处理用户点击，当前数据:', data);
        
        if (data.type === 'LOGIN_SUCCESS' && data.token) {
            // 已登录状态，先清除本地存储
            await chrome.storage.local.clear();
            log('已清除本地存储');
            
            // 打开登出页面
            await chrome.tabs.create({ url: CONFIG.LOGOUT_PAGE_URL });
            
            // 更新UI状态
            const loginStatusElement = document.getElementById('userInfo');
            const clickTipElement = document.querySelector('.click-tip');
            
            if (loginStatusElement) {
                loginStatusElement.textContent = '未登录';
                loginStatusElement.className = 'not-logged-in';
            }
            
            if (clickTipElement) {
                clickTipElement.textContent = '点击此处登录';
            }
            
            // 关闭弹窗
            window.close();
        } else {
            // 未登录状态，打开登录页面
            await chrome.tabs.create({ url: CONFIG.LOGIN_PAGE_URL });
            window.close();
        }
    } catch (error) {
        console.error('处理用户点击时出错:', error);
        log('处理用户点击时出错:', error);
    }
}

// 监听存储变化，实时更新状态
chrome.storage.onChanged.addListener((changes, namespace) => {
    log('存储发生变化:', changes);
    if (namespace === 'local') {
        checkLoginStatus();
    }
});

// 监听登录状态变化
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    log('popup 收到消息:', message);
    if (message.type === 'LOGIN_STATE_CHANGED') {
        if (message.data.type === 'LOGGED_OUT') {
            // 处理登出状态
            const loginStatusElement = document.getElementById('userInfo');
            const clickTipElement = document.querySelector('.click-tip');
            
            if (loginStatusElement) {
                loginStatusElement.textContent = '未登录';
                loginStatusElement.className = 'not-logged-in';
            }
            
            if (clickTipElement) {
                clickTipElement.textContent = '点击此处登录';
            }
        } else {
            // 更新登录状态
            checkLoginStatus();
        }
    }
});

// 处理登录按钮点击
function handleLoginClick() {
    log('点击登录按钮');
    chrome.tabs.create({
        url: CONFIG.LOGIN_PAGE_URL,
        active: true
    });
}

// 处理退出按钮点击
function handleLogoutClick() {
    log('点击退出按钮');
    chrome.runtime.sendMessage({ type: 'LOGOUT' }, (response) => {
        if (response && response.success) {
            // showLoginButton();
        }
    });
}
