import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada no servidor (.env.local)." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const {
      discipline,
      topicTitle,
      stage,
      mode = "professor",
      studentInput = "",
      studentCode = "",
      materials = [],
      history = [],
      weakTopics = [],
    } = await req.json();

    const formattedMaterials =
      Array.isArray(materials) && materials.length > 0
        ? materials
            .map(
              (m: { title: string; sourceLabel: string; content: string }) =>
                `[FONTE: ${m.title} | Seção: ${m.sourceLabel}]\n${m.content.slice(0, 1500)}`
            )
            .join("\n---\n")
        : "Nenhum material didático anexado nesta sessão.";

    const formattedHistory = Array.isArray(history)
      ? history
          .slice(-8)
          .map(
            (msg: { role: string; text: string }) =>
              `${msg.role === "user" ? "Aluno" : "Professor"}: ${msg.text}`
          )
          .join("\n")
      : "";

    const systemInstruction = `
Você é um Professor Universitário Particular, Tutor e Avaliador do projeto LabCS para três disciplinas:
1. Banco de Dados (modelagem conceitual/lógica/física, DER, normalização 1FN/2FN/3FN, SQL DDL/DML/SELECT/JOINs/subconsultas).
2. Programação Orientada a Objetos com foco principal em Java (classes, objetos, construtores, encapsulamento, getters/setters, herança, polimorfismo, classes abstratas, interfaces, sobrescrita/sobrecarga, modificadores de acesso, static, associação/agregação/composição, exceções, coleções, UML).
3. Estrutura de Dados III (árvores binárias, BST, AVL, fatores de balanceamento, rotações simples e duplas, remoção/busca, percursos, grafos, representações, buscas e algoritmos).

Regras obrigatórias:
- Responda sempre em português, com didática clara, exemplos concretos e perguntas guiadas quando apropriado.
- Se o aluno enviar código ou resposta, NÃO entregue a solução pronta de imediato: aponte o raciocínio, identifique falhas/conceitos ausentes e proponha o próximo passo para o aluno resolver.
- Quando usar materiais didáticos fornecidos, cite explicitamente o título/seção da fonte e diferencie o que está no material do que é explicação complementar sua. Nunca invente que um trecho existe no material se não estiver lá.
- Considere os tópicos com dificuldade do aluno (${(weakTopics || []).join(", ") || "nenhum registrado ainda"}) para reforçar revisão.
`.trim();

    const userPrompt = `
Disciplina: ${discipline}
Assunto atual: ${topicTitle}
Etapa da trilha: ${stage}
Modo de atuação solicitado: ${mode}

Materiais didáticos disponíveis:
${formattedMaterials}

Histórico recente:
${formattedHistory}

Mensagem / tentativa do aluno:
${studentInput || "(Sem mensagem de texto)"}

Código atual do aluno no laboratório:
${studentCode || "(Nenhum código enviado)"}
`.trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    return NextResponse.json({
      reply: response.text || "Não foi possível gerar uma resposta no momento.",
    });
  } catch (error) {
    console.error("Erro na rota /api/tutor:", error);
    return NextResponse.json(
      { error: "Falha ao consultar o agente de IA no servidor." },
      { status: 500 }
    );
  }
}
