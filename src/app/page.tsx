"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Bot,
  CheckCircle2,
  Code2,
  Database,
  FileText,
  GitBranch,
  Layers,
  Send,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  DisciplineId,
  LearningStage,
  ProgressRecord,
  StudyMaterialItem,
  TopicModule,
  TutorMode,
} from "@/types/labcs";
import { evaluateStudentSubmission } from "@/lib/evaluators";
import { supabase } from "@/lib/supabase";
import TimedExamMode from "@/components/TimedExamMode";

const STAGES: { id: LearningStage; label: string }[] = [
  { id: "introducao", label: "1. Introdução" },
  { id: "explicacao", label: "2. Explicação" },
  { id: "exemplo", label: "3. Exemplo" },
  { id: "pratica_guiada", label: "4. Prática Guiada" },
  { id: "exercicio", label: "5. Exercício" },
  { id: "desafio", label: "6. Desafio" },
  { id: "avaliacao", label: "7. Avaliação" },
];

const TOPICS: TopicModule[] = [
  {
    id: "db-relacional-sql",
    discipline: "db",
    title: "Modelagem Relacional, Chaves e JOINs (Sistema de Biblioteca)",
    summary:
      "Identificação de entidades, PK/FK, normalização e consultas relacionais sobre empréstimos de livros.",
    theory:
      "Em um sistema de biblioteca, Leitor, Livro e Emprestimo são entidades centrais. Como um empréstimo pode conter vários livros e um livro pode aparecer em vários empréstimos, surge uma tabela associativa (ex: ItemEmprestimo) com chaves estrangeiras para evitar redundância e garantir integridade referencial.",
    exampleLabel: "Consulta SQL com JOIN para empréstimos atrasados",
    exampleCode: `SELECT l.nome, li.titulo, e.data_retirada
FROM Emprestimo e
JOIN Leitor l ON l.id_leitor = e.id_leitor
JOIN ItemEmprestimo ie ON ie.id_emprestimo = e.id_emprestimo
JOIN Livro li ON li.id_livro = ie.id_livro
WHERE e.data_prevista < CURRENT_DATE;`,
    promptQuestion:
      "Explique por que Emprestimo e Livro precisam de tabela associativa e escreva ou descreva como relacionar as chaves primárias e estrangeiras.",
    expectedKeywords: ["associativa", "chave", "estrangeira", "fk", "pk", "emprestimo", "livro"],
    minScoreToAdvance: 60,
  },
  {
    id: "oop-java-heranca-polimorfismo",
    discipline: "oop_java",
    title: "Encapsulamento, Herança e Polimorfismo em Java",
    summary:
      "Proteção de estado com private/getters, reuso por herança e despacho dinâmico com sobrescrita de métodos.",
    theory:
      "Em Java, o encapsulamento protege atributos como saldo ou limite por meio de modificadores private e métodos controlados. Classes abstratas e herança (extends) permitem compartilhar estado e definir comportamentos sobrescritos (@Override) com polimorfismo em tempo de execução.",
    exampleLabel: "Classe abstrata e subclasse em Java",
    exampleCode: `public abstract class Conta {
    private double saldo;
    public Conta(double saldo) { this.saldo = Math.max(0, saldo); }
    public double getSaldo() { return saldo; }
    protected void debitar(double valor) {
        if (valor > 0 && valor <= saldo) saldo -= valor;
    }
    public abstract double calcularTarifa();
}`,
    promptQuestion:
      "Escreva ou explique uma classe em Java com atributo private, construtor, getter e um método sobrescrito (@Override) demonstrando polimorfismo.",
    expectedKeywords: ["private", "class", "override", "get", "public"],
    minScoreToAdvance: 60,
  },
  {
    id: "ds3-avl-balanceamento-grafos",
    discipline: "ds3",
    title: "Árvores AVL, Fator de Balanceamento e Rotações",
    summary:
      "Manutenção de altura O(log n) em árvores binárias de busca por meio de fator de balanceamento e rotações simples/duplas.",
    theory:
      "Em uma árvore AVL, o fator de balanceamento de um nó é FB = altura(esquerda) - altura(direita), devendo permanecer em {-1, 0, 1}. Quando uma inserção ou remoção rompe esse intervalo, aplicam-se rotações simples (LL/RR) ou duplas (LR/RL) preservando a ordenação em percurso em-ordem (in-order).",
    exampleLabel: "Rotação simples à direita (caso LL)",
    exampleCode: `// Quando FB(no) > 1 e chave inserida < no.esquerda.chave:
// 1. Filho esquerdo vira nova raiz da subárvore
// 2. Nó antigo vira filho direito do novo topo
// 3. Recalcula alturas e fatores de balanceamento (FB)`,
    promptQuestion:
      "Explique como calcular o fator de balanceamento (FB) de um nó em uma árvore AVL e quando ocorre uma rotação simples ou dupla.",
    expectedKeywords: ["altura", "balanceamento", "rotacao", "esquerda", "direita"],
    minScoreToAdvance: 60,
  },
];

export default function LabCSPage() {
  const [viewMode, setViewMode] = useState<"lab" | "exam">("lab");
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineId>("db");
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [studentAnswer, setStudentAnswer] = useState<string>("");
  const [labCode, setLabCode] = useState<string>(TOPICS[0].exampleCode);
  const [lastEval, setLastEval] = useState<ReturnType<typeof evaluateStudentSubmission> | null>(
    null
  );

  const [avlKeys, setAvlKeys] = useState<number[]>([30, 20, 10]);
  const [newAvlKey, setNewAvlKey] = useState<string>("5");
  const [avlLog, setAvlLog] = useState<string[]>([
    "Inseridos 30 -> 20 -> 10: desbalanceamento LL detectado em 30; rotação simples à direita alinha 20 como raiz local.",
  ]);

  const [progressList, setProgressList] = useState<ProgressRecord[]>([
    {
      discipline: "db",
      topicId: "db-relacional-sql",
      stage: "introducao",
      score: 75,
      maxScore: 100,
      updatedAt: new Date().toISOString(),
    },
    {
      discipline: "oop_java",
      topicId: "oop-java-heranca-polimorfismo",
      stage: "introducao",
      score: 65,
      maxScore: 100,
      weaknessTag: "Sobrescrita (@Override)",
      updatedAt: new Date().toISOString(),
    },
    {
      discipline: "ds3",
      topicId: "ds3-avl-balanceamento-grafos",
      stage: "introducao",
      score: 70,
      maxScore: 100,
      weaknessTag: "Rotações duplas",
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [materials, setMaterials] = useState<StudyMaterialItem[]>([
    {
      id: "mat-1",
      discipline: "db",
      title: "Apostila de Modelagem e SQL",
      sourceLabel: "Unidade 2 - Integridade Referencial e JOINs",
      content:
        "Chaves estrangeiras garantem integridade referencial entre tabelas. Relacionamentos N:N exigem tabela associativa.",
    },
  ]);
  const [matTitle, setMatTitle] = useState("");
  const [matSection, setMatSection] = useState("");
  const [matContent, setMatContent] = useState("");

  const [tutorMode, setTutorMode] = useState<TutorMode>("professor");
  const [tutorInput, setTutorInput] = useState("");
  const [tutorMessages, setTutorMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([
    {
      role: "assistant",
      text: "Olá! Sou seu professor particular no LabCS. Escolha um assunto, registre sua tentativa no laboratório e pergunte sempre que quiser revisar um conceito ou analisar seu código.",
    },
  ]);
  const [loadingTutor, setLoadingTutor] = useState(false);

  const currentTopic = useMemo(
    () => TOPICS.find((t) => t.discipline === selectedDiscipline) || TOPICS[0],
    [selectedDiscipline]
  );

  const currentStage = STAGES[selectedStageIndex];

  useEffect(() => {
    setLabCode(currentTopic.exampleCode);
    setLastEval(null);
    setStudentAnswer("");
    setSelectedStageIndex(0);
  }, [currentTopic]);

  const statsByDiscipline = useMemo(() => {
    const map: Record<DisciplineId, { count: number; avg: number; weaknesses: string[] }> = {
      db: { count: 0, avg: 0, weaknesses: [] },
      oop_java: { count: 0, avg: 0, weaknesses: [] },
      ds3: { count: 0, avg: 0, weaknesses: [] },
    };

    (["db", "oop_java", "ds3"] as DisciplineId[]).forEach((disc) => {
      const items = progressList.filter((p) => p.discipline === disc);
      if (items.length > 0) {
        const sum = items.reduce((acc, item) => acc + item.score, 0);
        map[disc].count = items.length;
        map[disc].avg = Math.round(sum / items.length);
        map[disc].weaknesses = items
          .map((i) => i.weaknessTag)
          .filter((w): w is string => Boolean(w));
      }
    });

    return map;
  }, [progressList]);

  async function persistProgress(record: ProgressRecord) {
    setProgressList((prev) => [...prev, record]);
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("exercise_attempts").insert({
      user_id: user.id,
      exercise_id: "00000000-0000-0000-0000-000000000000",
      score: record.score,
      max_score: record.maxScore,
      accuracy_pct: record.score,
      duration_seconds: 60,
      error_breakdown: { discipline: record.discipline, stage: record.stage },
      submitted_answers: { answer: studentAnswer, code: labCode },
    });
  }

  async function handleEvaluateAndAdvance() {
    const combined = `${studentAnswer}\n${labCode}`;
    const result = evaluateStudentSubmission(combined, currentTopic.expectedKeywords);
    setLastEval(result);

    if (!result.passed) {
      return;
    }

    await persistProgress({
      discipline: selectedDiscipline,
      topicId: currentTopic.id,
      stage: currentStage.id,
      score: result.score,
      maxScore: result.maxScore,
      weaknessTag: result.missingConcepts[0],
      updatedAt: new Date().toISOString(),
    });

    if (selectedStageIndex < STAGES.length - 1) {
      setSelectedStageIndex((idx) => idx + 1);
      setStudentAnswer("");
    }
  }

  function handleAddMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (!matTitle.trim() || !matContent.trim()) return;
    setMaterials((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        discipline: selectedDiscipline,
        title: matTitle.trim(),
        sourceLabel: matSection.trim() || "Material enviado pelo aluno",
        content: matContent.trim(),
      },
    ]);
    setMatTitle("");
    setMatSection("");
    setMatContent("");
  }

  function handleInsertAvlKey() {
    const parsed = Number(newAvlKey);
    if (Number.isNaN(parsed)) return;
    const updated = [...avlKeys, parsed];
    setAvlKeys(updated);
    setAvlLog((prev) => [
      ...prev,
      `Inserida chave ${parsed}. Sequência atual: [${updated.join(", ")}] | Em-ordem: [${[...updated]
        .sort((a, b) => a - b)
        .join(" -> ")}]. Verifique altura e FB de cada ancestral.`,
    ]);
  }

  function handleRotateAvl(type: "Simples Esquerda" | "Simples Direita" | "Dupla LR" | "Dupla RL") {
    setAvlLog((prev) => [
      ...prev,
      `Operação ${type} aplicada sobre o subconjunto [${avlKeys.join(", ")}]: ponteiros reajustados mantendo propriedade de busca e reequilibrando FB.`,
    ]);
  }

  async function handleSendToTutor(e: React.FormEvent) {
    e.preventDefault();
    if (!tutorInput.trim() || loadingTutor) return;

    const question = tutorInput.trim();
    const nextHistory = [...tutorMessages, { role: "user" as const, text: question }];
    setTutorMessages(nextHistory);
    setTutorInput("");
    setLoadingTutor(true);

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discipline: selectedDiscipline,
          topicTitle: currentTopic.title,
          stage: currentStage.label,
          mode: tutorMode,
          studentInput: question,
          studentCode: labCode,
          materials: materials.filter((m) => m.discipline === selectedDiscipline),
          history: nextHistory,
          weakTopics: statsByDiscipline[selectedDiscipline].weaknesses,
        }),
      });

      const data = await res.json();
      setTutorMessages([
        ...nextHistory,
        {
          role: "assistant",
          text: data.reply || data.error || "Sem resposta do agente.",
        },
      ]);
    } catch {
      setTutorMessages([
        ...nextHistory,
        {
          role: "assistant",
          text: "Erro de rede ao consultar o professor de IA. Verifique a rota /api/tutor e sua GEMINI_API_KEY.",
        },
      ]);
    } finally {
      setLoadingTutor(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-600 p-2">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">LabCS</h1>
              <p className="text-xs text-slate-400">
                Ambiente Inteligente de Estudos • BD, POO (Java) &amp; Estrutura de Dados III
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setViewMode("lab");
                  setSelectedDiscipline("db");
                }}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  viewMode === "lab" && selectedDiscipline === "db"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Database className="h-4 w-4" />
                Banco de Dados
              </button>
              <button
                onClick={() => {
                  setViewMode("lab");
                  setSelectedDiscipline("oop_java");
                }}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  viewMode === "lab" && selectedDiscipline === "oop_java"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Code2 className="h-4 w-4" />
                POO (Java)
              </button>
              <button
                onClick={() => {
                  setViewMode("lab");
                  setSelectedDiscipline("ds3");
                }}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  viewMode === "lab" && selectedDiscipline === "ds3"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <GitBranch className="h-4 w-4" />
                Estrutura de Dados III
              </button>
            </nav>

            <button
              onClick={() => setViewMode(viewMode === "exam" ? "lab" : "exam")}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                viewMode === "exam"
                  ? "border-amber-500 bg-amber-600 text-white"
                  : "border-amber-700/60 bg-amber-950/40 text-amber-300 hover:bg-amber-950/70"
              }`}
            >
              {viewMode === "exam" ? "Voltar ao Laboratório" : "Simulado Cronometrado"}
            </button>
          </div>
        </div>
      </header>

      {viewMode === "exam" ? (
        <main className="mx-auto max-w-6xl p-6">
          <TimedExamMode />
        </main>
      ) : (
        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-12">
          <section className="space-y-6 lg:col-span-7">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Trilha de Aprendizagem do Assunto
                </span>
                <span className="text-xs text-slate-400">
                  Etapa {selectedStageIndex + 1} de {STAGES.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map((st, idx) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStageIndex(idx)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      idx === selectedStageIndex
                        ? "bg-indigo-600 text-white"
                        : idx < selectedStageIndex
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">{currentTopic.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{currentTopic.summary}</p>
                </div>
                <BookOpen className="h-5 w-5 shrink-0 text-indigo-400" />
              </div>

              <div className="rounded-lg bg-slate-950/80 p-4 text-sm leading-relaxed text-slate-200 border border-slate-800">
                <strong className="block mb-1 text-indigo-300">{currentStage.label}:</strong>
                {currentTopic.theory}
              </div>

              <div>
                <div className="mb-1.5 text-xs font-medium text-slate-400">
                  Exemplo de Referência — {currentTopic.exampleLabel}
                </div>
                <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3.5 text-xs text-emerald-300 border border-slate-800">
                  <code>{currentTopic.exampleCode}</code>
                </pre>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <h3 className="text-base font-semibold text-white">
                Laboratório Prático — {currentStage.label}
              </h3>

              {selectedDiscipline === "ds3" && (
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      value={newAvlKey}
                      onChange={(e) => setNewAvlKey(e.target.value)}
                      className="w-24 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm"
                      placeholder="Chave"
                    />
                    <button
                      onClick={handleInsertAvlKey}
                      className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                    >
                      Inserir Nó na Árvore
                    </button>
                    {(["Simples Direita", "Simples Esquerda", "Dupla LR", "Dupla RL"] as const).map(
                      (rot) => (
                        <button
                          key={rot}
                          onClick={() => handleRotateAvl(rot)}
                          className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
                        >
                          {rot}
                        </button>
                      )
                    )}
                  </div>

                  <div className="text-xs text-slate-300">
                    <strong>Chaves atuais:</strong> [{avlKeys.join(" • ")}]
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-1 text-xs text-slate-400">
                    {avlLog.map((entry, i) => (
                      <div key={i}>• {entry}</div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  {currentTopic.promptQuestion}
                </label>
                <textarea
                  rows={3}
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Escreva sua análise, modelagem ou explicação antes de avançar..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Código / Consulta / Implementação no Laboratório
                </label>
                <textarea
                  rows={6}
                  value={labCode}
                  onChange={(e) => setLabCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {lastEval && (
                <div
                  className={`rounded-lg border p-3 text-xs ${
                    lastEval.passed
                      ? "border-emerald-800 bg-emerald-950/50 text-emerald-200"
                      : "border-amber-800 bg-amber-950/50 text-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    Avaliação: {lastEval.score}/{lastEval.maxScore}
                  </div>
                  <p className="mt-1">{lastEval.feedback}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleEvaluateAndAdvance}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  <Sparkles className="h-4 w-4" />
                  Avaliar Resposta e Avançar
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-6 lg:col-span-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  Desempenho por Disciplina
                </h3>
                <span className="text-xs text-slate-400">Sem misturar métricas</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {(["db", "oop_java", "ds3"] as DisciplineId[]).map((disc) => {
                  const label =
                    disc === "db" ? "BD" : disc === "oop_java" ? "POO Java" : "ED III";
                  const info = statsByDiscipline[disc];
                  return (
                    <div
                      key={disc}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-2.5"
                    >
                      <div className="text-xs font-medium text-slate-400">{label}</div>
                      <div className="mt-1 text-base font-bold text-indigo-400">{info.avg}%</div>
                      <div className="text-[11px] text-slate-500">{info.count} registros</div>
                    </div>
                  );
                })}
              </div>

              {statsByDiscipline[selectedDiscipline].weaknesses.length > 0 && (
                <div className="text-xs text-amber-300">
                  <strong>Foco de revisão ({selectedDiscipline}):</strong>{" "}
                  {statsByDiscipline[selectedDiscipline].weaknesses.join(", ")}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Bot className="h-4 w-4 text-indigo-400" />
                  Professor Particular (IA)
                </h3>
                <select
                  value={tutorMode}
                  onChange={(e) => setTutorMode(e.target.value as TutorMode)}
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                >
                  <option value="professor">Professor Particular</option>
                  <option value="tutor">Tutor Interativo</option>
                  <option value="code_review">Analisador de Código</option>
                  <option value="exercise_gen">Gerador de Exercícios</option>
                  <option value="exam_sim">Simulador de Prova</option>
                </select>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2.5 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
                {tutorMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-2.5 whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-indigo-950/80 text-indigo-100 ml-6"
                        : "bg-slate-900 text-slate-200 mr-4 border border-slate-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {loadingTutor && (
                  <div className="text-slate-400 italic">Analisando contexto e respondendo...</div>
                )}
              </div>

              <form onSubmit={handleSendToTutor} className="flex gap-2">
                <input
                  type="text"
                  value={tutorInput}
                  onChange={(e) => setTutorInput(e.target.value)}
                  placeholder="Tire dúvida, peça exemplo ou revisão do código..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loadingTutor}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <FileText className="h-4 w-4 text-emerald-400" />
                Materiais da Disciplina (Apostilas / Ementa)
              </h3>

              <form onSubmit={handleAddMaterial} className="space-y-2">
                <input
                  type="text"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="Título do material (ex: Slides Aula 04)"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={matSection}
                  onChange={(e) => setMatSection(e.target.value)}
                  placeholder="Seção / Capítulo (opcional)"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs"
                />
                <textarea
                  rows={2}
                  value={matContent}
                  onChange={(e) => setMatContent(e.target.value)}
                  placeholder="Cole trechos da apostila, ementa ou anotações..."
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="w-full rounded-md bg-slate-800 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  Adicionar Material ao Contexto da IA
                </button>
              </form>

              <div className="space-y-1.5 text-xs text-slate-300">
                {materials
                  .filter((m) => m.discipline === selectedDiscipline)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="rounded-md border border-slate-800 bg-slate-950 p-2"
                    >
                      <div className="font-semibold text-emerald-300">{m.title}</div>
                      <div className="text-[11px] text-slate-500">{m.sourceLabel}</div>
                    </div>
                  ))}
              </div>
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
