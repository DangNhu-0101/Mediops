import { NhapExcel, TaiMauExcel } from "../Controllers/NhapExcelController.js";
import { TaiTepExcel } from "../Middlewares/TaiTepExcelMiddleware.js";
import { Router } from "express";
import {
  CapNhatCaQuay,
  ApDungGiaiQuyetXungDotCaQuay,
  GoiYGiaiQuyetXungDotCaQuay,
  GoiYThietBiThayThe,
  KiemTraXungDotCaQuay,
  LayChiTietCaQuay,
  LayDanhSachCaQuay,
  TaoCaQuay,
  XoaCaQuay,
} from "../Controllers/CaQuayController.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";

export const TuyenCaQuay = Router();
TuyenCaQuay.use(XacThucToken, YeuCauDonVi);
TuyenCaQuay.get("/", LayDanhSachCaQuay);
TuyenCaQuay.get("/goi-y-thay-the", GoiYThietBiThayThe);
TuyenCaQuay.post("/kiem-tra-xung-dot", KiemTraXungDotCaQuay);
TuyenCaQuay.post("/:id/goi-y-giai-quyet-xung-dot", GoiYGiaiQuyetXungDotCaQuay);
TuyenCaQuay.post("/:id/ap-dung-giai-phap", ApDungGiaiQuyetXungDotCaQuay);
TuyenCaQuay.get("/:id", LayChiTietCaQuay);
TuyenCaQuay.post("/mau-excel", TaiMauExcel("CaQuay"));
TuyenCaQuay.post("/nhap-excel", TaiTepExcel, NhapExcel("CaQuay"));
TuyenCaQuay.post("/", TaoCaQuay);
TuyenCaQuay.put("/:id", CapNhatCaQuay);
TuyenCaQuay.delete("/:id", XoaCaQuay);
