import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import { PhatCapNhatLich } from "../Services/SocketService.js";
import {
  LoiVanHanhKho,
  LoiXungDotDuLieu,
  LoiDuLieuKhongHopLe,
} from "../Services/LoiNghiepVuService.js";
import {
  ThemAnhSuCoVanHanh,
  ApDungThayThietBiSuCo,
  BaoSuCoVanHanh,
  CapNhatSuCoVanHanh,
  LayDanhSachSuCoVanHanh,
  LayNguCanhBaoSuCo,
  LaySuCoVanHanh,
  PhanTichAnhHuongSuCo,
  XacNhanBanGiaoSuCo,
  type PhamViSuCo,
} from "../Services/SuCoVanHanhService.js";
import { BaoSuCoVanHanhSchema } from "../Services/HopDongSuCoVanHanh.js";

const NgayGio = z.string().datetime({ offset: true });
const IdSchema = z.string().uuid();
const XuLySchema = z
  .object({
    TrangThai: z.enum([
      "MOI_BAO",
      "DA_XAC_MINH",
      "DANG_XU_LY",
      "DA_KHOI_PHUC",
      "DA_HUY",
    ]),
    NoiDung: z
      .string()
      .trim()
      .min(3, "Cần ghi nội dung xác nhận hoặc lý do")
      .max(2000),
    KetThucAnhHuong: NgayGio.nullable(),
    DuKienPhucHoi: NgayGio.nullable(),
  })
  .strict();
const ApDungSchema = z
  .object({
    HieuLuc: NgayGio,
    PhuongAnId: z.string().min(1),
    MaPhienBan: z.string().min(1),
    NguoiPhuTrachId: IdSchema,
    XacNhanGiaoNhan: z.literal(true),
  })
  .strict();
export function TaoXuLySuCo(
  Loai:
    | "danh-sach"
    | "ngu-canh"
    | "bao"
    | "chi-tiet"
    | "cap-nhat"
    | "phan-tich"
    | "ap-dung"
    | "ban-giao"
    | "anh",
) {
  return async (
    YeuCau: YeuCauXacThuc,
    PhanHoi: Response,
    TiepTheo: NextFunction,
  ) => {
    try {
      const PhamVi: PhamViSuCo = {
        ...YeuCau.NguoiDung!,
        DonViId: LayDonViId(YeuCau),
      };
      const Id =
        Loai === "bao" || Loai === "danh-sach" || Loai === "ngu-canh"
          ? ""
          : IdSchema.parse(YeuCau.params.id);
      let KetQua: unknown;
      if (Loai === "danh-sach")
        KetQua = await LayDanhSachSuCoVanHanh(
          PhamVi,
          z
            .object({
              CaQuayId: IdSchema.optional(),
              ThietBiId: IdSchema.optional(),
              DuAnId: IdSchema.optional(),
              Trang: z.coerce.number().int().min(1).max(10000).default(1),
            })
            .strict()
            .parse(YeuCau.query),
        );
      if (Loai === "ngu-canh") {
        const DuLieu = z
          .object({
            CaQuayId: IdSchema.optional(),
            ThietBiId: IdSchema.optional(),
          })
          .strict()
          .parse(YeuCau.query);
        KetQua = await LayNguCanhBaoSuCo(
          PhamVi,
          DuLieu.CaQuayId,
          DuLieu.ThietBiId,
        );
      }
      if (Loai === "bao")
        KetQua = await BaoSuCoVanHanh(
          BaoSuCoVanHanhSchema.parse(YeuCau.body),
          PhamVi,
        );
      if (Loai === "anh")
        KetQua = await ThemAnhSuCoVanHanh(
          Id,
          IdSchema.parse(YeuCau.body.MaLanTai),
          Array.isArray(YeuCau.files) ? YeuCau.files : [],
          PhamVi,
        );
      if (Loai === "chi-tiet") KetQua = await LaySuCoVanHanh(Id, PhamVi);
      if (Loai === "cap-nhat")
        KetQua = await CapNhatSuCoVanHanh(
          Id,
          XuLySchema.parse(YeuCau.body),
          PhamVi,
        );
      if (Loai === "phan-tich") {
        const DuLieu = z
          .object({ HieuLuc: NgayGio })
          .strict()
          .parse(YeuCau.body);
        KetQua = await PhanTichAnhHuongSuCo(
          Id,
          new Date(DuLieu.HieuLuc),
          PhamVi,
        );
      }
      if (Loai === "ap-dung")
        KetQua = await ApDungThayThietBiSuCo(
          Id,
          ApDungSchema.parse(YeuCau.body),
          PhamVi,
        );
      if (Loai === "ban-giao") {
        const DuLieu = z
          .object({
            LoId: IdSchema,
            NoiDung: z.string().trim().min(3).max(2000),
          })
          .strict()
          .parse(YeuCau.body);
        KetQua = await XacNhanBanGiaoSuCo(
          Id,
          DuLieu.LoId,
          DuLieu.NoiDung,
          PhamVi,
        );
      }
      if (["bao", "cap-nhat", "ap-dung", "ban-giao", "anh"].includes(Loai)) {
        // Chỉ gửi tín hiệu tải lại; không phát mô tả và danh tính nhạy cảm.
        const SuCo =
          Loai === "bao"
            ? (KetQua as { Id: string; CaQuayId: string | null })
            : await LaySuCoVanHanh(Id, PhamVi);
        await PhatCapNhatLich(
          "su_co:cap_nhat",
          { CaQuayId: SuCo.CaQuayId },
          SuCo.CaQuayId ?? undefined,
          PhamVi.DonViId,
        );
        await PhatCapNhatLich(
          "bao_tri:cap_nhat",
          { CaQuayId: SuCo.CaQuayId },
          SuCo.CaQuayId ?? undefined,
          PhamVi.DonViId,
        );
        if (SuCo.CaQuayId)
          await PhatCapNhatLich(
            "ca_quay:cap_nhat",
            { CaQuayId: SuCo.CaQuayId },
            SuCo.CaQuayId,
            PhamVi.DonViId,
          );
      }
      return PhanHoi.json(KetQua);
    } catch (Loi) {
      if (Loi instanceof z.ZodError)
        return PhanHoi.status(400).json({
          ThongBao:
            Loi.issues[0]?.message &&
            /[^\u0000-\u007f]/.test(Loi.issues[0].message)
              ? Loi.issues[0].message
              : "Dữ liệu không hợp lệ. Kiểm tra trường bắt buộc, lựa chọn và ngày giờ.",
        });
      if (Loi instanceof LoiVanHanhKho)
        return PhanHoi.status(Loi.MaTrangThai).json({ ThongBao: Loi.message });
      if (Loi instanceof LoiXungDotDuLieu || Loi instanceof LoiDuLieuKhongHopLe)
        return PhanHoi.status(409).json({ ThongBao: Loi.message });
      return TiepTheo(Loi);
    }
  };
}
