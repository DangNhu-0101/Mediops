import { NhapExcel, TaiMauExcel } from "../Controllers/NhapExcelController.js";
import { TaiTepExcel } from "../Middlewares/TaiTepExcelMiddleware.js";
import { Router } from "express";
import {
  CapNhatNhomQuyen,
  LayDanhSachNhomQuyen,
  TaoNhomQuyen,
  XoaNhomQuyen,
} from "../Controllers/NhomQuyenController.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";

export const TuyenNhomQuyen = Router();
TuyenNhomQuyen.use(XacThucToken, YeuCauDonVi);
TuyenNhomQuyen.get("/", LayDanhSachNhomQuyen);
TuyenNhomQuyen.post("/mau-excel", TaiMauExcel("NhomQuyen"));
TuyenNhomQuyen.post("/nhap-excel", TaiTepExcel, NhapExcel("NhomQuyen"));
TuyenNhomQuyen.post("/", TaoNhomQuyen);
TuyenNhomQuyen.put("/:id", CapNhatNhomQuyen);
TuyenNhomQuyen.delete("/:id", XoaNhomQuyen);
