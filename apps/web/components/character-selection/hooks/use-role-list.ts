import { useState, useEffect, useCallback } from 'react';
import { getRoleList } from '../server-functions/get-role-list';
import { Character } from '@/components/timeline';

/**
 * 自定义Hook，用于获取系列角色列表
 * @param seriesId 系列ID
 * @returns 包含角色列表、加载状态和错误信息的对象
 */
export function useRoleList(seriesId: string) {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // 封装获取角色列表的函数，以便可以手动调用
    const fetchCharacters = useCallback(async () => {
        if (!seriesId) {
            setCharacters([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const characterList = await getRoleList(seriesId);
            setCharacters(characterList);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('获取角色列表失败'));
            console.error('获取角色列表失败:', err);
        } finally {
            setLoading(false);
        }
    }, [seriesId]);

    // 提供一个手动重新获取数据的方法
    const refetch = useCallback(async () => {
        await fetchCharacters();
    }, [fetchCharacters]);

    // 首次加载和seriesId变化时获取数据
    useEffect(() => {
        fetchCharacters();
    }, [fetchCharacters]);

    return {
        characters,
        loading,
        error,
        refetch
    };
} 