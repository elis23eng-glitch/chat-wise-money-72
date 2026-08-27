import React from "react";
import { C } from "../theme";

export const Phone: React.FC<{
  children: React.ReactNode;
  title: string;
  style?: React.CSSProperties;
}> = ({ children, title, style }) => (
  <div
    style={{
      width: 400,
      height: 620,
      borderRadius: 44,
      background: C.card,
      border: `2px solid ${C.border}`,
      boxShadow: "0 40px 90px -40px rgba(23,51,44,0.55)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      ...style,
    }}
  >
    <div
      style={{
        background: C.primaryDeep,
        color: C.bg,
        padding: "26px 26px 18px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          background: "rgba(247,243,232,0.18)",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        <img
          src="/icons/icon-192.png"
          alt="Wise Money"
          style={{ width: 28, height: 28, objectFit: "cover" }}
        />
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Wise Money · Nina online</div>
      </div>
    </div>
    <div style={{ flex: 1, padding: 22, background: C.bg }}>{children}</div>
  </div>
);
