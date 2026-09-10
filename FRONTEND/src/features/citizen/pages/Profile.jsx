import { useAuth } from "../../auth/hook/useAuth";

const Profile = () => {
   const { user } = useAuth();
   return <section className="mx-auto max-w-2xl p-6 md:p-10"><h1 className="text-2xl font-semibold text-primary-text">Profile</h1><div className="mt-6 flex flex-col gap-4 rounded-xl border border-border bg-surface p-5"><p className="text-primary-text"><span className="text-sm text-muted-text">Name</span><br />{user?.fullname || "-"}</p><p className="text-primary-text"><span className="text-sm text-muted-text">Email</span><br />{user?.email || "-"}</p><p className="text-primary-text"><span className="text-sm text-muted-text">Role</span><br />{user?.role || "citizen"}</p></div></section>;
};

export default Profile;
