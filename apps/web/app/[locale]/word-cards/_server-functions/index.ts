"use server"
import { db } from "@db/index";
import { wordCard } from "@db/schema";
import { TWordCard } from "../page";
import { getSession } from "@server/lib/auth";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function updateReviewTimes(wordCardInfo: TWordCard) {
    const session = await getSession()

    if (!session) {
        return new Error("Unauthorized")
    }

    const [updatedMemoCard] = await db
        .update(wordCard)
        .set({
            reviewTimes: sql`${wordCard.reviewTimes} + 1`
        })
        .where(
            and(
                eq(wordCard.id, wordCardInfo.id),
                eq(wordCard.userId, session.user.id)
            )
        )
        .returning({
            id: wordCard.id,
            reviewTimes: wordCard.reviewTimes
        });

    return JSON.stringify(updatedMemoCard);
}
