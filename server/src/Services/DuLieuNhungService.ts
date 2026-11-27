import { z } from "zod";
import { LoaiTaiNguyen, type Prisma } from "@prisma/client";
import { LoiDuLieuKhongHopLe } from "./LoiNghiepVuService.js";

const Ma = z
  .string()
  .trim()
  .min(1, "Mã không được để trống")
  .max(100, "Mã không được quá 100 ký tự");
const DinhDanh = z.string().uuid("Mã định danh không hợp lệ");
const NgayGio = z
  .string()
  .datetime({ offset: true, message: "Ngày giờ không hợp lệ" });
function GiaTriTieuChiHopLe(GiaTri: unknown, DoSau = 0): boolean {
  if (DoSau > 5) return false;
  if (typeof GiaTri === "string")
    return GiaTri.trim().length > 0 && GiaTri.length <= 2000;
  if (typeof GiaTri === "number") return Number.isFinite(GiaTri);
  if (typeof GiaTri === "boolean") return true;
  if (Array.isArray(GiaTri))
    return (
      GiaTri.length > 0 &&
      GiaTri.length <= 100 &&
      GiaTri.every((Muc) => GiaTriTieuChiHopLe(Muc, DoSau + 1))
    );
  if (typeof GiaTri === "object" && GiaTri !== null)
    return (
      Object.entries(GiaTri).length <= 50 &&
      Object.entries(GiaTri).every(
        ([Khoa, Muc]) =>
          Khoa.trim().length > 0 && GiaTriTieuChiHopLe(Muc, DoSau + 1),
      )
    );
  return false;
}
const TieuChiSchema = z
  .record(z.unknown())
  .refine(
    GiaTriTieuChiHopLe,
    "Vui lòng nhập đầy đủ giá trị hợp lệ cho các tiêu chí đã chọn",
  )
  .nullable();
export const KhoangBanSchema = z
  .object({
    Id: DinhDanh,
    BatDau: NgayGio,
    KetThuc: NgayGio,
    LyDo: z
      .string()
      .trim()
      .max(500, "Lý do không được quá 500 ký tự")
      .nullable()
      .default(null),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ")
  .refine(
    (Muc) => new Date(Muc.KetThuc) > new Date(Muc.BatDau),
    "Thời gian kết thúc phải sau thời gian bắt đầu",
  );
// Trình độ 1-5 của nhân sự theo chức danh đang giữ.
export const TrinhDoSchema = z
  .number()
  .int("Giá trị phải là số nguyên")
  .min(1, "Trình độ phải từ 1 đến 5")
  .max(5, "Trình độ phải từ 1 đến 5")
  .nullable();
export const YeuCauTaiNguyenSchema = z
  .object({
    Id: DinhDanh,
    MaYeuCau: Ma,
    LoaiTaiNguyen: z.nativeEnum(LoaiTaiNguyen),
    SoLuong: z
      .number()
      .int("Giá trị phải là số nguyên")
      .min(1, "Số lượng phải lớn hơn 0")
      .max(100, "Số lượng tối đa là 100"),
    BatBuoc: z.boolean(),
    ChoPhepThayThe: z.boolean(),
    TrongSo: z.number().int("Giá trị phải là số nguyên").min(0).max(100),
    DanhMucThietBiId: DinhDanh.nullable(),
    ThietBiUuTienId: DinhDanh.nullable(),
    ChucDanhId: DinhDanh.nullable(),
    ThongSoToiThieu: TieuChiSchema,
    ThongSoUuTien: TieuChiSchema,
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ")
  .refine(
    (Muc) => Muc.LoaiTaiNguyen !== "STUDIO" || Muc.SoLuong === 1,
    "Một ca quay chỉ phân công được một studio",
  )
  .refine(
    (Muc) =>
      Muc.LoaiTaiNguyen !== "NHAN_SU" ||
      Muc.ChucDanhId ||
      (!(Muc.ThongSoToiThieu && "trinhDo" in Muc.ThongSoToiThieu) &&
        !(Muc.ThongSoUuTien && "trinhDo" in Muc.ThongSoUuTien)),
    "Vui lòng chọn chức danh trước khi yêu cầu trình độ",
  )
  .refine(
    (Muc) =>
      Muc.LoaiTaiNguyen === "THIET_BI" ||
      (!Muc.DanhMucThietBiId && !Muc.ThietBiUuTienId),
    "Chỉ yêu cầu thiết bị được chọn danh mục và thiết bị ưu tiên",
  )
  .refine(
    (Muc) => Muc.LoaiTaiNguyen === "NHAN_SU" || !Muc.ChucDanhId,
    "Chỉ yêu cầu nhân sự được chọn chức danh",
  )
  .refine(
    (Muc) =>
      Muc.LoaiTaiNguyen !== "THIET_BI" ||
      Muc.ChoPhepThayThe ||
      Boolean(Muc.ThietBiUuTienId),
    "Vui lòng chọn thiết bị khi không cho phép thay thế",
  );

function KhongTrung<S extends z.ZodTypeAny>(
  Schema: S,
  LayKhoa: (Muc: z.output<S>) => string,
) {
  return z
    .array(Schema)
    .max(200, "Danh sách không được quá 200 mục")
    .refine(
      (DanhSach) => new Set(DanhSach.map(LayKhoa)).size === DanhSach.length,
      "Danh sách có mục bị trùng",
    );
}
export const CacKhoangBanSchema = KhongTrung(KhoangBanSchema, (Muc) => Muc.Id);
export const CacYeuCauSchema = KhongTrung(
  YeuCauTaiNguyenSchema,
  (Muc) => Muc.MaYeuCau,
).refine(
  (CacMuc) => new Set(CacMuc.map((Muc) => Muc.Id)).size === CacMuc.length,
  "Yêu cầu có mã định danh bị trùng",
);
const AnhSchema = z.object({
  Id: DinhDanh,
  SecureUrl: z.string().url(),
  PublicId: z.string().nullable(),
  NgayTao: NgayGio,
});
export type KhoangBan = z.infer<typeof KhoangBanSchema>;
export type YeuCauTaiNguyen = z.infer<typeof YeuCauTaiNguyenSchema>;
export type AnhSuCo = z.infer<typeof AnhSchema>;

function DocDanhSach<S extends z.ZodTypeAny>(
  Schema: S,
  GiaTri: unknown,
  Ten: string,
): z.output<S> {
  const KetQua = Schema.safeParse(GiaTri);
  if (!KetQua.success)
    throw new LoiDuLieuKhongHopLe(
      `Dữ liệu ${Ten} không hợp lệ. Vui lòng kiểm tra lại.`,
    );
  return KetQua.data;
}
export const DocKhoangBan = (GiaTri: unknown) =>
  DocDanhSach(CacKhoangBanSchema, GiaTri, "khoảng bận");
export const DocYeuCau = (GiaTri: unknown) =>
  DocDanhSach(CacYeuCauSchema, GiaTri, "yêu cầu tài nguyên");
export const DocAnhSuCo = (GiaTri: unknown) =>
  DocDanhSach(z.array(AnhSchema), GiaTri, "ảnh sự cố");
export function ThanhJson(GiaTri: unknown): Prisma.InputJsonValue {
  // Chuyển Date thành ISO và loại undefined trước khi ghi JSONB.
  return JSON.parse(JSON.stringify(GiaTri)) as Prisma.InputJsonValue;
}
