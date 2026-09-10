import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LocationPicker from "../../../components/maps/LocationPicker";
import MediaPreview from "../../../components/media/MediaPreview";
import MediaUploader from "../../../components/media/MediaUploader";
import { createComplaint, uploadComplaintMedia } from "../services/complaint.api";

const ComplaintReport = () => {
   const navigate = useNavigate();
   const [form, setForm] = useState({ title: "", description: "", category: "", address: "", location: null });
   const [media, setMedia] = useState({ images: [], videos: [] });
   const [error, setError] = useState("");
   const [saving, setSaving] = useState(false);
   const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

   async function submit(event) {
      event.preventDefault();
      if (!form.location) { setError("Select a location on the map."); return; }
      setSaving(true); setError("");
      try {
         const files = [...media.images, ...media.videos];
         const uploadedMedia = files.length > 0 ? await uploadComplaintMedia(files) : [];
         const complaint = await createComplaint({ ...form, media: uploadedMedia });
         navigate(`/citizen/complaints/${complaint._id}`);
      }
      catch (requestError) { setError(requestError.response?.data?.error || "Unable to create complaint."); }
      finally { setSaving(false); }
   }

   return (
      <section className="mx-auto max-w-3xl p-6 md:p-10">
         <h1 className="text-2xl font-semibold text-primary-text">Report an issue</h1>
         <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            {[["title", "Title"], ["category", "Category"], ["address", "Address"]].map(([name, label]) => <label key={name} className="flex flex-col gap-2 text-sm text-secondary-text">{label}<input name={name} value={form[name]} onChange={update} required className="rounded-lg border border-border bg-surface px-3 py-2 text-primary-text" /></label>)}
            <label className="flex flex-col gap-2 text-sm text-secondary-text">Description<textarea name="description" value={form.description} onChange={update} required rows="5" className="rounded-lg border border-border bg-surface px-3 py-2 text-primary-text" /></label>
            <div className="flex flex-col gap-3">
               <p className="text-sm text-secondary-text">Photos and videos</p>
               <MediaUploader onFilesReady={setMedia} />
               <MediaPreview
                  images={media.images}
                  videos={media.videos}
                  onRemoveImage={(index) => setMedia((current) => ({ ...current, images: current.images.filter((_, itemIndex) => itemIndex !== index) }))}
                  onRemoveVideo={(index) => setMedia((current) => ({ ...current, videos: current.videos.filter((_, itemIndex) => itemIndex !== index) }))}
               />
            </div>
            <LocationPicker value={form.location} onChange={(location) => setForm({ ...form, location })} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button disabled={saving} className="rounded-lg bg-primary-accent px-4 py-3 font-semibold text-background disabled:opacity-50">{saving ? "Submitting..." : "Submit complaint"}</button>
         </form>
      </section>
   );
};

export default ComplaintReport;
