export type DifficultyLevel = 1 | 2 | 3 | 4;

export type SqlDataType =
  | "INT"
  | "VARCHAR"
  | "TEXT"
  | "DATE"
  | "TIMESTAMP"
  | "DECIMAL"
  | "BOOLEAN";

export type Cardinality = "1:1" | "1:N" | "N:N";

export interface AttributeSpec {
  name: string;
  dataType: SqlDataType;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencesEntity?: string;
}

export interface EntitySpec {
  name: string;
  isAssociativeTable: boolean;
  attributes: AttributeSpec[];
}

export interface RelationshipSpec {
  fromEntity: string;
  toEntity: string;
  cardinality: Cardinality;
  fromParticipation: "OBRIGATORIA" | "OPCIONAL";
  toParticipation: "OBRIGATORIA" | "OPCIONAL";
  description: string;
}

export interface GeneratedExercise {
  id: string;
  level: DifficultyLevel;
  domain: string;
  title: string;
  statement: string;
  candidateEntities: string[];
  correctEntities: string[];
  entities: EntitySpec[];
  relationships: RelationshipSpec[];
  commonMistakesExplanation: {
    topic: string;
    explanation: string;
  }[];
}
