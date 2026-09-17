import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Script } from "node:vm";

const raiz = process.cwd();
const origem = join(raiz, "public", "sw.js");
const gerado = join(raiz, ".output", "public", "sw.js");

let conteudoOrigem;
let conteudoGerado;

try {
  [conteudoOrigem, conteudoGerado] = await Promise.all([readFile(origem), readFile(gerado)]);
} catch (erro) {
  console.error("❌ Service worker não encontrado. Execute o build antes desta verificação.");
  throw erro;
}

if (!conteudoOrigem.equals(conteudoGerado)) {
  console.error("❌ O service worker do build difere de public/sw.js.");
  process.exitCode = 1;
} else {
  try {
    new Script(conteudoGerado.toString("utf8"), { filename: "sw.js" });
    const hash = createHash("sha256").update(conteudoGerado).digest("hex").slice(0, 12);
    console.log(`✅ Service worker íntegro e com sintaxe válida (${hash}).`);
  } catch (erro) {
    console.error("❌ O service worker contém JavaScript inválido.");
    throw erro;
  }
}
