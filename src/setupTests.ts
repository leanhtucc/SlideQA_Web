import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { session } from "src/helpers/session";
import { toast } from "src/helpers/toast";
import { setSessionExpiredHandler } from "src/apis/client";

beforeEach(() => {
  localStorage.clear();
  session.clear();
  toast.clear();
});
afterEach(() => {
  setSessionExpiredHandler(null);
});

// jsdom chưa có <dialog>.showModal(); giả lập vừa đủ để test hộp thoại (open + sự kiện close).
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
