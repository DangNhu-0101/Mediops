import { Router } from "express";
import {
  LayCaQuayHomNay,
  LayCacKho,
  LayChecklist,
  LayChecklistNhap,
  KiemTraViTriKho,
  NhapKho,
  TraCuuThietBiXuatKho,
  TraCuuThietBiNhapKho,
  XuatKho,
} from "../Controllers/VanHanhKhoController.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";
export const TuyenVanHanhKho = Router();
TuyenVanHanhKho.use(XacThucToken, YeuCauDonVi);
TuyenVanHanhKho.get("/ca-quay-hom-nay", LayCaQuayHomNay);
TuyenVanHanhKho.get("/kho", LayCacKho);
TuyenVanHanhKho.get("/checklist/:caQuayId", LayChecklist);
TuyenVanHanhKho.get("/checklist-nhap/:caQuayId", LayChecklistNhap);
TuyenVanHanhKho.get("/quet-thiet-bi", TraCuuThietBiXuatKho);
TuyenVanHanhKho.get("/quet-thiet-bi-nhap", TraCuuThietBiNhapKho);
TuyenVanHanhKho.post("/kiem-tra-vi-tri", KiemTraViTriKho);
TuyenVanHanhKho.post("/xuat-kho", XuatKho);
TuyenVanHanhKho.post("/nhap-kho", NhapKho);
