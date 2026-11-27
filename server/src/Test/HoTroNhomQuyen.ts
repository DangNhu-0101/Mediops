import { CoSoDuLieu } from "../Config/Database.js";
import { TaoMaTuTen } from "../Services/NhomQuyenService.js";

// Bộ quyền dùng trong kiểm thử, tương ứng các bộ quyền mặc định trước khi bỏ vai trò cố định.
export const BoQuyenKiemThu = {
  QuanLy: [
    "NhanSu.Xem",
    "NhanSu.Tao",
    "NhanSu.Sua",
    "NhanSu.Xoa",
    "NhanSu.DatLaiMatKhau",
    "DuAn.Xem",
    "DuAn.Tao",
    "DuAn.Sua",
    "DuAn.Xoa",
    "CaQuay.Xem",
    "CaQuay.Tao",
    "CaQuay.Sua",
    "CaQuay.Xoa",
    "CaQuay.PhanCong",
    "ThietBi.Xem",
    "ThietBi.Tao",
    "ThietBi.Sua",
    "ThietBi.Xoa",
    "Studio.Xem",
    "Studio.Tao",
    "Studio.Sua",
    "Studio.Xoa",
    "Kho.Xem",
    "Kho.Tao",
    "Kho.Sua",
    "Kho.Xoa",
    "SuCo.Xem",
    "SuCo.Tao",
    "SuCo.Sua",
    "NhatKy.Xem",
    "BangDieuKhien.Xem",
    "VanHanhKho.QuanLy",
    "VanHanhKho.ToanDonVi",
  ],
  NhanVienKho: [
    "BangDieuKhien.Xem",
    "CaQuay.Xem",
    "ThietBi.Xem",
    "ThietBi.Tao",
    "ThietBi.Sua",
    "Kho.Xem",
    "Kho.Tao",
    "Kho.Sua",
    "Studio.Xem",
    "SuCo.Xem",
    "SuCo.Tao",
    "SuCo.Sua",
    "NhatKy.Xem",
    "VanHanhKho.QuanLy",
    "VanHanhKho.ToanDonVi",
  ],
  NhanVienSanXuat: ["ThietBi.Xem", "Studio.Xem", "SuCo.Tao"],
} satisfies Record<string, string[]>;

export type TenBoQuyenKiemThu = keyof typeof BoQuyenKiemThu;

// Tạo (hoặc cập nhật) nhóm quyền kiểm thử theo tên trong đơn vị.
export async function TaoNhomQuyenKiemThu(
  DonViId: string,
  TenNhom: string,
  Quyen: readonly string[],
) {
  const MaNhom = TaoMaTuTen(TenNhom, "NHOM_KIEM_THU");
  const Nhom = await CoSoDuLieu.nhomQuyen.upsert({
    where: { DonViId_MaNhom: { DonViId, MaNhom } },
    create: { DonViId, MaNhom, TenNhom, Quyen: [...Quyen] },
    update: { Quyen: [...Quyen] },
  });
  return Nhom.Id;
}

// Tạo chức danh kiểm thử theo tên; dùng lại nếu đã tồn tại trong đơn vị.
export async function TaoChucDanhKiemThu(DonViId: string, TenChucDanh: string) {
  const MaChucDanh = TaoMaTuTen(TenChucDanh, "CHUC_DANH_KIEM_THU");
  const ChucDanh = await CoSoDuLieu.chucDanh.upsert({
    where: { DonViId_MaChucDanh: { DonViId, MaChucDanh } },
    create: { DonViId, MaChucDanh, TenChucDanh },
    update: {},
  });
  return ChucDanh.Id;
}

// Trả về nhóm quyền và chức danh để gắn trực tiếp vào dữ liệu tạo người dùng kiểm thử.
export async function GanNhomVaChucDanhKiemThu(
  DonViId: string,
  BoQuyen: TenBoQuyenKiemThu,
  TenChucDanh: string,
) {
  const TenNhom: Record<TenBoQuyenKiemThu, string> = {
    QuanLy: "Quản lý kiểm thử",
    NhanVienKho: "Nhân viên kho kiểm thử",
    NhanVienSanXuat: "Nhân viên sản xuất kiểm thử",
  };
  const [NhomQuyenId, ChucDanhId] = await Promise.all([
    TaoNhomQuyenKiemThu(DonViId, TenNhom[BoQuyen], BoQuyenKiemThu[BoQuyen]),
    TaoChucDanhKiemThu(DonViId, TenChucDanh),
  ]);
  return { NhomQuyenId, ChucDanhId };
}
