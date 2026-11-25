const dongFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number | string): string {
  const amount = Number(value || 0);
  return dongFormatter.format(amount);
}
// Calendar dates in the shop's time zone, independent of the phone's time zone.
export function servicePrice(
  service: {
    price: number;
    active: boolean;
    discountPercent?: number;
    promotionStart?: string;
    promotionEnd?: string;
  },
  now = new Date(),
) {
  const today = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const rate = service.discountPercent || 0;
  const discounted =
    service.active &&
    rate > 0 &&
    rate <= 100 &&
    service.promotionStart &&
    service.promotionEnd &&
    service.promotionStart <= today &&
    today <= service.promotionEnd;
  const discount = discounted ? Math.floor((service.price * rate) / 100) : 0;
  return { discount, total: service.price - discount };
}
