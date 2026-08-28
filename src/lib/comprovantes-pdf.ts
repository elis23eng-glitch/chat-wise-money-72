import { brl, dataCurta, type IdiomaFormato } from "./format";

export type ComprovanteExport = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  estabelecimento: string | null;
  hora: string | null;
  url: string | null;
  pdf: boolean;
};

const T = {
  pt: {
    titulo: "Comprovantes anexados",
    app: "Wise Money — assistente financeiro",
    periodo: "Período",
    total: "Total dos comprovantes",
    qtd: "Comprovantes",
    semImagem: "Comprovante em PDF (arquivo separado, não incluído nesta exportação).",
    falhou: "Não consegui carregar a imagem deste comprovante.",
    vazio: "Nenhum comprovante anexado neste período.",
  },
  en: {
    titulo: "Attached receipts",
    app: "Wise Money — financial assistant",
    periodo: "Period",
    total: "Receipts total",
    qtd: "Receipts",
    semImagem: "PDF receipt (separate file, not included in this export).",
    falhou: "I could not load the image of this receipt.",
    vazio: "No attached receipts in this period.",
  },
};

async function carregarImagem(url: string) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error("download");
  const blob = await resposta.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error("leitura"));
    leitor.readAsDataURL(blob);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("imagem"));
    el.src = dataUrl;
  });
  return { dataUrl, largura: img.width, altura: img.height };
}

/** Monta um PDF com um comprovante por página (imagem + dados da despesa). */
export async function gerarPdfComprovantes(opcoes: {
  itens: ComprovanteExport[];
  inicio: string;
  fim: string;
  idioma: IdiomaFormato;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const L = T[opcoes.idioma];
  const m = 40;
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();

  // Capa
  doc.setFillColor(20, 90, 70);
  doc.rect(0, 0, largura, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(L.titulo, m, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(L.app, m, 70);
  doc.setTextColor(35, 35, 35);

  const total = opcoes.itens.reduce((s, i) => s + i.valor, 0);
  doc.setFontSize(12);
  doc.text(
    `${L.periodo}: ${dataCurta(opcoes.inicio, opcoes.idioma)} – ${dataCurta(opcoes.fim, opcoes.idioma)}`,
    m,
    130,
  );
  doc.text(`${L.qtd}: ${opcoes.itens.length}`, m, 150);
  doc.text(`${L.total}: ${brl(total, opcoes.idioma)}`, m, 170);

  if (opcoes.itens.length === 0) {
    doc.text(L.vazio, m, 200);
  }

  for (const item of opcoes.itens) {
    doc.addPage();
    let y = m + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(item.descricao || item.categoria, m, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(90, 90, 90);
    doc.text(
      [
        dataCurta(item.data, opcoes.idioma),
        item.hora ?? null,
        item.estabelecimento ?? null,
        item.categoria,
      ]
        .filter(Boolean)
        .join("  ·  "),
      m,
      y,
    );
    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(brl(item.valor, opcoes.idioma), largura - m, y, { align: "right" });
    y += 20;

    if (item.pdf || !item.url) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(L.semImagem, m, y + 10);
      doc.setTextColor(35, 35, 35);
      continue;
    }

    try {
      const img = await carregarImagem(item.url);
      const maxL = largura - m * 2;
      const maxA = altura - y - m;
      const escala = Math.min(maxL / img.largura, maxA / img.altura, 1);
      doc.addImage(
        img.dataUrl,
        "JPEG",
        m,
        y,
        img.largura * escala,
        img.altura * escala,
        undefined,
        "FAST",
      );
    } catch {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(190, 40, 50);
      doc.text(L.falhou, m, y + 10);
      doc.setTextColor(35, 35, 35);
    }
  }

  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(`${L.app}  ·  ${p}/${paginas}`, largura / 2, altura - 20, { align: "center" });
  }

  const nome = `${opcoes.idioma === "pt" ? "comprovantes" : "receipts"}-${opcoes.inicio}_${opcoes.fim}.pdf`;
  return { blob: doc.output("blob") as Blob, nome };
}

export async function baixarPdfComprovantes(opcoes: Parameters<typeof gerarPdfComprovantes>[0]) {
  const { blob, nome } = await gerarPdfComprovantes(opcoes);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
