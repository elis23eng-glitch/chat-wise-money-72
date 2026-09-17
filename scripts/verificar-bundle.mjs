import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const pastaAssets = join(process.cwd(), ".output", "public", "assets");
const orcamentos = [
  { rota: "conversa", prefixo: "conversa-", limiteBytes: 300_000 },
  { rota: "painel", prefixo: "painel-", limiteBytes: 120_000 },
];

const arquivos = await readdir(pastaAssets);
let falhou = false;

for (const orcamento of orcamentos) {
  const arquivo = arquivos.find(
    (nome) => nome.startsWith(orcamento.prefixo) && nome.endsWith(".js"),
  );
  if (!arquivo) {
    console.error(`❌ Bundle da rota ${orcamento.rota} não encontrado.`);
    falhou = true;
    continue;
  }

  const tamanho = (await stat(join(pastaAssets, arquivo))).size;
  const percentual = Math.round((tamanho / orcamento.limiteBytes) * 100);
  const status = tamanho <= orcamento.limiteBytes ? "✅" : "❌";
  console.log(
    `${status} ${orcamento.rota}: ${(tamanho / 1_000).toFixed(1)} kB de ${(orcamento.limiteBytes / 1_000).toFixed(0)} kB (${percentual}%)`,
  );
  if (tamanho > orcamento.limiteBytes) falhou = true;
}

if (falhou) {
  console.error("O orçamento de bundle foi excedido. Revise novas importações antes do merge.");
  process.exitCode = 1;
}
