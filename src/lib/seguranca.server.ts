import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Cliente = SupabaseClient<Database>;

export function hashCodigo(codigo: string): string {
  return createHash("sha256")
    .update(codigo.replace(/[\s-]/g, "").toUpperCase(), "utf8")
    .digest("hex");
}

/** Gera códigos legíveis no formato XXXX-XXXX. */
export function gerarCodigos(qtd = 10): string[] {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const codigos: string[] = [];
  while (codigos.length < qtd) {
    const bytes = randomBytes(8);
    let bruto = "";
    for (const b of bytes) bruto += alfabeto[b % alfabeto.length];
    codigos.push(`${bruto.slice(0, 4)}-${bruto.slice(4, 8)}`);
  }
  return codigos;
}

export function nomeDoDispositivo(ua: string | null | undefined): string {
  if (!ua) return "Dispositivo";
  const so = /iPhone|iPad/i.test(ua)
    ? "iPhone/iPad"
    : /Android/i.test(ua)
      ? "Android"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Mac OS/i.test(ua)
          ? "Mac"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Dispositivo";
  const nav = /Edg\//i.test(ua)
    ? "Edge"
    : /Chrome\//i.test(ua)
      ? "Chrome"
      : /Firefox\//i.test(ua)
        ? "Firefox"
        : /Safari\//i.test(ua)
          ? "Safari"
          : "";
  return nav ? `${so} · ${nav}` : so;
}

/** Mantém apenas os 3 primeiros blocos do IP (aproximado, preserva privacidade). */
export function ipAproximado(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const limpo = ip.split(",")[0]?.trim() ?? "";
  if (!limpo) return null;
  if (limpo.includes(":")) return `${limpo.split(":").slice(0, 3).join(":")}::`;
  const partes = limpo.split(".");
  return partes.length === 4 ? `${partes[0]}.${partes[1]}.${partes[2]}.x` : limpo;
}

export async function listarHistorico(supabase: Cliente, userId: string, limite = 50) {
  const { data, error } = await supabase
    .from("login_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data ?? [];
}

export async function listarConfiaveis(supabase: Cliente, userId: string) {
  const { data, error } = await supabase
    .from("trusted_devices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
