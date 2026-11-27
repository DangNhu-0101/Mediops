import { Router } from "express";
import { LayBangDieuKhien } from "../Controllers/BangDieuKhienController.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";

export const TuyenBangDieuKhien = Router();
TuyenBangDieuKhien.use(XacThucToken, YeuCauDonVi);
TuyenBangDieuKhien.get("/", LayBangDieuKhien);
