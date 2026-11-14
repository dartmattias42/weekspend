import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ArrowDown, ArrowUpRight, Flame, Wind, X } from "lucide-react";

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

type Step = "welcome" | "name" | "dates" | "type" | "dashboard";
type Expense = { id: number; time: string; czk: number; sek: number; who: "you" | "guest" };

const CZK_TO_SEK = 18.5 / 40.3;
const BUDGET_SEK = 3800;

function App() {
  const [step, setStep] = useState<Step>("welcome");
  const [tripName, setTripName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [yourName, setYourName] = useState("");
  const [withCompany, setWithCompany] = useState(false);
  const [budget, setBudget] = useState<"small" | "medium" | "large">("small");
  const [cost, setCost] = useState("2500");
  const [tripType, setTripType] = useState("city break");
  const [first, setFirst] = useState(() => Math.min(new Date().getDate() + 1, 30));
  const [last, setLast] = useState(() => Math.min(new Date().getDate() + 4, 30));

  return (
    <main className="min-h-screen bg-ws-bg font-ws text-ws-ink">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[402px] flex-col">
        {step === "welcome" && <Welcome onStart={() => setStep("name")} />}
        {step === "name" && (
          <Wizard progress={1} onBack={() => setStep("welcome")} onCancel={() => setStep("welcome")} onNext={() => setStep("dates")}>
            <SectionTitle title="name your trip" subtitle="make a name to long for" />
            <TextField value={tripName} onChange={setTripName} placeholder="trip name" />
            <Rule />
            <WhoWillJoin {...{ withCompany, setWithCompany, yourName, setYourName }} />
            {withCompany && <TextField value={guestName} onChange={setGuestName} placeholder="guests name" />}
          </Wizard>
        )}
        {step === "dates" && (
          <Wizard progress={2} wide onBack={() => setStep("name")} onCancel={() => setStep("welcome")} onNext={() => setStep("type")}>
            <SectionTitle title="first day" subtitle="the day you depart to your destination" />
            <Calendar selected={first} onSelect={(d) => { setFirst(d); if (d > last) setLast(d); }} tone="olive" />
            <Rule />
            <SectionTitle title="last day" subtitle="the day you travel to home" />
            <Calendar selected={last} onSelect={(d) => d >= first && setLast(d)} tone="red" min={first} />
          </Wizard>
        )}
        {step === "type" && (
          <Wizard progress={3} onBack={() => setStep("dates")} onCancel={() => setStep("welcome")} onNext={() => setStep("dashboard")}>
            <SectionTitle title="type of trip" subtitle="select what you guys want the vibe to be..." />
            <div className="relative h-[46px] w-full rounded-[23px] border border-ws-ink">
              <select
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                className="h-full w-full appearance-none rounded-[23px] bg-transparent px-12 text-center text-[17px] font-medium tracking-[-0.43px] outline-none"
              >
                {["city break", "beach", "food & wine", "culture", "party", "nature"].map((t) => <option key={t}>{t}</option>)}
              </select>
              <ArrowDown className="pointer-events-none absolute right-[23px] top-1/2 size-5 -translate-y-1/2" strokeWidth={1.75} />
            </div>
            <Rule />
            <BudgetSection
              budget={budget}
              cost={cost}
              setCost={setCost}
              setBudget={(b) => {
                setBudget(b);
                setCost(String(BUDGET_COSTS[b]));
              }}
            />
          </Wizard>
        )}
        {step === "dashboard" && <Dashboard onBack={() => setStep("type")} guestName={guestName.trim()} />}
      </div>
    </main>
  );
}

/* ---------- welcome ---------- */
function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between pt-[80px]">
      <h1 className="text-center text-[34px] font-bold leading-[41px] tracking-[0.4px]">
        week<span className="text-ws-olive">[sp]end</span>
      </h1>
      <div className="mt-5 flex gap-[31px]">
        <span className="size-[19px] rounded-full bg-ws-orange" />
        <span className="size-[19px] rounded-full bg-ws-olive" />
        <span className="size-[19px] rounded-full bg-ws-red" />
      </div>
      <div className="mt-5 w-[326px] text-center text-[22px] leading-[28px] tracking-[-0.26px]">
        <p>get the most bang for the buck out of your weekend trip budget</p>
        <p className="mt-7">only within europe, except bad actor countries</p>
      </div>
      <p className="mt-auto pb-8 pt-10 text-center text-[13px] leading-[28px] text-ws-orange">
        powered by <b>dieter rams</b> design principles
      </p>
      <button
        onClick={onStart}
        className="flex h-[292px] w-full flex-col items-center justify-center gap-8 bg-ws-orange pb-8 pt-16 transition-opacity active:opacity-80"
      >
        <Plus className="size-[115px] text-ws-ink" />
        <span className="text-[28px] leading-[34px] tracking-[0.38px]">new weekend away</span>
      </button>
    </div>
  );
}

/* ---------- wizard chrome ---------- */
function Wizard({ children, progress, onBack, onCancel, onNext, wide }: {
  children: ReactNode; progress: number; onBack: () => void; onCancel: () => void; onNext: () => void; wide?: boolean;
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
        <button onClick={onCancel} className="h-11 px-[14px] text-[17px] font-medium text-ws-orange">cancel</button>
      </header>
      <div className="mt-4 flex w-full flex-col items-center gap-3">
        {children}
        <div className="h-2" />
        <Rule />
        <div className="h-2" />
        <button
          onClick={onNext}
          className={`h-[72px] rounded-[8px] bg-ws-ink text-[22px] leading-7 tracking-[-0.26px] text-ws-bg transition-opacity active:opacity-80 ${wide ? "w-full" : "w-[311px]"}`}
        >
          next
        </button>
        <div className="h-2" />
        <div className="flex gap-[10px]">
          {Array.from({ length: 6 }).map((_, i) => (
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

function TextField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="w-full px-4">
      <div className="flex h-[52px] items-center border-t-2 border-ws-gray">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[17px] font-medium tracking-[-0.43px] caret-[#0091ff] outline-none placeholder:text-ws-ink"
        />
        {value && (
          <button onClick={() => onChange("")} aria-label="clear" className="flex size-5 items-center justify-center rounded-full bg-ws-ink text-ws-bg">
            <X className="size-3" strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
}

function WhoWillJoin({ withCompany, setWithCompany, yourName, setYourName }: {
  withCompany: boolean; setWithCompany: (v: boolean) => void; yourName: string; setYourName: (v: string) => void;
}) {
  return (
    <>
      <SectionTitle title="who will join" subtitle="solo or with company?" />
      <div className="flex w-full items-center justify-between px-4">
        <button
          role="switch"
          aria-checked={withCompany}
          onClick={() => setWithCompany(!withCompany)}
          className={`relative h-8 w-[63px] rounded-2xl border-2 border-ws-ink transition-colors ${withCompany ? "bg-ws-orange" : "bg-ws-bg"}`}
        >
          <span className={`absolute -top-[2px] size-8 rounded-full border-2 border-ws-ink bg-ws-bg transition-all ${withCompany ? "left-[27px]" : "-left-[2px]"}`} />
        </button>
        <span className="text-[17px] font-medium leading-5 tracking-[-0.43px]">
          {withCompany ? "You bring a guest" : "Only you are on this trip"}
        </span>
      </div>
      <TextField value={yourName} onChange={setYourName} placeholder="your name" />
    </>
  );
}

const BUDGET_OPTIONS = ["small", "medium", "large"] as const;
type Budget = (typeof BUDGET_OPTIONS)[number];
const BUDGET_COSTS: Record<Budget, number> = { small: 2500, medium: 7000, large: 10000 };

function BudgetSection({ budget, setBudget, cost, setCost }: {
  budget: Budget; setBudget: (v: Budget) => void; cost: string; setCost: (v: string) => void;
}) {
  const active = BUDGET_OPTIONS.indexOf(budget);
  return (
    <>
      <SectionTitle title="your budget" subtitle="on a budget or no restraint" />
      <div className="relative h-[46px] w-full rounded-[23px] border border-ws-ink bg-ws-gray">
        <span
          className="absolute inset-y-[3px] rounded-[22px] bg-ws-ink transition-all"
          style={{ left: `calc(${active} * (100% - 6px) / 3 + 3px)`, width: "calc((100% - 6px) / 3)" }}
        />
        <div className="relative flex h-full">
          {BUDGET_OPTIONS.map((o) => (
            <button
              key={o}
              onClick={() => setBudget(o)}
              className={`flex-1 text-[17px] font-medium capitalize leading-5 tracking-[-0.43px] transition-colors ${o === budget ? "text-ws-bg" : "text-ws-ink"}`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full px-4">
        <div className="flex h-[52px] items-center border-t-2 border-ws-gray">
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

/* ---------- calendar (April 2027 starts on Thursday) ---------- */
function Calendar({ selected, onSelect, tone, min = 1 }: { selected: number; onSelect: (d: number) => void; tone: "olive" | "red"; min?: number }) {
  const cells = useMemo(() => [...Array(3).fill(null), ...Array.from({ length: 30 }, (_, i) => i + 1)], []);
  const today = new Date().getDate();
  return (
    <div className="w-full px-3">
      <div className="flex items-center justify-between pb-[3px] pl-2 pr-[6px] pt-[13px]">
        <div className="flex items-center gap-1">
          <span className="text-[17px] font-semibold leading-[22px] tracking-[-0.43px]">april 2027</span>
          <ChevronRight className="size-4 text-ws-red" strokeWidth={3} />
        </div>
        <div className="flex gap-7">
          <ChevronLeft className="size-6" />
          <ChevronRight className="size-6" />
        </div>
      </div>
      <div className="grid grid-cols-7 justify-items-center gap-y-[7px] px-0 py-2">
        {["sun", "mon", "wed", "thu", "fri", "sat", "sun"].map((d, i) => (
          <span key={i} className="h-5 text-[13px] font-semibold">{d}</span>
        ))}
        {cells.map((d, i) =>
          d === null ? <span key={i} className="size-[38px]" /> : (
            <button
              key={i}
              disabled={d < min}
              onClick={() => onSelect(d)}
              className={`flex size-[38px] items-center justify-center rounded-full text-[20px] tracking-[-0.45px] disabled:opacity-30 ${
                d === selected
                  ? tone === "olive"
                    ? "bg-ws-olive text-ws-bg"
                    : "bg-ws-red font-semibold text-ws-bg"
                  : d === today
                    ? "bg-white"
                    : ""
              }`}
            >
              {d}
            </button>
          ),
        )}
      </div>
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

function Dashboard({ onBack, guestName }: { onBack: () => void; guestName: string }) {
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

  const confirm = () => {
    if (adding && amount > 0) {
      setExpenses((xs) => [{ id: Date.now(), time: localTimeNow(), czk: amount, sek: amount * CZK_TO_SEK, who: adding }, ...xs]);
    }
    setAdding(null);
    setAmount(0);
  };

  const onPress = (who: "you" | "guest") => (adding === who ? confirm() : setAdding(who));

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-col items-center gap-3 px-6 pt-4">
        <header className="relative flex h-[54px] w-full items-start pb-[10px]">
          <button onClick={onBack} aria-label="back" className="flex size-11 items-center justify-center text-ws-orange">
            <ChevronLeft className="size-7" strokeWidth={2.25} />
          </button>
          <div className="absolute left-1/2 top-[6px] -translate-x-1/2 text-center">
            <p className="text-[15px] font-semibold leading-5 tracking-[-0.23px]">{fmt(BUDGET_SEK)} sek</p>
            <p className="whitespace-nowrap text-[12px] font-medium leading-4 text-ws-muted">your total expence budget</p>
          </div>
        </header>

        <section className="relative h-[178px] w-full rounded-[20px] bg-ws-gray pt-[6px] text-center">
          <p className="text-[17px] font-medium leading-7 tracking-[-0.43px]">sek spent of budget</p>
          <p className="text-[50px] font-bold leading-9 text-ws-olive tabular-nums">{fmt(totalSek)}</p>
          <p className="text-[17px] font-semibold leading-5 text-ws-bg">. . .</p>
          <p className="text-[17px] font-medium leading-7 tracking-[-0.43px]">sek spent today</p>
          <p className="text-[39px] font-medium leading-[31px] text-ws-flame tabular-nums">{fmt(todaySek)}</p>
          <ArrowUpRight className="absolute bottom-[20px] left-[20px] size-7 text-ws-flame" strokeWidth={1.5} />
          <Flame className="absolute bottom-[18px] right-[20px] size-7 text-ws-flame" strokeWidth={1.5} />
        </section>

        <div className="h-2" />
        {!adding && (
          <div className="w-full pb-[220px]">
            <Row className="text-[20px] leading-[25px] tracking-[-0.45px]" cells={["time", "czk", "sek"]} />
            {expenses.map((e) => (
              <Row key={e.id} className="text-[17px] leading-[22px] tracking-[-0.43px]" cells={[e.time, `${fmtComma(e.czk)} Kč`, `${fmtComma(e.sek)} kr`]} />
            ))}
          </div>
        )}
      </div>

      {adding && <AmountSheet amount={amount} setAmount={setAmount} onClose={() => { setAdding(null); setAmount(0); }} />}

      <div className="fixed bottom-0 left-1/2 grid h-[200px] w-full max-w-[402px] -translate-x-1/2 grid-cols-2 bg-ws-orange">
        <AddButton label="you" light active={adding === "you"} onClick={() => onPress("you")} />
        <AddButton label={guestLabel} active={adding === "guest"} onClick={() => onPress("guest")} />
      </div>
    </div>
  );
}

function Row({ cells, className }: { cells: string[]; className: string }) {
  return (
    <div className={`flex items-center justify-between border-b-2 border-ws-gray px-4 py-3 font-semibold ${className}`}>
      <span className="w-[50px]">{cells[0]}</span>
      <span className="w-[100px] text-right">{cells[1]}</span>
      <span className="w-[100px] text-right">{cells[2]}</span>
    </div>
  );
}

function AddButton({ label, light, active, onClick }: { label: string; light?: boolean; active: boolean; onClick: () => void }) {
  const color = light ? "text-ws-bg" : "text-ws-ink";
  return (
    <button onClick={onClick} className={`flex flex-col items-center pt-3 ${color} active:opacity-80`} aria-label={active ? `save ${label} expense` : `add ${label} expense`}>
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
function AmountSheet({ amount, setAmount, onClose }: { amount: number; setAmount: (n: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="fixed bottom-[200px] left-1/2 h-[337px] w-full max-w-[402px] -translate-x-1/2 overflow-hidden rounded-t-[20px] bg-ws-orange">
      <button onClick={onClose} aria-label="close" className="mx-auto mt-[13px] block h-1 w-[139px] bg-ws-bg" />
      <div className="mt-3 text-center text-[17px] leading-[22px]">
        <p className="font-medium">czk</p>
        <p className="text-[21px] font-semibold tabular-nums">{fmt(amount)}</p>
      </div>
      <div className="relative mt-[14px] h-[247px] border-y border-ws-ink bg-ws-gray">
        <div
          ref={ref}
          onScroll={(e) => setAmount(Math.max(0, Math.round((e.currentTarget.scrollLeft / PX) * 2) / 2))}
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
              <span key={i} className="absolute bottom-[30px] -translate-x-1/2 text-[13px]" style={{ left: 201 + i * 20 * PX }}>{i * 20}</span>
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
