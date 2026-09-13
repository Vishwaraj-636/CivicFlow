import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
   const [successMessage, setSuccessMessage] = useState("");
   const [loading, setLoading] = useState(false);

   // Synchronize form fields whenever user profile data updates
   useEffect(() => {
      if (user && !isEditing) {
         setFormData({
            fullname: user.fullname || "",
            contact: user.contact || "",
            profileImage: user.profileImage || "",
         });
      }
   }, [user, isEditing]);

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
   };

   const handleCancel = () => {
      setFormData({
         fullname: user?.fullname || "",
         contact: user?.contact || "",
         profileImage: user?.profileImage || "",
      });
      setError("");
      setIsEditing(false);
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setSuccessMessage("");
      setLoading(true);
      try {
         await handleUpdateProfile(formData);
         setIsEditing(false);
         setSuccessMessage("Your profile has been updated successfully.");
         setTimeout(() => setSuccessMessage(""), 5000);
      } catch (err) {
         setError(err?.response?.data?.message || "Failed to update profile. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   const userInitials = user?.fullname
      ? user.fullname
         .split(" ")
         .map((n) => n[0])
         .slice(0, 2)
         .join("")
         .toUpperCase()
      : "U";

   const displayId = user?.id || user?._id ? `#CF-RES-${String(user?.id || user?._id).slice(-5).toUpperCase()}` : "—";

   return (
      <div
         className="min-h-[calc(100vh-4rem)] w-full bg-[#F7F7F5] text-[#17202A] font-['Public_Sans',sans-serif] antialiased"
         style={{
            fontFamily:
               "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            "--color-surface": "#FFFFFF",
            "--color-surface-secondary": "#F1F3F2",
            "--color-surface-elevated": "#F1F3F2",
            "--color-surface-bright": "#F7F7F5",
            "--color-border": "#E2E6E4",
            "--color-primary-text": "#17202A",
            "--color-secondary-text": "#52606D",
            "--color-muted-text": "#87919B",
            "--color-primary-accent": "#173B5E",
            "--color-accent-hover": "#122E4A",
         }}
      >
         <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6 md:p-8 lg:p-10">
            {/* ── Page Header ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <div className="flex items-center gap-2">
                     <span className="text-[11px] font-semibold uppercase tracking-wider text-[#52606D]">
                        Citizen Services Portal
                     </span>
                     <span className="text-[11px] text-[#87919B]">•</span>
                     <span className="inline-flex items-center gap-1 rounded-full bg-[#ECF5F0] border border-[#C6E7D5] px-2 py-0.2 text-[10px] font-semibold uppercase tracking-wider text-[#28704F]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#28704F]" />
                        Citizen Account
                     </span>
                  </div>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17202A] sm:text-3xl">
                     Profile & Account Settings
                  </h1>
                  <p className="mt-1 text-sm text-[#52606D]">
                     Review your citizen account details, manage contact coordinates, and view municipal service credentials.
                  </p>
               </div>

               {!isEditing && (
                  <button
                     onClick={() => {
                        setError("");
                        setSuccessMessage("");
                        setIsEditing(true);
                     }}
                     className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#173B5E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#122E4A] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/30 shrink-0 cursor-pointer"
                  >
                     <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                     </svg>
                     Edit Profile
                  </button>
               )}
            </div>

            {/* ── Success Notification Banner ── */}
            {successMessage && (
               <div className="flex items-center gap-3 rounded-xl border border-[#C6E7D5] bg-[#ECF5F0] p-4 text-[#28704F] shadow-xs">
                  <svg
                     className="h-5 w-5 shrink-0 text-[#28704F]"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                     strokeWidth={2}
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                     />
                  </svg>
                  <p className="text-sm font-semibold">{successMessage}</p>
               </div>
            )}

            {/* ── Error Notification Banner ── */}
            {error && (
               <div className="flex items-center justify-between rounded-xl border border-[#F3D0D0] bg-[#FBF0F0] p-4 text-[#A44A4A] shadow-xs">
                  <div className="flex items-center gap-3">
                     <svg
                        className="h-5 w-5 shrink-0 text-[#A44A4A]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                     </svg>
                     <p className="text-sm font-semibold">{error}</p>
                  </div>
                  <button
                     onClick={() => setError("")}
                     className="text-xs font-bold text-[#A44A4A] hover:opacity-80 p-1 cursor-pointer"
                  >
                     ✕
                  </button>
               </div>
            )}

            {/* ── Citizen Identity Hero Card ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 rounded-2xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-sm">
               <div className="flex items-center gap-4">
                  {user?.profileImage ? (
                     <img
                        src={user.profileImage}
                        alt={user.fullname || "Citizen Profile"}
                        className="h-16 w-16 rounded-full object-cover border-2 border-[#E2E6E4] shadow-xs shrink-0"
                     />
                  ) : (
                     <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#173B5E] text-xl font-bold text-white shadow-xs shrink-0">
                        {userInitials}
                     </div>
                  )}

                  <div className="flex flex-col gap-1">
                     <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-[#17202A]">
                           {user?.fullname || "Unnamed Resident"}
                        </h2>
                        <span className="rounded-md border border-[#E2E6E4] bg-[#F1F3F2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#173B5E]">
                           {user?.role || "citizen"}
                        </span>
                     </div>
                     <p className="text-xs text-[#52606D]">{user?.email || "No email registered"}</p>
                     <div className="flex items-center gap-2 text-[11px] text-[#87919B]">
                        <span className="font-mono font-semibold">{displayId}</span>
                        <span>•</span>
                        <span>
                           Auth: {user?.authProvider === "google" ? "Google SSO" : "Municipal Auth"}
                        </span>
                     </div>
                  </div>
               </div>

               <div className="flex sm:flex-col items-center sm:items-end justify-between border-t border-[#E2E6E4] sm:border-t-0 pt-3 sm:pt-0 text-xs text-[#87919B]">
                  <span className="font-medium text-[#52606D]">Municipal Status</span>
                  <span className="font-semibold text-[#28704F]">Citizen Account</span>
               </div>
            </div>

            {/* ── Main Information & Edit Workspace ── */}
            <div className="grid gap-6 md:grid-cols-3">
               {/* Primary Form / Dossier Column (2 cols on desktop) */}
               <div className="md:col-span-2 rounded-2xl border border-[#E2E6E4] bg-white p-5 sm:p-6 shadow-sm">
                  <div className="border-b border-[#E2E6E4] pb-3 mb-5 flex items-center justify-between">
                     <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-[#17202A]">
                           {isEditing ? "Edit Personal Details" : "Personal & Contact Information"}
                        </h2>
                        <p className="mt-0.5 text-xs text-[#52606D]">
                           {isEditing
                              ? "Update your municipal notification and dispatch contact coordinates."
                              : "Primary records registered with the municipal administration."}
                        </p>
                     </div>
                  </div>

                  {isEditing ? (
                     <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Full Name */}
                        <div>
                           <label
                              htmlFor="fullnameInput"
                              className="text-[11px] font-semibold uppercase tracking-wider text-[#52606D]"
                           >
                              Full Legal Name <span className="text-[#A44A4A]">*</span>
                           </label>
                           <input
                              id="fullnameInput"
                              type="text"
                              name="fullname"
                              value={formData.fullname}
                              onChange={handleChange}
                              placeholder="e.g. Eleanor Vance"
                              className="mt-1 min-h-[44px] w-full rounded-lg border border-[#CBD2CF] bg-[#F7F7F5] px-3.5 py-2 text-xs font-medium text-[#17202A] placeholder-[#87919B] transition-colors focus:border-[#173B5E] focus:bg-white focus:outline-none"
                              required
                           />
                           <p className="mt-1 text-[11px] text-[#87919B]">
                              Your verified name as registered on civic records.
                           </p>
                        </div>

                        {/* Email Address (Immutable) */}
                        <div>
                           <div className="flex items-center justify-between">
                              <label
                                 htmlFor="emailInput"
                                 className="text-[11px] font-semibold uppercase tracking-wider text-[#52606D]"
                              >
                                 Registered Email Address
                              </label>
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#87919B]">
                                 <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                 </svg>
                                 Locked
                              </span>
                           </div>
                           <input
                              id="emailInput"
                              type="email"
                              value={user?.email || ""}
                              className="mt-1 min-h-[44px] w-full rounded-lg border border-[#E2E6E4] bg-[#F1F3F2] px-3.5 py-2 text-xs font-medium text-[#52606D] cursor-not-allowed"
                              disabled
                           />
                           <p className="mt-1 text-[11px] text-[#87919B]">
                              Primary account email is locked and managed by Municipal Authentication.
                           </p>
                        </div>

                        {/* Contact Number */}
                        <div>
                           <label
                              htmlFor="contactInput"
                              className="text-[11px] font-semibold uppercase tracking-wider text-[#52606D]"
                           >
                              Primary Contact Number
                           </label>
                           <input
                              id="contactInput"
                              type="text"
                              name="contact"
                              value={formData.contact}
                              onChange={handleChange}
                              placeholder="e.g. +91 98765 43210"
                              className="mt-1 min-h-[44px] w-full rounded-lg border border-[#CBD2CF] bg-[#F7F7F5] px-3.5 py-2 text-xs font-medium text-[#17202A] placeholder-[#87919B] transition-colors focus:border-[#173B5E] focus:bg-white focus:outline-none"
                           />
                           <p className="mt-1 text-[11px] text-[#87919B]">
                              Primary contact telephone for municipal profile records.
                           </p>
                        </div>

                        {/* Profile Image URL */}
                        <div>
                           <label
                              htmlFor="profileImageInput"
                              className="text-[11px] font-semibold uppercase tracking-wider text-[#52606D]"
                           >
                              Profile Image URL
                           </label>
                           <input
                              id="profileImageInput"
                              type="url"
                              name="profileImage"
                              value={formData.profileImage}
                              onChange={handleChange}
                              placeholder="https://example.com/avatar.jpg"
                              className="mt-1 min-h-[44px] w-full rounded-lg border border-[#CBD2CF] bg-[#F7F7F5] px-3.5 py-2 text-xs font-medium text-[#17202A] placeholder-[#87919B] transition-colors focus:border-[#173B5E] focus:bg-white focus:outline-none"
                           />
                           <p className="mt-1 text-[11px] text-[#87919B]">
                              Direct link to a public image for your account avatar.
                           </p>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-4 flex flex-col sm:flex-row gap-3 pt-2">
                           <button
                              type="button"
                              onClick={handleCancel}
                              disabled={loading}
                              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-[#CBD2CF] bg-white py-2 text-xs font-semibold text-[#17202A] transition-colors hover:bg-[#F1F3F2] cursor-pointer disabled:opacity-50"
                           >
                              Cancel
                           </button>
                           <button
                              type="submit"
                              disabled={loading}
                              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-[#173B5E] py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#122E4A] focus:outline-none focus:ring-2 focus:ring-[#173B5E]/30 cursor-pointer disabled:opacity-50"
                           >
                              {loading ? "Saving Changes..." : "Save Changes"}
                           </button>
                        </div>
                     </form>
                  ) : (
                     <div className="flex flex-col gap-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                           <div className="rounded-xl border border-[#E2E6E4] bg-[#F7F7F5] p-3.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#87919B]">
                                 Full Legal Name
                              </span>
                              <p className="mt-1 text-sm font-semibold text-[#17202A]">
                                 {user?.fullname || "—"}
                              </p>
                           </div>
                           <div className="rounded-xl border border-[#E2E6E4] bg-[#F7F7F5] p-3.5">
                              <div className="flex items-center justify-between">
                                 <span className="text-[10px] font-semibold uppercase tracking-wider text-[#87919B]">
                                    Registered Email
                                 </span>
                                 <span className="text-[10px] font-bold text-[#87919B]">Locked</span>
                              </div>
                              <p className="mt-1 text-sm font-semibold text-[#17202A] truncate">
                                 {user?.email || "—"}
                              </p>
                           </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                           <div className="rounded-xl border border-[#E2E6E4] bg-[#F7F7F5] p-3.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#87919B]">
                                 Contact Number
                              </span>
                              <p className="mt-1 text-sm font-semibold text-[#17202A]">
                                 {user?.contact || "Not provided"}
                              </p>
                           </div>
                           <div className="rounded-xl border border-[#E2E6E4] bg-[#F7F7F5] p-3.5">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#87919B]">
                                 Avatar Link
                              </span>
                              <p className="mt-1 text-sm font-medium text-[#52606D] truncate">
                                 {user?.profileImage || "Default system initials"}
                              </p>
                           </div>
                        </div>

                        <div className="mt-1 flex items-center justify-between rounded-xl border border-[#CBD2CF] bg-[#F1F3F2] p-4 text-xs text-[#52606D]">
                           <div>
                              <p className="font-semibold text-[#17202A]">Need to update your contact information?</p>
                              <p className="mt-0.5 text-[11px]">Click edit profile to revise your legal name, phone, or avatar link.</p>
                           </div>
                           <button
                              onClick={() => {
                                 setError("");
                                 setSuccessMessage("");
                                 setIsEditing(true);
                              }}
                              className="min-h-[40px] rounded-lg border border-[#CBD2CF] bg-white px-3.5 py-1 text-xs font-semibold text-[#17202A] hover:bg-[#E2E6E4] cursor-pointer shrink-0"
                           >
                              Edit
                           </button>
                        </div>
                     </div>
                  )}
               </div>

               {/* Secondary Sidebar Column: Account Context & Privacy (1 col on desktop) */}
               <div className="flex flex-col gap-6">
                  {/* Account Verification & Role Card */}
                  <div className="rounded-2xl border border-[#E2E6E4] bg-white p-5 shadow-sm">
                     <h3 className="text-xs font-bold uppercase tracking-wider text-[#17202A]">
                        Account Credentials
                     </h3>
                     <div className="mt-3 space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b border-[#E2E6E4] pb-2">
                           <span className="text-[#87919B]">Municipal Role</span>
                           <span className="font-semibold uppercase tracking-wider text-[#173B5E]">
                              {user?.role || "citizen"}
                           </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-[#E2E6E4] pb-2">
                           <span className="text-[#87919B]">Authentication</span>
                           <span className="font-medium text-[#17202A]">
                              {user?.authProvider === "google" ? "Google OAuth 2.0" : "Local Password"}
                           </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-[#E2E6E4] pb-2">
                           <span className="text-[#87919B]">Profile Status</span>
                           <span className="font-medium text-[#28704F]">
                              {user?.profileCompleted ? "Complete" : "Pending"}
                           </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                           <span className="text-[#87919B]">My Complaints</span>
                           <Link
                              to="/citizen/complaints"
                              className="font-semibold text-[#173B5E] hover:underline"
                           >
                              View History →
                           </Link>
                        </div>
                     </div>
                  </div>

                  {/* Municipal Data Protection & Trust Card */}
                  <div className="rounded-2xl border border-[#E2E6E4] bg-[#FAFAFA] p-5 shadow-sm">
                     <div className="flex items-center gap-2 text-[#39756B]">
                        <svg
                           className="h-4 w-4 shrink-0"
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                           strokeWidth={2}
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                           />
                        </svg>
                        <h3 className="text-xs font-bold uppercase tracking-wider">
                           Data Protection Notice
                        </h3>
                     </div>
                     <p className="mt-2 text-xs leading-relaxed text-[#52606D]">
                        Your identity records and contact coordinates are encrypted and retained strictly under the Municipal Public Transparency and Privacy Framework. Used to support municipal profile records and complaint-related communication.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Profile;
