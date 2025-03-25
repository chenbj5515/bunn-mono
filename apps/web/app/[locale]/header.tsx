import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import "remixicon/fonts/remixicon.css";
import { LanguageSelector } from "@/components/language-selector"
import { useLocale, useTranslations } from "next-intl"
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import UserPanel from "@/components/user-panel"
import { useAudioPermission } from "@/hooks/audio"

export function UnloginHeader() {
    const t = useTranslations();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`font-mono fixed top-[20px] left-1/2 -translate-x-1/2 w-[80%] h-[64px] z-10 rounded-lg transition-all duration-200 ${
            isScrolled 
                ? 'bg-white border-b border-[#eaeaea] shadow-sm' 
                : 'bg-[#f5f5f5]'
        }`}>
            <div className="relative flex justify-between items-center mx-auto px-[40px] h-full container">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2 cursor-pointer">
                        <Image
                            src="/icon/brand.png"
                            alt="Cursor"
                            width={28}
                            height={28}
                            className="w-7 h-7"
                        />
                        <span className="font-semibold text-[18px] text-black">Bunn</span>
                    </Link>
                </div>
                
                {/* 中央导航链接 - 绝对定位居中 */}
                <div className="top-1/2 left-1/2 absolute -translate-x-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-12">
                        <Link
                            href={`/guide`}
                            className="font-medium text-[#1a1a1a] text-[16px] hover:text-[#595a5d] transition-colors"
                        >
                            {t('common.guide')}
                        </Link>
                        <Link
                            href={'/pricing'}
                            className="font-medium text-[#1a1a1a] text-[16px] hover:text-[#595a5d] transition-colors"
                        >
                            {t('common.pricing')}
                        </Link>
                        <button
                            onClick={() => window.location.href = 'mailto:chenbj55150220@gmail.com'}
                            className="font-medium text-[#1a1a1a] text-[16px] hover:text-[#595a5d] transition-colors"
                        >
                            {t('common.contact')}
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <Link
                        href="/sign-in"
                        className="px-4 py-2 border border-gray-300 hover:border-black rounded-[8px] font-medium text-[#1a1a1a] text-[14px] hover:text-[#595a5d] transition"
                    >
                        SIGN IN
                    </Link>
                    <LanguageSelector />
                </div>
            </div>
        </nav>
    )
}

export function LoginedHeader() {
    const pathname = usePathname()
    const locale = useLocale()
    const t = useTranslations('LoginedHeader')
    const [theme, setTheme] = useState("light")
    useAudioPermission();

    function handleToggle() {
        if (theme === "dark") {
            setTheme("light")
        } else {
            setTheme("dark")
        }
        document.body.classList.toggle("dark")
    }

    return (
        <header className="top-0 z-[200] fixed flex justify-between items-center backdrop-blur-[3px] backdrop-saturate-[180%] p-[12px] w-full h-[64px] font-mono font-bold">
            <UserPanel />
            <nav className="w-[620px]">
                <ul className="flex justify-between items-center">
                    <li>
                        <Link href={`/memo-cards`} className={`text-[15px] font-medium px-4 py-2 rounded-full ${pathname === `/${locale}/memo-cards` ? 'text-[#a9aaab]' : 'hover:text-[#a9aaab]'}`}>{t('memoCards')}</Link>
                    </li>
                    <li>
                        <Link href={`/word-cards`} className={`text-[15px] font-medium px-4 py-2 rounded-full ${pathname === `/${locale}/word-cards` ? 'text-[#a9aaab]' : 'hover:text-[#a9aaab]'}`}>{t('wordCards')}</Link>
                    </li>
                    {/* <li className="hidden sm:block">
            <Link prefetch href={`/${locale}/exam-preparation`} className={`text-[15px] font-medium px-4 py-2 rounded-full ${pathname === `/${locale}/exam-preparation` ? 'text-[#a9aaab]' : 'hover:text-[#a9aaab]'}`}>{t('exam')}</Link>
          </li> */}
                    <li className="hidden sm:block">
                        <Link prefetch href={`/daily-report`} className={`text-[15px] font-medium px-4 py-2 rounded-full ${pathname.startsWith(`/${locale}/daily-report`) ? 'text-[#a9aaab]' : 'hover:text-[#a9aaab]'}`}>{t('dailyReport')}</Link>
                    </li>
                </ul>
            </nav>
            <label className="hidden md:inline-block relative w-[56px] h-[28px] text-base">
                <input
                    onChange={handleToggle}
                    checked={theme === "light"}
                    className="peer opacity-0 w-0 h-0"
                    type="checkbox"
                />
                <span className="top-1 left-2 z-[1] absolute shadow-crescent peer-checked:shadow-full-moon rounded-full w-5 h-5 transition peer-checked:translate-x-5 duration-300 ease-in-out"></span>
                <span className="top-0 right-0 bottom-0 left-0 absolute bg-black peer-checked:bg-blue rounded-3xl transition duration-500 cursor-pointer"></span>
            </label>
        </header>
    )
}