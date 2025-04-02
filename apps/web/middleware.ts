import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@server/lib/auth';

const locales = ['en', 'zh', 'zh-TW'];

// 获取并设置用户语言偏好
function getAndSetLocale(request: NextRequest): string {
  // 检查 Cookie 中是否有语言偏好
  const localeCookie = request.cookies.get('NEXT_LOCALE');
  if (localeCookie?.value && locales.includes(localeCookie.value)) {
    return localeCookie.value;
  }

  // 获取系统语言偏好
  const acceptLanguage = request.headers.get('accept-language') || '';
  const systemLocale = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase() || 'en';

  // 确定最终使用的语言
  const finalLocale = locales.includes(systemLocale) ? systemLocale : 'en';

  // 创建响应对象来设置 cookie
  const response = NextResponse.next();
  response.cookies.set('NEXT_LOCALE', finalLocale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60, // 一年有效期
    sameSite: 'lax'
  });

  return finalLocale;
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)']
};

// 创建一个处理国际化的中间件
const intlMiddleware = createMiddleware(routing);

// 导出主中间件函数
export default async function middleware(req: NextRequest) {
  const session = await getSession();
  const locale = getAndSetLocale(req);
  const pathname = req.nextUrl.pathname;
  console.log(session, 'session');

  // 处理根路由重定向
  if (pathname === `/${locale}`) {
    // 从Cookie中获取会话信息
    if (!session) {
      return NextResponse.redirect(new URL(`/${locale}/home`, req.url));
    }

    const redirectParam = req.nextUrl.searchParams.get('redirect');
    if (redirectParam) {
      const redirectPath = redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`;
      return NextResponse.redirect(new URL(`/${locale}${redirectPath}`, req.url));
    }
    return NextResponse.redirect(new URL(`/${locale}/memo-cards`, req.url));
  }

  // 对于非根路由，使用next-intl的中间件处理国际化
  return intlMiddleware(req as any);
}