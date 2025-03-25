"use server"
import { getSession } from "@server/lib/auth";
// import { checkLimit } from "@/server-/check-limit";
import { db } from "@db/index";
import { memoCard, userActionLogs } from "@db/schema";
import { sql } from "drizzle-orm";

export async function insertMemoCard(originalText: string, translation: string, pronunciation: string, url: string) {
    const session = await getSession();
    if (!session?.user.id) {
        return null;
    }

    // if (!checkLimit("memo_card")) {
    //     throw new Error("Daily limit reached");
    // }

    const [newMemoCard] = await db.insert(memoCard).values({
        recordFilePath: "",
        originalText: originalText,
        reviewTimes: 0,
        translation: translation,
        userId: session.user.id,
        kanaPronunciation: pronunciation,
        createTime: sql`CURRENT_TIMESTAMP`,
        updateTime: sql`CURRENT_TIMESTAMP`,
        contextUrl: url
    }).returning();

    // 创建用户行为日志
    await db.insert(userActionLogs).values({
        userId: session.user.id,
        actionType: "CREATE_MEMO",
        relatedId: newMemoCard.id,
        relatedType: "memo_card"
    });

    return JSON.stringify(newMemoCard);
}
