import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";

const BARRAS = [
  { label: "Alimentação", valor: 420, cor: C.primary },
  { label: "Transporte", valor: 260, cor: C.primaryDeep },
  { label: "Casa", valor: 180, cor: C.accent },
  { label: "Lazer", valor: 90, cor: "#8FB9A8" },
];

const Cartao: React.FC<{
  titulo: string;
  valor: string;
  cor: string;
  fundo: string;
  delay: number;
  sans: string;
  display: string;
}> = ({ titulo, valor, cor, fundo, delay, sans, display }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 140 } });
  return (
    <div
      style={{
        flex: 1,
        background: fundo,
        borderRadius: 24,
        padding: "22px 24px",
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
        fontFamily: sans,
      }}
    >
      <div style={{ fontSize: 17, color: C.muted, fontWeight: 600 }}>{titulo}</div>
      <div style={{ fontFamily: display, fontSize: 40, color: cor, marginTop: 8 }}>{valor}</div>
    </div>
  );
};

export const Painel: React.FC<{ display: string; sans: string }> = ({ display, sans }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame, fps, config: { damping: 200 } });
  const max = 420;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(200deg, ${C.bg} 0%, ${C.bgSoft} 100%)`,
        fontFamily: sans,
        color: C.text,
        padding: "70px 90px",
      }}
    >
      <div style={{ opacity: head }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: C.accent, fontWeight: 700 }}>
          PASSO 2
        </div>
        <div style={{ fontFamily: display, fontSize: 54, marginTop: 10 }}>
          Abra o Painel e veja o mês
        </div>
      </div>

      <div style={{ display: "flex", gap: 22, marginTop: 34 }}>
        <Cartao
          titulo="Entradas"
          valor="R$ 3.200,00"
          cor={C.primary}
          fundo={C.card}
          delay={14}
          sans={sans}
          display={display}
        />
        <Cartao
          titulo="Saídas"
          valor="R$ 950,00"
          cor={C.danger}
          fundo={C.card}
          delay={24}
          sans={sans}
          display={display}
        />
        <Cartao
          titulo="Saldo do mês · positivo"
          valor="R$ 2.250,00"
          cor={C.primaryDeep}
          fundo="rgba(46,130,103,0.14)"
          delay={34}
          sans={sans}
          display={display}
        />
      </div>

      <div
        style={{
          marginTop: 34,
          background: C.card,
          borderRadius: 28,
          padding: "26px 30px",
          border: `1px solid ${C.border}`,
          flex: 1,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: C.primaryDeep }}>
          Gastos por categoria
        </div>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {BARRAS.map((b, i) => {
            const g = spring({ frame: frame - 55 - i * 9, fps, config: { damping: 200 } });
            return (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 170, fontSize: 19, color: C.muted }}>{b.label}</div>
                <div style={{ flex: 1, height: 22, background: C.bgSoft, borderRadius: 999 }}>
                  <div
                    style={{
                      width: `${(b.valor / max) * 100 * g}%`,
                      height: "100%",
                      background: b.cor,
                      borderRadius: 999,
                    }}
                  />
                </div>
                <div style={{ width: 120, textAlign: "right", fontSize: 19, fontWeight: 600 }}>
                  {g > 0.5 ? `R$ ${b.valor},00` : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
