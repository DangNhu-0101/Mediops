import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { CoSoDuLieu } from "../Config/Database.js";
import {
  LoiDuLieuKhongHopLe,
  LoiKhongTimThay,
  LoiXungDotDuLieu,
} from "./LoiNghiepVuService.js";
import {
  TaiDanhSachAnhAnToan,
  CongCuLuuTruAnhCloudinary,
  type CongCuLuuTruAnh,
} from "./TaiAnhService.js";
import { LayThongTinNguoiDung } from "./XacThucService.js";
import { NgatKetNoiNguoiDung } from "./SocketService.js";

export async function CapNhatHoSo(
  Id: string,
  DonViId: string,
  DuLieu: {
    HoTen: string;
    Email: string;
    SoDienThoai: string | null;
    TenDangNhap?: string;
    GioiThieu?: string | null;
    CacKhoangKhongKhaDung?: Prisma.InputJsonValue;
    XoaAnh?: boolean;
  },
  TepAnh?: Express.Multer.File,
  CongCu: CongCuLuuTruAnh = CongCuLuuTruAnhCloudinary,
) {
  const HoSoCu = await CoSoDuLieu.nguoiDung.findFirst({
    where: { Id, DonViId, LaQuanTriHeThong: false },
    select: { AnhDaiDienPublicId: true, TenDangNhap: true },
  });
  if (!HoSoCu) throw new LoiKhongTimThay("Không tìm thấy hồ sơ cá nhân.");
  const PublicIdCu = HoSoCu.AnhDaiDienPublicId;
  const { XoaAnh, ...ThongTin } = DuLieu;
  const TenDangNhap = DuLieu.TenDangNhap ?? HoSoCu.TenDangNhap;
  const TenHeThong = process.env.SYSTEM_ADMIN_USERNAME?.toLowerCase();
  if (
    TenHeThong &&
    [TenDangNhap, DuLieu.Email].some(
      (GiaTri) => GiaTri.toLowerCase() === TenHeThong,
    )
  )
    throw new LoiXungDotDuLieu("Tên đăng nhập hoặc email đã được sử dụng.");
  const TrungDinhDanh = await CoSoDuLieu.nguoiDung.findFirst({
    where: {
      Id: { not: Id },
      OR: [
        { TenDangNhap: { equals: TenDangNhap, mode: "insensitive" } },
        { Email: { equals: TenDangNhap, mode: "insensitive" } },
        { TenDangNhap: { equals: DuLieu.Email, mode: "insensitive" } },
        { Email: { equals: DuLieu.Email, mode: "insensitive" } },
      ],
    },
    select: { Id: true },
  });
  if (TrungDinhDanh)
    throw new LoiXungDotDuLieu("Tên đăng nhập hoặc email đã được sử dụng.");
  async function Luu(Anh?: { SecureUrl: string; PublicId: string }) {
    const ThayAnh = Boolean(Anh || XoaAnh);
    try {
      const KetQua = await CoSoDuLieu.$transaction(
        async (Db) => {
          return Db.nguoiDung.updateMany({
            where: {
              Id,
              DonViId,
              LaQuanTriHeThong: false,
              ...(ThayAnh ? { AnhDaiDienPublicId: PublicIdCu } : {}),
            },
            data: {
              ...ThongTin,
              ...(ThayAnh
                ? {
                    AnhDaiDienUrl: Anh?.SecureUrl ?? null,
                    AnhDaiDienPublicId: Anh?.PublicId ?? null,
                  }
                : {}),
            },
          });
        },
        { isolationLevel: "Serializable" },
      );
      if (!KetQua.count)
        throw new LoiXungDotDuLieu(
          "Hồ sơ đã thay đổi. Vui lòng tải lại trước khi lưu.",
        );
      if (ThayAnh && PublicIdCu) {
        // Hồ sơ đã lưu thành công; lỗi dọn ảnh cũ không được hoàn tác ảnh mới.
        await Promise.allSettled([CongCu.XoaAnh(PublicIdCu)]);
      }
    } catch (Loi) {
      if (
        Loi instanceof Prisma.PrismaClientKnownRequestError &&
        Loi.code === "P2002"
      )
        throw new LoiXungDotDuLieu("Tên đăng nhập hoặc email đã được sử dụng.");
      throw Loi;
    }
  }
  if (TepAnh) {
    await TaiDanhSachAnhAnToan({
      DanhSachTep: [TepAnh],
      ThuMuc: "mediops/ho-so",
      CongCu,
      LuuVaoCoSoDuLieu: async (DanhSach) => Luu(DanhSach[0]),
    });
  } else {
    await Luu();
  }
  return LayThongTinNguoiDung(Id);
}

export async function DoiMatKhauCaNhan(
  Id: string,
  DonViId: string,
  MatKhauHienTai: string,
  MatKhauMoi: string,
) {
  const NguoiDung = await CoSoDuLieu.nguoiDung.findFirst({
    where: { Id, DonViId, LaQuanTriHeThong: false },
    select: { MatKhauHash: true, PhienBanToken: true },
  });
  if (!NguoiDung) throw new LoiKhongTimThay("Không tìm thấy hồ sơ cá nhân.");
  if (!(await bcrypt.compare(MatKhauHienTai, NguoiDung.MatKhauHash)))
    throw new LoiDuLieuKhongHopLe("Mật khẩu hiện tại không chính xác.");
  if (MatKhauHienTai === MatKhauMoi)
    throw new LoiDuLieuKhongHopLe("Mật khẩu mới phải khác mật khẩu hiện tại.");
  const MatKhauHash = await bcrypt.hash(MatKhauMoi, 10);
  const KetQua = await CoSoDuLieu.nguoiDung.updateMany({
    where: {
      Id,
      DonViId,
      PhienBanToken: NguoiDung.PhienBanToken,
      MatKhauHash: NguoiDung.MatKhauHash,
    },
    data: { MatKhauHash, PhienBanToken: { increment: 1 } },
  });
  if (!KetQua.count)
    throw new LoiXungDotDuLieu(
      "Thông tin đăng nhập đã thay đổi. Vui lòng đăng nhập lại.",
    );
  await NgatKetNoiNguoiDung(Id);
}

export async function DatLaiMatKhau(
  Id: string,
  DonViId: string,
  MatKhau: string,
  ChoPhepQuanTri = false,
) {
  const MatKhauHash = await bcrypt.hash(MatKhau, 10);
  const KetQua = await CoSoDuLieu.nguoiDung.updateMany({
    where: {
      Id,
      DonViId,
      LaQuanTriHeThong: false,
      ...(ChoPhepQuanTri ? {} : { QuanTriDonVi: false }),
    },
    data: { MatKhauHash, PhienBanToken: { increment: 1 } },
  });
  if (!KetQua.count)
    throw new LoiKhongTimThay("Không tìm thấy người dùng thuộc đơn vị.");
  await NgatKetNoiNguoiDung(Id);
}

export async function LayNhanSuPhanCong(DonViId: string) {
  return CoSoDuLieu.nguoiDung.findMany({
    where: { DonViId, LaQuanTriHeThong: false },
    select: {
      Id: true,
      HoTen: true,
      ChucDanhId: true,
      ChucDanh: { select: { TenChucDanh: true } },
    },
    orderBy: { HoTen: "asc" },
  });
}
