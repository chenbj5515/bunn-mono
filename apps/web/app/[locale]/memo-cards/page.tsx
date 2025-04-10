import React from "react";
import { getSession } from "@server/lib/auth";
import { db } from "@db/index";
import { memoCard, characters } from "@db/schema";
import { and, eq, gt, count, desc } from "drizzle-orm";
import { MemoCardList } from "@/components/memo-card-list";
import { LocalCardList } from "@/components/memo-card-list";
import { InputBox } from "@/components/input-box";
// import { WordCardAdder } from "@/components/word-adder";

export default async function MemoCardsPage() {
  const session = await getSession()

  if (!session) {
    return new Error("Unauthorized")
  }

  // Safely get the count of new cards
  const result = await db.select({
    value: count()
  }).from(memoCard)
    .where(
      and(
        eq(memoCard.userId, session.user.id),
        eq(memoCard.reviewTimes, 0)
      )
    );
  const newCardsCount = result?.[0]?.value ?? 0;

  const newCardsPromise = db.select({
    id: memoCard.id,
    translation: memoCard.translation,
    createTime: memoCard.createTime,
    updateTime: memoCard.updateTime,
    recordFilePath: memoCard.recordFilePath,
    originalText: memoCard.originalText,
    reviewTimes: memoCard.reviewTimes,
    forgetCount: memoCard.forgetCount,
    userId: memoCard.userId,
    kanaPronunciation: memoCard.kanaPronunciation,
    contextUrl: memoCard.contextUrl,
    rubyTranslations: memoCard.rubyTranslations,
    platform: memoCard.platform,
    seriesId: memoCard.seriesId,
    characterId: memoCard.characterId,
    character: {
      id: characters.id,
      name: characters.name,
      description: characters.description,
      avatarUrl: characters.avatarUrl,
      seriesId: characters.seriesId,
      createTime: characters.createTime,
      updateTime: characters.updateTime
    }
  })
  .from(memoCard)
  .leftJoin(characters, eq(memoCard.characterId, characters.id))
  .where(
    and(
      eq(memoCard.userId, session.user.id),
      eq(memoCard.reviewTimes, 0)
    )
  )
  .orderBy(desc(memoCard.id))
  .limit(10);

  const remainingCount = Math.max(0, 10 - newCardsCount);

  const forgottenCardsPromise = remainingCount > 0 
    ? db.select({
        id: memoCard.id,
        translation: memoCard.translation,
        createTime: memoCard.createTime,
        updateTime: memoCard.updateTime,
        recordFilePath: memoCard.recordFilePath,
        originalText: memoCard.originalText,
        reviewTimes: memoCard.reviewTimes,
        forgetCount: memoCard.forgetCount,
        userId: memoCard.userId,
        kanaPronunciation: memoCard.kanaPronunciation,
        contextUrl: memoCard.contextUrl,
        rubyTranslations: memoCard.rubyTranslations,
        platform: memoCard.platform,
        seriesId: memoCard.seriesId,
        characterId: memoCard.characterId,
        character: {
          id: characters.id,
          name: characters.name,
          description: characters.description,
          avatarUrl: characters.avatarUrl,
          seriesId: characters.seriesId,
          createTime: characters.createTime,
          updateTime: characters.updateTime
        }
      })
      .from(memoCard)
      .leftJoin(characters, eq(memoCard.characterId, characters.id))
      .where(
        and(
          eq(memoCard.userId, session.user.id),
          gt(memoCard.reviewTimes, 0)
        )
      )
      .orderBy(desc(memoCard.forgetCount))
      .limit(remainingCount) 
    : Promise.resolve([]);

  return (
    <>
      <div className="pt-[42px] pb-[36px]">
        <MemoCardList
          newCardsPromise={newCardsPromise}
          forgottenCardsPromise={forgottenCardsPromise}
        />
        <LocalCardList />
      </div>
      <div className="bottom-2 left-[50%] z-[12] fixed w-[100%] max-w-80-680 min-h-[50px] -translate-x-1/2">
        <InputBox />
      </div>
      {/* <WordCardAdder /> */}
    </>
  )
}

