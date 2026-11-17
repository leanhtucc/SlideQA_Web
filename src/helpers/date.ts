const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!); // giờ địa phương, 00:00
};

/** Số ngày từ hôm nay tới `iso` (YYYY-MM-DD); 0 = hôm nay, âm = đã qua. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parse(iso).getTime() - today.getTime()) / 86_400_000);
}

/** "2027-01-12" → "12/01" */
export const formatDayMonth = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
