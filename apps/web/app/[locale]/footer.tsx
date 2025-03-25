"use client"

import { useTranslations } from "next-intl"

export function Footer() {
    const t = useTranslations('common.footer');

    return (
        <footer className="bottom-0 absolute mx-auto mt-8 px-4 pb-16 w-full">
            {/* 底部链接 */}
            <div className="flex justify-center items-center space-x-6 text-gray-800">
                <p className="hover:text-gray-600">{t('copyright')}</p>
                <span className="text-gray-400">•</span>
                <a href="/terms-of-service" className="hover:opacity-90 text-gray-400">{t('termsOfService')}</a>
                <a href="/privacy-policy" className="hover:opacity-90 text-gray-400">{t('privacyPolicy')}</a>
                {/* <a href="/business-disclosure" className="hover:opacity-90 text-gray-400">{t('businessDisclosure')}</a> */}
            </div>
        </footer>
    )
}