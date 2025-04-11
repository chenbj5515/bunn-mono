"use client"
import React, { useEffect } from "react";
import { DemoCard } from "@/components/memo-card/demo-card";
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

const App: React.FC = () => {
    const t = useTranslations('guide');
    const searchParams = useSearchParams();

    useEffect(() => {
        const scrollY = searchParams.get('scroll');
        if (scrollY) {
            window.scrollTo({
                top: parseInt(scrollY),
                behavior: 'smooth'
            });
        }
    }, [searchParams]);

    return (
        <div className="bg-gray-50 min-h-screen text-[18px] leading-[1.9] tracking-[0.4px]">
            <div className="mx-auto mt-12 px-8 max-w-[1440px]">
                {/* Hero Section */}
                <div className="mb-4 text-center">
                    <h1 className="mb-4 font-bold text-4xl">
                        {t('title')}
                    </h1>
                    <p className="text-black/60 text-gray-600 text-lg">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Preface Section */}
                <div className="shadow-none border-none">
                    <h2 className="m-12 font-semibold text-2xl text-center">
                        {t('preface.title')}
                    </h2>
                    <div className="mx-auto max-w-3xl">
                        <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('preface.challenge')}
                        </p>
                        <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('preface.aiEra')}
                        </p>
                        <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('preface.bestProcess')}
                        </p>
                        <ul className="space-y-3 mb-8 pl-4 text-gray-700">
                            {(t.raw('preface.principles') as string[]).map((principle: string, index: number) => (
                                <li key={index} className="list-disc">
                                    {principle}
                                </li>
                            ))}
                        </ul>
                        <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('preface.creation')}
                        </p>
                    </div>
                </div>
                {/* Core Concept Section */}
                <div className="shadow-none border-none">
                    <h2 className="m-12 font-semibold text-2xl text-center">
                        {t('core.title')}
                    </h2>
                    <div className="mx-auto max-w-3xl">
                        {/* <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('core.description')}
                        </p> */}
                        {/* <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('core.gap')}
                        </p> */}
                        <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('core.origin')}
                        </p>
                        <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('core.features')}
                        </p>
                        <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('core.inputMethods')}
                        </p>
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="text-gray-700">
                                    {t('core.methods.subtitles')}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="text-gray-700">
                                    {t('core.methods.copy')}
                                </span>
                            </div>
                        </div>
                        <p className="text-black/60 text-gray-600 italic">
                            {t('core.future')}
                        </p>
                        <p className="mt-8 mb-4 text-gray-700 text-lg leading-relaxed">
                            {t('core.demo.intro')}
                        </p>
                        {/* <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                                <span className="text-gray-700">
                                    {t('core.demo.shadow')}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="text-gray-700">
                                    {t('core.demo.dictation')}
                                </span>
                            </div>
                        </div> */}
                        <div className="mt-14 text-[16px]">
                            {/* <DemoCard /> */}
                        </div>
                    </div>
                </div>

                {/* Review Section */}
                <div className="shadow-none border-none">
                    <h2 className="m-12 font-semibold text-2xl text-center">
                        {t('review.title')}
                    </h2>
                    <div className="mx-auto max-w-3xl">
                        <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('review.description')}
                        </p>
                        <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('review.reason')}
                        </p>
                        <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('review.solution')}
                        </p>
                        <p className="mb-8 text-gray-700 text-lg leading-relaxed">
                            {t('review.interaction')}
                        </p>
                    </div>
                </div>

                {/* Context Section */}
                <div className="shadow-none border-none">
                    <h2 className="m-12 font-semibold text-2xl text-center">
                        {t('context.title')}
                    </h2>
                    <div className="mx-auto max-w-3xl">
                        <p className="mb-6 text-gray-700">
                            {t('context.intro')}
                        </p>
                        <p className="mb-6 text-gray-700">
                            {t('context.importance')}
                        </p>
                        <p className="text-gray-700">
                            {t('context.feature')}
                        </p>
                    </div>
                </div>

                {/* Getting Started Section */}
                <div className="shadow-none border-none">
                    <h2 className="m-12 font-semibold text-2xl text-center">
                        {t('getStarted.title')}
                    </h2>
                    <div className="mx-auto max-w-3xl">
                        <p className="mb-8 text-gray-700">
                            {t('getStarted.intro')}
                        </p>
                        <div className="pr-4 text-[16px]">
                            <div className="space-y-8">
                                <div className="pl-6 border-blue-500 border-l-4">
                                    <h3 className="mb-2 font-medium text-xl">
                                        {t('getStarted.steps.extension.title')}
                                    </h3>
                                    <p className="text-gray-700">
                                        {t.rich('getStarted.steps.extension.description', {
                                            link: (chunks) => (
                                                <a href="https://chromewebstore.google.com/detail/fpaloochihjldiaigldijhbmgjjjicoa?utm_source=item-share-cp"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:text-blue-700 hover:underline"
                                                >
                                                    {chunks}
                                                </a>
                                            )
                                        })}
                                    </p>
                                </div>
                                <div className="pl-6 border-blue-500 border-l-4">
                                    <h3 className="mb-2 font-medium text-xl">
                                        {t('getStarted.steps.videos.title')}
                                    </h3>
                                    <p className="text-gray-700">
                                        {t('getStarted.steps.videos.description')}
                                    </p>
                                </div>
                                <div className="pl-6 border-blue-500 border-l-4">
                                    <h3 className="mb-2 font-medium text-xl">
                                        {t('getStarted.steps.copy.title')}
                                    </h3>
                                    <p className="text-gray-700">
                                        {t('getStarted.steps.copy.description')}
                                    </p>
                                </div>
                                <div className="pl-6 border-blue-500 border-l-4">
                                    <h3 className="mb-2 font-medium text-xl">
                                        {t('getStarted.steps.paste.title')}
                                    </h3>
                                    <p className="text-gray-700">
                                        {t.rich('getStarted.steps.paste.description', {
                                            link: (chunks) => (
                                                <a href="https://japanese-memory-rsc.vercel.app/memo-cards"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:text-blue-700 hover:underline"
                                                >
                                                    {chunks}
                                                </a>
                                            )
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="mt-8 text-gray-700">
                            {t.rich('getStarted.review', {
                                button: (chunks) => (
                                    <button
                                        onClick={() => {
                                            const demoCard = document.querySelector('.mt-14');
                                            if (demoCard) {
                                                demoCard.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'center'
                                                });

                                                const clickMe = document.createElement('div');
                                                clickMe.className = 'absolute -top-10 right-0 text-blue-500 font-medium animate-fadeInOut';
                                                clickMe.textContent = t('getStarted.clickMe');
                                                clickMe.style.zIndex = '30';

                                                const existingClickMe = document.querySelector('.animate-fadeInOut');
                                                if (existingClickMe) {
                                                    existingClickMe.remove();
                                                }

                                                const demoCardElement = document.querySelector('.mt-14') as HTMLElement;
                                                if (demoCardElement) {
                                                    if (demoCardElement.style.position !== 'relative') {
                                                        demoCardElement.style.position = 'relative';
                                                    }
                                                    demoCardElement.appendChild(clickMe);

                                                    setTimeout(() => {
                                                        clickMe.classList.add('animate-fadeOut');
                                                        setTimeout(() => {
                                                            if (clickMe.parentNode) {
                                                                clickMe.parentNode.removeChild(clickMe);
                                                            }
                                                        }, 500);
                                                    }, 2500);
                                                }
                                            }
                                        }}
                                        className="text-blue-500 hover:text-blue-700 hover:underline"
                                    >
                                        {chunks}
                                    </button>
                                )
                            })}
                        </p>
                        <p className="flex items-center gap-2 mt-12 text-gray-700">
                            {t.rich('getStarted.recommendation.intro', {
                                channel: (chunks) => (
                                    <span className="group flex items-center">
                                        <a href="https://www.youtube.com/@marymarymary80s" target="_blank" rel="noopener noreferrer">
                                            <Image 
                                                src="/assets/slogans/channels_01.png"
                                                alt="Mary's channel avatar"
                                                width={30}
                                                height={30}
                                                className="rounded-full"
                                            />
                                        </a>
                                        <a href="https://www.youtube.com/@marymarymary80s" target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:text-blue-700 group-hover:underline">
                                            {chunks}
                                        </a>
                                    </span>
                                )
                            })}
                        </p>
                        <ul className="space-y-3 mt-4 text-gray-700">
                            {(t.raw('getStarted.recommendation.reasons') as string[]).map((reason: string, index: number) => (
                                <li key={index}>• {reason}</li>
                            ))}
                        </ul>
                        <p className="mt-8 text-gray-700">
                            {t('getStarted.netflix')}
                        </p>
                        <p className="mt-8 text-gray-700">
                            {t('getStarted.websiteCopy')}
                        </p>
                        <div className="mt-12">
                            {/* <DemoCard type="contextText" /> */}
                        </div>
                    </div>
                </div>

                {/* What If I Can't Remember Section */}
                {/* <div className="shadow-none mb-8 border-none">
                    <h2 className="mb-12 font-semibold text-2xl text-center">
                        {t('remember.title')}
                    </h2>
                    <div className="mx-auto max-w-3xl">
                        <p className="mb-6 text-gray-700">
                            {t('remember.normal')}
                        </p>
                        
                        <p className="mb-6 text-gray-700">
                            {t('remember.key')}
                        </p>
                        
                        <ul className="space-y-3 mt-4 mb-6 text-gray-700">
                            {(t.raw('remember.methods') as string[]).map((method: string, index: number) => (
                                <li key={index}>• {method}</li>
                            ))}
                        </ul>
                        
                        <p className="text-gray-700">
                            {t('remember.conclusion')}
                        </p>
                    </div>
                </div> */}

                {/* Summary Section */}
                <div className="shadow-none border-none">
                    <h2 className="m-12 font-semibold text-2xl text-center">
                        {t('why.title')}
                    </h2>
                    <div className="mx-auto max-w-3xl">
                        <div className="space-y-6 text-gray-700">
                            <div className="mb-8">
                                <h3 className="mb-3 font-medium text-xl">{t('why.sections.built.title')}</h3>
                                <p className="leading-relaxed">
                                    {t('why.sections.built.description')}
                                </p>
                            </div>

                            <div className="mb-8">
                                <h3 className="mb-3 font-medium text-xl">{t('why.sections.serious.title')}</h3>
                                <p className="leading-relaxed">
                                    {t('why.sections.serious.description')}
                                </p>
                            </div>

                            <div className="mb-8">
                                <h3 className="mb-3 font-medium text-xl">{t('why.sections.workflow.title')}</h3>
                                <p className="leading-relaxed">
                                    {t('why.sections.workflow.description')}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mx-auto mt-4 max-w-3xl">
                        {t.rich('why.explore', {
                            link: (chunks) => (
                                <a href="https://japanese-memory-rsc.vercel.app/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 hover:underline"
                                >
                                    {chunks}
                                </a>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default App;
