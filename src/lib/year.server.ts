/** Cálculos do painel anual (mês a mês) — usado apenas no servidor. */

export type LinhaSimples = { valor: number; categoria: string; data: string };

export type MesAno = {
  mes: number; // 1..12
  iso: string; // YYYY-MM-01
  entradas: number;
  gastos: number;
  saldo: number;
  lancamentos: number;
};

function arred(v: number) {
  return Math.round(v * 100) / 100;
}

export function montarAno(ano: number, gastos: LinhaSimples[], entradas: LinhaSimples[]) {
  const meses: MesAno[] = [];

  for (let m = 1; m <= 12; m++) {
    const prefixo = `${ano}-${String(m).padStart(2, "0")}`;
    const g = gastos.filter((l) => l.data.startsWith(prefixo));
    const e = entradas.filter((l) => l.data.startsWith(prefixo));
    const totalG = g.reduce((s, l) => s + l.valor, 0);
    const totalE = e.reduce((s, l) => s + l.valor, 0);
    meses.push({
      mes: m,
      iso: `${prefixo}-01`,
      entradas: arred(totalE),
      gastos: arred(totalG),
      saldo: arred(totalE - totalG),
      lancamentos: g.length + e.length,
    });
  }

  const porCategoria: Record<string, number> = {};
  for (const l of gastos)
    porCategoria[l.categoria] = arred((porCategoria[l.categoria] ?? 0) + l.valor);

  const porCategoriaEntrada: Record<string, number> = {};
  for (const l of entradas)
    porCategoriaEntrada[l.categoria] = arred((porCategoriaEntrada[l.categoria] ?? 0) + l.valor);

  const totalGastos = arred(gastos.reduce((s, l) => s + l.valor, 0));
  const totalEntradas = arred(entradas.reduce((s, l) => s + l.valor, 0));
  const mesesComDados = meses.filter((m) => m.lancamentos > 0);

  const maisCaro = mesesComDados.reduce<MesAno | null>(
    (maior, m) => (!maior || m.gastos > maior.gastos ? m : maior),
    null,
  );
  const melhorSaldo = mesesComDados.reduce<MesAno | null>(
    (melhor, m) => (!melhor || m.saldo > melhor.saldo ? m : melhor),
    null,
  );

  return {
    ano,
    meses,
    totalGastos,
    totalEntradas,
    saldo: arred(totalEntradas - totalGastos),
    mediaGastosMes: mesesComDados.length ? arred(totalGastos / mesesComDados.length) : 0,
    mesesComDados: mesesComDados.length,
    porCategoria,
    porCategoriaEntrada,
    maisCaro,
    melhorSaldo,
  };
}
