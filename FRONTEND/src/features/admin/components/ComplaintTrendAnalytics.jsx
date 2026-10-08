import { useEffect, useMemo, useState } from "react";
import { getAdminComplaintTrends } from "../services/complaintTrends.api";

const SERIES_COLORS = ["#173B5E", "#39756B", "#B58A5A", "#C47732", "#9B5A6C"];

const buildSeries = (rows, key) => {
   const totals = rows.reduce((result, row) => ({ ...result, [row[key]]: (result[row[key]] ?? 0) + row.count }), {});
   return Object.entries(totals)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 5)
      .map(([name]) => ({ name, values: rows.filter((row) => row[key] === name) }));
};

const ComplaintTrendAnalytics = () => {
   const [period, setPeriod] = useState("month");
   const [dimension, setDimension] = useState("category");
   const [data, setData] = useState({ trend: [], categoryTrend: [], departmentTrend: [] });
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");

   useEffect(() => {
      setLoading(true);
      getAdminComplaintTrends(period)
         .then(setData)
         .catch(() => setError("Unable to load complaint trend analytics."))
         .finally(() => setLoading(false));
   }, [period]);

   const periods = data.trend.map((row) => row.period);
   const rows = dimension === "category" ? data.categoryTrend : data.departmentTrend;
   const key = dimension === "category" ? "category" : "department";
   const series = useMemo(() => buildSeries(rows, key), [rows, key]);
   const maxValue = Math.max(1, ...data.trend.map((row) => row.count), ...series.flatMap((item) => item.values.map((row) => row.count)));
   const total = data.trend.reduce((sum, row) => sum + row.count, 0);
   const pointFor = (value, index) => `${periods.length <= 1 ? 300 : (index / (periods.length - 1)) * 580 + 10},${160 - (value / maxValue) * 140}`;

   return (
      <section aria-labelledby="complaint-trends-heading" className="space-y-4 rounded-xl border border-[#E2E6E4] bg-white p-5 shadow-sm sm:p-6">
         <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
               <p className="text-[11px] font-bold uppercase tracking-wider text-[#39756B]">Historical analytics</p>
               <h2 id="complaint-trends-heading" className="mt-1 text-lg font-semibold text-[#17202A]">Complaint trends</h2>
               <p className="mt-1 text-xs text-[#52606D]">Track recurring complaint types, departmental workload, and seasonal increases.</p>
            </div>
            <div className="flex flex-wrap gap-2">
               <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-lg border border-[#CBD2CF] bg-white px-3 py-2 text-xs font-semibold text-[#17202A]"><option value="day">By day</option><option value="week">By week</option><option value="month">By month</option></select>
               <select value={dimension} onChange={(event) => setDimension(event.target.value)} className="rounded-lg border border-[#CBD2CF] bg-white px-3 py-2 text-xs font-semibold text-[#17202A]"><option value="category">Categories</option><option value="department">Departments</option></select>
            </div>
         </div>

         {error && <p className="rounded-lg border border-[#F3D0D0] bg-[#FBF0F0] p-3 text-sm text-[#A44A4A]">{error}</p>}
         {loading ? <p className="py-10 text-center text-sm text-[#52606D]">Loading historical complaint data...</p> : data.trend.length === 0 ? <p className="py-10 text-center text-sm text-[#52606D]">No complaint history is available for this period.</p> : (
            <>
               <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-[#F1F3F2] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[#52606D]">Total complaints</p><p className="mt-1 text-2xl font-semibold text-[#17202A]">{total}</p></div><div className="rounded-lg bg-[#EEF4FA] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[#24527A]">Peak period</p><p className="mt-1 text-lg font-semibold text-[#17202A]">{data.trend.reduce((peak, row) => row.count > peak.count ? row : peak, data.trend[0]).period}</p></div><div className="rounded-lg bg-[#ECF5F0] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[#28704F]">Peak volume</p><p className="mt-1 text-2xl font-semibold text-[#17202A]">{Math.max(...data.trend.map((row) => row.count))}</p></div></div>
               <div className="overflow-hidden rounded-lg border border-[#E2E6E4] bg-[#FCFDFC] p-3"><svg viewBox="0 0 600 180" role="img" aria-label={`Complaint volume trend by ${period}`} className="h-56 w-full"><line x1="10" y1="160" x2="590" y2="160" stroke="#CBD2CF" strokeWidth="1" /><polyline points={data.trend.map((row, index) => pointFor(row.count, index)).join(" ")} fill="none" stroke="#17202A" strokeWidth="3" strokeLinejoin="round" />{data.trend.map((row, index) => <circle key={row.period} cx={pointFor(row.count, index).split(",")[0]} cy={pointFor(row.count, index).split(",")[1]} r="3.5" fill="#17202A"><title>{row.period}: {row.count} complaints</title></circle>)}{series.map((item, seriesIndex) => <polyline key={item.name} points={periods.map((currentPeriod, index) => { const row = item.values.find((value) => value.period === currentPeriod); return pointFor(row?.count ?? 0, index); }).join(" ")} fill="none" stroke={SERIES_COLORS[seriesIndex]} strokeWidth="2" strokeLinejoin="round" strokeDasharray="5 3" />)}</svg><div className="flex justify-between gap-2 px-2 text-[10px] text-[#87919B]"><span>{periods[0]}</span><span>{periods[Math.floor(periods.length / 2)]}</span><span>{periods.at(-1)}</span></div></div>
               <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs"> <span className="inline-flex items-center gap-1 font-semibold text-[#17202A]"><span className="h-2.5 w-2.5 rounded-full bg-[#17202A]" />All complaints</span>{series.map((item, index) => <span key={item.name} className="inline-flex items-center gap-1 text-[#52606D]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SERIES_COLORS[index] }} />{item.name}</span>)}</div>
            </>
         )}
      </section>
   );
};

export default ComplaintTrendAnalytics;
