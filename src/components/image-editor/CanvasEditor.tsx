import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";

interface CanvasEditorProps {
    imageEl: HTMLImageElement;
    maskCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    onMaskChange: (maskImg: HTMLImageElement | null) => void;
    maskImage: HTMLImageElement | null;
}

export default function CanvasEditor({
    imageEl,
    maskCanvasRef,
    onMaskChange,
    maskImage,
}: CanvasEditorProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const stageRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [containerW, setContainerW] = useState(800);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(40);
    const [mode, setMode] = useState<"brush" | "erase">("brush");

    // Initialize/Update mask canvas size when image changes
    useEffect(() => {
        if (maskCanvasRef.current && imageEl) {
            const canvas = maskCanvasRef.current;
            // Only resize if dimensions differ to avoid clearing on every render
            if (canvas.width !== imageEl.width || canvas.height !== imageEl.height) {
                canvas.width = imageEl.width;
                canvas.height = imageEl.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.fillStyle = "black";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                onMaskChange(null); // Reset mask state in parent
            }
        } else if (!maskCanvasRef.current && imageEl) {
            // Initial creation
            const canvas = document.createElement("canvas");
            canvas.width = imageEl.width;
            canvas.height = imageEl.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            maskCanvasRef.current = canvas;
        }
    }, [imageEl, maskCanvasRef, onMaskChange]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setContainerW(containerRef.current.offsetWidth);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Calculate scale
    useEffect(() => {
        if (imageEl && containerW) {
            const targetWidth = Math.min(containerW * 0.9, 600);
            setScale(targetWidth / imageEl.width);
        }
    }, [imageEl, containerW]);

    const handlePointerDown = (e: unknown) => {
        setIsDrawing(true);
        const target = e as { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } };
        const stage = target.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return;

        // Map stage coordinates to image coordinates
        const imageX = pos.x / scale;
        const imageY = pos.y / scale;

        drawOnMask(imageX, imageY);
    };

    const handlePointerMove = (e: unknown) => {
        if (!isDrawing) return;
        const target = e as { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } };
        const stage = target.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return;

        const imageX = pos.x / scale;
        const imageY = pos.y / scale;

        drawOnMask(imageX, imageY);
    };

    const handlePointerUp = () => {
        setIsDrawing(false);
    };

    const drawOnMask = (x: number, y: number) => {
        const canvas = maskCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw directly in image coordinates
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = mode === "brush" ? "white" : "black";
        ctx.beginPath();
        // Adjust brush size relative to scale
        const scaledBrushSize = brushSize / scale;
        ctx.arc(x, y, scaledBrushSize / 2, 0, Math.PI * 2);
        ctx.fill();

        const maskImg = new window.Image();
        maskImg.onload = () => onMaskChange(maskImg);
        maskImg.src = canvas.toDataURL();
    };

    const clearMask = () => {
        const canvas = maskCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        onMaskChange(null);
    };

    return (
        <div>
            {/* Canvas */}
            <div className="mb-2 flex justify-between items-end">
                <p className="text-sm font-medium text-gray-700">
                    Paint over the area you want to enhance (your abs)
                </p>
                <p className="text-xs text-gray-500">
                    Use the tools below to adjust the mask
                </p>
            </div>
            <div ref={containerRef} className="bg-gray-100 rounded-lg p-4 mb-4 border-2 border-dashed border-gray-300">
                <Stage
                    ref={stageRef}
                    width={imageEl.width * scale}
                    height={imageEl.height * scale}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    <Layer>
                        <KonvaImage image={imageEl} scaleX={scale} scaleY={scale} />
                        {maskImage && (
                            <KonvaImage
                                image={maskImage}
                                scaleX={scale}
                                scaleY={scale}
                                opacity={0.5}
                            />
                        )}
                    </Layer>
                </Stage>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setTool('brush')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${tool === 'brush'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    Brush
                </button>
                <button
                    onClick={() => setTool('eraser')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${tool === 'eraser'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    Eraser
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Size:</label>
                    <input
                        type="range"
                        min="5"
                        max="50"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-8">{brushSize}</span>
                </div>
                <button
                    onClick={clearCanvas}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm sm:text-base"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}
