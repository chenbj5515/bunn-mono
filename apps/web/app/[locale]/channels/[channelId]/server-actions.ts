"use server";

import { db } from "@server/db/index";
import { channels } from "@server/db/schema";
import { put, del } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from "@server/lib/auth";
import { eq } from 'drizzle-orm';

/**
 * 上传频道横幅图片到Vercel Blob并更新数据库
 * @param channelId - 频道ID
 * @param file - 要上传的图片文件
 * @returns 上传后的横幅URL
 */
export async function uploadChannelBanner(
  channelId: string,
  file: File
): Promise<{ bannerUrl: string }> {
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
  const filename = `channel-banners/${session.user.id}/${channelId}/${uuidv4()}-${file.name}`;
  const blob = await put(filename, file, {
    access: 'public',
    addRandomSuffix: false,
  });

  // 4. 更新数据库中的频道记录
  const result = await db.update(channels)
    .set({
      bannerUrl: blob.url,
      updateTime: new Date().toISOString(), // 使用ISO字符串格式
    })
    .where(eq(channels.channelId, channelId))
    .returning({ 
      bannerUrl: channels.bannerUrl 
    });

  if (!result.length) {
    throw new Error('更新频道横幅失败');
  }

  // 5. 返回更新后的横幅URL
  return {
    bannerUrl: result[0]?.bannerUrl || '',
  };
}

/**
 * 删除频道横幅图片
 * @param channelId - 频道ID
 * @returns 是否成功删除
 */
export async function deleteChannelBanner(channelId: string): Promise<boolean> {
  // 1. 验证用户身份
  const session = await getSession();
  if (!session || !session?.user?.id) {
    throw new Error('请先登录');
  }

  // 2. 查询数据库中的记录
  const records = await db.select({
    channelId: channels.channelId,
    bannerUrl: channels.bannerUrl
  })
  .from(channels)
  .where(eq(channels.channelId, channelId));

  if (!records.length) {
    return true; // 没有找到记录，认为删除成功
  }

  const record = records[0];
  if (!record) {
    return true; // 安全检查
  }
  
  // 3. 从Vercel Blob中删除文件
  if (record.bannerUrl) {
    try {
      // 提取blob URL中的路径
      const url = new URL(record.bannerUrl);
      const pathName = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
      
      await del(pathName);
      
      // 4. 更新数据库记录，清除bannerUrl字段
      await db.update(channels)
        .set({
          bannerUrl: null,
          updateTime: new Date().toISOString(),
        })
        .where(eq(channels.channelId, channelId));
    } catch (error) {
      console.error('删除Blob文件失败:', error);
      // 即使删除Blob失败，我们仍然尝试更新数据库记录
    }
  }

  return true;
} 