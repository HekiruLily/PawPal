import type { Appointment } from '../api/appointmentApi';
import {
  appointmentServices,
  dateLabel,
  statusLabels,
  timeLabel,
} from './appointments';
export function reportCsv(rows: Appointment[]) {
  function cell(value: unknown) {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }
  return (
    '\uFEFF' +
    [
      [
        'Mã lịch',
        'Khách hàng',
        'Thú cưng',
        'Dịch vụ',
        'Nhân viên',
        'Ngày',
        'Giờ',
        'Trạng thái',
        'Tổng tiền',
      ],
      ...rows.map(item => [
        item.reference || `PP-${item.aid}`,
        item.customerName,
        item.petName,
        appointmentServices(item),
        item.groomerName,
        dateLabel(item.startTime),
        timeLabel(item.startTime),
        statusLabels[item.status],
        item.totalPrice,
      ]),
    ]
      .map(row => row.map(cell).join(','))
      .join('\r\n')
  );
}
