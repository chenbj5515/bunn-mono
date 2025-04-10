import { FC } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

interface ContextButtonProps {
  contextUrl: string | null;
  handlePlayBtn?: () => void;
  weakBorder?: boolean;
}

export const ContextButton: FC<ContextButtonProps> = ({ 
  contextUrl, 
  handlePlayBtn = () => {}, 
  weakBorder = false 
}) => {
  if (contextUrl) {
    if (contextUrl.includes("youtube") || contextUrl.includes("netflix")) {
      return (
        <a
          href={contextUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`shadow-neumorphic hover:shadow-neumorphic-button-hover top-2 right-2 absolute flex justify-center items-center dark:bg-bgDark dark:shadow-none border border-solid rounded-[50%] w-[54px] h-[54px] cursor-pointer`}
        >
          {
            contextUrl.includes("youtube") ? (
              <div className="relative flex justify-center items-center w-[27px] h-5 overflow-hidden">
                <Image
                  src="https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo.svg"
                  alt="read icon"
                  width={16}
                  height={20}
                  className="left-[25px] w-4 scale-[4.5]"
                  style={{ position: 'relative' }}
                />
              </div>
            ) : (
              <Image
                src="/icon/netflix-n.png"
                alt="read icon"
                width={24}
                height={24}
                className="w-6 overflow-hidden"
              />
            )
          }
        </a>
      );
    }
    
    return (
      <div className="group top-2 right-2 absolute">
        <div className="relative pb-[68px] w-[54px]">
          <div
            className={`shadow-neumorphic hover:shadow-neumorphic-button-hover z-10 relative flex justify-center items-center bg-white dark:bg-bgDark dark:shadow-none border-solid rounded-full w-[54px] h-[54px] transition-all duration-300 cursor-pointer`}
            onClick={handlePlayBtn}
          >
            <Image
              src="/icon/play-audio.svg"
              alt="play audio"
              width={24}
              height={20}
              className="w-6 h-5"
            />
          </div>
          <div
            className={`mt-2 cursor-pointer shadow-neumorphic hover:shadow-neumorphic-button-hover top-0 left-0 absolute flex justify-center items-center bg-white opacity-0 group-hover:opacity-100 rounded-full w-[54px] h-[54px] transition-all group-hover:translate-y-14 duration-300`}
            onClick={() => window.open(contextUrl, "_blank")}
          >
            <ExternalLink className="w-5 h-5" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={`shadow-neumorphic top-2 right-2 absolute dark:bg-bgDark dark:shadow-none border ${weakBorder ? 'border-gray-200' : ''} border-solid rounded-[50%] w-12 h-12 cursor-pointer play-button-bg`}
      onClick={handlePlayBtn}
    >
      <Image
        src="/icon/play-audio.svg"
        alt="play audio"
        width={24}
        height={20}
        className="top-[50%] left-[50%] absolute w-6 h-5 -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
};