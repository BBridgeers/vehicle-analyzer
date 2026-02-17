"use client";

import { useState, useCallback } from "react";
import { Upload, X, ImageIcon } from "lucide-react";

interface Props {
    onImagesChange: (files: File[]) => void;
}

export default function ImageUploader({ onImagesChange }: Props) {
    const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const processFiles = useCallback(
        (files: FileList | File[]) => {
            const validTypes = ["image/jpeg", "image/png", "image/webp"];
            const newImages: { file: File; preview: string }[] = [];

            Array.from(files).forEach((file) => {
                if (validTypes.includes(file.type) && images.length + newImages.length < 10) {
                    newImages.push({
                        file,
                        preview: URL.createObjectURL(file),
                    });
                }
            });

            const updated = [...images, ...newImages];
            setImages(updated);
            onImagesChange(updated.map((i) => i.file));
        },
        [images, onImagesChange]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files.length > 0) {
                processFiles(e.dataTransfer.files);
            }
        },
        [processFiles]
    );

    const handleRemove = (index: number) => {
        URL.revokeObjectURL(images[index].preview);
        const updated = images.filter((_, i) => i !== index);
        setImages(updated);
        onImagesChange(updated.map((i) => i.file));
    };

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${isDragging
                    ? "border-[var(--color-accent-indigo)] bg-[var(--color-accent-indigo)]/10"
                    : "border-[var(--color-border-subtle)] hover:border-[var(--color-accent-indigo)]"
                    }`}
                onClick={() => document.getElementById("image-file-input")?.click()}
            >
                <input
                    id="image-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    title="Upload vehicle photos"
                    onChange={(e) => e.target.files && processFiles(e.target.files)}
                />
                <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                    <span className="font-semibold text-[var(--color-accent-indigo)]">Click to upload</span>{" "}
                    or drag & drop
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    JPEG, PNG, WebP • Max 10 photos
                </p>
            </div>

            {/* Thumbnail gallery */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {images.map((img, i) => (
                        <div
                            key={i}
                            className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--color-border-subtle)]"
                        >
                            <img
                                src={img.preview}
                                alt={`Vehicle photo ${i + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove photo"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {images.length > 0 && (
                <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {images.length} photo{images.length !== 1 ? "s" : ""} attached
                </p>
            )}
        </div>
    );
}
