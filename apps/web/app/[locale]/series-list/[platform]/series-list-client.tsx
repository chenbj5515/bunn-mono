"use client";
import { FC, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Poster } from './page'; // 从 page.tsx 导入 Poster 类型
import { UploadDialog } from '@/components/upload-dialog';
import { uploadSeriesCover, deleteSeriesCover } from '@/components/upload-dialog/server-functions';

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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentPosterId, setCurrentPosterId] = useState<string | null>(null);
  // 添加本地状态保存海报图片
  const [localPosterImages, setLocalPosterImages] = useState<Poster[]>(posterImages);
  // 添加悬停状态
  const [hoveredPosterId, setHoveredPosterId] = useState<string | null>(null);
  // 添加是否为更换操作的状态
  const [isReplacing, setIsReplacing] = useState(false);
  
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
  const handleUpload = async (posterId: string, file: File) => {
    console.log(`上传图片到海报ID ${posterId}:`, file);
    
    // 如果是更换操作，先删除旧资源
    if (isReplacing) {
      const poster = localPosterImages.find(p => p.id === posterId);
      if (poster && poster.src && !poster.src.startsWith('blob:')) {
        try {
          // 删除服务器上的旧文件
          await deleteSeriesCover(posterId);
          console.log(`已删除海报ID ${posterId} 的旧封面`);
        } catch (error) {
          console.error('删除旧封面失败:', error);
        }
      }
    }
    
    // 上传新文件
    uploadSeriesCover(posterId, file);
  };

  // 新增回调函数，用于更新海报图片
  const handleImageUpdate = (file: File, imageData: string) => {
    if (currentPosterId) {
      // 更新本地状态中的海报图片
      setLocalPosterImages(prev => 
        prev.map(poster => 
          poster.id === currentPosterId 
            ? { ...poster, src: imageData } // 直接使用imageData作为src值
            : poster
        )
      );
      // 这里可以添加实际的图片上传到服务器的逻辑
      console.log(`更新了海报ID ${currentPosterId} 的图片:`, { file, imageData });
    }
  };

  // 打开上传对话框
  const openUploadDialog = (posterId: string) => {
    const poster = localPosterImages.find(p => p.id === posterId);
    const hasImage = poster && poster.src;
    
    setCurrentPosterId(posterId);
    setIsReplacing(!!hasImage); // 如果已有图片，则为更换操作
    setUploadDialogOpen(true);
  };

  // 计算容器高度
  const maxTopPercentage = positions.length > 0
    ? Math.max(
      ...positions.map(position => parseFloat(position.top.toString().replace('%', '')))
    )
    : 20; // 如果没有海报，提供一个默认的基础高度百分比

  const containerHeight = `calc(${maxTopPercentage}vh + 280px)`; // 280px 约为海报高度

  return (
    <div className="mx-auto w-full font-mono">
      <div className="relative overflow-visible" style={{ height: containerHeight }}>
        <div className="relative w-full h-[100vh] overflow-visible">
          {positions.map((position, index) => {
            const hasImage = index < localPosterImages.length; // 使用本地状态
            const posterIndex = index % localPosterImages.length; // 使用本地状态
            const poster = hasImage ? localPosterImages[posterIndex] : null; // 使用本地状态
            const hasCover = poster && poster.src; // 检查是否有封面图片
            const isHovered = poster && hoveredPosterId === poster.id; // 检查是否悬停

            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left: position.left,
                  top: position.top,
                  transform: `translate(-50%, -50%) rotate(${position.rotate})`,
                  zIndex: position.zIndex,
                  opacity: hasImage && poster ? 1 : 0, // 确保 poster 也存在
                  pointerEvents: hasImage && poster ? 'auto' : 'none',
                }}
              >
                {/* 创建一个包裹更换图标和海报的交互区域 */}
                <div 
                  className="relative"
                  style={{
                    paddingTop: '68px', // 为更换图标预留空间
                  }}
                  onMouseEnter={() => poster && setHoveredPosterId(poster.id)}
                  onMouseLeave={() => setHoveredPosterId(null)}
                >
                  {/* 更换封面图标 - 位于海报上方外部 */}
                  {hasImage && poster && hasCover && (
                    <div 
                      className={`absolute top-0 left-1/2 -translate-x-1/2 z-[30] transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <div 
                        className="bg-white hover:bg-gray-100 shadow-md p-2 rounded-full cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation(); // 防止事件冒泡
                          openUploadDialog(poster.id);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                    </div>
                  )}

                  <motion.div
                    className="shadow-poster rounded-lg w-[180px] h-[250px] overflow-hidden cursor-pointer"
                    whileHover={{
                      scale: 1.1,
                      zIndex: 20,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    style={{
                      zIndex: 'inherit',
                    }}
                  >
                    {hasImage && poster && (
                      <div className="relative w-full h-full">
                        {hasCover ? (
                          // 有封面图片的情况
                          <>
                            {poster.src.startsWith('blob:') ? (
                              // 对于Blob URL，使用普通的img标签
                              <img
                                src={poster.src}
                                alt={poster.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              // 对于标准路径，继续使用Next.js的Image组件
                              <Image
                                src={poster.src.startsWith('https') ? poster.src : `/series/${poster.src}`}
                                alt={poster.title}
                                fill
                                className="object-cover"
                                priority={index < 10}
                              />
                            )}
                            <div className="absolute inset-0 shadow-neumorphic"></div>
                          </>
                        ) : (
                          // 没有封面图片的情况
                          <div 
                            className="flex flex-col justify-between items-center bg-gray-100 p-4 w-full h-full"
                            onClick={() => openUploadDialog(poster.id)}
                          >
                            <div className="flex flex-col justify-center items-center mt-6">
                              <div className="bg-[rgb(244,244,245)] shadow-neumorphic hover:shadow-neumorphic-button-hover mb-2 p-2 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </div>
                            </div>
                            
                            <p className="mb-4 font-medium text-black text-base text-center">{poster.title}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
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
          onUpload={(file) => handleUpload(currentPosterId, file)}
          title={localPosterImages.find(p => p.id === currentPosterId)?.title || ''}
          callback={handleImageUpdate}
          isReplacing={isReplacing}
        />
      )}
    </div>
  );
};

export default SeriesListClient; 