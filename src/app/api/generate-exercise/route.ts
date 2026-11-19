import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const exerciseResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    statement: { type: Type.STRING },
    candidateEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          isAssociativeTable: { type: Type.BOOLEAN },
          attributes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                dataType: {
                  type: Type.STRING,
                  enum: ["INT", "VARCHAR", "TEXT", "DATE", "TIMESTAMP", "DECIMAL", "BOOLEAN"],
                },
                isPrimaryKey: { type: Type.BOOLEAN },
                isForeignKey: { type: Type.BOOLEAN },
                referencesEntity: { type: Type.STRING },
              },
              required: ["name", "dataType", "isPrimaryKey", "isForeignKey"],
            },
          },
        },
        required: ["name", "isAssociativeTable", "attributes"],
      },
    },
    relationships: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          fromEntity: { type: Type.STRING },
          toEntity: { type: Type.STRING },
          cardinality: { type: Type.STRING, enum: ["1:1", "1:N", "N:N"] },
          fromParticipation: { type: Type.STRING, enum: ["OBRIGATORIA", "OPCIONAL"] },
          toParticipation: { type: Type.STRING, enum: ["OBRIGATORIA", "OPCIONAL"] },
          description: { type: Type.STRING },
        },
        required: [
          "fromEntity",
          "toEntity",
          "cardinality",
          "fromParticipation",
          "toParticipation",
          "description",
        ],
      },
    },
    commonMistakesExplanation: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ["topic", "explanation"],
      },
    },
  },
  required: [
    "title",
    "statement",
    "candidateEntities",
    "correctEntities",
    "entities",
    "relationships",
    "commonMistakesExplanation",
  ],
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada no servidor (.env.local)." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const supabaseAdmin =
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
        ? createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          )
        : null;

    const {
      level = 1,
      domain = "Sistema Empresarial",
      customPrompt = "",
      forceNew = false,
    } = await req.json();

    if (!forceNew && !customPrompt && supabaseAdmin) {
      const { data: cachedList } = await supabaseAdmin
        .from("exercises")
        .select("id, level, domain, title, statement, payload")
        .eq("level", level)
        .ilike("domain", domain)
        .limit(10);

      if (cachedList && cachedList.length > 0) {
        const picked = cachedList[Math.floor(Math.random() * cachedList.length)];
        return NextResponse.json({
          fromCache: true,
          exercise: {
            id: picked.id,
            level: picked.level,
            domain: picked.domain,
            title: picked.title,
            statement: picked.statement,
            ...(picked.payload as object),
          },
        });
      }
    }

    const systemInstruction = `
Você é um Professor Universitário Sênior especialista em Modelagem de Banco de Dados Relacional e SQL ANSI.
Gere um exercício inédito em português no Nível ${level} (1=Básico, 2=Intermediário, 3=Avançado, 4=Prova/Concurso).
Regras:
- candidateEntities deve conter correctEntities + 3 a 5 distratores plausíveis embaralhados.
- Toda FK deve existir nos atributos de sua entidade e referencesEntity deve apontar para uma entidade válida com PK.
- Inclua explicações didáticas em commonMistakesExplanation.
`.trim();

    const prompt = customPrompt
      ? `Domínio: ${domain}. Contexto específico: ${customPrompt}`
      : `Crie um exercício realista no domínio: ${domain}.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: exerciseResponseSchema,
        temperature: 0.75,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    let savedId: string | undefined;

    if (supabaseAdmin) {
      const { data: saved } = await supabaseAdmin
        .from("exercises")
        .insert({
          level,
          domain,
          title: parsed.title,
          statement: parsed.statement,
          source: "ai",
          payload: {
            candidateEntities: parsed.candidateEntities,
            correctEntities: parsed.correctEntities,
            entities: parsed.entities,
            relationships: parsed.relationships,
            commonMistakesExplanation: parsed.commonMistakesExplanation,
          },
        })
        .select("id")
        .single();
      savedId = saved?.id;
    }

    return NextResponse.json({
      fromCache: false,
      exercise: {
        id: savedId || crypto.randomUUID(),
        level,
        domain,
        ...parsed,
      },
    });
  } catch (error) {
    console.error("Erro na rota /api/generate-exercise:", error);
    return NextResponse.json(
      { error: "Erro ao obter ou gerar exercício." },
      { status: 500 }
    );
  }
}
