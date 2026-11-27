import { Api } from "./Api";

export interface CauHinhHeThong {
  TenHeThong: string;
  KhauHieu: string | null;
  EmailHoTro: string | null;
  SoDienThoaiHoTro: string | null;
  LogoUrl: string | null;
  NgayCapNhat: string | null;
}

export async function LayCauHinhHeThong() {
  return (await Api.get<CauHinhHeThong>("/cau-hinh-he-thong")).data;
}

export async function LuuCauHinhHeThong(DuLieu: {
  TenHeThong: string;
  KhauHieu: string;
  EmailHoTro: string;
  SoDienThoaiHoTro: string;
  TepLogo: File | null;
  XoaLogo: boolean;
}) {
  const BieuMau = new FormData();
  BieuMau.append("TenHeThong", DuLieu.TenHeThong);
  BieuMau.append("KhauHieu", DuLieu.KhauHieu);
  BieuMau.append("EmailHoTro", DuLieu.EmailHoTro);
  BieuMau.append("SoDienThoaiHoTro", DuLieu.SoDienThoaiHoTro);
  BieuMau.append("XoaLogo", String(DuLieu.XoaLogo));
  if (DuLieu.TepLogo) BieuMau.append("TepLogo", DuLieu.TepLogo);
  return (await Api.put<CauHinhHeThong>("/cau-hinh-he-thong", BieuMau)).data;
}
