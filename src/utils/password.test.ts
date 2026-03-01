import { describe, it, expect } from "vitest";
import { validatePasswordStrength } from "./password";

describe("validatePasswordStrength", () => {
  it("vrací null pro platné heslo (8+ znaků, malé, velké, číslice)", () => {
    expect(validatePasswordStrength("Heslo123")).toBeNull();
    expect(validatePasswordStrength("Abcdefg1")).toBeNull();
  });

  it("vrací chybu při kratším než 8 znaků", () => {
    expect(validatePasswordStrength("Abc1")).not.toBeNull();
    expect(validatePasswordStrength("Abc1")).toContain("8 znaků");
  });

  it("vrací chybu bez malého písmene", () => {
    expect(validatePasswordStrength("HESLO123")).not.toBeNull();
    expect(validatePasswordStrength("HESLO123")).toContain("malé");
  });

  it("vrací chybu bez velkého písmene", () => {
    expect(validatePasswordStrength("heslo123")).not.toBeNull();
    expect(validatePasswordStrength("heslo123")).toContain("velké");
  });

  it("vrací chybu bez číslice", () => {
    expect(validatePasswordStrength("HesloAbc")).not.toBeNull();
    expect(validatePasswordStrength("HesloAbc")).toContain("číslici");
  });
});
