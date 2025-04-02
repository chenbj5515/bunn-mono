import { chromium } from 'playwright';
import { Context } from "hono";

export const getSeriesCover = async (c: Context) => {
    // 增加超时设置和其他浏览器选项
    const browser = await chromium.launch({ 
        headless: true,
        timeout: 60000 // 增加启动超时时间到60秒
    });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        // 从请求参数中获取搜索查询
        const searchQuery = c.req.query('seriesTitle');
        
        // 验证搜索查询是否存在
        if (!searchQuery) {
            return c.json({
                success: false,
                message: "请提供搜索查询参数 'seriesTitle'"
            }, 400);
        }
        
        const encodedQuery = encodeURIComponent(searchQuery);
        const wikiSearchUrl = `https://en.wikipedia.org/w/index.php?search=${encodedQuery}`;
        
        console.log(`开始访问维基百科搜索页面: ${wikiSearchUrl}`);
        await page.goto(wikiSearchUrl, { timeout: 30000, waitUntil: 'networkidle' });
        console.log('维基百科搜索页面已加载');

        // 在搜索结果页面中查找第一个结果并点击
        // 注意：如果直接重定向到条目页面，就不需要点击搜索结果
        const currentUrl = page.url();
        
        if (currentUrl.includes('/w/index.php?search=')) {
            console.log('在搜索结果页面，查找第一个结果');
            // 查找搜索结果列表中的第一个链接
            const firstResultSelector = '.mw-search-result-heading a';
            await page.waitForSelector(firstResultSelector, { timeout: 10000 });
            
            const firstResult = page.locator(firstResultSelector).first();
            if (await firstResult.count() > 0) {
                console.log('找到第一个搜索结果，准备点击');
                await firstResult.click();
                await page.waitForLoadState('networkidle', { timeout: 30000 });
                console.log('已加载目标页面');
            } else {
                return c.json({
                    success: false,
                    message: "未找到搜索结果"
                }, 404);
            }
        } else {
            console.log('直接跳转到条目页面，无需点击搜索结果');
        }

        // 在目标页面中查找.mw-file-element元素
        await page.waitForSelector('.mw-file-element', { timeout: 10000 }).catch(() => {
            console.log('未能找到.mw-file-element，将尝试其他选择器');
        });

        // 优先查找.mw-file-element元素
        let imageUrl = null;
        const mwFileElement = page.locator('.mw-file-element').first();
        
        if (await mwFileElement.count() > 0) {
            imageUrl = await mwFileElement.getAttribute('src');
            console.log('找到.mw-file-element元素');
        } else {
            // 备选图片选择器
            const possibleImageSelectors = [
                '.image img',
                '.infobox img',
                '.thumb img',
                'img[src*="jpg"]',
                'img[src*="png"]'
            ];
            
            for (const selector of possibleImageSelectors) {
                const image = page.locator(selector).first();
                if (await image.count() > 0) {
                    imageUrl = await image.getAttribute('src');
                    if (imageUrl) {
                        console.log(`找到图片，使用备选选择器: ${selector}`);
                        break;
                    }
                }
            }
        }

        if (imageUrl) {
            // 如果URL是相对路径，则转换为完整URL
            if (imageUrl.startsWith('//')) {
                imageUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
                const baseUrl = new URL(page.url());
                imageUrl = `${baseUrl.protocol}//${baseUrl.host}${imageUrl}`;
            }
            
            return c.json({
                success: true,
                data: {
                    imageUrl,
                    pageUrl: page.url()
                }
            });
        } else {
            return c.json({
                success: false,
                message: '未找到图片'
            }, 404);
        }
    } catch (error) {
        console.error('获取图片失败：', error);
        return c.json({
            success: false,
            message: `获取图片失败: ${error instanceof Error ? error.message : String(error)}`
        }, 500);
    } finally {
        await browser.close();
    }
} 