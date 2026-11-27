import type { NextFunction, Response } from "express";
import type { YeuCauXacThuc } from "../Types/index.js";
import { KiemTraQuyenApi } from "./QuyenApiMiddleware.js";

export function YeuCauDonVi(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  if (!YeuCau.NguoiDung) {
    return PhanHoi.status(401).json({ ThongBao: "Bạn chưa đăng nhập" });
  }
  if (YeuCau.NguoiDung.LaQuanTriHeThong || !YeuCau.NguoiDung.DonViId) {
    return PhanHoi.status(403).json({
      ThongBao: "Tài khoản quản trị hệ thống không truy cập dữ liệu đơn vị",
    });
  }
  return KiemTraQuyenApi(YeuCau, PhanHoi, TiepTheo);
}

export function LayDonViId(YeuCau: YeuCauXacThuc): string {
  const DonViId = YeuCau.NguoiDung?.DonViId;
  if (!DonViId) {
    throw new Error("Thiếu phạm vi đơn vị đã xác thực");
  }
  return DonViId;
}
