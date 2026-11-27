import { ThongTinBoSung } from "../Controllers/ThongTinBoSungController.js";
import { NhapExcel, TaiMauExcel } from "../Controllers/NhapExcelController.js";
import { TaiTepExcel } from "../Middlewares/TaiTepExcelMiddleware.js";
import { Router } from "express";
import {
  CapNhatPhongStudio,
  LayChiTietPhongStudio,
  LayDanhSachPhongStudio,
  TaoPhongStudio,
  XoaPhongStudio,
} from "../Controllers/PhongStudioController.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";
export const TuyenPhongStudio = Router();
TuyenPhongStudio.use(XacThucToken, YeuCauDonVi);
TuyenPhongStudio.get("/:id/bo-sung", ThongTinBoSung);
TuyenPhongStudio.put("/:id/bo-sung", ThongTinBoSung);
TuyenPhongStudio.get("/", LayDanhSachPhongStudio);
TuyenPhongStudio.get("/:id", LayChiTietPhongStudio);
TuyenPhongStudio.post("/mau-excel", TaiMauExcel("Studio"));
TuyenPhongStudio.post("/nhap-excel", TaiTepExcel, NhapExcel("Studio"));
TuyenPhongStudio.post("/", TaoPhongStudio);
TuyenPhongStudio.put("/:id", CapNhatPhongStudio);
TuyenPhongStudio.delete("/:id", XoaPhongStudio);
