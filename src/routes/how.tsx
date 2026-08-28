import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ClipboardList,
  Flame,
  Home,
  Lock,
  Newspaper,
  Sparkles,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { Shell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChampionshipPlate, PageHead, RingCard, Ticket } from "@/components/arena/ring";
import { statusClass } from "@/components/board/pieces";
import { DEFAULT_METRICS, STATUS_POINTS } from "@/lib/circuit/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/how")({ component: HowPage });

const STEPS = [
  { id: "idea", n: "01", label: "The idea" },
  { id: "points", n: "02", label: "Points" },
  { id: "floors", n: "03", label: "Floors" },
  { id: "tour", n: "04", label: "Walk the site" },
  { id: "locker", n: "05", label: "My locker" },
  { id: "desk", n: "06", label: "The desk" },
] as const;

const COLORS: Array<{
  status: "green" | "blue" | "orange" | "red";
  name: string;
  pts: number;
  meaning: string;
}> = [
  { status: "green", name: "Green", pts: STATUS_POINTS.green, meaning: "Hit the goal. Best result." },
  { status: "blue", name: "Blue", pts: STATUS_POINTS.blue, meaning: "Close. Good week." },
  { status: "orange", name: "Orange", pts: STATUS_POINTS.orange, meaning: "Short of the goal." },
  { status: "red", name: "Red", pts: STATUS_POINTS.red, meaning: "Missed it. No points." },
];

const ROOMS: Array<{
  to: "/" | "/how" | "/card" | "/bouts" | "/roster" | "/report" | "/honors" | "/score" | "/desk";
  stop: string;
  label: string;
  where: string;
  icon: typeof Home;
  see: string;
  do: string;
  tone?: "amber" | "rose";
}> = [
  {
    to: "/",
    stop: "01",
    label: "Ring",
    where: "First button in the bar",
    icon: Home,
    see: "The poster, the three floor prizes, today’s tape, tonight’s main event, how many cards are in, and store heat.",
    do: "Start here when you want the picture of the whole building.",
  },
  {
    to: "/how",
    stop: "02",
    label: "How",
    where: "Next to Ring. You are here.",
    icon: BookOpen,
    see: "The rules, then this walkthrough — every page, every locker tab, every desk tool.",
    do: "Send this page to anyone new. If they can tap, they can play.",
  },
  {
    to: "/card",
    stop: "03",
    label: "Card",
    where: "Middle of the bar",
    icon: Trophy,
    see: "This week’s bracket, split by floor. Gold is Main Event. Blue is Redemption. Red is the Rumble.",
    do: "Find your name. That is who you wrestle. Flip weeks at the top to see last week.",
  },
  {
    to: "/bouts",
    stop: "04",
    label: "Bouts",
    where: "Next to Card",
    icon: Newspaper,
    see: "A short write-up of each match — records, hometowns, and the one fun fact.",
    do: "Read your preview before you mark a card. Recaps land after the week closes.",
  },
  {
    to: "/roster",
    stop: "05",
    label: "Locker",
    where: "The locker-room list",
    icon: Users,
    see: "Eleven real doors. Walk in. Lockers have names. Yours asks for a passcode.",
    do: "Tap your store. Paint the room if you work there. Open a locker inside.",
  },
  {
    to: "/report",
    stop: "06",
    label: "Gazette",
    where: "The weekly paper",
    icon: ClipboardList,
    see: "Previews before the week. Recaps after it locks. The site writes them.",
    do: "Nothing to fill in. Come read when the commissioner closes a week.",
  },
  {
    to: "/honors",
    stop: "07",
    label: "Heat",
    where: "Red in the bar",
    icon: Flame,
    see: "Heat number, ranks, plates, and weekly honors. MVP, Workhorse, Crowd Heat, Upset, Closest Bout.",
    do: "You do not pick these. They print from the scoresheet.",
    tone: "rose",
  },
  {
    to: "/score",
    stop: "08",
    label: "My locker",
    where: "Gold button. This is your room.",
    icon: BookOpen,
    see: "Passcode gate, then Academy, Stats, Card, Locker, and Belt.",
    do: "This is where you work every week. Details are in the next section.",
    tone: "amber",
  },
  {
    to: "/desk",
    stop: "09",
    label: "Desk",
    where: "Last button. Commissioner only.",
    icon: Lock,
    see: "Week, Roster, Codes, Academy, Seeds, Jobs, Settings.",
    do: "Unlock with the desk password. Details are in the last section.",
  },
];

const LOCKER_TABS = [
  {
    label: "Academy",
    icon: BookOpen,
    blurb: "Four trainings this week. Work through one, then take the quiz. Pass one for +1 on the card. Finish the other three so you stay sharp.",
  },
  {
    label: "Stats",
    icon: Trophy,
    blurb: "Record, period points, heat, and the full list of floor jobs. Check a job off for stars on the belt.",
  },
  {
    label: "Card",
    icon: ClipboardList,
    blurb: "Who you wrestle, and the five color buttons. Tap Green / Blue / Orange / Red on each goal. Add named 5-star reviews. Save.",
  },
  {
    label: "Locker",
    icon: UserRound,
    blurb: "Your name, nickname, hometown, and fun fact. Edit them here. The gazette uses what you write.",
  },
  {
    label: "Belt",
    icon: Sparkles,
    blurb: "Spend stars on paint, neon, gold. Win MVP and the Titantron is yours. Win MVP of the Week and the Titantron lights your locker — gold sash, not for sale.",
  },
  {
    label: "Crowd",
    icon: Sparkles,
    blurb: "Pick who wins each bout — right pick is a star. Send your opponent one canned promo. Set store and a five-word walk-out in Locker.",
  },
];

const DESK_TABS = [
  {
    label: "Week",
    blurb: "Seed and open week 1 — that is the bell. After that: lock scores, unlock if you must, then close the week so the next card writes itself.",
  },
  {
    label: "Roster",
    blurb: "Add a person. Paste a list. Remove anyone who leaves. Put them back if they return. They drop onto the rumble floor.",
  },
  {
    label: "Codes",
    blurb: "Every passcode on one sheet. Copy all. Print. Send each person their own. Rotate a code if it leaks.",
  },
  {
    label: "Academy",
    blurb: "Who passed which week. 2/4 +1 means they banked the bonus and still have trainings left.",
  },
  {
    label: "Seeds",
    blurb: "Drag the order before week 1. Highest seed wrestles the lowest.",
  },
  {
    label: "Jobs",
    blurb: "The floor-job pool. Add anything — sales, house, or team. Next week’s random deal can pull it.",
  },
  {
    label: "Settings",
    blurb: "Circuit name, the three prizes, the five goal labels, and the rolling message across the top of every page.",
  },
];

function HowPage() {
  return (
    <Shell>
      <PageHead
        kicker="Start here · anyone can follow this"
        title="How the Rumble works"
        lede="A four-week sales contest. Hit your goals. Beat the person across from you. This page walks the whole site — where each button lives, and what you do there."
        action={<Ticket>Four weeks · three floors</Ticket>}
      />

      <nav aria-label="Guide sections" className="mt-8 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
        {STEPS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-sm border border-line bg-surface px-3 text-sm text-muted hover:text-fg"
          >
            <span className="mr-2 text-[11px] uppercase tracking-[0.16em] text-bone">{s.n}</span>
            {s.label}
          </a>
        ))}
      </nav>

      <section id="idea" className="mt-12 scroll-mt-28">
        <p className="kicker">01 · The idea</p>
        <h2 className="mt-2 font-display text-4xl italic sm:text-5xl">Sell. Score. Advance.</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <RingCard>
            <p className="kicker">Each week</p>
            <p className="mt-3 font-display text-2xl italic">You wrestle one person</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Or a rumble, if you are on the last floor. Highest score wins the match.
            </p>
          </RingCard>
          <RingCard>
            <p className="kicker">If you win</p>
            <p className="mt-3 font-display text-2xl italic">You stay on that floor</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              If you lose, you drop one floor. One loss does not end you.
            </p>
          </RingCard>
          <RingCard>
            <p className="kicker">Week four</p>
            <p className="mt-3 font-display text-2xl italic">Each floor crowns a belt</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Finals are a rumble. Highest card on that floor wins the prize.
            </p>
          </RingCard>
        </div>
      </section>

      <section id="points" className="mt-16 scroll-mt-28">
        <p className="kicker">02 · Points</p>
        <h2 className="mt-2 font-display text-4xl italic sm:text-5xl">Colors are the whole math</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Every week you have five goals. You mark them in <span className="text-fg">My locker → Card</span>.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLORS.map((c) => (
            <li key={c.status}>
              <div className={cn("rounded-xl border px-4 py-5", statusClass(c.status, true))}>
                <p className="text-[11px] uppercase tracking-[0.16em]">{c.name}</p>
                <p className="mt-2 font-display text-5xl italic leading-none">{c.pts}</p>
                <p className="mt-2 text-sm opacity-80">{c.meaning}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <RingCard>
            <p className="kicker">The five goals</p>
            <ol className="mt-4 space-y-2">
              {DEFAULT_METRICS.map((m, i) => (
                <li key={m.key} className="flex items-center gap-3 text-sm">
                  <span className="tabular w-6 text-xs text-subtle">{String(i + 1).padStart(2, "0")}</span>
                  <span>{m.label}</span>
                </li>
              ))}
            </ol>
          </RingCard>
          <RingCard>
            <p className="kicker">Extra points</p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
              <li>
                <span className="text-fg">Extra greens.</span> First green is just the 3. Every green after that is
                +1. All five green = automatic win that week.
              </li>
              <li>
                <span className="text-fg">Reviews.</span> Each named five-star is +1. Three max.
              </li>
              <li>
                <span className="text-fg">Academy.</span> Four trainings every week. Pass one for +1. Floor games live under Play.
              </li>
              <li>
                <span className="text-fg">Stars.</span> Every floor job, every week. Check them off. Spend them on Belt.
              </li>
            </ul>
          </RingCard>
        </div>

        <RingCard className="mt-3 p-5 sm:p-7">
          <p className="kicker">One example</p>
          <h3 className="mt-2 font-display text-3xl italic">Three green, one blue, one orange</h3>
          <ol className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <li>
              <p className="text-subtle">Colors</p>
              <p className="mt-1 text-fg">3×3 + 2 + 1 = 12</p>
            </li>
            <li>
              <p className="text-subtle">Extra greens</p>
              <p className="mt-1 text-fg">Two extras = +2</p>
            </li>
            <li>
              <p className="text-subtle">Card</p>
              <p className="mt-1 font-display text-2xl italic text-fg">14 points</p>
            </li>
          </ol>
          <p className="mt-4 text-sm text-muted">
            Add reviews and the academy on top. Ties: greens, then blues, then reviews, then seed. A clean
            sweep beats anyone who is not a sweep.
          </p>
        </RingCard>
      </section>

      <section id="floors" className="mt-16 scroll-mt-28">
        <p className="kicker">03 · Floors</p>
        <h2 className="mt-2 font-display text-4xl italic sm:text-5xl">Three cards. One locker.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Everyone starts in Main Event. A loss drops you one floor. You keep wrestling until week four.
          Your floor is marked on your locker, the roster, and the Card page.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <ChampionshipPlate
            tone="amber"
            label="Floor 1 · Main Event"
            value="Stay by winning"
            hint="Title picture. One loss drops you to Floor 2."
          />
          <ChampionshipPlate
            tone="steel"
            label="Floor 2 · Redemption"
            value="One loss. Still alive."
            hint="Still fighting for second prize. Another loss drops you to Floor 3."
          />
          <ChampionshipPlate
            tone="rose"
            label="Floor 3 · Royal Rumble"
            value="Still on the card"
            hint="Three losses does not sit you. Highest score on this floor wins the rumble belt."
          />
        </div>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            { w: "Week 1", t: "Opening bell", d: "Everyone in Main Event. Highest seed vs lowest. Odd person out gets a bye." },
            { w: "Week 2", t: "First drop", d: "Winners stay. Losers drop to Redemption." },
            { w: "Week 3", t: "Last singles", d: "A second loss drops you into the Royal Rumble." },
            { w: "Week 4", t: "Finals rumble", d: "Each floor rumbles. Highest card on that floor wins that belt." },
          ].map((row) => (
            <li key={row.w}>
              <RingCard>
                <p className="kicker">{row.w}</p>
                <p className="mt-2 font-display text-2xl italic">{row.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{row.d}</p>
              </RingCard>
            </li>
          ))}
        </ol>
      </section>

      <section id="tour" className="mt-16 scroll-mt-28">
        <p className="kicker">04 · Walk the site</p>
        <h2 className="mt-2 font-display text-4xl italic sm:text-5xl">Look at the bar on top</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Those words are the whole building. Tap one. That is the page. The gold one is your locker. The
          red one is Heat. The last one is the commissioner desk.
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
          <p className="px-4 pt-3 text-[11px] uppercase tracking-[0.18em] text-subtle">The bar · left to right</p>
          <div className="flex gap-1 overflow-x-auto px-3 py-3">
            {ROOMS.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className={cn(
                  "shrink-0 rounded-sm px-3 py-2 text-sm",
                  r.label === "How" && "bg-raised text-fg",
                  r.tone === "amber" && "bg-amber/15 text-amber",
                  r.tone === "rose" && "text-rose/80",
                  !r.tone && r.label !== "How" && "text-muted",
                )}
              >
                {r.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-rose/30 bg-gradient-to-r from-rose/15 via-surface to-steel/15 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-bone">
            The moving line under the bar is the message board. The commissioner writes it in Desk → Settings.
          </div>
        </div>

        <ol className="mt-6 space-y-3">
          {ROOMS.map((r) => {
            const Icon = r.icon;
            return (
              <li key={r.to}>
                <RingCard className={cn(r.tone === "amber" && "bg-amber/5", r.tone === "rose" && "bg-rose/5")}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-bone">
                        <span className="tabular text-subtle">{r.stop}</span>
                        <Icon className="size-3.5" />
                        {r.label}
                      </p>
                      <p className="mt-2 font-display text-2xl italic">{r.where}</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        <span className="text-fg">You see: </span>
                        {r.see}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        <span className="text-fg">You do: </span>
                        {r.do}
                      </p>
                    </div>
                    {r.to !== "/how" ? (
                      <Button asChild variant={r.tone === "amber" ? "default" : "outline"} className="shrink-0">
                        <Link to={r.to}>Open {r.label}</Link>
                      </Button>
                    ) : (
                      <Badge tone="bone">You are here</Badge>
                    )}
                  </div>
                </RingCard>
              </li>
            );
          })}
        </ol>
      </section>

      <section id="locker" className="mt-16 scroll-mt-28">
        <p className="kicker">05 · My locker</p>
        <h2 className="mt-2 font-display text-4xl italic sm:text-5xl">Your room. Five doors.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Tap the gold <span className="text-amber">My locker</span> in the bar. Type the passcode the
          commissioner sent you. It looks like <span className="text-fg">BELL-47</span>. That opens only
          your locker.
        </p>
        <ol className="mt-6 grid gap-3 lg:grid-cols-2">
          {LOCKER_TABS.map((t, i) => {
            const Icon = t.icon;
            return (
              <li key={t.label}>
                <RingCard>
                  <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-amber">
                    <span className="tabular text-subtle">{String(i + 1).padStart(2, "0")}</span>
                    <Icon className="size-3.5" />
                    {t.label}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{t.blurb}</p>
                </RingCard>
              </li>
            );
          })}
        </ol>
        <RingCard className="mt-3 p-5 sm:p-7">
          <p className="kicker">A normal week in the locker</p>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <li>
              <span className="text-fg">1. Academy.</span> Work through this week’s trainings. Pass one quiz. +1 lands on the card. Scroll to Floor games for Showdown, Keep the Client, Roleplay, Case File, Fit Clue, ArchQuest, and Floor Commander.
              card.
              card.
            </li>
            <li>
              <span className="text-fg">2. Card.</span> Tap the five colors. Add reviews if you have them. Save.
              Change them until the week is locked.
            </li>
            <li>
              <span className="text-fg">3. Stats.</span> Check off floor jobs — all of them count. Stars hit the belt.
            </li>
            <li>
              <span className="text-fg">4. Crowd.</span> Pick the card. Send one promo. Right picks become stars.
            </li>
            <li>
              <span className="text-fg">5. Belt.</span> Spend stars on paint, neon, gold. Win MVP and the Titantron is yours.
            </li>
            <li>
              <span className="text-fg">6. Locker.</span> Name, store, five-word walk-out, hometown, fun fact. Print locker prints the poster and the score cards.
            </li>
          </ol>
          <Button asChild className="mt-6" size="lg">
            <Link to="/score">Open my locker</Link>
          </Button>
        </RingCard>
      </section>

      <section id="desk" className="mt-16 scroll-mt-28">
        <p className="kicker">06 · The desk</p>
        <h2 className="mt-2 font-display text-4xl italic sm:text-5xl">Commissioner tools</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Last button in the bar. Unlock with the commissioner password. The tabs under the title are the
          whole job.
        </p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {DESK_TABS.map((t, i) => (
            <li key={t.label}>
              <RingCard>
                <p className="kicker">
                  {String(i + 1).padStart(2, "0")} · {t.label}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{t.blurb}</p>
              </RingCard>
            </li>
          ))}
        </ol>
        <RingCard className="mt-3 border-amber/40 bg-amber/10 p-5 sm:p-7">
          <p className="kicker !text-amber">The one button that starts the rumble</p>
          <h3 className="mt-2 font-display text-3xl italic">Desk → Week → Seed and open week 1</h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            People on the book is not enough. Pairings, the gazette, and lockers do not start until you
            press that. After the week is done: lock scores, then close the week. Winners stay. Losers
            drop. Next week writes itself.
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link to="/desk">Open the desk</Link>
          </Button>
        </RingCard>
        <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted">
          Desk can drop a challenge (first three get a stamp) and name a babyface and a heel. Floor 3 can pick up the lost-and-found belt. Colors in. Last card reseeds. If you only remember one
          thing: green is three, all green wins the week, and My locker is where you work.
        </p>
      </section>
    </Shell>
  );
}
