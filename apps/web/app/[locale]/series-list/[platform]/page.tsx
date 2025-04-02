"use client"
import { FC } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface SeriesListPageProps {
  params: {
    locale: string
    platform: string
  }
}

// 定义海报类型
interface Poster {
  src: string
  title: string
  description: string
}

const SeriesListPage: FC<SeriesListPageProps> = ({ params }) => {
  // const { platform } = params
  
  // 定义可用的海报图片数组
  const posterImages: Poster[] = [
    { src: '/series/one-punch-man.webp', title: 'One Punch Man', description: '一拳超人' },
    { src: '/series/eva.avif', title: 'Evangelion', description: '新世纪福音战士' },
    { src: '/series/summer-time-rerendering.webp', title: 'Summer Time Rendering', description: '夏日重现' },
    { src: '/series/your-name.jpeg', title: 'Your name', description: '君の名前' },
    { src: '/series/cyberpunk.png', title: 'cyberpunk 2077', description: '' },
    { src: '/series/weather-child.png', title: 'weather-child', description: '' },
    { src: '/series/konann.jpg', title: '', description: '' },
    { src: '/series/dragon-ball.webp', title: '', description: '' },
    { src: '/series/attack-on-titan.jpg', title: '', description: '' },
    { src: '/series/jujutsu-kaisen.webp', title: '', description: '' },
    { src: '/series/flower.jpeg', title: '', description: '' },
  ]
  
  // 卡片位置和旋转角度配置 - 调整位置以减少重叠
  const cardPositions = [
    { left: '50%', top: '60%', rotate: '5deg', zIndex: 15 }, // 1
    { left: '72%', top: '65%', rotate: '-12deg', zIndex: 14 }, // 2
    { left: '30%', top: '30%', rotate: '8deg', zIndex: 13 }, // 3
    { left: '75%', top: '22%', rotate: '-7deg', zIndex: 12 }, // 4
    { left: '52%', top: '20%', rotate: '3deg', zIndex: 11 }, // 5
    { left: '30%', top: '74%', rotate: '-15deg', zIndex: 10 }, // 6
    { left: '10%', top: '20%', rotate: '12deg', zIndex: 9 }, // 7
    { left: '95%', top: '16%', rotate: '5deg', zIndex: 8 }, // 8
    { left: '10%', top: '65%', rotate: '-10deg', zIndex: 7 }, // 9
    { left: '92%', top: '68%', rotate: '8deg', zIndex: 6 }, // 10
    { left: '10%', top: '115%', rotate: '12deg', zIndex: 5 }, // 11
    { left: '15%', top: '65%', rotate: '5deg', zIndex: 4 }, // 12
    { left: '85%', top: '75%', rotate: '-5deg', zIndex: 3 }, // 13
    { left: '95%', top: '55%', rotate: '8deg', zIndex: 2 }, // 14
    { left: '55%', top: '80%', rotate: '-18deg', zIndex: 1 }, // 15
  ]
  
  // 计算容器高度
  const posterCount = posterImages.length;
  const maxTopPercentage = Math.max(
    ...cardPositions.slice(0, posterCount).map(position => {
      // 从top值(如"65%")中提取数字部分
      return parseFloat(position.top.toString().replace('%', ''));
    })
  );
  
  // 容器高度 = 最大top百分比vh + 280px (为海报高度预留足够空间)
  const containerHeight = `calc(${maxTopPercentage}vh + 280px)`;
  
  return (
    <div className="mx-auto w-full">
      {/* 外层容器 - 设置实际所需高度，允许滚动 */}
      <div className="relative overflow-auto" style={{ height: containerHeight }}>
        {/* 中间容器 - 固定100vw和相对定位，但允许内容溢出可见 */}
        <div className="relative w-full h-[100vh] overflow-visible">
          {cardPositions.map((position, index) => {
            const hasImage = index < posterImages.length;
            // 获取海报图片，如果数量不足，则按顺序循环使用
            const posterIndex = index % posterImages.length;
            // 使用非空断言确保TypeScript知道这不会是undefined
            const poster = posterImages[posterIndex]!;
            
            return (
              // 外层div负责位置和旋转
              <div 
                key={index} 
                className="absolute"
                style={{
                  left: position.left,
                  top: position.top,
                  transform: `translate(-50%, -50%) rotate(${position.rotate})`,
                  zIndex: position.zIndex,
                  opacity: hasImage ? 1 : 0,
                  pointerEvents: hasImage ? 'auto' : 'none',
                }}
              >
                {/* 内层motion.div负责缩放和交互效果 */}
                <motion.div
                  className="shadow-poster rounded-lg w-[180px] h-[250px] overflow-hidden cursor-pointer"
                  whileHover={{ 
                    scale: 1.1,
                    zIndex: 20, 
                    // boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" 
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20 
                  }}
                  style={{
                    // 确保父元素的zIndex在悬停时被覆盖
                    zIndex: 'inherit'
                  }}
                >
                  {/* 只有在有可用的海报图片时才显示 */}
                  {hasImage && (
                    <div className="relative w-full h-full">
                      <Image
                        src={poster.src}
                        alt={poster.title}
                        fill
                        className="object-cover"
                        priority
                      />
                      {/* 添加内部阴影边框效果 */}
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
  )
}

export default SeriesListPage 