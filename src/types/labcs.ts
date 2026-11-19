export type DisciplineId = "db" | "oop_java" | "ds3";

export type LearningStage =
  | "introducao"
  | "explicacao"
  | "exemplo"
  | "pratica_guiada"
  | "exercicio"
  | "desafio"
  | "avaliacao";

export type TutorMode =
  | "professor"
  | "tutor"
  | "code_review"
  | "exercise_gen"
  | "exam_sim";

export interface TopicModule {
  id: string;
  discipline: DisciplineId;
  title: string;
  summary: string;
  theory: string;
  exampleCode: string;
  exampleLabel: string;
  promptQuestion: string;
  expectedKeywords: string[];
  minScoreToAdvance: number;
}

export interface StudyMaterialItem {
  id: string;
  discipline: DisciplineId;
  title: string;
  sourceLabel: string;
  content: string;
}

export interface ProgressRecord {
  discipline: DisciplineId;
  topicId: string;
  stage: LearningStage;
  score: number;
  maxScore: number;
  weaknessTag?: string;
  updatedAt: string;
}
