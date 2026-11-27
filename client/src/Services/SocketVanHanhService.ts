import { io } from "socket.io-client";
import { LayTokenDaLuu } from "./Api";

const DiaChiMayChu = (
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

export type SuKienVanHanh =
  | "kho:xuat-kho"
  | "kho:nhap-kho"
  | "bao_tri:cap_nhat"
  | "su_co:cap_nhat"
  | "quyet_dinh:cap_nhat"
  | "loi_moi:cap_nhat";

export interface DuLieuSuKienVanHanh {
  CaQuayId?: string;
  ThietBiId?: string;
  SuCoId?: string;
  GiaoDichId?: string;
}

export function TheoDoiVanHanh(
  CacSuKien: SuKienVanHanh[],
  XuLyCapNhat: (SuKien?: DuLieuSuKienVanHanh) => void,
) {
  const Token = LayTokenDaLuu();
  if (!Token) return () => undefined;

  const KetNoi = io(DiaChiMayChu, { auth: { Token: Token } });
  let BoHen: ReturnType<typeof setTimeout> | undefined;
  let DuLieuCho: DuLieuSuKienVanHanh | undefined;
  let DaKetNoiLanDau = false;
  function HenTaiLai(DuLieu?: DuLieuSuKienVanHanh) {
    if (BoHen) {
      clearTimeout(BoHen);
      if (DuLieuCho?.CaQuayId !== DuLieu?.CaQuayId) DuLieuCho = undefined;
    } else {
      DuLieuCho = DuLieu;
    }
    BoHen = setTimeout(() => {
      BoHen = undefined;
      XuLyCapNhat(DuLieuCho);
      DuLieuCho = undefined;
    }, 120);
  }
  function KhiHienThi() {
    if (document.visibilityState === "visible") HenTaiLai();
  }
  function KhiKetNoi() {
    if (DaKetNoiLanDau) KhiHienThi();
    DaKetNoiLanDau = true;
  }
  const CacSuKienTheoDoi = [...new Set([...CacSuKien, "quyet_dinh:cap_nhat"])];
  CacSuKienTheoDoi.forEach((TenSuKien) => KetNoi.on(TenSuKien, HenTaiLai));
  const BoRaSoatHetHan = setInterval(KhiHienThi, 30_000);
  KetNoi.on("connect", KhiKetNoi);
  window.addEventListener("focus", KhiHienThi);
  document.addEventListener("visibilitychange", KhiHienThi);

  return () => {
    if (BoHen) clearTimeout(BoHen);
    clearInterval(BoRaSoatHetHan);
    CacSuKienTheoDoi.forEach((TenSuKien) => KetNoi.off(TenSuKien, HenTaiLai));
    window.removeEventListener("focus", KhiHienThi);
    document.removeEventListener("visibilitychange", KhiHienThi);
    KetNoi.disconnect();
  };
}
