/** 3355443 → "3,2 MB" (dấu phẩy thập phân kiểu Việt Nam) */
export function formatBytes(bytes: number): string {
  const n = (v: number) => v.toFixed(1).replace(".", ",").replace(/,0$/, "");
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${n(bytes / 1024)} KB`;
  return `${n(bytes / (1024 * 1024))} MB`;
}

/** ISO date-time → "02/11" theo giờ địa phương */
export function formatDayMonthFromIso(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
