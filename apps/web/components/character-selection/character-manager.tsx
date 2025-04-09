"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "ui/components/button";
import { Input } from "ui/components/input";
import { Avatar, AvatarImage, AvatarFallback } from "ui/components/avatar";
import { useTranslations } from "next-intl";
import { Character } from "@/components/timeline";
import { createCharacter, updateCharacter } from "./server-functions/create-update-character";
import { PlusCircle } from "lucide-react";

interface CharacterManagerProps {
  seriesId: string;
  onSuccess?: (character: Character) => void;
  existingCharacter?: Character; // 传入现有角色表示编辑模式
  characters: Character[];
}

export function CharacterManager({
  seriesId,
  onSuccess,
  existingCharacter,
  characters,
}: CharacterManagerProps) {
  // const t = useTranslations('character');
  const [name, setName] = useState(existingCharacter?.name || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(existingCharacter?.avatarUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 创建一个新角色元素 (初始空状态)
  const isNewEmpty = !existingCharacter && !name && !avatarFile;

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // 创建预览URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      
      setError(null);
    }
  };

  // 打开文件选择对话框
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setError(null);
      setIsSubmitting(true);

      if (!name.trim()) {
        setError("角色名称不能为空");
        return;
      }

      let result;
      
      if (existingCharacter) {
        // 更新现有角色
        result = await updateCharacter(
          existingCharacter.id,
          name,
          avatarFile || undefined
        );
      } else {
        // 创建新角色
        result = await createCharacter(
          seriesId,
          name,
          avatarFile || undefined
        );
      }

      // 通知父组件成功
      if (onSuccess) {
        onSuccess({
          id: result.id,
          name: result.name,
          avatarUrl: result.avatarUrl || '',
          seriesId,
        });
      }

      // 重置表单（如果是添加模式）
      if (!existingCharacter) {
        setName("");
        setAvatarFile(null);
        setAvatarPreview(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
      console.error("角色操作失败:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 组件卸载时清理预览URL
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarFile) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview, avatarFile]);

  // 渲染添加新角色的空状态按钮
  if (isNewEmpty) {
    return (
      <div 
        className="flex flex-col justify-center items-center p-4 border border-gray-300 hover:border-gray-400 border-dashed rounded-lg transition-colors cursor-pointer"
        onClick={triggerFileInput}
      >
        <PlusCircle className="mb-2 w-8 h-8 text-gray-400" />
        <span className="text-gray-500 text-sm">添加新角色</span>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        {/* 头像上传部分 */}
        <div className="relative">
          <Avatar 
            className="w-16 h-16 cursor-pointer"
            onClick={triggerFileInput}
          >
            {avatarPreview ? (
              <AvatarImage src={avatarPreview} alt={name} />
            ) : (
              <AvatarFallback>{name.substring(0, 2)}</AvatarFallback>
            )}
          </Avatar>
          <div className="top-0 right-0 absolute flex justify-center items-center bg-primary rounded-full w-6 h-6 text-white cursor-pointer">
            <PlusCircle className="w-4 h-4" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {/* 角色名称输入框 */}
        <div className="flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入角色名称"
            className="w-full"
            onBlur={handleSubmit}
          />
        </div>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
    </div>
  );
}

// 角色列表管理组件
export function CharacterList({
  seriesId,
  characters,
  onCharacterUpdate,
}: {
  seriesId: string;
  characters: Character[];
  onCharacterUpdate?: (characters: Character[]) => void;
}) {
  const [localCharacters, setLocalCharacters] = useState<Character[]>(characters);
  const [showNewCharacter, setShowNewCharacter] = useState(false);

  // 当characters prop变化时更新本地状态
  useEffect(() => {
    setLocalCharacters(characters);
  }, [characters]);

  // 处理添加新角色
  const handleAddCharacter = (character: Character) => {
    const updatedCharacters = [...localCharacters, character];
    setLocalCharacters(updatedCharacters);
    setShowNewCharacter(false);
    
    if (onCharacterUpdate) {
      onCharacterUpdate(updatedCharacters);
    }
  };

  // 处理更新现有角色
  const handleUpdateCharacter = (updatedCharacter: Character) => {
    const updatedCharacters = localCharacters.map(char => 
      char.id === updatedCharacter.id ? updatedCharacter : char
    );
    
    setLocalCharacters(updatedCharacters);
    
    if (onCharacterUpdate) {
      onCharacterUpdate(updatedCharacters);
    }
  };

  return (
    <div className="space-y-4">
      {/* 现有角色列表 */}
      {localCharacters.map(character => (
        <CharacterManager
          key={character.id}
          seriesId={seriesId}
          existingCharacter={character}
          onSuccess={handleUpdateCharacter}
          characters={localCharacters}
        />
      ))}

      {/* 新角色添加区域 */}
      {showNewCharacter ? (
        <CharacterManager
          seriesId={seriesId}
          onSuccess={handleAddCharacter}
          characters={localCharacters}
        />
      ) : (
        <CharacterManager
          seriesId={seriesId}
          onSuccess={handleAddCharacter}
          characters={localCharacters}
        />
      )}
    </div>
  );
} 