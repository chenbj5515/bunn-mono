"use server"
import { getSession } from "@server/lib/auth";
import { db } from "@db/index";
import { wordCard } from "@db/schema";
import { revalidatePath } from 'next/cache';

export async function insertWordCard(word: string, meaning: string, memoCardId: string) {
    const session = await getSession()

    if (!session) {
        return new Error("Unauthorized")
    }
    let newWordCard = {}

    if (session?.user?.id) {
        newWordCard = await db.insert(wordCard).values({
            word: word,
            meaning: meaning,
            createTime: new Date().toISOString(),
            userId: session.user.id,
            memoCardId: memoCardId,
        }).returning();
        // revalidatePath("/word-cards")
    }

    return JSON.stringify(newWordCard);
}
