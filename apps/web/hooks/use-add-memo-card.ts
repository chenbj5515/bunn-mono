import { useRef } from "react";
import { useDoubleVKeyPress } from "./events";
import { localCardAtom } from "@/lib/atom";
import { useSetAtom } from "jotai";
import { useLocale } from "next-intl";
import { insertMemoCard } from "@/components/memo-card/server-functions/insert-memo-card";

export const useAddMemoCard = () => {
    const locale = useLocale();
    const setLocalCard = useSetAtom(localCardAtom);
    
    const urlRef = useRef<string>("");
    const contextContentRef = useRef<any>(null);
    const targetLocale = locale === 'zh' ? '中文简体' : locale === 'zh-TW' ? '繁体中文' : '英文';

    async function handleAllDone(original_text: string, translation: string, kana: string, context_url: string, contextContent: any) {
        const record = await insertMemoCard(original_text, translation, kana, context_url, contextContent, targetLocale);

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
            original_text = original_text
                .replace(/^[（(][^）)]*[）)]/, '') // 去掉开头的（）及其内容
                .replace(/\s+/g, '、') // 将空格替换为、
                .trim(); // 去除首尾空格
            try {
                let translationPrompt;

                translationPrompt = `${original_text}，给出这句话的${targetLocale}翻译，注意一定要${targetLocale}，不要返回翻译结果以外的任何内容。`;


                const [translationResultResponse, kanaResultResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/generate-text`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            prompt: translationPrompt
                        })
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/generate-text`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            prompt: `
                            请将这个日语文本「${original_text}」转换为Ruby注音格式，使用JSON表示，注意三点：
                            1. 所有汉字都要转化，注意你这里经常漏掉汉字的转化，避免这一点。
                            2. 如果一个词是外来词，那么ruby中不是假名的注音而应该是英文原文。
                            3. 如果一个词是英文，那么不要对这个词进行任何处理，注意这里你经常把英文也加上了ruby，避免这一点。 
                            示例如下，
                            输入是「Ubie では「Ubie Vitals」というデザインシステムに則って UI 開発を行っています。」  
                            输出目标下面这样的JSON结构：  
                            {
                                "tag": "span",
                                "children": [
                                    "Ubie では「Ubie Vitals」という",
                                    {
                                        "tag": "ruby",
                                        "text": "デザイン",
                                        "rt": "design"
                                    },
                                    {
                                        "tag": "ruby",
                                        "text": "システム",
                                        "rt": "system"
                                    },
                                    "に",
                                    {
                                        "tag": "ruby",
                                        "text": "則って",
                                        "rt": "のっとって"
                                    },
                                    " UI ",
                                    {
                                        "tag": "ruby",
                                        "text": "開発",
                                        "rt": "かいはつ"
                                    },
                                    "を行っています。"
                                ]
                            }

                            注意，只需要返回JSON结构，连不要返回任何其他内容。
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
        } catch (err) {
            console.error("Failed to read clipboard:", err);
        }
    });
}