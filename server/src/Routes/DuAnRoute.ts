import { NhapExcel, TaiMauExcel } from "../Controllers/NhapExcelController.js";
import { TaiTepExcel } from "../Middlewares/TaiTepExcelMiddleware.js";
import { Router } from "express";
import {
  CapNhatDuAn,
  LayChiTietDuAn,
  LayDanhSachDuAn,
  TongQuanDuAn,
  TaoDuAn,
  XoaDuAn,
} from "../Controllers/DuAnController.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";

export const TuyenDuAn = Router();
TuyenDuAn.use(XacThucToken, YeuCauDonVi);
TuyenDuAn.get("/", LayDanhSachDuAn);
TuyenDuAn.get("/tong-quan", TongQuanDuAn);
TuyenDuAn.get("/:id", LayChiTietDuAn);
TuyenDuAn.post("/mau-excel", TaiMauExcel("DuAn"));
TuyenDuAn.post("/nhap-excel", TaiTepExcel, NhapExcel("DuAn"));
TuyenDuAn.post("/", TaoDuAn);
TuyenDuAn.put("/:id", CapNhatDuAn);
TuyenDuAn.delete("/:id", XoaDuAn);
