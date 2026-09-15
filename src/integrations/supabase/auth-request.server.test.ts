import { describe, expect, it } from "vitest";

import { extractBearerToken } from "./auth-request.server";

describe("extractBearerToken", () => {
  it("extrai um token Bearer válido", () => {
    expect(extractBearerToken("Bearer token-de-teste")).toBe("token-de-teste");
  });

  it.each([null, "", "Basic abc", "Bearer "])("rejeita cabeçalho inválido: %s", (value) => {
    expect(extractBearerToken(value)).toBeNull();
  });
});
