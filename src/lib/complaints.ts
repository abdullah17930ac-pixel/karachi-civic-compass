// CivicConnect demo data layer. All complaints and statistics here are
// DEMONSTRATION DATA ONLY — no government system is connected.

export const STATUSES = ["Submitted", "Under Review", "In Progress", "Resolved"] as const;
export type Status = (typeof STATUSES)[number];

export const CATEGORY_IDS = [
  "roads",
  "garbage",
  "streetlights",
  "water",
  "drainage",
  "parks",
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const DEPARTMENTS = [
  "KMC Roads & Infrastructure",
  "Sindh Solid Waste Management",
  "K-Electric Streetlight Unit",
  "KW&SC Water Supply",
  "KW&SC Sewerage & Drainage",
  "KMC Parks & Horticulture",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const DEFAULT_DEPARTMENT: Record<CategoryId, Department> = {
  roads: "KMC Roads & Infrastructure",
  garbage: "Sindh Solid Waste Management",
  streetlights: "K-Electric Streetlight Unit",
  water: "KW&SC Water Supply",
  drainage: "KW&SC Sewerage & Drainage",
  parks: "KMC Parks & Horticulture",
};

export const KARACHI_AREAS = [
  "Clifton",
  "DHA Phase 6",
  "Gulshan-e-Iqbal",
  "Gulistan-e-Jauhar",
  "North Nazimabad",
  "Nazimabad",
  "Federal B Area",
  "PECHS",
  "Saddar",
  "Korangi",
  "Malir",
  "Lyari",
  "Shah Faisal Colony",
  "Orangi Town",
] as const;

export interface TimelineEntry {
  status: Status;
  date: string; // ISO
  note: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  area: string;
  address: string;
  status: Status;
  department: Department | null;
  createdAt: string;
  updatedAt: string;
  citizen: string;
  mine: boolean;
  photo?: string;
  timeline: TimelineEntry[];
}

export const DEMO_CITIZEN = "Ayesha Khan";

const t = (status: Status, date: string, note: string): TimelineEntry => ({ status, date, note });

const NOTES: Record<Status, string> = {
  Submitted: "Complaint received and logged in the system.",
  "Under Review": "Verified by the area coordinator and forwarded to the department.",
  "In Progress": "Field team dispatched and work has started on site.",
  Resolved: "Issue resolved and closed after on-site verification.",
};

export const SEED_COMPLAINTS: Complaint[] = [
  {
    id: "CC-KHI-482913",
    title: "Large pothole on University Road near NIPA Chowrangi",
    description:
      "A deep pothole has formed in the left lane causing motorbikes to swerve dangerously. It fills with water after rain and has already caused two minor accidents this week.",
    category: "roads",
    area: "Gulshan-e-Iqbal",
    address: "University Road, near NIPA Chowrangi",
    status: "In Progress",
    department: "KMC Roads & Infrastructure",
    createdAt: "2026-10-28T09:15:00.000Z",
    updatedAt: "2026-11-02T11:40:00.000Z",
    citizen: DEMO_CITIZEN,
    mine: true,
    timeline: [
      t("Submitted", "2026-10-28T09:15:00.000Z", NOTES.Submitted),
      t("Under Review", "2026-10-29T14:20:00.000Z", NOTES["Under Review"]),
      t("In Progress", "2026-11-02T11:40:00.000Z", NOTES["In Progress"]),
    ],
  },
  {
    id: "CC-KHI-375120",
    title: "Garbage not collected for 5 days in Block 13-D",
    description:
      "Garbage has been piling up next to the community park. Stray dogs are spreading waste on the street and the smell is unbearable for residents.",
    category: "garbage",
    area: "Gulshan-e-Iqbal",
    address: "Block 13-D, near Al-Huda Park",
    status: "Resolved",
    department: "Sindh Solid Waste Management",
    createdAt: "2026-10-20T07:30:00.000Z",
    updatedAt: "2026-10-24T16:05:00.000Z",
    citizen: DEMO_CITIZEN,
    mine: true,
    timeline: [
      t("Submitted", "2026-10-20T07:30:00.000Z", NOTES.Submitted),
      t("Under Review", "2026-10-21T10:00:00.000Z", NOTES["Under Review"]),
      t("In Progress", "2026-10-23T08:45:00.000Z", NOTES["In Progress"]),
      t("Resolved", "2026-10-24T16:05:00.000Z", NOTES.Resolved),
    ],
  },
  {
    id: "CC-KHI-219874",
    title: "Streetlights off on Khayaban-e-Ittehad",
    description:
      "Around 8 consecutive streetlights have been non-functional for two weeks, making the road unsafe for pedestrians at night.",
    category: "streetlights",
    area: "DHA Phase 6",
    address: "Khayaban-e-Ittehad, between Lane 4 and Lane 7",
    status: "Under Review",
    department: "K-Electric Streetlight Unit",
    createdAt: "2026-11-01T18:50:00.000Z",
    updatedAt: "2026-11-02T09:10:00.000Z",
    citizen: DEMO_CITIZEN,
    mine: true,
    timeline: [
      t("Submitted", "2026-11-01T18:50:00.000Z", NOTES.Submitted),
      t("Under Review", "2026-11-02T09:10:00.000Z", NOTES["Under Review"]),
    ],
  },
  {
    id: "CC-KHI-640357",
    title: "Water pipeline leakage wasting clean water",
    description:
      "A main water line is leaking continuously at the corner of the street. Hundreds of litres are wasted daily while nearby homes get low pressure.",
    category: "water",
    area: "North Nazimabad",
    address: "Block H, near Hyderi Market",
    status: "Submitted",
    department: null,
    createdAt: "2026-11-04T06:25:00.000Z",
    updatedAt: "2026-11-04T06:25:00.000Z",
    citizen: DEMO_CITIZEN,
    mine: true,
    timeline: [t("Submitted", "2026-11-04T06:25:00.000Z", NOTES.Submitted)],
  },
  {
    id: "CC-KHI-503381",
    title: "Overflowing sewerage line near school gate",
    description:
      "Sewage water is overflowing onto the road in front of the government school. Children have to walk through dirty water every morning.",
    category: "drainage",
    area: "Lyari",
    address: "Chakiwara Road, near Govt. Boys School",
    status: "In Progress",
    department: "KW&SC Sewerage & Drainage",
    createdAt: "2026-10-30T08:00:00.000Z",
    updatedAt: "2026-11-03T13:30:00.000Z",
    citizen: "Bilal Ahmed",
    mine: false,
    timeline: [
      t("Submitted", "2026-10-30T08:00:00.000Z", NOTES.Submitted),
      t("Under Review", "2026-10-31T12:15:00.000Z", NOTES["Under Review"]),
      t("In Progress", "2026-11-03T13:30:00.000Z", NOTES["In Progress"]),
    ],
  },
  {
    id: "CC-KHI-118460",
    title: "Broken road divider on Shahrah-e-Faisal",
    description:
      "The concrete divider has broken pieces lying on the fast lane after an accident. It is a serious hazard for vehicles at night.",
    category: "roads",
    area: "Shah Faisal Colony",
    address: "Shahrah-e-Faisal, near Drigh Road Station",
    status: "Resolved",
    department: "KMC Roads & Infrastructure",
    createdAt: "2026-10-15T10:40:00.000Z",
    updatedAt: "2026-10-19T15:00:00.000Z",
    citizen: "Sana Malik",
    mine: false,
    timeline: [
      t("Submitted", "2026-10-15T10:40:00.000Z", NOTES.Submitted),
      t("Under Review", "2026-10-16T09:00:00.000Z", NOTES["Under Review"]),
      t("In Progress", "2026-10-17T11:20:00.000Z", NOTES["In Progress"]),
      t("Resolved", "2026-10-19T15:00:00.000Z", NOTES.Resolved),
    ],
  },
  {
    id: "CC-KHI-772041",
    title: "Illegal dumping site near Korangi Crossing",
    description:
      "An empty plot has turned into a dumping site. Waste is being burned regularly, causing smoke in nearby residential blocks.",
    category: "garbage",
    area: "Korangi",
    address: "Sector 31-B, near Korangi Crossing",
    status: "Under Review",
    department: "Sindh Solid Waste Management",
    createdAt: "2026-11-02T12:10:00.000Z",
    updatedAt: "2026-11-03T08:30:00.000Z",
    citizen: "Usman Raza",
    mine: false,
    timeline: [
      t("Submitted", "2026-11-02T12:10:00.000Z", NOTES.Submitted),
      t("Under Review", "2026-11-03T08:30:00.000Z", NOTES["Under Review"]),
    ],
  },
  {
    id: "CC-KHI-934502",
    title: "Blocked storm drain causing street flooding",
    description:
      "Plastic waste has blocked the storm drain. Even light rain causes knee-deep water on the main street of the block.",
    category: "drainage",
    area: "Federal B Area",
    address: "Block 16, Karimabad main street",
    status: "Submitted",
    department: null,
    createdAt: "2026-11-04T15:45:00.000Z",
    updatedAt: "2026-11-04T15:45:00.000Z",
    citizen: "Fatima Siddiqui",
    mine: false,
    timeline: [t("Submitted", "2026-11-04T15:45:00.000Z", NOTES.Submitted)],
  },
  {
    id: "CC-KHI-287719",
    title: "Park lights and swings damaged",
    description:
      "The children's play area has broken swings with sharp edges and all park lights are off after Maghrib.",
    category: "parks",
    area: "PECHS",
    address: "Block 2, Jheel Park",
    status: "In Progress",
    department: "KMC Parks & Horticulture",
    createdAt: "2026-10-25T16:20:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    citizen: "Hamza Qureshi",
    mine: false,
    timeline: [
      t("Submitted", "2026-10-25T16:20:00.000Z", NOTES.Submitted),
      t("Under Review", "2026-10-27T11:00:00.000Z", NOTES["Under Review"]),
      t("In Progress", "2026-11-01T10:00:00.000Z", NOTES["In Progress"]),
    ],
  },
  {
    id: "CC-KHI-655218",
    title: "No water supply for three days",
    description:
      "Our entire street has had no line water for three days. Residents are forced to buy expensive tanker water.",
    category: "water",
    area: "Gulistan-e-Jauhar",
    address: "Block 15, near Rabia City",
    status: "Resolved",
    department: "KW&SC Water Supply",
    createdAt: "2026-10-18T05:50:00.000Z",
    updatedAt: "2026-10-21T12:00:00.000Z",
    citizen: "Zainab Hussain",
    mine: false,
    timeline: [
      t("Submitted", "2026-10-18T05:50:00.000Z", NOTES.Submitted),
      t("Under Review", "2026-10-18T13:00:00.000Z", NOTES["Under Review"]),
      t("In Progress", "2026-10-19T09:30:00.000Z", NOTES["In Progress"]),
      t("Resolved", "2026-10-21T12:00:00.000Z", NOTES.Resolved),
    ],
  },
  {
    id: "CC-KHI-361947",
    title: "Faulty streetlight flickering all night",
    description:
      "A streetlight outside the mosque flickers constantly and sparks at times. It looks like a wiring fault that could be dangerous.",
    category: "streetlights",
    area: "Nazimabad",
    address: "Nazimabad No. 3, near Jamia Masjid",
    status: "Resolved",
    department: "K-Electric Streetlight Unit",
    createdAt: "2026-10-22T19:10:00.000Z",
    updatedAt: "2026-10-26T14:30:00.000Z",
    citizen: "Ali Hassan",
    mine: false,
    timeline: [
      t("Submitted", "2026-10-22T19:10:00.000Z", NOTES.Submitted),
      t("Under Review", "2026-10-23T10:00:00.000Z", NOTES["Under Review"]),
      t("In Progress", "2026-10-25T09:00:00.000Z", NOTES["In Progress"]),
      t("Resolved", "2026-10-26T14:30:00.000Z", NOTES.Resolved),
    ],
  },
  {
    id: "CC-KHI-809136",
    title: "Damaged footpath tiles outside Empress Market",
    description:
      "Footpath tiles are broken and uneven, making it hard for elderly people and shoppers to walk safely.",
    category: "roads",
    area: "Saddar",
    address: "Preedy Street, outside Empress Market",
    status: "Under Review",
    department: "KMC Roads & Infrastructure",
    createdAt: "2026-11-03T11:00:00.000Z",
    updatedAt: "2026-11-04T09:20:00.000Z",
    citizen: "Rehan Sheikh",
    mine: false,
    timeline: [
      t("Submitted", "2026-11-03T11:00:00.000Z", NOTES.Submitted),
      t("Under Review", "2026-11-04T09:20:00.000Z", NOTES["Under Review"]),
    ],
  },
  {
    id: "CC-KHI-140285",
    title: "Garbage bins overflowing at Malir Halt",
    description:
      "Public bins near the bus stop overflow every evening and waste spills onto the road.",
    category: "garbage",
    area: "Malir",
    address: "Malir Halt bus stop, National Highway",
    status: "Submitted",
    department: null,
    createdAt: "2026-11-05T07:05:00.000Z",
    updatedAt: "2026-11-05T07:05:00.000Z",
    citizen: "Kashif Mehmood",
    mine: false,
    timeline: [t("Submitted", "2026-11-05T07:05:00.000Z", NOTES.Submitted)],
  },
  {
    id: "CC-KHI-596603",
    title: "Clifton seaview road drain overflowing",
    description:
      "Drain water overflows onto the walking track near Seaview, making the area dirty for families visiting the beach.",
    category: "drainage",
    area: "Clifton",
    address: "Seaview Road, near Do Darya",
    status: "Resolved",
    department: "KW&SC Sewerage & Drainage",
    createdAt: "2026-10-12T14:00:00.000Z",
    updatedAt: "2026-10-17T10:30:00.000Z",
    citizen: "Mariam Javed",
    mine: false,
    timeline: [
      t("Submitted", "2026-10-12T14:00:00.000Z", NOTES.Submitted),
      t("Under Review", "2026-10-13T09:00:00.000Z", NOTES["Under Review"]),
      t("In Progress", "2026-10-15T08:00:00.000Z", NOTES["In Progress"]),
      t("Resolved", "2026-10-17T10:30:00.000Z", NOTES.Resolved),
    ],
  },
];

// ---------- pure helpers (unit-tested) ----------

export const ID_PATTERN = /^CC-KHI-\d{6}$/;

export function generateComplaintId(existing: Iterable<string>, rand: () => number = Math.random) {
  const taken = new Set(existing);
  for (let i = 0; i < 1000; i++) {
    const n = 100000 + Math.floor(rand() * 900000);
    const id = `CC-KHI-${n}`;
    if (!taken.has(id)) return id;
  }
  throw new Error("Could not generate a unique complaint ID");
}

export interface NewComplaintInput {
  title: string;
  description: string;
  category: CategoryId;
  area: string;
  address: string;
  photo?: string;
}

export function createComplaint(
  list: Complaint[],
  input: NewComplaintInput,
  now: Date = new Date(),
  rand?: () => number,
): Complaint {
  const iso = now.toISOString();
  return {
    id: generateComplaintId(
      list.map((c) => c.id),
      rand,
    ),
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    area: input.area,
    address: input.address.trim(),
    photo: input.photo,
    status: "Submitted",
    department: null,
    createdAt: iso,
    updatedAt: iso,
    citizen: DEMO_CITIZEN,
    mine: true,
    timeline: [t("Submitted", iso, NOTES.Submitted)],
  };
}

/** Move a complaint to a new status. The timeline keeps one entry per step reached. */
export function applyStatus(c: Complaint, status: Status, now: Date = new Date()): Complaint {
  if (c.status === status) return c;
  const iso = now.toISOString();
  const targetIdx = STATUSES.indexOf(status);
  const kept = c.timeline.filter((e) => STATUSES.indexOf(e.status) <= targetIdx);
  const have = new Set(kept.map((e) => e.status));
  const filled = [...kept];
  for (let i = 0; i <= targetIdx; i++) {
    const s = STATUSES[i];
    if (!have.has(s)) filled.push(t(s, iso, NOTES[s]));
  }
  filled.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status));
  return {
    ...c,
    status,
    department:
      c.department ?? (targetIdx >= 1 ? DEFAULT_DEPARTMENT[c.category] : null),
    updatedAt: iso,
    timeline: filled,
  };
}

export function countByStatus(list: Complaint[]) {
  const out: Record<Status, number> = {
    Submitted: 0,
    "Under Review": 0,
    "In Progress": 0,
    Resolved: 0,
  };
  for (const c of list) out[c.status]++;
  return out;
}

// ---------- browser store (localStorage) ----------

const STORAGE_KEY = "civicconnect.demo.complaints.v1";
let state: Complaint[] = SEED_COMPLAINTS;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full (large photos) — retry without photos so data is not lost.
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state.map(({ photo: _p, ...rest }) => rest)),
      );
    } catch {
      /* ignore */
    }
  }
}

export const complaintStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot: () => state,
  getServerSnapshot: () => SEED_COMPLAINTS,
  loadFromStorage() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Complaint[];
        if (Array.isArray(parsed)) {
          state = parsed;
          emit();
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
  },
  add(input: NewComplaintInput) {
    const c = createComplaint(state, input);
    state = [c, ...state];
    persist();
    emit();
    return c;
  },
  setStatus(id: string, status: Status) {
    state = state.map((c) => (c.id === id ? applyStatus(c, status) : c));
    persist();
    emit();
  },
  setDepartment(id: string, department: Department) {
    state = state.map((c) =>
      c.id === id ? { ...c, department, updatedAt: new Date().toISOString() } : c,
    );
    persist();
    emit();
  },
  reset() {
    state = SEED_COMPLAINTS;
    persist();
    emit();
  },
};
