"use client"
import MemoCardLocal from "@/components/memo-card/memo-card-local";
import { localCardListAtom } from "@/lib/atom";
import { useAtomValue } from "jotai";


export function LocalCardList() {
    const localCards = useAtomValue(localCardListAtom);

    return (
        <div className="space-y-14 mx-auto mb-14 max-w-92-675 text-[18px] sm:text-base memo-card">
            {localCards?.map(card => (
                <MemoCardLocal key={card.key} original_text={card.original_text} context_url={card.context_url} />
            ))}
        </div>
    )
}