"use server";

import { seriesMetadata } from "@db/schema";
import { db } from "@db/index";
import { eq } from "drizzle-orm";

/**
 * 更新剧集元数据信息
 * @param id 元数据记录ID
 * @param data 要更新的数据
 */
export async function updateEpisodeMetadata(
  id: string,
  data: {
    season?: number | null;
    episode?: number | null;
    episodeTitle?: string | null;
  }
) {
  try {
    // 验证输入
    if (!id) {
      throw new Error("缺少元数据ID");
    }

    // 构建更新对象，只包含提供的字段
    const updateData: any = {};
    if (data.season !== undefined) updateData.season = data.season;
    if (data.episode !== undefined) updateData.episode = data.episode;
    if (data.episodeTitle !== undefined) updateData.episodeTitle = data.episodeTitle;

    // 如果没有任何要更新的字段，返回成功但不执行更新
    if (Object.keys(updateData).length === 0) {
      return { success: true, message: "没有提供要更新的数据" };
    }

    console.log(updateData, id, "updateData=====");
    // 执行更新
    const result = await db
      .update(seriesMetadata)
      .set(updateData)
      .where(eq(seriesMetadata.id, id));

    console.log(result, "result=====");

    return { success: true };
  } catch (error: any) {
    console.error("更新剧集元数据失败:", error);
    return {
      success: false,
      error: error.message || "更新剧集元数据时出错",
    };
  }
}
