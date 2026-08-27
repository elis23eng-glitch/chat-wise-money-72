import { brl, categoriaLabel, dataCurta, notaConversao, type IdiomaFormato } from "./format";

type Meta = { titulo: string; valor_alvo: number; valor_atual: number; prazo: string | null };

type Alerta = {
  tipo: string;
  periodo: "mes" | "semana";
  inicio: string;
  fim: string;
  entradas: number;
  gastos: number;
  saldo: number;
  criadoEm: string;
};

export type SecoesRelatorio = {
  resumo: boolean;
  categorias: boolean;
  metas: boolean;
  alertas: boolean;
};

export type DadosRelatorio = {
  idioma: IdiomaFormato;
  secoes: SecoesRelatorio;
  modo: "mes" | "semana";
  periodoInicio: string;
  periodoFim: string;
  entradas: number;
  gastos: number;
  saldo: number;
  saldos: {
    dia: number;
    semana: number;
    mes: number;
  };
  mediaDiaria: number;
  projecaoMes?: number;
  porCategoria: Record<string, number>;
  metas: Meta[];
  historico: Alerta[];
};

const TITULOS_ALERTA: Record<IdiomaFormato, Record<string, string>> = {
  pt: {
    saldo_negativo: "Saldo negativo",
    saldo_apertado: "Saldo apertado",
    sobra: "Sobrou dinheiro",
    projecao_vermelho: "Projeção no vermelho",
    gasto_acima_semana: "Semana mais cara que a anterior",
  },
  en: {
    saldo_negativo: "Negative balance",
    saldo_apertado: "Tight balance",
    sobra: "Money left over",
    projecao_vermelho: "Projected to end in the red",
    gasto_acima_semana: "Pricier week than the previous one",
  },
};

const T = {
  pt: {
    titulo: "Relatório financeiro",
    app: "Wise Money — assistente financeiro",
    geradoEm: "Gerado em",
    periodo: "Período",
    mes: "Este mês",
    semana: "Últimos 7 dias",
    resumo: "Resumo",
    entradas: "Entradas",
    gastos: "Saídas",
    saldo: "Saldo",
    hoje: "Hoje",
    semanaLabel: "Semana",
    mesLabel: "Mês",
    destaqueSaldo: "Seu saldo",
    mediaDiaria: "Média diária de gastos",
    projecao: "Projeção do mês",
    categorias: "Gastos por categoria",
    semCategorias: "Nenhum gasto registrado no período.",
    metas: "Metas",
    semMetas: "Nenhuma meta cadastrada.",
    prazo: "prazo",
    alertas: "Histórico de alertas",
    semAlertas: "Nenhum alerta registrado.",
    categoria: "Categoria",
    valor: "Valor",
    parte: "% do total",
    data: "Data",
    tipo: "Tipo",
    positivo: "positivo",
    negativo: "negativo",
  },
  en: {
    titulo: "Financial report",
    app: "Wise Money — financial assistant",
    geradoEm: "Generated on",
    periodo: "Period",
    mes: "This month",
    semana: "Last 7 days",
    resumo: "Summary",
    entradas: "Income",
    gastos: "Expenses",
    saldo: "Balance",
    hoje: "Today",
    semanaLabel: "Week",
    mesLabel: "Month",
    destaqueSaldo: "Your balance",
    mediaDiaria: "Daily spending average",
    projecao: "Month projection",
    categorias: "Spending by category",
    semCategorias: "No expenses recorded in this period.",
    metas: "Goals",
    semMetas: "No goals yet.",
    prazo: "due",
    alertas: "Alert history",
    semAlertas: "No alerts recorded.",
    categoria: "Category",
    valor: "Amount",
    parte: "% of total",
    data: "Date",
    tipo: "Type",
    positivo: "positive",
    negativo: "negative",
  },
};

export async function gerarRelatorioPdf(d: DadosRelatorio) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const L = T[d.idioma];
  const m = 48;
  const largura = doc.internal.pageSize.getWidth();
  let y = m;

  const quebra = (altura = 24) => {
    if (y + altura > doc.internal.pageSize.getHeight() - m) {
      doc.addPage();
      y = m;
    }
  };

  const titulo = (texto: string) => {
    quebra(40);
    y += 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 60, 48);
    doc.text(texto, m, y);
    y += 6;
    doc.setDrawColor(200, 225, 214);
    doc.line(m, y, largura - m, y);
    y += 16;
    doc.setTextColor(35, 35, 35);
  };

  const linha = (esquerda: string, direita: string, negrito = false) => {
    quebra();
    doc.setFont("helvetica", negrito ? "bold" : "normal");
    doc.setFontSize(11);
    doc.text(esquerda, m, y);
    doc.text(direita, largura - m, y, { align: "right" });
    y += 18;
  };

  // Cabeçalho
  doc.setFillColor(20, 90, 70);
  doc.rect(0, 0, largura, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(L.titulo, m, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(L.app, m, 70);
  const agora = new Date();
  doc.text(
    `${L.geradoEm} ${agora.toLocaleDateString(d.idioma === "pt" ? "pt-BR" : "en-US")} ${agora.toLocaleTimeString(
      d.idioma === "pt" ? "pt-BR" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    )}`,
    largura - m,
    70,
    { align: "right" },
  );
  doc.setTextColor(35, 35, 35);
  y = 128;

  // Período + resumo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    `${L.periodo}: ${d.modo === "semana" ? L.semana : L.mes} (${dataCurta(
      d.periodoInicio,
      d.idioma,
    )} – ${dataCurta(d.periodoFim, d.idioma)})`,
    m,
    y,
  );
  y += 8;

  const nota = notaConversao(d.idioma);
  if (nota) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(nota, m, y + 10);
    doc.setTextColor(35, 35, 35);
    y += 16;
  }

  if (d.secoes.resumo) {
    titulo(L.resumo);

    // Cartões de saldo: dia, semana e mês
    const saldos = [
      { label: L.hoje, valor: d.saldos.dia },
      { label: L.semanaLabel, valor: d.saldos.semana },
      { label: L.mesLabel, valor: d.saldos.mes },
    ];
    for (const s of saldos) {
      const positivo = s.valor >= 0;
      quebra();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(positivo ? 20 : 190, positivo ? 90 : 40, positivo ? 70 : 50);
      doc.text(
        `${s.label}: ${brl(s.valor, d.idioma)} (${positivo ? L.positivo : L.negativo})`,
        m,
        y,
      );
      doc.setTextColor(35, 35, 35);
      y += 18;
    }
    y += 6;

    linha(L.entradas, brl(d.entradas, d.idioma));
    linha(L.gastos, brl(d.gastos, d.idioma));
    linha(`${L.saldo} (${d.saldo >= 0 ? L.positivo : L.negativo})`, brl(d.saldo, d.idioma), true);
    linha(L.mediaDiaria, brl(d.mediaDiaria, d.idioma));
    if (d.modo === "mes" && typeof d.projecaoMes === "number") {
      linha(L.projecao, brl(d.projecaoMes, d.idioma));
    }
  }

  // Categorias
  if (d.secoes.categorias) {
    titulo(L.categorias);
    const cats = Object.entries(d.porCategoria).sort((a, b) => b[1] - a[1]);
    const totalCats = cats.reduce((s, [, v]) => s + v, 0);
    if (cats.length === 0) {
      linha(L.semCategorias, "");
    } else {
      for (const [nome, valor] of cats) {
        const pct = totalCats > 0 ? Math.round((valor / totalCats) * 100) : 0;
        linha(`${categoriaLabel(nome, d.idioma)} — ${pct}%`, brl(valor, d.idioma));
      }
    }
  }

  // Metas
  if (d.secoes.metas) {
    titulo(L.metas);
    if (d.metas.length === 0) {
      linha(L.semMetas, "");
    } else {
      for (const meta of d.metas) {
        const pct =
          meta.valor_alvo > 0 ? Math.round((meta.valor_atual / meta.valor_alvo) * 100) : 0;
        const prazo = meta.prazo ? ` (${L.prazo} ${dataCurta(meta.prazo, d.idioma)})` : "";
        linha(
          `${meta.titulo}${prazo} — ${pct}%`,
          `${brl(meta.valor_atual, d.idioma)} / ${brl(meta.valor_alvo, d.idioma)}`,
        );
      }
    }
  }

  // Histórico de alertas
  if (d.secoes.alertas) {
    titulo(L.alertas);
    if (d.historico.length === 0) {
      linha(L.semAlertas, "");
    } else {
      for (const a of d.historico.slice(0, 30)) {
        quebra(34);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(
          `${dataCurta(a.criadoEm.slice(0, 10), d.idioma)} — ${TITULOS_ALERTA[d.idioma][a.tipo] ?? a.tipo}`,
          m,
          y,
        );
        y += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        doc.text(
          `${a.periodo === "semana" ? L.semana : L.mes}: ${dataCurta(a.inicio, d.idioma)} – ${dataCurta(
            a.fim,
            d.idioma,
          )}  |  ${L.entradas} ${brl(a.entradas, d.idioma)}  |  ${L.gastos} ${brl(
            a.gastos,
            d.idioma,
          )}  |  ${L.saldo} ${brl(a.saldo, d.idioma)}`,
          m,
          y,
        );
        doc.setTextColor(35, 35, 35);
        y += 20;
      }
    }
  }

  // Rodapé com numeração
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(`${L.app}  ·  ${p}/${paginas}`, largura / 2, doc.internal.pageSize.getHeight() - 24, {
      align: "center",
    });
  }

  const nome = `${d.idioma === "pt" ? "relatorio" : "report"}-${d.periodoFim}.pdf`;
  return { blob: doc.output("blob") as Blob, nome };
}

/** Baixa o PDF no aparelho. */
export async function baixarRelatorioPdf(d: DadosRelatorio) {
  const { blob, nome } = await gerarRelatorioPdf(d);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Compartilha o PDF (WhatsApp, e-mail…). Volta false quando o aparelho não suporta. */
export async function compartilharRelatorioPdf(d: DadosRelatorio, titulo: string) {
  const { blob, nome } = await gerarRelatorioPdf(d);
  const arquivo = new File([blob], nome, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [arquivo] })) {
    try {
      await nav.share({ files: [arquivo], title: titulo, text: titulo });
      return true;
    } catch (erro) {
      if ((erro as DOMException)?.name === "AbortError") return true;
      return false;
    }
  }
  return false;
}

/**
 * Sobe o relatório e devolve um link temporário (7 dias) para compartilhar.
 * O arquivo fica guardado numa pasta privada do próprio usuário.
 */
export async function gerarLinkRelatorioPdf(d: DadosRelatorio) {
  const { supabase } = await import("@/integrations/supabase/client");
  const { blob, nome } = await gerarRelatorioPdf(d);

  const { data: sessao } = await supabase.auth.getUser();
  const uid = sessao.user?.id;
  if (!uid) throw new Error("sem-sessao");

  const caminho = `${uid}/${Date.now()}-${nome}`;
  const { error } = await supabase.storage
    .from("relatorios")
    .upload(caminho, blob, { contentType: "application/pdf", upsert: true });
  if (error) throw error;

  const { data, error: erroLink } = await supabase.storage
    .from("relatorios")
    .createSignedUrl(caminho, 60 * 60 * 24 * 7);
  if (erroLink || !data?.signedUrl) throw erroLink ?? new Error("sem-link");

  return data.signedUrl;
}
