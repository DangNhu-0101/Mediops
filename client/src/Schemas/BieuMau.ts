import { z } from "zod";

const TenDangNhap = z
  .string()
  .trim()
  .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
  .max(50, "Tên đăng nhập không được quá 50 ký tự")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "Tên đăng nhập chỉ gồm chữ cái, chữ số, dấu chấm, gạch ngang hoặc gạch dưới",
  );

const MatKhau = z
  .string()
  .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
  .max(72, "Mật khẩu không được quá 72 ký tự")
  .refine(
    (GiaTri) => new TextEncoder().encode(GiaTri).length <= 72,
    "Mật khẩu không được quá 72 byte",
  );

const SoDienThoai = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập số điện thoại")
  .regex(/^\+?[0-9]{9,15}$/, "Số điện thoại không đúng định dạng");

export const SchemaDangNhap = z.object({
  TenDangNhap: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email hoặc tên đăng nhập"),
  MatKhau: z.string().min(1, "Vui lòng nhập mật khẩu"),
  GhiNho: z.boolean(),
});

export const SchemaQuenMatKhau = z.object({
  Email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .email("Email không đúng định dạng"),
});

export const SchemaDatLaiMatKhau = z
  .object({
    MatKhau: MatKhau,
    XacNhanMatKhau: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((DuLieu) => DuLieu.MatKhau === DuLieu.XacNhanMatKhau, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["XacNhanMatKhau"],
  });

export const SchemaDangKy = z
  .object({
    HoTen: z.string().trim().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
    Email: z.string().trim().email("Email không đúng định dạng"),
    TenDangNhap: TenDangNhap,
    SoDienThoai: SoDienThoai,
    MatKhau: MatKhau,
    XacNhanMatKhau: z.string(),
  })
  .refine((DuLieu) => DuLieu.MatKhau === DuLieu.XacNhanMatKhau, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["XacNhanMatKhau"],
  });

export const SchemaLienHe = z.object({
  HoTen: z.string().trim().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  Email: z.string().trim().email("Email không đúng định dạng"),
  SoDienThoai: SoDienThoai,
  TenDonVi: z.string().trim().max(120, "Tên đơn vị không được quá 120 ký tự"),
  GoiQuanTam: z.enum(["KhoiDau", "ChuyenNghiep", "DoanhNghiep", "ChuaChon"]),
  NoiDung: z
    .string()
    .trim()
    .min(10, "Vui lòng mô tả nhu cầu ít nhất 10 ký tự")
    .max(1000, "Nội dung không được quá 1000 ký tự"),
});

export const SchemaDuAn = z.object({
  MaDuAn: z.string().trim().max(50, "Mã dự án không được quá 50 ký tự"),
  TenDuAn: z
    .string()
    .trim()
    .min(2, "Tên dự án phải có ít nhất 2 ký tự")
    .max(200, "Tên dự án không được quá 200 ký tự"),
  TenKhachHang: z
    .string()
    .trim()
    .max(200, "Tên khách hàng không được quá 200 ký tự"),
  MoTa: z.string().trim().max(2000, "Mô tả không được quá 2.000 ký tự"),
  TrangThai: z.enum(["DANG_CHUAN_BI", "DANG_SAN_XUAT", "HOAN_THANH", "DA_HUY"]),
  HanChot: z.string(),
});

export const SchemaNhanSu = (LaTaoMoi: boolean) =>
  z
    .object({
      TenDangNhap: TenDangNhap,
      HoTen: z
        .string()
        .trim()
        .min(2, "Họ và tên phải có ít nhất 2 ký tự")
        .max(200, "Họ và tên không được quá 200 ký tự"),
      Email: z.string().trim().email("Email không đúng định dạng"),
      SoDienThoai: SoDienThoai,
      NhomQuyenId: z.string(),
      ChucDanhId: z.string(),
      QuanTriDonVi: z.boolean().optional(),
      MatKhau: LaTaoMoi ? MatKhau : z.union([MatKhau, z.literal("")]),
    })
    // Quản trị viên đơn vị có toàn quyền nên không thuộc nhóm quyền và không bắt buộc chức danh.
    .refine((DuLieu) => DuLieu.QuanTriDonVi === true || !!DuLieu.NhomQuyenId, {
      message: "Vui lòng chọn nhóm quyền",
      path: ["NhomQuyenId"],
    })
    .refine((DuLieu) => DuLieu.QuanTriDonVi === true || !!DuLieu.ChucDanhId, {
      message: "Vui lòng chọn chức danh",
      path: ["ChucDanhId"],
    });

export const SchemaThietBi = z.object({
  MauThietBiId: z.string().optional(),
  MaQR: z.string().trim().max(100, "Mã QR không được quá 100 ký tự"),
  SoSeri: z
    .string()
    .trim()
    .min(1, "Số seri là bắt buộc")
    .max(100, "Số seri không được quá 100 ký tự"),
  TenThietBi: z
    .string()
    .trim()
    .min(2, "Tên thiết bị phải có ít nhất 2 ký tự")
    .max(200, "Tên thiết bị không được quá 200 ký tự"),
  DanhMucId: z.string().uuid("Danh mục không hợp lệ"),
  KhoId: z.string().uuid("Vui lòng chọn kho quản lý thiết bị"),
  ThongSoKyThuat: z
    .string()
    .min(1, "Vui lòng nhập thông số kỹ thuật")
    .refine((GiaTri) => {
      try {
        const KetQua: unknown = JSON.parse(GiaTri);
        return (
          typeof KetQua === "object" &&
          KetQua !== null &&
          !Array.isArray(KetQua)
        );
      } catch {
        return false;
      }
    }, "Thông số kỹ thuật phải là JSON hợp lệ"),
  TrangThai: z.enum(["SAN_SANG", "DANG_SU_DUNG", "BAO_TRI", "HU_HONG"]),
  HinhAnhUrl: z.union([
    z
      .string()
      .trim()
      .url("URL ảnh không hợp lệ")
      .regex(/^https?:\/\//i, "URL ảnh phải dùng giao thức HTTP hoặc HTTPS"),
    z.literal(""),
  ]),
  ViTriKho: z.string().trim().max(200, "Vị trí kho không được quá 200 ký tự"),
  ThoiGianKiemTraSauSuDungPhut: z
    .string()
    .refine(
      (GiaTri) =>
        GiaTri === "" ||
        (Number.isInteger(Number(GiaTri)) &&
          Number(GiaTri) >= 0 &&
          Number(GiaTri) <= 1440),
      "Thời gian kiểm tra phải là số nguyên từ 0 đến 1.440 phút",
    ),
});

export const SchemaStudio = z.object({
  MaPhong: z.string().trim().max(50, "Mã Studio không được quá 50 ký tự"),
  TenPhong: z
    .string()
    .trim()
    .min(2, "Tên Studio phải có ít nhất 2 ký tự")
    .max(200, "Tên Studio không được quá 200 ký tự"),
  DiaDiem: z.string().trim().max(200, "Địa điểm không được quá 200 ký tự"),
  SucChua: z
    .string()
    .refine(
      (GiaTri) =>
        GiaTri === "" ||
        (Number.isInteger(Number(GiaTri)) &&
          Number(GiaTri) > 0 &&
          Number(GiaTri) <= 10000),
      "Sức chứa phải là số nguyên từ 1 đến 10.000",
    ),
  KhaNang: z.string().refine((GiaTri) => {
    if (!GiaTri.trim()) return true;
    try {
      const KetQua: unknown = JSON.parse(GiaTri);
      return (
        typeof KetQua === "object" && KetQua !== null && !Array.isArray(KetQua)
      );
    } catch {
      return false;
    }
  }, "Khả năng Studio phải là JSON hợp lệ"),
  TrangThai: z.enum(["SAN_SANG", "BAO_TRI", "DONG_CUA"]),
});

export const SchemaKho = z.object({
  MaKho: z.string().trim().min(1, "Mã kho là bắt buộc").max(50),
  TenKho: z
    .string()
    .trim()
    .min(2, "Tên kho phải có ít nhất 2 ký tự")
    .max(200, "Tên kho không được quá 200 ký tự"),
  DiaChi: z
    .string()
    .trim()
    .min(2, "Địa chỉ phải có ít nhất 2 ký tự")
    .max(500, "Địa chỉ không được quá 500 ký tự"),
  ViDo: z
    .string()
    .refine(
      (GiaTri) =>
        Number.isFinite(Number(GiaTri)) &&
        Number(GiaTri) >= -90 &&
        Number(GiaTri) <= 90,
      "Vĩ độ phải từ -90 đến 90",
    ),
  KinhDo: z
    .string()
    .refine(
      (GiaTri) =>
        Number.isFinite(Number(GiaTri)) &&
        Number(GiaTri) >= -180 &&
        Number(GiaTri) <= 180,
      "Kinh độ phải từ -180 đến 180",
    ),
  BanKinhXacMinhMet: z
    .string()
    .refine(
      (GiaTri) =>
        Number.isInteger(Number(GiaTri)) &&
        Number(GiaTri) >= 1 &&
        Number(GiaTri) <= 5000,
      "Bán kính xác minh phải từ 1 đến 5.000 m",
    ),
  DangHoatDong: z.boolean(),
});
