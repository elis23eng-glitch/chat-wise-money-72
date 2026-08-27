import { brl, categoriaLabel, dataCurta, type IdiomaFormato } from "./format";

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

export type DadosRelatorio = {
  idioma: IdiomaFormato;
  modo: "mes" | "semana";
  periodoInicio: string;
  periodoFim: string;
  entradas: number;
  gastos: number;
  saldo: number;
  mediaDiaria: number;
  projecaoMes?: number;
  porCategoria: Record<string, number>;
  metas: Meta[];
  historico: Alerta[];
  tituloAlerta: (tipo: string) => string;
};

const T = {
  pt: {
    titulo: "Relatório financeiro",
    app: "mergulho — assistente financeiro",
    geradoEm: "Gerado em",
    periodo: "Período",
    mes: "Este mês",
    semana: "Últimos 7 dias",
    resumo: "Resumo",
    entradas: "Entradas",
    gastos: "Saídas",
    saldo: "Saldo",
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
    app: "mergulho — financial assistant",
    geradoEm: "Generated on",
    periodo: "Period",
    mes: "This month",
    semana: "Last 7 days",
    resumo: "Summary",
    entradas: "Income",
    gastos: "Expenses",
    saldo: "Balance",
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
    `${L.geradoEm} ${agora.toLocaleDateString(d.idioma === "pt" ? "pt-BR" : "en-US")} ${agora
      .toLocaleTimeString(d.idioma === "pt" ? "pt-BR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
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

  titulo(L.resumo);
  linha(L.entradas, brl(d.entradas, d.idioma));
  linha(L.gastos, brl(d.gastos, d.idioma));
  linha(`${L.saldo} (${d.saldo >= 0 ? L.positivo : L.negativo})`, brl(d.saldo, d.idioma), true);
  linha(L.mediaDiaria, brl(d.mediaDiaria, d.idioma));
  if (d.modo === "mes" && typeof d.projecaoMes === "number") {
    linha(L.projecao, brl(d.projecaoMes, d.idioma));
  }

  // Categorias
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

  // Metas
  titulo(L.metas);
  if (d.metas.length === 0) {
    linha(L.semMetas, "");
  } else {
    for (const meta of d.metas) {
      const pct = meta.valor_alvo > 0 ? Math.round((meta.valor_atual / meta.valor_alvo) * 100) : 0;
      const prazo = meta.prazo ? ` (${L.prazo} ${dataCurta(meta.prazo, d.idioma)})` : "";
      linha(
        `${meta.titulo}${prazo} — ${pct}%`,
        `${brl(meta.valor_atual, d.idioma)} / ${brl(meta.valor_alvo, d.idioma)}`,
      );
    }
  }

  // Histórico de alertas
  titulo(L.alertas);
  if (d.historico.length === 0) {
    linha(L.semAlertas, "");
  } else {
    for (const a of d.historico.slice(0, 30)) {
      quebra(34);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(
        `${dataCurta(a.criadoEm.slice(0, 10), d.idioma)} — ${d.tituloAlerta(a.tipo)}`,
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

  // Rodapé com numeração
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `${L.app}  ·  ${p}/${paginas}`,
      largura / 2,
      doc.internal.pageSize.getHeight() - 24,
      { align: "center" },
    );
  }

  const nome = `${d.idioma === "pt" ? "relatorio" : "report"}-${d.periodoFim}.pdf`;
  doc.save(nome);
}
