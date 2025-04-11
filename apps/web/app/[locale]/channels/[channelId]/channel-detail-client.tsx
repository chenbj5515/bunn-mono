"use client";

import { FC, ReactNode, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { motion } from 'framer-motion';
import { uploadChannelBanner } from './server-actions';

// 类型定义
interface ChannelDetail {
  channelId: string;
  channelName: string;
  avatarUrl: string | null;
  description: string | null;
  bannerUrl: string | null;
}

interface VideoItem {
  id: string;
  originalText: string | null;
  thumbnailUrl: string | null;
  platform: string | null;
  videoId: string;
  videoTitle: string;
  createTime: Date;
}

interface Position {
  x: number;
  y: number;
}

interface ChannelDetailClientProps {
  channelDetail: ChannelDetail;
  videoList: VideoItem[];
  bannerPosition: Position;
  avatarPosition: Position;
  titlePosition: Position;
}

const ChannelDetailClient: FC<ChannelDetailClientProps> = ({ 
  channelDetail, 
  videoList,
  bannerPosition: initialBannerPosition,
  avatarPosition: initialAvatarPosition,
  titlePosition: initialTitlePosition
}): ReactNode => {
  const pathname = usePathname();
  const t = useTranslations('ChannelDetail');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(channelDetail.bannerUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // 获取当前语言
  const locale = pathname.split('/')[1];

  // 返回频道列表页的链接
  const backToChannelsUrl = `/${locale}/channels`;

  // 横幅拖拽状态
  const [bannerPosition, setBannerPosition] = useState<Position>(initialBannerPosition);
  const [draggingBanner, setDraggingBanner] = useState<boolean>(false);
  const bannerDragOffset = useRef<Position | null>(null);
  const isBannerDraggingRef = useRef<boolean>(false);

  // 头像拖拽状态
  const [avatarPosition, setAvatarPosition] = useState<Position>(initialAvatarPosition);
  const [draggingAvatar, setDraggingAvatar] = useState<boolean>(false);
  const avatarDragOffset = useRef<Position | null>(null);
  const isAvatarDraggingRef = useRef<boolean>(false);

  // 标题拖拽状态
  const [titlePosition, setTitlePosition] = useState<Position>(initialTitlePosition);
  const [draggingTitle, setDraggingTitle] = useState<boolean>(false);
  const titleDragOffset = useRef<Position | null>(null);
  const isTitleDraggingRef = useRef<boolean>(false);

  // 保存位置到cookie
  const savePositionToCookie = (name: string, position: Position) => {
    try {
      document.cookie = `${name}_position=${JSON.stringify(position)}; path=/; max-age=31536000`; // 有效期一年
    } catch (error) {
      console.error(`Failed to save ${name} position to cookie:`, error);
    }
  };

  // 横幅开始拖动
  const handleBannerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    // 记录鼠标与元素当前位置的偏移
    bannerDragOffset.current = {
      x: e.clientX - bannerPosition.x,
      y: e.clientY - bannerPosition.y
    };

    setDraggingBanner(true);
    isBannerDraggingRef.current = false; // 重置拖动状态
  };

  // 头像开始拖动
  const handleAvatarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    // 记录鼠标与元素当前位置的偏移
    avatarDragOffset.current = {
      x: e.clientX - avatarPosition.x,
      y: e.clientY - avatarPosition.y
    };

    setDraggingAvatar(true);
    isAvatarDraggingRef.current = false; // 重置拖动状态
  };

  // 标题开始拖动
  const handleTitleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    // 记录鼠标与元素当前位置的偏移
    titleDragOffset.current = {
      x: e.clientX - titlePosition.x,
      y: e.clientY - titlePosition.y
    };

    setDraggingTitle(true);
    isTitleDraggingRef.current = false; // 重置拖动状态
  };

  // 横幅移动处理
  useEffect(() => {
    if (!draggingBanner) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!bannerDragOffset.current) return;

      // 标记为正在拖动
      isBannerDraggingRef.current = true;

      // 计算新位置 (鼠标位置减去偏移量)
      const x = e.clientX - bannerDragOffset.current.x;
      const y = e.clientY - bannerDragOffset.current.y;

      // 更新位置
      setBannerPosition({ x, y });
    };

    const handleMouseUp = () => {
      setDraggingBanner(false);

      // 保存当前位置到cookie
      savePositionToCookie('banner', bannerPosition);

      // 延迟重置拖动状态
      setTimeout(() => {
        isBannerDraggingRef.current = false;
      }, 10);
    };

    // 添加全局事件监听
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 清理函数
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingBanner, bannerPosition]);

  // 头像移动处理
  useEffect(() => {
    if (!draggingAvatar) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!avatarDragOffset.current) return;

      // 标记为正在拖动
      isAvatarDraggingRef.current = true;

      // 计算新位置 (鼠标位置减去偏移量)
      const x = e.clientX - avatarDragOffset.current.x;
      const y = e.clientY - avatarDragOffset.current.y;

      // 更新位置
      setAvatarPosition({ x, y });
    };

    const handleMouseUp = () => {
      setDraggingAvatar(false);

      // 保存当前位置到cookie
      savePositionToCookie('avatar', avatarPosition);

      // 延迟重置拖动状态
      setTimeout(() => {
        isAvatarDraggingRef.current = false;
      }, 10);
    };

    // 添加全局事件监听
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 清理函数
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingAvatar, avatarPosition]);

  // 标题移动处理
  useEffect(() => {
    if (!draggingTitle) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!titleDragOffset.current) return;

      // 标记为正在拖动
      isTitleDraggingRef.current = true;

      // 计算新位置 (鼠标位置减去偏移量)
      const x = e.clientX - titleDragOffset.current.x;
      const y = e.clientY - titleDragOffset.current.y;

      // 更新位置
      setTitlePosition({ x, y });
    };

    const handleMouseUp = () => {
      setDraggingTitle(false);

      // 保存当前位置到cookie
      savePositionToCookie('title', titlePosition);

      // 延迟重置拖动状态
      setTimeout(() => {
        isTitleDraggingRef.current = false;
      }, 10);
    };

    // 添加全局事件监听
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 清理函数
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTitle, titlePosition]);

  // 处理横幅图片上传
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      console.error('只支持上传图片文件');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // 创建预览
      const imageUrl = URL.createObjectURL(file);
      setBannerUrl(imageUrl);
      
      // 上传横幅图片
      const result = await uploadChannelBanner(channelDetail.channelId, file);
      
      // 更新最终URL
      setBannerUrl(result.bannerUrl);
      console.log('横幅图片上传成功');
    } catch (error) {
      console.error('上传横幅图片失败:', error);
      // 恢复原来的URL
      setBannerUrl(channelDetail.bannerUrl);
    } finally {
      setIsUploading(false);
      
      // 清空文件输入，以便再次选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 触发文件选择对话框
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="relative mx-auto px-4 py-8 container">
      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleBannerUpload}
        accept="image/*"
        className="hidden"
      />

      {/* 可拖拽的顶部横幅 */}
      <div
        className={`absolute ${draggingBanner ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: `${bannerPosition.x}px`,
          top: `${bannerPosition.y}px`,
          zIndex: draggingBanner ? 100 : 10,
          touchAction: 'none', // 防止触摸事件引起页面滚动
        }}
        onMouseDown={handleBannerMouseDown}
      >
        <motion.div
          className="relative bg-gray-200 rounded-lg w-[1070px] h-[172px] overflow-hidden"
        >
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt="Channel Banner"
              fill
              className="object-cover"
              draggable="false"
            />
          ) : (
            <div 
              className="flex justify-center items-center w-full h-full cursor-pointer"
              onClick={triggerFileUpload}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="bg-gray-300 p-3 rounded-full">
                  <svg className="w-6 h-6 text-gray-600" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-gray-600">
                  {isUploading ? '上传中...' : '点击上传横幅图片'}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* 可拖拽的头像 */}
      <div
        className={`absolute ${draggingAvatar ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: `${avatarPosition.x}px`,
          top: `${avatarPosition.y}px`,
          zIndex: draggingAvatar ? 100 : 20,
          touchAction: 'none',
        }}
        onMouseDown={handleAvatarMouseDown}
      >
        <motion.div
          className="relative rounded-full w-24 h-24 overflow-hidden"
        >
          <Image
            src={channelDetail.avatarUrl || "/placeholder-avatar.png"}
            alt={channelDetail.channelName}
            fill
            className="object-cover"
            draggable="false"
          />
        </motion.div>
      </div>

      {/* 可拖拽的标题 */}
      <div
        className={`absolute ${draggingTitle ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: `${titlePosition.x}px`,
          top: `${titlePosition.y}px`,
          zIndex: draggingTitle ? 100 : 20,
          touchAction: 'none',
        }}
        onMouseDown={handleTitleMouseDown}
      >
        <motion.div>
          <h1 className="font-bold text-3xl">{channelDetail.channelName}</h1>
        </motion.div>
      </div>

      {/* 内容区域 */}
      <div className="mt-[300px]">
        {/* 内容放在这里，给所有可拖拽元素留出空间 */}
      </div>
    </div>
  );
};

export default ChannelDetailClient; 