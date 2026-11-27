import { io } from "socket.io-client";
import { LayTokenDaLuu } from "./Api";

const DiaChiMayChu = (
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const CacSuKienLich = [
  "ca_quay:tao",
  "ca_quay:cap_nhat",
  "ca_quay:xoa",
] as const;

export function TheoDoiCapNhatLich(XuLyCapNhat: () => void, CaQuayId?: string) {
  const Token = LayTokenDaLuu();
  if (!Token) return () => undefined;

  const KetNoi = io(DiaChiMayChu, { auth: { Token: Token } });
  CacSuKienLich.forEach((TenSuKien) => KetNoi.on(TenSuKien, XuLyCapNhat));
  let DaKetNoiLanDau = false;
  function KhiHienThi() {
    if (document.visibilityState === "visible") XuLyCapNhat();
  }
  function KhiKetNoi() {
    if (DaKetNoiLanDau) KhiHienThi();
    DaKetNoiLanDau = true;
  }
  KetNoi.on("connect", KhiKetNoi);
  window.addEventListener("focus", KhiHienThi);
  document.addEventListener("visibilitychange", KhiHienThi);
  if (CaQuayId) {
    KetNoi.on("connect", () => KetNoi.emit("tham_gia_ca_quay", CaQuayId));
  }

  return () => {
    CacSuKienLich.forEach((TenSuKien) => KetNoi.off(TenSuKien, XuLyCapNhat));
    window.removeEventListener("focus", KhiHienThi);
    document.removeEventListener("visibilitychange", KhiHienThi);
    KetNoi.disconnect();
  };
}
