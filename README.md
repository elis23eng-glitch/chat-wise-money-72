# 💰 Chat Wise Money — Assistente Financeiro Conversacional

[![CI](https://github.com/elis23eng-glitch/chat-wise-money-72/actions/workflows/ci.yml/badge.svg)](https://github.com/elis23eng-glitch/chat-wise-money-72/actions/workflows/ci.yml)
[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-green.svg)](LICENSE)
![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TanStack Start](https://img.shields.io/badge/TanStack-Start-ff4154?logo=reactquery&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)

> Um aplicativo de controle financeiro pessoal baseado em conversas naturais, desenvolvido como projeto de conclusão para a **DIO (Digital Innovation One)**.

Acesse em: **[https://chat-wise-money-72.lovable.app](https://chat-wise-money-72.lovable.app)**

---

## ✨ Sobre o projeto

O **Chat Wise Money** é um assistente financeiro conversacional que ajuda iniciantes — incluindo pessoas com pouca familiaridade com tecnologia, como idosos — a organizarem suas finanças pessoais de forma simples, acolhedora e educativa.

A assistente virtual **Nina** interpreta mensagens em linguagem natural, registra gastos e entradas, gera insights personalizados, acompanha metas financeiras e exibe cotações de mercado. Tudo com uma interface clara, acessível e amigável.

---

## 🚀 Funcionalidades principais

- 💬 **Chat conversacional com Nina** — registre gastos e receitas falando ou digitando naturalmente.
- 📊 **Painel financeiro completo** — visualize saldo, entradas, saídas e gráficos por categoria.
- 🎯 **Metas financeiras** — crie metas e acompanhe o progresso.
- 🔔 **Alertas de saldo** — notificações automáticas quando o saldo está negativo ou o orçamento está apertado.
- 📅 **Visão semanal e mensal** — alterne entre períodos para entender melhor seus hábitos.
- 🌍 **Multilíngue** — suporte a **Português (BR)** e **Inglês**.
- 📄 **Exportação de relatórios em PDF** — prévia interativa, seleção de seções, escolha de idioma e compartilhamento por link temporário.
- 📱 **PWA (Progressive Web App)** — instale diretamente na tela inicial do celular, sem precisar de loja de aplicativos.
- 🎓 **Tutorial interativo de primeiro acesso** — guia passo a passo para quem nunca usou um app financeiro.

---

## ♿ Acessibilidade

O projeto foi pensado para ser usado por pessoas de todas as idades, com foco especial em **idosos**:

- Tipografia em tamanhos legíveis.
- Contraste de cores suave e calmante (tema _Mint Ledger Calm_).
- Botão de **entrada por voz** para quem prefere falar a digitar.
- Linguagem simples, acolhedora e sem termos técnicos desnecessários.
- Interface com poucos passos e feedbacks claros.

---

## 🛠️ Tecnologias utilizadas

- [TanStack Start](https://tanstack.com/start) — framework full-stack React.
- [React 19](https://react.dev) — biblioteca de interfaces.
- [TypeScript](https://www.typescriptlang.org) — tipagem estática.
- [Tailwind CSS v4](https://tailwindcss.com) — estilização utilitária.
- [Lovable Cloud](https://lovable.dev) — backend, autenticação e banco de dados.
- [Supabase](https://supabase.com) — banco PostgreSQL, auth e storage.
- [AI SDK](https://sdk.vercel.ai) — integração com modelo de linguagem.
- [Recharts](https://recharts.org) — gráficos interativos.
- [jsPDF](https://github.com/parallax/jsPDF) — geração de relatórios PDF.
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) — reconhecimento de voz.

---

## 📦 Como executar localmente

> Requer **Node.js** e **Bun** (ou npm).

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd chat-wise-money

# Instale as dependências
bun install

# Inicie o servidor de desenvolvimento
bun run dev
```

O app estará disponível em `http://localhost:8080`.

---

## 🗄️ Estrutura do banco de dados

O projeto utiliza as seguintes tabelas principais:

- `profiles` — perfis dos usuários.
- `expenses` — registros de gastos.
- `incomes` — registros de entradas/receitas.
- `goals` — metas financeiras.
- `chat_messages` — histórico de conversas com a Nina.
- `balance_alerts` — histórico de alertas de saldo.

Todas as tabelas possuem **Row Level Security (RLS)** ativa para proteger os dados de cada usuário.

---

## 📱 Instalação no celular (PWA)

### Android (Chrome)

1. Acesse o app no navegador.
2. Toque em **"Adicionar à tela inicial"** no menu.
3. Pronto! O ícone aparece como um app nativo.

### iOS (Safari)

1. Acesse o app no Safari.
2. Toque no ícone de **compartilhar**.
3. Escolha **"Adicionar à Tela de Início"**.
4. Confirme com **Adicionar**.

---

## 🧪 Como testar

1. Acesse o link publicado.
2. Crie uma conta com e-mail e senha.
3. Siga o tutorial de primeiro acesso.
4. Converse com a Nina: _"Gastei 45 reais no mercado"_ ou _"Recebi 2000 de salário"_.
5. Explore o painel, metas, cotações e exporte um relatório em PDF.

---

## ✅ Integração contínua (CI)

O repositório usa **GitHub Actions** (`.github/workflows/ci.yml`) para validar automaticamente cada push e pull request:

- **Lint** — ESLint + Prettier.
- **Verificação de tipos** — `tsc --noEmit`.
- **Testes unitários** — Vitest (formatação de moeda, datas e traduções PT-BR/EN).
- **Build de produção** — garante que o app compila de ponta a ponta.

Para rodar as mesmas validações localmente:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

---

## 💡 Conceito do aplicativo

O **Chat Wise Money** nasceu da ideia de que organizar dinheiro não precisa ser complicado. Muitas pessoas, especialmente idosas ou quem nunca usou uma planilha, sentem dificuldade com apps financeiros cheios de formulários e termos técnicos.

A proposta é simples: **conversar com a Nina como se estivesse falando com uma amiga paciente**. Dizendo _"gastei 25 reais no mercado"_ ou _"recebi minha aposentadoria"_, o app entende, registra e mostra o resultado de forma clara. O painel traz gráficos, alertas e metas para que o usuário veja sua evolução sem precisar entender de finanças.

O diferencial está na combinação de **acessibilidade**, **educação financeira** e **inteligência artificial**: a Nina não apenas registra, ela explica, incentiva e ajuda a criar hábitos saudáveis — sempre sem recomendar investimentos específicos.

---

## 📝 Prompt final (PRD) usado com a IA

O documento abaixo resume o que foi solicitado à IA (Lovable/Copilot) para construir o projeto do início ao fim:

```text
Nome do Projeto: Assistente Financeiro Conversacional – Organização de Finanças Pessoais

Criar um aplicativo de controle financeiro pessoal baseado em conversas naturais, onde o usuário registra gastos, recebe insights, acompanha metas e aprende a economizar e investir de forma simples, acessível e personalizada.

A IA deve atuar como um Agente Financeiro Educativo, com linguagem simples, amigável e acessível. Ela deve:
- Interpretar mensagens do usuário em linguagem natural.
- Registrar gastos e classificar automaticamente.
- Explicar conceitos financeiros de forma clara.
- Gerar insights personalizados com base no comportamento do usuário.
- Sugerir metas financeiras e acompanhar o progresso.
- Mostrar informações atualizadas sobre mercado financeiro (dólar, tendências gerais, tipos de investimento).
- Nunca recomendar ativos específicos.
- Ser proativa, fazendo perguntas quando necessário.
- Manter tom acolhedor, educativo e motivador.

Público-alvo: Iniciantes em organização financeira, incluindo idosos, que precisam de simplicidade, clareza e orientação prática.

Funcionalidades esperadas:
1. Chat conversacional com a assistente virtual Nina.
2. Registro de gastos e entradas por linguagem natural ou voz.
3. Painel com saldo, gráficos por categoria, entradas vs saídas e alertas.
4. Metas financeiras com acompanhamento de progresso.
5. Cotações de mercado e conteúdo educativo sobre investimentos.
6. Exportação de relatórios em PDF com prévia, seleção de seções e idioma.
7. Suporte a Português (BR) e Inglês.
8. Tutorial interativo de primeiro acesso.
9. PWA para instalação no celular.
10. CI/CD com testes, lint, typecheck e build automatizados.

Direção visual: Mint Ledger Calm — tons de verde-menta e creme, tipografia legível, interface calma e acolhedora.
```

> 💬 **Dica:** se quiser ver a evolução completa das conversas com a IA, acesse o histórico de mensagens dentro do projeto na Lovable.

---

## 📸 Imagens e vídeos das interações

Abaixo estão os locais onde você pode adicionar capturas de tela e vídeos das interações com o Copilot/Lovable durante o desenvolvimento:

### Capturas de tela do app

| Tela                | Descrição                         | Onde colocar                      |
| ------------------- | --------------------------------- | --------------------------------- |
| Chat com a Nina     | Conversa registrando um gasto     | `docs/screenshots/chat-nina.png`  |
| Painel financeiro   | Gráficos, saldo e alertas         | `docs/screenshots/painel.png`     |
| Metas               | Acompanhamento de metas           | `docs/screenshots/metas.png`      |
| Cotações de mercado | Dólar, euro e educação financeira | `docs/screenshots/mercado.png`    |
| Prévia do PDF       | Seleção de seções e idioma        | `docs/screenshots/previa-pdf.png` |

### Vídeos demonstrativos

- `docs/videos/tutorial-primeiro-acesso.mp4` — passo a passo do tutorial inicial.
- `docs/videos/chat-por-voz.mp4` — demonstração do registro de gastos por comando de voz.
- `docs/videos/gerando-relatorio.mp4` — prévia, checklist e exportação do PDF.

> 📁 **Como adicionar:** crie as pastas `docs/screenshots` e `docs/videos` na raiz do repositório e insira os arquivos. Depois, atualize os caminhos acima para apontar para os arquivos reais.

---

## 🪞 Reflexão sobre o aprendizado

Desenvolver o Chat Wise Money foi uma experiência enriquecedora porque mostrou como a inteligência artificial pode acelerar a criação de soluções reais, mas também exige clareza, revisão e decisões humanas.

Aprendi que:

- **Prompts bem escritos economizam muito tempo.** Quanto mais específico o PRD, mais perto o resultado fica do esperado.
- **Acessibilidade não é um extra.** Pensar em idosos e iniciantes mudou decisões de design, cores, tamanho de fonte e fluxo de navegação.
- **Testes e CI são essenciais.** Automatizar lint, tipos e testes deu segurança para iterar rápido sem quebrar o app.
- **Iteração é parte do processo.** O app mudou bastante desde a primeira versão: nasceu "Mia", virou "Nina", ganhou entradas, alertas, PDF, PWA e muito mais — tudo a partir de feedback contínuo.
- **Publicar importa.** Colocar o projeto no ar e no GitHub trouxe a sensação de produto acabado, algo que pode ser testado e compartilhado.

O maior aprendizado foi perceber que tecnologia de verdade acontece quando a gente une propósito, usabilidade e execução técnica. O Chat Wise Money é simples, mas foi pensado para fazer diferença no dia a dia de quem precisa.

---

## 👩‍💻 Autora

**Elisangela Vieira**

Projeto desenvolvido para a **DIO (Digital Innovation One)**.

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🤝 Contribuições

Sugestões, melhorias e feedbacks são bem-vindos! Sinta-se à vontade para abrir uma _issue_ ou enviar um _pull request_.
