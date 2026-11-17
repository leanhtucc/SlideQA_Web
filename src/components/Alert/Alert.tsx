import type { ReactNode } from "react";

export default function Alert({ kind = "err", children }: { kind?: "err" | "warn" | "info" | "ok"; children: ReactNode }) {
  return (
    <div className={`alert alert-${kind}`} role={kind === "err" || kind === "warn" ? "alert" : "status"}>
      <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v5M12 16h.01" />
      </svg>
      <div>{children}</div>
    </div>
  );
}
