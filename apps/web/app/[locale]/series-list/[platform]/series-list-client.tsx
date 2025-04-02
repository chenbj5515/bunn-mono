"use client";
import { FC } from 'react';
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

const SeriesListClient: FC<SeriesListClientProps> = ({ posterImages }) => {
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

  // 计算容器高度
  const maxTopPercentage = positions.length > 0
    ? Math.max(
      ...positions.map(position => parseFloat(position.top.toString().replace('%', '')))
    )
    : 20; // 如果没有海报，提供一个默认的基础高度百分比

  const containerHeight = `calc(${maxTopPercentage}vh + 280px)`; // 280px 约为海报高度

  console.log(posterImages, "posterImages=====")
  return (
    <div className="mx-auto w-full">
      <div className="relative overflow-visible" style={{ height: containerHeight }}>
        <div className="relative w-full h-[100vh] overflow-visible">
          {positions.map((position, index) => {
            const hasImage = index < posterImages.length;
            const posterIndex = index % posterImages.length; // 使用传入的 posterImages
            const poster = hasImage ? posterImages[posterIndex] : null; // 获取海报数据

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
                  {hasImage && poster && ( // 确保 poster 存在再渲染图片
                    <div className="relative w-full h-full">
                      <Image
                        src={`/series/${poster.src}`} // 使用去重后的数据
                        alt={poster.title} // 使用去重后的数据
                        fill
                        className="object-cover"
                        priority={index < 10} // 可以考虑只优先加载前几张
                      />
                      <div className="absolute inset-0 shadow-neumorphic"></div>
                    </div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeriesListClient; 