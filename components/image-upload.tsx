"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  existingUrls?: string[];
  className?: string;
}

export default function ImageUpload({
  onImagesChange,
  maxImages = 5,
  existingUrls = [],
  className,
}: ImageUploadProps) {
  const [urls, setUrls] = useState<string[]>(existingUrls);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (urls.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5 MB)");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Allowed: JPEG, PNG, WebP");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { uploadLandmarkImage } = await import("@/actions/landmark.actions");
      const result = await uploadLandmarkImage(formData);

      if ("error" in result) {
        setError(result.error);
        setUploading(false);
        return;
      }

      const newUrls = [...urls, result.url];
      setUrls(newUrls);
      onImagesChange(newUrls);
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }, [urls, maxImages, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }, [handleFile]);

  const removeImage = useCallback((index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
    onImagesChange(newUrls);
  }, [urls, onImagesChange]);

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleSelect}
          className="hidden"
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Upload size={24} className="text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Drop an image here or click to browse
            </p>
            <p className="text-xs text-muted-foreground/60">
              JPEG, PNG, WebP — max 5 MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={url} className="relative group">
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img
                  src={url}
                  alt={`Upload ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                    (e.target as HTMLImageElement).classList.add("hidden");
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {urls.length > 0 && urls.length < maxImages && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ImageIcon size={12} />
          Add more ({urls.length}/{maxImages})
        </button>
      )}
    </div>
  );
}
