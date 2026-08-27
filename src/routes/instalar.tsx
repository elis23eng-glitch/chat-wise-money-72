import { createFileRoute, Link } from "@tanstack/react-router";
import { Apple, Smartphone, TriangleAlert } from "lucide-react";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useIdioma } from "@/lib/i18n";

export const Route = createFileRoute("/instalar")({
  head: () => ({
    meta: [
      { title: "Instalar o Wise Money no celular" },
      {
        name: "description",
        content:
          "Passo a passo simples para colocar o Wise Money na tela inicial do seu celular Android ou iPhone.",
      },
      { property: "og:title", content: "Instalar o Wise Money no celular" },
      {
        property: "og:description",
        content: "Guia com letras grandes para instalar o assistente financeiro no seu celular.",
      },
    ],
  }),
  component: ComoInstalar,
});

function ComoInstalar() {
  const { t } = useIdioma();

  const android = [
    t("Abra este site no Chrome.", "Open this site in Chrome."),
    t(
      "Toque nos três pontinhos no canto superior direito.",
      "Tap the three dots in the top right corner.",
    ),
    t(
      'Escolha "Instalar app" ou "Adicionar à tela inicial".',
      'Choose "Install app" or "Add to Home screen".',
    ),
    t(
      "Confirme. O porquinho aparece na sua tela inicial.",
      "Confirm. The piggy icon appears on your home screen.",
    ),
  ];

  const iphone = [
    t("Abra este site no Safari.", "Open this site in Safari."),
    t(
      "Toque no botão de compartilhar (quadrado com seta).",
      "Tap the share button (square with an arrow).",
    ),
    t('Escolha "Adicionar à Tela de Início".', 'Choose "Add to Home Screen".'),
    t("Toque em Adicionar.", "Tap Add."),
  ];

  const reinstalar = [
    t(
      "Segure o ícone antigo na tela inicial e escolha Desinstalar.",
      "Press and hold the old icon on the home screen and choose Uninstall.",
    ),
    t(
      "No Chrome, abra Configurações do site do Wise Money e limpe os dados desse site.",
      "In Chrome, open the Wise Money site settings and clear this site's data.",
    ),
    t(
      "Abra o link de novo, espere carregar e instale outra vez.",
      "Open the link again, wait for it to load and install once more.",
    ),
  ];

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm font-semibold text-primary">
          {t("Voltar", "Back")}
        </Link>
        <LanguageSwitcher />
      </div>

      <h1 className="mt-6 font-display text-3xl leading-tight">
        {t("Instalar o Wise Money no celular", "Install Wise Money on your phone")}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {t(
          "É rapidinho. Escolha o seu tipo de celular abaixo.",
          "It only takes a minute. Pick your phone below.",
        )}
      </p>

      <section className="surface-card mt-6 p-6 shadow-soft">
        <p className="flex items-center gap-2 font-display text-2xl">
          <Smartphone className="size-6 text-primary" />
          Android
        </p>
        <ol className="mt-4 space-y-3 text-lg">
          {android.map((passo, i) => (
            <li key={passo} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-base font-semibold text-primary">
                {i + 1}
              </span>
              <span>{passo}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="surface-card mt-5 p-6 shadow-soft">
        <p className="flex items-center gap-2 font-display text-2xl">
          <Apple className="size-6 text-primary" />
          iPhone
        </p>
        <ol className="mt-4 space-y-3 text-lg">
          {iphone.map((passo, i) => (
            <li key={passo} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-base font-semibold text-primary">
                {i + 1}
              </span>
              <span>{passo}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="surface-card mt-5 p-6 shadow-soft">
        <p className="flex items-center gap-2 font-display text-2xl">
          <TriangleAlert className="size-6 text-primary" />
          {t("Apareceu um aviso do Android?", "Did Android show a warning?")}
        </p>
        <p className="mt-2 text-base text-muted-foreground">
          {t(
            "Se o celular avisou que o app é de uma versão antiga do Android, faça a instalação de novo assim:",
            "If your phone warned that the app is built for an older Android version, reinstall it like this:",
          )}
        </p>
        <ol className="mt-4 space-y-3 text-lg">
          {reinstalar.map((passo, i) => (
            <li key={passo} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-base font-semibold text-primary">
                {i + 1}
              </span>
              <span>{passo}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-base text-muted-foreground">
          {t(
            "O Wise Money também funciona normalmente pelo navegador, sem instalar nada.",
            "Wise Money also works normally in the browser, with no install needed.",
          )}
        </p>
      </section>

      <Link
        to="/entrar"
        className="mt-6 block rounded-full bg-primary px-6 py-4 text-center text-lg font-semibold text-primary-foreground"
      >
        {t("Entrar no Wise Money", "Go to Wise Money")}
      </Link>
    </main>
  );
}
