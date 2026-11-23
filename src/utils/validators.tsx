export function isValidLogin(value: string): boolean {
  return value.trim().length >= 3;
}

export function isValidPrice(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 999999999;
}
