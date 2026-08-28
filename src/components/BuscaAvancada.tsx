import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { useState } from "react";

import { VerComprovante } from "@/components/VerComprovante";
import { buscarLancamentos } from "@/lib/busca.functions";
import { CATEGORIAS_GASTO } from "@/lib/categorias";
import { brl, categoriaLabel, dataCurta } from "@/lib/format";
import { useIdioma } from "@/lib/i18n";

const campo =
  "mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary";

export function BuscaAvancada() {
  const { t, idioma } = useIdioma();
  const buscar = useServerFn(buscarLancamentos);

  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = `${hoje.slice(0, 7)}-01`;

  const [inicio, setInicio] = useState(inicioMes);
  const [fim, setFim] = useState(hoje);
  const [texto, setTexto] = useState("");
  const [estabelecimento, setEstabelecimento] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [comComprovante, setComComprovante] = useState(false);
  const [soDuplicados, setSoDuplicados] = useState(false);
  const [soRevisados, setSoRevisados] = useState(false);

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) && v.trim() !== "" ? n : undefined;
  };

  const busca = useMutation({
    mutationFn: () =>
      buscar({
        data: {
          inicio,
          fim,
          ...(texto ? { texto } : {}),
          ...(estabelecimento ? { estabelecimento } : {}),
          ...(categoria ? { categoria } : {}),
          ...(num(valorMin) !== undefined ? { valorMin: num(valorMin)! } : {}),
          ...(num(valorMax) !== undefined ? { valorMax: num(valorMax)! } : {}),
          somenteComComprovante: comComprovante,
          somenteDuplicados: soDuplicados,
          somenteRevisados: soRevisados,
        },
      }),
  });

  const r = busca.data;

  return (
    <section className="surface-card p-6">
      <h2 className="flex items-center gap-2 font-display text-2xl">
        <Search className="size-5 text-primary" />
        {t("Busca avançada", "Advanced search")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(
          "Procure por período, estabelecimento, categoria e valor. Marcamos o que já foi revisado e o que parece repetido.",
          "Search by date range, merchant, category and amount. We flag what was reviewed and what looks duplicated.",
        )}
      </p>

      <form
        className="mt-5 grid gap-4 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          busca.mutate();
        }}
      >
        <label className="block">
          <span className="text-sm font-semibold">{t("De", "From")}</span>
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">{t("Até", "To")}</span>
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">{t("Categoria", "Category")}</span>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={`${campo} capitalize`}
          >
            <option value="">{t("Todas", "All")}</option>
            {CATEGORIAS_GASTO.map((c) => (
              <option key={c} value={c}>
                {categoriaLabel(c, idioma)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold">{t("Descrição contém", "Description contains")}</span>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={t("padaria", "bakery")}
            className={campo}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">{t("Estabelecimento", "Merchant")}</span>
          <input
            value={estabelecimento}
            onChange={(e) => setEstabelecimento(e.target.value)}
            placeholder={t("Mercado", "Market")}
            className={campo}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-semibold">{t("Valor mín.", "Min amount")}</span>
            <input inputMode="decimal" value={valorMin} onChange={(e) => setValorMin(e.target.value)} className={campo} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">{t("Valor máx.", "Max amount")}</span>
            <input inputMode="decimal" value={valorMax} onChange={(e) => setValorMax(e.target.value)} className={campo} />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:col-span-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={comComprovante} onChange={(e) => setComComprovante(e.target.checked)} />
            {t("Só com comprovante", "With receipt only")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soDuplicados} onChange={(e) => setSoDuplicados(e.target.checked)} />
            {t("Só possíveis duplicados", "Possible duplicates only")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soRevisados} onChange={(e) => setSoRevisados(e.target.checked)} />
            {t("Só revisados manualmente", "Manually reviewed only")}
          </label>
          <button
            type="submit"
            disabled={busca.isPending}
            className="ml-auto rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busca.isPending ? t("Buscando…", "Searching…") : t("Buscar", "Search")}
          </button>
        </div>
      </form>

      {r && (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground">
            {t(
              `${r.quantidade} lançamento(s) · total ${brl(r.total)} · ${r.duplicados} possível(is) duplicado(s) · ${r.revisados} revisado(s)`,
              `${r.quantidade} entries · total ${brl(r.total)} · ${r.duplicados} possible duplicate(s) · ${r.revisados} reviewed`,
            )}
          </p>
          <ul className="mt-3 divide-y divide-primary/10">
            {r.itens.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{i.descricao}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {categoriaLabel(i.categoria, idioma)} · {dataCurta(i.data)}
                    {i.estabelecimento ? ` · ${i.estabelecimento}` : ""}
                  </p>
                </div>
                {i.duplicado && (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                    {t("possível duplicado", "possible duplicate")}
                  </span>
                )}
                {i.revisado && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {t("revisado", "reviewed")}
                  </span>
                )}
                <span className="ml-auto font-display text-lg">{brl(i.valor)}</span>
                {i.comprovante && <VerComprovante caminho={i.comprovante} />}
              </li>
            ))}
          </ul>
          {r.itens.length === 0 && (
            <p className="mt-3 text-muted-foreground">
              {t("Nada encontrado com esses filtros.", "Nothing found with these filters.")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
