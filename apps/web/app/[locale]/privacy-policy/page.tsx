import { useTranslations } from 'next-intl';

export default function PrivacyPolicy() {
    const t = useTranslations();

    return (
        <div className="bg-[#f5f5f5] min-h-screen text-[18px] leading-relaxed tracking-[0.4px]">
            {/* Main Content */}
            <div className="mx-auto px-6 py-8 max-w-4xl container">
                <h1 className="mb-6 font-bold text-5xl text-left">{t('privacy.title')}</h1>

                <h2 className="mb-2 text-[#5a5959] text-xl">{t('privacy.subtitle')}</h2>

                <p className="mb-12 text-[#5a5959] text-gray-600">
                    {t('privacy.lastUpdated')} March 1, 2025
                </p>

                <div className="space-y-8 text-gray-700">
                    <p>{t('privacy.welcome')}</p>

                    <div className="pt-8 border-gray-200 border-t">
                        <p className="mb-4 font-bold">{t('privacy.sections.read.title')}</p>
                        <p className="mb-8 text-gray-800 uppercase">
                            {t('privacy.sections.read.description')}
                        </p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('privacy.sections.collect.title')}</h2>
                        <p className="mb-4">{t('privacy.sections.collect.description')}</p>
                        <ul className="space-y-2 mb-4 pl-6 list-disc">
                            {(t.raw('privacy.sections.collect.items') as string[]).map((item: string, index: number) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('privacy.sections.how.title')}</h2>
                        <p>{t('privacy.sections.how.description')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('privacy.sections.use.title')}</h2>
                        <p className="mb-4">{t('privacy.sections.use.description')}</p>
                        <ul className="space-y-2 mb-4 pl-6 list-disc">
                            {(t.raw('privacy.sections.use.items') as string[]).map((item: string, index: number) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('privacy.sections.share.title')}</h2>
                        <p>{t('privacy.sections.share.description')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('privacy.sections.storage.title')}</h2>
                        <p>{t('privacy.sections.storage.description')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('privacy.sections.rights.title')}</h2>
                        <p className="mb-4">{t('privacy.sections.rights.description')}</p>
                        <ul className="space-y-2 mb-4 pl-6 list-disc">
                            {(t.raw('privacy.sections.rights.items') as string[]).map((item: string, index: number) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                        <p>{t('privacy.sections.rights.contact')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('privacy.sections.cookies.title')}</h2>
                        <p>{t('privacy.sections.cookies.description')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('privacy.sections.changes.title')}</h2>
                        <p>{t('privacy.sections.changes.description')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('privacy.sections.contact.title')}</h2>
                        <p>{t('privacy.sections.contact.description')}</p>
                        <p className="mt-2">
                            <a href="mailto:chenbj55150220@gmail.com" className="text-blue-600 hover:underline">
                                chenbj55150220@gmail.com
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
} 