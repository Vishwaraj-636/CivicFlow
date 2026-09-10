import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationPicker from "../../../components/maps/LocationPicker";
import MediaPreview from "../../../components/media/MediaPreview";
import MediaUploader from "../../../components/media/MediaUploader";
import { createComplaint, uploadComplaintMedia } from "../services/complaint.api";
import CategorySelector from "../components/CategorySelector";
import useComplaintForm from "../hook/useComplaintForm";

const ReportComplaint = () => {
   const navigate = useNavigate();
   const {
      form,
      media,
      handleCategory,
      handleLocation,
      handleMedia,
      handleForm,
   } = useComplaintForm();

   const [error, setError] = useState("");
   const [saving, setSaving] = useState(false);

   const handleRemoveImage = (index) => {
      handleMedia({
         ...media,
         images: media.images.filter((_, itemIndex) => itemIndex !== index),
      });
   };

   const handleRemoveVideo = (index) => {
      handleMedia({
         ...media,
         videos: media.videos.filter((_, itemIndex) => itemIndex !== index),
      });
   };

   async function handleSubmit(event) {
      event.preventDefault();

      if (!form.category) {
         setError("Please select a complaint category.");
         return;
      }

      if (!form.location) {
         setError("Select a location on the map.");
         return;
      }

      setSaving(true);
      setError("");

      try {
         const files = [...media.images, ...media.videos];
         const uploadedMedia = files.length > 0 ? await uploadComplaintMedia(files) : [];

         // Clean payload: contains only the required user-specified fields
         const payload = {
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category,
            address: form.address.trim(),
            location: form.location,
            media: uploadedMedia,
         };

         const complaint = await createComplaint(payload);
         navigate(`/citizen/complaints/${complaint._id}`);
      } catch (requestError) {
         setError(requestError.response?.data?.error || "Unable to create complaint. Please try again.");
      } finally {
         setSaving(false);
      }
   }

   return (
      <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-800 antialiased">
         {/* Header */}
         <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
               <button
                  type="button"
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
               >
                  ←
               </button>
               <div>
                  <h1 className="text-base font-bold leading-tight text-slate-900">Report Complaint</h1>
                  <p className="text-xs text-slate-500">Citizen Services Portal</p>
               </div>
            </div>
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
               Public
            </span>
         </header>

         <main className="mx-auto max-w-lg space-y-4 px-4 pt-4">
            {/* Notice Banner */}
            <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-teal-50 p-4 shadow-sm">
               <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600">
                  ℹ
               </div>
               <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-950">Citizen Voice</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-emerald-800">
                     Submit civic issues directly to municipal dispatch. Provide detailed location and photos for faster resolution.
                  </p>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
               {/* 1. Category Selection */}
               <CategorySelector
                  value={form.category}
                  onChange={handleCategory}
               />

               {/* 2. Title & Description */}
               <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div>
                     <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                           Title <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">{form.title.length}/80</span>
                     </div>
                     <input
                        id="title"
                        name="title"
                        type="text"
                        required
                        maxLength={80}
                        value={form.title}
                        onChange={handleForm}
                        placeholder="Brief summary of the issue"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                     />
                  </div>

                  <div>
                     <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                           Description <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Detailed breakdown</span>
                     </div>
                     <textarea
                        id="description"
                        name="description"
                        required
                        rows={4}
                        value={form.description}
                        onChange={handleForm}
                        placeholder="Explain the severity, hazards, or specific landmarks nearby..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                     />
                  </div>
               </div>

               {/* 3. Media Upload */}
               <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                     <label className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                        Evidence Media
                     </label>
                     {(media.images.length > 0 || media.videos.length > 0) && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                           {media.images.length + media.videos.length} attached
                        </span>
                     )}
                  </div>

                  <MediaUploader onFilesReady={handleMedia} />

                  <MediaPreview
                     images={media.images}
                     videos={media.videos}
                     onRemoveImage={handleRemoveImage}
                     onRemoveVideo={handleRemoveVideo}
                  />
               </div>

               {/* 4. Location & Address */}
               <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
                     Location & Map <span className="text-rose-500">*</span>
                  </label>

                  <LocationPicker
                     value={form.location}
                     onChange={handleLocation}
                  />

                  <div>
                     <label htmlFor="address" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                        Street Address <span className="text-rose-500">*</span>
                     </label>
                     <input
                        id="address"
                        name="address"
                        type="text"
                        required
                        value={form.address}
                        onChange={handleForm}
                        placeholder="Door number, street name, landmark"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                     />
                  </div>
               </div>

               {/* Error Message */}
               {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
                     {error}
                  </div>
               )}

               {/* Submit Action */}
               <div className="pt-2">
                  <button
                     type="submit"
                     disabled={saving}
                     className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50"
                  >
                     {saving ? "Submitting..." : "Submit Complaint"}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                     Your report will be routed to the municipal dispatch center.
                  </p>
               </div>
            </form>
         </main>
      </div>
   );
};

export default ReportComplaint;

