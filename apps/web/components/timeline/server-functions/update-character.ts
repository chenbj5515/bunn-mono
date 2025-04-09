"use server";

import { db } from "@db/index";
import { memoCard } from "@db/schema";
import { eq } from "drizzle-orm";
import { getSession } from '@server/lib/auth';
import { revalidatePath } from "next/cache";

/**
 * 更新memoCard的角色关联
 * @param memoCardId memoCard的ID
 * @param characterId 角色的ID
 * @returns 更新结果
 */
export async function updateMemoCardCharacter(memoCardId: string, characterId: string) {
    try {
        // 获取当前会话
        const session = await getSession();
        
        if (!session) {
            return {
                success: false,
                message: "未授权操作"
            };
        }
        
        // 更新memoCard的characterId
        await db
            .update(memoCard)
            .set({
                characterId,
                updateTime: new Date().toISOString()
            })
            .where(
                eq(memoCard.id, memoCardId)
            );
        
        // 刷新页面数据
        revalidatePath('/timeline/[seriesId]');
        
        return {
            success: true,
            message: "角色关联更新成功"
        };
    } catch (error) {
        console.error("更新memoCard角色关联失败:", error);
        return {
            success: false,
            message: "角色关联更新失败"
        };
    }
} 