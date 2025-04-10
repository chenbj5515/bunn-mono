"use client"
import React, { useState } from "react";
import { Character } from "../timeline";
import { useRoleList } from "./hooks/use-role-list";
import { CharacterManager } from "./character-manager";
import { PlusCircle, Upload } from "lucide-react";
import { Button } from "ui/components/button";
import { Input } from "ui/components/input";
import { Avatar, AvatarFallback, AvatarImage } from "ui/components/avatar";
import { createCharacter, updateCharacter } from "./server-functions/create-update-character";
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from 'next-intl';

// 角色选择弹窗组件
export function CharacterSelectionDialog(
    { relatedId, onClose, onSelect }: {
        relatedId: string,
        onClose: () => void,
        onSelect?: (character: Character) => void
    }
) {
    const [searchTerm, setSearchTerm] = useState('');
    const [temporaryCharacters, setTemporaryCharacters] = useState<Character[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const dialogRef = React.useRef<HTMLDivElement>(null);
    const { characters, loading, error, refetch } = useRoleList(relatedId);
    const t = useTranslations('characterSelection');

    // 合并服务端角色和临时角色
    const allCharacters = [...characters, ...temporaryCharacters];

    // 根据搜索词过滤角色列表
    const filteredCharacters = React.useMemo(() => {
        if (!searchTerm.trim()) return allCharacters;

        return allCharacters.filter(character =>
            character.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allCharacters, searchTerm]);

    // 点击外部关闭弹窗
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // 角色选择处理函数
    const handleSelectCharacter = (character: Character) => {
        if (onSelect) {
            onSelect(character);
        } else {
            // 这里可以添加角色选择后的逻辑
            console.log('选择了角色:', character);
        }
        onClose();
    };

    // 处理添加角色 - 添加一个空角色到临时列表
    const handleAddCharacter = () => {
        const emptyCharacter: Character = {
            id: `temp-${uuidv4()}`, // 临时ID，以temp-开头
            name: '',
            avatarUrl: '',
            relatedId,
            relatedType: 'series',
            userId: '', // 临时默认值，后端会替换为实际用户ID
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
            description: null
        };

        setTemporaryCharacters(prev => [...prev, emptyCharacter]);
    };

    // 处理角色名称变更
    const handleNameChange = (tempId: string, name: string) => {
        if (tempId.startsWith('temp-')) {
            // 更新临时角色名称
            setTemporaryCharacters(prev =>
                prev.map(char =>
                    char.id === tempId ? { ...char, name } : char
                )
            );
        }
    };

    // 处理角色头像上传
    const handleAvatarUpload = async (tempId: string, file: File) => {
        if (tempId.startsWith('temp-')) {
            // 临时预览
            const previewUrl = URL.createObjectURL(file);

            setTemporaryCharacters(prev =>
                prev.map(char =>
                    char.id === tempId ? { ...char, avatarUrl: previewUrl, _file: file } : char
                )
            );
        }
    };

    // 提交角色数据到服务器
    const handleSubmitCharacter = async (character: Character & { _file?: File }) => {
        try {
            if (!character.name.trim()) {
                return; // 名称为空不提交
            }

            let result;

            if (character.id.startsWith('temp-')) {
                // 创建新角色
                result = await createCharacter(
                    character.relatedId,
                    character.name,
                    character._file
                );

                // 移除临时角色
                setTemporaryCharacters(prev =>
                    prev.filter(char => char.id !== character.id)
                );

                // 刷新角色列表
                await refetch();
            }
        } catch (error) {
            console.error('保存角色失败:', error);
        }
    };

    // 渲染单个角色项
    const renderCharacterItem = (character: Character & { _file?: File }) => {
        const isTemporary = character.id.startsWith('temp-');

        if (isTemporary) {
            return (
                <div key={character.id} className="flex items-center gap-3 p-2">
                    {/* 角色头像上传区 */}
                    <div className="relative">
                        <Avatar
                            className="bg-white shadow-neumorphic hover:shadow-neumorphic-button-hover w-8 h-8 cursor-pointer"
                            onClick={() => {
                                if (fileInputRef.current) {
                                    fileInputRef.current.dataset.characterId = character.id;
                                    fileInputRef.current.click();
                                }
                            }}
                        >
                            {character.avatarUrl ? (
                                <AvatarImage src={character.avatarUrl} alt={character.name || t('newCharacter')} />
                            ) : (
                                <Upload className="top-1/2 left-1/2 absolute w-4 h-4 text-black -translate-x-1/2 -translate-y-1/2" />
                            )}
                        </Avatar>
                    </div>

                    {/* 角色名称输入 */}
                    <Input
                        value={character.name}
                        placeholder={t('enterCharacterName')}
                        className="flex-1 focus:border-black focus-visible:outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 h-8 placeholder:text-gray-500 text-sm"
                        onChange={(e) => handleNameChange(character.id, e.target.value)}
                        onBlur={() => {
                            if (character.name.trim()) {
                                handleSubmitCharacter(character);
                            }
                        }}
                        autoFocus
                    />
                </div>
            );
        }

        // 渲染正常角色项
        return (
            <div
                key={character.id}
                className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 p-2 cursor-pointer"
                onClick={() => handleSelectCharacter(character)}
            >
                <img
                    src={character.avatarUrl || '/placeholder-avatar.png'}
                    alt={character.name}
                    className="mr-3 rounded-full w-8 h-8 object-cover"
                    onError={(e) => {
                        // 图片加载失败时使用占位图
                        (e.target as HTMLImageElement).src = '/placeholder-avatar.png';
                    }}
                />
                <span className="text-sm">{character.name}</span>
            </div>
        );
    };

    return (
        <div
            ref={dialogRef}
            className="top-[90px] left-[20px] z-[1000] absolute bg-white dark:bg-gray-800 shadow-neumorphic rounded-lg w-72 max-h-80 overflow-hidden"
            style={{ boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}
        >
            {/* 隐藏的文件输入 */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0] && fileInputRef.current?.dataset.characterId) {
                        const characterId = fileInputRef.current.dataset.characterId;
                        handleAvatarUpload(characterId, e.target.files[0]);
                        // 文件选择后，如果角色有名称，自动提交
                        const character = temporaryCharacters.find(c => c.id === characterId);
                        if (character && character.name.trim()) {
                            handleSubmitCharacter({
                                ...character,
                                _file: e.target.files[0]
                            });
                        }
                    }
                }}
            />

            {/* 头部 */}
            <div className="flex justify-between items-center p-3 border-b">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder={t('searchCharacter')}
                        className="px-3 py-1 border focus:border-gray-500 rounded-md focus:outline-none w-full text-gray-500 placeholder:text-gray-500 text-sm transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg
                        className="top-1/2 right-2 absolute w-4 h-4 text-black -translate-y-1/2 transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <button
                    className="relative shadow-neumorphic hover:shadow-neumorphic-button-hover ml-2 p-1 rounded-full w-8 h-8"
                    onClick={handleAddCharacter}
                >
                    <svg
                        className="top-1/2 left-1/2 absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
            </div>

            {/* 角色列表 */}
            <div className="overflow-y-auto" style={{ maxHeight: '200px' }}>
                {loading ? (
                    <div className="p-3 text-black text-sm text-center">
                        {t('loading')}
                    </div>
                ) : error ? (
                    <div className="p-3 text-red-500 text-sm text-center">
                        {t('loadFailed')}: {error.message}
                    </div>
                ) : filteredCharacters.length === 0 ? (
                    <div
                        className="flex flex-col justify-center items-center hover:bg-gray-50 p-4 cursor-pointer"
                        onClick={handleAddCharacter}
                    >
                        <PlusCircle className="mb-2 w-8 h-8 text-black" />
                        <span className="text-black text-sm">
                            {searchTerm ? t('noMatchingCharacters') : t('clickToAddNewCharacter')}
                        </span>
                    </div>
                ) : (
                    filteredCharacters.map(character => renderCharacterItem(character as any))
                )}
            </div>
        </div>
    );
}