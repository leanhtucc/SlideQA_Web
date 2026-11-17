import { useId, type InputHTMLAttributes, type ReactNode } from "react";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  error?: ReactNode;
  help?: ReactNode;
  /** Nội dung bên phải nhãn (ví dụ liên kết "Quên mật khẩu?") */
  right?: ReactNode;
}

/** Nhãn + ô nhập + lỗi/gợi ý, nối bằng htmlFor và aria-describedby để trình đọc màn hình đọc đúng. */
export default function Field({ label, error, help, right, ...input }: FieldProps) {
  const id = useId();
  const noteId = error ? `${id}-err` : help ? `${id}-help` : undefined;
  return (
    <div className="field">
      <div className="field-head">
        <label className="label" htmlFor={id}>
          {label}
        </label>
        {right}
      </div>
      <input id={id} className={"input" + (error ? " err" : "")} aria-invalid={error ? true : undefined} aria-describedby={noteId} {...input} />
      {error ? (
        <span id={noteId} className="help err">
          {error}
        </span>
      ) : help ? (
        <span id={noteId} className="help">
          {help}
        </span>
      ) : null}
    </div>
  );
}
