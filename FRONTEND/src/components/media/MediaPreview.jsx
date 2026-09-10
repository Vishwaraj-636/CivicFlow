import React, { useMemo } from 'react';

/**
 * Individual preview item for an image.
 */
function ImagePreviewItem({ file, objectUrl, onRemove }) {
   return (
      <div className="relative group rounded-lg overflow-hidden border border-border bg-surface-elevated aspect-square">
         <img
            src={objectUrl}
            alt={file.name}
            className="w-full h-full object-cover"
         />
         {/* Remove button */}
         <button
            type="button"
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-danger text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
            title="Remove"
         >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               <line x1="18" y1="6" x2="6" y2="18" />
               <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
         </button>
      </div>
   );
}

/**
 * Individual preview item for a video.
 */
function VideoPreviewItem({ file, objectUrl, onRemove }) {
   return (
      <div className="relative group rounded-lg overflow-hidden border border-border bg-surface-elevated aspect-video col-span-2">
         {/* Native video element */}
         <video
            src={objectUrl}
            className="w-full h-full object-cover"
            preload="metadata"
         />
         {/* Play icon overlay */}
         <div className="absolute inset-0 flex items-center justify-center bg-background/50 group-hover:bg-background/60 transition-colors pointer-events-none">
            <svg className="w-8 h-8 text-primary-text" fill="currentColor" viewBox="0 0 24 24">
               <path d="M8 5v14l11-7z" />
            </svg>
         </div>
         {/* Filename */}
         <p className="absolute bottom-0 left-0 right-0 text-[10px] text-primary-text truncate bg-background/70 px-2 py-0.5 backdrop-blur-sm">
            {file.name}
         </p>
         {/* Remove button */}
         <button
            type="button"
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-danger text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
            title="Remove"
         >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               <line x1="18" y1="6" x2="6" y2="18" />
               <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
         </button>
      </div>
   );
}

/**
 * MediaPreview
 *
 * Responsibilities:
 *   - Image preview (thumbnail grid)
 *   - Video preview (with play overlay and filename)
 *   - Remove individual media items
 *
 * @param {File[]}   images      - Selected image File objects
 * @param {File[]}   videos      - Selected video File objects
 * @param {Function} onRemoveImage - Called with index to remove an image
 * @param {Function} onRemoveVideo - Called with index to remove a video
 */
const MediaPreview = ({ images = [], videos = [], onRemoveImage, onRemoveVideo }) => {
   /* Create stable object URLs for preview (revoked on unmount) */
   const imageUrls = useMemo(
      () => images.map((f) => URL.createObjectURL(f)),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [images.length]
   );

   const videoUrls = useMemo(
      () => videos.map((f) => URL.createObjectURL(f)),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [videos.length]
   );

   React.useEffect(() => {
      return () => {
         imageUrls.forEach(URL.revokeObjectURL);
         videoUrls.forEach(URL.revokeObjectURL);
      };
   }, [imageUrls, videoUrls]);

   const total = images.length + videos.length;
   if (total === 0) return null;

   const countText = [
      images.length > 0 && `${images.length} image${images.length > 1 ? 's' : ''}`,
      videos.length > 0 && `${videos.length} video${videos.length > 1 ? 's' : ''}`,
   ]
      .filter(Boolean)
      .join(', ') + ' selected';

   return (
      <div className="flex flex-col gap-3">
         {/* Grid */}
         <div className="grid grid-cols-3 gap-2">
            {images.map((file, idx) => (
               <ImagePreviewItem
                  key={`img-${idx}`}
                  file={file}
                  objectUrl={imageUrls[idx]}
                  onRemove={() => onRemoveImage?.(idx)}
               />
            ))}

            {videos.map((file, idx) => (
               <VideoPreviewItem
                  key={`vid-${idx}`}
                  file={file}
                  objectUrl={videoUrls[idx]}
                  onRemove={() => onRemoveVideo?.(idx)}
               />
            ))}
         </div>

         {/* Count */}
         <p className="text-xs text-muted-text">{countText}</p>
      </div>
   );
};

export default MediaPreview;

