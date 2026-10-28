import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

import User from "../model/user.model.js";
import Department from "../model/department.model.js";
import Complaint from "../model/complaint.model.js";
import ComplaintTimeline from "../model/complaintTimeline.model.js";
import ComplaintSupport from "../model/complaintSupport.model.js";
import IncidentCluster from "../model/incidentCluster.model.js";
import IncidentMessage from "../model/incidentMessage.model.js";
import Notification from "../model/notification.model.js";

import { seedDepartments } from "../config/seed.js";
import { scoreComplaintPriority } from "../service/priorityScoring.service.js";
import { getSlaHours, calculateResolutionDeadline } from "../service/sla.service.js";
import { upsertIncidentCluster } from "../service/incidentIntelligence.service.js";
import { config } from "../config/config.js";

/**
 * Seeded PRNG (Mulberry32) for 100% reproducible demo data.
 */
export function createPrng(seed = 42) {
   let s = seed >>> 0;
   return function next() {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
   };
}

// 12 Chennai-area geographical centers [lng, lat]
export const CHENNAI_LOCATIONS = [
   { name: "VIT Chennai / Kelambakkam", coords: [80.1534, 12.8406], address: "Kelambakkam - Vandalur Road, near VIT Chennai" },
   { name: "Perungalathur", coords: [80.0934, 12.9056], address: "GST Road, near Perungalathur Bus Stand" },
   { name: "Medavakkam", coords: [80.1917, 12.9193], address: "Velachery Main Road, Medavakkam Junction" },
   { name: "Guindy", coords: [80.2184, 13.0067], address: "Guindy Industrial Estate / Metro Station" },
   { name: "Velachery", coords: [80.2206, 12.9756], address: "100 Feet Bypass Road, Velachery" },
   { name: "Tambaram", coords: [80.1200, 12.9249], address: "Near Tambaram Sanatorium Railway Station" },
   { name: "Chromepet", coords: [80.1415, 12.9516], address: "Radha Nagar Main Road, Chromepet" },
   { name: "Sholinganallur", coords: [80.2281, 12.8996], address: "OMR Junction, Sholinganallur" },
   { name: "Thiruvanmiyur", coords: [80.2584, 12.9830], address: "East Coast Road (ECR), Thiruvanmiyur" },
   { name: "Adyar", coords: [80.2565, 13.0012], address: "Lattice Bridge Road, Adyar" },
   { name: "T. Nagar", coords: [80.2337, 13.0418], address: "Usman Road, T. Nagar" },
   { name: "Anna Nagar", coords: [80.2117, 13.0850], address: "2nd Avenue, Anna Nagar Roundtana" },
];

export const CATEGORIES = [
   "Roads & Transport",
   "Waste & Cleanliness",
   "Water & Utilities",
   "Street Infrastructure",
   "Drainage & Flooding",
];

// Department mapping
export const CATEGORY_DEPT_CODE = {
   "Roads & Transport": "PUBLIC_WORKS",
   "Waste & Cleanliness": "SANITATION",
   "Water & Utilities": "WATER_SUPPLY",
   "Street Infrastructure": "ELECTRICAL",
   "Drainage & Flooding": "DRAINAGE",
};

// 11 Near-duplicate cluster seeds
const CLUSTER_SEEDS = [
   {
      category: "Roads & Transport",
      locationIdx: 3, // Guindy
      complaints: [
         { title: "Deep crater and pothole near Guindy metro", desc: "Huge deep pothole right on main road, romba dangerous for two-wheelers in evening rush hour." },
         { title: "Severe pothole hazard at Guindy metro station", desc: "Massive crater on road surface near metro pillar. Vehicles swerving sharply to avoid accident." },
         { title: "Damaged road with deep pothole near Guindy", desc: "Road surface completely broken with dangerous pothole. Two bikes already skidded today." },
      ],
   },
   {
      category: "Waste & Cleanliness",
      locationIdx: 4, // Velachery
      complaints: [
         { title: "Overflowing dumper bin on bypass road", desc: "Garbage bin full-ah overflow aagudhu, stray dogs tearing waste packets onto pavement." },
         { title: "Huge garbage accumulation near Velachery bypass", desc: "Public waste bin overflowing with rotting trash, uncollected for 4 days, unbearable stench." },
         { title: "Uncollected garbage spilling on Velachery road", desc: "Dumped trash scattered across sidewalk near tea shop, full plastic waste and animal menace." },
         { title: "Trash bin overflowing near Velachery signal", desc: "Garbage scattered everywhere around public bin, obstructing pedestrians completely." },
      ],
   },
   {
      category: "Water & Utilities",
      locationIdx: 0, // VIT Chennai
      complaints: [
         { title: "Drinking water pipeline leak on Kelambakkam road", desc: "Major water pipeline burst, fresh drinking water wasting continuously on road surface." },
         { title: "Fresh water pipe burst near VIT entrance", desc: "Main water supply pipeline leaking heavily, drinking water flowing like stream on roadside." },
      ],
   },
   {
      category: "Drainage & Flooding",
      locationIdx: 1, // Perungalathur
      complaints: [
         { title: "Clogged stormwater drain causing flood on GST road", desc: "Drain blocked with plastic waste and mud. Small rain causes knee-deep stagnant waterlogging." },
         { title: "Severe waterlogging due to blocked culvert", desc: "Stormwater cannot drain, dirty water backed up on GST service road near Perungalathur." },
         { title: "Drain overflow and inundation near bus stop", desc: "Clogged drainage channel overflowing with black water, pedestrians unable to reach bus shelter." },
      ],
   },
   {
      category: "Street Infrastructure",
      locationIdx: 2, // Medavakkam
      complaints: [
         { title: "Fallen tree branch hanging over live electric wire", desc: "Heavy tree bough cracked and resting on overhead power cable, sparking seen during wind." },
         { title: "Dangerous tree branch touching electrical power lines", desc: "Large bough snapped on Medavakkam main road, pressing against high-tension wire." },
         { title: "Fallen bough endangering power pole lines", desc: "Tree fall on electrical wire near junction, danger of live wire snapping any moment." },
      ],
   },
   {
      category: "Roads & Transport",
      locationIdx: 5, // Tambaram
      complaints: [
         { title: "Damaged asphalt and rutting near Sanatorium station", desc: "Road surface eroded after rain, large uneven patches causing extreme vehicle vibration." },
         { title: "Broken bitumen and road surface damage at Tambaram", desc: "Asphalt washed out with deep rutting near railway crossing, traffic moving at snail speed." },
      ],
   },
   {
      category: "Street Infrastructure",
      locationIdx: 6, // Chromepet
      complaints: [
         { title: "Broken footpath paver blocks and missing slabs", desc: "Pedestrian walkway tiles broken and loose. Senior citizens tripping and falling down." },
         { title: "Damaged sidewalk paver slabs near Chromepet", desc: "Footpath pavers damaged with missing covers, forcing school kids to walk on busy road." },
         { title: "Loose paver blocks and pothole on sidewalk", desc: "Pedestrian pavement broken up completely outside commercial complex on main road." },
      ],
   },
   {
      category: "Roads & Transport",
      locationIdx: 7, // Sholinganallur
      complaints: [
         { title: "Traffic signal failure at OMR junction", desc: "Traffic light stuck on blinking amber for two days, massive vehicle pileup during IT shift time." },
         { title: "Signal light controller not working on OMR", desc: "Four-way traffic signal failed, no traffic police, vehicles crossing dangerously." },
      ],
   },
   {
      category: "Water & Utilities",
      locationIdx: 8, // Thiruvanmiyur
      complaints: [
         { title: "Water main leak near ECR signal", desc: "Underground drinking water main broken, water bubbling up through road tarmac." },
         { title: "Subsurface pipe leak flooding road in Thiruvanmiyur", desc: "Fresh water pipeline valve leaking continuously, water pressure low in nearby houses." },
         { title: "Potable water pipeline burst along ECR", desc: "Drinking water pipe leak wasting thousand liters of water right near bus stop." },
      ],
   },
   {
      category: "Waste & Cleanliness",
      locationIdx: 9, // Adyar
      complaints: [
         { title: "Construction debris dumped on sidewalk", desc: "Broken concrete and plaster scrap illegally dumped on pedestrian path near bus depot." },
         { title: "Construction scrap blocking pedestrian path in Adyar", desc: "Dumped cement debris and gravel left on walkway, totally blocking footpath." },
      ],
   },
   {
      category: "Drainage & Flooding",
      locationIdx: 10, // T. Nagar
      complaints: [
         { title: "Deep trench cave in near storm drain in T. Nagar", desc: "Ground collapse and subsidence around manhole cover on Usman road, dangerous sinkhole forming." },
         { title: "Road cave in and subsidence near drain cover", desc: "Trench caved in after pipe repair, deep cavity next to manhole posing severe hazard." },
         { title: "Sinkhole forming near storm drain chamber", desc: "Road surface subsiding rapidly near drainage culvert on busy market street." },
      ],
   },
];

// Single complaint text templates by category
const SINGLE_TEMPLATES = {
   "Roads & Transport": [
      { title: "Damaged median kerb stones on bypass", desc: "Median concrete divider blocks dislodged after vehicle collision, obstructing right lane." },
      { title: "Road surface peeling off after road relaying", desc: "Bitumen layer coming off within two weeks of laying, loose gravel flying onto vehicles." },
      { title: "Dangerous sharp dip in road near culvert", desc: "Sunken asphalt patch creates sudden vehicle jolt at 40 km/h, needs urgent resurfacing." },
      { title: "Broken road speed breaker without paint markers", desc: "Concrete speed bump has chipped off with iron rods exposed, no reflective yellow paint." },
   ],
   "Waste & Cleanliness": [
      { title: "Dead animal carcass on roadside", desc: "Stray dog carcass lying on side of road for 2 days, foul smell spreading to shops." },
      { title: "Commercial waste dumped near residential gate", desc: "Hotel food waste packets dumped in open plot, creating intense mosquito breeding." },
      { title: "Plastic debris piled up in vacant public ground", desc: "Single-use plastics and packaging waste accumulated, burning smell at night." },
      { title: "Market vegetable waste uncollected since weekend", desc: "Rotting vegetable residue from daily market dumped along sidewalk." },
   ],
   "Water & Utilities": [
      { title: "Contaminated brown drinking water in municipal supply", desc: "Drinking water tap supply coming with brown mud color and foul sewer smell since yesterday." },
      { title: "Low water supply pressure in neighborhood", desc: "Municipal tap water flowing with very low pressure, water not reaching first floor tanks." },
      { title: "Damaged public water fountain tap", desc: "Public drinking water post valve broken, water running non-stop onto footpath." },
      { title: "Broken water valve box on street corner", desc: "Cast iron valve chamber cover stolen, open hole on roadside endangering cyclists." },
   ],
   "Street Infrastructure": [
      { title: "Streetlight not glowing on dark stretch for 5 days", desc: "Three consecutive sodium lamps failed, complete pitch darkness causing safety scare." },
      { title: "Damaged light pole leaning towards road", desc: "Metal street lamp pole hit by truck, leaning at 45 degree angle towards roadway." },
      { title: "Sparking fuse box on electric post", desc: "Exposed distribution fuse box sparking with loud sound during light drizzle." },
      { title: "Broken bus shelter roof sheets", desc: "Tin roof sheets ripped off in storm, commuters standing under hot sun and rain." },
   ],
   "Drainage & Flooding": [
      { title: "Open manhole without safety lid near school", desc: "Heavy iron manhole cover missing, deep sewer chamber open right near elementary school." },
      { title: "Sewer overflow bubbling from inspection chamber", desc: "Black sewage water overflowing onto residential street, spreading foul odor and flies." },
      { title: "Blocked roadside gutter with standing wastewater", desc: "Concrete gutter completely filled with plastic cups and silt, wastewater stagnating." },
      { title: "Broken drain slab collapsed under vehicle", desc: "Precast drain slab caved in when delivery van drove over it, leaving 3-foot hole." },
   ],
};

/**
 * Pure deterministic data generator.
 */
export function generateDemoDataset({ seed = 42, baseTime = 1760000000000 } = {}) {
   const rand = createPrng(seed);

   // Users
   const admin = {
      fullname: "CivicFlow System Admin",
      email: "admin@demo.civicflow.local",
      role: "admin",
      contact: "9876500001",
      passwordHash: "Demo@12345",
   };

   const staff = [
      {
         fullname: "K. Raman (Roads Staff)",
         email: "staff.roads@demo.civicflow.local",
         role: "dept_staff",
         departmentCode: "PUBLIC_WORKS",
         contact: "9876500002",
         passwordHash: "Demo@12345",
      },
      {
         fullname: "M. Saravanan (Water Staff)",
         email: "staff.water@demo.civicflow.local",
         role: "dept_staff",
         departmentCode: "WATER_SUPPLY",
         contact: "9876500003",
         passwordHash: "Demo@12345",
      },
      {
         fullname: "S. Priya (Sanitation Staff)",
         email: "staff.sanitation@demo.civicflow.local",
         role: "dept_staff",
         departmentCode: "SANITATION",
         contact: "9876500004",
         passwordHash: "Demo@12345",
      },
   ];

   const citizenNames = [
      "Anitha R.", "Karthik S.", "Deepa V.", "Rajesh K.", "Meena N.",
      "Suresh B.", "Lakshmi T.", "Vignesh M.", "Revathi P.", "Dinesh C."
   ];
   const citizens = citizenNames.map((name, i) => ({
      fullname: name,
      email: `citizen${i + 1}@demo.civicflow.local`,
      role: "citizen",
      contact: `987650001${i}`,
      passwordHash: "Demo@12345",
   }));

   // 120 complaints plan:
   // - 30 clustered complaints across 11 clusters
   // - 90 individual complaints across 12 locations
   // Status breakdown targets (exact 120):
   // - submitted: 18 (15%)
   // - assigned: 18 (15%)
   // - in_progress: 24 (20%)
   // - resolved: 24 (20%)
   // - closed: 18 (15%)
   // - rejected_reopened: 6 (5%)
   // - escalated: 12 (10%)
   const statusQueue = [];
   for (let i = 0; i < 18; i++) statusQueue.push("submitted");
   for (let i = 0; i < 18; i++) statusQueue.push("assigned");
   for (let i = 0; i < 24; i++) statusQueue.push("in_progress");
   for (let i = 0; i < 24; i++) statusQueue.push("resolved");
   for (let i = 0; i < 18; i++) statusQueue.push("closed");
   for (let i = 0; i < 6; i++) statusQueue.push("rejected_reopened");
   for (let i = 0; i < 12; i++) statusQueue.push("escalated");

   // Fisher-Yates shuffle with seeded PRNG
   for (let i = statusQueue.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [statusQueue[i], statusQueue[j]] = [statusQueue[j], statusQueue[i]];
   }

   const complaints = [];
   let complaintIndex = 0;
   const now = baseTime;

   // 1. Generate 30 clustered complaints
   CLUSTER_SEEDS.forEach((cluster, cIdx) => {
      const loc = CHENNAI_LOCATIONS[cluster.locationIdx];
      // cluster base time: within last 10 to 45 days
      const clusterBaseDaysAgo = 10 + (cIdx * 3) % 35;
      const clusterBaseTime = now - clusterBaseDaysAgo * 24 * 3600000;

      cluster.complaints.forEach((item, itemIdx) => {
         const plannedStatus = statusQueue[complaintIndex++];
         // small coordinate jitter within ~50 meters: 0.0004 deg ~= 44m
         const jitterLng = (rand() - 0.5) * 0.0006;
         const jitterLat = (rand() - 0.5) * 0.0006;
         const coordinates = [
            Number((loc.coords[0] + jitterLng).toFixed(6)),
            Number((loc.coords[1] + jitterLat).toFixed(6)),
         ];

         // time jitter within 48 hours
         const timeJitterHours = itemIdx * 8 + Math.floor(rand() * 12);
         const createdAt = new Date(clusterBaseTime + timeJitterHours * 3600000);

         const citizenIdx = (cIdx + itemIdx) % citizens.length;

         complaints.push({
            tempId: `C-${complaintIndex}`,
            clusterGroup: cIdx + 1,
            title: item.title,
            description: item.desc,
            category: cluster.category,
            departmentCode: CATEGORY_DEPT_CODE[cluster.category],
            location: { type: "Point", coordinates },
            address: `${loc.address} (Near Landmark ${itemIdx + 1})`,
            citizenEmail: citizens[citizenIdx].email,
            plannedStatus,
            createdAt,
         });
      });
   });

   // 2. Generate 90 individual complaints
   for (let i = 0; i < 90; i++) {
      const plannedStatus = statusQueue[complaintIndex++];
      const category = CATEGORIES[i % CATEGORIES.length];
      const loc = CHENNAI_LOCATIONS[(i + 3) % CHENNAI_LOCATIONS.length];
      const templates = SINGLE_TEMPLATES[category];
      const tmpl = templates[i % templates.length];

      // Coordinate jitter: 0.008 deg ~= 800m
      const jitterLng = (rand() - 0.5) * 0.012;
      const jitterLat = (rand() - 0.5) * 0.012;
      const coordinates = [
         Number((loc.coords[0] + jitterLng).toFixed(6)),
         Number((loc.coords[1] + jitterLat).toFixed(6)),
      ];

      // Created between 5 and 58 days ago
      const daysAgo = 5 + Math.floor(rand() * 52);
      const createdAt = new Date(now - daysAgo * 24 * 3600000);

      const citizenIdx = (i + 4) % citizens.length;

      complaints.push({
         tempId: `C-${complaintIndex}`,
         clusterGroup: null,
         title: `${tmpl.title} - ${loc.name}`,
         description: tmpl.desc,
         category,
         departmentCode: CATEGORY_DEPT_CODE[category],
         location: { type: "Point", coordinates },
         address: `${loc.address}, Plot ${10 + (i % 80)}`,
         citizenEmail: citizens[citizenIdx].email,
         plannedStatus,
         createdAt,
      });
   }

   return { admin, staff, citizens, complaints };
}

/**
 * Seeder execution in MongoDB.
 */
export async function seedDemoDatabase({
   mongoUri = config.MONGO_URI,
   allowRemote = false,
   seed = 42,
   verbose = true,
} = {}) {
   // Safety checks
   if (process.env.NODE_ENV === "production") {
      throw new Error("ABORT: Refusing to seed demo data in NODE_ENV === 'production'.");
   }

   const isLocal = mongoUri.includes("localhost") || mongoUri.includes("127.0.0.1");
   if (!isLocal) {
      const hasRemoteFlag = allowRemote || process.argv.includes("--allow-remote");
      const hasRemoteEnv = process.env.DEMO_SEED_ALLOW_REMOTE === "1";
      if (!hasRemoteFlag || !hasRemoteEnv) {
         throw new Error("ABORT: Remote database detected. Requires CLI flag '--allow-remote' AND env 'DEMO_SEED_ALLOW_REMOTE=1'.");
      }
   }

   if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
   }

   // 1. Ensure initial departments exist
   await seedDepartments();
   const departments = await Department.find({});
   const deptByCode = new Map(departments.map((d) => [d.code, d]));

   // 2. Clean previous demo records (idempotent)
   const prevDemoUsers = await User.find({ email: /@demo\.civicflow\.local$/i });
   const prevUserIds = prevDemoUsers.map((u) => u._id);

   if (prevUserIds.length > 0) {
      const prevComplaints = await Complaint.find({ citizenId: { $in: prevUserIds } });
      const prevComplaintIds = prevComplaints.map((c) => c._id);

      await Promise.all([
         ComplaintSupport.deleteMany({ $or: [{ citizenId: { $in: prevUserIds } }, { complaintId: { $in: prevComplaintIds } }] }),
         ComplaintTimeline.deleteMany({ complaintId: { $in: prevComplaintIds } }),
         Notification.deleteMany({ $or: [{ recipientId: { $in: prevUserIds } }, { complaintId: { $in: prevComplaintIds } }] }),
         IncidentMessage.deleteMany({ senderId: { $in: prevUserIds } }),
         IncidentCluster.deleteMany({ complaintIds: { $in: prevComplaintIds } }),
         Complaint.deleteMany({ _id: { $in: prevComplaintIds } }),
         User.deleteMany({ _id: { $in: prevUserIds } }),
      ]);
   }

   // 3. Generate raw deterministic records
   const { admin: rawAdmin, staff: rawStaff, citizens: rawCitizens, complaints: rawComplaints } = generateDemoDataset({ seed });

   // 4. Create Users
   const adminUser = await User.create(rawAdmin);

   const staffUsers = [];
   for (const s of rawStaff) {
      const dept = deptByCode.get(s.departmentCode);
      const user = await User.create({
         fullname: s.fullname,
         email: s.email,
         role: s.role,
         contact: s.contact,
         passwordHash: s.passwordHash,
         departmentId: dept?._id ?? null,
      });
      staffUsers.push(user);
   }

   const citizenUsers = await User.create(rawCitizens);
   const userByEmail = new Map();
   userByEmail.set(adminUser.email, adminUser);
   staffUsers.forEach((s) => userByEmail.set(s.email, s));
   citizenUsers.forEach((c) => userByEmail.set(c.email, c));

   // Staff by department
   const staffByDeptCode = new Map();
   staffUsers.forEach((s) => {
      const dept = departments.find((d) => String(d._id) === String(s.departmentId));
      if (dept) staffByDeptCode.set(dept.code, s);
   });

   // 5. Create Complaints
   const createdComplaints = [];
   const resolutionProofMedia = [
      {
         fileId: `res-${randomUUID().slice(0, 8)}`,
         url: "https://placehold.co/600x400?text=Resolution+Proof",
         type: "image/jpeg",
         metadata: { originalName: "proof.jpg", mimeType: "image/jpeg", size: 102400 },
      },
   ];

   for (const raw of rawComplaints) {
      const citizen = userByEmail.get(raw.citizenEmail);
      const dept = deptByCode.get(raw.departmentCode);
      const assignedStaff = staffByDeptCode.get(raw.departmentCode);
      const priority = scoreComplaintPriority({ title: raw.title, description: raw.description, category: raw.category });
      const slaDuration = getSlaHours(priority);

      let status = "submitted";
      let escalated = false;
      let escalatedAt = null;
      let escalationReason = null;
      let resolutionVerificationStatus = null;
      let resolutionVerifiedAt = null;
      let resolutionVerificationRemark = null;
      let resolutionDescription = null;
      let resolutionMedia = [];

      // Calculate deadline relative to raw.createdAt
      const resolutionDeadline = calculateResolutionDeadline(priority, raw.createdAt);

      switch (raw.plannedStatus) {
         case "submitted":
            status = "submitted";
            break;
         case "assigned":
            status = "assigned";
            break;
         case "in_progress":
            status = "in_progress";
            break;
         case "resolved":
            status = "resolved";
            resolutionVerificationStatus = "pending";
            resolutionDescription = "Remediation completed by field inspector. Area restored and verified.";
            resolutionMedia = resolutionProofMedia;
            break;
         case "closed":
            status = "closed";
            resolutionVerificationStatus = "confirmed";
            resolutionVerifiedAt = new Date(raw.createdAt.getTime() + (slaDuration * 0.7) * 3600000);
            resolutionDescription = "Work completed and citizen verified on-site resolution.";
            resolutionMedia = resolutionProofMedia;
            break;
         case "rejected_reopened":
            // 5% rejected-then-reopened
            status = "in_review";
            resolutionVerificationStatus = "rejected";
            resolutionVerificationRemark = "Pothole was only partially patched with loose stones; crater reappeared next day. Citizen requested full recarpeting.";
            break;
         case "escalated":
            status = "assigned";
            escalated = true;
            escalatedAt = new Date(raw.createdAt.getTime() + (slaDuration + 12) * 3600000);
            escalationReason = "Resolution deadline exceeded without departmental closure";
            break;
      }

      const complaint = new Complaint({
         complaintId: `CF-DEMO-${randomUUID().slice(0, 8).toUpperCase()}`,
         citizenId: citizen._id,
         title: raw.title,
         description: raw.description,
         category: raw.category,
         location: raw.location,
         address: raw.address,
         status,
         priority,
         slaDurationHours: slaDuration,
         resolutionDeadline,
         escalated,
         escalatedAt,
         escalationReason,
         assignedDepartment: dept?._id ?? null,
         assignedStaff: (status !== "submitted") ? (assignedStaff?._id ?? null) : null,
         assignedAt: (status !== "submitted") ? new Date(raw.createdAt.getTime() + 2 * 3600000) : null,
         resolutionVerificationStatus,
         resolutionVerifiedAt,
         resolutionVerificationRemark,
         resolutionDescription,
         resolutionMedia,
         supportCount: 0,
         createdAt: raw.createdAt,
         updatedAt: raw.createdAt,
      });

      // Save bypassing pre-validate SLA override to preserve historical dates
      await complaint.save({ validateBeforeSave: false });
      createdComplaints.push({ complaint, raw });

      // Create Timelines
      const timelineEntries = [
         {
            complaintId: complaint._id,
            action: "created",
            performedBy: citizen._id,
            newStatus: "submitted",
            remark: "Complaint reported by citizen",
            timestamp: raw.createdAt,
         },
      ];

      if (status !== "submitted" && assignedStaff) {
         timelineEntries.push({
            complaintId: complaint._id,
            action: "assigned",
            performedBy: adminUser._id,
            previousStatus: "submitted",
            newStatus: "assigned",
            remark: `Assigned to ${dept?.fullname || "Department"}`,
            timestamp: new Date(raw.createdAt.getTime() + 2 * 3600000),
         });
      }

      if (["in_progress", "resolved", "closed"].includes(status)) {
         timelineEntries.push({
            complaintId: complaint._id,
            action: "status_changed",
            performedBy: assignedStaff?._id ?? adminUser._id,
            previousStatus: "assigned",
            newStatus: "in_progress",
            remark: "Crew dispatched to location",
            timestamp: new Date(raw.createdAt.getTime() + 6 * 3600000),
         });
      }

      if (["resolved", "closed"].includes(status) || resolutionVerificationStatus === "rejected") {
         timelineEntries.push({
            complaintId: complaint._id,
            action: "resolved",
            performedBy: assignedStaff?._id ?? adminUser._id,
            previousStatus: "in_progress",
            newStatus: "resolved",
            remark: "Repair work executed",
            timestamp: new Date(raw.createdAt.getTime() + 24 * 3600000),
         });
      }

      if (status === "closed") {
         timelineEntries.push({
            complaintId: complaint._id,
            action: "resolution_confirmed",
            performedBy: citizen._id,
            previousStatus: "resolved",
            newStatus: "closed",
            remark: "Citizen verified and accepted resolution",
            timestamp: resolutionVerifiedAt,
         });
      } else if (resolutionVerificationStatus === "rejected") {
         timelineEntries.push({
            complaintId: complaint._id,
            action: "resolution_rejected",
            performedBy: citizen._id,
            previousStatus: "resolved",
            newStatus: "in_review",
            remark: resolutionVerificationRemark,
            timestamp: new Date(raw.createdAt.getTime() + 28 * 3600000),
         });
      }

      await ComplaintTimeline.insertMany(timelineEntries);

      // Notification for resolved pending verification
      if (status === "resolved" && resolutionVerificationStatus === "pending") {
         await Notification.create({
            recipientId: citizen._id,
            complaintId: complaint._id,
            type: "resolution_verification",
            title: "Complaint Resolved — Verification Needed",
            message: `Your complaint "${complaint.title}" has been marked resolved. Please confirm resolution.`,
            createdAt: new Date(raw.createdAt.getTime() + 25 * 3600000),
         });
      }
   }

   // 6. Add supports to about 35 complaints
   let supportCountCreated = 0;
   for (let i = 0; i < 35; i++) {
      const target = createdComplaints[i * 3 % createdComplaints.length].complaint;
      const supporter = citizenUsers[(i + 1) % citizenUsers.length];
      if (String(target.citizenId) !== String(supporter._id)) {
         await ComplaintSupport.create({
            complaintId: target._id,
            citizenId: supporter._id,
            createdAt: new Date(target.createdAt.getTime() + 3600000),
         });
         await Complaint.updateOne({ _id: target._id }, { $inc: { supportCount: 1 } });
         supportCountCreated++;
      }
   }

   // 7. Genuine Cluster Grouping via real upsertIncidentCluster service
   let clustersCreated = 0;
   const clusteredComplaints = createdComplaints.filter((c) => c.raw.clusterGroup != null);
   for (const item of clusteredComplaints) {
      try {
         const res = await upsertIncidentCluster(item.complaint);
         if (res?.incident) {
            clustersCreated++;
         }
      } catch (err) {
         // Fallback if clustering service has spatial boundary issue
      }
   }

   // Collection counts verification
   const finalUsers = await User.countDocuments({ email: /@demo\.civicflow\.local$/i });
   const finalComplaints = await Complaint.countDocuments({ citizenId: { $in: [...citizenUsers.map((c) => c._id), adminUser._id] } });
   const finalTimelines = await ComplaintTimeline.countDocuments({});
   const finalSupports = await ComplaintSupport.countDocuments({});
   const finalClusters = await IncidentCluster.countDocuments({});
   const finalNotifications = await Notification.countDocuments({});

   const statusCounts = await Complaint.aggregate([
      { $match: { citizenId: { $in: citizenUsers.map((c) => c._id) } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
   ]);

   const statusMap = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));

   const summary = {
      collections: {
         users: finalUsers,
         complaints: finalComplaints,
         timelines: finalTimelines,
         supports: finalSupports,
         clusters: finalClusters,
         notifications: finalNotifications,
      },
      statusDistribution: statusMap,
   };

   if (verbose) {
      console.log("\n==========================================");
      console.log("   CIVICFLOW DEMO SEEDING COMPLETED");
      console.log("==========================================");
      console.log(`Users Created:         ${finalUsers} (1 Admin, 3 Staff, 10 Citizens)`);
      console.log(`Complaints Created:    ${finalComplaints}`);
      console.log(`Status Distribution:   ${JSON.stringify(statusMap)}`);
      console.log(`Incident Clusters:     ${finalClusters}`);
      console.log(`Timeline Records:      ${finalTimelines}`);
      console.log(`Citizen Supports:      ${finalSupports}`);
      console.log(`Verification Notices:  ${finalNotifications}`);
      console.log("==========================================\n");
   }

   return summary;
}

// Standalone execution
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
   seedDemoDatabase()
      .then(() => process.exit(0))
      .catch((err) => {
         console.error("Demo seeding failed:", err);
         process.exit(1);
      });
}
