'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, MapPin, Zap, Check } from 'lucide-react';
import { addWatermarkToImage } from '@/lib/watermark';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageBlob: Blob) => void;
    metadata: {
        normReference?: string;
        projectTitle?: string;
    };
}

export function CameraModal({ isOpen, onClose, onCapture, metadata }: CameraModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [location, setLocation] = useState<string | null>(null);
    const [isWatermarking, setIsWatermarking] = useState(false);

    // Initial Camera Access
    useEffect(() => {
        if (isOpen && !stream) {
            startCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false
            });
            setStream(s);
            if (videoRef.current) {
                videoRef.current.srcObject = s;
            }

            // Get Location
            navigator.geolocation.getCurrentPosition((pos) => {
                setLocation(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
            });
        } catch (err) {
            console.error('Camera Error:', err);
            alert('Не удалось получить доступ к камере или GPS');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }
    };

    const takePhoto = async () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0);

        canvas.toBlob(async (blob) => {
            if (blob) {
                setIsWatermarking(true);
                const watermarkedBlob = await addWatermarkToImage(blob, {
                    dateTime: new Date().toLocaleString('ru-RU'),
                    location: location || 'GPS недоступен',
                    normReference: metadata.normReference,
                    projectTitle: metadata.projectTitle
                });

                setCapturedImage(watermarkedBlob);
                setPreviewUrl(URL.createObjectURL(watermarkedBlob));
                setIsWatermarking(false);
                stopCamera();
            }
        }, 'image/jpeg', 0.9);
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            onClose();
            reset();
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGalleryClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsWatermarking(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const blob = new Blob([event.target?.result as ArrayBuffer], { type: file.type });
            const watermarkedBlob = await addWatermarkToImage(blob, {
                dateTime: new Date().toLocaleString('ru-RU'),
                location: location || 'GPS недоступен',
                normReference: metadata.normReference,
                projectTitle: metadata.projectTitle
            });

            setCapturedImage(watermarkedBlob);
            setPreviewUrl(URL.createObjectURL(watermarkedBlob));
            setIsWatermarking(false);
            stopCamera();
        };
        reader.readAsArrayBuffer(file);
    };

    const reset = () => {
        setCapturedImage(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        startCamera();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            {/* Hidden File Input for Gallery */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
            />

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white">
                    <X className="h-6 w-6" />
                </button>
                <div className="text-white text-xs font-bold uppercase tracking-widest text-center">
                    {metadata.normReference || 'Фотофиксация'}
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Viewfinder / Preview */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {!capturedImage ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <img src={previewUrl!} className="w-full h-full object-contain" />
                )}

                {isWatermarking && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-10 text-center">
                        <LoaderIcon className="h-10 w-10 animate-spin mb-4 text-blue-500" />
                        <p className="font-bold text-sm">Обработка изображения и добавление водяных знаков...</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-8 pb-12 bg-black flex items-center justify-around z-20">
                {!capturedImage ? (
                    <>
                        <button
                            onClick={handleGalleryClick}
                            className="p-3 bg-white/5 rounded-full text-white flex flex-col items-center gap-1"
                        >
                            <RefreshCw className="h-6 w-6 opacity-30 absolute" /> {/* Background icon for spacing */}
                            <Zap className="h-6 w-6" />
                        </button>
                        <button
                            onClick={takePhoto}
                            className="h-20 w-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:bg-white/20 transition-all p-2"
                        >
                            <div className="h-full w-full rounded-full bg-white" />
                        </button>
                        <button
                            onClick={handleGalleryClick}
                            className="p-3 bg-white/10 rounded-full text-blue-400 border border-blue-500/30"
                        >
                            <RefreshCw className="h-6 w-6" /> {/* This was Refresh, but let's use it for Gallery logic or similar */}
                            {/* Actually let's use a real Gallery icon if available or just label it */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={reset}
                            className="flex flex-col items-center gap-2 text-slate-400"
                        >
                            <div className="h-14 w-14 rounded-full border border-white/10 flex items-center justify-center">
                                <X className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-bold uppercase">Переснять</span>
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex flex-col items-center gap-2 text-blue-400"
                        >
                            <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Check className="h-8 w-8" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Сохранить</span>
                        </button>
                    </>
                )}
            </div>

            {/* Metadata overlay in Viewfinder */}
            {!capturedImage && (
                <div className="absolute bottom-32 left-0 right-0 px-6 pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/10 inline-flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-white text-[10px] font-bold uppercase">
                            <MapPin className="h-3 w-3 text-blue-400" />
                            {location || 'Определение координат...'}
                        </div>
                        <div className="text-white/60 text-[9px] font-medium uppercase tracking-tighter">
                            {new Date().toLocaleString('ru-RU')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LoaderIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
