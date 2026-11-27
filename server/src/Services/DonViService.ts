import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiKhongTimThay, LoiXungDotDuLieu } from "./LoiNghiepVuService.js";
import { ThongTinNguoiDungSelect } from "./XacThucService.js";
import { ChucDanhMau, NhomQuyenMau } from "./QuyenService.js";
import { TaoMaTuTen } from "./NhomQuyenService.js";

export interface DuLieuDonVi {
  MaDonVi: string;
  TenDonVi: string;
  Email?: string;
  SoDienThoai?: string;
  DiaChi?: string;
  DangHoatDong?: boolean;
}

export interface DuLieuQuanLyDauTien {
  TenDangNhap: string;
  MatKhau: string;
  HoTen: string;
  Email: string;
  SoDienThoai?: string;
}

export function LayDanhSachDonVi() {
  return CoSoDuLieu.donVi.findMany({
    select: {
      Id: true,
      MaDonVi: true,
      TenDonVi: true,
      Email: true,
      SoDienThoai: true,
      DiaChi: true,
      DangHoatDong: true,
      NgayTao: true,
      DanhSachNguoiDung: {
        where: { QuanTriDonVi: true },
        select: ThongTinNguoiDungSelect,
        orderBy: { NgayTao: "asc" },
        take: 1,
      },
      _count: { select: { DanhSachNguoiDung: true } },
    },
    orderBy: { NgayTao: "desc" },
  });
}

// Chức danh mẫu thuộc danh mục dùng chung; bổ sung mục còn thiếu và trả theo thứ tự khai báo.
async function LayChucDanhMau(Db: Prisma.TransactionClient) {
  const DaCo = await Db.chucDanh.findMany({
    where: { DonViId: null, TenChucDanh: { in: [...ChucDanhMau] } },
    select: { Id: true, TenChucDanh: true },
  });
  return Promise.all(
    ChucDanhMau.map(
      async (TenChucDanh) =>
        DaCo.find((Muc) => Muc.TenChucDanh === TenChucDanh) ??
        Db.chucDanh.create({
          data: {
            DonViId: null,
            MaChucDanh: TaoMaTuTen(TenChucDanh, "CHUC_DANH"),
            TenChucDanh,
          },
          select: { Id: true, TenChucDanh: true },
        }),
    ),
  );
}

// Tạo nhóm quyền mẫu cho đơn vị mới; chức danh mẫu lấy từ danh mục dùng chung.
export async function TaoDuLieuMauDonVi(
  Db: Prisma.TransactionClient,
  DonViId: string,
) {
  const DanhSachNhom = await Promise.all(
    NhomQuyenMau.map((Nhom) =>
      Db.nhomQuyen.create({
        data: {
          DonViId,
          MaNhom: Nhom.MaNhom,
          TenNhom: Nhom.TenNhom,
          MoTa: Nhom.MoTa,
          Quyen: [...Nhom.Quyen],
          LaMau: true,
        },
        select: { Id: true, MaNhom: true },
      }),
    ),
  );
  return { DanhSachNhom, DanhSachChucDanh: await LayChucDanhMau(Db) };
}

export async function TaoDonViVaQuanLyDauTien(
  DonVi: DuLieuDonVi,
  QuanLy: DuLieuQuanLyDauTien,
) {
  const MatKhauHash = await bcrypt.hash(QuanLy.MatKhau, 10);
  try {
    return await CoSoDuLieu.$transaction(async (GiaoDich) => {
      const DonViMoi = await GiaoDich.donVi.create({
        data: { ...DonVi, DangHoatDong: true },
      });
      await TaoDuLieuMauDonVi(GiaoDich, DonViMoi.Id);
      // Quản trị đơn vị có toàn quyền nên không gán nhóm quyền và chức danh.
      const QuanLyMoi = await GiaoDich.nguoiDung.create({
        data: {
          TenDangNhap: QuanLy.TenDangNhap,
          MatKhauHash: MatKhauHash,
          HoTen: QuanLy.HoTen,
          Email: QuanLy.Email,
          SoDienThoai: QuanLy.SoDienThoai,
          QuanTriDonVi: true,
          DonViId: DonViMoi.Id,
        },
        select: ThongTinNguoiDungSelect,
      });
      return { ...DonViMoi, QuanLyChinh: QuanLyMoi };
    });
  } catch (Loi) {
    if (
      Loi instanceof Prisma.PrismaClientKnownRequestError &&
      Loi.code === "P2002"
    ) {
      throw new LoiXungDotDuLieu(
        "Mã đơn vị, email hoặc tên đăng nhập đã được sử dụng",
      );
    }
    throw Loi;
  }
}

export async function CapNhatDonVi(Id: string, DuLieu: DuLieuDonVi) {
  const TonTai = await CoSoDuLieu.donVi.findUnique({
    where: { Id: Id },
    select: { Id: true },
  });
  if (!TonTai) throw new LoiKhongTimThay("Không tìm thấy đơn vị");
  try {
    return await CoSoDuLieu.donVi.update({ where: { Id: Id }, data: DuLieu });
  } catch (Loi) {
    if (
      Loi instanceof Prisma.PrismaClientKnownRequestError &&
      Loi.code === "P2002"
    ) {
      throw new LoiXungDotDuLieu("Mã đơn vị đã được sử dụng");
    }
    throw Loi;
  }
}
