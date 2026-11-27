export type LoaiNhapExcel =
  | "DuAn"
  | "CaQuay"
  | "Kho"
  | "Studio"
  | "NhanSu"
  | "ThietBi"
  | "DanhMuc"
  | "DongTaiNguyen"
  | "NhomQuyen"
  | "ChucDanh";

export interface LoiDongExcel {
  Dong: number;
  ThongBao: string;
}

export interface KetQuaNhapExcel {
  TongSoDong: number;
  SoDongThanhCong: number;
  DanhSachLoi: LoiDongExcel[];
}
