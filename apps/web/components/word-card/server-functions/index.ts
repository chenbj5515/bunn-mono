"use server"
import { TWordCard } from "@/app/[locale]/word-cards/page";
import { db } from "@db/index";
import { wordCard, memoCard } from "@db/schema";
import { getSession } from "@server/lib/auth";
import { eq, sql } from "drizzle-orm";

export async function updateForgetCount(wordCardInfo: TWordCard) {
    try {
        const session = await getSession()

        if (!session) {
            return new Error("Unauthorized")
        }

        if (!wordCardInfo) {
            throw new Error('Word card not found');
        }

        await Promise.all([
            // 1. 更新 word_card 的 forget_count
            db.update(wordCard)
                .set({
                    forgetCount: sql`${wordCard.forgetCount} + 1`
                })
                .where(eq(wordCard.id, wordCardInfo.id)),

            // 2. 更新 memo_card 的 forget_count
            db.update(memoCard)
                .set({
                    forgetCount: sql`${memoCard.forgetCount} + 1`
                })
                .where(eq(memoCard.id, wordCardInfo.memoCardId))
        ]);

        return { success: true }
    } catch (error) {
        console.error('Error updating forget count:', error)
        return { success: false, error: 'Failed to update forget count' }
    }
} 