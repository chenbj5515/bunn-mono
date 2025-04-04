"use client"
import React from "react";
import { insertWordCard } from "./server-functions";
import { Card } from "ui/components/card";
import { Button } from "ui/components/button";
import { useAtomValue } from "jotai";
import { cardIdAtom } from "@/lib/atom";
import { usePathname, useRouter } from "next/navigation";

type StateType = {
    state: 'initial' | 'selected' | 'edited' | 'added' | 'closed';
    left: number;
    top: number;
    selectedText: string;
    originalText: string;
};

type Action =
    | { type: 'select'; payload: { left: number; top: number; selectedText: string; originalText: string } }
    | { type: 'addToWordCards' }
    | { type: 'close' };

const initialState: StateType = {
    state: 'initial',
    left: 0,
    top: 0,
    selectedText: '',
    originalText: '',
};

function reducer(state: StateType, action: Action): StateType {
    switch (action.type) {
        case 'select':
            return {
                ...state,
                state: 'selected',
                left: action.payload.left,
                top: action.payload.top,
                selectedText: action.payload.selectedText,
                originalText: action.payload.originalText,
            };
        case 'addToWordCards':
            return {
                ...state,
                state: 'added',
                left: -100,
                top: -100,
            };
        case 'close':
            return {
                ...state,
                state: 'closed',
                left: -100,
                top: -100,
                selectedText: '',
                originalText: '',
            };
        default:
            return state;
    }
}

async function getCompletion(prompt: string) {
    const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        throw new Error('API request failed');
    }

    const data = await response.json();
    return data.data;
}

async function correctSelectedText(selected: string, originalText: string): Promise<string> {
    const response = await getCompletion(`请判断「${selected}」在「${originalText}」这个句子中是否是一个完整的单词或短语。如果是，直接返回这个单词或短语；如果不是，请返回包含这个选中内容的最小完整单词或短语。注意：1. 只返回修正后的单词或短语，不要返回任何解释。2. 如果选中内容是一个完整的单词或者短语加上了多余的部分，那么要把多余的部分去掉只保留完整的单词和短语。`);
    return response.trim();
}

// 1 知りたい単語を選択する
// 2 語句の翻訳結果を編集する（オプション）
// 3 追加ボタンを押して、単語帳に追加する
// 4 追加した後・WordCardAdder以外のDOM要素をクリックした後、WordCardAdderを非表示にする
export function WordCardAdder() {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const cardId = useAtomValue(cardIdAtom);

    const meaningTextRef = React.useRef<HTMLDivElement>(null);
    const [{
        state,
        left,
        top,
        selectedText,
        originalText,
    }, dispatch] = React.useReducer(reducer, initialState);

    const stateRef = React.useRef<typeof state | null>(null);

    const pathname = usePathname();
    const router = useRouter();

    function effectCleanMeaningTextContent() {
        if (meaningTextRef.current) {
            meaningTextRef.current.textContent = "";
        }
    }

    function effectCleanElementSelected() {
        window.getSelection()?.removeAllRanges();
    }

    async function effectGetMeaning() {
        if (meaningTextRef.current) {
            const meaning = await getCompletion(`在「${originalText}」这个上下文中出现了「${selectedText}」这个单词或短语、我要你尽可能简短地给出「${selectedText}」这个单词或短语的意思，注意我只需要这个单词或短语在这个句子中文含义，不要给出除此之外的任何内容，注意「这个意思是」的前缀也不要。`);
            if (meaningTextRef.current && stateRef.current === "selected") {
                meaningTextRef.current.textContent = meaning;
            }
        }
    }

    async function effectInsertWordCard() {
        if (meaningTextRef.current?.textContent) {
            await insertWordCard(selectedText, meaningTextRef.current.textContent, cardId);
        }
        if (pathname.includes("/word-cards")) {
            // window.location.reload();
            router.refresh();
        }
    }

    React.useEffect(() => {
        if (state === "selected") {
            effectGetMeaning();
        }
        if (state === "added") {
            effectInsertWordCard();
            effectCleanMeaningTextContent();
            effectCleanElementSelected();
        }
        if (state === "closed") {
            effectCleanMeaningTextContent();
            effectCleanElementSelected();
        }
        stateRef.current = state;
    }, [state]);

    async function handleSelectEvent() {
        const selection = document.getSelection();
        if (selection && selection.rangeCount > 0) {
            const selected = selection.toString().trim();
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // 获取最近的Element节点
            let element: Element | null = range.commonAncestorContainer as Element;
            while (element && element.nodeType !== Node.ELEMENT_NODE) {
                element = element.parentElement;
            }

            // 检查选中的文本是否在.original-text元素内
            const originalTextElement = element?.closest('.original-text');
            if (selected.length && originalTextElement) {
                const originalText = originalTextElement.textContent || '';
                const correctedText = await correctSelectedText(selected, originalText);

                if (correctedText) {
                    dispatch({
                        type: "select",
                        payload: {
                            left: rect.right,
                            top: rect.bottom,
                            selectedText: correctedText,
                            originalText: originalText
                        }
                    });
                }
            }
        }
    }

    React.useEffect(() => {
        function handleMouseUp(event: MouseEvent) {
            if (event.target instanceof Node) {
                const inContainer =
                    event.target === containerRef.current
                    || containerRef.current?.contains(event.target);

                if (!inContainer) {
                    if (selectedText) {
                        dispatch({
                            type: "close",
                        })
                    }
                    if (!selectedText && document.getSelection()) {
                        handleSelectEvent();
                    }
                }
            }
        }
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mouseup", handleMouseUp);
        }
    }, [selectedText]);

    function handleAddWord() {
        dispatch({
            type: "addToWordCards"
        })
    }

    return (
        <Card
            ref={containerRef}
            className="z-[15] fixed mx-auto p-3 rounded-[6px] max-w-[240px] text-[15px]"
            style={{ top, left, visibility: state === "selected" ? "visible" : "hidden" }}
        >
            <div>語句：{selectedText}</div>
            <div className="flex">
                意味：
                <div
                    suppressContentEditableWarning
                    contentEditable
                    ref={meaningTextRef}
                    className="outline-none whitespace-pre-wrap"
                ></div>
            </div>

            <div className="flex justify-center mt-2">
                <Button
                    variant="outline"
                    onClick={handleAddWord}
                >
                    単語帳に追加
                </Button>
            </div>
        </Card>
    )
}
