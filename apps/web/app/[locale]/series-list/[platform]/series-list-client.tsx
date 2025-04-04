"use client";
import { FC, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Poster } from './page'; // 从 page.tsx 导入 Poster 类型

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

// 上传图片弹窗组件
const UploadDialog: FC<{
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  title: string;
}> = ({ isOpen, onClose, onUpload, title }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 text-xl">Add Profile Image</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <span className="text-2xl">&times;</span>
            </button>
          </div>
          
          <div 
            className="flex flex-col justify-center items-center mx-auto border-2 border-gray-300 hover:border-gray-400 border-dashed rounded-full w-64 h-64 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2 text-gray-400">
              <path d="M12 4v12m0-12l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-gray-500 text-center">
              Drag and drop your<br />images here
            </p>
          </div>
          
          <div className="relative mt-4">
            <div className="absolute inset-0 flex items-center">
              <div className="border-gray-300 border-t w-full"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">OR</span>
            </div>
          </div>
          
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          
          <button
            className="bg-gray-100 hover:bg-gray-200 mt-4 px-4 py-2 rounded-md w-full text-gray-800 transition-colors"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Upload a photo
          </button>
        </div>
        
        <div className="flex border-gray-200 border-t">
          <button
            className="flex-1 hover:bg-gray-50 px-4 py-3 border-gray-200 border-r font-medium text-gray-700 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 hover:bg-gray-50 px-4 py-3 font-medium text-gray-700 transition-colors"
            onClick={handleSubmit}
            disabled={!selectedFile}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const SeriesListClient: FC<SeriesListClientProps> = ({ posterImages }) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentPosterId, setCurrentPosterId] = useState<string | null>(null);
  
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
            const hasImage = index < posterImages.length;
            const posterIndex = index % posterImages.length; // 使用传入的 posterImages
            const poster = hasImage ? posterImages[posterIndex] : null; // 获取海报数据
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
                          <Image
                            src={`/series/${poster.src}`}
                            alt={poster.title}
                            fill
                            className="object-cover"
                            priority={index < 10}
                          />
                          <div className="absolute inset-0 shadow-neumorphic"></div>
                        </>
                      ) : (
                        // 没有封面图片的情况
                        <div className="flex flex-col justify-center items-center bg-gray-100 p-4 w-full h-full">
                          <div 
                            className="bg-blue-500 hover:bg-blue-600 mb-4 p-3 rounded-full text-white transition-colors cursor-pointer"
                            onClick={() => {
                              setCurrentPosterId(poster.id);
                              setUploadDialogOpen(true);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <p className="font-medium text-gray-700 text-xs text-center">{poster.title}</p>
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
          title={posterImages.find(p => p.id === currentPosterId)?.title || ''}
        />
      )}
    </div>
  );
};

export default SeriesListClient; 