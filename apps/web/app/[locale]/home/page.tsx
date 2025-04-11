"use client"
import Image from "next/image"
import { useTranslations, useLocale } from 'next-intl';
import { Button } from "ui/components/button"
import { useRouter } from "next/navigation"
import React from "react"
import { DemoCard } from "@/components/memo-card/demo-card"
import { DemoWordCard } from "@/components/word-card/demo-word-card"
import { MemoCard } from "@/components/memo-card/memo-card"
import DemoDailyReport from "@/components/daily-report/demo-daily-report";
// import { client } from "@server/lib/api-client";
// import DemoExam from "@/components/exam/demo-exam"


function createDefaultWordCardInfo(t: (key: string) => string) {
    return {
        "id": "",
        "word": "捻じ曲げろ",
        "meaning": t('wordCards.demoMeaning'),
        "createTime": new Date("2025-02-08T14:03:03.631Z").toISOString(),
        "userId": "",
        "reviewTimes": 1,
        "memoCardId": "",
        "forgetCount": 0,
        "memo_card": {
            "id": "",
            "translation": t('memoCards.demoTranslation2'),
            "createTime": new Date("2025-02-08T14:02:46.828Z").toISOString(),
            "updateTime": new Date("2025-02-12T08:57:52.715Z").toISOString(),
            "recordFilePath": "",
            "originalText": "え、私情で真相捻じ曲げろって事ですか？",
            "reviewTimes": 0,
            "userId": "",
            "kanaPronunciation": "え、わたしじょうでしんそうねじまげろってことですか？",
            "contextUrl": "https://www.youtube.com/watch?v=QrwxVi9hWJg&t=374",
            "forgetCount": 0
        }
    };
}

export default function LandingPage() {
    const router = useRouter()
    const t = useTranslations();
    const locale = useLocale();
    // 添加状态管理
    const [showDemo, setShowDemo] = React.useState<null | 'memo' | 'word' | 'exam' | 'daily'>(null)
    // 添加MemoCard状态
    const [showMemoCard, setShowMemoCard] = React.useState(false)
    // 引用容器元素
    const containerRef = React.useRef<HTMLDivElement>(null)

    const defaultWordCardInfo = createDefaultWordCardInfo(t);

    // 添加点击外部关闭弹窗的效果
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target;
            if (target instanceof Node) {
                // 检查点击是否在Demo卡片之外
                const demoCardElement = document.querySelector('.demo-card-container');
                if (demoCardElement && !demoCardElement.contains(target as Node)) {
                    setShowDemo(null);
                    setShowMemoCard(false);
                }
            }
        };

        document.addEventListener("mouseup", handleClickOutside);
        return () => {
            document.removeEventListener("mouseup", handleClickOutside);
        };
    }, []);

    // 添加滚动锁定效果
    React.useEffect(() => {
        if (showDemo) {
            // 锁定body滚动
            document.body.style.overflow = 'hidden';
        } else {
            // 恢复body滚动
            document.body.style.overflow = 'auto';
        }
        // 组件卸载时恢复滚动
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showDemo]);

    // 处理卡片点击事件
    const handleCardClick = (cardType: 'memo' | 'word' | 'exam' | 'daily') => {
        setShowDemo(cardType);
        setShowMemoCard(false);
    };

    // 处理WordCard的"不认识"按钮点击事件
    const handleUnRecognize = () => {
        setShowMemoCard(true);
    };

    // 处理WordCard的"认识"按钮点击事件
    const handleRecognize = () => {
        setShowDemo(null);
    };

    return (
        <div className="min-h-screen">
            {/* 添加毛玻璃弹窗 */}
            {showDemo ? (
                <div className="top-[0] left-[0] z-[10] fixed flex justify-center items-center backdrop-blur-[3px] backdrop-saturate-[180%] w-[100vw] h-[100vh]">
                    <div
                        ref={containerRef}
                        className={`demo-card-container ${showDemo === 'word' && !showMemoCard ? 'w-auto min-w-[228px]' : showDemo === 'exam' || showDemo === 'daily' ? 'border border-[#1d283a] rounded-[12px] bg-[#fcfcfd] w-[740px] h-[calc(100vh-2px)] overflow-hidden scrollbar-hide' : 'w-[628px]'} relative transform`}
                        style={{
                            scrollbarWidth: 'none', /* Firefox */
                            msOverflowStyle: 'none', /* IE and Edge */
                        }}
                    >
                        {/* {
                            showDemo === 'memo'
                                ? <DemoCard />
                                : showDemo === 'exam'
                                    ? null //<DemoExam />
                                    : showDemo === 'daily'
                                        ? <DemoDailyReport />
                                        : showDemo === "word"
                                            ? <DemoWordCard onUnRecognize={handleUnRecognize} defaultWordCardInfo={defaultWordCardInfo} />
                                            : null
                        }
                        {
                            showMemoCard
                                ? <MemoCard {...defaultWordCardInfo.memo_card} onDelete={() => { }} />
                                : null
                        } */}
                    </div>
                </div>
            ) : null}

            {/* Hero Section */}
            <div className="relative mx-auto px-4 pt-16 pb-24 max-w-7xl text-center">
                {/* Hero content */}
                <h1 className={`${locale === 'zh' ? 'mb-8' : 'mb-6'} font-bold text-[68px] leading-[1.2] tracking-tight`}>
                    {locale === 'en' ? (
                        <>
                            An all-in-one
                            <br />
                            approach to language learning
                        </>
                    ) : (
                        t('home.personalJourney')
                    )}
                </h1>
                <p className="mx-auto mb-[58px] max-w-2xl text-[#49494b] text-xl">
                    {locale === 'en' ? (
                        <>
                            Can&apos;t find a language learning app that&apos;s both elegant and truly useful?
                            <br />
                            Just try Bunn!
                        </>
                    ) : (
                        t('home.stopScattering')
                    )}
                </p>
                <Button
                    className="bg-[#18181B] hover:bg-[#27272A] px-8 py-6 text-white text-lg"
                    onClick={() => router.push(`/${locale}/login`)}
                >
                    {t('home.getStartedFree')}
                </Button>
                
                <div className="flex flex-col items-center mt-16">
                    {/* 移出来的三行文字 */}
                    <div className="mb-8 text-center">
                        <h3 className="mb-2 font-bold text-[#3e3f3d] text-2xl">{t('home.learnSentences')}</h3>
                        <h3 className="mb-2 font-bold text-[#3e3f3d] text-2xl">{t('home.shadowReading')}</h3>
                        <p className="mt-4 text-[#49494b] text-xl">{t('home.bunnHelps')}</p>
                    </div>
                    
                    <div className="relative w-[1080px]">
                        <Image
                            src="/assets/slogans/hero-bg-1.png"
                            alt="background"
                            width={1080}
                            height={700}
                            className="rounded-[16px] w-full h-auto"
                        />
                        <div className="top-[50%] absolute inset-0 flex justify-center items-center translate-y-[-50%]">
                            <div className="w-[720px] text-left">
                                {/* <DemoCard type="normalText" hideCreateTime={true} height={480} /> */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 新设计部分 */}
                <div className="flex flex-col items-center mt-24">
                    {/* 标题文字 */}
                    <div className="mb-8 text-center">
                        <h3 className="mb-2 font-bold text-[#3e3f3d] text-2xl">{t('home.contextTitle')}</h3>
                        <p className="mt-4 text-[#49494b] text-xl">{t('home.pluginHelp')}</p>
                    </div>
                    
                    <div className="relative w-[1080px]">
                        <Image
                            src="/assets/slogans/hero-bg-2.png"
                            alt="context background"
                            width={1080}
                            height={700}
                            className="rounded-[16px] w-full h-auto"
                        />
                        <div className="absolute inset-0 flex justify-center items-center">
                            <div className="w-[720px] text-left">
                                {/* 这里可以放置Demo组件或其他内容 */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}