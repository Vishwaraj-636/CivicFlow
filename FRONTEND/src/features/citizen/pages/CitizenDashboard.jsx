import { Link } from "react-router-dom";

const CitizenDashboard = () => (
   <section className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-10">
      <div>
         <p className="text-sm uppercase tracking-widest text-primary-accent">Citizen portal</p>
         <h1 className="mt-2 text-3xl font-semibold text-primary-text">CivicFlow</h1>
         <p className="mt-2 text-secondary-text">Report local issues and follow their progress.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
         <Link to="/citizen/complaints/report" className="rounded-xl border border-primary-accent/40 bg-surface p-5 hover:border-primary-accent">
            <h2 className="font-semibold text-primary-text">Report an issue</h2>
            <p className="mt-2 text-sm text-secondary-text">Send a new complaint with its location.</p>
         </Link>
         <Link to="/citizen/complaints" className="rounded-xl border border-border bg-surface p-5 hover:border-primary-accent">
            <h2 className="font-semibold text-primary-text">My complaints</h2>
            <p className="mt-2 text-sm text-secondary-text">Review reports and track their status.</p>
         </Link>
      </div>
   </section>
);

export default CitizenDashboard;
