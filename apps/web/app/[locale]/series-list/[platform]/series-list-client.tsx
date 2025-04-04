"use client";
import { FC, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Poster } from './page'; // 从 page.tsx 导入 Poster 类型
import { UploadDialog } from '@/components/upload-dialog';

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
  
  // 前10个基础卡片位置和旋转角度配置
  const baseCardPositions: CardPosition[] = [
    { left: '10%', top: '20%', rotate: '12deg', zIndex: 9 }, // 7
    { left: '30%', top: '24%', rotate: '8deg', zIndex: 13 }, // 3
    { left: '52%', top: '20%', rotate: '3deg', zIndex: 11 }, // 5
    { left: '75%', top: '22%', rotate: '-7deg', zIndex: 12 }, // 4
    { left: '95%', top: '16%', rotate: '5deg', zIndex: 8 }, // 8
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
  const handleUpload = (posterId: string, file: File) => {
    console.log(`上传图片到海报ID ${posterId}:`, file);
    // 这里实现上传逻辑，可能需要调用API保存图片
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

  // 计算容器高度
  const maxTopPercentage = positions.length > 0
    ? Math.max(
      ...positions.map(position => parseFloat(position.top.toString().replace('%', '')))
    )
    : 20; // 如果没有海报，提供一个默认的基础高度百分比

  const containerHeight = `calc(${maxTopPercentage}vh + 280px)`; // 280px 约为海报高度

  return (
    <div className="mx-auto w-full">
      <div className="relative overflow-visible" style={{ height: containerHeight }}>
        <div className="relative w-full h-[100vh] overflow-visible">
          {positions.map((position, index) => {
            const hasImage = index < localPosterImages.length; // 使用本地状态
            const posterIndex = index % localPosterImages.length; // 使用本地状态
            const poster = hasImage ? localPosterImages[posterIndex] : null; // 使用本地状态
            const hasCover = poster && poster.src; // 检查是否有封面图片

            console.log(poster, "poster=====")
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
                              src={poster.src.startsWith('/') ? poster.src : `/series/${poster.src}`}
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
                          onClick={() => {
                            setCurrentPosterId(poster.id);
                            setUploadDialogOpen(true);
                          }}
                        >
                          <div className="flex flex-col justify-center items-center mt-6">
                            <div className="bg-[rgb(244,244,245)] shadow-neumorphic hover:shadow-neumorphic-button-hover mb-2 p-2 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            {/* <span className="font-medium text-black text-sm">上传海报</span> */}
                          </div>
                          
                          <p className="mb-4 font-medium text-black text-base text-center">{poster.title}</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
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
        />
      )}
    </div>
  );
};

export default SeriesListClient; 