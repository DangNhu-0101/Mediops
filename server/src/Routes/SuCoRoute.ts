import { Router } from "express";
import {
  BatDauXuLy,
  BoSungAnhSuCo,
  HoanTatSuCo,
  LayChiTietSuCo,
  LayDanhSachSuCo,
  LayNhatKyMuonTra,
  TaoSuCo,
} from "../Controllers/SuCoController.js";
import { TaiAnhSuCo } from "../Middlewares/TaiAnhThietBiMiddleware.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";
export const TuyenSuCo = Router();
TuyenSuCo.use(XacThucToken, YeuCauDonVi);
TuyenSuCo.get("/", LayDanhSachSuCo);
TuyenSuCo.post("/", TaiAnhSuCo.array("AnhSuCo", 5), TaoSuCo);
TuyenSuCo.get("/:id", LayChiTietSuCo);
TuyenSuCo.post("/:id/anh", TaiAnhSuCo.array("AnhSuCo", 5), BoSungAnhSuCo);
TuyenSuCo.post("/:id/bat-dau", BatDauXuLy);
TuyenSuCo.put("/:id/hoan-tat", HoanTatSuCo);
export const TuyenNhatKy = Router();
TuyenNhatKy.use(XacThucToken, YeuCauDonVi);
TuyenNhatKy.get("/", LayNhatKyMuonTra);
