import React, { useRef, useCallback } from 'react';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;  // 50 MB

/**
 * Validate a single File and return an error string or null.
 */
function validateFile(file, kind) {
   const accepted = kind === 'image' ? ACCEPTED_IMAGE_TYPES : ACCEPTED_VIDEO_TYPES;
   const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;

   if (!accepted.includes(file.type)) {
      return `Unsupported format. Accepted: ${accepted.map((t) => t.split('/')[1]).join(', ')}.`;
   }
   if (file.size > maxBytes) {
      return `File too large. Max ${kind === 'image' ? '10 MB' : '50 MB'} allowed.`;
   }
   return null;
}

/**
 * UploadSection
 *
 * One upload zone (image OR video).
 */
function UploadSection({ kind, onFiles, error }) {
   const inputRef = useRef(null);

   const accept = kind === 'image'
      ? ACCEPTED_IMAGE_TYPES.join(',')
      : ACCEPTED_VIDEO_TYPES.join(',');

   const label = kind === 'image' ? 'Upload Image' : 'Upload Video';
   const hint = kind === 'image' ? 'JPG, PNG, WebP' : 'MP4, MOV · up to 50 MB';
   const buttonText = kind === 'image' ? '+ Add Image' : '+ Add Video';

   /* Drag-and-drop */
   const handleDrop = useCallback(
      (e) => {
         e.preventDefault();
         onFiles([...e.dataTransfer.files], kind);
      },
      [kind, onFiles]
   );

   const handleDragOver = (e) => e.preventDefault();

   const handleChange = useCallback(
      (e) => onFiles([...e.target.files], kind),
      [kind, onFiles]
   );

   return (
      <div className="flex flex-col gap-2">
         {/* Drop zone */}
         <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-primary-accent/50 transition-colors"
         >
            {/* Icon */}
            {kind === 'image' ? (
               <svg className="w-8 h-8 text-muted-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l5-5 4 4 3-3 6 6" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
               </svg>
            ) : (
               <svg className="w-8 h-8 text-muted-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
               </svg>
            )}

            <p className="text-xs font-semibold text-secondary-text">{label}</p>
            <p className="text-[11px] text-muted-text">{hint}</p>
            <p className="text-[11px] text-muted-text">Click or drag & drop</p>
         </div>

         {/* Error */}
         {error && (
            <p className="text-xs text-danger flex items-center gap-1">
               <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
               </svg>
               {error}
            </p>
         )}

         {/* Manual select button */}
         <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="self-start text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-secondary-text hover:border-primary-accent/50 hover:text-primary-accent transition-colors cursor-pointer"
         >
            {buttonText}
         </button>

         {/* Hidden file input */}
         <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={handleChange}
         />
      </div>
   );
}

/**
 * MediaUploader
 *
 * Responsibilities:
 *   - Image selection (drag-drop or click)
 *   - Video selection (drag-drop or click)
 *   - File type & size validation
 *   - Upload preparation (passes validated File objects upward via onFilesReady)
 *
 * @param {Function} onFilesReady  - Called with ({ images: File[], videos: File[] })
 * @param {number}   [maxImages=5] - Maximum image count
 * @param {number}   [maxVideos=2] - Maximum video count
 */
const MediaUploader = ({ onFilesReady, maxImages = 5, maxVideos = 2 }) => {
   const [images, setImages] = React.useState([]);
   const [videos, setVideos] = React.useState([]);
   const [imageError, setImageError] = React.useState('');
   const [videoError, setVideoError] = React.useState('');

   const handleFiles = useCallback((files, kind) => {
      const setError = kind === 'image' ? setImageError : setVideoError;
      const current = kind === 'image' ? images : videos;
      const setItems = kind === 'image' ? setImages : setVideos;
      const maxCount = kind === 'image' ? maxImages : maxVideos;

      setError('');

      const validated = [];
      for (const file of files) {
         const err = validateFile(file, kind);
         if (err) { setError(err); return; }
         validated.push(file);
      }

      const merged = [...current, ...validated].slice(0, maxCount);
      setItems(merged);

      const nextImages = kind === 'image' ? merged : images;
      const nextVideos = kind === 'video' ? merged : videos;
      onFilesReady?.({ images: nextImages, videos: nextVideos });
   }, [images, videos, maxImages, maxVideos, onFilesReady]);

   return (
      <div className="flex flex-col gap-5">
         <UploadSection kind="image" onFiles={handleFiles} error={imageError} />
         <div className="border-t border-border" />
         <UploadSection kind="video" onFiles={handleFiles} error={videoError} />
      </div>
   );
};

export default MediaUploader;

