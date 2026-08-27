export type MarketSnapshot = {
  dolar: number | null;
  variacaoPct: number | null;
  euro: number | null;
  atualizadoEm: string;
};

type AwesomeApiQuote = {
  bid?: string;
  pctChange?: string;
};

async function fromAwesomeApi(): Promise<Partial<MarketSnapshot> | null> {
  try {
    const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL");
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, AwesomeApiQuote> & { status?: number };
    if (json.status) return null; // resposta de erro/limite da API
    const usd = json["USDBRL"];
    const eur = json["EURBRL"];
    const dolar = usd?.bid ? Number(usd.bid) : null;
    const euro = eur?.bid ? Number(eur.bid) : null;
    if (!dolar && !euro) return null;
    return {
      dolar,
      euro,
      variacaoPct: usd?.pctChange ? Number(usd.pctChange) : null,
    };
  } catch {
    return null;
  }
}

async function fromFrankfurter(): Promise<Partial<MarketSnapshot> | null> {
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?base=BRL&symbols=USD,EUR");
    if (!res.ok) return null;
    const json = (await res.json()) as { date?: string; rates?: Record<string, number> };
    const usdPorBrl = json.rates?.["USD"];
    const eurPorBrl = json.rates?.["EUR"];
    if (!usdPorBrl && !eurPorBrl) return null;

    const dolar = usdPorBrl ? 1 / usdPorBrl : null;
    const euro = eurPorBrl ? 1 / eurPorBrl : null;

    // variação em relação ao dia útil anterior
    let variacaoPct: number | null = null;
    if (dolar) {
      try {
        const ontem = new Date(`${json.date ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`);
        ontem.setUTCDate(ontem.getUTCDate() - 4);
        const histRes = await fetch(
          `https://api.frankfurter.dev/v1/${ontem.toISOString().slice(0, 10)}..?base=BRL&symbols=USD`,
        );
        if (histRes.ok) {
          const hist = (await histRes.json()) as {
            rates?: Record<string, Record<string, number>>;
          };
          const dias = Object.keys(hist.rates ?? {}).sort();
          const anterior =
            dias.length > 1 ? hist.rates![dias[dias.length - 2]!]!["USD"] : undefined;
          if (anterior) {
            const dolarAnterior = 1 / anterior;
            variacaoPct = ((dolar - dolarAnterior) / dolarAnterior) * 100;
          }
        }
      } catch {
        /* variação é opcional */
      }
    }

    return { dolar, euro, variacaoPct };
  } catch {
    return null;
  }
}

export async function fetchMarket(): Promise<MarketSnapshot> {
  const dados = (await fromAwesomeApi()) ?? (await fromFrankfurter());

  return {
    dolar: dados?.dolar ?? null,
    variacaoPct: dados?.variacaoPct ?? null,
    euro: dados?.euro ?? null,
    atualizadoEm: new Date().toISOString(),
  };
}
