import { useRef, type ReactNode } from "react";

interface Props {
  front: ReactNode;
  back: ReactNode;
  flipped: boolean;
  onFlip: () => void;
  /** Ghi chú nhỏ ở góc mặt sau, ví dụ "slide trang 4" */
  backNote?: string | null;
}

/**
 * Thẻ lật 3D: bấm, Enter/Space hoặc vuốt ngang để lật. Hai mặt nằm trong một nút nên bàn phím dùng được sẵn;
 * mặt đang ẩn được aria-hidden để trình đọc màn hình chỉ đọc mặt đang thấy.
 */
export default function FlipCard({ front, back, flipped, onFlip, backNote }: Props) {
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);

  return (
    <div className="flip" data-flipped={flipped}>
      <button
        type="button"
        className="flip-card"
        onClick={() => {
          if (swiped.current) swiped.current = false;
          else onFlip();
        }}
        onPointerDown={(e) => {
          startX.current = e.clientX;
          swiped.current = false;
        }}
        onPointerUp={(e) => {
          if (startX.current !== null && Math.abs(e.clientX - startX.current) > 50) {
            swiped.current = true;
            onFlip();
          }
          startX.current = null;
        }}
        onPointerCancel={() => (startX.current = null)}
      >
        <span className="flip-face flip-front" aria-hidden={flipped}>
          <span className="flip-tag">Câu hỏi</span>
          <span className="flip-text">{front}</span>
          <span className="flip-hint">Bấm để xem đáp án</span>
        </span>
        <span className="flip-face flip-back" aria-hidden={!flipped}>
          <span className="flip-tag">Đáp án</span>
          <span className="flip-text">{back}</span>
          {backNote && <span className="flip-hint">{backNote}</span>}
        </span>
      </button>
    </div>
  );
}
