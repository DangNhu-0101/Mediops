import { Prisma } from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiKhongTimThay, LoiXungDotDuLieu } from "./LoiNghiepVuService.js";
import { BangQuyen, LocQuyenHopLe, NhomQuyenMau } from "./QuyenService.js";
import { NgatKetNoiNguoiDung } from "./SocketService.js";

export interface DuLieuNhomQuyen {
  TenNhom: string;
  MoTa?: string | null;
  Quyen: string[];
}

// Sinh mã nội bộ không dấu từ tên hiển thị; mã không hiển thị cho người dùng.
export function TaoMaTuTen(Ten: string, MacDinh: string) {
  const Ma = Ten.replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
  return Ma || MacDinh;
}

// Chọn mã chưa dùng trong đơn vị bằng cách thêm hậu tố số khi trùng.
export function ChonMaChuaDung(MaGoc: string, MaDaDung: string[]) {
  const DaDung = new Set(MaDaDung);
  let Ma = MaGoc;
  for (let ThuTu = 2; DaDung.has(Ma); ThuTu++) Ma = `${MaGoc}_${ThuTu}`;
  return Ma;
}

function ChuyenLoiTrungTen(Loi: unknown) {
  if (
    Loi instanceof Prisma.PrismaClientKnownRequestError &&
    Loi.code === "P2002"
  )
    return new LoiXungDotDuLieu("Tên nhóm quyền đã tồn tại trong đơn vị.");
  return Loi;
}

function QuyenMauCua(MaNhom: string, LaMau: boolean) {
  if (!LaMau) return null;
  const Mau = NhomQuyenMau.find((Muc) => Muc.MaNhom === MaNhom);
  return Mau ? [...Mau.Quyen] : null;
}

// Quản trị đơn vị nhận đầy đủ cấu hình quyền; người chỉ cần chọn nhóm nhận thông tin tối thiểu.
export async function LayDanhSachNhomQuyen(DonViId: string, DayDu: boolean) {
  const DanhSach = await CoSoDuLieu.nhomQuyen.findMany({
    where: { DonViId },
    select: {
      Id: true,
      MaNhom: true,
      TenNhom: true,
      MoTa: true,
      Quyen: true,
      LaMau: true,
      _count: { select: { DanhSachNguoiDung: true } },
    },
    orderBy: [{ LaMau: "desc" }, { TenNhom: "asc" }],
  });
  return {
    BangQuyen: DayDu ? BangQuyen : null,
    DanhSach: DanhSach.map((Nhom) => ({
      Id: Nhom.Id,
      TenNhom: Nhom.TenNhom,
      MoTa: Nhom.MoTa,
      LaMau: Nhom.LaMau,
      SoThanhVien: Nhom._count.DanhSachNguoiDung,
      ...(DayDu
        ? {
            Quyen: LocQuyenHopLe(Nhom.Quyen),
            QuyenMau: QuyenMauCua(Nhom.MaNhom, Nhom.LaMau),
          }
        : {}),
    })),
  };
}

export async function TaoNhomQuyen(DonViId: string, DuLieu: DuLieuNhomQuyen) {
  try {
    return await CoSoDuLieu.$transaction(async (Db) => {
      const MaDaDung = await Db.nhomQuyen.findMany({
        where: { DonViId },
        select: { MaNhom: true },
      });
      return Db.nhomQuyen.create({
        data: {
          DonViId,
          MaNhom: ChonMaChuaDung(
            TaoMaTuTen(DuLieu.TenNhom, "NHOM_QUYEN"),
            MaDaDung.map((Muc) => Muc.MaNhom),
          ),
          TenNhom: DuLieu.TenNhom,
          MoTa: DuLieu.MoTa ?? null,
          Quyen: LocQuyenHopLe(DuLieu.Quyen),
        },
        select: { Id: true, TenNhom: true },
      });
    });
  } catch (Loi) {
    throw ChuyenLoiTrungTen(Loi);
  }
}

// Đổi quyền của nhóm thu hồi phiên của thành viên có quyền hiệu lực thay đổi.
export async function CapNhatNhomQuyen(
  Id: string,
  DonViId: string,
  DuLieu: DuLieuNhomQuyen,
) {
  const QuyenMoi = LocQuyenHopLe(DuLieu.Quyen);
  let ThanhVienBiThuHoi: string[] = [];
  try {
    const KetQua = await CoSoDuLieu.$transaction(
      async (Db) => {
        const Cu = await Db.nhomQuyen.findFirst({
          where: { Id, DonViId },
          select: { Quyen: true },
        });
        if (!Cu) throw new LoiKhongTimThay("Không tìm thấy nhóm quyền.");
        const QuyenCu = LocQuyenHopLe(Cu.Quyen);
        const DoiQuyen =
          QuyenCu.length !== QuyenMoi.length ||
          QuyenMoi.some((Quyen) => !QuyenCu.includes(Quyen));
        if (DoiQuyen) {
          const ThanhVien = await Db.nguoiDung.findMany({
            where: { NhomQuyenId: Id, DonViId, QuanTriDonVi: false },
            select: { Id: true },
          });
          ThanhVienBiThuHoi = ThanhVien.map((Muc) => Muc.Id);
          await Db.nguoiDung.updateMany({
            where: { Id: { in: ThanhVienBiThuHoi } },
            data: { PhienBanToken: { increment: 1 } },
          });
        }
        return Db.nhomQuyen.update({
          where: { Id },
          data: {
            TenNhom: DuLieu.TenNhom,
            MoTa: DuLieu.MoTa ?? null,
            Quyen: QuyenMoi,
          },
          select: { Id: true, TenNhom: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await Promise.all(ThanhVienBiThuHoi.map(NgatKetNoiNguoiDung));
    return KetQua;
  } catch (Loi) {
    throw ChuyenLoiTrungTen(Loi);
  }
}

export async function XoaNhomQuyen(Id: string, DonViId: string) {
  await CoSoDuLieu.$transaction(
    async (Db) => {
      const Nhom = await Db.nhomQuyen.findFirst({
        where: { Id, DonViId },
        select: { _count: { select: { DanhSachNguoiDung: true } } },
      });
      if (!Nhom) throw new LoiKhongTimThay("Không tìm thấy nhóm quyền.");
      const SoNguoi = Nhom._count.DanhSachNguoiDung;
      if (SoNguoi > 0)
        throw new LoiXungDotDuLieu(
          `Không thể xóa nhóm quyền đang có ${SoNguoi} người dùng. Hãy chuyển họ sang nhóm khác trước.`,
        );
      await Db.nhomQuyen.delete({ where: { Id } });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
