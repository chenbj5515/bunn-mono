"use client";
import { useTranslations } from 'next-intl';
import { FC, useState, useEffect } from 'react';

export const UploadDialog: FC<{
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File) => void;
    title: string;
    callback?: (file: File, imageData: string) => void;
}> = ({ isOpen, onClose, onUpload, title, callback }) => {
    const t = useTranslations('uploadDialog')
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        // 清理之前的预览URL，避免内存泄漏
        if (selectedFile) {
            const objectUrl = URL.createObjectURL(selectedFile);
            setPreviewUrl(objectUrl);
            
            // 组件卸载时清理URL
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setPreviewUrl(null);
        }
    }, [selectedFile]);

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
        if (selectedFile && previewUrl) {
            // 先调用callback保证图片URL可用
            if (callback) {
                callback(selectedFile, previewUrl);
            }
            // 然后调用onUpload处理文件上传
            onUpload(selectedFile);
            // 最后关闭对话框
            onClose();
        }
    };

    const handleClose = () => {
        // 清理资源后关闭对话框
        setSelectedFile(null);
        setPreviewUrl(null);
        onClose();
    };

    const clearSelectedFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    if (!isOpen) return null;

    return (
        <div 
            className="z-50 fixed inset-0 flex justify-center items-center bg-black/50"
            onClick={handleClose}
        >
            <div 
                className="bg-white shadow-lg rounded-lg w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-gray-800 text-xl">{t('title')}</h2>
                        <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                            <span className="text-2xl">&times;</span>
                        </button>
                    </div>

                    {previewUrl ? (
                        <div className="relative mx-auto w-[180px] h-[250px]">
                            <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="border-2 border-gray-300 rounded-lg w-full h-full object-cover"
                            />
                            <button 
                                onClick={clearSelectedFile}
                                className="top-2 right-2 absolute flex justify-center items-center bg-white shadow-md rounded-full w-6 h-6"
                            >
                                <span className="text-gray-500">&times;</span>
                            </button>
                        </div>
                    ) : (
                        <div
                            className="relative flex flex-col justify-center items-center mx-auto border-2 border-gray-300 hover:border-gray-400 border-dashed rounded-full w-64 h-64 transition-colors cursor-pointer"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <div className="flex flex-col justify-center items-center">
                                <svg className="mb-2 text-black" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    )}

                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />

                </div>

                <div className="flex border-gray-200 border-t">
                    <button
                        className="flex-1 hover:bg-gray-50 px-4 py-3 border-gray-200 border-r font-medium text-black transition-colors"
                        onClick={handleClose}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        className="flex-1 hover:bg-gray-50 px-4 py-3 font-medium text-black transition-colors cursor-pointer"
                        onClick={handleSubmit}
                        disabled={!selectedFile}
                    >
                        {t('applyChanges')}
                    </button>
                </div>
            </div>
        </div>
    );
};