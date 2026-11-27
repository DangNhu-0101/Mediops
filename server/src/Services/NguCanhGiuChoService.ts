import { AsyncLocalStorage } from "node:async_hooks";

// Chỉ service đã xác minh phiên và quyền mới thiết lập ngữ cảnh này.
// Không nhận mã phiên bỏ qua từ payload của detector hoặc API phân công.
const NguCanh = new AsyncLocalStorage<string>();
export const LayPhienGiuChoNoiBo = () => NguCanh.getStore();
export function TrongPhienGiuCho<T>(Id: string, ThaoTac: () => Promise<T>) {
  return NguCanh.run(Id, ThaoTac);
}
