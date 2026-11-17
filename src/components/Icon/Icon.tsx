/** Bộ icon nét 2px dùng chung (24x24, theo currentColor). Thêm icon mới vào đây thay vì chép path rải rác. */
const PATHS = {
  check: "M5 12l5 5 9-10",
  alert: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v5M12 16h.01",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 11v6M12 7.5h.01",
  close: "M6 6l12 12M18 6L6 18",
  refresh: "M20 11a8 8 0 0 0-14.5-4.2L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.5 4.2L20 15.5M20 20v-4.5h-4.5",
  wifiOff: "M3 3l18 18M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8a15 15 0 0 0-8.4-3.7M5 12.5a10 10 0 0 1 3.4-2M19 12.5a10 10 0 0 0-3-1.9M8.5 16a5 5 0 0 1 7 0M12 20h.01",
  doc: "M6 3h8l4 4v14H6zM14 3v5h5",
  chat: "M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.6A8 8 0 1 1 21 12z",
  quiz: "M9 9a3 3 0 1 1 4 2.8c-.7.4-1 1-1 1.7M12 17h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  server: "M4 5h16v6H4zM4 13h16v6H4zM8 8h.01M8 16h.01",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15.5 8.5l-2 5-5 2 2-5z",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 20, className = "ic" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
