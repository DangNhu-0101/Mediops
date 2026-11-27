import axios from "axios";
import { Api } from "./Api";
import type {
  DuLieuDangKy,
  NguoiDung,
  PhanHoiDangNhap,
} from "../Types/XacThuc";

export async function GuiDangNhap(TenDangNhap: string, MatKhau: string) {
  const { data: Data } = await Api.post<PhanHoiDangNhap>(
    "/xac-thuc/dang-nhap",
    {
      TenDangNhap: TenDangNhap,
      MatKhau: MatKhau,
    },
  );
  return Data;
}

export async function GuiDangKy(DuLieu: DuLieuDangKy) {
  const { data: Data } = await Api.post<{
    ThongBao: string;
    NguoiDung: NguoiDung;
  }>("/xac-thuc/dang-ky", DuLieu);
  return Data;
}

export async function LayNguoiDungHienTai() {
  const { data: Data } = await Api.get<NguoiDung>(
    "/xac-thuc/thong-tin-ca-nhan",
  );
  return Data;
}

export function LayThongBaoLoi(Loi: unknown) {
  if (axios.isAxiosError<{ ThongBao?: string }>(Loi)) {
    if (!Loi.response) {
      return "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
    }
    return Loi.response.data?.ThongBao ?? "Yêu cầu không thể thực hiện.";
  }
  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}

export async function GuiYeuCauQuenMatKhau(Email: string) {
  const { data: Data } = await Api.post<{ ThongBao: string }>(
    "/xac-thuc/quen-mat-khau",
    { Email },
  );
  return Data;
}

export async function KiemTraLienKetDatLai(Token: string) {
  await Api.get("/xac-thuc/dat-lai-mat-khau", { params: { Token } });
}

export async function GuiDatLaiMatKhau(
  Token: string,
  MatKhau: string,
  XacNhanMatKhau: string,
) {
  const { data: Data } = await Api.post<{ ThongBao: string }>(
    "/xac-thuc/dat-lai-mat-khau",
    { Token, MatKhau, XacNhanMatKhau },
  );
  return Data;
}
