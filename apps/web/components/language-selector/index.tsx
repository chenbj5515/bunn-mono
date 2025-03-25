"use client"
import * as React from "react"
import { Globe } from "lucide-react"
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function LanguageSelector() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const handleLanguageChange = (value: string) => {
        const currentRoute = pathname.split('/').pop() || '';
        Cookies.set('NEXT_LOCALE', value, {
            path: '/',
            expires: 365, // 一年有效期
            sameSite: 'lax'
        });
        router.push(`/${value}/${currentRoute}`);
        setIsOpen(false);
    }

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                className="flex items-center space-x-1 hover:text-gray-600"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Globe className="w-5 h-5" />
                <span>
                    {locale === 'zh' ? '简体中文' :
                        locale === 'zh-TW' ? '繁體中文' :
                            'English'}
                </span>
            </button>

            {isOpen && (
                <div className="right-0 absolute bg-white ring-opacity-5 shadow-lg mt-2 rounded-md ring-1 ring-black w-40">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        <button
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-hovered transition-colors duration-150 ${locale === 'zh' ? 'bg-gray-100' : ''}`}
                            onClick={() => handleLanguageChange('zh')}
                        >
                            简体中文
                        </button>
                        <button
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-hovered transition-colors duration-150 ${locale === 'zh-TW' ? 'bg-gray-100' : ''}`}
                            onClick={() => handleLanguageChange('zh-TW')}
                        >
                            繁體中文
                        </button>
                        <button
                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-hovered transition-colors duration-150 ${locale === 'en' ? 'bg-gray-100' : ''}`}
                            onClick={() => handleLanguageChange('en')}
                        >
                            English
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}