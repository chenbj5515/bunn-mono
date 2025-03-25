import type React from "react"
import { Check, X } from "lucide-react"
import { getTranslations, getLocale } from 'next-intl/server'
import { Button } from "ui/components/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "ui/components/card"
import { UpgradeButton } from "./_components/upgrade-button"

const FeatureItem = ({ children, included = false }: { children: React.ReactNode; included?: boolean }) => (
    <li className="flex items-center">
        {included ? (
            <Check className="mr-2 w-4 h-4 text-primary" />
        ) : (
            <X className="mr-2 w-4 h-4 text-gray-300" />
        )}
        <span className={included ? 'text-gray-700' : 'text-gray-400'}>{children}</span>
    </li>
)

export default async function SubscriptionPage() {
    const t = await getTranslations('pricing');    

    return (
        <div className="mx-auto pt-[104px] container">
            {/* <div className="flex justify-center mt-2 h-[100px]">
                <h1 className="font-bold text-3xl">{t('title')}</h1>
            </div> */}
            <div className="gap-20 grid md:grid-cols-2 mx-auto max-w-[700px]">
                <Card className="hover:border-primary w-[324px] h-[400px] transition-all duration-300">
                    <CardHeader>
                        <CardTitle>{t('freePlan.title')}</CardTitle>
                        <CardDescription>{t('freePlan.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 font-bold text-3xl">{t('freePlan.price')}</p>
                        <ul className="space-y-2">
                            <FeatureItem included>{t('freePlan.features.sentences')}</FeatureItem>
                            <FeatureItem included>{t('freePlan.features.words')}</FeatureItem>
                            <FeatureItem>{t('freePlan.features.subtitle')}</FeatureItem>
                            <FeatureItem>{t('freePlan.features.webTranslation')}</FeatureItem>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="mt-[30px] w-full" variant="outline">
                            {t('freePlan.currentPlan')}
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="hover:border-primary w-[324px] h-[400px] transition-all duration-300">
                    <CardHeader>
                        <CardTitle>{t('proPlan.title')}</CardTitle>
                        <CardDescription>{t('proPlan.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 font-bold text-3xl">{t('proPlan.price')}</p>
                        <ul className="space-y-2">
                            <FeatureItem included>{t('proPlan.features.sentences')}</FeatureItem>
                            <FeatureItem included>{t('proPlan.features.words')}</FeatureItem>
                            <FeatureItem included>{t('proPlan.features.subtitle')}</FeatureItem>
                            <FeatureItem included>{t('proPlan.features.webTranslation')}</FeatureItem>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <UpgradeButton upgradeText={t('proPlan.upgrade')} />
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}