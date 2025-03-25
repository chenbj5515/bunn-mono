import { useRef, useEffect, useCallback } from 'react';

// refに対応するコンテナ内で3回連続のクリックイベントを監視する、あればcallbackを実行する
export function useTripleRightClick(callback: () => void) {
    const ref = useRef<HTMLDivElement | null>(null);
    const clickCountRef = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const resetClickCount = useCallback(() => {
        clickCountRef.current = 0;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    }, []);

    const handleClick = useCallback(
        (event: MouseEvent) => {
            if (event.button === 2) { // 2 是鼠标右键
                clickCountRef.current += 1;

                if (clickCountRef.current === 3) {
                    callback();
                    resetClickCount();
                } else {
                    if (timerRef.current) {
                        clearTimeout(timerRef.current);
                    }
                    timerRef.current = setTimeout(resetClickCount, 1000); // 1 秒内必须点击三次
                }
            }
        },
        [callback, resetClickCount]
    );

    useEffect(() => {
        const element = ref.current;
        if (element) {
            element.addEventListener('mousedown', handleClick);
        }

        return () => {
            if (element) {
                element.removeEventListener('mousedown', handleClick);
            }
        };
    }, [handleClick]);

    return ref;
}