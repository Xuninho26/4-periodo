import { DisciplineId } from "@/types/labcs";
import {
  DisciplineReport,
  ExamAnswerRecord,
  ExamFinalReport,
  ExamQuestion,
} from "@/types/exam";

export const DISCIPLINE_LABELS: Record<DisciplineId, string> = {
  db: "Banco de Dados",
  oop_java: "POO (Java)",
  ds3: "Estrutura de Dados III",
};

export const EXAM_QUESTION_BANK: ExamQuestion[] = [
  {
    id: "db-q1",
    discipline: "db",
    topic: "Chaves e Tabelas Associativas",
    kind: "objetiva",
    statement:
      "Em um sistema de biblioteca, um Empréstimo pode conter vários Livros e um Livro pode participar de vários Empréstimos ao longo do tempo. Qual estrutura modelada corretamente resolve esse relacionamento N:N?",
    options: [
      "Adicionar uma coluna id_livro direto na tabela Emprestimo com múltiplos IDs separados por vírgula.",
      "Criar uma tabela associativa (ex: ItemEmprestimo) contendo chaves estrangeiras para Emprestimo e Livro.",
      "Transformar Livro em atributo multivalorado da tabela Leitor sem chave primária.",
      "Usar um relacionamento 1:1 entre Emprestimo e Livro.",
    ],
    correctOptionIndex: 1,
    expectedKeywords: ["associativa", "estrangeira"],
    explanation:
      "Relacionamentos N:N no modelo relacional devem ser decompostos em dois relacionamentos 1:N por meio de uma tabela associativa com FKs para as entidades envolvidas.",
  },
  {
    id: "db-q2",
    discipline: "db",
    topic: "Normalização (3FN)",
    kind: "discursiva",
    statement:
      "Explique por que uma tabela PEDIDO que armazena 'nome_cliente' e 'cidade_cliente' dependendo apenas de 'id_cliente' (e não da chave primária do pedido) viola a Terceira Forma Normal (3FN) e como corrigir.",
    expectedKeywords: ["dependencia", "transitiva", "cliente", "tabela"],
    explanation:
      "Há dependência transitiva: atributos do cliente dependem de id_cliente (um atributo não-chave), não apenas da PK de PEDIDO. A correção separa os dados do cliente em uma tabela CLIENTE referenciada por FK.",
  },
  {
    id: "db-q3",
    discipline: "db",
    topic: "Consultas SQL com JOIN",
    kind: "codigo",
    statement:
      "Escreva uma consulta SQL SELECT que liste o nome do leitor e o título do livro emprestado usando JOIN entre leitor, emprestimo, item_emprestimo e livro.",
    starterCode: `SELECT \nFROM emprestimo e\n`,
    expectedKeywords: ["select", "from", "join", "on"],
    explanation:
      "Uma consulta relacional multi-tabela usa INNER JOIN com condições explícitas em ON ligando chaves primárias e estrangeiras.",
  },
  {
    id: "oop-q1",
    discipline: "oop_java",
    topic: "Encapsulamento e Modificadores",
    kind: "objetiva",
    statement:
      "Em Java, qual combinação protege o atributo 'saldo' de alteração externa direta e permite acesso controlado via métodos?",
    options: [
      "public double saldo; sem getters ou setters.",
      "private double saldo; com método público getSaldo() e validações em sacar/depositar.",
      "static double saldo; acessado diretamente fora da classe.",
      "final double saldo; impedindo qualquer leitura.",
    ],
    correctOptionIndex: 1,
    expectedKeywords: ["private", "getsaldo"],
    explanation:
      "Declarar o atributo como private encapsula o estado interno e força regras de negócio (como impedir saldo negativo) nos métodos públicos.",
  },
  {
    id: "oop-q2",
    discipline: "oop_java",
    topic: "Herança vs. Composição",
    kind: "discursiva",
    statement:
      "Quando é mais indicado usar composição/associação em vez de herança ('extends') em POO com Java? Cite um exemplo prático.",
    expectedKeywords: ["heranca", "composicao", "acoplamento", "extends"],
    explanation:
      "A herança cria acoplamento forte entre subclasse e superclasse; quando a relação é 'tem um' ou o comportamento pode variar dinamicamente, composição/associação tende a ser mais flexível.",
  },
  {
    id: "oop-q3",
    discipline: "oop_java",
    topic: "Classes Abstratas e Polimorfismo",
    kind: "codigo",
    statement:
      "Escreva um esboço de classe abstrata 'Pagamento' em Java com método abstrato 'double calcularTaxa()' e uma subclasse 'PagamentoPix' usando '@Override'.",
    starterCode: `public abstract class Pagamento {\n    \n}\n`,
    expectedKeywords: ["abstract", "extends", "override", "double"],
    explanation:
      "A superclasse declara o contrato abstrato e a subclasse estende Pagamento e sobrescreve calcularTaxa() com @Override.",
  },
  {
    id: "ds3-q1",
    discipline: "ds3",
    topic: "Balanceamento AVL",
    kind: "objetiva",
    statement:
      "Em uma árvore AVL, qual intervalo de Fator de Balanceamento (FB = altura_esq - altura_dir) mantém um nó considerado balanceado?",
    options: [
      "FB entre -2 e +2",
      "FB exatamente igual a 0 em todos os nós sempre",
      "FB pertencente ao conjunto {-1, 0, +1}",
      "FB maior ou igual a 1",
    ],
    correctOptionIndex: 2,
    expectedKeywords: ["-1", "0", "+1"],
    explanation:
      "Por definição da árvore AVL, cada nó deve ter fator de balanceamento em {-1, 0, +1}; valores fora desse intervalo exigem rotação.",
  },
  {
    id: "ds3-q2",
    discipline: "ds3",
    topic: "Rotações Simples e Duplas",
    kind: "discursiva",
    statement:
      "Diferencie uma rotação simples de uma rotação dupla (como LR ou RL) durante o rebalanceamento de uma árvore AVL.",
    expectedKeywords: ["rotacao", "simples", "dupla", "balanceamento"],
    explanation:
      "A rotação simples ocorre quando o desbalanceamento e a inserção seguem o mesmo alinhamento (ex: esquerda-esquerda); a rotação dupla ocorre quando há 'zigue-zague' (ex: esquerda-direita), exigindo duas rotações encadeadas.",
  },
  {
    id: "ds3-q3",
    discipline: "ds3",
    topic: "Percurso em Árvore Binária",
    kind: "codigo",
    statement:
      "Implemente a lógica de percurso em-ordem (in-order) para um nó de árvore binária com 'esquerda', 'direita' e 'valor'.",
    starterCode: `function emOrdem(no) {\n  if (!no) return;\n  \n}\n`,
    expectedKeywords: ["esquerda", "direita"],
    explanation:
      "O percurso em-ordem (in-order) visita subárvore esquerda, processa o nó atual e em seguida visita a subárvore direita.",
  },
];

export function scoreQuestion(
  question: ExamQuestion,
  input: {
    selectedOptionIndex?: number;
    textAnswer: string;
    codeAnswer: string;
  }
): ExamAnswerRecord {
  const maxScore = 100;

  if (question.kind === "objetiva") {
    const isCorrect = input.selectedOptionIndex === question.correctOptionIndex;
    return {
      questionId: question.id,
      selectedOptionIndex: input.selectedOptionIndex,
      textAnswer: input.textAnswer,
      codeAnswer: input.codeAnswer,
      score: isCorrect ? maxScore : 0,
      maxScore,
      feedback: isCorrect
        ? `Alternativa correta. ${question.explanation}`
        : `Alternativa incorreta. ${question.explanation}`,
    };
  }

  const content =
    question.kind === "codigo" ? input.codeAnswer : input.textAnswer;
  const normalized = content.toLowerCase().trim();

  if (!normalized || normalized.length < 8) {
    return {
      questionId: question.id,
      selectedOptionIndex: input.selectedOptionIndex,
      textAnswer: input.textAnswer,
      codeAnswer: input.codeAnswer,
      score: 0,
      maxScore,
      feedback: `Resposta não registrada ou muito curta. Critério esperado: ${question.explanation}`,
    };
  }

  const matched = question.expectedKeywords.filter((kw) =>
    normalized.includes(kw.toLowerCase())
  );
  const ratio =
    question.expectedKeywords.length > 0
      ? matched.length / question.expectedKeywords.length
      : 1;
  const score = Math.round(ratio * maxScore);

  return {
    questionId: question.id,
    selectedOptionIndex: input.selectedOptionIndex,
    textAnswer: input.textAnswer,
    codeAnswer: input.codeAnswer,
    score,
    maxScore,
    feedback: `${
      score >= 60 ? "Boa resposta" : "Resposta parcial"
    } (${score}/${maxScore}). ${question.explanation}`,
  };
}

export function buildExamFinalReport(
  questions: ExamQuestion[],
  answersMap: Record<string, ExamAnswerRecord>,
  durationUsedSeconds: number
): ExamFinalReport {
  const details = questions.map((question) => {
    const answer =
      answersMap[question.id] ||
      scoreQuestion(question, { textAnswer: "", codeAnswer: "" });
    return { question, answer };
  });

  const totalScore = details.reduce((acc, item) => acc + item.answer.score, 0);
  const maxScore = details.length * 100;
  const overallAccuracyPct =
    maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(1)) : 0;

  const byDiscipline: DisciplineReport[] = (
    ["db", "oop_java", "ds3"] as DisciplineId[]
  ).map((disc) => {
    const discItems = details.filter((d) => d.question.discipline === disc);
    const discScore = discItems.reduce((acc, d) => acc + d.answer.score, 0);
    const discMax = discItems.length * 100;
    const accuracyPct =
      discMax > 0 ? Number(((discScore / discMax) * 100).toFixed(1)) : 0;

    const answeredCount = discItems.filter((d) => {
      if (d.question.kind === "objetiva") {
        return d.answer.selectedOptionIndex !== undefined;
      }
      if (d.question.kind === "codigo") {
        return d.answer.codeAnswer.trim().length > 0;
      }
      return d.answer.textAnswer.trim().length > 0;
    }).length;

    const strengths = discItems
      .filter((d) => d.answer.score >= 70)
      .map((d) => d.question.topic);

    const reviewTopics = discItems
      .filter((d) => d.answer.score < 70)
      .map((d) => d.question.topic);

    return {
      discipline: disc,
      label: DISCIPLINE_LABELS[disc],
      score: discScore,
      maxScore: discMax,
      accuracyPct,
      answeredCount,
      totalQuestions: discItems.length,
      strengths,
      reviewTopics,
    };
  });

  return {
    durationUsedSeconds,
    totalScore,
    maxScore,
    overallAccuracyPct,
    byDiscipline,
    details,
  };
}
