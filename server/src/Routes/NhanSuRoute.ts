import { ThongTinBoSung } from "../Controllers/ThongTinBoSungController.js";
import { NhapExcel, TaiMauExcel } from "../Controllers/NhapExcelController.js";
import { TaiTepExcel } from "../Middlewares/TaiTepExcelMiddleware.js";
import {
  LayChucDanhPhanCong,
  DatLaiMatKhau,
  LayNhanSuPhanCong,
} from "../Controllers/HoSoController.js";
import { Router } from "express";
import {
  CapNhatNhanSu,
  LayChiTietNhanSu,
  LayDanhSachNhanSu,
  TaoNhanSu,
  XoaNhanSu,
} from "../Controllers/NhanSuController.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";
export const TuyenNhanSu = Router();
TuyenNhanSu.use(XacThucToken, YeuCauDonVi);
TuyenNhanSu.get("/:id/bo-sung", ThongTinBoSung);
TuyenNhanSu.put("/:id/bo-sung", ThongTinBoSung);
TuyenNhanSu.get("/chuc-vu-phan-cong", LayChucDanhPhanCong);
TuyenNhanSu.get("/lua-chon", LayNhanSuPhanCong);
TuyenNhanSu.post("/:id/dat-lai-mat-khau", DatLaiMatKhau);
TuyenNhanSu.get("/", LayDanhSachNhanSu);
TuyenNhanSu.get("/:id", LayChiTietNhanSu);
TuyenNhanSu.post("/mau-excel", TaiMauExcel("NhanSu"));
TuyenNhanSu.post("/nhap-excel", TaiTepExcel, NhapExcel("NhanSu"));
TuyenNhanSu.post("/", TaoNhanSu);
TuyenNhanSu.put("/:id", CapNhatNhanSu);
TuyenNhanSu.delete("/:id", XoaNhanSu);
