# LabCS — 4º período | Ambiente Inteligente de Estudos

Projeto Next.js (App Router + TypeScript + Tailwind CSS) com integração ao Supabase e ao agente de IA via Google Gemini (`@google/genai`) para as disciplinas de:
- **Banco de Dados**
- **Programação Orientada a Objetos (POO em Python)**
- **Estrutura de Dados III**

## Como rodar no VS Code

1. Extraia o arquivo `.zip` e abra a pasta `labcs-platform` no **VS Code**.
2. Copie `.env.example` para `.env.local` e preencha suas chaves:
   ```bash
   cp .env.example .env.local
   ```
3. Execute o script SQL em `supabase/migrations/001_dblab_schema.sql` no **SQL Editor** do seu projeto Supabase.
4. Instale as dependências e inicie o servidor de desenvolvimento:
   ```bash
   npm install
   npm run dev
   ```
5. Acesse `http://localhost:3000`.

## Subir para o GitHub

```bash
git init
git add .
git commit -m "feat: estrutura inicial do LabCS"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```
