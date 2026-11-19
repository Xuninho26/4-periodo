export interface EvaluationResult {
  score: number;
  maxScore: number;
  passed: boolean;
  matchedConcepts: string[];
  missingConcepts: string[];
  feedback: string;
}

export function evaluateStudentSubmission(
  submission: string,
  expectedKeywords: string[]
): EvaluationResult {
  const normalized = submission.toLowerCase().trim();
  const maxScore = 100;

  if (!normalized || normalized.length < 10) {
    return {
      score: 0,
      maxScore,
      passed: false,
      matchedConcepts: [],
      missingConcepts: expectedKeywords,
      feedback:
        "Registre uma resposta ou implementação completa antes de solicitar avaliação. Tente explicar o raciocínio ou escrever o trecho de código.",
    };
  }

  const matched = expectedKeywords.filter((kw) =>
    normalized.includes(kw.toLowerCase())
  );
  const missing = expectedKeywords.filter(
    (kw) => !normalized.includes(kw.toLowerCase())
  );

  const ratio =
    expectedKeywords.length > 0 ? matched.length / expectedKeywords.length : 1;
  const score = Math.round(ratio * maxScore);
  const passed = score >= 60;

  return {
    score,
    maxScore,
    passed,
    matchedConcepts: matched,
    missingConcepts: missing,
    feedback: passed
      ? `Bom trabalho (${score}/100). Você cobriu: ${matched.join(", ") || "os pontos centrais"}.`
      : `Pontuação ${score}/100. Revise os pontos não evidenciados: ${missing.join(", ")} e tente novamente.`,
  };
}
