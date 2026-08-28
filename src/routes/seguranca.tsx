import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Lock, ShieldCheck, Smartphone, UserCheck, Eye } from "lucide-react";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useIdioma } from "@/lib/i18n";

export const Route = createFileRoute("/seguranca")({
  head: () => ({
    meta: [
      { title: "Segurança e privacidade — Wise Money" },
      {
        name: "description",
        content:
          "Como o Wise Money protege seus dados: conexão criptografada, login verificado, dados isolados por pessoa e instalação segura no celular.",
      },
      { property: "og:title", content: "Segurança e privacidade do Wise Money" },
      {
        property: "og:description",
        content:
          "Criptografia, isolamento de dados por usuário, comprovantes privados e instalação segura via navegador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Segurança e privacidade do Wise Money" },
      {
        name: "twitter:description",
        content: "Entenda os protocolos de segurança usados no aplicativo.",
      },
    ],
  }),
  component: Seguranca,
});

function Seguranca() {
  const { t } = useIdioma();

  const blocos = [
    {
      icone: Lock,
      titulo: t("Conexão sempre criptografada (HTTPS)", "Always encrypted connection (HTTPS)"),
      texto: t(
        "Tudo o que você digita, fala ou fotografa viaja protegido por HTTPS/TLS entre o seu celular e o servidor. Ninguém no caminho consegue ler.",
        "Everything you type, say or photograph travels protected by HTTPS/TLS between your phone and the server. No one in between can read it.",
      ),
    },
    {
      icone: UserCheck,
      titulo: t("Login verificado e sessão sua", "Verified login and your own session"),
      texto: t(
        "A entrada é feita por e-mail e senha ou pela conta Google, com token de sessão renovado automaticamente. Não existe cadastro anônimo nem senha compartilhada.",
        "Sign-in uses email and password or your Google account, with an automatically refreshed session token. There is no anonymous signup or shared password.",
      ),
    },
    {
      icone: ShieldCheck,
      titulo: t("Seus dados só são seus", "Your data is only yours"),
      texto: t(
        "Cada linha do banco tem regras de acesso por usuário (RLS): gastos, entradas, metas, conversas e auditorias só podem ser lidos por quem os criou. Nem outro usuário nem o app conseguem ver seus números sem o seu login.",
        "Every database row has per-user access rules (RLS): expenses, income, goals, chats and audits can only be read by the person who created them.",
      ),
    },
    {
      icone: Eye,
      titulo: t("Comprovantes em pasta privada", "Receipts in a private folder"),
      texto: t(
        "As fotos de notas ficam num armazenamento privado, dentro de uma pasta com o seu identificador. Para ver a imagem, o app gera um link temporário que expira em 30 minutos.",
        "Receipt photos live in private storage inside a folder tied to your identifier. To view one, the app creates a temporary link that expires in 30 minutes.",
      ),
    },
    {
      icone: KeyRound,
      titulo: t("Chaves e integrações protegidas", "Protected keys and integrations"),
      texto: t(
        "As chaves de IA e de serviços ficam no servidor, nunca no seu aparelho. O aplicativo não instala extensões de navegador, não pede permissões perigosas e não roda código de terceiros no seu celular.",
        "AI and service keys stay on the server, never on your device. The app installs no browser extensions, requests no dangerous permissions and runs no third-party code on your phone.",
      ),
    },
    {
      icone: Smartphone,
      titulo: t("Instalação segura, sem loja de apps", "Safe install, no app store needed"),
      texto: t(
        "O Wise Money é um aplicativo web (PWA): você instala pelo próprio Chrome ou Safari, a partir do endereço oficial. Não existe arquivo APK para baixar — se alguém oferecer um, desconfie. Para desinstalar, basta segurar o ícone e remover.",
        "Wise Money is a web app (PWA): you install it from Chrome or Safari using the official address. There is no APK file to download — if someone offers one, be suspicious. To uninstall, press and hold the icon and remove it.",
      ),
    },
  ];

  const cuidados = [
    t(
      "Use o aplicativo apenas pelo endereço oficial chat-wise-money-72.lovable.app.",
      "Only use the app through the official address chat-wise-money-72.lovable.app.",
    ),
    t(
      "Nunca compartilhe sua senha. A Nina jamais pede senha, PIN ou dados de cartão na conversa.",
      "Never share your password. Nina never asks for passwords, PINs or card data in the chat.",
    ),
    t(
      "Em celular compartilhado, desligue a opção de entrar automaticamente e use “Sair” ao terminar.",
      "On a shared phone, turn off automatic sign-in and use “Sign out” when you finish.",
    ),
    t(
      "O app não recomenda ativos e não movimenta dinheiro: ele nunca vai pedir acesso ao seu banco.",
      "The app never recommends assets and never moves money: it will never ask for bank access.",
    ),
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm font-semibold text-primary">
          {t("Voltar", "Back")}
        </Link>
        <LanguageSwitcher />
      </div>

      <h1 className="mt-6 font-display text-3xl leading-tight">
        {t("Segurança e privacidade", "Security and privacy")}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {t(
          "Usar o Wise Money — no navegador ou instalado no celular — não coloca seu aparelho em risco. Veja, em linguagem simples, como protegemos você.",
          "Using Wise Money — in the browser or installed on your phone — does not put your device at risk. Here is how we protect you, in plain language.",
        )}
      </p>

      <div className="mt-8 space-y-4">
        {blocos.map((b) => (
          <section key={b.titulo} className="surface-card p-6 shadow-soft">
            <p className="flex items-center gap-2 font-display text-xl">
              <b.icone className="size-6 shrink-0 text-primary" />
              {b.titulo}
            </p>
            <p className="mt-2 text-base text-muted-foreground">{b.texto}</p>
          </section>
        ))}
      </div>

      <section className="surface-card mt-6 p-6 shadow-soft">
        <h2 className="font-display text-2xl">
          {t("Cuidados simples que ajudam", "Simple habits that help")}
        </h2>
        <ul className="mt-4 space-y-3 text-lg">
          {cuidados.map((c, i) => (
            <li key={c} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-base font-semibold text-primary">
                {i + 1}
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card mt-6 p-6 shadow-soft">
        <h2 className="font-display text-2xl">{t("Seus direitos", "Your rights")}</h2>
        <p className="mt-2 text-base text-muted-foreground">
          {t(
            "Você pode corrigir ou apagar qualquer lançamento a qualquer momento, exportar seus relatórios e comprovantes em PDF e conferir, na tela de Auditoria, tudo o que foi lido de cada nota. Os dados são usados só para mostrar o seu resumo financeiro — não são vendidos nem enviados a anunciantes.",
            "You can fix or delete any entry at any time, export your reports and receipts as PDF, and check in the Audit screen everything read from each receipt. Your data is used only to show your own financial summary — it is never sold or sent to advertisers.",
          )}
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/instalar"
          className="rounded-full bg-secondary px-6 py-4 text-base font-semibold text-primary-deep"
        >
          {t("Como instalar com segurança", "How to install safely")}
        </Link>
        <Link
          to="/entrar"
          className="rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground"
        >
          {t("Entrar no Wise Money", "Go to Wise Money")}
        </Link>
      </div>
    </main>
  );
}
