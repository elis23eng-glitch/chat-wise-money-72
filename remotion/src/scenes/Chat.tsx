import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Phone } from "../components/Phone";
import { C } from "../theme";

const TEXTO = "gastei 40 reais no mercado hoje";

export const Chat: React.FC<{ display: string; sans: string }> = ({ display, sans }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chars = Math.round(
    interpolate(frame, [10, 80], [0, TEXTO.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  const enviado = frame > 92;
  const bubbleIn = spring({ frame: frame - 92, fps, config: { damping: 16, stiffness: 160 } });
  const replyIn = spring({ frame: frame - 130, fps, config: { damping: 18, stiffness: 140 } });
  const chipIn = spring({ frame: frame - 158, fps, config: { damping: 12 } });

  const stepIn = spring({ frame: frame - 4, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${C.bgSoft} 0%, ${C.bg} 60%)`,
        fontFamily: sans,
        color: C.text,
        flexDirection: "row",
        alignItems: "center",
        padding: "0 90px",
        gap: 70,
      }}
    >
      <div style={{ flex: 1, opacity: stepIn, transform: `translateX(${interpolate(stepIn, [0, 1], [-40, 0])}px)` }}>
        <div style={{ fontSize: 15, letterSpacing: 5, color: C.accent, fontWeight: 700 }}>PASSO 1</div>
        <div style={{ fontFamily: display, fontSize: 58, lineHeight: 1.05, marginTop: 14 }}>
          Fale do seu jeito
        </div>
        <div style={{ fontSize: 25, color: C.muted, marginTop: 20, maxWidth: 430, lineHeight: 1.45 }}>
          Escreva ou toque em <strong style={{ color: C.primary }}>Falar</strong>. A Nina entende, classifica
          e guarda o gasto pra você.
        </div>
      </div>

      <Phone title="Conversa">
        <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 14 }}>
          {enviado && (
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "80%",
                background: C.primary,
                color: "#fff",
                padding: "14px 18px",
                borderRadius: "20px 20px 6px 20px",
                fontSize: 19,
                opacity: bubbleIn,
                transform: `scale(${interpolate(bubbleIn, [0, 1], [0.85, 1])})`,
              }}
            >
              {TEXTO}
            </div>
          )}

          {frame > 118 && (
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "86%",
                background: "#EFE9D9",
                padding: "14px 18px",
                borderRadius: "20px 20px 20px 6px",
                fontSize: 19,
                opacity: replyIn,
                transform: `translateY(${interpolate(replyIn, [0, 1], [16, 0])}px)`,
              }}
            >
              Anotei! <strong>Mercado — R$ 40,00</strong> em Alimentação.
            </div>
          )}

          {frame > 152 && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "rgba(46,130,103,0.12)",
                color: C.primaryDeep,
                padding: "10px 16px",
                borderRadius: 999,
                fontSize: 17,
                fontWeight: 600,
                opacity: chipIn,
                transform: `scale(${interpolate(chipIn, [0, 1], [0.7, 1])})`,
              }}
            >
              ✓ gasto salvo
            </div>
          )}

          <div style={{ flex: 1 }} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 999,
              padding: "12px 16px",
            }}
          >
            <div style={{ fontSize: 18, color: enviado ? C.muted : C.text, flex: 1 }}>
              {enviado ? "Escreva aqui…" : TEXTO.slice(0, chars) + (frame % 20 < 10 ? "|" : "")}
            </div>
            <div
              style={{
                background: C.primary,
                color: "#fff",
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Enviar
            </div>
          </div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};
