import React, { useRef } from "react";

interface UploadStepProps {
  onImageSelect: (file: File) => void;
}

export default function UploadStep({ onImageSelect }: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-2 text-white">Upload Your Photo</h3>
        <p className="text-brand-lighter mb-6">Choose a clear photo showing your torso</p>

        <div className="bg-brand-medium/50 p-4 rounded-lg text-left max-w-md mx-auto text-sm text-brand-lighter border border-brand-medium">
          <p className="font-bold mb-2 text-white">For best results:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use good lighting (avoid harsh shadows)</li>
            <li>Face the camera directly (front view)</li>
            <li>Ensure your torso is fully visible</li>
          </ul>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-8 py-4 bg-brand-lighter text-brand-darkest rounded-lg hover:bg-white transition-colors text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        Choose Photo
      </button>
    </div>
  );
}
