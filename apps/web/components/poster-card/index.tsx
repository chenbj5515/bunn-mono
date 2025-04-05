"use client";
import { FC, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// 定义Poster类型
export interface Poster {
  id: string;
  title: string;
  src?: string;
}

interface PosterCardProps {
  poster: Poster;
  onOpenUploadDialog: (posterId: string) => void;
  onClick?: (posterId: string) => void;
}

export const PosterCard: FC<PosterCardProps> = ({ 
  poster, 
  onOpenUploadDialog,
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasCover = !!poster.src;

  return (
    <div 
      className="relative"
      style={{
        paddingTop: '68px', // 为更换图标预留空间
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 更换封面图标 - 位于海报上方外部 */}
      {hasCover && (
        <div 
          className={`absolute top-0 left-1/2 -translate-x-1/2 z-[30] transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <div 
            className="bg-white hover:bg-gray-100 shadow-md p-2 rounded-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // 防止事件冒泡
              onOpenUploadDialog(poster.id);
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
        onClick={() => hasCover && onClick ? onClick(poster.id) : onOpenUploadDialog(poster.id)}
      >
        <div className="relative w-full h-full">
          {hasCover ? (
            // 有封面图片的情况
            <>
              {poster.src?.startsWith('blob:') ? (
                // 对于Blob URL，使用普通的img标签
                <img
                  src={poster.src}
                  alt={poster.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                // 对于标准路径，使用Next.js的Image组件
                <Image
                  src={poster.src?.startsWith('https') ? poster.src : `/series/${poster.src}`}
                  alt={poster.title}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 shadow-neumorphic"></div>
            </>
          ) : (
            // 没有封面图片的情况
            <div 
              className="flex flex-col justify-between items-center bg-gray-100 p-4 w-full h-full"
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
      </motion.div>
    </div>
  );
}; 