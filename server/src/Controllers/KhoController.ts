import { CoSoDuLieu } from "../Config/Database.js";
import { BanDoLoiThongKe } from "../Services/KyThongKeService.js";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import {
  CapNhatKho as CapNhatKhoTrongHeThong,
  CapNhatTrangThaiKho as CapNhatTrangThaiKhoTrongHeThong,
  LayChiTietKho as LayChiTietKhoTrongHeThong,
  LayDanhSachKhoQuanLy,
  TaoKho as TaoKhoTrongHeThong,
  XoaKho as XoaKhoTrongHeThong,
} from "../Services/KhoService.js";
import {
  LoiKhongTimThay,
  LoiXungDotDuLieu,
} from "../Services/LoiNghiepVuService.js";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayTongQuanKho as LayTongQuanKhoTrongHeThong } from "../Services/TongQuanKhoService.js";
import { SchemaLocKho } from "../Services/ThongKeKhoService.js";

export const DuLieuKhoSchema = z
  .object({
    MaKho: z.string().trim().min(1, "Mã kho là bắt buộc").max(50),
    TenKho: z
      .string()
      .trim()
      .min(2, "Tên kho phải có ít nhất 2 ký tự")
      .max(200),
    DiaChi: z
      .string()
      .trim()
      .min(2, "Địa chỉ phải có ít nhất 2 ký tự")
      .max(500),
    ViDo: z.coerce
      .number()
      .min(-90, "Vĩ độ phải từ -90 đến 90")
      .max(90, "Vĩ độ phải từ -90 đến 90"),
    KinhDo: z.coerce
      .number()
      .min(-180, "Kinh độ phải từ -180 đến 180")
      .max(180, "Kinh độ phải từ -180 đến 180"),
    BanKinhXacMinhMet: z.coerce
      .number()
      .int()
      .min(1, "Bán kính xác minh phải lớn hơn 0 m")
      .max(5000, "Bán kính xác minh không được vượt quá 5.000 m"),
    DangHoatDong: z.boolean(),
  })
  .strict("Dữ liệu chứa trường không được hỗ trợ");

function GioiHanChiSoKho<
  T extends {
    _count: {
      DanhSachThietBi: number;
      DanhSachGiaoDich: number;
      DanhSachNhatKyNguon: number;
      DanhSachSuCo: number;
    };
  },
>(Kho: T, YeuCau: YeuCauXacThuc) {
  const Quyen = YeuCau.NguoiDung?.Quyen ?? [];
  return {
    ...Kho,
    _count: {
      DanhSachThietBi: Quyen.includes("ThietBi.Xem")
        ? Kho._count.DanhSachThietBi
        : null,
      DanhSachGiaoDich: Quyen.includes("NhatKy.Xem")
        ? Kho._count.DanhSachGiaoDich
        : null,
      DanhSachNhatKyNguon: Quyen.includes("NhatKy.Xem")
        ? Kho._count.DanhSachNhatKyNguon
        : null,
      DanhSachSuCo: Quyen.includes("SuCo.Xem") ? Kho._count.DanhSachSuCo : null,
    },
  };
}

function XuLyLoi(PhanHoi: Response, TiepTheo: NextFunction, Loi: unknown) {
  if (Loi instanceof z.ZodError)
    return PhanHoi.status(400).json({
      ThongBao: Loi.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    });
  if (Loi instanceof LoiKhongTimThay)
    return PhanHoi.status(404).json({ ThongBao: Loi.message });
  if (Loi instanceof LoiXungDotDuLieu)
    return PhanHoi.status(409).json({ ThongBao: Loi.message });
  return TiepTheo(Loi);
}

export async function LayDanhSachKho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const TrangThai = YeuCau.query.DangHoatDong;
    const DangHoatDong =
      TrangThai === "true" ? true : TrangThai === "false" ? false : undefined;
    const Loc = SchemaLocKho.parse(YeuCau.query, { errorMap: BanDoLoiThongKe });
    const DonViId = LayDonViId(YeuCau);
    const DanhSach = (
      await LayDanhSachKhoQuanLy({
        DonViId,
        TimKiem: Loc.TimKiem,
        DangHoatDong,
        ...(YeuCau.query.Trang
          ? { Trang: Loc.Trang, KichThuoc: Loc.KichThuoc }
          : {}),
      })
    ).map((Kho) => GioiHanChiSoKho(Kho, YeuCau));
    if (!YeuCau.query.Trang) return PhanHoi.json(DanhSach);
    const TongSo = await CoSoDuLieu.kho.count({
      where: {
        DonViId,
        ...(DangHoatDong === undefined ? {} : { DangHoatDong }),
        ...(Loc.TimKiem
          ? {
              OR: ["MaKho", "TenKho", "DiaChi"].map((Truong) => ({
                [Truong]: { contains: Loc.TimKiem, mode: "insensitive" },
              })),
            }
          : {}),
      },
    });
    return PhanHoi.json({
      DanhSach,
      TongSo,
      Trang: Loc.Trang,
      KichThuoc: Loc.KichThuoc,
    });
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function LayChiTietKho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      GioiHanChiSoKho(
        await LayChiTietKhoTrongHeThong(
          String(YeuCau.params.id),
          LayDonViId(YeuCau),
        ),
        YeuCau,
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function LayTongQuanKho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      await LayTongQuanKhoTrongHeThong(
        String(YeuCau.params.id),
        LayDonViId(YeuCau),
        SchemaLocKho.parse(YeuCau.query, { errorMap: BanDoLoiThongKe }),
        {
          NguoiDungId: YeuCau.NguoiDung!.nguoiDungId,
          Quyen: YeuCau.NguoiDung!.Quyen ?? [],
        },
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function TaoKho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.status(201).json(
      GioiHanChiSoKho(
        await TaoKhoTrongHeThong(
          DuLieuKhoSchema.parse(YeuCau.body),
          LayDonViId(YeuCau),
        ),
        YeuCau,
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function CapNhatKho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    return PhanHoi.json(
      GioiHanChiSoKho(
        await CapNhatKhoTrongHeThong(
          String(YeuCau.params.id),
          DuLieuKhoSchema.parse(YeuCau.body),
          LayDonViId(YeuCau),
        ),
        YeuCau,
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function CapNhatTrangThaiKho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    const { DangHoatDong: DangHoatDong } = z
      .object({ DangHoatDong: z.boolean() })
      .strict("Dữ liệu chứa trường không được hỗ trợ")
      .parse(YeuCau.body);
    return PhanHoi.json(
      GioiHanChiSoKho(
        await CapNhatTrangThaiKhoTrongHeThong(
          String(YeuCau.params.id),
          DangHoatDong,
          LayDonViId(YeuCau),
        ),
        YeuCau,
      ),
    );
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}

export async function XoaKho(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  try {
    await XoaKhoTrongHeThong(String(YeuCau.params.id), LayDonViId(YeuCau));
    return PhanHoi.status(204).send();
  } catch (Loi) {
    return XuLyLoi(PhanHoi, TiepTheo, Loi);
  }
}
