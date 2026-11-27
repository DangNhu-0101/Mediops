import { z } from "zod";

export const TinhHuongSuCo = {
  THIET_BI: {
    HONG: "Hỏng khi sử dụng",
    THAT_LAC: "Thất lạc",
    THIEU_PHU_KIEN: "Thiếu phụ kiện",
    KHONG_TUONG_THICH: "Không tương thích",
  },
  GIAO_NHAN: {
    TRA_TRE: "Trả trễ",
    CHUA_GIAO: "Chưa giao tới",
    KEO_DAI_SU_DUNG: "Kéo dài sử dụng",
  },
  NHAN_SU: {
    KHONG_DEN: "Không đến",
    DEN_TRE: "Đến trễ",
    XIN_RUT: "Xin rút giữa ca",
    KHONG_THE_TIEP_TUC: "Không thể tiếp tục công việc",
  },
  STUDIO: {
    KHONG_VAO_DUOC: "Không vào được",
    MAT_DIEN: "Mất điện",
    HONG_HA_TANG: "Hỏng hạ tầng",
    KHONG_SU_DUNG_DUOC: "Địa điểm không dùng được",
  },
  DIEU_KIEN_QUAY: {
    THOI_TIET: "Thời tiết",
    VAN_CHUYEN: "Vận chuyển",
    KEO_DAI_CANH: "Kéo dài cảnh quay",
    KHAC: "Nguyên nhân khác",
  },
} as const;
export const NhanNhomSuCo = {
  THIET_BI: "Thiết bị / đạo cụ",
  GIAO_NHAN: "Giao nhận",
  NHAN_SU: "Nhân sự",
  STUDIO: "Studio / địa điểm",
  DIEU_KIEN_QUAY: "Điều kiện quay",
} as const;
export const NhanMucAnhHuong = {
  VAN_QUAY_DUOC: "Vẫn quay được",
  ANH_HUONG_MOT_PHAN: "Ảnh hưởng một phần",
  GIAN_DOAN_CA: "Gián đoạn ca",
  DUNG_AN_TOAN: "Cần dừng để xử lý an toàn",
} as const;
export const NhanTrangThaiSuCo = {
  MOI_BAO: "Mới báo",
  DA_XAC_MINH: "Đã xác minh",
  DANG_XU_LY: "Đang xử lý",
  DA_KHOI_PHUC: "Đã khôi phục",
  DA_HUY: "Báo nhầm / Đã hủy",
} as const;
const NgayGio = z
  .string()
  .datetime({ offset: true, message: "Thời điểm không hợp lệ" });
export const TaiNguyenSuCoSchema = z
  .object({
    Loai: z.enum(["THIET_BI", "NHAN_SU", "STUDIO"]),
    Id: z.string().uuid("Tài nguyên không hợp lệ"),
    ThanhPhan: z.string().trim().max(200).optional(),
  })
  .strict();
export const BaoSuCoVanHanhSchema = z
  .object({
    MaYeuCau: z.string().uuid("Mã lần báo không hợp lệ"),
    CaQuayId: z.string().uuid().optional(),
    ThietBiId: z.string().uuid().optional(),
    Nhom: z.enum([
      "THIET_BI",
      "GIAO_NHAN",
      "NHAN_SU",
      "STUDIO",
      "DIEU_KIEN_QUAY",
    ]),
    NguyenNhan: z.string().min(1),
    MucAnhHuong: z.enum([
      "VAN_QUAY_DUOC",
      "ANH_HUONG_MOT_PHAN",
      "GIAN_DOAN_CA",
      "DUNG_AN_TOAN",
    ]),
    MoTa: z.string().trim().min(3, "Mô tả ít nhất 3 ký tự").max(2000),
    TaiNguyen: z.array(TaiNguyenSuCoSchema).max(200),
    ThoiDiemXayRa: NgayGio,
    DuKienPhucHoi: NgayGio.nullable(),
    KetThucAnhHuong: NgayGio.nullable(),
    MucDoThietBi: z.enum(["NHE", "TRUNG_BINH", "NGHIEM_TRONG"]).optional(),
  })
  .strict()
  .superRefine((DuLieu, NguCanh) => {
    const CacNguyenNhan = TinhHuongSuCo[DuLieu.Nhom];
    if (!(DuLieu.NguyenNhan in CacNguyenNhan))
      NguCanh.addIssue({
        code: "custom",
        message: "Nguyên nhân không thuộc nhóm đã chọn",
      });
    if (!DuLieu.CaQuayId && !DuLieu.ThietBiId)
      NguCanh.addIssue({
        code: "custom",
        message: "Cần chọn ca quay hoặc thiết bị liên quan",
      });
    if (
      DuLieu.ThietBiId &&
      !DuLieu.TaiNguyen.some(
        (Muc) => Muc.Loai === "THIET_BI" && Muc.Id === DuLieu.ThietBiId,
      )
    )
      NguCanh.addIssue({
        code: "custom",
        message: "Cần chọn thiết bị trong ngữ cảnh báo",
      });
    if (
      DuLieu.Nhom !== "DIEU_KIEN_QUAY" &&
      DuLieu.Nhom !== "STUDIO" &&
      !DuLieu.TaiNguyen.length
    )
      NguCanh.addIssue({
        code: "custom",
        message: "Chọn tài nguyên hoặc vị trí bị ảnh hưởng",
      });
    if (
      DuLieu.NguyenNhan === "HONG" &&
      (!DuLieu.MucDoThietBi ||
        !DuLieu.TaiNguyen.some((Muc) => Muc.Loai === "THIET_BI"))
    )
      NguCanh.addIssue({
        code: "custom",
        message: "Chọn thiết bị hỏng và mức lỗi thiết bị",
      });
    for (const Moc of [DuLieu.DuKienPhucHoi, DuLieu.KetThucAnhHuong]) {
      if (Moc && new Date(Moc) <= new Date(DuLieu.ThoiDiemXayRa))
        NguCanh.addIssue({
          code: "custom",
          message: "Mốc kết thúc phải sau thời điểm xảy ra",
        });
    }
    if (
      new Set(DuLieu.TaiNguyen.map((Muc) => `${Muc.Loai}:${Muc.Id}`)).size !==
      DuLieu.TaiNguyen.length
    )
      NguCanh.addIssue({ code: "custom", message: "Tài nguyên bị lặp" });
  });
export type DuLieuBaoSuCoVanHanh = z.infer<typeof BaoSuCoVanHanhSchema>;
export function DocTaiNguyenSuCo(DuLieu: unknown) {
  return z.array(TaiNguyenSuCoSchema.extend({ Ten: z.string() })).parse(DuLieu);
}
