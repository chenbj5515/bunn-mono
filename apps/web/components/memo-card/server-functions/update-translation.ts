"use server"
import { getSession } from "@server/lib/auth";
import { db } from "@db/index";
import { eq, and } from "drizzle-orm";
import { memoCard } from "@db/schema";
import { sql } from "drizzle-orm";

export async function updateMemoCardTranslation(id: string, translation: string) {
    const session = await getSession();

    if (!session?.user?.id) {
        throw new Error('用户未登录');
    }

    const [updatedMemoCard] = await db.update(memoCard)
        .set({
            translation: translation,
            updateTime: sql`CURRENT_TIMESTAMP`
        })
        .where(
            and(
                eq(memoCard.id, id),
                eq(memoCard.userId, session.user.id)
            )
        )
        .returning();

    return JSON.stringify(updatedMemoCard);
}
