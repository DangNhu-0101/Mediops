import {
  MucDoSuCo,
  TrangThaiCaQuay,
  TrangThaiDuAn,
  TrangThaiStudio,
  TrangThaiThietBi,
} from "@prisma/client";
import type { NextFunction, Response } from "express";
import { CoSoDuLieu } from "../Config/Database.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import { TaoCaQuay } from "../Services/CaQuayService.js";
import {
  DieuKienChucDanhDonVi,
  TaoChucDanh,
} from "../Services/ChucDanhService.js";
import { TaoDuAn } from "../Services/DuAnService.js";
import { TaoKho } from "../Services/KhoService.js";
import { LuuMau } from "../Services/MauThietBiService.js";
import { TaoNhanSu } from "../Services/NhanSuService.js";
import { TaoNhomQuyen } from "../Services/NhomQuyenService.js";
import { TaoPhongStudio } from "../Services/PhongStudioService.js";
import { LuuDanhMuc, SchemaDanhMuc } from "../Services/QuanLyDanhMucService.js";
import { BangQuyen, CacQuyenDuocCap } from "../Services/QuyenService.js";
import { PhatCapNhatLich } from "../Services/SocketService.js";
import {
  CacKhoangBanSchema,
  TrinhDoSchema,
  type KhoangBan,
} from "../Services/DuLieuNhungService.js";
import {
  NhanTruongThongSo,
  TimKhoaThongSo,
} from "../Services/NhanThongSoKyThuatService.js";
import { LuuThongTinBoSung } from "../Services/ThongTinBoSungService.js";
import { TaoSuCoBaoTri } from "../Services/SuCoBaoTriService.js";
import {
  TaiAnhMacDinh,
  CongCuLuuTruAnhCloudinary,
} from "../Services/TaiAnhService.js";
import { TaoThietBi } from "../Services/ThietBiService.js";
import {
  ChuoiBatBuoc,
  ChuoiTuyChon,
  CoKhong,
  KhoangBanTuChuoi,
  LoiNhapExcel,
  LoiOExcel,
  NgayGioTuyChon,
  NgayTuyChon,
  NhapTepExcel,
  SoTuyChon,
  TachDanhSach,
  TaoTepMauExcel,
  ThongSoTuChuoi,
  TimTheoNhan,
  TimTrongDanhSach,
  type CauHinhNhapExcel,
} from "../Services/NhapExcelService.js";
import type { YeuCauXacThuc } from "../Types/index.js";
import {
  DuLieuCaQuaySchema,
  KiemTraPhanCongKhongTrung,
} from "./CaQuayController.js";
import { TenChucDanhSchema } from "./ChucDanhController.js";
import { DuLieuDuAnSchema } from "./DuAnController.js";
import { DuLieuKhoSchema } from "./KhoController.js";
import { DuLieuNhanSuSchema } from "./NhanSuController.js";
import { NhomQuyenSchema } from "./NhomQuyenController.js";
import { DuLieuPhongSchema } from "./PhongStudioController.js";
import { DuLieuThietBiSchema } from "./ThietBiController.js";
import { SchemaMau } from "./ThongKeVanHanhController.js";

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

// Nhãn đầu tiên là nhãn hiển thị trong danh sách chọn, các nhãn sau là cách viết được chấp nhận.
const NhanTrangThaiDuAn: Record<TrangThaiDuAn, string[]> = {
  DANG_CHUAN_BI: ["Đang chuẩn bị"],
  DANG_SAN_XUAT: ["Đang sản xuất"],
  HOAN_THANH: ["Hoàn thành"],
  DA_HUY: ["Đã hủy", "Đã huỷ"],
};
const NhanTrangThaiStudio: Record<TrangThaiStudio, string[]> = {
  SAN_SANG: ["Sẵn sàng"],
  BAO_TRI: ["Bảo trì"],
  DONG_CUA: ["Đóng cửa"],
};
const NhanTrangThaiThietBi: Record<TrangThaiThietBi, string[]> = {
  SAN_SANG: ["Đủ điều kiện sử dụng", "Sẵn sàng"],
  DANG_SU_DUNG: ["Đang sử dụng"],
  BAO_TRI: ["Bảo trì"],
  HU_HONG: ["Có hư hỏng", "Hư hỏng"],
};
const NhanTrangThaiCaQuay: Record<TrangThaiCaQuay, string[]> = {
  DU_THAO: ["Dự thảo"],
  DA_DUYET: ["Đã duyệt"],
  DANG_DIEN_RA: ["Đang diễn ra"],
  HOAN_THANH: ["Hoàn thành"],
  DA_HUY: ["Đã hủy", "Đã huỷ"],
};
const LuaChonCoKhong = ["Có", "Không"];

function NhanDauTien(BangNhan: Record<string, string[]>) {
  return Object.values(BangNhan).map((DanhSach) => DanhSach[0] ?? "");
}

// Nhãn quyền dạng "Dự án - Tạo" để người dùng không phải nhập mã kỹ thuật.
const DanhSachNhanQuyen = Object.entries(BangQuyen).flatMap(([Nhom, DuLieu]) =>
  Object.entries(DuLieu.ThaoTac).map(([ThaoTac, TenThaoTac]) => ({
    Ma: `${Nhom}.${ThaoTac}`,
    Nhan: `${DuLieu.Ten} - ${TenThaoTac}`,
  })),
);

// Lịch bận và trình độ lưu ở thông tin bổ sung, sau khi tài nguyên được tạo.
interface DuLieuKemLichBan<T> {
  DuLieu: T;
  CacKhoangBan: KhoangBan[];
  TrinhDo?: number | null;
}

function DocLichBan(GiaTri: string | undefined) {
  return CacKhoangBanSchema.parse(KhoangBanTuChuoi(GiaTri, "Lịch bận"));
}

async function LuuLichBan<T>(
  Nhom: "thiet-bi" | "phong-studio" | "nhan-su",
  Id: string,
  DonViId: string,
  DuLieu: DuLieuKemLichBan<T>,
) {
  if (!DuLieu.CacKhoangBan.length && DuLieu.TrinhDo === undefined) return;
  await LuuThongTinBoSung(Nhom, Id, DonViId, {
    CacKhoangKhongKhaDung: DuLieu.CacKhoangBan,
    ...(DuLieu.TrinhDo !== undefined ? { TrinhDo: DuLieu.TrinhDo } : {}),
  });
}

const DanhSachTenThongSo = [
  "Thương hiệu",
  ...new Set(
    Object.keys(NhanTruongThongSo)
      .filter((Khoa) => TimKhoaThongSo(NhanTruongThongSo[Khoa] ?? "") === Khoa)
      .map((Khoa) => NhanTruongThongSo[Khoa] ?? ""),
  ),
].sort((A, B) => A.localeCompare(B, "vi"));

function TaoCauHinhDuAn(
  DonViId: string,
  NguoiDungId: string,
): CauHinhNhapExcel<null, ReturnType<typeof DuLieuDuAnSchema.parse>> {
  return {
    TenTrang: "Dự án",
    DanhSachCot: [
      {
        Khoa: "MaDuAn",
        TieuDe: "Mã dự án",
        MoTa: "Mã riêng của dự án, tối đa 50 ký tự. Để trống nếu chưa có.",
        ViDu: "DA-2026-01",
      },
      {
        Khoa: "TenDuAn",
        TieuDe: "Tên dự án",
        BatBuoc: true,
        MoTa: "Từ 2 đến 200 ký tự.",
        ViDu: "Phim tài liệu Mùa xuân",
      },
      {
        Khoa: "TenKhachHang",
        TieuDe: "Khách hàng",
        MoTa: "Tối đa 200 ký tự.",
        ViDu: "Công ty ABC",
      },
      {
        Khoa: "MoTa",
        TieuDe: "Mô tả",
        MoTa: "Tối đa 2000 ký tự.",
        ViDu: "Quay 5 tập phóng sự",
      },
      {
        Khoa: "TrangThai",
        TieuDe: "Trạng thái",
        BatBuoc: true,
        MoTa: "Chọn trong danh sách.",
        ViDu: "Đang chuẩn bị",
        DanhSachChon: "Trạng thái",
      },
      {
        Khoa: "HanChot",
        TieuDe: "Hạn chót",
        MoTa: "Định dạng dd/mm/yyyy.",
        ViDu: "31/12/2026",
      },
    ],
    LayNguCanh: async () => null,
    LayDanhSachChon: () => [
      { TieuDe: "Trạng thái", GiaTri: NhanDauTien(NhanTrangThaiDuAn) },
    ],
    ChuyenDong: (Dong, NguCanh, BanDoLoi) =>
      DuLieuDuAnSchema.parse(
        {
          MaDuAn: ChuoiTuyChon(Dong.MaDuAn),
          TenDuAn: ChuoiBatBuoc(Dong.TenDuAn, "Tên dự án"),
          TenKhachHang: ChuoiTuyChon(Dong.TenKhachHang),
          MoTa: ChuoiTuyChon(Dong.MoTa),
          TrangThai: TimTheoNhan(
            ChuoiBatBuoc(Dong.TrangThai, "Trạng thái"),
            NhanTrangThaiDuAn,
            "Trạng thái",
          ),
          HanChot: NgayTuyChon(Dong.HanChot, "Hạn chót"),
        },
        { errorMap: BanDoLoi },
      ),
    LayKhoaTrung: (DuLieu) => DuLieu.MaDuAn,
    ThongBaoTrung: "Mã dự án bị trùng",
    Luu: (DuLieu) => TaoDuAn(DuLieu, NguoiDungId, DonViId),
  };
}

function TaoCauHinhKho(
  DonViId: string,
): CauHinhNhapExcel<null, ReturnType<typeof DuLieuKhoSchema.parse>> {
  return {
    TenTrang: "Kho",
    DanhSachCot: [
      {
        Khoa: "MaKho",
        TieuDe: "Mã kho",
        BatBuoc: true,
        MoTa: "Mã riêng của kho, tối đa 50 ký tự.",
        ViDu: "KHO-01",
      },
      {
        Khoa: "TenKho",
        TieuDe: "Tên kho",
        BatBuoc: true,
        MoTa: "Từ 2 đến 200 ký tự.",
        ViDu: "Kho trung tâm",
      },
      {
        Khoa: "DiaChi",
        TieuDe: "Địa chỉ",
        BatBuoc: true,
        MoTa: "Từ 2 đến 500 ký tự.",
        ViDu: "12 Nguyễn Huệ, Quận 1, TP.HCM",
      },
      {
        Khoa: "ViDo",
        TieuDe: "Vĩ độ",
        BatBuoc: true,
        MoTa: "Số thập phân từ -90 đến 90.",
        ViDu: "10.776889",
      },
      {
        Khoa: "KinhDo",
        TieuDe: "Kinh độ",
        BatBuoc: true,
        MoTa: "Số thập phân từ -180 đến 180.",
        ViDu: "106.700806",
      },
      {
        Khoa: "BanKinhXacMinhMet",
        TieuDe: "Bán kính xác minh (m)",
        BatBuoc: true,
        MoTa: "Số nguyên từ 1 đến 5000 mét.",
        ViDu: "100",
      },
      {
        Khoa: "DangHoatDong",
        TieuDe: "Đang hoạt động",
        BatBuoc: true,
        MoTa: "Chọn Có hoặc Không.",
        ViDu: "Có",
        DanhSachChon: "Có/Không",
      },
    ],
    LayNguCanh: async () => null,
    LayDanhSachChon: () => [{ TieuDe: "Có/Không", GiaTri: LuaChonCoKhong }],
    ChuyenDong: (Dong, NguCanh, BanDoLoi) =>
      DuLieuKhoSchema.parse(
        {
          MaKho: ChuoiBatBuoc(Dong.MaKho, "Mã kho"),
          TenKho: ChuoiBatBuoc(Dong.TenKho, "Tên kho"),
          DiaChi: ChuoiBatBuoc(Dong.DiaChi, "Địa chỉ"),
          ViDo: SoTuyChon(ChuoiBatBuoc(Dong.ViDo, "Vĩ độ"), "Vĩ độ"),
          KinhDo: SoTuyChon(ChuoiBatBuoc(Dong.KinhDo, "Kinh độ"), "Kinh độ"),
          BanKinhXacMinhMet: SoTuyChon(
            ChuoiBatBuoc(Dong.BanKinhXacMinhMet, "Bán kính xác minh (m)"),
            "Bán kính xác minh (m)",
            true,
          ),
          DangHoatDong: CoKhong(
            ChuoiBatBuoc(Dong.DangHoatDong, "Đang hoạt động"),
            "Đang hoạt động",
          ),
        },
        { errorMap: BanDoLoi },
      ),
    LayKhoaTrung: (DuLieu) => DuLieu.MaKho,
    ThongBaoTrung: "Mã kho bị trùng",
    Luu: (DuLieu) => TaoKho(DuLieu, DonViId),
  };
}

function TaoCauHinhStudio(
  DonViId: string,
): CauHinhNhapExcel<
  null,
  DuLieuKemLichBan<ReturnType<typeof DuLieuPhongSchema.parse>>
> {
  return {
    TenTrang: "Studio",
    DanhSachCot: [
      {
        Khoa: "MaPhong",
        TieuDe: "Mã phòng",
        MoTa: "Mã riêng của phòng quay, tối đa 50 ký tự.",
        ViDu: "ST-01",
      },
      {
        Khoa: "TenPhong",
        TieuDe: "Tên phòng",
        BatBuoc: true,
        MoTa: "Từ 2 đến 200 ký tự.",
        ViDu: "Studio A",
      },
      {
        Khoa: "DiaDiem",
        TieuDe: "Địa điểm",
        MoTa: "Tối đa 200 ký tự.",
        ViDu: "Tầng 3, tòa nhà B",
      },
      {
        Khoa: "SucChua",
        TieuDe: "Sức chứa",
        MoTa: "Số người tối đa, số nguyên lớn hơn 0.",
        ViDu: "20",
      },
      {
        Khoa: "TrangThai",
        TieuDe: "Trạng thái",
        BatBuoc: true,
        MoTa: "Chọn trong danh sách.",
        ViDu: "Sẵn sàng",
        DanhSachChon: "Trạng thái",
      },
      {
        Khoa: "CacKhoangKhongKhaDung",
        TieuDe: "Lịch bận",
        MoTa: 'Khoảng thời gian không thể sử dụng (giờ Việt Nam), dạng "dd/mm/yyyy hh:mm đến dd/mm/yyyy hh:mm (lý do)", nhiều khoảng cách nhau bằng dấu chấm phẩy (;).',
        ViDu: "20/12/2026 08:00 đến 20/12/2026 17:00 (Bảo trì giàn đèn)",
      },
    ],
    LayNguCanh: async () => null,
    LayDanhSachChon: () => [
      { TieuDe: "Trạng thái", GiaTri: NhanDauTien(NhanTrangThaiStudio) },
    ],
    ChuyenDong: (Dong, NguCanh, BanDoLoi) => ({
      CacKhoangBan: DocLichBan(Dong.CacKhoangKhongKhaDung),
      DuLieu: DuLieuPhongSchema.parse(
        {
          MaPhong: ChuoiTuyChon(Dong.MaPhong),
          TenPhong: ChuoiBatBuoc(Dong.TenPhong, "Tên phòng"),
          DiaDiem: ChuoiTuyChon(Dong.DiaDiem),
          SucChua: SoTuyChon(Dong.SucChua, "Sức chứa", true),
          TrangThai: TimTheoNhan(
            ChuoiBatBuoc(Dong.TrangThai, "Trạng thái"),
            NhanTrangThaiStudio,
            "Trạng thái",
          ),
        },
        { errorMap: BanDoLoi },
      ),
    }),
    LayKhoaTrung: (DuLieu) => DuLieu.DuLieu.MaPhong,
    ThongBaoTrung: "Mã phòng bị trùng",
    Luu: async (DuLieu) => {
      const Phong = await TaoPhongStudio(DuLieu.DuLieu, DonViId);
      await LuuLichBan("phong-studio", Phong.Id, DonViId, DuLieu);
      return Phong;
    },
  };
}

interface NguCanhNhanSu {
  NhomQuyen: { Id: string; TenNhom: string; MaNhom: string }[];
  ChucDanh: { Id: string; TenChucDanh: string; DangSuDung: boolean }[];
}

function TaoCauHinhNhanSu(
  DonViId: string,
  QuanTriDonVi: boolean,
): CauHinhNhapExcel<
  NguCanhNhanSu,
  DuLieuKemLichBan<
    ReturnType<typeof DuLieuNhanSuSchema.parse> & { MatKhau: string }
  >
> {
  return {
    TenTrang: "Nhân sự",
    DanhSachCot: [
      {
        Khoa: "TenDangNhap",
        TieuDe: "Tên đăng nhập",
        BatBuoc: true,
        MoTa: "Từ 3 đến 50 ký tự, chỉ gồm chữ không dấu, chữ số, dấu chấm, gạch ngang hoặc gạch dưới.",
        ViDu: "nguyenvana",
      },
      {
        Khoa: "HoTen",
        TieuDe: "Họ và tên",
        BatBuoc: true,
        MoTa: "Từ 2 đến 200 ký tự.",
        ViDu: "Nguyễn Văn A",
      },
      {
        Khoa: "Email",
        TieuDe: "Email",
        BatBuoc: true,
        MoTa: "Địa chỉ email hợp lệ, không trùng với nhân sự khác.",
        ViDu: "nguyenvana@congty.vn",
      },
      {
        Khoa: "SoDienThoai",
        TieuDe: "Số điện thoại",
        BatBuoc: true,
        MoTa: "Từ 9 đến 15 chữ số, có thể bắt đầu bằng dấu +.",
        ViDu: "0901234567",
      },
      {
        Khoa: "MatKhau",
        TieuDe: "Mật khẩu",
        BatBuoc: true,
        MoTa: "Mật khẩu đăng nhập ban đầu, từ 6 đến 72 ký tự.",
        ViDu: "MatKhau@123",
      },
      {
        Khoa: "NhomQuyenId",
        TieuDe: "Nhóm quyền",
        MoTa: "Tên nhóm quyền đã có trong đơn vị.",
        ViDu: "Nhân viên kho",
        DanhSachChon: "Nhóm quyền",
      },
      {
        Khoa: "ChucDanhId",
        TieuDe: "Chức danh",
        MoTa: "Tên chức danh đang sử dụng.",
        ViDu: "Quay phim",
        DanhSachChon: "Chức danh",
      },
      {
        Khoa: "TrinhDo",
        TieuDe: "Trình độ",
        MoTa: "Trình độ theo chức danh, số nguyên từ 1 đến 5 (5 là cao nhất). Dùng để xếp hạng người thay thế.",
        ViDu: "4",
      },
      {
        Khoa: "CacKhoangKhongKhaDung",
        TieuDe: "Lịch bận",
        MoTa: 'Khoảng thời gian không thể sử dụng (giờ Việt Nam), dạng "dd/mm/yyyy hh:mm đến dd/mm/yyyy hh:mm (lý do)", nhiều khoảng cách nhau bằng dấu chấm phẩy (;).',
        ViDu: "24/12/2026 00:00 đến 24/12/2026 23:59 (Nghỉ phép)",
      },
    ],
    LayNguCanh: async () => {
      const [NhomQuyen, ChucDanh] = await Promise.all([
        CoSoDuLieu.nhomQuyen.findMany({
          where: { DonViId },
          select: { Id: true, TenNhom: true, MaNhom: true },
          orderBy: { TenNhom: "asc" },
        }),
        CoSoDuLieu.chucDanh.findMany({
          where: DieuKienChucDanhDonVi(DonViId),
          select: { Id: true, TenChucDanh: true, DangSuDung: true },
          orderBy: { TenChucDanh: "asc" },
        }),
      ]);
      return { NhomQuyen, ChucDanh };
    },
    LayDanhSachChon: (NguCanh) => [
      {
        TieuDe: "Nhóm quyền",
        GiaTri: NguCanh.NhomQuyen.map((Muc) => Muc.TenNhom),
      },
      {
        TieuDe: "Chức danh",
        GiaTri: NguCanh.ChucDanh.filter((Muc) => Muc.DangSuDung).map(
          (Muc) => Muc.TenChucDanh,
        ),
      },
    ],
    ChuyenDong: (Dong, NguCanh, BanDoLoi) => {
      const NhomQuyen = TimTrongDanhSach(
        Dong.NhomQuyenId,
        NguCanh.NhomQuyen,
        (Muc) => [Muc.TenNhom, Muc.MaNhom],
        `Không tìm thấy nhóm quyền "${Dong.NhomQuyenId}" trong đơn vị.`,
      );
      const ChucDanh = TimTrongDanhSach(
        Dong.ChucDanhId,
        NguCanh.ChucDanh,
        (Muc) => [Muc.TenChucDanh],
        `Không tìm thấy chức danh "${Dong.ChucDanhId}".`,
      );
      // Excel có thể làm mất số 0 đầu khi ô được nhập dạng số.
      let SoDienThoai = ChuoiBatBuoc(Dong.SoDienThoai, "Số điện thoại");
      if (/^[1-9][0-9]{8,9}$/.test(SoDienThoai))
        SoDienThoai = `0${SoDienThoai}`;
      const DuLieu = DuLieuNhanSuSchema.parse(
        {
          TenDangNhap: ChuoiBatBuoc(Dong.TenDangNhap, "Tên đăng nhập"),
          HoTen: ChuoiBatBuoc(Dong.HoTen, "Họ và tên"),
          Email: ChuoiBatBuoc(Dong.Email, "Email"),
          SoDienThoai,
          MatKhau: ChuoiBatBuoc(Dong.MatKhau, "Mật khẩu"),
          NhomQuyenId: NhomQuyen?.Id ?? null,
          ChucDanhId: ChucDanh?.Id ?? null,
        },
        { errorMap: BanDoLoi },
      );
      if (!DuLieu.MatKhau)
        throw new LoiOExcel("Vui lòng nhập mật khẩu cho nhân sự mới.");
      const TrinhDo = SoTuyChon(Dong.TrinhDo, "Trình độ", true);
      return {
        DuLieu: { ...DuLieu, MatKhau: DuLieu.MatKhau },
        CacKhoangBan: DocLichBan(Dong.CacKhoangKhongKhaDung),
        TrinhDo:
          TrinhDo === undefined ? undefined : TrinhDoSchema.parse(TrinhDo),
      };
    },
    LayKhoaTrung: (DuLieu) => DuLieu.DuLieu.TenDangNhap,
    ThongBaoTrung: "Tên đăng nhập bị trùng",
    Luu: async (DuLieu) => {
      const NhanSu = await TaoNhanSu(DuLieu.DuLieu, DonViId, QuanTriDonVi);
      await LuuLichBan("nhan-su", NhanSu.Id, DonViId, DuLieu);
      return NhanSu;
    },
  };
}

interface NguCanhThietBi {
  DanhMuc: { Id: string; MaDanhMuc: string | null; TenDanhMuc: string }[];
  Mau: { Id: string; MaMau: string; TenMau: string; DanhMucId: string }[];
  Kho: { Id: string; MaKho: string; TenKho: string }[];
}

async function LayDanhMucVaMau(DonViId: string) {
  return Promise.all([
    CoSoDuLieu.danhMucThietBi.findMany({
      where: { DonViId },
      select: { Id: true, MaDanhMuc: true, TenDanhMuc: true },
      orderBy: { TenDanhMuc: "asc" },
    }),
    CoSoDuLieu.mauThietBi.findMany({
      where: { DanhMuc: { DonViId } },
      select: { Id: true, MaMau: true, TenMau: true, DanhMucId: true },
      orderBy: { TenMau: "asc" },
    }),
  ]);
}

function TimDanhMuc(GiaTri: string, NguCanh: Pick<NguCanhThietBi, "DanhMuc">) {
  const DanhMuc = TimTrongDanhSach(
    GiaTri,
    NguCanh.DanhMuc,
    (Muc) => [Muc.MaDanhMuc, Muc.TenDanhMuc],
    `Không tìm thấy danh mục "${GiaTri}" trong đơn vị.`,
  );
  if (!DanhMuc) throw new LoiOExcel("Vui lòng nhập danh mục.");
  return DanhMuc;
}

const NhanMucDoSuCo: Record<MucDoSuCo, string[]> = {
  NHE: ["Nhẹ"],
  TRUNG_BINH: ["Trung bình"],
  NGHIEM_TRONG: ["Nghiêm trọng"],
};

const MoTaSuCoMacDinh: Partial<Record<TrangThaiThietBi, string>> = {
  BAO_TRI: "Thiết bị đang bảo trì khi được nhập vào hệ thống.",
  HU_HONG: "Thiết bị có hư hỏng khi được nhập vào hệ thống.",
};

// Thiết bị nhập ở tình trạng Bảo trì/Có hư hỏng được mở phiếu sự cố tương ứng,
// như khi báo sự cố trên giao diện; mức độ phải khớp với tình trạng.
function DocSuCoKhiNhap(
  TrangThai: TrangThaiThietBi,
  MucDoNhap: string | undefined,
  MoTaNhap: string | undefined,
) {
  const MoTaMacDinh = MoTaSuCoMacDinh[TrangThai];
  if (!MoTaMacDinh) {
    if (ChuoiTuyChon(MucDoNhap) || ChuoiTuyChon(MoTaNhap))
      throw new LoiOExcel(
        "Chỉ nhập mức độ và mô tả sự cố khi tình trạng là Bảo trì hoặc Có hư hỏng.",
      );
    return null;
  }
  const MucDoDaChon = ChuoiTuyChon(MucDoNhap)
    ? TimTheoNhan(ChuoiTuyChon(MucDoNhap)!, NhanMucDoSuCo, "Mức độ sự cố")
    : undefined;
  const MucDo =
    MucDoDaChon ??
    (TrangThai === TrangThaiThietBi.BAO_TRI
      ? MucDoSuCo.NHE
      : MucDoSuCo.TRUNG_BINH);
  if (TrangThai === TrangThaiThietBi.BAO_TRI && MucDo !== MucDoSuCo.NHE)
    throw new LoiOExcel(
      'Thiết bị ở tình trạng Bảo trì chỉ đi với mức độ sự cố "Nhẹ"; mức độ cao hơn hãy chọn tình trạng Có hư hỏng.',
    );
  if (TrangThai === TrangThaiThietBi.HU_HONG && MucDo === MucDoSuCo.NHE)
    throw new LoiOExcel(
      'Thiết bị có hư hỏng cần mức độ sự cố "Trung bình" hoặc "Nghiêm trọng".',
    );
  const MoTaLoi = ChuoiTuyChon(MoTaNhap) ?? MoTaMacDinh;
  if (MoTaLoi.length < 5)
    throw new LoiOExcel("Mô tả sự cố phải có ít nhất 5 ký tự.");
  if (MoTaLoi.length > 2000)
    throw new LoiOExcel("Mô tả sự cố không được vượt quá 2.000 ký tự.");
  return { MucDo, MoTaLoi };
}

function TaoCauHinhThietBi(
  DonViId: string,
  NguoiDungId: string,
): CauHinhNhapExcel<
  NguCanhThietBi,
  DuLieuKemLichBan<ReturnType<typeof DuLieuThietBiSchema.parse>> & {
    SuCo: { MucDo: MucDoSuCo; MoTaLoi: string } | null;
  }
> {
  return {
    TenTrang: "Thiết bị",
    DanhSachCot: [
      {
        Khoa: "TenThietBi",
        TieuDe: "Tên thiết bị",
        BatBuoc: true,
        MoTa: "Từ 2 đến 200 ký tự.",
        ViDu: "Máy quay Sony FX6 số 1",
      },
      {
        Khoa: "SoSeri",
        TieuDe: "Số seri",
        BatBuoc: true,
        MoTa: "Số seri của nhà sản xuất, tối đa 100 ký tự.",
        ViDu: "SN123456",
      },
      {
        Khoa: "MaQR",
        TieuDe: "Mã QR",
        MoTa: "Để trống để hệ thống tự tạo mã QR.",
        ViDu: "TB-0001",
      },
      {
        Khoa: "DanhMucId",
        TieuDe: "Danh mục",
        BatBuoc: true,
        MoTa: "Mã hoặc tên danh mục tài nguyên đã có.",
        ViDu: "MAY_QUAY",
        DanhSachChon: "Danh mục",
      },
      {
        Khoa: "MauThietBiId",
        TieuDe: "Dòng tài nguyên",
        MoTa: "Mã dòng tài nguyên thuộc đúng danh mục đã chọn. Để trống nếu chưa xác định.",
        ViDu: "FX6",
        DanhSachChon: "Dòng tài nguyên",
      },
      {
        Khoa: "KhoId",
        TieuDe: "Kho quản lý",
        MoTa: "Mã hoặc tên kho. Để trống nếu chưa gán kho.",
        ViDu: "KHO-01",
        DanhSachChon: "Kho",
      },
      {
        Khoa: "ViTriKho",
        TieuDe: "Vị trí trong kho",
        MoTa: "Kệ, tủ hoặc ngăn, tối đa 200 ký tự.",
        ViDu: "Kệ A - Tầng 2",
      },
      {
        Khoa: "TrangThai",
        TieuDe: "Tình trạng",
        BatBuoc: true,
        MoTa: "Chọn trong danh sách.",
        ViDu: "Đủ điều kiện sử dụng",
        DanhSachChon: "Tình trạng",
      },
      {
        Khoa: "ThoiGianKiemTraSauSuDungPhut",
        TieuDe: "Thời gian kiểm tra sau sử dụng (phút)",
        MoTa: "Số nguyên từ 0 đến 1440.",
        ViDu: "30",
      },
      {
        Khoa: "ThuongHieu",
        TieuDe: "Thương hiệu",
        MoTa: "Hãng sản xuất, lưu vào thông số kỹ thuật.",
        ViDu: "Sony",
      },
      {
        Khoa: "ThongSoKyThuat",
        TieuDe: "Thông số kỹ thuật",
        MoTa: 'Dạng "Tên thông số: giá trị", cách nhau bằng dấu chấm phẩy (;). Tên thông số lấy ở cột "Tên thông số" của trang Danh sách chọn; giá trị Có/Không và số được nhận đúng kiểu. Dùng để tính độ tương đồng và tương thích khi gợi ý thay thế.',
        ViDu: "Ngàm ống kính: Sony E; Loại cảm biến: Full frame; Tốc độ khung hình 4K tối đa (fps): 120",
      },
      {
        Khoa: "CacKhoangKhongKhaDung",
        TieuDe: "Lịch bận",
        MoTa: 'Khoảng thời gian không thể sử dụng (giờ Việt Nam), dạng "dd/mm/yyyy hh:mm đến dd/mm/yyyy hh:mm (lý do)", nhiều khoảng cách nhau bằng dấu chấm phẩy (;).',
        ViDu: "22/12/2026 07:00 đến 22/12/2026 11:00 (Hiệu chuẩn cảm biến)",
      },
      {
        Khoa: "MucDoSuCo",
        TieuDe: "Mức độ sự cố",
        MoTa: 'Chỉ dùng khi tình trạng là Bảo trì hoặc Có hư hỏng; hệ thống tự mở phiếu sự cố bảo trì cho thiết bị. Bảo trì đi với "Nhẹ" (mặc định); Có hư hỏng đi với "Trung bình" (mặc định) hoặc "Nghiêm trọng".',
        ViDu: "Trung bình",
        DanhSachChon: "Mức độ sự cố",
      },
      {
        Khoa: "MoTaSuCo",
        TieuDe: "Mô tả sự cố",
        MoTa: "Tình trạng lỗi ghi vào phiếu sự cố, từ 5 đến 2.000 ký tự. Để trống sẽ dùng mô tả mặc định theo tình trạng.",
        ViDu: "Quạt tản nhiệt kêu to, cần vệ sinh và kiểm tra.",
      },
      {
        Khoa: "HinhAnh",
        TieuDe: "Hình ảnh",
        MoTa: "Chèn ảnh trực tiếp vào ô của dòng thiết bị (Chèn > Hình ảnh). Chỉ nhận JPG, PNG, WEBP hoặc GIF, tối đa 5 MB mỗi ảnh; mỗi dòng một ảnh. Để trống nếu không có ảnh.",
        ViDu: "Chèn ảnh vào ô này",
      },
    ],
    KhoaAnh: "HinhAnh",
    LayNguCanh: async () => {
      const [[DanhMuc, Mau], Kho] = await Promise.all([
        LayDanhMucVaMau(DonViId),
        CoSoDuLieu.kho.findMany({
          where: { DonViId },
          select: { Id: true, MaKho: true, TenKho: true },
          orderBy: { MaKho: "asc" },
        }),
      ]);
      return { DanhMuc, Mau, Kho };
    },
    LayDanhSachChon: (NguCanh) => [
      {
        TieuDe: "Danh mục",
        GiaTri: NguCanh.DanhMuc.map((Muc) => Muc.MaDanhMuc ?? Muc.TenDanhMuc),
      },
      {
        TieuDe: "Dòng tài nguyên",
        GiaTri: NguCanh.Mau.map((Muc) => Muc.MaMau),
      },
      { TieuDe: "Kho", GiaTri: NguCanh.Kho.map((Muc) => Muc.MaKho) },
      {
        TieuDe: "Tình trạng",
        GiaTri: NhanDauTien(NhanTrangThaiThietBi),
      },
      { TieuDe: "Tên thông số", GiaTri: DanhSachTenThongSo },
      { TieuDe: "Mức độ sự cố", GiaTri: NhanDauTien(NhanMucDoSuCo) },
    ],
    ChuyenDong: (Dong, NguCanh, BanDoLoi) => {
      const DanhMuc = TimDanhMuc(
        ChuoiBatBuoc(Dong.DanhMucId, "Danh mục"),
        NguCanh,
      );
      const Mau = TimTrongDanhSach(
        Dong.MauThietBiId,
        NguCanh.Mau.filter((Muc) => Muc.DanhMucId === DanhMuc.Id),
        (Muc) => [Muc.MaMau, Muc.TenMau],
        `Không tìm thấy dòng tài nguyên "${Dong.MauThietBiId}" trong danh mục "${DanhMuc.TenDanhMuc}".`,
      );
      const Kho = TimTrongDanhSach(
        Dong.KhoId,
        NguCanh.Kho,
        (Muc) => [Muc.MaKho, Muc.TenKho],
        `Không tìm thấy kho "${Dong.KhoId}" trong đơn vị.`,
      );
      const ThuongHieu = ChuoiTuyChon(Dong.ThuongHieu);
      const ThongSo = ThongSoTuChuoi(
        Dong.ThongSoKyThuat,
        "Thông số kỹ thuật",
        TimKhoaThongSo,
      );
      if (ThuongHieu) ThongSo.thuongHieu = ThuongHieu;
      const DuLieu = DuLieuThietBiSchema.parse(
        {
          MaQR: ChuoiTuyChon(Dong.MaQR),
          SoSeri: ChuoiBatBuoc(Dong.SoSeri, "Số seri"),
          TenThietBi: ChuoiBatBuoc(Dong.TenThietBi, "Tên thiết bị"),
          DanhMucId: DanhMuc.Id,
          // Khóa thongSoKyThuat giữ nguyên tên đã lưu trong dữ liệu hiện có.
          ThongSoKyThuat: ThongSo,
          TrangThai: TimTheoNhan(
            ChuoiBatBuoc(Dong.TrangThai, "Tình trạng"),
            NhanTrangThaiThietBi,
            "Tình trạng",
          ),
          ViTriKho: ChuoiTuyChon(Dong.ViTriKho),
          KhoId: Kho?.Id ?? null,
          MauThietBiId: Mau?.Id ?? null,
          ThoiGianKiemTraSauSuDungPhut: SoTuyChon(
            Dong.ThoiGianKiemTraSauSuDungPhut,
            "Thời gian kiểm tra sau sử dụng (phút)",
            true,
          ),
        },
        { errorMap: BanDoLoi },
      );
      return {
        DuLieu,
        CacKhoangBan: DocLichBan(Dong.CacKhoangKhongKhaDung),
        SuCo: DocSuCoKhiNhap(DuLieu.TrangThai, Dong.MucDoSuCo, Dong.MoTaSuCo),
      };
    },
    LayKhoaTrung: (DuLieu) => DuLieu.DuLieu.SoSeri,
    ThongBaoTrung: "Số seri bị trùng",
    Luu: async (DuLieu, Anh) => {
      const AnhDaTai = Anh
        ? await TaiAnhMacDinh(Anh, "mediops/thiet-bi")
        : undefined;
      try {
        const ThietBi = await TaoThietBi(
          DuLieu.DuLieu,
          DonViId,
          AnhDaTai?.SecureUrl,
        );
        try {
          await LuuLichBan("thiet-bi", ThietBi.Id, DonViId, DuLieu);
          if (DuLieu.SuCo)
            await TaoSuCoBaoTri({
              DuLieu: {
                ThietBiId: ThietBi.Id,
                KhoId: ThietBi.KhoId ?? undefined,
                MucDo: DuLieu.SuCo.MucDo,
                MoTaLoi: DuLieu.SuCo.MoTaLoi,
                Nguon: "KIEM_TRA_KHO",
              },
              NguoiBaoCaoId: NguoiDungId,
              DonViId,
            });
        } catch (Loi) {
          // Không để lại thiết bị thiếu phiếu sự cố hoặc lịch bận.
          await CoSoDuLieu.suCoBaoTri.deleteMany({
            where: { ThietBiId: ThietBi.Id },
          });
          await CoSoDuLieu.thietBi.delete({ where: { Id: ThietBi.Id } });
          throw Loi;
        }
        return ThietBi;
      } catch (Loi) {
        // Không để lại ảnh đã tải lên khi thiết bị không được lưu.
        if (AnhDaTai) await CongCuLuuTruAnhCloudinary.XoaAnh(AnhDaTai.PublicId);
        throw Loi;
      }
    },
  };
}

function TaoCauHinhDanhMuc(
  DonViId: string,
): CauHinhNhapExcel<null, ReturnType<typeof SchemaDanhMuc.parse>> {
  return {
    TenTrang: "Danh mục tài nguyên",
    DanhSachCot: [
      {
        Khoa: "MaDanhMuc",
        TieuDe: "Mã danh mục",
        BatBuoc: true,
        MoTa: "Mã riêng của danh mục, tối đa 100 ký tự.",
        ViDu: "MAY_QUAY",
      },
      {
        Khoa: "TenDanhMuc",
        TieuDe: "Tên danh mục",
        BatBuoc: true,
        MoTa: "Tối đa 200 ký tự.",
        ViDu: "Máy quay",
      },
      {
        Khoa: "MoTa",
        TieuDe: "Mô tả",
        MoTa: "Tối đa 1000 ký tự.",
        ViDu: "Các loại máy quay chuyên nghiệp",
      },
    ],
    LayNguCanh: async () => null,
    ChuyenDong: (Dong, NguCanh, BanDoLoi) =>
      SchemaDanhMuc.parse(
        {
          MaDanhMuc: ChuoiBatBuoc(Dong.MaDanhMuc, "Mã danh mục"),
          TenDanhMuc: ChuoiBatBuoc(Dong.TenDanhMuc, "Tên danh mục"),
          MoTa: ChuoiTuyChon(Dong.MoTa),
        },
        { errorMap: BanDoLoi },
      ),
    LayKhoaTrung: (DuLieu) => DuLieu.MaDanhMuc,
    ThongBaoTrung: "Mã danh mục bị trùng",
    Luu: (DuLieu) => LuuDanhMuc(DonViId, DuLieu),
  };
}

function TaoCauHinhDongTaiNguyen(
  DonViId: string,
): CauHinhNhapExcel<
  Pick<NguCanhThietBi, "DanhMuc">,
  ReturnType<typeof SchemaMau.parse>
> {
  return {
    TenTrang: "Dòng tài nguyên",
    DanhSachCot: [
      {
        Khoa: "MaMau",
        TieuDe: "Mã dòng tài nguyên",
        BatBuoc: true,
        MoTa: "Mã duy nhất trong danh mục, tối đa 100 ký tự.",
        ViDu: "FX6",
      },
      {
        Khoa: "TenMau",
        TieuDe: "Tên dòng tài nguyên",
        BatBuoc: true,
        MoTa: "Tối đa 200 ký tự.",
        ViDu: "Sony FX6",
      },
      {
        Khoa: "DanhMucId",
        TieuDe: "Danh mục",
        BatBuoc: true,
        MoTa: "Mã hoặc tên danh mục tài nguyên đã có.",
        ViDu: "MAY_QUAY",
        DanhSachChon: "Danh mục",
      },
    ],
    LayNguCanh: async () => {
      const [DanhMuc] = await LayDanhMucVaMau(DonViId);
      return { DanhMuc };
    },
    LayDanhSachChon: (NguCanh) => [
      {
        TieuDe: "Danh mục",
        GiaTri: NguCanh.DanhMuc.map((Muc) => Muc.MaDanhMuc ?? Muc.TenDanhMuc),
      },
    ],
    ChuyenDong: (Dong, NguCanh, BanDoLoi) =>
      SchemaMau.parse(
        {
          MaMau: ChuoiBatBuoc(Dong.MaMau, "Mã dòng tài nguyên"),
          TenMau: ChuoiBatBuoc(Dong.TenMau, "Tên dòng tài nguyên"),
          DanhMucId: TimDanhMuc(
            ChuoiBatBuoc(Dong.DanhMucId, "Danh mục"),
            NguCanh,
          ).Id,
        },
        { errorMap: BanDoLoi },
      ),
    LayKhoaTrung: (DuLieu) => `${DuLieu.DanhMucId}:${DuLieu.MaMau}`,
    ThongBaoTrung: "Mã dòng tài nguyên bị trùng trong cùng danh mục",
    Luu: (DuLieu) => LuuMau(DonViId, DuLieu),
  };
}

function TaoCauHinhNhomQuyen(
  DonViId: string,
): CauHinhNhapExcel<null, ReturnType<typeof NhomQuyenSchema.parse>> {
  return {
    TenTrang: "Nhóm quyền",
    DanhSachCot: [
      {
        Khoa: "TenNhom",
        TieuDe: "Tên nhóm quyền",
        BatBuoc: true,
        MoTa: "Từ 2 đến 100 ký tự, không trùng nhóm đã có.",
        ViDu: "Nhân viên kho",
      },
      {
        Khoa: "MoTa",
        TieuDe: "Mô tả",
        MoTa: "Tối đa 500 ký tự.",
        ViDu: "Quản lý xuất nhập kho",
      },
      {
        Khoa: "Quyen",
        TieuDe: "Chức năng được cấp",
        MoTa: 'Các chức năng lấy từ cột "Chức năng" của trang Danh sách chọn, cách nhau bằng dấu chấm phẩy (;).',
        ViDu: "Kho - Xem toàn đơn vị; Thiết bị - Xem toàn đơn vị",
      },
    ],
    LayNguCanh: async () => null,
    LayDanhSachChon: () => [
      {
        TieuDe: "Chức năng",
        GiaTri: DanhSachNhanQuyen.map((Muc) => Muc.Nhan),
      },
    ],
    ChuyenDong: (Dong, NguCanh, BanDoLoi) => {
      const Quyen = TachDanhSach(Dong.Quyen).map((GiaTri) => {
        const CanTim = GiaTri.replace(/\s+/g, " ").toLowerCase();
        const Muc = DanhSachNhanQuyen.find(
          (Nhan) =>
            Nhan.Nhan.toLowerCase() === CanTim ||
            Nhan.Ma.toLowerCase() === CanTim,
        );
        if (!Muc || !CacQuyenDuocCap.includes(Muc.Ma))
          throw new LoiOExcel(`Chức năng "${GiaTri}" không hợp lệ.`);
        return Muc.Ma;
      });
      return NhomQuyenSchema.parse(
        {
          TenNhom: ChuoiBatBuoc(Dong.TenNhom, "Tên nhóm quyền"),
          MoTa: ChuoiTuyChon(Dong.MoTa) ?? null,
          Quyen: [...new Set(Quyen)],
        },
        { errorMap: BanDoLoi },
      );
    },
    LayKhoaTrung: (DuLieu) => DuLieu.TenNhom,
    ThongBaoTrung: "Tên nhóm quyền bị trùng",
    Luu: (DuLieu) => TaoNhomQuyen(DonViId, DuLieu),
  };
}

function TaoCauHinhChucDanh(
  PhamVi: string | null,
): CauHinhNhapExcel<null, string> {
  return {
    TenTrang: "Chức danh",
    DanhSachCot: [
      {
        Khoa: "TenChucDanh",
        TieuDe: "Tên chức danh",
        BatBuoc: true,
        MoTa: "Từ 2 đến 100 ký tự, không trùng chức danh đã có.",
        ViDu: "Quay phim",
      },
    ],
    LayNguCanh: async () => null,
    ChuyenDong: (Dong, NguCanh, BanDoLoi) =>
      TenChucDanhSchema.parse(ChuoiBatBuoc(Dong.TenChucDanh, "Tên chức danh"), {
        errorMap: BanDoLoi,
      }),
    LayKhoaTrung: (DuLieu) => DuLieu,
    ThongBaoTrung: "Tên chức danh bị trùng",
    Luu: (DuLieu) => TaoChucDanh(PhamVi, DuLieu),
  };
}

interface NguCanhCaQuay {
  DuAn: { Id: string; MaDuAn: string | null; TenDuAn: string }[];
  Phong: { Id: string; MaPhong: string | null; TenPhong: string }[];
  NhanSu: { Id: string; TenDangNhap: string; HoTen: string }[];
  ThietBi: { Id: string; MaQR: string; SoSeri: string }[];
}

function TaoCauHinhCaQuay(
  DonViId: string,
): CauHinhNhapExcel<
  NguCanhCaQuay,
  ReturnType<typeof DuLieuCaQuaySchema.parse>
> {
  return {
    TenTrang: "Ca quay",
    DanhSachCot: [
      {
        Khoa: "MaCaQuay",
        TieuDe: "Mã ca quay",
        MoTa: "Mã riêng của ca quay, tối đa 50 ký tự.",
        ViDu: "CQ-001",
      },
      {
        Khoa: "TieuDe",
        TieuDe: "Tên ca quay",
        BatBuoc: true,
        MoTa: "Từ 2 đến 200 ký tự.",
        ViDu: "Quay cảnh mở đầu",
      },
      {
        Khoa: "DuAnId",
        TieuDe: "Dự án",
        BatBuoc: true,
        MoTa: "Mã dự án (hoặc tên dự án nếu dự án chưa có mã).",
        ViDu: "DA-2026-01",
        DanhSachChon: "Dự án",
      },
      {
        Khoa: "ThoiGianBatDau",
        TieuDe: "Bắt đầu",
        BatBuoc: true,
        MoTa: "Giờ Việt Nam, định dạng dd/mm/yyyy hh:mm.",
        ViDu: "15/12/2026 08:00",
      },
      {
        Khoa: "ThoiGianKetThuc",
        TieuDe: "Kết thúc",
        BatBuoc: true,
        MoTa: "Giờ Việt Nam, định dạng dd/mm/yyyy hh:mm, phải sau thời gian bắt đầu.",
        ViDu: "15/12/2026 12:00",
      },
      {
        Khoa: "NguoiPhuTrachId",
        TieuDe: "Người phụ trách",
        BatBuoc: true,
        MoTa: "Tên đăng nhập của nhân sự phụ trách ca.",
        ViDu: "nguyenvana",
        DanhSachChon: "Nhân sự",
      },
      {
        Khoa: "PhongStudioId",
        TieuDe: "Phòng quay",
        MoTa: "Mã phòng (hoặc tên phòng). Để trống nếu quay ngoài studio.",
        ViDu: "ST-01",
        DanhSachChon: "Phòng quay",
      },
      {
        Khoa: "GhiChuDiaDiem",
        TieuDe: "Ghi chú địa điểm",
        MoTa: "Tối đa 500 ký tự.",
        ViDu: "Công viên Tao Đàn",
      },
      {
        Khoa: "TrangThai",
        TieuDe: "Trạng thái",
        MoTa: "Để trống sẽ dùng trạng thái mặc định.",
        ViDu: "Dự thảo",
        DanhSachChon: "Trạng thái",
      },
      {
        Khoa: "MucDoUuTien",
        TieuDe: "Mức độ ưu tiên",
        MoTa: "Số nguyên từ 0 đến 100.",
        ViDu: "50",
      },
      {
        Khoa: "CoTheDoiLich",
        TieuDe: "Có thể đổi lịch",
        MoTa: "Chọn Có hoặc Không.",
        ViDu: "Không",
        DanhSachChon: "Có/Không",
      },
      {
        Khoa: "ThoiGianChuanBiPhut",
        TieuDe: "Thời gian chuẩn bị (phút)",
        MoTa: "Số nguyên không âm.",
        ViDu: "30",
      },
      {
        Khoa: "ThoiGianThuHoiPhut",
        TieuDe: "Thời gian thu hồi (phút)",
        MoTa: "Số nguyên không âm.",
        ViDu: "30",
      },
      {
        Khoa: "DanhSachThietBiId",
        TieuDe: "Thiết bị",
        MoTa: "Mã QR hoặc số seri thiết bị, cách nhau bằng dấu chấm phẩy (;).",
        ViDu: "TB-0001; TB-0002",
      },
      {
        Khoa: "DanhSachNhanSu",
        TieuDe: "Nhân sự tham gia",
        MoTa: 'Mỗi người theo dạng "tên đăng nhập: chức danh", cách nhau bằng dấu chấm phẩy (;).',
        ViDu: "tranthib: Quay phim; levanc: Âm thanh",
      },
      {
        Khoa: "GhiChu",
        TieuDe: "Ghi chú",
        MoTa: "Tối đa 2000 ký tự.",
        ViDu: "Mang thêm pin dự phòng",
      },
    ],
    LayNguCanh: async () => {
      const [DuAn, Phong, NhanSu, ThietBi] = await Promise.all([
        CoSoDuLieu.duAn.findMany({
          where: { DonViId },
          select: { Id: true, MaDuAn: true, TenDuAn: true },
          orderBy: { TenDuAn: "asc" },
        }),
        CoSoDuLieu.phongStudio.findMany({
          where: { DonViId },
          select: { Id: true, MaPhong: true, TenPhong: true },
          orderBy: { TenPhong: "asc" },
        }),
        CoSoDuLieu.nguoiDung.findMany({
          where: { DonViId, LaQuanTriHeThong: false },
          select: { Id: true, TenDangNhap: true, HoTen: true },
          orderBy: { TenDangNhap: "asc" },
        }),
        CoSoDuLieu.thietBi.findMany({
          where: { DanhMuc: { DonViId } },
          select: { Id: true, MaQR: true, SoSeri: true },
        }),
      ]);
      return { DuAn, Phong, NhanSu, ThietBi };
    },
    LayDanhSachChon: (NguCanh) => [
      {
        TieuDe: "Dự án",
        GiaTri: NguCanh.DuAn.map((Muc) => Muc.MaDuAn ?? Muc.TenDuAn),
      },
      {
        TieuDe: "Nhân sự",
        GiaTri: NguCanh.NhanSu.map((Muc) => Muc.TenDangNhap),
      },
      {
        TieuDe: "Phòng quay",
        GiaTri: NguCanh.Phong.map((Muc) => Muc.MaPhong ?? Muc.TenPhong),
      },
      { TieuDe: "Trạng thái", GiaTri: NhanDauTien(NhanTrangThaiCaQuay) },
      { TieuDe: "Có/Không", GiaTri: LuaChonCoKhong },
    ],
    ChuyenDong: (Dong, NguCanh, BanDoLoi) => {
      const TimNhanSu = (GiaTri: string, TenCot: string) => {
        const NhanSu = TimTrongDanhSach(
          GiaTri,
          NguCanh.NhanSu,
          (Muc) => [Muc.TenDangNhap],
          `${TenCot}: không tìm thấy nhân sự có tên đăng nhập "${GiaTri}".`,
        );
        if (!NhanSu) throw new LoiOExcel(`Vui lòng nhập "${TenCot}".`);
        return NhanSu;
      };
      const DuAn = TimTrongDanhSach(
        ChuoiBatBuoc(Dong.DuAnId, "Dự án"),
        NguCanh.DuAn,
        (Muc) => [Muc.MaDuAn, Muc.TenDuAn],
        `Không tìm thấy dự án "${Dong.DuAnId}" trong đơn vị.`,
      );
      const Phong = TimTrongDanhSach(
        Dong.PhongStudioId,
        NguCanh.Phong,
        (Muc) => [Muc.MaPhong, Muc.TenPhong],
        `Không tìm thấy phòng quay "${Dong.PhongStudioId}" trong đơn vị.`,
      );
      const DanhSachThietBiId = TachDanhSach(Dong.DanhSachThietBiId).map(
        (Ma) => {
          const ThietBi = TimTrongDanhSach(
            Ma,
            NguCanh.ThietBi,
            (Muc) => [Muc.MaQR, Muc.SoSeri],
            `Không tìm thấy thiết bị "${Ma}" trong đơn vị.`,
          );
          if (!ThietBi) throw new LoiOExcel(`Thiết bị "${Ma}" không hợp lệ.`);
          return ThietBi.Id;
        },
      );
      const DanhSachNhanSu = TachDanhSach(Dong.DanhSachNhanSu).map((Muc) => {
        const ViTri = Muc.indexOf(":");
        if (ViTri < 1)
          throw new LoiOExcel(
            `Nhân sự "${Muc}" phải theo dạng "tên đăng nhập: chức danh".`,
          );
        const ChucDanhPhanCong = Muc.slice(ViTri + 1).trim();
        if (!ChucDanhPhanCong)
          throw new LoiOExcel(`Vui lòng nhập chức danh cho nhân sự "${Muc}".`);
        return {
          NguoiDungId: TimNhanSu(Muc.slice(0, ViTri).trim(), "Nhân sự tham gia")
            .Id,
          ChucDanhPhanCong,
        };
      });
      const DuLieu = DuLieuCaQuaySchema.parse(
        {
          MaCaQuay: ChuoiTuyChon(Dong.MaCaQuay),
          DuAnId: DuAn?.Id,
          TieuDe: ChuoiBatBuoc(Dong.TieuDe, "Tên ca quay"),
          ThoiGianBatDau: NgayGioTuyChon(
            ChuoiBatBuoc(Dong.ThoiGianBatDau, "Bắt đầu"),
            "Bắt đầu",
          ),
          ThoiGianKetThuc: NgayGioTuyChon(
            ChuoiBatBuoc(Dong.ThoiGianKetThuc, "Kết thúc"),
            "Kết thúc",
          ),
          PhongStudioId: Phong?.Id ?? null,
          GhiChuDiaDiem: ChuoiTuyChon(Dong.GhiChuDiaDiem),
          NguoiPhuTrachId: TimNhanSu(
            ChuoiBatBuoc(Dong.NguoiPhuTrachId, "Người phụ trách"),
            "Người phụ trách",
          ).Id,
          TrangThai: TimTheoNhan(
            Dong.TrangThai,
            NhanTrangThaiCaQuay,
            "Trạng thái",
          ),
          GhiChu: ChuoiTuyChon(Dong.GhiChu),
          MucDoUuTien: SoTuyChon(Dong.MucDoUuTien, "Mức độ ưu tiên", true),
          CoTheDoiLich: CoKhong(Dong.CoTheDoiLich, "Có thể đổi lịch"),
          ThoiGianChuanBiPhut: SoTuyChon(
            Dong.ThoiGianChuanBiPhut,
            "Thời gian chuẩn bị (phút)",
            true,
          ),
          ThoiGianThuHoiPhut: SoTuyChon(
            Dong.ThoiGianThuHoiPhut,
            "Thời gian thu hồi (phút)",
            true,
          ),
          DanhSachThietBiId,
          DanhSachNhanSu,
        },
        { errorMap: BanDoLoi },
      );
      KiemTraPhanCongKhongTrung(DuLieu);
      return DuLieu;
    },
    LayKhoaTrung: (DuLieu) => DuLieu.MaCaQuay,
    ThongBaoTrung: "Mã ca quay bị trùng",
    Luu: async (DuLieu) => {
      const CaQuay = await TaoCaQuay(DuLieu, DonViId);
      await PhatCapNhatLich(
        "ca_quay:tao",
        { CaQuayId: CaQuay.Id },
        CaQuay.Id,
        DonViId,
      );
      return CaQuay;
    },
  };
}

// Kiểu dữ liệu từng dòng khác nhau theo loại; bộ máy nhập chỉ cần cấu hình nhất quán.
export type CauHinhBatKy = CauHinhNhapExcel<unknown, unknown>;

export function LayCauHinhNhapExcel(
  Loai: LoaiNhapExcel,
  YeuCau: YeuCauXacThuc,
): CauHinhBatKy {
  const NguoiDung = YeuCau.NguoiDung!;
  if (Loai === "ChucDanh")
    return TaoCauHinhChucDanh(
      NguoiDung.LaQuanTriHeThong ? null : LayDonViId(YeuCau),
    ) as CauHinhBatKy;
  const DonViId = LayDonViId(YeuCau);
  switch (Loai) {
    case "DuAn":
      return TaoCauHinhDuAn(DonViId, NguoiDung.nguoiDungId) as CauHinhBatKy;
    case "CaQuay":
      return TaoCauHinhCaQuay(DonViId) as CauHinhBatKy;
    case "Kho":
      return TaoCauHinhKho(DonViId) as CauHinhBatKy;
    case "Studio":
      return TaoCauHinhStudio(DonViId) as CauHinhBatKy;
    case "NhanSu":
      return TaoCauHinhNhanSu(
        DonViId,
        NguoiDung.QuanTriDonVi === true,
      ) as CauHinhBatKy;
    case "ThietBi":
      return TaoCauHinhThietBi(DonViId, NguoiDung.nguoiDungId) as CauHinhBatKy;
    case "DanhMuc":
      return TaoCauHinhDanhMuc(DonViId) as CauHinhBatKy;
    case "DongTaiNguyen":
      return TaoCauHinhDongTaiNguyen(DonViId) as CauHinhBatKy;
    case "NhomQuyen":
      return TaoCauHinhNhomQuyen(DonViId) as CauHinhBatKy;
  }
}

// Ca quay luôn có người phụ trách nên cần thêm quyền phân công như biểu mẫu tạo ca.
function KiemTraQuyenBoSung(Loai: LoaiNhapExcel, YeuCau: YeuCauXacThuc) {
  if (Loai !== "CaQuay") return true;
  return (YeuCau.NguoiDung?.Quyen ?? []).includes("CaQuay.PhanCong");
}

export function TaiMauExcel(Loai: LoaiNhapExcel) {
  return async (
    YeuCau: YeuCauXacThuc,
    PhanHoi: Response,
    TiepTheo: NextFunction,
  ) => {
    try {
      if (!KiemTraQuyenBoSung(Loai, YeuCau))
        return PhanHoi.status(403).json({
          ThongBao: "Bạn không có quyền thực hiện thao tác này.",
        });
      const NoiDung = await TaoTepMauExcel(LayCauHinhNhapExcel(Loai, YeuCau));
      PhanHoi.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      PhanHoi.setHeader(
        "Content-Disposition",
        `attachment; filename="${TenTepMau[Loai]}"`,
      );
      return PhanHoi.send(NoiDung);
    } catch (Loi) {
      return TiepTheo(Loi);
    }
  };
}

export function NhapExcel(Loai: LoaiNhapExcel) {
  return async (
    YeuCau: YeuCauXacThuc,
    PhanHoi: Response,
    TiepTheo: NextFunction,
  ) => {
    try {
      if (!KiemTraQuyenBoSung(Loai, YeuCau))
        return PhanHoi.status(403).json({
          ThongBao: "Bạn không có quyền thực hiện thao tác này.",
        });
      if (!YeuCau.file)
        return PhanHoi.status(400).json({
          ThongBao: "Vui lòng chọn tệp Excel để nhập.",
        });
      const KetQua = await NhapTepExcel(
        LayCauHinhNhapExcel(Loai, YeuCau),
        YeuCau.file.buffer,
      );
      return PhanHoi.json(KetQua);
    } catch (Loi) {
      if (Loi instanceof LoiNhapExcel)
        return PhanHoi.status(400).json({
          ThongBao: Loi.message,
          DanhSachLoi: Loi.DanhSachLoi,
        });
      return TiepTheo(Loi);
    }
  };
}
