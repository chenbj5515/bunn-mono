"use server";

import { db } from "@db/index";
import { userSeriesCovers } from "@db/schema";
import { put, del } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from "@server/lib/auth";
import { eq, and } from 'drizzle-orm';

/**
 * 上传系列封面图片到Vercel Blob并保存到数据库
 * @param seriesId - 系列ID
 * @param file - 要上传的文件
 * @returns 上传后的封面URL和记录ID
 */
export async function uploadSeriesCover(
  seriesId: string,
  file: File
): Promise<{ id: string; coverUrl: string }> {
  // 1. 验证用户身份
  const session = await getSession();
  if (!session || !session?.user?.id) {
    throw new Error('请先登录');
  }

  // 2. 验证文件类型
  if (!file.type.startsWith('image/')) {
    throw new Error('只支持上传图片文件');
  }

  // 3. 上传文件到Vercel Blob
  const filename = `series-covers/${session.user.id}/${seriesId}/${uuidv4()}-${file.name}`;
  const blob = await put(filename, file, {
    access: 'public',
    addRandomSuffix: false,
  });

  // 4. 向数据库添加记录
  const result = await db.insert(userSeriesCovers)
    .values({
      userId: session.user.id,
      seriesId,
      customCoverUrl: blob.url,
      // createTime和updateTime字段将自动使用默认值
    })
    .returning({ id: userSeriesCovers.id, customCoverUrl: userSeriesCovers.customCoverUrl });

  if (!result.length) {
    throw new Error('保存封面记录失败');
  }

  // 确保结果存在后再访问
  const record = result[0];
  if (!record) {
    throw new Error('保存封面记录失败');
  }

  return {
    id: record.id,
    coverUrl: record.customCoverUrl,
  };
}

/**
 * 删除系列封面图片
 * @param seriesId - 系列ID
 * @returns 是否成功删除
 */
export async function deleteSeriesCover(seriesId: string): Promise<boolean> {
  // 1. 验证用户身份
  const session = await getSession();
  if (!session || !session?.user?.id) {
    throw new Error('请先登录');
  }

  // 2. 查询数据库中的记录
  const records = await db.select({
    id: userSeriesCovers.id,
    customCoverUrl: userSeriesCovers.customCoverUrl
  })
  .from(userSeriesCovers)
  .where(
    and(
      eq(userSeriesCovers.userId, session.user.id),
      eq(userSeriesCovers.seriesId, seriesId)
    )
  );

  if (!records.length) {
    // 没有找到记录，可能已经被删除
    return true;
  }

  // 3. 从Vercel Blob中删除文件
  for (const record of records) {
    if (record.customCoverUrl) {
      try {
        // 提取blob URL中的路径
        const url = new URL(record.customCoverUrl);
        const pathName = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
        
        await del(pathName);
      } catch (error) {
        console.error('删除Blob文件失败:', error);
        // 即使删除Blob失败，我们仍然尝试删除数据库记录
      }
    }
  }

  // 4. 从数据库中删除记录
  await db.delete(userSeriesCovers)
    .where(
      and(
        eq(userSeriesCovers.userId, session.user.id),
        eq(userSeriesCovers.seriesId, seriesId)
      )
    );

  return true;
}
