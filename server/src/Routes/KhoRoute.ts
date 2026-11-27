import { NhapExcel, TaiMauExcel } from "../Controllers/NhapExcelController.js";
import { TaiTepExcel } from "../Middlewares/TaiTepExcelMiddleware.js";
import { Router } from "express";
import {
  CapNhatKho,
  CapNhatTrangThaiKho,
  LayChiTietKho,
  LayTongQuanKho,
  LayDanhSachKho,
  TaoKho,
  XoaKho,
} from "../Controllers/KhoController.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";

export const TuyenKho = Router();
TuyenKho.use(XacThucToken, YeuCauDonVi);
TuyenKho.get("/", LayDanhSachKho);
TuyenKho.get("/:id/tong-quan", LayTongQuanKho);
TuyenKho.get("/:id", LayChiTietKho);
TuyenKho.post("/mau-excel", TaiMauExcel("Kho"));
TuyenKho.post("/nhap-excel", TaiTepExcel, NhapExcel("Kho"));
TuyenKho.post("/", TaoKho);
TuyenKho.put("/:id", CapNhatKho);
TuyenKho.patch("/:id/trang-thai", CapNhatTrangThaiKho);
TuyenKho.delete("/:id", XoaKho);
