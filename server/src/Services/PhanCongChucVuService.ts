import type { Prisma } from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiXungDotDuLieu } from "./LoiNghiepVuService.js";
import { DieuKienChucDanhDonVi } from "./ChucDanhService.js";

interface PhanCong {
  NguoiDungId: string;
  ChucDanhPhanCong: string;
}

// Tên vị trí ghi vào lịch sử ca khi bàn giao người phụ trách; không phải chức danh.
export const ViTriNguoiPhuTrachCa = "Người phụ trách ca";

export interface NhomChucDanhPhanCong {
  TenChucDanh: string;
  DanhSachChucDanhId: string[];
  SoLanSuDung: number;
}

// Nhóm vị trí phân công: chức danh đang dùng của đơn vị (gồm chức danh dùng chung) và các tên vị trí đã lưu trong lịch sử ca.
// Một nhóm nhận người có chức danh trùng tên nhóm hoặc chức danh của người từng giữ vị trí đó.
export async function LayChucDanhPhanCong(
  DonViId: string,
  Db: Prisma.TransactionClient = CoSoDuLieu,
): Promise<NhomChucDanhPhanCong[]> {
  const [ChucDanh, PhanCong] = await Promise.all([
    Db.chucDanh.findMany({
      where: DieuKienChucDanhDonVi(DonViId),
      select: { Id: true, TenChucDanh: true, DangSuDung: true },
    }),
    Db.caQuayNhanSu.findMany({
      where: {
        CaQuay: { DuAn: { DonViId } },
        NguoiDung: { DonViId, LaQuanTriHeThong: false },
      },
      select: {
        ChucDanhPhanCong: true,
        NguoiDung: { select: { ChucDanhId: true } },
      },
    }),
  ]);
  const Nhom = new Map<string, NhomChucDanhPhanCong>();
  const LayNhom = (Ten: string) => {
    const Cu = Nhom.get(Ten) ?? {
      TenChucDanh: Ten,
      DanhSachChucDanhId: [],
      SoLanSuDung: 0,
    };
    Nhom.set(Ten, Cu);
    return Cu;
  };
  const ThemChucDanh = (Muc: NhomChucDanhPhanCong, ChucDanhId: string) => {
    if (!Muc.DanhSachChucDanhId.includes(ChucDanhId))
      Muc.DanhSachChucDanhId.push(ChucDanhId);
  };
  for (const Muc of ChucDanh) {
    if (Muc.DangSuDung) ThemChucDanh(LayNhom(Muc.TenChucDanh), Muc.Id);
  }
  for (const Muc of PhanCong) {
    if (Muc.ChucDanhPhanCong === ViTriNguoiPhuTrachCa) continue;
    const NhomPhanCong = LayNhom(Muc.ChucDanhPhanCong);
    NhomPhanCong.SoLanSuDung++;
    if (Muc.NguoiDung.ChucDanhId)
      ThemChucDanh(NhomPhanCong, Muc.NguoiDung.ChucDanhId);
  }
  // Vị trí lịch sử trùng tên chức danh đã ngừng sử dụng vẫn nhận đúng chức danh đó.
  for (const Muc of ChucDanh) {
    const NhomCu = Nhom.get(Muc.TenChucDanh);
    if (NhomCu) ThemChucDanh(NhomCu, Muc.Id);
  }
  return [...Nhom.values()].sort(
    (Trai, Phai) =>
      Phai.SoLanSuDung - Trai.SoLanSuDung ||
      Trai.TenChucDanh.localeCompare(Phai.TenChucDanh, "vi"),
  );
}

export function KiemTraChucDanhPhanCong(ThamSo: {
  NguoiPhuTrachId: string;
  DanhSach: PhanCong[];
  PhanCongCu: PhanCong[];
  NhanSu: { Id: string; ChucDanhId: string | null }[];
  NhomPhanCong?: Pick<
    NhomChucDanhPhanCong,
    "TenChucDanh" | "DanhSachChucDanhId"
  >[];
}) {
  const NguoiDungId = ThamSo.DanhSach.map((Muc) => Muc.NguoiDungId);
  if (new Set(NguoiDungId).size !== NguoiDungId.length)
    throw new LoiXungDotDuLieu(
      "Mỗi nhân sự chỉ đảm nhiệm một vị trí trong ca quay.",
    );
  // Người phụ trách ca là bất kỳ nhân sự nào cùng đơn vị, không ràng buộc chức danh.
  if (!ThamSo.NhanSu.some((Nguoi) => Nguoi.Id === ThamSo.NguoiPhuTrachId))
    throw new LoiXungDotDuLieu("Người phụ trách ca phải thuộc đơn vị.");
  for (const Muc of ThamSo.DanhSach) {
    const Nguoi = ThamSo.NhanSu.find((Nguoi) => Nguoi.Id === Muc.NguoiDungId);
    if (!Nguoi) throw new LoiXungDotDuLieu("Nhân sự không thuộc đơn vị.");
    const LaPhanCongCu = ThamSo.PhanCongCu.some(
      (Cu) =>
        Cu.NguoiDungId === Muc.NguoiDungId &&
        Cu.ChucDanhPhanCong === Muc.ChucDanhPhanCong,
    );
    if (LaPhanCongCu) continue; // Giữ nguyên phân công lịch sử, kể cả tên công việc tự do.
    if (Muc.NguoiDungId === ThamSo.NguoiPhuTrachId)
      throw new LoiXungDotDuLieu(
        "Người phụ trách ca không được phân công trùng ở vị trí khác.",
      );
    const ChucDanhId = Nguoi.ChucDanhId;
    const PhuHop =
      !!ChucDanhId &&
      (ThamSo.NhomPhanCong?.some(
        (Nhom) =>
          Nhom.TenChucDanh === Muc.ChucDanhPhanCong &&
          Nhom.DanhSachChucDanhId.includes(ChucDanhId),
      ) ??
        ThamSo.PhanCongCu.some(
          (Cu) =>
            Cu.ChucDanhPhanCong === Muc.ChucDanhPhanCong &&
            ThamSo.NhanSu.some(
              (NguoiCu) =>
                NguoiCu.Id === Cu.NguoiDungId &&
                NguoiCu.ChucDanhId === ChucDanhId,
            ),
        ));
    if (!PhuHop)
      throw new LoiXungDotDuLieu(
        "Nhân sự được chọn không phù hợp với chức danh phân công.",
      );
  }
}

export async function BaoDamChucDanhPhanCong(
  Db: Prisma.TransactionClient,
  DonViId: string,
  NguoiPhuTrachId: string,
  DanhSach: PhanCong[],
  CaQuayId?: string,
) {
  const [NhanSu, PhanCongCu, NhomPhanCong] = await Promise.all([
    Db.nguoiDung.findMany({
      where: { DonViId, LaQuanTriHeThong: false },
      select: { Id: true, ChucDanhId: true },
    }),
    Db.caQuayNhanSu.findMany({
      where: {
        CaQuay: { DuAn: { DonViId } },
        ...(CaQuayId
          ? { CaQuayId }
          : { NguoiDungId: { in: DanhSach.map((Muc) => Muc.NguoiDungId) } }),
      },
      select: { NguoiDungId: true, ChucDanhPhanCong: true },
    }),
    LayChucDanhPhanCong(DonViId, Db),
  ]);
  KiemTraChucDanhPhanCong({
    NguoiPhuTrachId,
    DanhSach,
    PhanCongCu,
    NhanSu,
    NhomPhanCong,
  });
}
