import api from '../utils/api';

console.log('Bunn 后台脚本已加载');

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONTENT_LOADED') {
    console.log('内容脚本已在页面加载', message.data.url);
  }
});

// 定义API返回的用户数据类型
interface User {
  id: string;
  name: string;
  // 其他用户属性
}

// 与Web应用交互的API调用
async function callWebAPI() {
  try {
    const data = await api.get<User[]>('/api/users');
    return data;
  } catch (error) {
    console.error('API调用失败:', error);
    return null;
  }
}

// 浏览器安装/更新时的处理
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Bunn插件已安装');
    // 可以在这里打开欢迎页面或设置页面
  } else if (details.reason === 'update') {
    console.log('Bunn插件已更新到版本 ' + chrome.runtime.getManifest().version);
  }
}); 