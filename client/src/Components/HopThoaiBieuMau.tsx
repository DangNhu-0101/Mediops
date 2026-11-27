import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export function HopThoaiBieuMau({
  TieuDe: TieuDe,
  KichThuoc: KichThuoc = "thuong",
  DangXuLy: DangXuLy = false,
  OnDong: OnDong,
  children: Children,
}: {
  TieuDe: string;
  KichThuoc?: "thuong" | "rong";
  DangXuLy?: boolean;
  OnDong: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(DangMo) => {
        if (!DangMo && !DangXuLy) OnDong();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-black/60" />
        <Dialog.Content
          aria-describedby={undefined}
          className={`hop-thoai-bieu-mau fixed top-1/2 left-1/2 z-40 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded border border-rail bg-case p-5 shadow-2xl ${
            KichThuoc === "rong" ? "max-w-2xl" : "max-w-xl"
          }`}
        >
          <Dialog.Title className="font-serif text-xl">{TieuDe}</Dialog.Title>
          {Children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
