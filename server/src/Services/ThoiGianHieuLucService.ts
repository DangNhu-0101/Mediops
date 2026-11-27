import { Prisma } from "@prisma/client";

export interface KhoangThoiGian {
  BatDau: Date;
  KetThuc: Date;
}

// Trần cho mỗi loại đệm (chuẩn bị, thu hồi, kiểm tra sau sử dụng), áp ở API và CHECK của CSDL.
// Nhờ có trần, bộ phát hiện lọc thô được theo giờ ngay trong SQL mà không bỏ sót ca nào.
export const DemToiDaPhut = 1440;

// Cùng công thức với TaoKhoangHieuLuc khi cần lọc EXISTS ngay ở PostgreSQL.
export function TaoKhoangHieuLucSql(ThamSo: {
  ThoiGianBatDau: Prisma.Sql;
  ThoiGianKetThuc: Prisma.Sql;
  ThoiGianChuanBiPhut: Prisma.Sql;
  ThoiGianThuHoiPhut: Prisma.Sql;
  ThoiGianKiemTraSauSuDungPhut: Prisma.Sql;
}) {
  return {
    BatDau: Prisma.sql`(${ThamSo.ThoiGianBatDau} - make_interval(mins => GREATEST(0, ${ThamSo.ThoiGianChuanBiPhut})))`,
    KetThuc: Prisma.sql`(${ThamSo.ThoiGianKetThuc} + make_interval(mins => GREATEST(0, ${ThamSo.ThoiGianThuHoiPhut}) + GREATEST(0, ${ThamSo.ThoiGianKiemTraSauSuDungPhut})))`,
  };
}

export function TaoKhoangHieuLuc(ThamSo: {
  ThoiGianBatDau: Date;
  ThoiGianKetThuc: Date;
  ThoiGianChuanBiPhut?: number;
  ThoiGianThuHoiPhut?: number;
  ThoiGianKiemTraSauSuDungPhut?: number;
}): KhoangThoiGian {
  const ChuanBi = Math.max(0, ThamSo.ThoiGianChuanBiPhut ?? 0);
  const ThuHoi = Math.max(0, ThamSo.ThoiGianThuHoiPhut ?? 0);
  const KiemTra = Math.max(0, ThamSo.ThoiGianKiemTraSauSuDungPhut ?? 0);
  return {
    BatDau: new Date(ThamSo.ThoiGianBatDau.getTime() - ChuanBi * 60_000),
    KetThuc: new Date(
      ThamSo.ThoiGianKetThuc.getTime() + (ThuHoi + KiemTra) * 60_000,
    ),
  };
}

export function HaiKhoangGiaoNhau(
  KhoangA: KhoangThoiGian,
  KhoangB: KhoangThoiGian,
) {
  return KhoangA.BatDau < KhoangB.KetThuc && KhoangA.KetThuc > KhoangB.BatDau;
}

// Mốc thay thế chỉ cắt phần phân công; không sửa thời gian gốc hoặc khoản mượn.
export function TaoKhoangPhanCongThietBi(
  CaQuay: Parameters<typeof TaoKhoangHieuLuc>[0],
  PhanCong: { HieuLucTu: Date | null; HieuLucDen: Date | null },
) {
  const Khoang = TaoKhoangHieuLuc(CaQuay);
  return {
    BatDau: PhanCong.HieuLucTu ?? Khoang.BatDau,
    KetThuc: PhanCong.HieuLucDen ?? Khoang.KetThuc,
  };
}
