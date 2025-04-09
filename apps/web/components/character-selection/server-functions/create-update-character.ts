"use server";

import { db } from "@db/index";
import { characters } from "@db/schema";
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { getSession } from "@server/lib/auth";
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from "next/cache";

/**
 * 创建新角色
 * @param seriesId - 系列ID
 * @param name - 角色名称
 * @param avatarFile - 角色头像文件（可选）
 * @returns 创建的角色信息
 */
export async function createCharacter(
  seriesId: string,
  name: string,
  avatarFile?: File
): Promise<{ id: string; name: string; avatarUrl: string | null }> {
  // 1. 验证用户身份
  const session = await getSession();
  if (!session || !session?.user?.id) {
    throw new Error('请先登录');
  }

  // 2. 验证参数
  if (!seriesId) {
    throw new Error('系列ID不能为空');
  }
  
  if (!name.trim()) {
    throw new Error('角色名称不能为空');
  }

  let avatarUrl = null;

  // 3. 如果有头像文件，上传到Vercel Blob
  if (avatarFile) {
    // 验证文件类型
    if (!avatarFile.type.startsWith('image/')) {
      throw new Error('只支持上传图片文件');
    }

    // 上传文件
    const filename = `character-avatars/${session.user.id}/${seriesId}/${uuidv4()}-${avatarFile.name}`;
    const blob = await put(filename, avatarFile, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    avatarUrl = blob.url;
  }

  // 4. 创建角色记录
  const result = await db.insert(characters)
    .values({
      seriesId,
      name,
      avatarUrl,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    })
    .returning({ 
      id: characters.id, 
      name: characters.name,
      avatarUrl: characters.avatarUrl 
    });

  if (!result.length) {
    throw new Error('创建角色失败');
  }

  const character = result[0];
  if (!character) {
    throw new Error('创建角色失败');
  }

  // 刷新相关页面数据
  revalidatePath(`/timeline/${seriesId}`);

  return {
    id: character.id,
    name: character.name,
    avatarUrl: character.avatarUrl,
  };
}

/**
 * 更新角色信息
 * @param characterId - 角色ID
 * @param name - 角色名称
 * @param avatarFile - 角色头像文件（可选）
 * @returns 更新后的角色信息
 */
export async function updateCharacter(
  characterId: string,
  name?: string,
  avatarFile?: File
): Promise<{ id: string; name: string; avatarUrl: string | null }> {
  // 1. 验证用户身份
  const session = await getSession();
  if (!session || !session?.user?.id) {
    throw new Error('请先登录');
  }

  // 2. 验证参数
  if (!characterId) {
    throw new Error('角色ID不能为空');
  }

  // 查询角色信息，确认存在
  const characterRecord = await db.select({
    id: characters.id,
    seriesId: characters.seriesId,
    avatarUrl: characters.avatarUrl,
  })
  .from(characters)
  .where(eq(characters.id, characterId))
  .limit(1);

  if (!characterRecord.length) {
    throw new Error('角色不存在');
  }

  const existingCharacter = characterRecord[0];
  if (!existingCharacter) {
    throw new Error('角色不存在');
  }

  const updateValues: any = {
    updateTime: new Date().toISOString(),
  };

  // 3. 设置要更新的字段
  if (name !== undefined && name.trim()) {
    updateValues.name = name;
  }

  // 4. 如果有头像文件，上传到Vercel Blob
  if (avatarFile) {
    // 验证文件类型
    if (!avatarFile.type.startsWith('image/')) {
      throw new Error('只支持上传图片文件');
    }

    // 上传文件
    const filename = `character-avatars/${session.user.id}/${existingCharacter.seriesId}/${uuidv4()}-${avatarFile.name}`;
    const blob = await put(filename, avatarFile, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    updateValues.avatarUrl = blob.url;
  }

  // 5. 更新角色记录
  const result = await db.update(characters)
    .set(updateValues)
    .where(eq(characters.id, characterId))
    .returning({ 
      id: characters.id, 
      name: characters.name,
      avatarUrl: characters.avatarUrl,
      seriesId: characters.seriesId
    });

  if (!result.length) {
    throw new Error('更新角色失败');
  }

  const character = result[0];
  if (!character) {
    throw new Error('更新角色失败');
  }

  // 刷新相关页面数据
  revalidatePath(`/timeline/${character.seriesId}`);

  return {
    id: character.id,
    name: character.name,
    avatarUrl: character.avatarUrl,
  };
} 