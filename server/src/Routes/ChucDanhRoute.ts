import { NhapExcel, TaiMauExcel } from "../Controllers/NhapExcelController.js";
import { TaiTepExcel } from "../Middlewares/TaiTepExcelMiddleware.js";
import { Router } from "express";
import {
  CapNhatChucDanh,
  LayDanhSachChucDanh,
  TaoChucDanh,
  XoaChucDanh,
} from "../Controllers/ChucDanhController.js";
import type { NextFunction, Response } from "express";
import type { YeuCauXacThuc } from "../Types/index.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";

// Quản trị hệ thống quản lý chức danh dùng chung; người dùng đơn vị theo quyền đơn vị.
function PhamViChucDanh(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  if (YeuCau.NguoiDung?.LaQuanTriHeThong) return TiepTheo();
  return YeuCauDonVi(YeuCau, PhanHoi, TiepTheo);
}

export const TuyenChucDanh = Router();
TuyenChucDanh.use(XacThucToken, PhamViChucDanh);
TuyenChucDanh.get("/", LayDanhSachChucDanh);
TuyenChucDanh.post("/mau-excel", TaiMauExcel("ChucDanh"));
TuyenChucDanh.post("/nhap-excel", TaiTepExcel, NhapExcel("ChucDanh"));
TuyenChucDanh.post("/", TaoChucDanh);
TuyenChucDanh.put("/:id", CapNhatChucDanh);
TuyenChucDanh.delete("/:id", XoaChucDanh);
