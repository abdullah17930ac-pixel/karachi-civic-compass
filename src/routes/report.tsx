import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ImagePlus,
  Info,
  LayoutDashboard,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  Send,
  X,
} from "lucide-react";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/civic/bits";
import { CATEGORIES, categoryMeta } from "@/lib/categories";
import {
  CATEGORY_IDS,
  complaintStore,
  DEFAULT_DEPARTMENT,
  KARACHI_AREAS,
  type CategoryId,
  type Complaint,
} from "@/lib/complaints";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/report")({
  validateSearch: (s: Record<string, unknown>): { category?: CategoryId | undefined } => ({
    category: CATEGORY_IDS.includes(s["category"] as CategoryId) ? (s["category"] as CategoryId) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Report a Complaint – CivicConnect Karachi" },
      {
        name: "description",
        content: "Submit a civic complaint with a photo and location and get a unique tracking ID instantly.",
      },
      { property: "og:title", content: "Report a Complaint – CivicConnect" },
      { property: "og:description", content: "Report a community problem in Karachi in under a minute." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const max = 900;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

type Errors = Partial<Record<"category" | "title" | "description" | "area" | "address", string>>;

function ReportPage() {
  const search = Route.useSearch();
  const [category, setCategory] = useState<CategoryId | undefined>(search.category);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<string>("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [dragging, setDragging] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [created, setCreated] = useState<Complaint | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG or PNG).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image is too large. Please use a photo under 10 MB.");
      return;
    }
    try {
      setPhoto(await compressImage(file));
    } catch {
      toast.error("Could not read that image.");
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        setAddress(`GPS ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        toast.success("Location added from your device.");
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location. Please type the address instead.");
      },
      { timeout: 8000 },
    );
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!category) next.category = "Choose a category for your complaint.";
    if (title.trim().length < 6) next.title = "Add a short title (at least 6 characters).";
    if (description.trim().length < 20) next.description = "Describe the problem in at least 20 characters.";
    if (!area) next.area = "Select the area of Karachi.";
    if (address.trim().length < 4) next.address = "Add a street, landmark or GPS location.";
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("Please complete the highlighted fields.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const c = complaintStore.add({
        category: category!,
        title,
        description,
        area,
        address,
        photo,
      });
      setSubmitting(false);
      setCreated(c);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 900);
  };

  const reset = () => {
    setCreated(null);
    setCategory(undefined);
    setTitle("");
    setDescription("");
    setArea("");
    setAddress("");
    setPhoto(undefined);
    setErrors({});
  };

  if (created) return <SuccessView complaint={created} onReset={reset} />;

  return (
    <div className="bg-hero">
      <div className="container-page py-10 md:py-14">
        <PageHeader
          eyebrow="Report a complaint"
          title="What needs fixing?"
          description="Share the details below. Clear photos and exact locations help field teams resolve issues faster."
        />

        <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* Category */}
            <Section step={1} title="Select a category" error={errors.category}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CATEGORIES.map((c) => {
                  const active = category === c.id;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => {
                        setCategory(c.id);
                        setErrors((x) => ({ ...x, category: undefined }));
                      }}
                      aria-pressed={active}
                      className={cn(
                        "group relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                        active
                          ? "border-brand bg-brand-soft shadow-glow"
                          : "border-border bg-card hover:border-brand/40 hover:bg-brand-soft/40",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-10 place-items-center rounded-lg transition-colors",
                          active ? "bg-brand text-brand-foreground" : "bg-brand-soft text-brand",
                        )}
                      >
                        <c.icon className="size-5" />
                      </span>
                      <span className="text-sm font-semibold text-foreground">{c.label}</span>
                      {active && <CheckCircle2 className="absolute right-3 top-3 size-5 text-brand" />}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Details */}
            <Section step={2} title="Describe the problem">
              <div className="space-y-5">
                <Field label="Complaint title" error={errors.title} htmlFor="title" hint={`${title.length}/90`}>
                  <Input
                    id="title"
                    value={title}
                    maxLength={90}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Large pothole on Rashid Minhas Road"
                    className="h-11 bg-card"
                    aria-invalid={!!errors.title}
                  />
                </Field>
                <Field label="Detailed description" error={errors.description} htmlFor="desc" hint={`${description.length}/600`}>
                  <Textarea
                    id="desc"
                    value={description}
                    maxLength={600}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is the problem, how long has it been there and how is it affecting residents?"
                    className="min-h-32 bg-card"
                    aria-invalid={!!errors.description}
                  />
                </Field>
              </div>
            </Section>

            {/* Photo */}
            <Section step={3} title="Add a photo" optional>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {photo ? (
                <div className="relative overflow-hidden rounded-xl border border-border">
                  <img src={photo} alt="Uploaded complaint" className="max-h-80 w-full object-cover" />
                  <Button
                    type="button"
                    size="icon"
                    variant="white"
                    onClick={() => setPhoto(undefined)}
                    className="absolute right-3 top-3"
                    aria-label="Remove photo"
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                    dragging ? "border-brand bg-brand-soft" : "border-border bg-surface hover:border-brand/50 hover:bg-brand-soft/40",
                  )}
                >
                  <span className="grid size-14 place-items-center rounded-2xl bg-card text-brand shadow-card">
                    <ImagePlus className="size-6" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    Drag & drop a photo, or <span className="text-brand">browse</span>
                  </span>
                  <span className="text-xs text-muted-foreground">JPG or PNG, up to 10 MB</span>
                </button>
              )}
            </Section>

            {/* Location */}
            <Section step={4} title="Location">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Area / Town" error={errors.area}>
                  <Select
                    value={area}
                    onValueChange={(v) => {
                      setArea(v);
                      setErrors((x) => ({ ...x, area: undefined }));
                    }}
                  >
                    <SelectTrigger className="h-11 bg-card" aria-invalid={!!errors.area}>
                      <SelectValue placeholder="Select area in Karachi" />
                    </SelectTrigger>
                    <SelectContent>
                      {KARACHI_AREAS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Street address or landmark" error={errors.address} htmlFor="addr">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="addr"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Block 7, near Disco Bakery"
                      className="h-11 bg-card pl-9"
                      aria-invalid={!!errors.address}
                    />
                  </div>
                </Field>
              </div>
              <Button type="button" variant="soft" className="mt-4" onClick={useMyLocation} disabled={locating}>
                {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />} Use my current location
              </Button>
            </Section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-32">
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-card">
                <h3 className="font-semibold text-foreground">Summary</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <SummaryRow label="Category" value={category ? categoryMeta(category).label : "—"} />
                  <SummaryRow label="Routed to" value={category ? DEFAULT_DEPARTMENT[category] : "—"} />
                  <SummaryRow label="Area" value={area || "—"} />
                  <SummaryRow label="Photo" value={photo ? "Attached" : "None"} />
                </dl>
                <Button type="submit" variant="brand" size="xl" className="mt-6 w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <Send /> Submit Complaint
                    </>
                  )}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Demo only — saved in this browser, not sent to any authority.
                </p>
              </div>
              <div className="rounded-2xl border border-brand/20 bg-brand-soft p-5">
                <div className="flex gap-3">
                  <Info className="mt-0.5 size-5 shrink-0 text-brand" />
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">Tips for faster resolution</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                      <li>Mention a nearby landmark</li>
                      <li>Take the photo in daylight</li>
                      <li>Note how long the issue has existed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

function Section({
  step,
  title,
  optional,
  error,
  children,
}: {
  step: number;
  title: string;
  optional?: boolean | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-card sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-full bg-navy text-sm font-bold text-navy-foreground">
          {step}
        </span>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {optional && <span className="text-xs font-medium text-muted-foreground">(optional)</span>}
      </div>
      {children}
      {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
          {label}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function SuccessView({ complaint, onReset }: { complaint: Complaint; onReset: () => void }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(complaint.id);
      toast.success("Complaint ID copied");
    } catch {
      toast.error("Couldn't copy — please note the ID manually.");
    }
  };
  return (
    <div className="bg-hero">
      <div className="container-page flex justify-center py-14 md:py-20">
        <div className="w-full max-w-xl animate-fade-up rounded-3xl border border-border/70 bg-card p-8 text-center shadow-elevated sm:p-10">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-status-resolved-soft text-status-resolved">
            <CheckCircle2 className="size-10" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold text-navy">Complaint submitted!</h1>
          <p className="mt-3 text-muted-foreground">
            Thank you for helping improve your community. Save this ID to track your complaint.
          </p>
          <div className="mt-7 rounded-2xl border border-dashed border-brand/40 bg-brand-soft p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Your complaint ID
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-wider text-navy sm:text-3xl">{complaint.id}</span>
              <Button size="icon" variant="white" onClick={copy} aria-label="Copy complaint ID">
                <Copy />
              </Button>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-left text-sm">
            <div className="rounded-xl bg-surface p-3">
              <dt className="text-xs text-muted-foreground">Category</dt>
              <dd className="font-semibold text-foreground">{categoryMeta(complaint.category).label}</dd>
            </div>
            <div className="rounded-xl bg-surface p-3">
              <dt className="text-xs text-muted-foreground">Area</dt>
              <dd className="font-semibold text-foreground">{complaint.area}</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="brand" size="lg" className="flex-1">
              <Link to="/track" search={{ id: complaint.id }}>
                <Search /> Track this complaint
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link to="/dashboard">
                <LayoutDashboard /> My dashboard
              </Link>
            </Button>
          </div>
          <button onClick={onReset} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            Report another issue <ArrowRight className="size-4" />
          </button>
          <p className="mt-6 text-xs text-muted-foreground">Demo submission · stored only in this browser</p>
        </div>
      </div>
    </div>
  );
}
