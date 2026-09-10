import { useState } from "react";
import { useAuth } from "../../auth/hook/useAuth";

const Profile = () => {
   const { user, handleUpdateProfile } = useAuth();
   const [isEditing, setIsEditing] = useState(false);
   const [formData, setFormData] = useState({
      fullname: user?.fullname || "",
      contact: user?.contact || "",
      profileImage: user?.profileImage || "",
   });
   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   const handleChange = (e) => {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      try {
         await handleUpdateProfile(formData);
         setIsEditing(false);
      } catch (err) {
         setError("Failed to update profile. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <section className="mx-auto max-w-2xl p-6 md:p-10">
         <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-primary-text">Profile</h1>
            {!isEditing && (
               <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-semibold text-primary-accent hover:underline"
               >
                  Edit Profile
               </button>
            )}
         </div>

         <div className="rounded-xl border border-border bg-surface p-6">
            {error && <p className="mb-4 text-sm text-danger">{error}</p>}

            {isEditing ? (
               <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                     <label className="text-sm text-muted-text">Full Name</label>
                     <input
                        type="text"
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-primary-text"
                        required
                     />
                  </div>
                  <div>
                     <label className="text-sm text-muted-text">Email</label>
                     <input
                        type="email"
                        value={user?.email || ""}
                        className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-muted-text cursor-not-allowed"
                        disabled
                     />
                     <p className="mt-1 text-xs text-muted-text">Email cannot be changed.</p>
                  </div>
                  <div>
                     <label className="text-sm text-muted-text">Contact Number</label>
                     <input
                        type="text"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-primary-text"
                     />
                  </div>
                  <div>
                     <label className="text-sm text-muted-text">Profile Image URL</label>
                     <input
                        type="url"
                        name="profileImage"
                        value={formData.profileImage}
                        onChange={handleChange}
                        placeholder="https://example.com/avatar.jpg"
                        className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-primary-text"
                     />
                  </div>

                  <div className="mt-4 flex gap-3">
                     <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 rounded-lg border border-border bg-surface py-2 text-sm font-semibold text-primary-text hover:bg-background"
                     >
                        Cancel
                     </button>
                     <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 rounded-lg bg-primary-accent py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
                     >
                        {loading ? "Saving..." : "Save Changes"}
                     </button>
                  </div>
               </form>
            ) : (
               <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                     {user?.profileImage ? (
                        <img
                           src={user.profileImage}
                           alt={user.fullname}
                           className="h-16 w-16 rounded-full object-cover border border-border"
                        />
                     ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-accent text-xl font-bold text-background">
                           {user?.fullname?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                     )}
                     <div>
                        <p className="text-lg font-semibold text-primary-text">{user?.fullname || "-"}</p>
                        <p className="text-sm text-secondary-text capitalize">{user?.role || "citizen"}</p>
                     </div>
                  </div>
                  <hr className="border-border" />
                  <div className="grid gap-4 sm:grid-cols-2">
                     <div>
                        <span className="text-sm text-muted-text">Email</span>
                        <p className="mt-1 text-primary-text">{user?.email || "-"}</p>
                     </div>
                     <div>
                        <span className="text-sm text-muted-text">Contact Number</span>
                        <p className="mt-1 text-primary-text">{user?.contact || "-"}</p>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </section>
   );
};

export default Profile;
