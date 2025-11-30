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

    const stageWidth = imageEl.width * scale;
    const stageHeight = imageEl.height * scale;

    return (
        <div>
            {/* Canvas */}
            <div className="mb-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
                <p className="text-sm font-semibold text-gray-100">
                    Paint over the area to enhance
                </p>
                <p className="text-xs text-gray-400">
                    Brush to add, eraser to remove
                </p>
            </div>
            <div ref={containerRef} className="mb-4">
                <div
                    className="bg-brand-dark rounded-xl border border-dashed border-brand-light/80 mx-auto shadow-inner"
                    style={{
                        width: `${stageWidth}px`,
                        height: `${stageHeight}px`,
                    }}
                >
                    <Stage
                        ref={stageRef}
                        width={stageWidth}
                        height={stageHeight}
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
            </div>

            {/* Controls */}
            <div className="mb-4 space-y-3 rounded-2xl border border-white/5 bg-white/5 p-3 backdrop-blur">
                <div className="flex flex-wrap gap-2 sm:gap-3">
                    <button
                        onClick={() => setMode("brush")}
                        className={`flex-1 min-w-[140px] rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                            mode === "brush"
                                ? "bg-white text-brand-dark shadow"
                                : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                    >
                        Brush
                    </button>
                    <button
                        onClick={() => setMode("erase")}
                        className={`flex-1 min-w-[140px] rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                            mode === "erase"
                                ? "bg-white text-brand-dark shadow"
                                : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                    >
                        Eraser
                    </button>
                    <button
                        onClick={() => {
                            const canvas = maskCanvasRef.current;
                            if (!canvas) return;
                            const ctx = canvas.getContext("2d");
                            if (!ctx) return;
                            ctx.fillStyle = "white";
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            const maskImg = new window.Image();
                            maskImg.onload = () => onMaskChange(maskImg);
                            maskImg.src = canvas.toDataURL();
                        }}
                        className="flex-1 min-w-[160px] rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors bg-white/10 hover:bg-white/20"
                    >
                        Select full body
                    </button>
                    <button
                        onClick={clearMask}
                        className="flex-1 min-w-[140px] rounded-xl px-4 py-2 text-sm font-semibold text-white/70 transition-colors bg-white/5 hover:bg-white/15"
                    >
                        Clear
                    </button>
                </div>
                <div className="rounded-xl bg-brand-dark/60 p-3 text-white">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/70">
                        <span>Brush size</span>
                        <span className="text-sm font-semibold text-white">{brushSize}</span>
                    </div>
                    <input
                        type="range"
                        min="20"
                        max="80"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="mt-2 w-full accent-white"
                    />
                </div>
            </div>
        </div>
    );
}
