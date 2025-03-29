# 浏览器插件和API的跨域设置

## API部署概况

- 所有API都运行在`apps/web`上
- 不过具体来说分为两类：
  - 部分API由hono框架接管
  - 部分API保持原生Next.js API routes形式

## 插件中不同部分的请求域名差异

浏览器插件中不同组件的请求来源有明显差异：

- **popup与background**：请求来自插件自身的域名
- **content script**：请求来自用户当前浏览的页面域名

这种差异直接影响了跨域策略的设计。

## 各部分跨域设置详情

### better-auth API跨域设置

- **位置**：`packages/server/lib/auth.ts`
- **默认配置**：仅允许同源/自己的插件域名访问
- **适用场景**：主要用于身份验证相关接口

### hono接管API的跨域设置

- **位置**：`packages/server/api/index.ts`

- **默认配置**：仅允许同源/自己的插件域名访问

- **使用**：content虽然没有固定域名，但是可以和后台通信，在后台调用接口后返回给content

