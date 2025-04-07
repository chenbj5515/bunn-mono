"use client"
import React, { useRef } from 'react';
import { usePathname } from 'next/navigation';
import "remixicon/fonts/remixicon.css";
import { localCardAtom } from '@/lib/atom';
import { useSetAtom } from 'jotai';
import { Footer } from './footer';
import { UnloginHeader, LoginedHeader } from './header';
import { useHtmlBg } from '@/hooks/use-html-bg';
import { Dock } from '@/components/dock/dock';
import { useDoubleVKeyPress } from '@/hooks/events';
import { insertMemoCard } from '@/components/memo-card/server-functions';
// import { client } from '@server/lib/api-client';

export default function LayoutClient({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const setLocalCard = useSetAtom(localCardAtom);
    const urlRef = useRef<string>("");
    const contextContentRef = useRef<any>(null);

    async function handleAllDone(original_text: string, translation: string, kana: string, context_url: string, contextContent: any) {
        const record = await insertMemoCard(original_text, translation, kana, context_url, contextContent);

        if (record) {
            setLocalCard({
                state: 'added',
                localCardList: []
            });
            setTimeout(() => {
                setLocalCard({
                    state: 'idle',
                    localCardList: []
                });
                window.location.reload();
            }, 2000);
        }
    }

    useHtmlBg();
    useDoubleVKeyPress(async () => {
        console.log("double v key pressed");
        try {
            const clipboardText = await navigator.clipboard.readText();
            let parsedData;
            try {
                parsedData = JSON.parse(clipboardText);
            } catch {
                parsedData = clipboardText;
            }

            let original_text = "";
            let context_url = "";
            let contextContent = null;
            if (typeof parsedData === 'object' && parsedData !== null) {
                urlRef.current = parsedData?.url || "";
                const originalText = 'text' in parsedData ? parsedData.text?.trim() : '';
                contextContentRef.current = parsedData;
                original_text = originalText;
                context_url = urlRef.current;
                contextContent = contextContentRef.current;

            } else {
                urlRef.current = "";
                original_text = clipboardText?.trim();
                context_url = "";
                contextContent = null;
            }
            setLocalCard({
                state: 'adding',
                localCardList: [
                    {
                        key: Date.now(),
                        original_text,
                        context_url,
                        contextContent,
                    }
                ]
            });
            if (!pathname.includes('zzs')) {
                try {
                    console.log(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/generate-text`, "API_BASE_URL========");
                    const [translationResultResponse, kanaResultResponse] = await Promise.all([
                        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/generate-text`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                prompt: `${original_text}，给出这句话的中文翻译，注意一定要中文，不要返回翻译结果以外的任何内容。`
                            })
                        }),
                        // fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/generate-text`, {
                        //     method: 'POST',
                        //     headers: {
                        //         'Content-Type': 'application/json'
                        //     },
                        //     body: JSON.stringify({
                        //         prompt: `${original_text}，给出这句话的平假名读音，注意只需要平假名读音和对应位置的标点符号。`
                        //     })
                        // }),
                        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/generate-text`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                prompt: `
                                    请将这个日语文本「${original_text}」转换为Ruby注音格式，使用HTML表示，注意三点：
                                    1. 所有汉字都要转化，注意你这里经常漏掉汉字的转化，避免这一点。
                                    2. 如果一个词是外来词，那么ruby中不是假名的注音而应该是英文原文。
                                    3. 如果一个词是英文，那么不要对这个词进行任何处理，注意这里你经常把英文也加上了ruby，避免这一点。 
                                    示例如下，
                                    输入是「Ubie では「Ubie Vitals」というデザインシステムに則って UI 開発を行っています。」  
                                    输出目标下面这样的HTML结构：  
                                    <span>Ubie では「Ubie Vitals」という<ruby>デザイン<rt>design</rt></ruby><ruby>システム<rt>system</rt></ruby>に<ruby>則って<rt>のっとって</rt></ruby> UI <ruby>開発<rt>かいはつ</rt></ruby>を行っています。</span>
                                    注意，只需要返回HTML结构，连不要返回任何其他内容。
                                `,
                                model: "gpt-4o"
                            })
                        })
                    ]);

                    console.log(translationResultResponse, "translationResultResponse========");
                    const translationResult = await translationResultResponse.json();
                    const kanaResult = await kanaResultResponse.json();

                    if (translationResult.success && kanaResult.success) {
                        let kanaHtml = kanaResult.data;
                        if (kanaHtml.startsWith('```html')) {
                            kanaHtml = kanaHtml.slice(7, -3);
                        }
    
                        handleAllDone(original_text, translationResult.data, kanaHtml, context_url, contextContent);
                    }
                } catch (error) {
                    console.error('AI generation failed:', error);
                }
            }
        } catch (err) {
            console.error("Failed to read clipboard:", err);
        }
    });

    const currentRoute = pathname.split('/').pop() || '';

    const noNavPaths = ["exam", "login", "payment-result"];
    const noNav = noNavPaths.includes(currentRoute);

    const unloginHeaderPaths = ["home", "guide", "pricing", "privacy-policy", "terms-of-service", "business-disclosure"];
    const unloginHeader = unloginHeaderPaths.includes(currentRoute);

    return (
        <>
            {
                unloginHeader
                    ? <UnloginHeader />
                    : noNav
                        ? null
                        : <LoginedHeader />
            }
            {
                unloginHeader ? null : <Dock />
            }
            <div style={{
                paddingTop: noNav ? 0 : "64px",
                paddingBottom: unloginHeader ? "100px" : 0
            }}>
                {children}
            </div>
            {
                unloginHeader ? <Footer /> : null
            }
        </>
    )
}
