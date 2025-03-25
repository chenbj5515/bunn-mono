'use client';
import { useTranslations } from 'next-intl';

export default function TermsOfService() {
    const t = useTranslations();

    return (
        <div className="bg-[#f5f5f5] min-h-screen text-[18px] leading-relaxed tracking-[0.4px]">
            {/* Main Content */}
            <div className="mx-auto px-6 py-8 max-w-4xl container">
                <h1 className="mb-6 font-bold text-5xl text-left">{t('terms.title')}</h1>

                <h2 className="mb-2 text-[#5a5959] text-xl">{t('terms.subtitle')}</h2>

                <p className="mb-12 text-[#5a5959] text-gray-600">
                    {t('terms.lastUpdated')} March 1, 2025
                </p>

                <div className="space-y-8 text-gray-700">
                    <p>{t('terms.welcome')}</p>

                    <div className="pt-8 border-gray-200 border-t">
                        <p className="mb-4 font-bold">{t('terms.sections.read.title')}</p>
                        <p className="mb-8 text-gray-800 uppercase">
                            {t('terms.sections.read.description')}
                        </p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('terms.sections.info.title')}</h2>
                        <p>{t('terms.sections.info.description1')}</p>
                        <br />
                        <p>{t('terms.sections.info.description2')}</p>
                        <br />
                        <p>{t('terms.sections.info.description3')}</p>
                        <br />
                        <p>{t('terms.sections.info.description4')}</p>
                        <br />
                        <p>{t('terms.sections.info.description5')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('terms.sections.license.title')}</h2>
                        <p>{t('terms.sections.license.description1')}</p>
                        <br />
                        <p>{t('terms.sections.license.description2')}</p>
                        <br />
                        <p>{t('terms.sections.license.description3')}</p>
                        <br />
                        <p>{t('terms.sections.license.description4')}</p>
                        <br />
                        <p>{t('terms.sections.license.description5')}</p>
                        <br />
                        <p>{t('terms.sections.license.description6')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('terms.sections.content.title')}</h2>
                        <p>{t('terms.sections.content.description1')}</p>
                        <br />
                        <p>
                            <strong>{t('terms.sections.content.userContent.title')}</strong>
                            <br />
                            {t('terms.sections.content.userContent.description')}
                        </p>
                        <br />
                        <p>
                            <strong>{t('terms.sections.content.licenseGrant.title')}</strong>
                            <br />
                            {t('terms.sections.content.licenseGrant.description')}
                        </p>
                        <br />
                        <p>
                            <strong>{t('terms.sections.content.contentDeletion.title')}</strong>
                            <br />
                            {t('terms.sections.content.contentDeletion.description')}
                        </p>
                        <br />
                        <p>{t('terms.sections.content.description2')}</p>
                        <br />
                        <p>{t('terms.sections.content.description3')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('terms.sections.payment.title')}</h2>
                        <p>{t('terms.sections.payment.description1')}</p>
                        <br />
                        <p>{t('terms.sections.payment.description2')}</p>
                        <br />
                        <p>{t('terms.sections.payment.description3')}</p>
                        <br />
                        <p>{t('terms.sections.payment.description4')}</p>
                        <br />
                        <p>{t('terms.sections.payment.description5')}</p>
                        <br />
                        <p>{t('terms.sections.payment.description6')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('terms.sections.changes.title')}</h2>
                        <p>{t('terms.sections.changes.description1')}</p>
                        <br />
                        <p>{t('terms.sections.changes.description2')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('terms.sections.agreement.title')}</h2>
                        <p>{t('terms.sections.agreement.description')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('terms.sections.thirdParty.title')}</h2>
                        <p>{t('terms.sections.thirdParty.description')}</p>
                    </div>

                    <div>
                        <h2 className="mb-4 font-bold text-xl">{t('terms.sections.contact.title')}</h2>
                        <p>{t('terms.sections.contact.description')}</p>
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