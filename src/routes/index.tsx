import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ArrowDown, ArrowUpRight, Flame, Wind, X } from "lucide-react";
import pingAsset from "@/assets/ping.mp3.asset.json";
import fanfareAsset from "@/assets/fanfare.mp3.asset.json";
import swipeAsset from "@/assets/swipe.mp3.asset.json";
import corkPopAsset from "@/assets/cork-pop.mp3.asset.json";
import tubeHitAsset from "@/assets/tube-hit.mp3.asset.json";

const playPing = () => {
  const audio = new Audio(pingAsset.url);
  audio.volume = 0.35;
  void audio.play().catch(() => {});
};

const playFanfare = () => {
  const audio = new Audio(fanfareAsset.url);
  audio.volume = 0.5;
  void audio.play().catch(() => {});
};

const playSwipe = () => {
  const audio = new Audio(swipeAsset.url);
  audio.volume = 0.5;
  void audio.play().catch(() => {});
};

const playCorkPop = () => {
  const audio = new Audio(corkPopAsset.url);
  audio.volume = 0.5;
  void audio.play().catch(() => {});
};

const playTubeHit = () => {
  const audio = new Audio(tubeHitAsset.url);
  audio.volume = 0.5;
  void audio.play().catch(() => {});
};

/* subtle ruler tick: a short filtered noise blip, synthesised so no file is needed */
let tickCtx: AudioContext | null = null;
let lastTickAt = 0;
const playTick = () => {
  const now = performance.now();
  if (now - lastTickAt < 45) return;
  lastTickAt = now;
  const Ctx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  tickCtx ??= new Ctx();
  const ctx = tickCtx;
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  const dur = 0.035;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2200;
  filter.Q.value = 1.2;
  const gain = ctx.createGain();
  gain.gain.value = 0.06;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
};

/* dry click: a very short, dry synthesised tap for picking a date */
let clickCtx: AudioContext | null = null;
const playClick = () => {
  const Ctx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  clickCtx ??= new Ctx();
  const ctx = clickCtx;
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  const t0 = ctx.currentTime;
  const dur = 0.018;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1400;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.09, t0);
  gain.gain.exponentialRampToValueAtTime(0.0005, t0 + dur);
  src.connect(hp).connect(gain).connect(ctx.destination);
  src.start(t0);
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "week[sp]end — weekend trip budget" },
      { name: "description", content: "Get the most bang for the buck out of your European weekend trip budget." },
      { property: "og:title", content: "week[sp]end — weekend trip budget" },
      { property: "og:description", content: "Plan a weekend away and track every krona you spend." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

type Step = "welcome" | "name" | "dates" | "type" | "dashboard" | "summary";
type Expense = { id: number; time: string; czk: number; sek: number; who: "you" | "guest" };

const CZK_TO_SEK = 18.5 / 40.3;

function App() {
  const [step, setStep] = useState<Step>("welcome");
  const [tripName, setTripName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [yourName, setYourName] = useState("");
  const [withCompany, setWithCompany] = useState(false);
  const [budget, setBudget] = useState<"small" | "medium" | "large">("small");
  const [cost, setCost] = useState("2500");
  const [tripType, setTripType] = useState<TripType>("city break");
  const [first, setFirst] = useState(() => isoAddDays(todayIso(), 1));
  const [last, setLast] = useState(() => isoAddDays(todayIso(), 4));
  const [costEdited, setCostEdited] = useState(false);
  const [dark, setDark] = useState(false);
  const [ended, setEnded] = useState<Expense[]>([]);

  /* two travellers cost twice as much as one */
  const costFor = (two: boolean, t: TripType = tripType, b: Budget = budget) =>
    String(BUDGET_COSTS[t][b] * (two ? 2 : 1));

  return (
    <main className={`min-h-screen bg-ws-bg font-ws text-ws-ink transition-colors ${dark ? "ws-dark" : ""}`}>
      <div className="relative mx-auto flex min-h-screen w-full max-w-[402px] flex-col">
        {step === "welcome" && <Welcome onStart={() => setStep("name")} dark={dark} setDark={setDark} />}
        {step === "name" && (
          <Wizard
            progress={1}
            onBack={() => setStep("welcome")}
            onCancel={() => setStep("welcome")}
            onNext={() => setStep("dates")}
          >
            <SectionTitle title="name your trip" subtitle="make a name to long for" />
            <TextField value={tripName} onChange={setTripName} placeholder="trip name" />
            <Rule />
            <WhoWillJoin
              withCompany={withCompany}
              setWithCompany={(v) => {
                setWithCompany(v);
                if (!costEdited) setCost(costFor(v));
              }}
              yourName={yourName}
              setYourName={setYourName}
            />
            {withCompany && <TextField value={guestName} onChange={setGuestName} placeholder="guests name" />}
          </Wizard>
        )}
        {step === "dates" && (
          <Wizard
            progress={2}
            wide
            onBack={() => setStep("name")}
            onCancel={() => setStep("welcome")}
            onNext={() => setStep("type")}
          >
            <SectionTitle title="first day" subtitle="the day you depart to your destination" />
            <Calendar
              selected={first}
              onSelect={(d) => {
                setFirst(d);
                if (d > last) setLast(d);
              }}
              tone="olive"
              min={todayIso()}
            />
            <Rule />
            <SectionTitle title="last day" subtitle="the day you travel to home" />
            <Calendar
              key={first.slice(0, 7)}
              selected={last}
              onSelect={(d) => d >= first && setLast(d)}
              tone="red"
              min={first}
            />
          </Wizard>
        )}
        {step === "type" && (
          <Wizard
            progress={3}
            onBack={() => setStep("dates")}
            onCancel={() => setStep("welcome")}
            onNext={() => setStep("dashboard")}
          >
            <SectionTitle title="type of trip" subtitle="select what you guys want the vibe to be..." />
            <div className="relative h-[46px] w-full rounded-[23px] border border-ws-ink">
              <select
                value={tripType}
                onChange={(e) => {
                  const t = e.target.value as TripType;
                  setTripType(t);
                  setCostEdited(false);
                  setCost(costFor(withCompany, t, budget));
                }}
                className="h-full w-full appearance-none rounded-[23px] bg-transparent px-12 text-center text-[17px] font-medium tracking-[-0.43px] outline-none"
              >
                {TRIP_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <ArrowDown
                className="pointer-events-none absolute right-[23px] top-1/2 size-5 -translate-y-1/2"
                strokeWidth={1.75}
              />
            </div>
            <Rule />
            <BudgetSection
              budget={budget}
              cost={cost}
              setCost={(v) => {
                setCostEdited(true);
                setCost(v);
              }}
              setBudget={(b) => {
                setBudget(b);
                setCostEdited(false);
                setCost(costFor(withCompany, tripType, b));
              }}
            />
          </Wizard>
        )}
        {step === "dashboard" && (
          <Dashboard
            onBack={() => setStep("type")}
            onEnd={(xs) => {
              setEnded(xs);
              setStep("summary");
            }}
            guestName={guestName.trim()}
            budgetSek={Number(cost) || 0}
            days={daysBetween(first, last)}
          />
        )}
        {step === "summary" && (
          <Summary
            tripName={tripName.trim() || "my trip"}
            guestName={guestName.trim()}
            withGuest={withCompany || ended.some((e) => e.who === "guest")}
            budgetSek={Number(cost) || 0}
            days={daysBetween(first, last)}
            expenses={ended}
            onSave={() => setStep("welcome")}
          />
        )}
      </div>
    </main>
  );
}

/* ---------- welcome ---------- */
function Welcome({ onStart, dark, setDark }: { onStart: () => void; dark: boolean; setDark: (v: boolean) => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between pt-[80px]">
      <h1 className="text-center text-[34px] font-bold leading-[41px] tracking-[0.4px]">
        week<span className="text-ws-olive">[sp]end</span>
      </h1>
      <div className="mt-5 flex gap-[31px]">
        <span className="size-[19px] rounded-full bg-ws-olive" />
        <span className="size-[19px] rounded-full bg-ws-orange" />
        <span className="size-[19px] rounded-full bg-ws-red" />
      </div>
      <div className="mt-5 w-[326px] text-center text-[22px] leading-[28px] tracking-[-0.26px]">
        <p>get the most bang for the buck out of your weekend trip budget</p>
        <p className="mt-7">only within europe, except bad actor countries</p>
      </div>
      <div className="my-auto flex items-center gap-3 pt-8">
        <span className="text-[17px] font-medium tracking-[-0.43px]">{dark ? "use light mode" : "turn on dark mode"}</span>
        <button
          role="switch"
          aria-checked={dark}
          aria-label="dark mode"
          onClick={() => {
            playSwipe();
            setDark(!dark);
          }}
          className={`relative h-8 w-[63px] rounded-2xl border-2 border-ws-ink transition-colors ${dark ? "bg-ws-orange" : "bg-ws-bg"}`}
        >
          <span
            className={`absolute -top-[2px] size-8 rounded-full border-2 border-ws-ink bg-ws-bg transition-all ${dark ? "left-[27px]" : "-left-[2px]"}`}
          />
        </button>
      </div>
      <p className="pb-8 pt-2 text-center text-[13px] leading-[28px] text-ws-orange">
        powered by <b>dieter rams</b> design principles
      </p>
      <button
        onClick={() => {
          playFanfare();
          onStart();
        }}
        className="flex h-[292px] w-full flex-col items-center justify-center gap-8 bg-ws-orange pb-8 pt-16 transition-opacity active:opacity-80"
      >
        <Plus className="size-[115px] text-ws-ink" />
        <span className="text-[28px] leading-[34px] tracking-[0.38px]">new weekend away</span>
      </button>
    </div>
  );
}

/* ---------- wizard chrome ---------- */
function Wizard({
  children,
  progress,
  onBack,
  onCancel,
  onNext,
  wide,
}: {
  children: ReactNode;
  progress: number;
  onBack: () => void;
  onCancel: () => void;
  onNext: () => void;
  wide?: boolean;
}) {
  return (
    <div className="flex flex-col items-center px-6 pb-10 pt-4">
      <header className="relative flex h-[54px] w-full items-start justify-between pb-[10px]">
        <button onClick={onBack} aria-label="back" className="flex size-11 items-center justify-center text-ws-orange">
          <ChevronLeft className="size-7" strokeWidth={2.25} />
        </button>
        <div className="absolute left-1/2 top-[6px] -translate-x-1/2 text-center">
          <p className="text-[15px] font-semibold leading-5 tracking-[-0.23px]">plan your weekend!</p>
          <p className="text-[12px] font-medium leading-4 text-ws-muted">what the app needs to know</p>
        </div>
        <button onClick={onCancel} className="h-11 px-[14px] text-[17px] font-medium text-ws-orange">
          cancel
        </button>
      </header>
      <div className="mt-4 flex w-full flex-col items-center gap-3">
        {children}
        <div className="h-2" />
        <Rule />
        <div className="h-2" />
        <button
          onClick={() => {
            playPing();
            onNext();
          }}
          className={`h-[72px] rounded-[8px] bg-ws-ink text-[22px] leading-7 tracking-[-0.26px] text-ws-bg transition-opacity active:opacity-80 ${wide ? "w-full" : "w-[311px]"}`}
        >
          next
        </button>
        <div className="h-2" />
        <div className="flex gap-[10px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`h-[3px] w-10 ${i < progress ? "bg-ws-orange" : "bg-ws-warm"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="w-full px-4 pb-[10px]">
      <h2 className="text-[34px] font-bold leading-[41px] tracking-[0.4px]">{title}</h2>
      <p className="text-[15px] font-medium leading-5 tracking-[-0.23px] text-ws-orange">{subtitle}</p>
    </div>
  );
}

function Rule() {
  return <hr className="w-full border-0 border-t border-ws-ink" />;
}

function TextField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="w-full px-4">
      <div className="flex h-[52px] items-center border-t border-ws-gray">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[17px] font-medium tracking-[-0.43px] caret-[#0091ff] outline-none placeholder:text-ws-ink"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            aria-label="clear"
            className="flex size-5 items-center justify-center rounded-full bg-ws-ink text-ws-bg"
          >
            <X className="size-3" strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
}

function WhoWillJoin({
  withCompany,
  setWithCompany,
  yourName,
  setYourName,
}: {
  withCompany: boolean;
  setWithCompany: (v: boolean) => void;
  yourName: string;
  setYourName: (v: string) => void;
}) {
  return (
    <>
      <SectionTitle title="who will join" subtitle="solo or with company?" />
      <div className="flex w-full items-center justify-between px-4">
        <button
          role="switch"
          aria-checked={withCompany}
          onClick={() => {
            playSwipe();
            setWithCompany(!withCompany);
          }}
          className={`relative h-8 w-[63px] rounded-2xl border-2 border-ws-ink transition-colors ${withCompany ? "bg-ws-orange" : "bg-ws-bg"}`}
        >
          <span
            className={`absolute -top-[2px] size-8 rounded-full border-2 border-ws-ink bg-ws-bg transition-all ${withCompany ? "left-[27px]" : "-left-[2px]"}`}
          />
        </button>
        <span className="text-[17px] font-medium leading-5 tracking-[-0.43px]">
          {withCompany ? "you bring a guest" : "only you"}
        </span>
      </div>
      <TextField value={yourName} onChange={setYourName} placeholder="your name" />
    </>
  );
}

const BUDGET_OPTIONS = ["small", "medium", "large"] as const;
type Budget = (typeof BUDGET_OPTIONS)[number];

const TRIP_TYPES = ["city break", "beach", "food & wine", "culture", "party", "nature"] as const;
type TripType = (typeof TRIP_TYPES)[number];

/* kr per tier, by trip type: city break costs the most, nature the least */
const BUDGET_COSTS: Record<TripType, Record<Budget, number>> = {
  "city break": { small: 2500, medium: 7000, large: 10000 },
  party: { small: 2300, medium: 6400, large: 9200 },
  "food & wine": { small: 2100, medium: 5900, large: 8400 },
  beach: { small: 1900, medium: 5300, large: 7600 },
  culture: { small: 1700, medium: 4800, large: 6800 },
  nature: { small: 1500, medium: 4200, large: 6000 },
};

function BudgetSection({
  budget,
  setBudget,
  cost,
  setCost,
}: {
  budget: Budget;
  setBudget: (v: Budget) => void;
  cost: string;
  setCost: (v: string) => void;
}) {
  const active = BUDGET_OPTIONS.indexOf(budget);
  return (
    <>
      <SectionTitle title="your budget" subtitle="on a budget or like there's no tomorrow..." />
      <div className="relative h-[46px] w-full rounded-[23px] border border-ws-ink bg-ws-gray">
        <span
          className="absolute inset-y-[3px] rounded-[22px] bg-ws-ink transition-all"
          style={{ left: `calc(${active} * (100% - 6px) / 3 + 3px)`, width: "calc((100% - 6px) / 3)" }}
        />
        <div className="relative flex h-full">
          {BUDGET_OPTIONS.map((o) => (
            <button
              key={o}
              onClick={() => {
                if (o !== budget) playSwipe();
                setBudget(o);
              }}
              className={`flex-1 text-[17px] font-medium capitalize leading-5 tracking-[-0.43px] transition-colors ${o === budget ? "text-ws-bg" : "text-ws-ink"}`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full px-4">
        <div className="flex h-[52px] items-center border-t border-ws-gray">
          <input
            value={cost}
            onChange={(e) => setCost(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            placeholder="cost"
            aria-label="cost in kr"
            className="flex-1 bg-transparent text-[17px] font-medium tracking-[-0.43px] caret-[#0091ff] outline-none placeholder:text-ws-ink"
          />
          <span className="text-[17px] font-medium tracking-[-0.43px]">kr</span>
        </div>
      </div>
    </>
  );
}

/* ---------- calendar: real months, monday first ---------- */
const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const parts = (iso: string) => {
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  return [y, m, d] as const;
};
const pad2 = (n: number) => String(n).padStart(2, "0");
const isoOf = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
function todayIso() {
  const n = new Date();
  return isoOf(n.getFullYear(), n.getMonth(), n.getDate());
}
function isoAddDays(iso: string, days: number) {
  const [y, m, d] = parts(iso);
  const t = new Date(y, m - 1, d + days);
  return isoOf(t.getFullYear(), t.getMonth(), t.getDate());
}
/* inclusive day count of the selected trip, used for the daily budget */
function daysBetween(first: string, last: string) {
  const [fy, fm, fd] = parts(first);
  const [ly, lm, ld] = parts(last);
  const a = new Date(fy, fm - 1, fd).getTime();
  const b = new Date(ly, lm - 1, ld).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

function Calendar({
  selected,
  onSelect,
  tone,
  min,
}: {
  selected: string;
  onSelect: (d: string) => void;
  tone: "olive" | "red";
  min: string;
}) {
  const today = todayIso();
  const [ty, tm] = parts(today);
  const startIdx = ty * 12 + tm - 1;
  const [sy, sm] = parts(selected >= min ? selected : min);
  const [view, setView] = useState(() => Math.max(startIdx, sy * 12 + sm - 1));
  const [picking, setPicking] = useState(false);
  const y = Math.floor(view / 12);
  const m = view % 12;
  const cells = useMemo(() => {
    const offset = (new Date(y, m, 1).getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)] as (number | null)[];
  }, [y, m]);
  return (
    <div className="w-full px-3">
      <div className="flex items-center justify-between pb-[3px] pl-2 pr-[6px] pt-[13px]">
        <button
          type="button"
          onClick={() => setPicking((p) => !p)}
          className="flex items-center gap-1"
          aria-label="choose month"
        >
          <span className="text-[17px] font-semibold leading-[22px] tracking-[-0.43px]">
            {MONTHS[m]} {y}
          </span>
          <ChevronRight
            className={`size-4 text-ws-red transition-transform ${picking ? "rotate-90" : ""}`}
            strokeWidth={3}
          />
        </button>
        <div className="flex gap-7">
          <button
            type="button"
            aria-label="previous month"
            disabled={view <= startIdx}
            onClick={() => setView((v) => v - 1)}
            className="disabled:opacity-30"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button type="button" aria-label="next month" onClick={() => setView((v) => v + 1)}>
            <ChevronRight className="size-6" />
          </button>
        </div>
      </div>
      {picking ? (
        <div className="grid grid-cols-3 gap-2 py-3">
          {Array.from({ length: 12 }, (_, i) => startIdx + i).map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setView(idx);
                setPicking(false);
              }}
              className={`rounded-full py-2 text-[15px] ${idx === view ? (tone === "olive" ? "bg-ws-olive text-ws-bg" : "bg-ws-red text-ws-bg") : ""}`}
            >
              {(MONTHS[idx % 12] ?? "").slice(0, 3)} {Math.floor(idx / 12) !== ty ? Math.floor(idx / 12) : ""}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 justify-items-center gap-y-[7px] px-0 py-2">
          {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => (
            <span key={d} className="h-5 text-[13px] font-semibold">
              {d}
            </span>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <span key={i} className="size-[38px]" />;
            const iso = isoOf(y, m, d);
            return (
              <button
                key={i}
                type="button"
                disabled={iso < min}
                onClick={() => {
                  playClick();
                  onSelect(iso);
                }}
                className={`flex size-[38px] items-center justify-center rounded-full text-[20px] tracking-[-0.45px] disabled:opacity-30 ${
                  iso === selected
                    ? tone === "olive"
                      ? "bg-ws-olive text-ws-bg"
                      : "bg-ws-red font-semibold text-ws-bg"
                    : iso === today
                      ? "bg-white"
                      : ""
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- dashboard ---------- */
const fmt = (n: number) => n.toFixed(2);
const fmtComma = (n: number) => n.toFixed(2).replace(".", ",");
const localTimeNow = () => {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
};

function Dashboard({
  onBack,
  onEnd,
  guestName,
  budgetSek,
  days,
}: {
  onBack: () => void;
  onEnd: (expenses: Expense[]) => void;
  guestName: string;
  budgetSek: number;
  days: number;
}) {
  const guestLabel = guestName || "guest";
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, time: "", czk: 40.3, sek: 18.5, who: "you" },
    { id: 2, time: "", czk: 40.3, sek: 18.5, who: "you" },
    { id: 3, time: "", czk: 40.3, sek: 18.5, who: "guest" },
    { id: 4, time: "", czk: 40.3, sek: 18.5, who: "you" },
  ]);
  useEffect(() => {
    const t = localTimeNow();
    setExpenses((xs) => xs.map((e) => ({ ...e, time: t })));
  }, []);
  const [adding, setAdding] = useState<null | "you" | "guest">(null);
  const [amount, setAmount] = useState(0);

  const totalSek = expenses.reduce((s, e) => s + e.sek, 0);
  const todaySek = totalSek; // all demo expenses are from today
  const flameHot = totalSek >= budgetSek * 0.8;
  const [pulseDay, setPulseDay] = useState(() => new Date().toDateString());
  useEffect(() => {
    if (!flameHot) return;
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    const t = setTimeout(() => setPulseDay("expired"), midnight - now.getTime());
    return () => clearTimeout(t);
  }, [flameHot]);
  const flamePulse = flameHot && pulseDay !== "expired";
  const dailyBudget = budgetSek / Math.max(1, days);
  const overDaily = todaySek > dailyBudget;

  const confirm = () => {
    if (adding && amount > 0) {
      if (adding === "you") playCorkPop();
      else playTubeHit();
      setExpenses((xs) => [
        { id: Date.now(), time: localTimeNow(), czk: amount, sek: amount * CZK_TO_SEK, who: adding },
        ...xs,
      ]);
    }
    setAdding(null);
    setAmount(0);
  };

  const onPress = (who: "you" | "guest") => (adding === who ? confirm() : setAdding(who));

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-col items-center gap-3 px-6 pt-4">
        <header className="relative flex h-[54px] w-full items-start pb-[10px]">
          <button
            onClick={onBack}
            aria-label="back"
            className="flex size-11 items-center justify-center text-ws-orange"
          >
            <ChevronLeft className="size-7" strokeWidth={2.25} />
          </button>
          <div className="absolute left-1/2 top-[6px] -translate-x-1/2 text-center">
            <p className="text-[15px] font-semibold leading-5 tracking-[-0.23px]">{fmt(budgetSek)} sek</p>
            <p className="whitespace-nowrap text-[12px] font-medium leading-4 text-ws-muted">
              your total expence budget
            </p>
          </div>
          <button
            onClick={() => onEnd(expenses)}
            className="ml-auto h-11 px-[14px] text-[17px] font-medium text-ws-orange"
          >
            end trip
          </button>
        </header>

        <section className="relative flex h-[178px] w-full flex-col justify-center rounded-[20px] bg-ws-gray text-center">
          <p className="text-[17px] font-medium leading-7 tracking-[-0.43px]">sek spent of budget</p>
          <p
            className={`text-[50px] leading-9 tabular-nums ${
              totalSek > budgetSek ? "font-black text-ws-red" : "font-bold text-ws-olive"
            }`}
          >
            {fmt(totalSek)}
          </p>
          <p className="text-[17px] font-semibold leading-5 text-ws-bg">. . .</p>
          <p className="text-[17px] font-medium leading-7 tracking-[-0.43px]">sek spent today</p>
          <p className="text-[39px] font-medium leading-[31px] text-ws-flame tabular-nums">{fmt(todaySek)}</p>
          <ArrowUpRight
            className={`absolute bottom-[20px] left-[20px] size-7 ${overDaily ? "text-ws-flame" : "text-ws-olive"}`}
            strokeWidth={1.5}
          />
          <Flame
            className={`absolute bottom-[18px] right-[20px] size-7 ${
              flameHot ? "text-ws-flame" : "text-ws-muted"
            } ${flamePulse ? "ws-pulse" : ""}`}
            strokeWidth={1.5}
          />
        </section>

        <div className="h-2" />
        {!adding && (
          <div className="w-full pb-[220px]">
            <Row className="text-[20px] leading-[25px] tracking-[-0.45px]" cells={["time", "czk", "sek"]} />
            {expenses.map((e) => (
              <Row
                key={e.id}
                className="text-[17px] leading-[22px] tracking-[-0.43px]"
                cells={[e.time, `${fmtComma(e.czk)} Kč`, `${fmt(e.sek)} kr`]}
                dot={e.who}
              />
            ))}
          </div>
        )}
      </div>

      {adding && (
        <AmountSheet
          amount={amount}
          setAmount={setAmount}
          onClose={() => {
            setAdding(null);
            setAmount(0);
          }}
        />
      )}

      <div className="fixed bottom-0 left-1/2 grid h-[200px] w-full max-w-[402px] -translate-x-1/2 grid-cols-2 bg-ws-orange">
        <AddButton label="you" light active={adding === "you"} onClick={() => onPress("you")} />
        <AddButton
          label={guestLabel}
          active={adding === "guest"}
          onClick={() => onPress("guest")}
        />
      </div>
    </div>
  );
}

function Row({ cells, className, dot }: { cells: string[]; className: string; dot?: "you" | "guest" }) {
  return (
    <div className={`flex items-center justify-between border-b border-ws-gray px-4 py-3 font-semibold ${className}`}>
      <span className="w-[50px]">{cells[0]}</span>
      <span className="w-[100px] text-right">{cells[1]}</span>
      <span className="flex w-[100px] items-center justify-end gap-2">
        {dot && (
          <span
            className={`ws-dot size-[14px] shrink-0 rounded-full border ${
              dot === "you" ? "border-ws-gray bg-ws-dot-you" : "border-ws-dot-guest bg-ws-dot-guest"
            }`}
          />
        )}
        <span>{cells[2]}</span>
      </span>
    </div>
  );
}

function AddButton({
  label,
  light,
  active,
  onClick,
}: {
  label: string;
  light?: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const color = light ? "text-ws-bg" : "text-ws-ink";
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center pt-3 ${color} active:opacity-80`}
      aria-label={active ? `save ${label} expense` : `add ${label} expense`}
    >
      <span className="text-[22px] leading-7 tracking-[-0.26px]">{label}</span>
      <span className="mt-6">
        {active ? <Wind className="size-[80px]" strokeWidth={1.25} /> : <Plus className="size-[80px]" />}
      </span>
    </button>
  );
}

/* horizontal ruler: 1 czk = 7px */
const PX = 7;
const MAX = 2000;
function AmountSheet({
  amount,
  setAmount,
  onClose,
}: {
  amount: number;
  setAmount: (n: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef({ startY: 0, y: 0, active: false });

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragState.current = { startY: e.clientY - dragState.current.y, y: dragState.current.y, active: true };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState.current.active) return;
    const y = Math.max(0, e.clientY - dragState.current.startY);
    dragState.current.y = y;
    setDragY(y);
  };
  const onPointerUp = () => {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    setDragging(false);
    if (dragState.current.y > 120) {
      dragState.current.y = 600;
      setDragY(600);
      setTimeout(() => {
        dragState.current.y = 0;
        setDragY(0);
        onClose();
      }, 300);
    } else {
      dragState.current.y = 0;
      setDragY(0);
    }
  };

  return (
    <div
      className="fixed bottom-[200px] left-1/2 h-[337px] w-full max-w-[402px] overflow-hidden rounded-t-[20px] bg-ws-orange"
      style={{
        transform: `translateX(-50%) translateY(${dragY}px)`,
        transition: dragging ? "none" : "transform 0.3s ease-in-out",
      }}
    >
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="close"
        className="relative mx-auto mt-[13px] block h-1 w-[139px] cursor-grab touch-none bg-ws-bg active:cursor-grabbing after:absolute after:-inset-x-10 after:-top-3 after:-bottom-10 after:content-['']"
      />
      <div className="mt-3 text-center text-[17px] leading-[22px]">
        <p className="font-medium">czk</p>
        <p className="text-[21px] font-semibold tabular-nums">{fmt(amount)}</p>
      </div>
      <div className="relative mt-[14px] h-[247px] border-y border-ws-ink bg-ws-gray">
        <div
          ref={ref}
          onScroll={(e) => {
            const v = Math.max(0, Math.round((e.currentTarget.scrollLeft / PX) * 2) / 2);
            if (v !== amount) playTick();
            setAmount(v);
          }}
          className="h-full overflow-x-auto [scrollbar-width:none]"
        >
          <div className="relative h-full" style={{ width: MAX * PX + 402, paddingLeft: 201 }}>
            {Array.from({ length: MAX + 1 }).map((_, i) => (
              <span
                key={i}
                className="absolute bottom-[56px] w-px bg-ws-ink"
                style={{ left: 201 + i * PX, height: i % 10 === 0 ? 130 : i % 5 === 0 ? 116 : 100 }}
              />
            ))}
            {Array.from({ length: MAX / 20 + 1 }).map((_, i) => (
              <span
                key={i}
                className="absolute bottom-[30px] -translate-x-1/2 text-[13px]"
                style={{ left: 201 + i * 20 * PX }}
              >
                {i * 20}
              </span>
            ))}
          </div>
        </div>
        <span className="pointer-events-none absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-ws-red" />
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 115 115" className={className} fill="none" stroke="currentColor" strokeWidth={3}>
      <line x1="57.5" y1="0" x2="57.5" y2="115" />
      <line x1="0" y1="57.5" x2="115" y2="57.5" />
    </svg>
  );
}

/* ---------- summary ---------- */
function Summary({
  tripName,
  guestName,
  withGuest,
  budgetSek,
  days,
  expenses,
  onSave,
}: {
  tripName: string;
  guestName: string;
  withGuest: boolean;
  budgetSek: number;
  days: number;
  expenses: Expense[];
  onSave: () => void;
}) {
  const total = expenses.reduce((s, e) => s + e.sek, 0);
  const you = expenses.filter((e) => e.who === "you").reduce((s, e) => s + e.sek, 0);
  const guest = total - you;
  const left = budgetSek - total;
  const perDay = total / Math.max(1, days);
  const Box = ({ label, value, tone = "", bg = "bg-ws-gray" }: { label: string; value: string; tone?: string; bg?: string }) => (
    <div className={`flex flex-col items-center justify-center rounded-[20px] px-3 py-5 text-center ${bg}`}>
      <p className="text-[15px] font-medium leading-5 text-ws-muted">{label}</p>
      <p className={`text-[28px] font-bold leading-9 tabular-nums ${tone}`}>{value}</p>
    </div>
  );
  return (
    <div className="flex min-h-screen flex-col px-6 pb-10 pt-[60px]">
      <h1 className="text-center text-[34px] font-bold leading-[41px] tracking-[0.4px]">{tripName}</h1>
      <p className="mt-1 text-center text-[17px] font-medium text-ws-muted">trip summary · {days} days</p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Box label="sek spent in total" value={fmt(total)} tone={total > budgetSek ? "text-ws-red" : "text-ws-olive"} />
        </div>
        <Box label="budget" value={fmt(budgetSek)} bg="bg-ws-orange/25" />
        <Box label={left < 0 ? "over budget" : "left of budget"} value={fmt(Math.abs(left))} tone={left < 0 ? "text-ws-red" : ""} bg="bg-ws-olive/25" />
        <Box label="per day" value={fmt(perDay)} bg="bg-ws-flame/25" />
        <Box label="expenses" value={String(expenses.length)} bg="bg-ws-red/30" />
      </div>

      <p className="mt-8 text-[20px] font-semibold leading-[25px]">who spent what</p>
      <div className="mt-2">
        <div className="flex items-center justify-between border-b border-ws-gray px-4 py-3 text-[17px] font-semibold">
          <span>{"you"}</span>
          <span className="flex items-center gap-2 tabular-nums">
            <span className="ws-dot size-[14px] rounded-full border border-ws-gray bg-ws-dot-you" />
            {fmt(you)} kr
          </span>
        </div>
        {withGuest && (
          <div className="flex items-center justify-between border-b border-ws-gray px-4 py-3 text-[17px] font-semibold">
          <span>{guestName || "guest"}</span>
          <span className="flex items-center gap-2 tabular-nums">
            <span className="ws-dot size-[14px] rounded-full border border-ws-dot-guest bg-ws-dot-guest" />
            {fmt(guest)} kr
          </span>
        </div>
        )}
      </div>

      <div className="flex-1" />
      <button
        onClick={onSave}
        className="mt-10 h-[60px] w-full rounded-[14px] bg-ws-ink text-[20px] font-semibold text-ws-bg"
      >
        save trip
      </button>
    </div>
  );
}
