"use client"
import { speakText } from "@utils/tts";
import { TWordCard } from "@/app/[locale]/word-cards/page";
// import { useTripleRightClick } from "@/hooks";
import { Card } from "ui/components/card"
import { Button } from "ui/components/button"

interface IProps {
    wordCardInfo: TWordCard;
    onRecognize: (wordCardInfo: TWordCard) => void;
    onUnRecognize: (wordCardInfo: TWordCard) => void;
}

export function WordCard(props: IProps) {
    const { wordCardInfo, wordCardInfo: { id, word, meaning }, onRecognize, onUnRecognize } = props;
    // const cardRef = useTripleRightClick(async () => {})

    function handlePlayBtn(text: string) {
        speakText(text, {
            voiceName: "ja-JP-NanamiNeural",
        });
    }

    return (
        <Card className="relative dark:bg-eleDark shadow-neumorphic mt-2 mb-8 p-5 border rounded-[8px] w-full sm:w-[280px] sm:h-[170px] text-[17px] dark:text-white sm:text-base word-card">
            <div
                className="top-2 right-2 absolute rounded-[50%] w-8 h-8 cursor-pointer play-button-bg"
                onClick={() => handlePlayBtn(word)}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="top-[50%] left-[50%] absolute w-[25px] sm:w-[20px] h-[20px] sm:h-[16px] -translate-x-1/2 -translate-y-1/2 volume_button"
                >
                    <path
                        clipRule="evenodd"
                        d="M11.26 3.691A1.2 1.2 0 0 1 12 4.8v14.4a1.199 1.199 0 0 1-2.048.848L5.503 15.6H2.4a1.2 1.2 0 0 1-1.2-1.2V9.6a1.2 1.2 0 0 1 1.2-1.2h3.103l4.449-4.448a1.2 1.2 0 0 1 1.308-.26Zm6.328-.176a1.2 1.2 0 0 1 1.697 0A11.967 11.967 0 0 1 22.8 12a11.966 11.966 0 0 1-3.515 8.485 1.2 1.2 0 0 1-1.697-1.697A9.563 9.563 0 0 0 20.4 12a9.565 9.565 0 0 0-2.812-6.788 1.2 1.2 0 0 1 0-1.697Zm-3.394 3.393a1.2 1.2 0 0 1 1.698 0A7.178 7.178 0 0 1 18 12a7.18 7.18 0 0 1-2.108 5.092 1.2 1.2 0 1 1-1.698-1.698A4.782 4.782 0 0 0 15.6 12a4.78 4.78 0 0 0-1.406-3.394 1.2 1.2 0 0 1 0-1.698Z"
                        fillRule="evenodd"
                    ></path>
                </svg>
            </div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={word}>{word}</div>
            <div className="relative mt-1 overflow-hidden text-ellipsis whitespace-nowrap" title={meaning}>
                <section
                    className={`rounded-lg absolute hover:backdrop-filter-none hover:bg-transparent ${"backdrop-blur-[3px] backdrop-saturate-[180%]"}  w-[101%] h-[105%] -left-[4px] -top-[2px]`}
                ></section>
                {meaning}
            </div>
            <div className="flex justify-between gap-[20px] mt-[32px] mb-[20px] w-full sm:w-[240px]">
                <Button
                    className="flex-1 shadow-neumorphic hover:shadow-neumorphic-button-hover border text-[16px] sm:text-sm"
                    onClick={() => onRecognize(wordCardInfo)}
                    variant="outline"
                >
                    わかる
                </Button>
                <Button
                    className="flex-1 shadow-neumorphic hover:shadow-neumorphic-button-hover border text-[16px] sm:text-sm"
                    onClick={() => onUnRecognize(wordCardInfo)}
                    variant="outline"
                >
                    分からない
                </Button>
            </div>
        </Card>
    )
}