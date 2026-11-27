import { LoiVanHanhKho } from "./LoiNghiepVuService.js";
import "dotenv/config";

function DocNguongViTri(TenBien: string, MacDinh: number, ToiDa: number) {
  const GiaTri = process.env[TenBien];
  if (GiaTri === undefined || GiaTri === "") return MacDinh;
  const So = Number(GiaTri);
  if (!Number.isFinite(So) || So <= 0 || So > ToiDa) {
    throw new Error(`Cấu hình ${TenBien} phải lớn hơn 0 và không quá ${ToiDa}`);
  }
  return So;
}

export const ChinhSachViTriKho = {
  DoChinhXacToiDaMet: DocNguongViTri("GPS_MAX_ACCURACY_METERS", 50, 500),
  ThoiGianHieuLucMs: DocNguongViTri("GPS_MAX_AGE_SECONDS", 120, 300) * 1000,
  SaiSoDongHoTuongLaiMs: 30 * 1000,
  BanKinhTraiDatMet: 6_371_000,
} as const;

export interface BangChungViTri {
  ViDo: number;
  KinhDo: number;
  DoChinhXacMet: number;
  ThoiDiemGhiNhan: Date;
}

export interface ToaDoKho {
  ViDo: number;
  KinhDo: number;
  BanKinhXacMinhMet: number;
}

function DoiSangRadian(Goc: number) {
  return (Goc * Math.PI) / 180;
}

export function TinhKhoangCachHaversineMet(
  DiemA: Pick<BangChungViTri, "ViDo" | "KinhDo">,
  DiemB: Pick<BangChungViTri, "ViDo" | "KinhDo">,
) {
  const ChenhlechViDo = DoiSangRadian(DiemB.ViDo - DiemA.ViDo);
  const ChenhlechKinhDo = DoiSangRadian(DiemB.KinhDo - DiemA.KinhDo);
  const ViDoA = DoiSangRadian(DiemA.ViDo);
  const ViDoB = DoiSangRadian(DiemB.ViDo);
  const GiaTriHaversine =
    Math.sin(ChenhlechViDo / 2) ** 2 +
    Math.cos(ViDoA) * Math.cos(ViDoB) * Math.sin(ChenhlechKinhDo / 2) ** 2;
  return (
    2 *
    ChinhSachViTriKho.BanKinhTraiDatMet *
    Math.asin(Math.sqrt(Math.min(1, Math.max(0, GiaTriHaversine))))
  );
}

function BaoDamToaDoHopLe(ViDo: number, KinhDo: number) {
  if (
    !Number.isFinite(ViDo) ||
    !Number.isFinite(KinhDo) ||
    ViDo < -90 ||
    ViDo > 90 ||
    KinhDo < -180 ||
    KinhDo > 180
  ) {
    throw new LoiVanHanhKho(
      "Tọa độ vị trí không hợp lệ.",
      400,
      "VI_TRI_KHONG_HOP_LE",
    );
  }
}

export function KiemTraBangChungViTri(
  BangChung: BangChungViTri,
  Kho: ToaDoKho,
  ThoiDiemHienTai = new Date(),
) {
  BaoDamToaDoHopLe(BangChung.ViDo, BangChung.KinhDo);
  BaoDamToaDoHopLe(Kho.ViDo, Kho.KinhDo);
  if (
    !Number.isFinite(BangChung.DoChinhXacMet) ||
    BangChung.DoChinhXacMet <= 0 ||
    BangChung.DoChinhXacMet > ChinhSachViTriKho.DoChinhXacToiDaMet
  ) {
    throw new LoiVanHanhKho(
      "Độ chính xác vị trí chưa đủ để xác nhận kho. Vui lòng thử lại.",
      422,
      "DO_CHINH_XAC_KHONG_DU",
      { DoChinhXacToiDaMet: ChinhSachViTriKho.DoChinhXacToiDaMet },
    );
  }
  if (
    !Number.isFinite(BangChung.ThoiDiemGhiNhan.getTime()) ||
    ThoiDiemHienTai.getTime() - BangChung.ThoiDiemGhiNhan.getTime() >
      ChinhSachViTriKho.ThoiGianHieuLucMs ||
    BangChung.ThoiDiemGhiNhan.getTime() - ThoiDiemHienTai.getTime() >
      ChinhSachViTriKho.SaiSoDongHoTuongLaiMs
  ) {
    throw new LoiVanHanhKho(
      "Vị trí đã quá thời hạn xác nhận. Vui lòng lấy lại vị trí hiện tại.",
      422,
      "VI_TRI_HET_HAN",
    );
  }
  if (!Number.isInteger(Kho.BanKinhXacMinhMet) || Kho.BanKinhXacMinhMet <= 0) {
    throw new Error("Kho chưa có bán kính xác minh hợp lệ");
  }

  const KhoangCachMet = TinhKhoangCachHaversineMet(BangChung, Kho);
  const ViTriDat =
    KhoangCachMet + BangChung.DoChinhXacMet <= Kho.BanKinhXacMinhMet;
  return { KhoangCachMet: KhoangCachMet, ViTriDat: ViTriDat };
}
