"use client";

import { FC, ReactNode, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { motion } from 'framer-motion';
import { uploadChannelBanner, uploadChannelAvatar } from './server-actions';
import { MemoCard } from "@/components/memo-card";
import { MemoCardWithMetadata } from '@/components/timeline';
import { MemoCardWithChannel } from './page';
import { UploadDialog } from '@/components/upload-dialog';
import { VideoSelector, VideoInfo } from '@/components/video-selector';
import { Trash, ChevronDown } from 'lucide-react';
import { deleteMemoCard } from '@/components/memo-card/server-functions';
import { ResizableImage } from '@/components/timeline/resizable-image';
import Cookies from 'js-cookie';

// 类型定义
interface ChannelDetail {
  channelId: string;
  channelName: string;
  avatarUrl: string | null;
  description: string | null;
  bannerUrl: string | null;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface ChannelDetailClientProps {
  channelDetail: ChannelDetail;
  memoCardList: MemoCardWithChannel[];
  bannerPosition: Position;
  avatarPosition: Position;
  titlePosition: Position;
  bannerSize: Size;
  avatarSize: Size;
  titleSize: Size;
}

// 定义一个可调整大小的文本组件
interface ResizableTextProps {
  text: string;
  initialPosition: Position;
  initialSize: Size;
  cookieId?: string;
  className?: string;
  type?: string;
}

const ResizableText: FC<ResizableTextProps> = ({
  text,
  initialPosition,
  initialSize,
  cookieId = '',
  className = '',
  type = 'title'
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const positionCookieKey = cookieId ? `${type}_position_${cookieId}` : '';
  const sizeCookieKey = cookieId ? `${type}_size_${cookieId}` : '';

  // 开始拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    // 检查是否点击了调整大小的手柄
    const target = e.target as HTMLElement;
    if (target.className?.includes?.('resize-handle')) return;

    e.preventDefault(); // 防止默认的拖拽行为
    e.stopPropagation(); // 阻止事件冒泡
    setIsDragging(true);
    setIsInteracting(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // 开始调整大小
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setIsInteracting(true);
    setResizeDirection(direction);
    setStartPos({
      x: e.clientX,
      y: e.clientY
    });
    setStartSize({
      width: size.width,
      height: size.height
    });
  };

  // 处理鼠标移动
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    } else if (isResizing && resizeDirection) {
      let deltaWidth = 0;
      let newWidth = startSize.width;
      let newHeight = startSize.height;
      let newX = position.x;
      let newY = position.y;

      // 根据不同调整方向计算新的尺寸和位置
      switch (resizeDirection) {
        case 'bottom-right':
          deltaWidth = e.clientX - startPos.x;
          newWidth = Math.max(40, startSize.width + deltaWidth);
          // 可以选择是否锁定高度比例
          newHeight = startSize.height;
          break;
        case 'bottom-left':
          deltaWidth = startPos.x - e.clientX;
          newWidth = Math.max(40, startSize.width + deltaWidth);
          newHeight = startSize.height;
          newX = position.x - (newWidth - startSize.width);
          break;
        case 'top-right':
          deltaWidth = e.clientX - startPos.x;
          newWidth = Math.max(40, startSize.width + deltaWidth);
          newHeight = startSize.height;
          break;
        case 'top-left':
          deltaWidth = startPos.x - e.clientX;
          newWidth = Math.max(40, startSize.width + deltaWidth);
          newHeight = startSize.height;
          newX = position.x - (newWidth - startSize.width);
          break;
      }

      setSize({
        width: newWidth,
        height: newHeight
      });
      setPosition({
        x: newX,
        y: newY
      });
    }
  };

  // 结束拖动或调整大小
  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      setIsInteracting(false);
      setResizeDirection(null);

      // 保存到cookie
      if (cookieId) {
        Cookies.set(positionCookieKey, JSON.stringify(position), { expires: 365 });
        Cookies.set(sizeCookieKey, JSON.stringify(size), { expires: 365 });
      }
    }
  };

  // 添加和移除全局鼠标事件监听器
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      // 添加移动和调整时禁用选择的样式
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // 恢复文本选择
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // 确保清理
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, resizeDirection]);

  // 字体大小根据容器宽度调整
  const fontSize = Math.max(18, Math.min(48, size.width / 10)); // 适配文本大小

  return (
    <div
      ref={textRef}
      className={`fixed ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        background: 'transparent',
        zIndex: 50,
        userSelect: 'none',
        border: isInteracting ? '2px solid rgb(59, 130, 246)' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onDragStart={(e) => e.preventDefault()} // 阻止默认的拖拽行为
    >
      <div className="w-full overflow-hidden text-center">
        <h1 className="font-bold truncate" style={{ fontSize: `${fontSize}px` }}>
          {text}
        </h1>
      </div>

      {/* 右下角调整手柄 */}
      <div
        className={`right-0 bottom-0 absolute resize-handle cursor-se-resize`}
        style={{
          width: '10px',
          height: '10px',
          background: 'rgb(59, 130, 246)',
          border: '1px solid white',
          visibility: (isInteracting || isHovering) ? 'visible' : 'hidden',
        }}
        onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
      />
      {/* 左下角调整手柄 */}
      <div
        className={`bottom-0 left-0 absolute resize-handle cursor-sw-resize`}
        style={{
          width: '10px',
          height: '10px',
          background: 'rgb(59, 130, 246)',
          border: '1px solid white',
          visibility: (isInteracting || isHovering) ? 'visible' : 'hidden',
        }}
        onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
      />
      {/* 右上角调整手柄 */}
      <div
        className={`top-0 right-0 absolute resize-handle cursor-ne-resize`}
        style={{
          width: '10px',
          height: '10px',
          background: 'rgb(59, 130, 246)',
          border: '1px solid white',
          visibility: (isInteracting || isHovering) ? 'visible' : 'hidden',
        }}
        onMouseDown={(e) => handleResizeStart(e, 'top-right')}
      />
      {/* 左上角调整手柄 */}
      <div
        className={`top-0 left-0 absolute resize-handle cursor-nw-resize`}
        style={{
          width: '10px',
          height: '10px',
          background: 'rgb(59, 130, 246)',
          border: '1px solid white',
          visibility: (isInteracting || isHovering) ? 'visible' : 'hidden',
        }}
        onMouseDown={(e) => handleResizeStart(e, 'top-left')}
      />
    </div>
  );
};

const ChannelDetailClient: FC<ChannelDetailClientProps> = ({
  channelDetail,
  memoCardList,
  bannerPosition: initialBannerPosition,
  avatarPosition: initialAvatarPosition,
  titlePosition: initialTitlePosition,
  bannerSize: initialBannerSize,
  avatarSize: initialAvatarSize,
  titleSize: initialTitleSize
}): ReactNode => {
  const pathname = usePathname();
  const t = useTranslations('ChannelDetail');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const videoTitleRef = useRef<HTMLDivElement>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(channelDetail.bannerUrl);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(channelDetail.avatarUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState<boolean>(false);

  // 视频选择状态
  const [isVideoSelectorOpen, setIsVideoSelectorOpen] = useState<boolean>(false);
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('');
  const [filteredCards, setFilteredCards] = useState<MemoCardWithChannel[]>([]);
  const [selectorPosition, setSelectorPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 300 });

  // 获取当前语言
  const locale = pathname.split('/')[1];

  // 返回频道列表页的链接
  const backToChannelsUrl = `/${locale}/channels`;

  // 使用从服务端获取的位置和大小
  const [bannerPosition, setBannerPosition] = useState<Position>(initialBannerPosition);
  const [bannerSize, setBannerSize] = useState<Size>(initialBannerSize);

  // 头像位置和大小状态
  const [avatarPosition, setAvatarPosition] = useState<Position>(initialAvatarPosition);
  const [avatarSize, setAvatarSize] = useState<Size>(initialAvatarSize);

  // 标题位置和大小状态
  const [titlePosition, setTitlePosition] = useState<Position>(initialTitlePosition);
  const [titleSize, setTitleSize] = useState<Size>(initialTitleSize);

  // 根据 memoCardList 整理出不重复的视频列表
  useEffect(() => {
    if (memoCardList && memoCardList.length > 0) {
      const uniqueVideos = Array.from(
        new Map(
          memoCardList.map(card => [
            card.videoId,
            { videoId: card.videoId, videoTitle: card.videoTitle }
          ])
        ).values()
      );
      setVideos(uniqueVideos);

      // 默认选择最新的视频（假设列表是按照创建时间排序的）
      const latestCard = memoCardList[memoCardList.length - 1];
      if (latestCard) {
        setCurrentVideoId(latestCard.videoId);
        setCurrentVideoTitle(latestCard.videoTitle);

        // 筛选出最新视频的卡片
        filterCardsByVideo(latestCard.videoId);
      }
    }
  }, [memoCardList]);

  // 根据选中的视频 ID 筛选卡片
  const filterCardsByVideo = (videoId: string) => {
    const filtered = memoCardList.filter(card => card.videoId === videoId);
    setFilteredCards(filtered);
  };

  // 处理视频选择
  const handleVideoSelect = (videoId: string, videoTitle: string) => {
    setCurrentVideoId(videoId);
    setCurrentVideoTitle(videoTitle);
    filterCardsByVideo(videoId);
  };

  // 处理打开视频选择器
  const handleOpenVideoSelector = () => {
    if (videoTitleRef.current) {
      const rect = videoTitleRef.current.getBoundingClientRect();
      const titleCenter = rect.left + (rect.width / 2);
      setSelectorPosition({
        top: rect.bottom + window.scrollY + 5, // 添加5px的间隔
        left: titleCenter,
        width: Math.max(rect.width, 280) // 确保弹窗宽度至少280px
      });
    }
    setIsVideoSelectorOpen(true);
  };

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

  // 处理头像图片上传
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      console.error('只支持上传图片文件');
      return;
    }

    setIsAvatarUploading(true);

    try {
      // 创建预览
      const imageUrl = URL.createObjectURL(file);
      setAvatarUrl(imageUrl);

      // 上传头像图片
      const result = await uploadChannelAvatar(channelDetail.channelId, file);

      // 更新最终URL
      setAvatarUrl(result.avatarUrl);
      console.log('头像图片上传成功');
    } catch (error) {
      console.error('上传头像图片失败:', error);
      // 恢复原来的URL
      setAvatarUrl(channelDetail.avatarUrl);
    } finally {
      setIsAvatarUploading(false);

      // 清空文件输入，以便再次选择同一文件
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = '';
      }
    }
  };

  // 触发文件选择对话框
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 处理上传图片对话框
  const handleOpenUploadDialog = (id: string, uploadType?: string) => {
    console.log('打开上传对话框', id, uploadType);
    if (id === 'banner' && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (id === 'avatar' && avatarFileInputRef.current) {
      avatarFileInputRef.current.click();
    }
  };

  async function handleDelete(id: string) {
    setFilteredCards(prev => prev.filter(card => card.id !== id));

    try {
      await deleteMemoCard(id);
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  return (
    <div className="relative w-full">
      {/* 隐藏的文件输入 - 横幅 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleBannerUpload}
        accept="image/*"
        className="hidden"
      />

      {/* 隐藏的文件输入 - 头像 */}
      <input
        type="file"
        ref={avatarFileInputRef}
        onChange={handleAvatarUpload}
        accept="image/*"
        className="hidden"
      />

      {/* 可调整大小的顶部横幅 */}
      {bannerUrl ? (
        <ResizableImage
          src={bannerUrl}
          alt="Channel Banner"
          initialPosition={bannerPosition}
          initialSize={bannerSize}
          borderRadius={8}
          cookieId={channelDetail.channelId}
          type="cover"
          id="banner"
          onOpenUploadDialog={handleOpenUploadDialog}
        />
      ) : (
        <div
          className="fixed bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
          style={{
            left: `${bannerPosition.x}px`,
            top: `${bannerPosition.y}px`,
            width: `${bannerSize.width}px`,
            height: `${bannerSize.height}px`,
            zIndex: 10,
          }}
          onClick={triggerFileUpload}
        >
          <div className="flex justify-center items-center w-full h-full">
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
        </div>
      )}

      {/* 可调整大小的头像 */}
      <ResizableImage
        src={avatarUrl || "/placeholder-avatar.png"}
        alt={channelDetail.channelName}
        initialPosition={avatarPosition}
        initialSize={avatarSize}
        borderRadius={50}
        cookieId={channelDetail.channelId}
        aspectRatio={1}
        type="title"
        id="avatar"
        onOpenUploadDialog={handleOpenUploadDialog}
      />

      {/* 可调整大小的标题 */}
      <ResizableText
        text={channelDetail.channelName}
        initialPosition={titlePosition}
        initialSize={titleSize}
        cookieId={channelDetail.channelId}
        type="title_text"
      />

      {/* 内容区域 */}
      <div className="space-y-6 ml-auto px-4 md:pr-8 w-full md:w-1/2">
        {/* 视频选择器标题 */}
        <div
          ref={videoTitleRef}
          className="relative mb-16 text-center"
        >
          <div
            className="inline-flex items-center gap-2 hover:text-blue-600 transition-colors cursor-pointer"
            onClick={handleOpenVideoSelector}
          >
            <h2 className="font-semibold text-xl">
              {currentVideoTitle || t('selectVideo', { fallback: '选择视频' })}
              {/* 视频选择器弹窗 */}
              <VideoSelector
                isOpen={isVideoSelectorOpen}
                onClose={() => setIsVideoSelectorOpen(false)}
                onSelect={handleVideoSelect}
                title={t('selectVideo', { fallback: '选择视频' })}
                videos={videos}
                currentVideoId={currentVideoId}
              />
            </h2>
            <ChevronDown className="w-4 h-4" />

          </div>
        </div>

        {/* 卡片列表 */}
        <div className="space-y-24">
          {filteredCards.map((card, index) => {
            return (
              <div key={card.id} className="group relative">
                <button
                  className="top-0 right-[2%] z-10 absolute opacity-0 group-hover:opacity-100 p-1 rounded-full transition-opacity duration-200"
                  onClick={() => handleDelete(card.id)}
                >
                  <Trash className="w-5 h-5" />
                </button>
                <MemoCard
                  {...card}
                  weakBorder={true}
                  hideCreateTime={false}
                  character={card.character || undefined}
                />
              </div>
            )
          })}

          {/* {filteredCards.length === 0 && (
            <div className="py-10 text-gray-500 text-center">
              {t('noCards', { fallback: '没有卡片' })}
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default ChannelDetailClient; 