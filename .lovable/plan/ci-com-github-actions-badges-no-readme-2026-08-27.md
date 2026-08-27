# CI com GitHub Actions + Badges no README

## Objetivo

Validar o projeto automaticamente a cada push/pull request no GitHub (lint, tipos, testes e build) e exibir badges de status no README.

## O que será feito

### 1. Testes unitários (Vitest)

- Instalar `vitest` como dependência de desenvolvimento.
- Adicionar script `"test": "vitest run"` no `package.json`.
- Criar testes para a lógica pura do projeto:
  - `src/lib/format.test.ts` — formatação de moeda (R$ vs $), datas (DD/MM vs MM/DD) e números conforme o idioma PT-BR/EN.
  - `src/lib/i18n.test.ts` — paridade das chaves de tradução entre PT-BR e EN (nenhuma chave faltando).

### 2. Script de verificação de tipos

- Adicionar `"typecheck": "tsc --noEmit"` no `package.json` (TypeScript já é dependência do projeto).

### 3. Workflow de CI — `.github/workflows/ci.yml`

- Dispara em `push` e `pull_request` na branch principal.
- Etapas: setup do Bun → instalação de dependências → lint → typecheck → testes → build de produção.
- O build recebe variáveis `VITE_SUPABASE_*` fictícias apenas para validação de compilação (nenhum dado real é acessado; valores reais nunca entram no CI).

### 4. Badges no README

- Badge de status do CI (build/testes) apontando para `elis23eng-glitch/Dio-lab-vibe-coding-app-financas`.
- Badges complementares: licença MIT, React 19, TanStack Start, Tailwind CSS v4.

## Detalhes técnicos

- Arquivos novos: `.github/workflows/ci.yml`, `src/lib/format.test.ts`, `src/lib/i18n.test.ts`.
- Arquivos alterados: `package.json` (scripts `test` e `typecheck`), `README.md` (badges no topo).
- O workflow só passa a rodar depois que o projeto for conectado/enviado ao GitHub (Plus → GitHub → Connect). A partir daí, cada push é validado automaticamente e o badge reflete o status real.

## Sobre o domínio personalizado (resposta)

- Conectar domínio próprio no Lovable exige **plano pago**, e o domínio em si é registrado à parte (ex.: Registro.br ~R$40/ano). O endereço `chat-wise-money-72.lovable.app` segue gratuito e suficiente para os testes da DIO.
