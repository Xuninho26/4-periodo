import { DisciplineId } from "./labcs";

export type QuestionKind = "objetiva" | "discursiva" | "codigo";

export interface ExamQuestion {
  id: string;
  discipline: DisciplineId;
  topic: string;
  kind: QuestionKind;
  statement: string;
  options?: string[];
  correctOptionIndex?: number;
  starterCode?: string;
  expectedKeywords: string[];
  explanation: string;
}

export interface ExamAnswerRecord {
  questionId: string;
  selectedOptionIndex?: number;
  textAnswer: string;
  codeAnswer: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface DisciplineReport {
  discipline: DisciplineId;
  label: string;
  score: number;
  maxScore: number;
  accuracyPct: number;
  answeredCount: number;
  totalQuestions: number;
  strengths: string[];
  reviewTopics: string[];
}

export interface ExamFinalReport {
  durationUsedSeconds: number;
  totalScore: number;
  maxScore: number;
  overallAccuracyPct: number;
  byDiscipline: DisciplineReport[];
  details: {
    question: ExamQuestion;
    answer: ExamAnswerRecord;
  }[];
}
