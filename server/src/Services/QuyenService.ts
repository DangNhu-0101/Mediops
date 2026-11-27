import type { Prisma } from "@prisma/client";

const ThaoTacCoBan = {
  Xem: "Xem toàn đơn vị",
  Tao: "Tạo",
  Sua: "Sửa",
  Xoa: "Xóa",
};
export const BangQuyen = {
  NhanSu: {
    Ten: "Nhân sự",
    ThaoTac: { ...ThaoTacCoBan, DatLaiMatKhau: "Đặt lại mật khẩu" },
  },
  DuAn: { Ten: "Dự án", ThaoTac: ThaoTacCoBan },
  CaQuay: {
    Ten: "Ca quay",
    ThaoTac: { ...ThaoTacCoBan, PhanCong: "Phân công và xử lý xung đột" },
  },
  ThietBi: { Ten: "Thiết bị", ThaoTac: ThaoTacCoBan },
  Studio: { Ten: "Phòng quay", ThaoTac: ThaoTacCoBan },
  Kho: { Ten: "Kho", ThaoTac: ThaoTacCoBan },
  SuCo: {
    Ten: "Sự cố",
    ThaoTac: { Xem: "Xem toàn đơn vị", Tao: "Báo sự cố", Sua: "Xử lý sự cố" },
  },
  NhatKy: { Ten: "Nhật ký mượn trả", ThaoTac: { Xem: "Xem toàn đơn vị" } },
  BangDieuKhien: {
    Ten: "Bảng điều khiển",
    ThaoTac: { Xem: "Xem toàn đơn vị" },
  },
  VanHanhKho: {
    Ten: "Vận hành kho",
    ThaoTac: {
      QuanLy: "Xuất, nhập kho ca được phân công",
      ToanDonVi: "Xuất, nhập kho mọi ca trong đơn vị",
    },
  },
};
export const CacQuyenDuocCap = Object.entries(BangQuyen).flatMap(
  ([Nhom, DuLieu]) =>
    Object.keys(DuLieu.ThaoTac).map((ThaoTac) => `${Nhom}.${ThaoTac}`),
);

const QuyenQuanLyNhanSu = new Set([
  "NhanSu.Xem",
  "NhanSu.Tao",
  "NhanSu.Sua",
  "NhanSu.Xoa",
  "NhanSu.DatLaiMatKhau",
]);

// Ba nhóm quyền mẫu tạo sẵn cho mỗi đơn vị; quản trị đơn vị có thể sửa hoặc khôi phục.
export const NhomQuyenMau = [
  {
    MaNhom: "QUAN_LY_SAN_XUAT",
    TenNhom: "Quản lý sản xuất",
    MoTa: "Điều phối dự án, ca quay, tài nguyên và xử lý xung đột.",
    Quyen: CacQuyenDuocCap.filter((Quyen) => !QuyenQuanLyNhanSu.has(Quyen)),
  },
  {
    MaNhom: "NHAN_VIEN_KHO",
    TenNhom: "Nhân viên kho",
    MoTa: "Quản lý thiết bị, kho, xuất nhập kho và sự cố.",
    Quyen: [
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
  },
  {
    MaNhom: "NHAN_VIEN_SAN_XUAT",
    TenNhom: "Nhân viên sản xuất",
    MoTa: "Tra cứu thiết bị, phòng quay và báo sự cố.",
    Quyen: ["ThietBi.Xem", "Studio.Xem", "SuCo.Tao"],
  },
] as const;

// Chức danh mẫu; mọi chức danh ngang hàng, không cấp quyền.
// Mục đầu tiên được gán cho quản trị đơn vị đầu tiên.
export const ChucDanhMau = [
  "Quản lý sản xuất",
  "Đạo diễn",
  "Quay phim",
  "Ánh sáng",
  "Âm thanh",
  "Nhân viên kho",
  "Nhân viên sản xuất",
] as const;

// Chỉ giữ mã quyền hợp lệ, không trùng lặp từ dữ liệu JSON đã lưu.
export function LocQuyenHopLe(Quyen: unknown): string[] {
  if (!Array.isArray(Quyen)) return [];
  return [
    ...new Set(
      Quyen.filter(
        (Ma): Ma is string =>
          typeof Ma === "string" && CacQuyenDuocCap.includes(Ma),
      ),
    ),
  ];
}

// Quyền hiệu lực: quản trị đơn vị có toàn bộ quyền, người khác theo nhóm quyền.
export function LayQuyenHieuLuc(ThamSo: {
  QuanTriDonVi: boolean;
  NhomQuyen: { Quyen: Prisma.JsonValue } | null;
}): string[] {
  if (ThamSo.QuanTriDonVi) return [...CacQuyenDuocCap];
  const Quyen = LocQuyenHopLe(ThamSo.NhomQuyen?.Quyen);
  // Vận hành kho toàn đơn vị bao gồm quyền xuất, nhập kho cơ bản.
  return Quyen.includes("VanHanhKho.ToanDonVi") &&
    !Quyen.includes("VanHanhKho.QuanLy")
    ? [...Quyen, "VanHanhKho.QuanLy"]
    : Quyen;
}

// Truy vấn tối thiểu để tính quyền hiệu lực của một người dùng.
export const ChonDuLieuQuyen = {
  QuanTriDonVi: true,
  NhomQuyen: { select: { Quyen: true } },
} satisfies Prisma.NguoiDungSelect;

export function PhamViCaQuay(NguoiDungId: string) {
  return {
    OR: [
      { NguoiPhuTrachId: NguoiDungId },
      { DanhSachNhanSu: { some: { NguoiDungId } } },
    ],
  };
}
