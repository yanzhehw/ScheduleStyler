import React, { useCallback } from 'react';
import { Upload, FileImage, Play, PenLine } from 'lucide-react';

interface UploadStepProps {
  onFileSelect: (file: File) => void;
  onLoadSample: () => void;
  onLoadMcGillSample: () => void;
  onEnterManually: () => void;
  isProcessing: boolean;
}

export const UploadStep: React.FC<UploadStepProps> = ({ onFileSelect, onLoadSample, onLoadMcGillSample, onEnterManually, isProcessing }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] animate-fade-in">
      {/* Two options side by side */}
      <div className="flex gap-6 w-full max-w-4xl">
        {/* Upload Screenshot option */}
        <div
          className={`
            flex-1 p-10 border-2 border-dashed rounded-3xl text-center transition-all duration-300
            ${isProcessing ? 'border-blue-500 bg-blue-500/10 cursor-wait' : 'border-gray-600 hover:border-blue-400 hover:bg-gray-800 cursor-pointer bg-gray-900'}
          `}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            type="file"
            id="fileUpload"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={isProcessing}
          />
          <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center gap-5">
            <div className={`p-5 rounded-full ${isProcessing ? 'bg-blue-500/20 animate-pulse' : 'bg-gray-800'}`}>
              {isProcessing ? (
                <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Upload className="w-10 h-10 text-blue-400" />
              )}
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">
                {isProcessing ? 'Analyzing Schedule...' : 'Upload Screenshot'}
              </h2>
              <p className="text-gray-400 text-sm">
                {isProcessing
                  ? 'We are extracting your events.'
                  : 'Drag & drop or click to select a PNG/JPG'}
              </p>
            </div>
          </label>
        </div>

        {/* Divider */}
        {!isProcessing && (
          <div className="flex flex-col items-center justify-center">
            <div className="h-full w-px bg-gray-700"></div>
            <span className="text-gray-500 text-sm py-3">or</span>
            <div className="h-full w-px bg-gray-700"></div>
          </div>
        )}

        {/* Enter Manually option */}
        {!isProcessing && (
          <button
            onClick={onEnterManually}
            className="flex-1 p-10 border-2 border-dashed rounded-3xl text-center transition-all duration-300 border-gray-600 hover:border-emerald-400 hover:bg-gray-800 bg-gray-900 cursor-pointer"
          >
            <div className="flex flex-col items-center gap-5">
              <div className="p-5 rounded-full bg-gray-800">
                <PenLine className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">Enter Manually</h2>
                <p className="text-gray-400 text-sm">
                  Start with an empty schedule and add classes yourself
                </p>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Feature Pills */}
      {!isProcessing && (
        <div className="flex gap-4 mt-8 text-sm text-gray-500">
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700">
            <FileImage size={14} /> <span>Smart Extraction</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"></div> <span>Auto Categorization</span>
          </div>
        </div>
      )}

      {/* Try with pre-built buttons */}
      {!isProcessing && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={onLoadSample}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors flex items-center gap-2"
          >
            <Play size={14} /> Sample Schedule
          </button>
          <button
            onClick={onLoadMcGillSample}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors flex items-center gap-2"
          >
            <Play size={14} /> McGill Schedule
          </button>
        </div>
      )}
    </div>
  );
};
