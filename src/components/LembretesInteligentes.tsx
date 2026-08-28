import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { BellRing, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import { getLembretes } from "@/lib/lembretes.functions";
import { useIdioma } from "@/lib/i18n";

const ROTAS = {
  conversa: "/conversa",
  auditoria: "/auditoria",
  resumo: "/resumo",
  metas: "/metas",
} as const;

/** Lembretes inteligentes de registro e revisão de itens duvidosos. */
export function LembretesInteligentes() {
  const { t, idioma } = useIdioma();
  const buscar = useServerFn(getLembretes);
  const { data } = useQuery({
    queryKey: ["lembretes"],
    queryFn: () => buscar(),
    staleTime: 60_000,
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="surface-card p-5">
      <div className="flex items-center gap-2">
        <BellRing className="size-5 text-primary" />
        <p className="font-display text-lg">{t("Lembretes para você", "Reminders for you")}</p>
      </div>
      <ul className="mt-3 space-y-3">
        {data.map((l) => {
          const Icone = l.tom === "atencao" ? TriangleAlert : l.tom === "bom" ? CheckCircle2 : Info;
          const cor =
            l.tom === "atencao"
              ? "text-destructive"
              : l.tom === "bom"
                ? "text-primary"
                : "text-muted-foreground";
          return (
            <li key={l.chave} className="rounded-2xl bg-secondary/60 p-4">
              <div className="flex items-start gap-3">
                <Icone className={`mt-0.5 size-5 shrink-0 ${cor}`} />
                <div className="min-w-0">
                  <p className="text-base font-semibold">
                    {idioma === "en" ? l.titulo_en : l.titulo_pt}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {idioma === "en" ? l.texto_en : l.texto_pt}
                  </p>
                  {l.tom !== "bom" && (
                    <Link
                      to={ROTAS[l.acao]}
                      className="mt-2 inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
                    >
                      {l.acao === "auditoria"
                        ? t("Revisar agora", "Review now")
                        : t("Registrar agora", "Record now")}
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
