# Padronizar nome do app como "Wise Money" e atualizar identidade visual

## Contexto
O projeto nasceu como "Chat Wise Money", mas a interface atual usa o nome "mergulho" em títulos de páginas, cabeçalho, PWA, PDF, prompt da Nina e README (este último já está correto). O objetivo é alinhar tudo para **Wise Money** e ajustar o logo/ícone para a nova marca.

## O que será feito

### 1. Renomear "mergulho" → "Wise Money" em todos os pontos visíveis
Substituir o nome em:
- Títulos de página (`head()`) em todas as rotas: `/`, `/entrar`, `/conversa`, `/painel`, `/resumo`, `/metas`, `/mercado`, `/insights`, `/$.tsx` (404).
- Meta tags `og:title`, `description`, `apple-mobile-web-app-title` e `theme-color` em `src/routes/__root.tsx`.
- Manifesto PWA (`public/manifest.json`): `name`, `short_name` e descrição.
- Cabeçalho da landing page, login e navegação autenticada (`mergulho` → `Wise Money`).
- Letra "m" do logo para um novo símbolo da marca Wise Money.
- Prompt da Nina em `src/lib/agent.server.ts` ("aplicativo mergulho" → "aplicativo Wise Money").
- Exportação de PDF (`src/lib/pdf-report.ts`) e prévia do relatório (`src/components/PreviaRelatorio.tsx`).
- Chaves internas de `localStorage` (`mergulho:idioma`, `mergulho:tutorial-visto-v3`) para não misturar estados com a marca antiga.

### 2. Nova identidade visual
- Gerar uma marca simples e amigável para **Wise Money** no tema Mint Ledger Calm (verde-menta/creme), adequada a ícones pequenos e leitura por idosos.
- Criar `public/favicon.png`, `public/icons/icon-192.png` e `public/icons/icon-512.png` a partir da nova marca.
- Atualizar o logo renderizado no cabeçalho das páginas (`src/routes/index.tsx`, `src/routes/entrar.tsx`, `src/routes/_autenticado/route.tsx`) para exibir a nova marca.

### 3. Ajustar vídeo tutorial (Remotion)
- Atualizar os componentes Remotion (`remotion/src/components/Phone.tsx`, cenas e tema) para refletir o nome **Wise Money** e o novo logo, caso o vídeo ainda exiba "mergulho".
- Renderizar novo `public/videos/tutorial-mergulho.mp4` (ou renomear para `tutorial-wise-money.mp4`) e atualizar a referência no `TutorialPrimeiroAcesso.tsx`.

### 4. Validação
- Executar `bun run lint`, `bun run typecheck`, `bun run test` e `bun run build` para garantir que a renomeação não quebrou nada.
- Verificar visualmente as rotas principais (landing, login, conversa, painel) no preview.

### 5. Publicação
- Publicar a versão atualizada para manter o link já divulgado (`https://chat-wise-money-72.lovable.app`) consistente com o nome do projeto.

## Fora de escopo
- Não alterar o slug publicado (`chat-wise-money-72`) nem o domínio.
- Não reescrever o README, que já está correto.
- Não mudar o tema de cores (Mint Ledger Calm) sem solicitação.
