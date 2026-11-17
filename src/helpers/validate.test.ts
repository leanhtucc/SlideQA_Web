import { describe, expect, it } from "vitest";
import { isEmail, passwordStrength, passwordTooLong } from "./validate";

describe("validate", () => {
  it("isEmail", () => {
    expect(isEmail("ban@truong.edu.vn")).toBe(true);
    expect(isEmail(" ban@truong.edu.vn ")).toBe(true);
    for (const bad of ["", "ban", "ban@", "ban@truong", "@truong.vn", "b an@x.vn"]) expect(isEmail(bad)).toBe(false);
  });
  it("mật khẩu dài hơn 72 byte (tính theo UTF-8, không phải ký tự)", () => {
    expect(passwordTooLong("a".repeat(72))).toBe(false);
    expect(passwordTooLong("a".repeat(73))).toBe(true);
    expect(passwordTooLong("ế".repeat(25))).toBe(true); // 25 ký tự × 3 byte = 75 byte
  });
  it("độ mạnh mật khẩu", () => {
    expect(passwordStrength("abc").level).toBe(0);
    expect(passwordStrength("abcdefgh").level).toBe(1);
    expect(passwordStrength("abcdefgh12").level).toBe(2);
    expect(passwordStrength("Abcdefgh1234!").level).toBe(3);
  });
});
