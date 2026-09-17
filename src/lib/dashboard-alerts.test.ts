import { describe, expect, it } from "vitest";

import {
  calcularEstatisticasAlertas,
  filtrarHistoricoAlertas,
  gerarAlertasPainel,
  type EntradaAlertasPainel,
  type RegistroHistoricoAlerta,
} from "@/lib/dashboard-alerts";

const traduzir = (portugues: string) => portugues;
const formatarMoeda = (valor: number) => `R$ ${valor.toFixed(2)}`;

function entrada(parcial: Partial<EntradaAlertasPainel> = {}): EntradaAlertasPainel {
  return {
    carregando: false,
    dadosDisponiveis: true,
    semanal: false,
    entradasPeriodo: 1_000,
    saldoPeriodo: 300,
    entradasMes: 1_000,
    projecaoMes: 900,
    gastoSemana: 0,
    gastoSemanaAnterior: 0,
    traduzir,
    formatarMoeda,
    ...parcial,
  };
}

function registro(
  tipo: RegistroHistoricoAlerta["tipo"],
  inicio: string,
  saldo: number,
): RegistroHistoricoAlerta {
  return {
    tipo,
    periodo: "mes",
    inicio,
    entradas: 1_000,
    gastos: 1_000 - saldo,
    saldo,
    criadoEm: `${inicio}T12:00:00Z`,
  };
}

describe("alertas do painel", () => {
  it("prioriza o alerta de saldo negativo", () => {
    const alertas = gerarAlertasPainel(entrada({ saldoPeriodo: -250 }));
    expect(alertas[0]).toMatchObject({ tipo: "saldo_negativo", tom: "perigo" });
  });

  it("distingue saldo apertado de sobra saudável", () => {
    expect(gerarAlertasPainel(entrada({ saldoPeriodo: 50 }))[0]?.tipo).toBe("saldo_apertado");
    expect(gerarAlertasPainel(entrada({ saldoPeriodo: 300 }))[0]?.tipo).toBe("sobra");
  });

  it("adiciona projeção no vermelho somente na visão mensal", () => {
    const mensal = gerarAlertasPainel(entrada({ projecaoMes: 1_200 }));
    const semanal = gerarAlertasPainel(entrada({ semanal: true, projecaoMes: 1_200 }));
    expect(mensal.some((alerta) => alerta.tipo === "projecao_vermelho")).toBe(true);
    expect(semanal.some((alerta) => alerta.tipo === "projecao_vermelho")).toBe(false);
  });

  it("sinaliza aumento semanal a partir de 25%", () => {
    const alertas = gerarAlertasPainel(
      entrada({ semanal: true, gastoSemana: 1_250, gastoSemanaAnterior: 1_000 }),
    );
    expect(alertas.some((alerta) => alerta.tipo === "gasto_acima_semana")).toBe(true);
  });

  it("não gera alertas enquanto os dados não estiverem disponíveis", () => {
    expect(gerarAlertasPainel(entrada({ carregando: true }))).toEqual([]);
    expect(gerarAlertasPainel(entrada({ dadosDisponiveis: false }))).toEqual([]);
  });
});

describe("histórico de alertas", () => {
  const historico = [
    registro("sobra", "2026-07-01", 300),
    registro("saldo_negativo", "2026-08-01", -200),
    registro("saldo_negativo", "2026-09-01", -100),
  ];

  it("aplica período e intervalo de datas", () => {
    const filtrado = filtrarHistoricoAlertas(historico, {
      periodo: "mes",
      inicio: "2026-08-01",
      fim: "2026-09-01",
    });
    expect(filtrado).toHaveLength(2);
  });

  it("calcula frequência, médias e pior saldo", () => {
    const estatisticas = calcularEstatisticasAlertas(historico, (chave) => chave);
    expect(estatisticas).toMatchObject({
      total: 3,
      maisComum: "saldo_negativo",
      saldoMedio: 0,
    });
    expect(estatisticas?.pior.saldo).toBe(-200);
    expect(estatisticas?.porMes).toHaveLength(3);
  });

  it("retorna nulo para histórico vazio", () => {
    expect(calcularEstatisticasAlertas([], (chave) => chave)).toBeNull();
  });
});
