console.log('Bunn 内容脚本已加载');

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_INFO') {
    // 获取页面信息并返回
    const pageInfo = {
      title: document.title,
      url: window.location.href,
    };
    sendResponse(pageInfo);
  }
});

// 初始化内容脚本
function initialize() {
  // 向background发送消息通知已加载
  chrome.runtime.sendMessage({
    type: 'CONTENT_LOADED',
    data: {
      url: window.location.href,
    }
  });
}

// 执行初始化
initialize(); 