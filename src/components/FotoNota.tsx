import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileUp,
  History,
  Loader2,
  RefreshCw,
  ShieldQuestion,
  Trash2,
  Wand2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { CATEGORIAS_GASTO, CATEGORIA_EN, type CategoriaGasto } from "@/lib/categorias";
import { useIdioma } from "@/lib/i18n";
import {
  lerRecibo,
  registrarDespesasDoRecibo,
  verificarDuplicidadeRecibo,
} from "@/lib/recibo.functions";

type Campo = "descricao" | "valor" | "categoria" | "data" | "estabelecimento" | "hora" | "local";

type Item = {
  descricao: string;
  valor: number;
  categoria: CategoriaGasto;
  data: string;
  estabelecimento: string | null;
  hora: string | null;
  local: string | null;
  confianca?: number;
  campos_incertos?: Campo[];
};

type Tentativa = {
  em: string;
  ajuste: string | null;
  observacao: string;
  itens: Item[];
};

type Duplicidade = {
  duplicado: boolean;
  total: number;
  exemplos: {
    id: string;
    descricao: string;
    valor: number;
    data?: string;
    hora: string | null;
  }[];
};

type Regras = {
  janelaHoras: number;
  compararValor: boolean;
  compararEstabelecimento: boolean;
  compararDescricao: boolean;
};

const REGRAS_PADRAO: Regras = {
  janelaHoras: 0,
  compararValor: true,
  compararEstabelecimento: true,
  compararDescricao: false,
};

const JANELAS = [0, 1, 3, 6, 12, 24, 72, 168] as const;

/** Reduz a foto para no máximo 1400px e converte em JPEG base64. */
async function prepararImagem(arquivo: File): Promise<string> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("imagem inválida"));
      el.src = url;
    });
    const max = 1400;
    const escala = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * escala);
    canvas.height = Math.round(img.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("sem canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function lerComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error("leitura"));
    leitor.readAsDataURL(arquivo);
  });
}

/** Fotos são comprimidas; PDFs vão inteiros para a Nina ler. */
async function prepararArquivo(arquivo: File) {
  const ehPdf = arquivo.type === "application/pdf" || /\.pdf$/i.test(arquivo.name);
  if (ehPdf) {
    if (arquivo.size > 6_000_000) throw new Error("grande");
    return {
      dados: await lerComoDataUrl(arquivo),
      mime: "application/pdf",
      nome: arquivo.name,
    };
  }
  return { dados: await prepararImagem(arquivo), mime: "image/jpeg", nome: arquivo.name };
}

/** Limiares escolhidos pela pessoa na tela de Auditoria (com padrão seguro). */
const LIMIARES = {
  geral: 0.7,
  alerta: 0.7,
  valor: 0.8,
  data: 0.7,
  estabelecimento: 0.6,
  categoria: 0.6,
};

function limiarDoCampo(campo: Campo) {
  if (campo === "valor") return LIMIARES.valor;
  if (campo === "data") return LIMIARES.data;
  if (campo === "estabelecimento") return LIMIARES.estabelecimento;
  if (campo === "categoria") return LIMIARES.categoria;
  return LIMIARES.geral;
}

function duvidoso(item: Item) {
  return (item.confianca ?? 1) < LIMIARES.geral || (item.campos_incertos ?? []).length > 0;
}

function incerto(item: Item, campo: Campo) {
  return (item.campos_incertos ?? []).includes(campo) || (item.confianca ?? 1) < limiarDoCampo(campo);
}

function classeCampo(item: Item, campo: Campo) {
  return incerto(item, campo)
    ? "border-destructive bg-destructive/5 ring-1 ring-destructive/30"
    : "border-primary/15 bg-background";
}

export function FotoNota({ disabled }: { disabled?: boolean }) {
  const { t, idioma } = useIdioma();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const ler = useServerFn(lerRecibo);
  const registrar = useServerFn(registrarDespesasDoRecibo);
  const checarDuplicidade = useServerFn(verificarDuplicidadeRecibo);
  const auditar = useServerFn(registrarAuditoria);
  const obterLim = useServerFn(obterLimiares);

  const { data: limiares } = useQuery({ queryKey: ["limiares"], queryFn: () => obterLim() });
  if (limiares) {
    LIMIARES.geral = limiares.limiar_geral;
    LIMIARES.alerta = limiares.alerta_medio;
    LIMIARES.valor = limiares.limiar_valor;
    LIMIARES.data = limiares.limiar_data;
    LIMIARES.estabelecimento = limiares.limiar_estabelecimento;
    LIMIARES.categoria = limiares.limiar_categoria;
  }

  const [previa, setPrevia] = useState<string | null>(null);
  const [mime, setMime] = useState<string>("image/jpeg");
  const [nomeArquivo, setNomeArquivo] = useState<string>("");
  const [itens, setItens] = useState<Item[] | null>(null);
  const [observacao, setObservacao] = useState("");
  const [ajuste, setAjuste] = useState("");
  const [historico, setHistorico] = useState<Tentativa[]>([]);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [anexar, setAnexar] = useState(true);
  const [duplicidade, setDuplicidade] = useState<Duplicidade | null>(null);
  const [ignorarDuplicidade, setIgnorarDuplicidade] = useState(false);
  const [regras, setRegras] = useState<Regras>(REGRAS_PADRAO);
  const [regrasAbertas, setRegrasAbertas] = useState(false);
  const [soDuvidosos, setSoDuvidosos] = useState(false);
  const [falhouLeitura, setFalhouLeitura] = useState(false);
  const [checando, setChecando] = useState(false);

  const ehPdf = mime === "application/pdf";

  async function rodarDuplicidade(lista: Item[], regrasAtuais: Regras) {
    const primeiroItem = lista[0];
    if (!primeiroItem) return;
    setChecando(true);
    try {
      const d = await checarDuplicidade({
        data: {
          data: primeiroItem.data,
          estabelecimento: primeiroItem.estabelecimento ?? null,
          hora: primeiroItem.hora ?? null,
          valores: lista.map((i) => i.valor),
          descricoes: lista.map((i) => i.descricao),
          janelaHoras: regrasAtuais.janelaHoras,
          compararValor: regrasAtuais.compararValor,
          compararEstabelecimento: regrasAtuais.compararEstabelecimento,
          compararDescricao: regrasAtuais.compararDescricao,
        },
      });
      setDuplicidade(d as Duplicidade);
      setIgnorarDuplicidade(false);
    } catch {
      setDuplicidade(null);
    } finally {
      setChecando(false);
    }
  }

  const leitura = useMutation({
    mutationFn: async (entrada: { arquivo?: File; ajuste?: string }) => {
      let imagem = previa;
      let tipo = mime;
      let nome = nomeArquivo;
      if (entrada.arquivo) {
        const preparado = await prepararArquivo(entrada.arquivo);
        imagem = preparado.dados;
        tipo = preparado.mime;
        nome = preparado.nome;
        setPrevia(imagem);
        setMime(tipo);
        setNomeArquivo(nome);
      }
      if (!imagem) throw new Error("sem imagem");
      return ler({
        data: {
          imagem,
          idioma: idioma === "en" ? "en" : "pt",
          mime: tipo,
          nomeArquivo: nome || "comprovante",
          ...(entrada.ajuste ? { ajuste: entrada.ajuste } : {}),
        },
      });
    },
    onSuccess: (r, entrada) => {
      const lista = r.itens as Item[];
      setItens(lista);
      setObservacao(r.observacao);
      setDuplicidade(null);
      setIgnorarDuplicidade(false);
      setSoDuvidosos(false);
      setHistorico((h) => [
        ...h,
        {
          em: new Date().toISOString(),
          ajuste: entrada.ajuste ?? null,
          observacao: r.observacao,
          itens: lista,
        },
      ]);
      setAjuste("");
      if (lista.length === 0) {
        setFalhouLeitura(true);
        toast.info(
          t("Não consegui ler despesas nesse arquivo", "I could not read any expense in this file"),
        );
      } else {
        setFalhouLeitura(false);
        void rodarDuplicidade(lista, regras);
      }
    },
    onError: (erro) => {
      setFalhouLeitura(true);
      if (erro instanceof Error && erro.message === "grande") {
        toast.error(t("Esse PDF é muito grande (máx. 6 MB).", "This PDF is too large (max 6 MB)."));
        return;
      }
      toast.error(
        t(
          "Não consegui ler o arquivo. Tente com mais luz e o papel esticado.",
          "I could not read the file. Try again with more light and the paper flat.",
        ),
      );
    },
  });

  const salvar = useMutation({
    mutationFn: async (lista: Item[]) => {
      const r = await registrar({
        data: { itens: lista, ...(anexar && previa ? { imagem: previa, mime } : {}) },
      });
      try {
        const media =
          lista.length > 0 ? lista.reduce((s, i) => s + (i.confianca ?? 1), 0) / lista.length : 1;
        await auditar({
          data: {
            comprovante: r.comprovante ?? null,
            estabelecimento: lista[0]?.estabelecimento ?? null,
            data: lista[0]?.data ?? null,
            arquivoTipo: mime,
            totalItens: lista.length,
            itensBaixaConfianca: lista.filter(duvidoso).length,
            confiancaMedia: Math.min(1, Math.max(0, media)),
            tentativasOcr: Math.max(1, historico.length),
            duplicidadeTotal: duplicidade?.total ?? 0,
            duplicidadeIgnorada: ignorarDuplicidade,
            observacao: observacao.slice(0, 400),
            edicoes: diferencas(historico[0]?.itens ?? [], lista),
            itens: lista.map((i) => ({
              descricao: i.descricao,
              valor: i.valor,
              categoria: i.categoria,
              data: i.data,
              ...(typeof i.confianca === "number" ? { confianca: i.confianca } : {}),
            })),
          },
        });
      } catch {
        /* a auditoria é um extra: nunca impede o registro da despesa */
      }
      return r;
    },
    onSuccess: (r) => {
      toast.success(t(`${r.total} despesa(s) registrada(s)!`, `${r.total} expense(s) saved!`));
      fechar();
      void qc.invalidateQueries();
    },
    onError: () => toast.error(t("Não consegui salvar agora.", "I could not save right now.")),
  });

  function fechar() {
    setItens(null);
    setPrevia(null);
    setMime("image/jpeg");
    setNomeArquivo("");
    setObservacao("");
    setAjuste("");
    setHistorico([]);
    setHistoricoAberto(false);
    setDuplicidade(null);
    setIgnorarDuplicidade(false);
    setAnexar(true);
    setSoDuvidosos(false);
    setFalhouLeitura(false);
    setRegras(REGRAS_PADRAO);
    setRegrasAbertas(false);
    if (inputRef.current) inputRef.current.value = "";
    if (arquivoRef.current) arquivoRef.current.value = "";
  }

  function atualizar(i: number, campo: Partial<Item>) {
    setItens((atual) =>
      atual
        ? atual.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  ...campo,
                  campos_incertos: (item.campos_incertos ?? []).filter(
                    (c) => !Object.keys(campo).includes(c),
                  ),
                }
              : item,
          )
        : atual,
    );
  }

  /** Aplica um valor em todos os itens — ou só nos duvidosos, quando pedido. */
  function aplicarEmTodos(
    campo: "estabelecimento" | "categoria" | "data",
    valor: string,
    apenasDuvidosos = false,
  ) {
    setItens((atual) =>
      atual
        ? atual.map((item) =>
            apenasDuvidosos && !duvidoso(item)
              ? item
              : {
                  ...item,
                  ...(campo === "estabelecimento"
                    ? { estabelecimento: valor || null }
                    : campo === "categoria"
                      ? { categoria: valor as CategoriaGasto }
                      : { data: valor }),
                  campos_incertos: (item.campos_incertos ?? []).filter((c) => c !== campo),
                },
          )
        : atual,
    );
    toast.success(
      apenasDuvidosos
        ? t("Aplicado nos itens duvidosos.", "Applied to the uncertain items.")
        : t("Aplicado em todos os itens.", "Applied to every item."),
    );
  }

  /** Marca os itens duvidosos como conferidos (tira o alerta vermelho). */
  function marcarConferidos() {
    setItens((atual) =>
      atual ? atual.map((i) => ({ ...i, confianca: 1, campos_incertos: [] })) : atual,
    );
    setSoDuvidosos(false);
    toast.success(t("Itens marcados como conferidos.", "Items marked as checked."));
  }

  function removerDuvidosos() {
    setItens((atual) => (atual ? atual.filter((i) => !duvidoso(i)) : atual));
    setSoDuvidosos(false);
    toast.success(t("Itens duvidosos removidos.", "Uncertain items removed."));
  }

  const total = (itens ?? []).reduce((s, i) => s + (Number.isFinite(i.valor) ? i.valor : 0), 0);
  const local = itens?.find((i) => i.estabelecimento || i.hora || i.local);
  const duvidososLista = (itens ?? []).filter(duvidoso);
  const baixaConfianca = duvidososLista.length;
  const confiancaMedia =
    (itens ?? []).length > 0
      ? (itens ?? []).reduce((s, i) => s + (i.confianca ?? 1), 0) / (itens ?? []).length
      : 1;
  const alertaGeral = (itens ?? []).length > 0 && confiancaMedia < LIMIARES.alerta;
  const primeiro = itens?.[0];
  const primeiroDuvidoso = duvidososLista[0];
  const baseLote = soDuvidosos ? primeiroDuvidoso : primeiro;
  const visiveis = (itens ?? [])
    .map((item, indice) => ({ item, indice }))
    .filter(({ item }) => !soDuvidosos || duvidoso(item));
  const bloqueado = Boolean(duplicidade?.duplicado) && !ignorarDuplicidade;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) leitura.mutate({ arquivo });
        }}
      />
      <input
        ref={arquivoRef}
        type="file"
        accept="image/*,application/pdf,.pdf"
        className="sr-only"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) leitura.mutate({ arquivo });
        }}
      />
      <button
        type="button"
        disabled={disabled || leitura.isPending || salvar.isPending}
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-primary/10 disabled:opacity-50"
      >
        {leitura.isPending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Camera className="size-5" />
        )}
        {leitura.isPending ? t("Lendo…", "Reading…") : t("Foto da nota", "Photo of receipt")}
      </button>
      <button
        type="button"
        disabled={disabled || leitura.isPending || salvar.isPending}
        onClick={() => arquivoRef.current?.click()}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-primary/10 disabled:opacity-50"
      >
        <FileUp className="size-5" />
        {t("Importar arquivo (PDF/foto)", "Import file (PDF/photo)")}
      </button>

      {(itens || falhouLeitura) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl">
            <h2 className="font-display text-xl">
              {t("Confira antes de registrar", "Check before saving")}
            </h2>
            {observacao && <p className="mt-1 text-sm text-muted-foreground">{observacao}</p>}

            {(falhouLeitura || alertaGeral) && (
              <div className="mt-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <AlertTriangle className="size-4" />
                  {falhouLeitura
                    ? t(
                        "A leitura falhou: não consegui identificar despesas nesse arquivo.",
                        "The reading failed: I could not find expenses in this file.",
                      )
                    : t(
                        `Leitura pouco confiável (${Math.round(confiancaMedia * 100)}% em média). Vale reprocessar.`,
                        `Low overall confidence (${Math.round(confiancaMedia * 100)}% average). Worth reprocessing.`,
                      )}
                </p>
                <button
                  type="button"
                  disabled={leitura.isPending || !previa}
                  onClick={() => leitura.mutate({})}
                  className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-destructive px-4 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
                >
                  {leitura.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {t("Reprocessar agora", "Reprocess now")}
                </button>
              </div>
            )}

            {local && (
              <p className="mt-2 rounded-2xl bg-primary/10 px-3 py-2 text-sm text-foreground">
                {[
                  local.estabelecimento,
                  local.hora ? `${t("às", "at")} ${local.hora}` : null,
                  local.local,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            {previa &&
              (ehPdf ? (
                <p className="mt-3 rounded-2xl bg-secondary/60 px-3 py-2 text-sm">
                  {t("Arquivo PDF:", "PDF file:")} {nomeArquivo}
                </p>
              ) : (
                <img
                  src={previa}
                  alt={t("Comprovante enviado", "Receipt you sent")}
                  className="mt-3 max-h-40 w-full rounded-2xl object-contain"
                />
              ))}

            {/* Regras de duplicidade configuráveis */}
            {itens && itens.length > 0 && (
              <div className="mt-3 rounded-2xl border border-primary/15 p-3">
                <button
                  type="button"
                  onClick={() => setRegrasAbertas((a) => !a)}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
                >
                  <ShieldQuestion className="size-4" />
                  {t("Regras de duplicidade", "Duplicate rules")}
                </button>
                {regrasAbertas && (
                  <div className="mt-2 space-y-3">
                    <label className="block text-sm font-semibold">
                      {t("Comparar dentro de", "Compare within")}
                      <select
                        value={regras.janelaHoras}
                        onChange={(e) =>
                          setRegras((r) => ({ ...r, janelaHoras: Number(e.target.value) }))
                        }
                        className="mt-1 w-full rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-base font-normal"
                      >
                        {JANELAS.map((h) => (
                          <option key={h} value={h}>
                            {h === 0
                              ? t("apenas o mesmo dia", "same day only")
                              : t(`${h} hora(s)`, `${h} hour(s)`)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {(
                      [
                        ["compararValor", t("Mesmo valor", "Same amount")],
                        ["compararEstabelecimento", t("Mesmo estabelecimento", "Same place")],
                        ["compararDescricao", t("Mesma descrição", "Same description")],
                      ] as const
                    ).map(([chave, rotulo]) => (
                      <label key={chave} className="flex items-center gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={regras[chave]}
                          onChange={(e) => setRegras((r) => ({ ...r, [chave]: e.target.checked }))}
                          className="size-5"
                        />
                        {rotulo}
                      </label>
                    ))}
                    <button
                      type="button"
                      disabled={checando}
                      onClick={() => void rodarDuplicidade(itens, regras)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground disabled:opacity-50"
                    >
                      {checando ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      {t("Verificar de novo", "Check again")}
                    </button>
                    {!checando && duplicidade && !duplicidade.duplicado && (
                      <p className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle2 className="size-4" />
                        {t(
                          "Nenhum lançamento parecido com essas regras.",
                          "No similar entry with these rules.",
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {duplicidade?.duplicado && (
              <div className="mt-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <AlertTriangle className="size-4" />
                  {t(
                    `Parece que este comprovante já foi registrado (${duplicidade.total} lançamento(s) igual(is)).`,
                    `This receipt seems to be already saved (${duplicidade.total} matching entr${duplicidade.total === 1 ? "y" : "ies"}).`,
                  )}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-foreground">
                  {duplicidade.exemplos.map((e) => (
                    <li key={e.id}>
                      • {e.descricao} — R$ {e.valor.toFixed(2).replace(".", ",")}
                      {e.data ? ` · ${e.data}` : ""}
                      {e.hora ? ` ${e.hora}` : ""}
                    </li>
                  ))}
                </ul>
                <label className="mt-2 flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={ignorarDuplicidade}
                    onChange={(e) => setIgnorarDuplicidade(e.target.checked)}
                    className="size-5"
                  />
                  {t("Registrar mesmo assim", "Save anyway")}
                </label>
              </div>
            )}

            {itens && (
              <>
                <p className="mt-4 text-sm font-semibold text-muted-foreground">
                  {t(
                    `${itens.length} despesa(s) encontrada(s) — ajuste o que precisar`,
                    `${itens.length} expense(s) found — edit anything you need`,
                  )}
                </p>

                {baixaConfianca > 0 && (
                  <div className="mt-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm font-semibold text-destructive">
                      {t(
                        `${baixaConfianca} item(ns) com leitura duvidosa.`,
                        `${baixaConfianca} item(s) with uncertain reading.`,
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSoDuvidosos((v) => !v)}
                        className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
                          soDuvidosos
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {soDuvidosos
                          ? t("Mostrar todos os itens", "Show every item")
                          : t(
                              `Revisar só os duvidosos (${baixaConfianca})`,
                              `Review only the uncertain ones (${baixaConfianca})`,
                            )}
                      </button>
                      <button
                        type="button"
                        onClick={marcarConferidos}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground"
                      >
                        <CheckCircle2 className="size-4" />
                        {t("Marcar como conferidos", "Mark as checked")}
                      </button>
                      <button
                        type="button"
                        onClick={removerDuvidosos}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold text-destructive"
                      >
                        <Trash2 className="size-4" />
                        {t("Remover duvidosos", "Remove uncertain")}
                      </button>
                    </div>
                  </div>
                )}

                {itens.length > 1 && baseLote && (
                  <div className="mt-3 rounded-2xl border border-primary/15 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Wand2 className="size-4" />
                      {soDuvidosos
                        ? t("Aplicar nos itens duvidosos", "Apply to the uncertain items")
                        : t("Aplicar em todos os itens", "Apply to every item")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {baseLote.estabelecimento && (
                        <button
                          type="button"
                          onClick={() =>
                            aplicarEmTodos(
                              "estabelecimento",
                              baseLote.estabelecimento!,
                              soDuvidosos,
                            )
                          }
                          className="min-h-11 rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground"
                        >
                          {t("Mesmo estabelecimento", "Same place")}: {baseLote.estabelecimento}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => aplicarEmTodos("categoria", baseLote.categoria, soDuvidosos)}
                        className="min-h-11 rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground"
                      >
                        {t("Mesma categoria", "Same category")}:{" "}
                        {idioma === "en" ? CATEGORIA_EN[baseLote.categoria] : baseLote.categoria}
                      </button>
                      <button
                        type="button"
                        onClick={() => aplicarEmTodos("data", baseLote.data, soDuvidosos)}
                        className="min-h-11 rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground"
                      >
                        {t("Mesma data", "Same date")}: {baseLote.data}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-2 space-y-3">
                  {visiveis.map(({ item, indice }) => (
                    <div key={indice} className="rounded-2xl bg-secondary/60 p-3">
                      {(item.confianca ?? 1) < 1 && (
                        <p
                          className={`mb-2 text-xs font-semibold ${
                            (item.confianca ?? 1) < LIMIARES.geral
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {t("Confiança da leitura", "Reading confidence")}:{" "}
                          {Math.round((item.confianca ?? 0.8) * 100)}%
                          {(item.campos_incertos ?? []).length > 0 &&
                            ` · ${t("conferir", "check")}: ${(item.campos_incertos ?? []).join(", ")}`}
                        </p>
                      )}
                      <input
                        value={item.descricao}
                        onChange={(e) => atualizar(indice, { descricao: e.target.value })}
                        aria-label={t("Descrição", "Description")}
                        className={`w-full rounded-xl border px-3 py-2.5 text-base ${classeCampo(item, "descricao")}`}
                      />
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.valor}
                          onChange={(e) => atualizar(indice, { valor: Number(e.target.value) })}
                          aria-label={t("Valor", "Amount")}
                          className={`rounded-xl border px-3 py-2.5 text-base ${classeCampo(item, "valor")}`}
                        />
                        <input
                          type="date"
                          value={item.data}
                          onChange={(e) => atualizar(indice, { data: e.target.value })}
                          aria-label={t("Data", "Date")}
                          className={`rounded-xl border px-3 py-2.5 text-base ${classeCampo(item, "data")}`}
                        />
                        <select
                          value={item.categoria}
                          onChange={(e) =>
                            atualizar(indice, { categoria: e.target.value as CategoriaGasto })
                          }
                          aria-label={t("Categoria", "Category")}
                          className={`col-span-2 rounded-xl border px-3 py-2.5 text-base ${classeCampo(item, "categoria")}`}
                        >
                          {CATEGORIAS_GASTO.map((c) => (
                            <option key={c} value={c}>
                              {idioma === "en" ? CATEGORIA_EN[c] : c}
                            </option>
                          ))}
                        </select>
                        <input
                          value={item.estabelecimento ?? ""}
                          onChange={(e) =>
                            atualizar(indice, { estabelecimento: e.target.value || null })
                          }
                          placeholder={t("Estabelecimento", "Place")}
                          aria-label={t("Estabelecimento", "Place")}
                          className={`rounded-xl border px-3 py-2.5 text-base ${classeCampo(item, "estabelecimento")}`}
                        />
                        <input
                          value={item.hora ?? ""}
                          onChange={(e) => atualizar(indice, { hora: e.target.value || null })}
                          placeholder={t("Horário", "Time")}
                          aria-label={t("Horário", "Time")}
                          className={`rounded-xl border px-3 py-2.5 text-base ${classeCampo(item, "hora")}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setItens(itens.filter((_, idx) => idx !== indice))}
                        className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-destructive"
                      >
                        <Trash2 className="size-4" />
                        {t("Remover este item", "Remove this item")}
                      </button>
                    </div>
                  ))}
                </div>

                <p className="mt-4 font-display text-lg">
                  {t("Total", "Total")}: R$ {total.toFixed(2).replace(".", ",")}
                </p>

                <label className="mt-3 flex items-center gap-2 rounded-2xl bg-secondary/60 p-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={anexar}
                    onChange={(e) => setAnexar(e.target.checked)}
                    className="size-5"
                  />
                  {t(
                    "Guardar o comprovante junto com as despesas",
                    "Keep the receipt with these expenses",
                  )}
                </label>
              </>
            )}

            <div className="mt-4 rounded-2xl border border-primary/15 p-3">
              <p className="text-sm font-semibold">
                {t("A leitura saiu errada?", "Did the reading come out wrong?")}
              </p>
              <textarea
                value={ajuste}
                onChange={(e) => setAjuste(e.target.value)}
                rows={2}
                placeholder={t(
                  "Ex.: o total é 87,90 e são 4 itens; a data é 12/08",
                  "E.g.: the total is 87.90 with 4 items; the date is Aug 12",
                )}
                className="mt-2 w-full rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-base"
              />
              <button
                type="button"
                disabled={leitura.isPending || !previa}
                onClick={() => {
                  const texto = ajuste.trim();
                  leitura.mutate(texto ? { ajuste: texto } : {});
                }}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground disabled:opacity-50"
              >
                {leitura.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {t("Ler de novo", "Read again")}
              </button>
            </div>

            {historico.length > 1 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setHistoricoAberto((a) => !a)}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
                >
                  <History className="size-4" />
                  {t(
                    `Histórico de leituras (${historico.length})`,
                    `Reading history (${historico.length})`,
                  )}
                </button>
                {historicoAberto && (
                  <ul className="mt-2 space-y-2">
                    {historico.map((h, i) => (
                      <li key={h.em} className="rounded-2xl bg-secondary/60 p-3 text-sm">
                        <p className="font-semibold">
                          {t(`Leitura ${i + 1}`, `Reading ${i + 1}`)} ·{" "}
                          {new Date(h.em).toLocaleTimeString(idioma === "en" ? "en-US" : "pt-BR")} ·{" "}
                          {t(`${h.itens.length} item(ns)`, `${h.itens.length} item(s)`)}
                        </p>
                        {h.ajuste && (
                          <p className="mt-1 text-muted-foreground">
                            {t("Ajuste pedido:", "Adjustment asked:")} {h.ajuste}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setItens(h.itens);
                            setObservacao(h.observacao);
                            setFalhouLeitura(h.itens.length === 0);
                          }}
                          className="mt-2 min-h-11 rounded-full bg-background px-4 text-sm font-semibold text-primary"
                        >
                          {t("Usar esta leitura", "Use this reading")}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={!itens || itens.length === 0 || salvar.isPending || bloqueado}
                onClick={() => itens && salvar.mutate(itens)}
                className="min-h-12 flex-1 rounded-full bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {salvar.isPending
                  ? t("Registrando…", "Saving…")
                  : bloqueado
                    ? t("Confirme a duplicidade", "Confirm the duplicate")
                    : t("Registrar despesas", "Save expenses")}
              </button>
              <button
                type="button"
                onClick={fechar}
                className="min-h-12 flex-1 rounded-full bg-secondary px-5 font-semibold text-secondary-foreground"
              >
                {t("Cancelar", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
