/**
 * Canais de notificação de segurança.
 *
 * MVP educacional: apenas o canal "app" (alertas dentro do aplicativo) está ativo.
 * O canal "email" fica preparado para quando o projeto tiver um domínio próprio e
 * um serviço de e-mails transacionais configurado — basta trocar EMAIL_ATIVO para
 * true e implementar o envio em uma server function.
 *
 * Enquanto EMAIL_ATIVO for false, nenhuma tela deve prometer aviso por e-mail.
 */
export type CanalSeguranca = "app" | "email";

export const EMAIL_ATIVO = false;

export function canaisAtivos(): CanalSeguranca[] {
  return EMAIL_ATIVO ? ["app", "email"] : ["app"];
}

export function canalEmailDisponivel(): boolean {
  return canaisAtivos().includes("email");
}
