# 💰 Chat Wise Money — Assistente Financeiro Conversacional

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
- Contraste de cores suave e calmante (tema *Mint Ledger Calm*).
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
4. Converse com a Nina: *"Gastei 45 reais no mercado"* ou *"Recebi 2000 de salário"*.
5. Explore o painel, metas, cotações e exporte um relatório em PDF.

---

## 👩‍💻 Autora

**Elisangela Vieira**

Projeto desenvolvido para a **DIO (Digital Innovation One)**.

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🤝 Contribuições

Sugestões, melhorias e feedbacks são bem-vindos! Sinta-se à vontade para abrir uma *issue* ou enviar um *pull request*.
