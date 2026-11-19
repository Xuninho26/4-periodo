"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Code2,
  FileText,
  ListChecks,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { DisciplineId } from "@/types/labcs";
import {
  ExamAnswerRecord,
  ExamFinalReport,
  QuestionKind,
} from "@/types/exam";
import {
  buildExamFinalReport,
  EXAM_QUESTION_BANK,
  scoreQuestion,
} from "@/lib/examEngine";

type FilterDiscipline = "all" | DisciplineId;

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function TimedExamMode() {
  const [filterDiscipline, setFilterDiscipline] =
    useState<FilterDiscipline>("all");
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(
    20 * 60
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(20 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        selectedOptionIndex?: number;
        textAnswer: string;
        codeAnswer: string;
      }
    >
  >({});

  const [report, setReport] = useState<ExamFinalReport | null>(null);

  const activeQuestions = useMemo(() => {
    const base =
      filterDiscipline === "all"
        ? EXAM_QUESTION_BANK
        : EXAM_QUESTION_BANK.filter((q) => q.discipline === filterDiscipline);

    return base.map((q) => ({
      ...q,
      codeAnswer: q.starterCode ?? "",
    }));
  }, [filterDiscipline]);

  const currentQuestion = activeQuestions[currentIndex];

  const getDraftForQuestion = useCallback(
    (qId: string, starterCode = "") => {
      return (
        drafts[qId] || {
          selectedOptionIndex: undefined,
          textAnswer: "",
          codeAnswer: starterCode,
        }
      );
    },
    [drafts]
  );

  const handleFinishExam = useCallback(() => {
    setIsRunning(false);
    const scoredMap: Record<string, ExamAnswerRecord> = {};

    for (const q of activeQuestions) {
      const d = getDraftForQuestion(q.id, q.starterCode || "");
      scoredMap[q.id] = scoreQuestion(q, d);
    }

    const used = Math.max(0, totalDurationSeconds - remainingSeconds);
    setReport(buildExamFinalReport(activeQuestions, scoredMap, used));
  }, [activeQuestions, getDraftForQuestion, remainingSeconds, totalDurationSeconds]);

  useEffect(() => {
    if (!isRunning || report) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, report, handleFinishExam]);

  function handleResetExam(
    nextFilter: FilterDiscipline = filterDiscipline,
    nextMinutes = Math.round(totalDurationSeconds / 60)
  ) {
    const secs = nextMinutes * 60;
    setFilterDiscipline(nextFilter);
    setTotalDurationSeconds(secs);
    setRemainingSeconds(secs);
    setIsRunning(true);
    setCurrentIndex(0);
    setDrafts({});
    setReport(null);
  }

  function updateDraft(
    qId: string,
    starterCode: string,
    patch: Partial<{
      selectedOptionIndex: number;
      textAnswer: string;
      codeAnswer: string;
    }>
  ) {
    setDrafts((prev) => {
      const existing = prev[qId] || {
        selectedOptionIndex: undefined,
        textAnswer: "",
        codeAnswer: starterCode,
      };
      return {
        ...prev,
        [qId]: { ...existing, ...patch },
      };
    });
  }

  function kindBadge(kind: QuestionKind) {
    if (kind === "objetiva") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-sky-950 px-2.5 py-1 text-xs font-medium text-sky-300 border border-sky-800">
          <ListChecks className="h-3.5 w-3.5" />
          Objetiva
        </span>
      );
    }
    if (kind === "discursiva") {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-950 px-2.5 py-1 text-xs font-medium text-purple-300 border border-purple-800">
          <FileText className="h-3.5 w-3.5" />
          Discursiva
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950 px-2.5 py-1 text-xs font-medium text-emerald-300 border border-emerald-800">
        <Code2 className="h-3.5 w-3.5" />
        Código
      </span>
    );
  }

  if (report) {
    return (
      <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/20 p-3 text-amber-300">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Relatório Final do Simulado por Disciplina
              </h2>
              <p className="text-xs text-slate-400">
                Tempo utilizado: {formatClock(report.durationUsedSeconds)} •
                Aproveitamento geral: {report.overallAccuracyPct}% (
                {report.totalScore}/{report.maxScore} pts)
              </p>
            </div>
          </div>

          <button
            onClick={() => handleResetExam()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <RotateCcw className="h-4 w-4" />
            Novo Simulado
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {report.byDiscipline.map((disc) => (
            <div
              key={disc.discipline}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{disc.label}</h3>
                <span className="rounded-full bg-indigo-950 px-2.5 py-0.5 text-xs font-bold text-indigo-300 border border-indigo-800">
                  {disc.accuracyPct}%
                </span>
              </div>

              <div className="text-xs text-slate-400">
                Pontuação:{" "}
                <strong className="text-slate-200">
                  {disc.score}/{disc.maxScore}
                </strong>{" "}
                • Respondidas:{" "}
                <strong className="text-slate-200">
                  {disc.answeredCount}/{disc.totalQuestions}
                </strong>
              </div>

              <div className="text-xs">
                <span className="font-semibold text-emerald-400">
                  Pontos fortes:
                </span>{" "}
                <span className="text-slate-300">
                  {disc.strengths.length > 0
                    ? disc.strengths.join(", ")
                    : "Nenhum tópico acima de 70% ainda"}
                </span>
              </div>

              <div className="text-xs">
                <span className="font-semibold text-amber-400">
                  Revisar:
                </span>{" "}
                <span className="text-slate-300">
                  {disc.reviewTopics.length > 0
                    ? disc.reviewTopics.join(", ")
                    : "Sem pendências críticas"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Correção Detalhada por Questão
          </h3>

          {report.details.map(({ question, answer }, idx) => (
            <div
              key={question.id}
              className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <span>Questão {idx + 1}</span>
                  <span>•</span>
                  <span>{question.topic}</span>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                    answer.score >= 70
                      ? "bg-emerald-950 text-emerald-300"
                      : "bg-amber-950 text-amber-300"
                  }`}
                >
                  {answer.score}/{answer.maxScore} pts
                </span>
              </div>
              <p className="text-sm text-slate-200">{question.statement}</p>
              <p className="text-xs text-slate-400">{answer.feedback}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const currentDraft = getDraftForQuestion(
    currentQuestion.id,
    currentQuestion.starterCode || ""
  );

  return (
    <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterDiscipline}
            onChange={(e) =>
              handleResetExam(e.target.value as FilterDiscipline)
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-white"
          >
            <option value="all">Simulado Geral (BD + POO Java + ED III)</option>
            <option value="db">Apenas Banco de Dados</option>
            <option value="oop_java">Apenas POO (Java)</option>
            <option value="ds3">Apenas Estrutura de Dados III</option>
          </select>

          <select
            value={Math.round(totalDurationSeconds / 60)}
            onChange={(e) =>
              handleResetExam(filterDiscipline, Number(e.target.value))
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-white"
          >
            <option value={15}>15 min</option>
            <option value={20}>20 min</option>
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold ${
              remainingSeconds <= 120
                ? "border-rose-700 bg-rose-950/70 text-rose-300"
                : "border-slate-700 bg-slate-950 text-indigo-300"
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatClock(remainingSeconds)}
          </div>

          <button
            onClick={() => setIsRunning((r) => !r)}
            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-200 hover:bg-slate-700"
            title={isRunning ? "Pausar cronômetro" : "Retomar cronômetro"}
          >
            {isRunning ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={handleFinishExam}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            <CheckCircle2 className="h-4 w-4" />
            Finalizar Prova
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {activeQuestions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(idx)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              idx === currentIndex
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Q{idx + 1}
          </button>
        ))}
      </div>

      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-indigo-400">
            {currentQuestion.topic} • Questão {currentIndex + 1} de{" "}
            {activeQuestions.length}
          </span>
          {kindBadge(currentQuestion.kind)}
        </div>

        <p className="text-base leading-relaxed text-white">
          {currentQuestion.statement}
        </p>

        {currentQuestion.kind === "objetiva" && currentQuestion.options && (
          <div className="space-y-2.5">
            {currentQuestion.options.map((opt, optIdx) => {
              const selected = currentDraft.selectedOptionIndex === optIdx;
              return (
                <button
                  key={optIdx}
                  onClick={() =>
                    updateDraft(currentQuestion.id, "", {
                      selectedOptionIndex: optIdx,
                    })
                  }
                  className={`w-full rounded-xl border p-3.5 text-left text-sm transition ${
                    selected
                      ? "border-indigo-500 bg-indigo-950/60 text-white"
                      : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <strong className="mr-2 text-indigo-300">
                    {String.fromCharCode(65 + optIdx)})
                  </strong>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {currentQuestion.kind === "discursiva" && (
          <textarea
            rows={5}
            value={currentDraft.textAnswer}
            onChange={(e) =>
              updateDraft(currentQuestion.id, "", {
                textAnswer: e.target.value,
              })
            }
            placeholder="Escreva sua justificativa técnica e exemplo conceitual..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
        )}

        {currentQuestion.kind === "codigo" && (
          <textarea
            rows={8}
            value={currentDraft.codeAnswer}
            onChange={(e) =>
              updateDraft(currentQuestion.id, "", {
                codeAnswer: e.target.value,
              })
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3.5 font-mono text-xs text-emerald-300 focus:border-indigo-500 focus:outline-none"
          />
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 disabled:opacity-40"
          >
            Anterior
          </button>

          {currentIndex < activeQuestions.length - 1 ? (
            <button
              onClick={() =>
                setCurrentIndex((i) =>
                  Math.min(activeQuestions.length - 1, i + 1)
                )
              }
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Próxima Questão
            </button>
          ) : (
            <button
              onClick={handleFinishExam}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Concluir e Gerar Relatório
            </button>
          )}
        </div>
      </div>

      {remainingSeconds <= 120 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-800 bg-amber-950/50 p-3 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          Restam menos de 2 minutos. Ao encerrar o tempo, o simulado é corrigido automaticamente e o relatório separado por disciplina é exibido.
        </div>
      )}
    </div>
  );
}
