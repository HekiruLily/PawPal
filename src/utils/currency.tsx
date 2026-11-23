export function formatCurrency(value: number | string): string {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('vi-VN')} đ`;
}
