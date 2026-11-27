import type { NguoiDung } from "../Types/XacThuc";

export function CoQuyen(NguoiDung: NguoiDung | null, Quyen: string) {
  return !NguoiDung?.LaQuanTriHeThong && !!NguoiDung?.Quyen?.includes(Quyen);
}

export function QuyenTrang(DuongDan: string): string | null {
  if (DuongDan.startsWith("/cai-dat/")) {
    const Muc = DuongDan.split("/")[2];
    if (["danh-muc", "dong-tai-nguyen"].includes(Muc)) return "ThietBi.Xem";
  }
  const Phan = DuongDan.split("/").filter(Boolean)[0];
  const Bang: Record<string, string> = {
    "bang-dieu-khien": "BangDieuKhien.Xem",
    "nhan-su": "NhanSu.Xem",
    "du-an": "DuAn.Xem",
    "kho-thiet-bi": "ThietBi.Xem",
    "thiet-bi": "ThietBi.Xem",
    studio: "Studio.Xem",
    kho: "Kho.Xem",
    "nhat-ky-su-co": "NhatKy.Xem",
    "bao-tri": "SuCo.Xem",
    "tra-cuu": "ThietBi.Xem",
  };
  return Bang[Phan] ?? null;
}

export function CacMucCaiDat(NguoiDung: NguoiDung | null) {
  return [
    ...(CoQuyen(NguoiDung, "ThietBi.Xem")
      ? ([
          ["danh-muc", "Danh mục tài nguyên"],
          ["dong-tai-nguyen", "Dòng tài nguyên"],
        ] as const)
      : []),
    ...(NguoiDung?.QuanTriDonVi
      ? ([
          ["nhom-quyen", "Nhóm quyền"],
          ["chuc-danh", "Chức danh"],
        ] as const)
      : []),
  ];
}

// Nhãn loại tài khoản lấy từ chức danh và nhóm quyền do đơn vị tự đặt tên.
export function NhanLoaiTaiKhoan(
  NguoiDung: NguoiDung | null,
  TenHeThong: string,
) {
  if (!NguoiDung) return "";
  if (NguoiDung.LaQuanTriHeThong) return TenHeThong;
  const Nhan = [
    NguoiDung.ChucDanh?.TenChucDanh,
    NguoiDung.NhomQuyen?.TenNhom,
    NguoiDung.QuanTriDonVi ? "Quản trị đơn vị" : undefined,
  ].filter((Muc): Muc is string => !!Muc);
  return [...new Set(Nhan)].join(" · ");
}
