import { useRef, useEffect, useCallback } from 'react';

// 监听连续两次按下v键的事件，触发回调函数
export function useDoubleVKeyPress(callback: () => void) {
    const pressCountRef = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const resetPressCount = useCallback(() => {
        pressCountRef.current = 0;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'v') {
                pressCountRef.current += 1;

                if (pressCountRef.current === 2) {
                    callback();
                    resetPressCount();
                } else {
                    if (timerRef.current) {
                        clearTimeout(timerRef.current);
                    }
                    timerRef.current = setTimeout(resetPressCount, 1000); // 1秒内必须按下两次v键
                }
            }
        },
        [callback, resetPressCount]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress);

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [handleKeyPress]);
}