import type { NextFunction, Response } from "express";
import type { YeuCauXacThuc } from "../Types/index.js";

// Chỉ danh tính quản trị hệ thống (cấu hình máy chủ) được đi tiếp.
export function YeuCauQuanTriHeThong(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  if (!YeuCau.NguoiDung) {
    return PhanHoi.status(401).json({ ThongBao: "Bạn chưa đăng nhập" });
  }
  if (!YeuCau.NguoiDung.LaQuanTriHeThong) {
    return PhanHoi.status(403).json({
      ThongBao: "Bạn không có quyền thực hiện thao tác này",
    });
  }
  return TiepTheo();
}
