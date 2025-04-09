"use server"

import { db } from "@db/index";
import { characters } from "@db/schema";
import { eq } from "drizzle-orm";
import { Character } from "@/components/timeline";
import type { InferSelectModel } from "drizzle-orm";

/**
 * 根据系列ID获取角色列表
 * @param seriesId 系列ID
 * @returns 角色列表
 */
export async function getRoleList(seriesId: string): Promise<Character[]> {
  try {
    if (!seriesId) {
      return [];
    }

    // 从characters表中查询与seriesId匹配的角色
    const characterList = await db.query.characters.findMany({
      where: eq(characters.seriesId, seriesId)
    });

    // 将查询结果转换为Character接口格式
    return characterList.map((character: InferSelectModel<typeof characters>) => ({
      id: character.id,
      name: character.name,
      avatarUrl: character.avatarUrl || '',
      seriesId: character.seriesId
    }));
  } catch (error) {
    console.error("获取角色列表失败:", error);
    return [];
  }
} 