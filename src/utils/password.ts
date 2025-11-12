export function validatePasswordStrength(password: string): string | null {
  const requirements: string[] = [];

  if (password.length < 8) {
    requirements.push("alespoň 8 znaků");
  }
  if (!/[a-z]/.test(password)) {
    requirements.push("malé písmeno");
  }
  if (!/[A-Z]/.test(password)) {
    requirements.push("velké písmeno");
  }
  if (!/[0-9]/.test(password)) {
    requirements.push("číslici");
  }

  if (requirements.length === 0) return null;

  const list = requirements.join(", ");
  return `Heslo je příliš slabé. Přidejte ${list}.`;
}
