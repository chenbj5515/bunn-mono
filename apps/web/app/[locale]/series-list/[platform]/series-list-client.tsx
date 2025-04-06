"use client";
import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadDialog } from '@/components/upload-dialog';
import { uploadSeriesCover, deleteSeriesCover, uploadCustomTitleBackground, deleteCustomTitleBackground } from '@/components/upload-dialog/server-functions';
import { useRouter, usePathname } from 'next/navigation';
import { PosterCard, Poster } from '@/components/poster-card';
import { useTranslations } from 'next-intl';

// 定义卡片位置类型
interface CardPosition {
  left: string;
  top: string;
  rotate: string;
  zIndex: number;
}

interface SeriesListClientProps {
  posterImages: Poster[]; // 接收来自 RSC 的数据
}

const SeriesListClient: FC<SeriesListClientProps> = ({ posterImages }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [localPosterImages, setLocalPosterImages] = useState(posterImages);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentPosterId, setCurrentPosterId] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [uploadType, setUploadType] = useState<string>("coverUrl"); // 默认为封面上传
  
  // 前10个基础卡片位置和旋转角度配置
  const baseCardPositions: CardPosition[] = [
    { left: '10%', top: '20%', rotate: '12deg', zIndex: 9 }, // 7
    { left: '30%', top: '24%', rotate: '8deg', zIndex: 13 }, // 3
    { left: '50%', top: '20%', rotate: '3deg', zIndex: 11 }, // 5
    { left: '70%', top: '22%', rotate: '-7deg', zIndex: 12 }, // 4
    { left: '90%', top: '16%', rotate: '5deg', zIndex: 8 }, // 8
    { left: '10%', top: '65%', rotate: '-10deg', zIndex: 7 }, // 9
    { left: '30%', top: '68%', rotate: '-15deg', zIndex: 10 }, // 6
    { left: '50%', top: '60%', rotate: '5deg', zIndex: 15 }, // 1
    { left: '72%', top: '65%', rotate: '-12deg', zIndex: 14 }, // 2
    { left: '92%', top: '68%', rotate: '8deg', zIndex: 6 }, // 10
  ];

  // 根据posterImages数量动态生成cardPositions
  const positions: CardPosition[] = [...baseCardPositions];
  const count = posterImages.length;

  // 如果海报数量超过10个，生成额外的位置
  if (count > 10) {
    const extraGroups = Math.ceil((count - 10) / 10);
    for (let group = 0; group < extraGroups; group++) {
      const topIncrement = (group + 1) * 90;
      const positionsToGenerate = Math.min(10, count - 10 - group * 10);
      for (let i = 0; i < positionsToGenerate; i++) {
        if (i < baseCardPositions.length) {
          const basePosition = baseCardPositions[i]!;
          const newTopValue = `${parseFloat(basePosition.top.replace('%', '')) + topIncrement}%`;
          positions.push({
            left: basePosition.left,
            top: newTopValue,
            rotate: basePosition.rotate,
            zIndex: basePosition.zIndex - (group + 1) * 10,
          });
        }
      }
    }
  }

  // 处理上传
  const handleUpload = async (posterId: string, file: File, type?: string) => {
    console.log(`上传图片到海报ID ${posterId}, 类型: ${type || uploadType}:`, file);
    
    const actualUploadType = type || uploadType;
    
    // 如果是更换操作，先删除旧资源
    if (isReplacing) {
      const poster = localPosterImages.find(p => p.id === posterId);
      if (poster && poster.src && !poster.src.startsWith('blob:')) {
        try {
          // 根据上传类型选择适当的删除函数
          if (actualUploadType === 'customTitleUrl') {
            await deleteCustomTitleBackground(posterId);
            console.log(`已删除海报ID ${posterId} 的旧标题背景`);
          } else {
            await deleteSeriesCover(posterId);
            console.log(`已删除海报ID ${posterId} 的旧封面`);
          }
        } catch (error) {
          console.error(`删除旧${actualUploadType === 'customTitleUrl' ? '标题背景' : '封面'}失败:`, error);
        }
      }
    }
    
    // 根据上传类型选择适当的上传函数
    if (actualUploadType === 'customTitleUrl') {
      uploadCustomTitleBackground(posterId, file);
    } else {
      uploadSeriesCover(posterId, file);
    }
  };

  // 新增回调函数，用于更新海报图片
  const handleImageUpdate = (file: File, imageData: string) => {
    if (currentPosterId) {
      // 仅在更新封面时更新本地状态
      if (uploadType === 'coverUrl') {
        setLocalPosterImages(prev => 
          prev.map(poster => 
            poster.id === currentPosterId 
              ? { ...poster, src: imageData } // 直接使用imageData作为src值
              : poster
          )
        );
      }
      
      console.log(`更新了海报ID ${currentPosterId} 的${uploadType === 'customTitleUrl' ? '标题背景' : '封面'}:`, { file, imageData });
    }
  };

  // 打开上传对话框
  const openUploadDialog = (posterId: string, type?: string) => {
    const poster = localPosterImages.find(p => p.id === posterId);
    const hasImage = poster && poster.src;
    
    setCurrentPosterId(posterId);
    setUploadType(type || 'coverUrl'); // 设置上传类型
    setIsReplacing(!!hasImage && type !== 'customTitleUrl'); // 对于标题背景，我们不在本地跟踪，所以不确定是否在替换
    setUploadDialogOpen(true);
  };

  // 计算容器高度
  const maxTopPercentage = positions.length > 0
    ? Math.max(
      ...positions.map(position => parseFloat(position.top.toString().replace('%', '')))
    )
    : 20; // 如果没有海报，提供一个默认的基础高度百分比

  const containerHeight = `calc(${maxTopPercentage}vh + 280px)`; // 280px 约为海报高度

  // 添加处理海报点击的函数
  const handlePosterClick = (posterId: string) => {
    // 获取当前locale
    const locale = pathname.split('/')[1];
    // 跳转到该海报系列的timeline页面
    router.push(`/${locale}/timeline/${posterId}`);
  };

  return (
    <div className="mx-auto w-full font-mono">
      <div className="relative overflow-visible" style={{ height: containerHeight }}>
        <div className="relative w-full h-[100vh] overflow-visible">
          {positions.map((position, index) => {
            const hasImage = index < localPosterImages.length;
            const posterIndex = index % localPosterImages.length;
            const poster = hasImage ? localPosterImages[posterIndex] : null;

            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left: position.left,
                  top: position.top,
                  transform: `translate(-50%, -50%) rotate(${position.rotate})`,
                  zIndex: position.zIndex,
                  opacity: hasImage && poster ? 1 : 0,
                  pointerEvents: hasImage && poster ? 'auto' : 'none',
                }}
              >
                {hasImage && poster && (
                  <PosterCard
                    poster={poster}
                    onOpenUploadDialog={openUploadDialog}
                    onClick={handlePosterClick}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 上传弹窗 */}
      {currentPosterId && (
        <UploadDialog
          isOpen={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onUpload={(file, type) => handleUpload(currentPosterId, file, type)}
          title={localPosterImages.find(p => p.id === currentPosterId)?.title || ''}
          callback={handleImageUpdate}
          isReplacing={isReplacing}
          uploadType={uploadType}
        />
      )}
    </div>
  );
};

export default SeriesListClient; 