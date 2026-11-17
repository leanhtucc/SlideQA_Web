/** Biểu tượng trang tài liệu có một dòng tô vàng (thiết kế: artboard Logo). */
export function LogoMark({ size = 32, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 3h13l6 6v18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill={light ? "#fff" : "#0E6B63"} />
      <path d="M20 3l6 6h-4a2 2 0 0 1-2-2z" fill={light ? "#C7E6E1" : "#4FC3B5"} />
      <rect x="9" y="8" width="7" height="2.5" rx="1.25" fill={light ? "#0E6B63" : "#fff"} opacity={light ? 0.35 : 0.85} />
      <rect x="9" y="13" width="14" height="4.5" rx="1.5" fill="#FFE066" />
      <rect x="9" y="20.5" width="9" height="2.5" rx="1.25" fill={light ? "#0E6B63" : "#fff"} opacity={light ? 0.35 : 0.85} />
    </svg>
  );
}

export default function Logo({ light = false, size = 32 }: { light?: boolean; size?: number }) {
  return (
    <span className="brand" style={{ padding: 0, ...(light ? { color: "#fff" } : {}) }}>
      <LogoMark size={size} light={light} />
      <span>
        Slide <em style={light ? { color: "#FFE066" } : undefined}>QA</em>
      </span>
    </span>
  );
}
