// 导入配置
import { CONFIG } from './config.js';

// 调试信息处理
function log(...args) {
    console.log('[Background]', ...args);
}

log('Background script 已加载');