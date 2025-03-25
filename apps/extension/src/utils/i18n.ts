import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 获取cookie中的语言
function getLanguageFromCookie() {
  const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  return match ? match[1] : 'en'; // 默认中文
}

// 直接导入语言包
import zhTranslation from '../../../../messages/zh.json';
import enTranslation from '../../../../messages/en.json';
import zhTWTranslation from '../../../../messages/zh-TW.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        translation: zhTranslation
      },
      en: {
        translation: enTranslation
      },
      'zh-TW': {
        translation: zhTWTranslation
      }
    },
    lng: getLanguageFromCookie(),
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false
    }
  });

// 导出获取当前语言的函数
export const getCurrentLanguage = () => {
  return i18n.language;
};

// 导出语言切换函数
export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=${60*60*24*365}`;
};

export default i18n;
