import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Link as LinkIcon, X, Image as ImageIcon } from 'lucide-react';
import { api } from '../api.ts';

interface ImageSelectorProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: 'avatar' | 'cover';
  placeholderFallback?: string;
  idPrefix?: string;
}

export function ImageSelector({
  value = '',
  onChange,
  label = 'Image',
  aspectRatio = 'avatar',
  placeholderFallback = 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80',
  idPrefix = 'img-selector'
}: ImageSelectorProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(() => {
    return (typeof value === 'string' && value && !value.startsWith('data:') && !value.startsWith('/uploads/')) ? value : '';
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof value === 'string' && value && !value.startsWith('data:') && !value.startsWith('/uploads/')) {
      setUrlInput(value);
    }
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size should be less than 10MB.');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await api.uploadMedia(base64Data, file.name);
          if (res && res.url) {
            onChange(res.url);
          } else {
            onChange(base64Data);
          }
        } catch (uploadErr) {
          console.warn('Server upload failed, using local base64 preview:', uploadErr);
          onChange(base64Data);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError('Failed to process image file.');
      setUploading(false);
    }
  };

  const handleUrlSubmit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrlInput(val);
    onChange(val.trim());
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const inputId = `${idPrefix}-file-input`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-bold text-[#183120] text-xs">{label}</label>
        <div className="flex items-center gap-1 bg-[#2D6A4F]/10 p-0.5 rounded-lg text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
              mode === 'upload' ? 'bg-[#2D6A4F] text-white shadow-sm' : 'text-[#1F2D24]/70 hover:text-[#1F2D24]'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
              mode === 'url' ? 'bg-[#2D6A4F] text-white shadow-sm' : 'text-[#1F2D24]/70 hover:text-[#1F2D24]'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-2xl border border-[#2D6A4F]/25 shadow-sm">
        {/* Preview Container */}
        <div className="relative group shrink-0 w-full sm:w-auto flex justify-center">
          <div className={`${
            aspectRatio === 'cover'
              ? 'w-full sm:w-36 h-20 rounded-xl'
              : 'w-16 h-16 rounded-full'
            } overflow-hidden bg-[#183120]/5 border-2 border-[#2D6A4F]/30 flex items-center justify-center shadow-inner relative`}
          >
            {value ? (
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = placeholderFallback;
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 text-[#2D6A4F]/40 p-2 text-center">
                <ImageIcon className="w-6 h-6" />
                <span className="text-[9px] font-bold uppercase tracking-wider">No Image</span>
              </div>
            )}
          </div>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              title="Remove image"
              className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-sm cursor-pointer z-10"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Input Control according to mode */}
        <div className="flex-1 min-w-0 space-y-1.5 w-full">
          {mode === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id={inputId}
              />
              <label
                htmlFor={inputId}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#2D6A4F]/10 hover:bg-[#2D6A4F]/20 text-[#2D6A4F] text-xs font-bold rounded-xl transition cursor-pointer border border-[#2D6A4F]/30"
              >
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Processing Image...' : value ? 'Choose Different File' : 'Browse File from Device'}</span>
              </label>
              <p className="text-[11px] text-[#1F2D24]/60 mt-1">
                Supports JPG, PNG, WEBP, or GIF (Up to 10MB)
              </p>
            </div>
          ) : (
            <div>
              <input
                type="url"
                value={urlInput || ''}
                onChange={handleUrlSubmit}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-[#FAF8F3] border border-[#2D6A4F]/30 rounded-xl px-3 py-2 text-xs text-[#1F2D24] focus:outline-none focus:border-[#2D6A4F]"
              />
              <p className="text-[11px] text-[#1F2D24]/60 mt-1">
                Paste any direct web image URL
              </p>
            </div>
          )}

          {uploadError && (
            <p className="text-[11px] text-red-600 font-medium">{uploadError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
