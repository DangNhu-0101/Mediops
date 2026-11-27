import * as Dialog from "@radix-ui/react-dialog";
import { useRef, type ReactNode } from "react";

export function HopThoaiXacNhan({
  TieuDe: TieuDe,
  MoTa: MoTa,
  NhanXacNhan: NhanXacNhan,
  DangXuLy: DangXuLy,
  OnHuy: OnHuy,
  OnXacNhan: OnXacNhan,
}: {
  TieuDe: string;
  MoTa: ReactNode;
  NhanXacNhan: string;
  DangXuLy: boolean;
  OnHuy: () => void;
  OnXacNhan: () => void;
}) {
  const PhanTuMoHopThoai = useRef<HTMLElement | null>(
    typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );

  function XuLyHuy() {
    OnHuy();
    requestAnimationFrame(() => PhanTuMoHopThoai.current?.focus());
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(DangMo) => {
        if (!DangMo && !DangXuLy) XuLyHuy();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-40 max-h-[calc(100dvh-2rem)] overflow-y-auto w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded border border-rail bg-case p-5 shadow-2xl">
          <Dialog.Title className="font-serif text-xl">{TieuDe}</Dialog.Title>
          <Dialog.Description asChild>
            <p className="mt-3 text-sm leading-6 text-fog">{MoTa}</p>
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="min-h-11 rounded border border-rail px-4 text-sm text-fog hover:bg-case-2"
              disabled={DangXuLy}
              onClick={XuLyHuy}
              type="button"
            >
              Hủy
            </button>
            <button
              className="min-h-11 rounded bg-tally px-4 text-sm font-semibold text-white disabled:opacity-60"
              disabled={DangXuLy}
              onClick={OnXacNhan}
              type="button"
            >
              {DangXuLy ? "Đang xử lý…" : NhanXacNhan}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
