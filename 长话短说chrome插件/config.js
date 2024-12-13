// 扩展配置
export const CONFIG = {
    // API基础URL
    baseUrl: 'http://localhost:3000',
    
    // 登录页面URL
    LOGIN_PAGE_URL: 'http://localhost:3000/login.html?from=chrome-extension',
    
    // 登出页面URL
    LOGOUT_PAGE_URL: 'http://localhost:3000/logout.html?from=chrome-extension',
    
    // 状态页面URL
    statusUrl: 'http://localhost:3000/status.html?from=chrome-extension',
    
    // 调试模式
    debug: true,
    
    // 存储键名
    storageKeys: {
        userInfo: 'user_info'  // 改用更规范的命名
    }
};
