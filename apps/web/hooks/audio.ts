import { useEffect, useRef, useState } from "react";

// 録音開始関数、停止関数と再生関数をエクスポートする
export function useAudioRecorder(options = { 
    autoPauseTime: 2000, 
    volumeThreshold: 0.05,
    onSilence: undefined as (() => void) | undefined 
}) {
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const audioURL = useRef<string | null>(null);
    const audio = useRef<HTMLAudioElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const startRecording = async () => {
        // if (!hasPermission) {
        //     console.error('マイクの権限がありません。');
        //     return;
        // }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);

            // 创建音频分析器
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyserRef.current = analyser;

            // 设置检测停顿的功能
            const checkSilence = () => {
                if (!analyserRef.current || !recorder) return;
                
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                
                // 计算音量平均值
                const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
                const normalizedVolume = average / 255; // 归一化到0-1范围
                
                // 如果音量低于阈值，则视为停顿
                if (normalizedVolume < options.volumeThreshold) {
                    // 如果定时器未启动，则启动定时器
                    if (!silenceTimerRef.current) {
                        silenceTimerRef.current = setTimeout(() => {
                            console.log('停顿超过设定时间，执行回调函数');
                            recorder.stop();
                            if (options.onSilence) {
                                options.onSilence();
                            }
                        }, options.autoPauseTime);
                    }
                } else {
                    // 如果有声音，清除定时器
                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                }
            };

            console.log("checkSilence");
            // 设置定期检查停顿的间隔
            const silenceInterval = setInterval(checkSilence, 100);
            
            recorder.ondataavailable = (event: BlobEvent) => {
                audioChunks.current.push(event.data);
            };

            recorder.onstop = () => {
                // 清除停顿检测相关资源
                clearInterval(silenceInterval);
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
                
                if (audioURL.current) {
                    window.URL.revokeObjectURL(audioURL.current);
                }
                const blob = new Blob(audioChunks.current, { type: 'audio/mp3' });
                audioURL.current = window.URL.createObjectURL(blob);
                audio.current = new Audio(audioURL.current!);
                audioChunks.current = [];
                // 停止所有音轨
                stream.getTracks().forEach(track => track.stop());
                
                // 关闭音频上下文
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }
            };

            recorder.start();
            setMediaRecorder(recorder);
        } catch (err) {
            console.error('録音を開始できません', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setMediaRecorder(null);
        }
    };

    const playRecording = () => {
        if (audio.current) {
            audio.current.play();
        }
    };

    useEffect(() => {
        return () => {
            if (audioURL.current) {
                window.URL.revokeObjectURL(audioURL.current);
            }
            
            // 清理资源
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
            
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return { startRecording, stopRecording, playRecording };
}

export function useAudioPermission() {
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        async function requestPermission() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('ブラウザーは録音をサポートしていません。');
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // 获取权限后立即停止所有音轨
                stream.getTracks().forEach(track => track.stop());
                setHasPermission(true);
            } catch (err) {
                console.error('マイクにアクセスできません', err);
                setHasPermission(false);
            }
        }

        requestPermission();
    }, []);

    return hasPermission;
}