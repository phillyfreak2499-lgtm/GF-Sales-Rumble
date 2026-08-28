import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RingCard } from "@/components/arena/ring";
import {
  ALL_MODULES,
  LOCKER_GAMES,
  modulesForWeek,
  recordFor,
  weekAcademyProgress,
  type QuizGrade,
  type TrainingModule,
  type TrainingRecord,
} from "@/lib/circuit/training";
import { FLOOR_GAMES } from "@/lib/circuit/floor-games";
import { completeTraining } from "@/lib/server/circuit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { weekAcceptsScores } from "@/lib/circuit/types";
import type { BoardPayload } from "@/lib/server/circuit";
import { cn } from "@/lib/utils";

type Phase = "slides" | "quiz" | "result";

export function AcademyStrip({
  academy,
  fighterId,
  currentWeek,
}: {
  academy: TrainingRecord[] | undefined;
  fighterId: string;
  currentWeek: number;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {[1, 2, 3, 4].map((w) => {
        const prog = weekAcademyProgress(academy, fighterId, w);
        const live = w === currentWeek;
        return (
          <li key={w}>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em]",
                prog.have >= prog.need && prog.need > 0
                  ? "border-sage/40 bg-sage/15 text-sage"
                  : live
                    ? "border-amber/40 bg-amber/10 text-amber"
                    : "border-line text-subtle",
              )}
            >
              {prog.have >= prog.need && prog.need > 0 ? <Check className="size-3" /> : <BookOpen className="size-3" />}
              W{w} {prog.have}/{prog.need}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Academy({
  board,
  fighterId,
  passcode,
  onBoard,
}: {
  board: BoardPayload;
  fighterId: string;
  passcode: string;
  onBoard: (next: BoardPayload) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const week = board.weeks.find((w) => w.weekNumber === board.circuit.currentWeek);
  const open = weekAcceptsScores(week?.status ?? "");

  return (
    <div className="space-y-6">
      <RingCard className="overflow-hidden p-0">
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <span className="grid size-14 shrink-0 place-items-center rounded-md bg-raised text-bone ring-1 ring-bone/30">
            <GraduationCap className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="kicker">Training · Blue Track</p>
            <h2 className="mt-1 font-display text-3xl italic leading-none">The academy</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Four trainings every week — sixteen on the card. Pass one this week for +1. Finish the
              other three so the locker stays sharp. Floor games are extra practice.
            </p>
          </div>
        </div>
      </RingCard>

      {openId ? (
        <ModulePlay
          module={ALL_MODULES.find((m) => m.id === openId)!}
          record={recordFor(board.academy, fighterId, openId)}
          passcode={passcode}
          bonusLive={open}
          currentWeek={board.circuit.currentWeek}
          onClose={() => setOpenId(null)}
          onBoard={onBoard}
        />
      ) : (
        <div className="space-y-8">
          <div>
            <p className="kicker">This period</p>
            <h3 className="mb-3 mt-2 font-display text-2xl italic">Weekly training</h3>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((w) => {
                const mods = modulesForWeek(w);
                const prog = weekAcademyProgress(board.academy, fighterId, w);
                const live = w === board.circuit.currentWeek;
                return (
                  <div key={w}>
                    <p className={cn("kicker", live && "!text-amber")}>
                      Week {w}
                      {live ? " · this week" : ""}
                      {prog.bonus ? " · +1 banked" : ""}
                      {" · "}
                      {prog.have}/{prog.need} passed
                    </p>
                    <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                      {mods.map((m) => (
                        <li key={m.id}>
                          <ModuleTile
                            module={m}
                            record={recordFor(board.academy, fighterId, m.id)}
                            live={live}
                            onOpen={() => setOpenId(m.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <p className="kicker">Practice</p>
            <h3 className="mb-3 mt-2 font-display text-2xl italic">Locker quizzes</h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {LOCKER_GAMES.map((m) => (
                <li key={m.id}>
                  <ModuleTile
                    module={m}
                    record={recordFor(board.academy, fighterId, m.id)}
                    live={false}
                    onOpen={() => setOpenId(m.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="kicker">Play</p>
            <h3 className="mb-3 mt-2 font-display text-2xl italic">Floor games</h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {FLOOR_GAMES.map((g) => (
                <li key={g.slug}>
                  <Link
                    to="/play/$slug"
                    params={{ slug: g.slug }}
                    className="block w-full rounded-xl border border-line bg-surface px-4 py-4 text-left transition-colors hover:bg-raised"
                  >
                    <p className="kicker">{g.kicker}</p>
                    <p className="mt-2 font-display text-2xl italic leading-tight">{g.title}</p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                      <Gamepad2 className="size-3.5" />
                      {g.blurb}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleTile({
  module,
  record,
  live,
  onOpen,
}: {
  module: TrainingModule;
  record: TrainingRecord | null;
  live: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-xl border border-line bg-surface px-4 py-4 text-left transition-colors hover:bg-raised"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="kicker">{module.kicker}</p>
        {record?.passed ? (
          <Badge tone="sage">Passed</Badge>
        ) : live ? (
          <Badge tone="bone">This week</Badge>
        ) : null}
      </div>
      <p className="mt-2 font-display text-2xl italic leading-tight">{module.title}</p>
      <p className="mt-2 flex items-center gap-2 text-sm text-muted">
        <BookOpen className="size-3.5" />
        {record?.passed
          ? `${record.correct}/${record.total}${record.awarded ? " · +1 banked" : ""}`
          : module.weekNumber
            ? "Read it, then take the quiz"
            : "Practice only"}
      </p>
    </button>
  );
}

function ModulePlay({
  module,
  record,
  passcode,
  bonusLive,
  currentWeek,
  onClose,
  onBoard,
}: {
  module: TrainingModule;
  record: TrainingRecord | null;
  passcode: string;
  bonusLive: boolean;
  currentWeek: number;
  onClose: () => void;
  onBoard: (next: BoardPayload) => void;
}) {
  const [phase, setPhase] = useState<Phase>("slides");
  const [slide, setSlide] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [picks, setPicks] = useState<number[]>(() => module.questions.map(() => -1));
  const [grade, setGrade] = useState<QuizGrade | null>(null);
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: (d: { passcode: string; moduleId: string; answers: number[] }) =>
      completeTraining({ data: d }),
  });

  const part = module.slides[slide];
  const question = module.questions[qIndex];
  const grantsBonus = module.weekNumber === currentWeek && bonusLive && !record?.awarded;

  function startQuiz() {
    setPicks(module.questions.map(() => -1));
    setQIndex(0);
    setGrade(null);
    setPhase("quiz");
  }

  function submit() {
    if (picks.some((p) => p < 0)) {
      toast.error("Answer every question before you send it to the desk.");
      return;
    }
    save.mutate(
      { passcode, moduleId: module.id, answers: picks },
      {
        onSuccess: (res) => {
          setGrade(res.grade);
          setPhase("result");
          onBoard(res.board);
          qc.invalidateQueries({ queryKey: ["board"] }).catch(() => undefined);
          if (res.grade.awarded && !res.grade.alreadyAwarded) {
            toast.success("Passed. +1 on this week’s card.");
          } else if (res.grade.passed) {
            toast.success(module.weekNumber ? "Passed." : "Practice complete. No bonus on locker quizzes.");
          } else {
            toast.error("Not enough. Run it again.");
          }
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <RingCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onClose} className="kicker text-subtle hover:text-fg">
          ← Academy
        </button>
        <Badge tone={grantsBonus ? "bone" : "steel"}>
          {grantsBonus ? "This week · +1 if you pass" : module.weekNumber ? `Week ${module.weekNumber}` : "Practice"}
        </Badge>
      </div>
      <h3 className="mt-3 font-display text-3xl italic">{module.title}</h3>
      <p className="mt-2 max-w-xl text-sm text-muted">{module.opener}</p>

      {phase === "slides" ? (
        <div className="mt-6">
          <p className="kicker">
            Part {slide + 1} / {module.slides.length}
          </p>
          <h4 className="mt-2 font-display text-2xl italic">{part.title}</h4>
          <p className="mt-3 text-sm leading-relaxed text-muted">{part.body}</p>
          {part.points?.length ? (
            <ul className="mt-4 space-y-2 text-sm text-fg">
              {part.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-bone" />
                  {p}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="outline" disabled={slide === 0} onClick={() => setSlide((s) => s - 1)}>
              <ChevronLeft className="size-4" /> Back
            </Button>
            {slide < module.slides.length - 1 ? (
              <Button onClick={() => setSlide((s) => s + 1)}>
                Next <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={startQuiz}>Take the quiz</Button>
            )}
          </div>
        </div>
      ) : null}

      {phase === "quiz" && question ? (
        <div className="mt-6">
          <p className="kicker">
            Question {qIndex + 1} / {module.questions.length}
          </p>
          <h4 className="mt-2 font-display text-2xl italic">{question.prompt}</h4>
          <ul className="mt-4 space-y-2">
            {question.choices.map((c, i) => {
              const on = picks[qIndex] === i;
              return (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() =>
                      setPicks((prev) => {
                        const next = [...prev];
                        next[qIndex] = i;
                        return next;
                      })
                    }
                    className={cn(
                      "w-full rounded-lg border px-4 py-3 text-left text-sm",
                      on ? "border-bone bg-bone/10" : "border-line bg-raised hover:bg-surface",
                    )}
                  >
                    {c}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="outline" disabled={qIndex === 0} onClick={() => setQIndex((q) => q - 1)}>
              <ChevronLeft className="size-4" /> Back
            </Button>
            {qIndex < module.questions.length - 1 ? (
              <Button disabled={picks[qIndex] < 0} onClick={() => setQIndex((q) => q + 1)}>
                Next <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button disabled={picks.some((p) => p < 0) || save.isPending} onClick={submit}>
                {save.isPending ? "Sending…" : "Send it in"}
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {phase === "result" && grade ? (
        <div className="mt-6">
          <p className="kicker">{grade.passed ? "Passed" : "Not yet"}</p>
          <h4 className="mt-2 font-display text-3xl italic">
            {grade.correct}/{grade.total}
            {grade.awarded && !grade.alreadyAwarded ? " · +1 banked" : ""}
          </h4>
          <ul className="mt-4 space-y-3">
            {grade.mark.map((m) => (
              <li key={m.index} className="rounded-lg border border-line bg-raised px-4 py-3 text-sm">
                <p className={m.ok ? "text-sage" : "text-rose"}>{m.ok ? "Right" : "Miss"}</p>
                <p className="mt-1 text-muted">{m.why}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="outline" onClick={onClose}>
              Back to academy
            </Button>
            {!grade.passed ? <Button onClick={startQuiz}>Try again</Button> : null}
          </div>
        </div>
      ) : null}
    </RingCard>
  );
}
