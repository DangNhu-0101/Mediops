import axios from "axios";
import type {
  KetQuaNhapExcel,
  LoaiNhapExcel,
  LoiDongExcel,
} from "../Types/NhapExcel";
import { Api } from "./Api";

const DuongDanNhapExcel: Record<LoaiNhapExcel, string> = {
  DuAn: "/du-an",
  CaQuay: "/ca-quay",
  Kho: "/kho",
  Studio: "/phong-studio",
  NhanSu: "/nhan-su",
  ThietBi: "/thiet-bi",
  DanhMuc: "/thiet-bi/danh-muc",
  DongTaiNguyen: "/thiet-bi/model",
  NhomQuyen: "/nhom-quyen",
  ChucDanh: "/chuc-danh",
};

const TenTepMau: Record<LoaiNhapExcel, string> = {
  DuAn: "MauNhapDuAn.xlsx",
  CaQuay: "MauNhapCaQuay.xlsx",
  Kho: "MauNhapKho.xlsx",
  Studio: "MauNhapStudio.xlsx",
  NhanSu: "MauNhapNhanSu.xlsx",
  ThietBi: "MauNhapThietBi.xlsx",
  DanhMuc: "MauNhapDanhMucTaiNguyen.xlsx",
  DongTaiNguyen: "MauNhapDongTaiNguyen.xlsx",
  NhomQuyen: "MauNhapNhomQuyen.xlsx",
  ChucDanh: "MauNhapChucDanh.xlsx",
};

const ThongBaoMacDinh = "Không thể xử lý tệp. Vui lòng thử lại sau.";

export interface LoiNhapExcel {
  ThongBao: string;
  DanhSachLoi: LoiDongExcel[];
}

// Chỉ lấy thông báo và danh sách lỗi dòng mà máy chủ đã chuẩn hóa cho người dùng.
export async function DocLoiNhapExcel(Loi: unknown): Promise<LoiNhapExcel> {
  if (!axios.isAxiosError(Loi))
    return { ThongBao: ThongBaoMacDinh, DanhSachLoi: [] };
  if (!Loi.response)
    return {
      ThongBao: "Không kết nối được máy chủ. Vui lòng kiểm tra mạng.",
      DanhSachLoi: [],
    };
  let DuLieu: unknown = Loi.response.data;
  if (DuLieu instanceof Blob) {
    try {
      DuLieu = JSON.parse(await DuLieu.text());
    } catch {
      DuLieu = null;
    }
  }
  if (typeof DuLieu !== "object" || DuLieu === null)
    return { ThongBao: ThongBaoMacDinh, DanhSachLoi: [] };
  const { ThongBao, DanhSachLoi } = DuLieu as {
    ThongBao?: unknown;
    DanhSachLoi?: unknown;
  };
  return {
    ThongBao: typeof ThongBao === "string" ? ThongBao : ThongBaoMacDinh,
    DanhSachLoi: Array.isArray(DanhSachLoi)
      ? DanhSachLoi.filter(
          (Muc): Muc is LoiDongExcel =>
            typeof Muc?.Dong === "number" && typeof Muc?.ThongBao === "string",
        )
      : [],
  };
}

export async function TaiFileMauExcel(Loai: LoaiNhapExcel) {
  const PhanHoi = await Api.post<Blob>(
    `${DuongDanNhapExcel[Loai]}/mau-excel`,
    null,
    { responseType: "blob" },
  );
  const DuongDan = URL.createObjectURL(PhanHoi.data);
  const LienKet = document.createElement("a");
  LienKet.href = DuongDan;
  LienKet.download = TenTepMau[Loai];
  document.body.appendChild(LienKet);
  LienKet.click();
  LienKet.remove();
  URL.revokeObjectURL(DuongDan);
}

export async function NhapFileExcel(Loai: LoaiNhapExcel, Tep: File) {
  const DuLieu = new FormData();
  DuLieu.append("TepExcel", Tep);
  const PhanHoi = await Api.post<KetQuaNhapExcel>(
    `${DuongDanNhapExcel[Loai]}/nhap-excel`,
    DuLieu,
  );
  return PhanHoi.data;
}
