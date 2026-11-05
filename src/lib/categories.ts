import { Construction, Droplets, Lightbulb, Trash2, Trees, Waves, type LucideIcon } from "lucide-react";
import type { CategoryId, Status } from "./complaints";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "roads",
    label: "Damaged Roads",
    short: "Roads",
    description: "Potholes, broken footpaths and road dividers",
    icon: Construction,
  },
  {
    id: "garbage",
    label: "Garbage & Waste",
    short: "Garbage",
    description: "Uncollected trash, dumping and overflowing bins",
    icon: Trash2,
  },
  {
    id: "streetlights",
    label: "Streetlights",
    short: "Streetlights",
    description: "Broken, flickering or switched-off lights",
    icon: Lightbulb,
  },
  {
    id: "water",
    label: "Water Leakage",
    short: "Water",
    description: "Pipeline leaks and water supply problems",
    icon: Droplets,
  },
  {
    id: "drainage",
    label: "Drainage & Sewerage",
    short: "Drainage",
    description: "Blocked drains and overflowing sewer lines",
    icon: Waves,
  },
  {
    id: "parks",
    label: "Parks & Public Spaces",
    short: "Parks",
    description: "Damaged parks, benches and play areas",
    icon: Trees,
  },
];

export const categoryMeta = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;

export const STATUS_STYLES: Record<Status, { badge: string; dot: string }> = {
  Submitted: {
    badge: "bg-status-submitted-soft text-status-submitted",
    dot: "bg-status-submitted",
  },
  "Under Review": {
    badge: "bg-status-review-soft text-status-review",
    dot: "bg-status-review",
  },
  "In Progress": {
    badge: "bg-status-progress-soft text-status-progress",
    dot: "bg-status-progress",
  },
  Resolved: {
    badge: "bg-status-resolved-soft text-status-resolved",
    dot: "bg-status-resolved",
  },
};

// Fixed timezone so server and browser render identical text.
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Karachi",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Karachi",
});

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
