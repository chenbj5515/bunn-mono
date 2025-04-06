"use server";

import { db } from "@db/index";
import { userSeriesMaterials } from "@db/schema";
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

  // 4. 查询是否已有记录
  const existingRecord = await db.select({ id: userSeriesMaterials.id })
    .from(userSeriesMaterials)
    .where(
      and(
        eq(userSeriesMaterials.userId, session.user.id),
        eq(userSeriesMaterials.seriesId, seriesId)
      )
    )
    .limit(1);

  let result;
  
  if (existingRecord.length > 0) {
    // 4a. 如果记录存在，更新customCoverUrl字段
    result = await db.update(userSeriesMaterials)
      .set({
        customCoverUrl: blob.url,
        updateTime: new Date().toISOString(),
      })
      .where(
        and(
          eq(userSeriesMaterials.userId, session.user.id),
          eq(userSeriesMaterials.seriesId, seriesId)
        )
      )
      .returning({ 
        id: userSeriesMaterials.id, 
        customCoverUrl: userSeriesMaterials.customCoverUrl 
      });
  } else {
    // 4b. 如果记录不存在，创建新记录
    result = await db.insert(userSeriesMaterials)
      .values({
        userId: session.user.id,
        seriesId,
        customCoverUrl: blob.url,
        // createTime和updateTime字段将自动使用默认值
      })
      .returning({ 
        id: userSeriesMaterials.id, 
        customCoverUrl: userSeriesMaterials.customCoverUrl 
      });
  }

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
    id: userSeriesMaterials.id,
    customCoverUrl: userSeriesMaterials.customCoverUrl
  })
  .from(userSeriesMaterials)
  .where(
    and(
      eq(userSeriesMaterials.userId, session.user.id),
      eq(userSeriesMaterials.seriesId, seriesId)
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
        
        // 4. 更新数据库记录，清除customCoverUrl字段
        await db.update(userSeriesMaterials)
          .set({
            customCoverUrl: '', // 由于字段是notNull的，设置为空字符串
            updateTime: new Date().toISOString(),
          })
          .where(eq(userSeriesMaterials.id, record.id));
      } catch (error) {
        console.error('删除Blob文件失败:', error);
        // 即使删除Blob失败，我们仍然尝试更新数据库记录
      }
    }
  }

  return true;
}

/**
 * 上传自定义标题背景图片到Vercel Blob并保存到数据库
 * @param seriesId - 系列ID
 * @param file - 要上传的文件
 * @returns 上传后的背景图URL
 */
export async function uploadCustomTitleBackground(
  seriesId: string,
  file: File
): Promise<{ id: string; backgroundUrl: string }> {
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
  const filename = `series-title/${session.user.id}/${seriesId}/${uuidv4()}-${file.name}`;
  const blob = await put(filename, file, {
    access: 'public',
    addRandomSuffix: false,
  });

  // 4. 查询是否已有记录
  const existingRecord = await db.select({ id: userSeriesMaterials.id })
    .from(userSeriesMaterials)
    .where(
      and(
        eq(userSeriesMaterials.userId, session.user.id),
        eq(userSeriesMaterials.seriesId, seriesId)
      )
    )
    .limit(1);

  let result;
  
  if (existingRecord.length > 0) {
    // 4a. 如果记录存在，更新customTitleUrl字段
    result = await db.update(userSeriesMaterials)
      .set({
        customTitleUrl: blob.url,
        updateTime: new Date().toISOString(),
      })
      .where(
        and(
          eq(userSeriesMaterials.userId, session.user.id),
          eq(userSeriesMaterials.seriesId, seriesId)
        )
      )
      .returning({ 
        id: userSeriesMaterials.id, 
        customTitleUrl: userSeriesMaterials.customTitleUrl 
      });
  } else {
    // 4b. 如果记录不存在，创建新记录
    result = await db.insert(userSeriesMaterials)
      .values({
        userId: session.user.id,
        seriesId,
        customCoverUrl: '', // 必填字段，但此处我们只关心customTitleUrl
        customTitleUrl: blob.url,
        // createTime和updateTime字段将自动使用默认值
      })
      .returning({ 
        id: userSeriesMaterials.id, 
        customTitleUrl: userSeriesMaterials.customTitleUrl 
      });
  }

  if (!result.length) {
    throw new Error('保存标题背景记录失败');
  }

  // 确保结果存在后再访问
  const record = result[0];
  if (!record) {
    throw new Error('保存标题背景记录失败');
  }

  return {
    id: record.id,
    backgroundUrl: record.customTitleUrl || '',
  };
}

/**
 * 删除自定义标题背景图片
 * @param seriesId - 系列ID
 * @returns 是否成功删除
 */
export async function deleteCustomTitleBackground(seriesId: string): Promise<boolean> {
  // 1. 验证用户身份
  const session = await getSession();
  if (!session || !session?.user?.id) {
    throw new Error('请先登录');
  }

  // 2. 查询数据库中的记录
  const records = await db.select({
    id: userSeriesMaterials.id,
    customTitleUrl: userSeriesMaterials.customTitleUrl
  })
  .from(userSeriesMaterials)
  .where(
    and(
      eq(userSeriesMaterials.userId, session.user.id),
      eq(userSeriesMaterials.seriesId, seriesId)
    )
  );

  if (!records.length) {
    // 没有找到记录
    return true;
  }

  // 3. 从Vercel Blob中删除文件
  for (const record of records) {
    if (record.customTitleUrl) {
      try {
        // 提取blob URL中的路径
        const url = new URL(record.customTitleUrl);
        const pathName = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
        
        await del(pathName);
        
        // 4. 更新数据库记录，清除customTitleUrl字段
        await db.update(userSeriesMaterials)
          .set({
            customTitleUrl: null,
            updateTime: new Date().toISOString(),
          })
          .where(eq(userSeriesMaterials.id, record.id));
      } catch (error) {
        console.error('删除Blob文件失败:', error);
        // 即使删除Blob失败，我们仍然尝试更新数据库记录
      }
    }
  }

  return true;
}
