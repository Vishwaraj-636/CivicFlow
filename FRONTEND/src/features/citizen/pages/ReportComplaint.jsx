import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationPicker from "../../../components/maps/LocationPicker";
import MediaPreview from "../../../components/media/MediaPreview";
import MediaUploader from "../../../components/media/MediaUploader";
import { createComplaint, uploadComplaintMedia } from "../services/complaint.api";
import { COMPLAINT_CATEGORIES } from "../../../constants/complaintCategories";
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

   const attachedCount = media.images.length + media.videos.length;

   return (
      <div
         className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] antialiased pb-16"
         style={{
            fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            "--color-surface": "#FFFFFF",
            "--color-surface-secondary": "#F1F3F2",
            "--color-surface-elevated": "#F1F3F2",
            "--color-border": "#E2E6E4",
            "--color-primary-text": "#17202A",
            "--color-secondary-text": "#52606D",
            "--color-muted-text": "#87919B",
            "--color-primary-accent": "#173B5E",
            "--color-accent-hover": "#122E4A",
         }}
      >
         {/* Top Institutional Context Header */}
         <div className="border-b border-[#E2E6E4] bg-white">
            <div className="mx-auto max-w-3xl px-4 py-3 sm:py-4 flex items-center justify-between">
               <button
                  type="button"
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#E2E6E4] bg-white px-3.5 py-2 text-xs font-medium text-[#52606D] transition hover:border-[#CBD2CF] hover:text-[#17202A] cursor-pointer"
               >
                  <span aria-hidden="true">←</span>
                  <span>Back</span>
               </button>
               <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#39756B]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#39756B]">
                     Citizen Services Portal
                  </span>
               </div>
            </div>
         </div>

         <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 sm:pt-8 space-y-6">
            {/* Page Header */}
            <div className="space-y-1">
               <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
                  Report a Civic Issue
               </h1>
               <p className="text-sm text-[#52606D]">
                  Submit municipal issues directly to dispatch with verified details, evidence photos, and map location.
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
               {/* CARD 1 — CATEGORY */}
               <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                     <div>
                        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#17202A]">
                           1. What is the issue?
                        </h2>
                        <p className="text-xs text-[#52606D]">
                           Select the municipal category that best matches your issue <span className="text-[#A44A4A]">*</span>
                        </p>
                     </div>
                     {form.category && (
                        <span className="hidden sm:inline-block rounded-full bg-[#EEF4FA] px-2.5 py-0.5 text-xs font-medium text-[#24527A] border border-[#D2E3F3]">
                           {form.category}
                        </span>
                     )}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                     {COMPLAINT_CATEGORIES.map((cat) => {
                        const isSelected = form.category === cat.label;
                        return (
                           <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleCategory(cat.label)}
                              className={`flex items-center gap-3 rounded-lg p-3 text-left transition min-h-[56px] cursor-pointer ${isSelected
                                    ? "border-2 border-[#173B5E] bg-[#EEF4FA] text-[#173B5E] shadow-2xs font-semibold"
                                    : "border border-[#E2E6E4] bg-white text-[#17202A] hover:border-[#CBD2CF] hover:bg-[#F7F7F5]"
                                 }`}
                           >
                              <span className="text-xl shrink-0" role="img" aria-label={cat.label}>
                                 {cat.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                 <p className="text-xs font-semibold leading-tight truncate">{cat.label}</p>
                              </div>
                              {isSelected && (
                                 <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#173B5E] text-[10px] text-white">
                                    ✓
                                 </span>
                              )}
                           </button>
                        );
                     })}
                  </div>
               </section>

               {/* CARD 2 — DETAILS */}
               <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
                  <div>
                     <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#17202A]">
                        2. Tell us about the issue
                     </h2>
                     <p className="text-xs text-[#52606D]">
                        Provide a clear summary and detailed breakdown of the situation
                     </p>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <div className="mb-1.5 flex items-center justify-between">
                           <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">
                              Issue Title <span className="text-[#A44A4A]">*</span>
                           </label>
                           <span className="text-xs text-[#87919B]">{form.title.length}/80</span>
                        </div>
                        <input
                           id="title"
                           name="title"
                           type="text"
                           required
                           maxLength={80}
                           value={form.title}
                           onChange={handleForm}
                           placeholder="Brief summary (e.g. Deep pothole causing hazard on 5th Main)"
                           className="w-full min-h-[44px] rounded-lg border border-[#CBD2CF] bg-white px-3.5 py-2.5 text-sm text-[#17202A] placeholder-[#87919B] transition focus:border-[#173B5E] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20"
                        />
                     </div>

                     <div>
                        <div className="mb-1.5 flex items-center justify-between">
                           <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">
                              Detailed Description <span className="text-[#A44A4A]">*</span>
                           </label>
                           <span className="text-xs text-[#87919B]">Detailed breakdown</span>
                        </div>
                        <textarea
                           id="description"
                           name="description"
                           required
                           rows={4}
                           value={form.description}
                           onChange={handleForm}
                           placeholder="Explain the severity, hazards, length of time the issue has existed, or specific landmarks nearby..."
                           className="w-full resize-none rounded-lg border border-[#CBD2CF] bg-white px-3.5 py-2.5 text-sm text-[#17202A] placeholder-[#87919B] transition focus:border-[#173B5E] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20"
                        />
                     </div>
                  </div>
               </section>

               {/* CARD 3 — EVIDENCE */}
               <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                     <div>
                        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#17202A]">
                           3. Add supporting evidence
                        </h2>
                        <p className="text-xs text-[#52606D]">
                           Attach photos or short videos to help inspectors verify the issue
                        </p>
                     </div>
                     {attachedCount > 0 && (
                        <span className="rounded-full border border-[#D2E3F3] bg-[#EEF4FA] px-2.5 py-0.5 text-xs font-medium text-[#24527A]">
                           {attachedCount} attached
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
               </section>

               {/* CARD 4 — LOCATION */}
               <section className="rounded-xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
                  <div>
                     <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#17202A]">
                        4. Where is the issue?
                     </h2>
                     <p className="text-xs text-[#52606D]">
                        Pinpoint the location on the map and confirm the street address <span className="text-[#A44A4A]">*</span>
                     </p>
                  </div>

                  <LocationPicker
                     value={form.location}
                     onChange={handleLocation}
                  />

                  <div className="pt-2">
                     <label htmlFor="address" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#52606D]">
                        Street Address <span className="text-[#A44A4A]">*</span>
                     </label>
                     <input
                        id="address"
                        name="address"
                        type="text"
                        required
                        value={form.address}
                        onChange={handleForm}
                        placeholder="Door number, street name, locality, landmark"
                        className="w-full min-h-[44px] rounded-lg border border-[#CBD2CF] bg-white px-3.5 py-2.5 text-sm text-[#17202A] placeholder-[#87919B] transition focus:border-[#173B5E] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/20"
                     />
                  </div>
               </section>

               {/* Error Message */}
               {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#F3D0D0] bg-[#FBF0F0] p-4 text-xs sm:text-sm text-[#A44A4A]">
                     <span className="shrink-0 font-bold">!</span>
                     <p>{error}</p>
                  </div>
               )}

               {/* Submit Action */}
               <div className="pt-2 space-y-2">
                  <button
                     type="submit"
                     disabled={saving}
                     className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#173B5E] px-4 py-3 text-sm font-medium text-white shadow-xs transition hover:bg-[#122E4A] active:bg-[#0f243b] disabled:opacity-50 cursor-pointer"
                  >
                     {saving ? (
                        <>
                           <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                           </svg>
                           <span>Submitting Complaint...</span>
                        </>
                     ) : (
                        "Submit Complaint"
                     )}
                  </button>
                  <p className="text-center text-xs text-[#87919B]">
                     Your report will be routed to the municipal dispatch center for departmental assignment.
                  </p>
               </div>
            </form>
         </main>
      </div>
   );
};

export default ReportComplaint;
