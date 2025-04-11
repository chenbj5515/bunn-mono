"use client";
import { useTranslations } from 'next-intl';
import { FC, useState, useEffect, useRef } from 'react';
import { Input } from "@ui/components/input";
import { Search } from "lucide-react";

export interface VideoInfo {
  videoId: string;
  videoTitle: string;
}

export const VideoSelector: FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (videoId: string, videoTitle: string) => void;
  title: string;
  videos: VideoInfo[];
  currentVideoId?: string;
  position?: { top: number; left: number; width: number };
}> = ({ isOpen, onClose, onSelect, title, videos, currentVideoId, position }) => {
  const t = useTranslations('VideoSelector');
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState<VideoInfo[]>(videos);
  const selectorRef = useRef<HTMLDivElement>(null);

  // 当 videos 改变时重置过滤的视频列表
  useEffect(() => {
    if (searchQuery) {
      // 按搜索词过滤视频
      const filtered = videos.filter(video => 
        video.videoTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVideos(filtered);
    } else {
      setFilteredVideos(videos);
    }
  }, [videos, searchQuery]);

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 当弹窗关闭时，重置搜索框内容
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelect = (videoId: string, videoTitle: string) => {
    onSelect(videoId, videoTitle);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={selectorRef}
      className="top-[42px] left-[50%] absolute bg-white shadow-xl border border-gray-200 rounded-lg w-[360px] overflow-hidden"
      style={{
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxHeight: '60vh'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4">
        {/* <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800 text-lg">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div> */}

        {/* 搜索框 */}
        <div className="relative mb-4">
          <div className="left-0 absolute inset-y-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <Input
            type="text"
            placeholder={t('searchPlaceholder', { fallback: "搜索视频..." })}
            className="pl-10 w-full"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {/* 视频列表 */}
        <div className="max-h-[300px] overflow-y-auto">
          {filteredVideos.length > 0 ? (
            <ul className="space-y-1">
              {filteredVideos.map((video) => (
                <li 
                  key={video.videoId}
                  className={`font-normal text-left text-[14px] p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-100 
                    ${video.videoId === currentVideoId ? 'bg-gray-100' : ''}`}
                  onClick={() => handleSelect(video.videoId, video.videoTitle)}
                >
                  <p className="truncate">{video.videoTitle}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-4 text-center">
              {/* {t('noResults', { fallback: "没有找到匹配的视频" })} */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 