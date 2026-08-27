import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";

export const Fecho: React.FC<{ display: string; sans: string }> = ({ display, sans }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  const drift = Math.sin(frame / 26) * 6;

  return (
    <AbsoluteFill
      style={{
        background: C.primaryDeep,
        color: C.bg,
        fontFamily: sans,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${interpolate(s, [0, 1], [0.85, 1])}) translateY(${drift}px)`,
          opacity: s,
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: display, fontSize: 68 }}>É só isso.</div>
        <div style={{ fontSize: 27, marginTop: 18, opacity: 0.85 }}>
          Converse com a Nina · Acompanhe seu saldo · Exporte o relatório
        </div>
        <div
          style={{
            marginTop: 34,
            display: "inline-block",
            padding: "14px 30px",
            borderRadius: 999,
            background: C.accent,
            color: "#17332C",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Wise Money
        </div>
      </div>
    </AbsoluteFill>
  );
};
