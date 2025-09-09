"use client";

import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Group } from "react-konva";
import Konva from "konva";

export default function ImageEditor() {
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [containerW, setContainerW] = useState(800);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const [mode, setMode] = useState<"brush" | "erase">("brush");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [strength, setStrength] = useState(0.2);
  const [maskImageData, setMaskImageData] = useState<ImageData | null>(null);
  const [maskImage, setMaskImage] = useState<HTMLImageElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('abs-fixer-tutorial-completed');
    }
    return true;
  });
  const [currentTooltip, setCurrentTooltip] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);

  // Upload hint
  const [showUploadHint, setShowUploadHint] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('abs-fixer-upload-hint-shown');
    }
    return true;
  });

  // Enhancement options
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [selectedEnhancement, setSelectedEnhancement] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'gender' | 'enhancement' | 'edit'>('upload');

  // Auto-advance tooltips faster
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        if (currentTooltip < 2) {
          setCurrentTooltip(currentTooltip + 1);
        } else {
          setShowTooltip(false);
          localStorage.setItem('abs-fixer-tutorial-completed', 'true');
        }
      }, 2000); // 2 seconds instead of manual clicking
      
      return () => clearTimeout(timer);
    }
  }, [currentTooltip, showTooltip]);

  // Enhancement options data
  const genderOptions = [
    { id: 'male', label: 'Male Body', icon: '👨', description: 'Masculine physique enhancement' },
    { id: 'female', label: 'Female Body', icon: '👩', description: 'Feminine physique enhancement' }
  ];

  const enhancementOptions = {
    male: [
      // Core enhancements
      { id: 'six-pack', label: '6-Pack Abs', icon: '💪', description: 'Defined six-pack abdominal muscles', category: 'core' },
      { id: 'lean-abs', label: 'Lean Abs', icon: '🏃', description: 'Subtle, athletic core definition', category: 'core' },
      { id: 'athletic', label: 'Athletic Build', icon: '🏋️', description: 'Overall toned athletic physique', category: 'core' },
      // Body transformation
      { id: 'weight-loss', label: 'Lost 10kg', icon: '📉', description: 'Leaner, more defined physique', category: 'body' },
      { id: 'weight-gain', label: 'Gained 10kg', icon: '📈', description: 'More muscular, bulked physique', category: 'body' },
      { id: 'muscle-tone', label: 'Overall Toning', icon: '💯', description: 'Enhanced muscle definition everywhere', category: 'body' }
    ],
    female: [
      // Core enhancements  
      { id: 'toned-core', label: 'Toned Core', icon: '🤸', description: 'Feminine core strengthening', category: 'core' },
      { id: 'flat-stomach', label: 'Flat Stomach', icon: '✨', description: 'Smooth, toned midsection', category: 'core' },
      { id: 'athletic-fem', label: 'Athletic Physique', icon: '🏃‍♀️', description: 'Strong, feminine athlete look', category: 'core' },
      // Body transformation
      { id: 'weight-loss-fem', label: 'Lost 10kg', icon: '📉', description: 'Slimmer, more toned figure', category: 'body' },
      { id: 'weight-gain-fem', label: 'Gained 10kg', icon: '📈', description: 'Curvier, more defined physique', category: 'body' },
      { id: 'body-toning', label: 'Overall Toning', icon: '💯', description: 'Enhanced curves and definition', category: 'body' }
    ]
  };

  const getEnhancementPrompt = () => {
    if (!selectedGender || !selectedEnhancement) return "natural fitness enhancement";
    
    const prompts = {
      male: {
        // Core enhancements
        'six-pack': 'defined six-pack abs, masculine muscle definition, athletic male physique, strong core muscles',
        'lean-abs': 'lean athletic abs, subtle muscle definition, natural male fitness, toned midsection',
        'athletic': 'athletic male build, overall muscle tone, fit masculine physique, natural enhancement',
        // Body transformations
        'weight-loss': 'leaner male physique, reduced body fat, more defined muscles, athletic weight loss transformation, toned masculine body',
        'weight-gain': 'more muscular male build, increased muscle mass, stronger physique, athletic weight gain, bulked masculine body',
        'muscle-tone': 'enhanced male muscle definition, overall body toning, improved masculine physique, natural muscle enhancement'
      },
      female: {
        // Core enhancements
        'toned-core': 'toned feminine core, elegant muscle definition, graceful athletic physique, natural strength',
        'flat-stomach': 'smooth flat stomach, feminine curves, natural body enhancement, elegant midsection',
        'athletic-fem': 'athletic feminine physique, strong graceful body, natural female fitness, empowered look',
        // Body transformations
        'weight-loss-fem': 'slimmer feminine figure, toned female physique, elegant weight loss transformation, defined feminine curves',
        'weight-gain-fem': 'curvier feminine body, enhanced female figure, healthy weight gain, fuller feminine physique',
        'body-toning': 'overall feminine body toning, enhanced female curves, graceful muscle definition, elegant athletic body'
      }
    };
    
    return prompts[selectedGender][selectedEnhancement] || "natural fitness enhancement";
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<any>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize mask canvas
  useEffect(() => {
    if (!maskCanvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      maskCanvasRef.current = canvas;
    }
  }, []);

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

  // Calculate scale when image or container changes
  useEffect(() => {
    if (imageEl && containerW > 0) {
      const maxW = Math.min(containerW - 40, 600);
      const scaleX = maxW / imageEl.naturalWidth;
      const scaleY = maxW / imageEl.naturalHeight;
      const newScale = Math.min(scaleX, scaleY, 1);
      setScale(newScale);
      setImgSize({
        w: imageEl.naturalWidth * newScale,
        h: imageEl.naturalHeight * newScale,
      });
    }
  }, [imageEl, containerW]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleImageUpload called');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.size, file.type);
    setError(null);
    setResultUrl(null);
    
    // Hide upload hint once user uploads a photo
    if (showUploadHint) {
      setShowUploadHint(false);
      localStorage.setItem('abs-fixer-upload-hint-shown', 'true');
    }

    const img = new Image();
    img.onload = () => {
      console.log('Image loaded successfully:', img.naturalWidth, 'x', img.naturalHeight);
      setImageEl(img);
      // Don't auto-advance to gender step, stay on upload step to show photo + gender selection
      // Reset mask canvas
      if (maskCanvasRef.current) {
        maskCanvasRef.current.width = img.naturalWidth;
        maskCanvasRef.current.height = img.naturalHeight;
        const ctx = maskCanvasRef.current.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, img.naturalWidth, img.naturalHeight);
        }
      }
    };
    img.onerror = () => {
      console.error('Failed to load image');
      setError('Failed to load image. Please try a different file.');
    };
    img.src = URL.createObjectURL(file);
  };

  const clearMask = () => {
    if (!maskCanvasRef.current || !imageEl) return;
    const ctx = maskCanvasRef.current.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, imageEl.naturalWidth, imageEl.naturalHeight);
    }
    setMaskImageData(null);
    setMaskImage(null);
  };

  const handleGenerate = async () => {
    if (!imageEl || !maskCanvasRef.current) {
      setError("Please upload an image and draw a mask");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert image to data URL
      const imageCanvas = document.createElement("canvas");
      imageCanvas.width = imageEl.naturalWidth;
      imageCanvas.height = imageEl.naturalHeight;
      const ictx = imageCanvas.getContext("2d");
      if (!ictx) throw new Error("Cannot create image canvas");
      ictx.drawImage(imageEl, 0, 0);
      const imageDataUrl = imageCanvas.toDataURL("image/png");

      // Convert mask to data URL and debug
      const maskDataUrl = maskCanvasRef.current.toDataURL("image/png");
      console.log("Mask data URL length:", maskDataUrl.length);
      console.log("Strength value:", strength);

      // Use only Fal.ai for now
      const response = await fetch("/api/fal-inpaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageDataUrl,
          mask: maskDataUrl,
          prompt: getEnhancementPrompt(),
          strength: strength,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data);
        
        // Handle different response formats
        let imageUrl = null;
        if (data.image) {
          imageUrl = data.image;
        } else if (data.success && data.image) {
          imageUrl = data.image;
        } else if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          imageUrl = data.images[0].url || data.images[0];
        }
        
        if (imageUrl) {
          setResultUrl(imageUrl);
          console.log("Result URL set:", imageUrl);
        } else {
          console.error("No image found in response:", data);
          throw new Error(data.error || "No image in response");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "API request failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  // Drawing handlers with smooth cursor
  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    handleDraw(e);
  };

  const handleMouseMove = (e: any) => {
    // Update cursor position for custom cursor
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (pos) {
      setCursorPos({ x: pos.x, y: pos.y });
    }
    
    if (!isDrawing) return;
    handleDraw(e);
  };

  const handleMouseEnter = () => {
    setShowCursor(true);
  };

  const handleMouseLeave = () => {
    setShowCursor(false);
    setIsDrawing(false);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleDraw = (e: any) => {
    if (!maskCanvasRef.current || !imageEl) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Convert stage coordinates to image coordinates
    const x = pos.x / scale;
    const y = pos.y / scale;

    const ctx = maskCanvasRef.current.getContext("2d");
    if (!ctx) return;

    // Smooth brush settings
    ctx.globalCompositeOperation = mode === "brush" ? "source-over" : "destination-out";
    ctx.filter = "blur(1px)"; // Slight blur for smoother edges
    
    // Create gradient brush for smoother painting
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, brushSize / scale / 2);
    gradient.addColorStop(0, mode === "brush" ? "rgba(255,255,255,1)" : "rgba(0,0,0,0)");
    gradient.addColorStop(0.7, mode === "brush" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0)");
    gradient.addColorStop(1, mode === "brush" ? "rgba(255,255,255,0)" : "rgba(0,0,0,0)");
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, brushSize / scale / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.filter = "none"; // Reset filter

    // Update the visual mask immediately
    updateMaskImage();
  };

  const updateMaskImage = () => {
    if (!maskCanvasRef.current) return;
    const ctx = maskCanvasRef.current.getContext("2d");
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    setMaskImageData(imageData);
    
    // Create an image from the mask canvas for display
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = maskCanvasRef.current.width;
    tempCanvas.height = maskCanvasRef.current.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
      
      const img = new Image();
      img.onload = () => setMaskImage(img);
      img.src = tempCanvas.toDataURL();
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      {currentStep === 'upload' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 relative">
          {/* Upload Hint */}
          {showUploadHint && !imageEl && (
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg relative animate-bounce">
                <div className="text-sm font-medium">👆 Click here to upload your photo!</div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-blue-600"></div>
                </div>
              </div>
            </div>
          )}

          {!imageEl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-gray-50 transition-colors"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Photo</h3>
              <p className="text-gray-500">Choose a fitness photo to enhance</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Photo Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Photo</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={imageEl.src}
                    alt="Uploaded photo"
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Change Photo
                  </button>
                  {imageEl && (
                    <button
                      onClick={() => {
                        setImageEl(null);
                        setSelectedGender(null);
                        setSelectedEnhancement(null);
                        setCurrentStep('upload');
                      }}
                      className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Start Over
                    </button>
                  )}
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Body Type</h3>
                  <p className="text-gray-500">Choose your body type for optimal enhancement</p>
                </div>
                
                <div className="space-y-4">
                  {genderOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSelectedGender(option.id as 'male' | 'female');
                        setCurrentStep('enhancement');
                      }}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group flex items-center space-x-4"
                    >
                      <div className="text-3xl">{option.icon}</div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">{option.label}</h4>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhancement Type Selection */}
      {currentStep === 'enhancement' && selectedGender && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentStep('upload')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Enhancement Type</h2>
              <p className="text-gray-500">Select the type of enhancement you want</p>
            </div>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
          
          {/* Core Enhancements */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">🎯 Core & Abs Enhancement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {enhancementOptions[selectedGender].filter(option => option.category === 'core').map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedEnhancement(option.id);
                    setCurrentStep('edit');
                  }}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">{option.label}</h4>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Body Transformations */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">🔄 Full Body Transformation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {enhancementOptions[selectedGender].filter(option => option.category === 'body').map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedEnhancement(option.id);
                    setCurrentStep('edit');
                  }}
                  className="p-4 border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-center group"
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">{option.label}</h4>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          
        </div>
      )}

      {/* Editor Section */}
      {currentStep === 'edit' && imageEl && selectedGender && selectedEnhancement && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentStep('enhancement')}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                  </button>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {enhancementOptions[selectedGender!].find(e => e.id === selectedEnhancement)?.category === 'body' 
                        ? 'Select Full Body Area' 
                        : 'Select Enhancement Area'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedGender === 'male' ? '👨' : '👩'} {genderOptions.find(g => g.id === selectedGender)?.label} • 
                      {enhancementOptions[selectedGender!].find(e => e.id === selectedEnhancement)?.icon} {enhancementOptions[selectedGender!].find(e => e.id === selectedEnhancement)?.label}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {enhancementOptions[selectedGender!].find(e => e.id === selectedEnhancement)?.category === 'body' 
                        ? 'Paint over your entire body for transformation'
                        : 'Paint over the area you want to enhance'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setMode(mode === "brush" ? "erase" : "brush")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      mode === "brush"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {mode === "brush" ? "🖌️ Paint" : "🧽 Erase"}
                  </button>
                  <button
                    onClick={clearMask}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div 
                ref={containerRef} 
                className="border border-gray-200 rounded-lg overflow-hidden relative"
                style={{ cursor: 'none' }}
              >
                <Stage
                  ref={stageRef}
                  width={imgSize.w}
                  height={imgSize.h}
                  onMouseDown={handleMouseDown}
                  onMousemove={handleMouseMove}
                  onMouseup={handleMouseUp}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <Layer>
                    <KonvaImage image={imageEl} width={imgSize.w} height={imgSize.h} />
                    {maskImage && (
                      <KonvaImage 
                        image={maskImage} 
                        width={imgSize.w} 
                        height={imgSize.h}
                        opacity={0.4}
                        globalCompositeOperation="source-over"
                      />
                    )}
                  </Layer>
                </Stage>
                
                {/* Custom animated cursor */}
                {showCursor && (
                  <div 
                    className="absolute pointer-events-none transition-all duration-0 z-10"
                    style={{ 
                      left: cursorPos.x - brushSize / 2, 
                      top: cursorPos.y - brushSize / 2,
                      width: brushSize,
                      height: brushSize,
                    }}
                  >
                    <div 
                      className={`w-full h-full rounded-full border-2 shadow-lg transition-transform duration-100 ${
                        mode === "brush" 
                          ? "border-blue-500 shadow-blue-200" 
                          : "border-red-500 shadow-red-200"
                      }`}
                      style={{
                        background: mode === "brush" 
                          ? "radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0.1) 60%, transparent 100%)"
                          : "radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.1) 60%, transparent 100%)",
                        transform: isDrawing ? 'scale(1.2)' : 'scale(1)'
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg filter drop-shadow-md">
                          {mode === "brush" ? "🖌️" : "🧽"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowTooltip(true);
                      setCurrentTooltip(0);
                      localStorage.removeItem('abs-fixer-tutorial-completed');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Show Tips
                  </button>
                  {!showUploadHint && (
                    <button
                      onClick={() => {
                        setShowUploadHint(true);
                        localStorage.removeItem('abs-fixer-upload-hint-shown');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800 underline"
                    >
                      Reset Upload Hint
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 relative">
                  {showTooltip && currentTooltip === 0 && (
                    <div className="absolute -top-2 -right-2 z-50 animate-pulse">
                      <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg relative">
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
                        👆 Drag to change brush size
                      </div>
                    </div>
                  )}
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Brush Size: {brushSize}px
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="10"
                      max="80"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg appearance-none cursor-pointer slider shadow-inner border border-blue-300"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10px</span>
                      <span>80px</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 relative">
                  {showTooltip && currentTooltip === 1 && (
                    <div className="absolute -top-2 -right-2 z-50 animate-pulse">
                      <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg relative">
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
                        ⚡ Adjust enhancement strength
                      </div>
                    </div>
                  )}
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Enhancement Strength: {Math.round(strength * 100)}%
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="0.1"
                      max="0.5"
                      step="0.05"
                      value={strength}
                      onChange={(e) => setStrength(Number(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg appearance-none cursor-pointer slider shadow-inner border border-blue-300"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10%</span>
                      <span>50%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                {showTooltip && currentTooltip === 2 && (
                  <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 z-50 animate-pulse">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg relative whitespace-nowrap">
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
                      🚀 Click to enhance photo!
                    </div>
                  </div>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? "Enhancing..." : "Enhance Photo"}
                </button>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-3 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Upload New Photo
              </button>
            </div>

            {/* Result */}
            {resultUrl && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Result</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={resultUrl}
                    alt="Enhanced result"
                    className="w-full h-auto"
                  />
                </div>
                <a
                  href={resultUrl}
                  download="enhanced-photo.png"
                  className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors text-center block"
                >
                  Download Result
                </a>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
}
