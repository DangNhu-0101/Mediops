import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { CoSoDuLieu } from "../Config/Database.js";
import { ThongTinNguoiDungSelect } from "./XacThucService.js";
import { LoiKhongTimThay, LoiXungDotDuLieu } from "./LoiNghiepVuService.js";
import { DieuKienChucDanhDonVi } from "./ChucDanhService.js";

export interface DuLieuNhanSu {
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  SoDienThoai?: string;
  NhomQuyenId: string | null;
  ChucDanhId: string | null;
  QuanTriDonVi?: boolean;
  MatKhau?: string;
}

// Nhóm quyền thuộc đơn vị; chức danh là chức danh riêng của đơn vị hoặc dùng chung và mới gán phải đang sử dụng.
// Quản trị viên đơn vị có toàn quyền nên không thuộc nhóm quyền nào và được phép không gán chức danh.
async function KiemTraNhomQuyenVaChucDanh(
  Db: Prisma.TransactionClient,
  DonViId: string,
  DuLieu: Pick<DuLieuNhanSu, "NhomQuyenId" | "ChucDanhId">,
  LaQuanTriDonVi: boolean,
  ChucDanhCuId?: string | null,
) {
  if (!LaQuanTriDonVi && !DuLieu.NhomQuyenId)
    throw new LoiXungDotDuLieu("Vui lòng chọn nhóm quyền.");
  const [NhomQuyen, ChucDanh] = await Promise.all([
    !LaQuanTriDonVi && DuLieu.NhomQuyenId
      ? Db.nhomQuyen.findFirst({
          where: { Id: DuLieu.NhomQuyenId, DonViId },
          select: { Id: true },
        })
      : null,
    DuLieu.ChucDanhId
      ? Db.chucDanh.findFirst({
          where: { Id: DuLieu.ChucDanhId, ...DieuKienChucDanhDonVi(DonViId) },
          select: { Id: true, DangSuDung: true },
        })
      : null,
  ]);
  if (!LaQuanTriDonVi && !NhomQuyen)
    throw new LoiXungDotDuLieu("Nhóm quyền không thuộc đơn vị.");
  if (!DuLieu.ChucDanhId) {
    if (!LaQuanTriDonVi) throw new LoiXungDotDuLieu("Vui lòng chọn chức danh.");
    return;
  }
  if (!ChucDanh) throw new LoiXungDotDuLieu("Chức danh không thuộc đơn vị.");
  if (!ChucDanh.DangSuDung && ChucDanh.Id !== ChucDanhCuId)
    throw new LoiXungDotDuLieu("Chức danh đã ngừng sử dụng.");
}

export async function LayDanhSachNhanSu(ThamSo: {
  DonViId: string;
  TimKiem?: string;
  NhomQuyenId?: string;
  ChucDanhId?: string;
}) {
  return CoSoDuLieu.nguoiDung.findMany({
    where: {
      DonViId: ThamSo.DonViId,
      LaQuanTriHeThong: false,
      ...(ThamSo.TimKiem
        ? {
            OR: ["HoTen", "TenDangNhap", "Email", "SoDienThoai"].map(
              (Truong) => ({
                [Truong]: { contains: ThamSo.TimKiem, mode: "insensitive" },
              }),
            ),
          }
        : {}),
      ...(ThamSo.NhomQuyenId ? { NhomQuyenId: ThamSo.NhomQuyenId } : {}),
      ...(ThamSo.ChucDanhId ? { ChucDanhId: ThamSo.ChucDanhId } : {}),
    },
    select: {
      ...ThongTinNguoiDungSelect,
      _count: { select: { CaQuayPhuTrach: true, CaQuayThamGia: true } },
    },
    orderBy: { HoTen: "asc" },
  });
}

export async function LayChiTietNhanSu(Id: string, DonViId: string) {
  const NhanSu = await CoSoDuLieu.nguoiDung.findFirst({
    where: { Id: Id, DonViId: DonViId, LaQuanTriHeThong: false },
    select: {
      ...ThongTinNguoiDungSelect,
      CaQuayPhuTrach: {
        select: {
          Id: true,
          MaCaQuay: true,
          TieuDe: true,
          TrangThai: true,
          ThoiGianBatDau: true,
        },
        orderBy: { ThoiGianBatDau: "desc" },
      },
      CaQuayThamGia: {
        select: {
          ChucDanhPhanCong: true,
          CaQuay: {
            select: {
              Id: true,
              MaCaQuay: true,
              TieuDe: true,
              TrangThai: true,
              ThoiGianBatDau: true,
            },
          },
        },
        orderBy: { CaQuay: { ThoiGianBatDau: "desc" } },
      },
    },
  });
  if (!NhanSu) throw new LoiKhongTimThay("Không tìm thấy nhân sự");
  return NhanSu;
}

export async function TaoNhanSu(
  DuLieu: DuLieuNhanSu,
  DonViId: string,
  ChoPhepQuanTri = false,
) {
  if (!DuLieu.MatKhau) throw new LoiXungDotDuLieu("Vui lòng nhập mật khẩu.");
  if (DuLieu.QuanTriDonVi && !ChoPhepQuanTri)
    throw new LoiXungDotDuLieu("Bạn không có quyền cấp quản trị đơn vị.");
  const { MatKhau, ...ThongTin } = DuLieu;
  const MatKhauHash = await bcrypt.hash(MatKhau, 10);
  try {
    return await CoSoDuLieu.$transaction(async (Db) => {
      const LaQuanTri = ThongTin.QuanTriDonVi === true;
      await KiemTraNhomQuyenVaChucDanh(Db, DonViId, ThongTin, LaQuanTri);
      return Db.nguoiDung.create({
        data: {
          ...ThongTin,
          NhomQuyenId: LaQuanTri ? null : ThongTin.NhomQuyenId,
          DonViId,
          MatKhauHash,
        },
        select: ThongTinNguoiDungSelect,
      });
    });
  } catch (Loi) {
    throw ChuyenLoiNhanSu(Loi);
  }
}
export async function CapNhatNhanSu(
  Id: string,
  DuLieu: DuLieuNhanSu,
  DonViId: string,
  ChoPhepQuanTri = false,
) {
  if (DuLieu.QuanTriDonVi !== undefined && !ChoPhepQuanTri)
    throw new LoiXungDotDuLieu("Bạn không có quyền cấp quản trị đơn vị.");
  const { MatKhau, ...ThongTin } = DuLieu;
  try {
    return await CoSoDuLieu.$transaction(
      async (Db) => {
        const Cu = await Db.nguoiDung.findFirst({
          where: { Id, DonViId, LaQuanTriHeThong: false },
          select: { QuanTriDonVi: true, ChucDanhId: true },
        });
        if (!Cu) throw new LoiKhongTimThay("Không tìm thấy nhân sự.");
        const LaQuanTri = ThongTin.QuanTriDonVi ?? Cu.QuanTriDonVi;
        await KiemTraNhomQuyenVaChucDanh(
          Db,
          DonViId,
          ThongTin,
          LaQuanTri,
          Cu.ChucDanhId,
        );
        if (Cu.QuanTriDonVi && !ChoPhepQuanTri)
          throw new LoiXungDotDuLieu(
            "Bạn không có quyền sửa quản trị viên đơn vị.",
          );
        if (
          Cu.QuanTriDonVi &&
          ThongTin.QuanTriDonVi === false &&
          (await Db.nguoiDung.count({
            where: { DonViId, QuanTriDonVi: true },
          })) <= 1
        )
          throw new LoiXungDotDuLieu(
            "Phải giữ ít nhất một quản trị viên của đơn vị.",
          );
        return Db.nguoiDung.update({
          where: { Id },
          data: {
            ...ThongTin,
            NhomQuyenId: LaQuanTri ? null : ThongTin.NhomQuyenId,
          },
          select: ThongTinNguoiDungSelect,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (Loi) {
    throw ChuyenLoiNhanSu(Loi);
  }
}
function ChuyenLoiNhanSu(Loi: unknown) {
  if (
    Loi instanceof Prisma.PrismaClientKnownRequestError &&
    Loi.code === "P2002"
  )
    return new LoiXungDotDuLieu("Email hoặc tên đăng nhập đã được sử dụng.");
  return Loi;
}

export async function XoaNhanSu(
  Id: string,
  NguoiThucHienId: string,
  DonViId: string,
  ChoPhepQuanTri = false,
) {
  if (Id === NguoiThucHienId)
    throw new LoiXungDotDuLieu("Không thể tự xóa tài khoản đang đăng nhập");
  const NhanSu = await CoSoDuLieu.nguoiDung.findFirst({
    where: { Id: Id, DonViId: DonViId, LaQuanTriHeThong: false },
    select: {
      Id: true,
      QuanTriDonVi: true,
      _count: {
        select: {
          DuAnTao: true,
          CaQuayPhuTrach: true,
          CaQuayThamGia: true,
          SuCoBaoCao: true,
          NhatKyThaoTac: true,
          SuCoVanHanhBaoCao: true,
          NhatKySuCoVanHanh: true,
          LoThayThePhuTrach: true,
          PhienQuyetDinhTao: true,
          LoiMoiNhan: true,
          LoiMoiGui: true,
          LoiMoiThayChoMinh: true,
          NhatKyLoiMoi: true,
        },
      },
    },
  });
  if (!NhanSu) throw new LoiKhongTimThay("Không tìm thấy nhân sự");
  if (Object.values(NhanSu._count).some((SoLuong) => SoLuong > 0))
    throw new LoiXungDotDuLieu(
      "Không thể xóa nhân sự đang có dữ liệu nghiệp vụ liên quan",
    );
  await CoSoDuLieu.$transaction(
    async (Db) => {
      const NguoiDung = await Db.nguoiDung.findFirst({
        where: { Id, DonViId },
        select: { QuanTriDonVi: true },
      });
      if (NguoiDung?.QuanTriDonVi && !ChoPhepQuanTri)
        throw new LoiXungDotDuLieu(
          "Bạn không có quyền xóa quản trị viên đơn vị.",
        );
      if (
        NguoiDung?.QuanTriDonVi &&
        (await Db.nguoiDung.count({
          where: { DonViId, QuanTriDonVi: true },
        })) <= 1
      )
        throw new LoiXungDotDuLieu(
          "Phải giữ ít nhất một quản trị viên của đơn vị.",
        );
      await Db.nguoiDung.delete({ where: { Id } });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
