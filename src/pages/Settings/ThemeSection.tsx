import { useState } from "react";
import { getThemeMode, setThemeMode, type ThemeMode } from "src/helpers/theme";

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "Theo hệ thống" },
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
];

/** Chọn giao diện sáng, tối hoặc theo hệ thống (FR-SET-02). */
export default function ThemeSection() {
  const [mode, setMode] = useState<ThemeMode>(getThemeMode);
  const change = (m: ThemeMode) => {
    setThemeMode(m);
    setMode(m);
  };
  return (
    <section className="card card-pad stack" aria-labelledby="theme-title">
      <h2 id="theme-title" className="h2">
        Giao diện
      </h2>
      <div role="radiogroup" aria-labelledby="theme-title" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {OPTIONS.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={mode === o.value} className="btn btn-ghost" onClick={() => change(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
      <p className="small muted">Lựa chọn được nhớ trên trình duyệt này.</p>
    </section>
  );
}
