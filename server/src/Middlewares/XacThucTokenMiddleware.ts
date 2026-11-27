import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import type { DuLieuToken, YeuCauXacThuc } from "../Types/index.js";
import {
  KiemTraPhien,
  LayThongTinNguoiDung,
} from "../Services/XacThucService.js";

export async function XacThucToken(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  const [LoaiToken, Token] = YeuCau.headers.authorization?.split(" ") ?? [];
  if (LoaiToken?.toLowerCase() !== "bearer" || !Token) {
    return PhanHoi.status(401).json({ ThongBao: "Chưa cung cấp mã xác thực" });
  }

  const KhoaBiMat = process.env.JWT_SECRET;
  if (!KhoaBiMat) {
    return TiepTheo(new Error("Máy chủ chưa cấu hình khóa ký JWT"));
  }

  let DuLieuToken: DuLieuToken;
  try {
    const DuLieu = jwt.verify(Token, KhoaBiMat);
    if (typeof DuLieu === "string" || typeof DuLieu.nguoiDungId !== "string") {
      throw new Error("Token không có định dạng hợp lệ");
    }
    DuLieuToken = {
      nguoiDungId: DuLieu.nguoiDungId,
      PhienBan: DuLieu.PhienBan,
    };
  } catch {
    return PhanHoi.status(401).json({
      ThongBao: "Mã xác thực không hợp lệ hoặc đã hết hạn",
    });
  }

  try {
    if (!(await KiemTraPhien(DuLieuToken.nguoiDungId, DuLieuToken.PhienBan))) {
      return PhanHoi.status(401).json({
        ThongBao: "Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.",
      });
    }
    const NguoiDung = await LayThongTinNguoiDung(DuLieuToken.nguoiDungId);
    if (!NguoiDung) {
      return PhanHoi.status(401).json({
        ThongBao: "Tài khoản không còn tồn tại",
      });
    }
    if (
      !NguoiDung.LaQuanTriHeThong &&
      (!NguoiDung.DonViId || !NguoiDung.DonVi?.DangHoatDong)
    ) {
      return PhanHoi.status(403).json({
        ThongBao: NguoiDung.DonViId
          ? "Đơn vị đã bị vô hiệu hóa. Vui lòng liên hệ quản trị hệ thống."
          : "Tài khoản chưa được liên kết với đơn vị.",
      });
    }
    YeuCau.NguoiDung = {
      nguoiDungId: NguoiDung.Id,
      LaQuanTriHeThong: NguoiDung.LaQuanTriHeThong,
      DonViId: NguoiDung.DonViId,
      QuanTriDonVi: NguoiDung.QuanTriDonVi,
      Quyen: NguoiDung.Quyen,
    };
    return TiepTheo();
  } catch (Loi) {
    return TiepTheo(Loi);
  }
}
