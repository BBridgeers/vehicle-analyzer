'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
    onImagesChange?: (files: File[]) => void;
    onUpload?: (data: any) => void;
    isLoading?: boolean;
    /** Optional initial images from parent (e.g., QuickImportSection photos) */
    initialImages?: { file?: File; preview: string; name?: string }[];
}

export default function ImageUploader({ onImagesChange, onUpload, isLoading: externalLoading, initialImages }: Props) {
    const [images, setImages] = useState<{ file?: File; preview: string }[]>(
        initialImages?.map(img => ({ file: img.file, preview: img.preview })) || []
    );
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisDone, setAnalysisDone] = useState(false);
    const loadedRef = useRef(false);

    // Load initialImages on first mount
    if (initialImages && initialImages.length > 0 && !loadedRef.current) {
        loadedRef.current = true;
        if (images.length === 0) {
            setImages(initialImages.map(img => ({ file: img.file, preview: img.preview })));
        }
    }

    // Sync initialImages if they change externally
    if (initialImages && JSON.stringify(initialImages.map(i => i.preview)) !== JSON.stringify(images.map(i => i.preview)) && images.length === 0) {
        loadedRef.current = true;
    }

    const processFiles = useCallback(
        (files: FileList | File[]) => {
            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            const newImages: { file?: File; preview: string }[] = [];

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
            if (onImagesChange) onImagesChange(updated.filter(i => i.file).map(i => i.file!));
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
        if (images[index]?.preview) URL.revokeObjectURL(images[index].preview);
        const updated = images.filter((_, i) => i !== index);
        setImages(updated);
        if (onImagesChange) onImagesChange(updated.filter(i => i.file).map(i => i.file!));
    };

    const handleAnalyze = useCallback(async () => {
        if (images.length === 0 || !onUpload) return;
        setIsAnalyzing(true);
        setAnalysisDone(false);

        try {
            // Resize and send each photo one at a time, collect results
            const allExtractions: any[] = [];

            for (const img of images) {
                if (!img.file) continue;

                // Compress image before sending
                const blob = await (() => new Promise<Blob>((resolve, reject) => {
                    const image = new window.Image();
                    const url = URL.createObjectURL(img.file!);
                    image.onload = () => {
                        URL.revokeObjectURL(url);
                        const canvas = document.createElement('canvas');
                        const maxDim = 1024;
                        let { width, height } = image;
                        if (width > height && width > maxDim) { height *= maxDim / width; width = maxDim; }
                        else if (height > maxDim) { width *= maxDim / height; height = maxDim; }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
                        ctx.drawImage(image, 0, 0, width, height);
                        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed to create blob')), 'image/jpeg', 0.7);
                    };
                    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
                    image.src = url;
                }))();

                const fd = new FormData();
                fd.append('image', blob, `photo-${Math.random().toString(36).slice(2)}.jpg`);
                fd.append('mode', 'condition');

                const res = await fetch('/api/extract-listing', {
                    method: 'POST',
                    body: fd,
                });

                if (res.ok) {
                    const data = await res.json();
                    // API wraps result in { success, vehicle: { ... } }
                    const vehicle = data.vehicle || data;
                    allExtractions.push(vehicle);
                }
                // If individual photo fails, just skip it
            }

            // Merge all condition extractions
            const merged: Record<string, string> = {};
            const exteriorParts: string[] = [];
            const interiorParts: string[] = [];
            const mechanicalParts: string[] = [];
            const notableParts: string[] = [];

            for (const extraction of allExtractions) {
                if (extraction.exteriorCondition) exteriorParts.push(extraction.exteriorCondition);
                if (extraction.interiorCondition) interiorParts.push(extraction.interiorCondition);
                if (extraction.mechanicalCondition) mechanicalParts.push(extraction.mechanicalCondition);
                if (extraction.notableDamage) notableParts.push(extraction.notableDamage);
                // Also pass through any other extracted fields
                for (const [key, val] of Object.entries(extraction)) {
                    if (!['exteriorCondition', 'interiorCondition', 'mechanicalCondition', 'notableDamage', 'overallImpression', 'exteriorColor', 'interiorColor', 'transmission', 'fuelType', 'drivetrain', 'engine', 'bodyStyle', 'condition'].includes(key) && typeof val === 'string') {
                        merged[key] = merged[key] ? `${merged[key]}\n${val}` : val;
                    }
                }
                // Pass through scalar specification fields directly (don't join, take first non-empty value)
                for (const key of ['exteriorColor', 'interiorColor', 'transmission', 'fuelType', 'drivetrain', 'engine', 'bodyStyle', 'condition', 'overallImpression']) {
                    if (extraction[key] && !merged[key]) merged[key] = extraction[key];
                }
            }

            if (exteriorParts.length > 0) merged.exteriorCondition = exteriorParts.join(' | ');
            if (interiorParts.length > 0) merged.interiorCondition = interiorParts.join(' | ');
            if (mechanicalParts.length > 0) merged.mechanicalCondition = mechanicalParts.join(' | ');
            if (notableParts.length > 0) merged.notableDamage = notableParts.join(' | ');

            if (Object.keys(merged).length > 0) {
                onUpload(merged);
                setAnalysisDone(true);
                setTimeout(() => setAnalysisDone(false), 5000);
            }

        } catch (err: any) {
            console.error('Photo analysis failed:', err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [images, onUpload]);

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                    isDragging
                        ? 'border-[var(--color-accent-indigo)] bg-[var(--color-accent-indigo)]/10'
                        : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent-indigo)]'
                }`}
                onClick={() => document.getElementById('image-file-input')?.click()}
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
                    <span className="font-semibold text-[var(--color-accent-indigo)]">Click to upload</span>{' '}
                    or drag & drop
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    JPEG, PNG, WebP  •  Max 10 photos
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
                <div className="flex items-center justify-between">
                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {images.length} photo{images.length !== 1 ? 's' : ''} attached
                    </p>
                    {onUpload && (
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || externalLoading}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                analysisDone
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                        >
                            {isAnalyzing ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
                            ) : analysisDone ? (
                                <><CheckCircle2 className="w-3 h-3" /> Analyzed</>
                            ) : (
                                <><Sparkles className="w-3 h-3" /> Analyze Photos</>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
