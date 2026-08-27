import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";

export const Intro: React.FC<{ display: string; sans: string }> = ({ display, sans }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const y = interpolate(s, [0, 1], [40, 0]);
  const sub = interpolate(frame, [18, 42], [0, 1], { extrapolateRight: "clamp" });
  const line = interpolate(frame, [30, 70], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(140deg, ${C.bg} 0%, ${C.bgSoft} 100%)`,
        padding: 110,
        justifyContent: "center",
        fontFamily: sans,
        color: C.text,
      }}
    >
      <div
        style={{ opacity: sub, letterSpacing: 6, fontSize: 16, color: C.accent, fontWeight: 700 }}
      >
        MINI TUTORIAL
      </div>
      <div
        style={{
          fontFamily: display,
          fontSize: 76,
          lineHeight: 1.02,
          marginTop: 18,
          transform: `translateY(${y}px)`,
          opacity: s,
          maxWidth: 900,
        }}
      >
        Registre um gasto e veja o <em style={{ color: C.primary }}>resumo do mês</em>
      </div>
      <div
        style={{
          height: 6,
          width: interpolate(line, [0, 1], [0, 320]),
          background: C.primary,
          borderRadius: 4,
          marginTop: 34,
        }}
      />
      <div style={{ opacity: sub, marginTop: 26, fontSize: 26, color: C.muted }}>
        Em dois passos simples, conversando com a Nina.
      </div>
    </AbsoluteFill>
  );
};
