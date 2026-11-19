import { Cardinality, SqlDataType } from "./exercise";

export interface StudentAttributeChoice {
  name: string;
  dataType: SqlDataType;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencesEntity?: string;
}

export interface StudentRelationshipChoice {
  id: string;
  fromEntity: string;
  toEntity: string;
  cardinality: Cardinality;
  fromParticipation: "OBRIGATORIA" | "OPCIONAL";
  toParticipation: "OBRIGATORIA" | "OPCIONAL";
}

export interface DerNodePosition {
  entityName: string;
  x: number;
  y: number;
}

export interface StudentAttemptState {
  selectedEntities: string[];
  attributesByEntity: Record<string, StudentAttributeChoice[]>;
  relationships: StudentRelationshipChoice[];
  derPositions: DerNodePosition[];
}
