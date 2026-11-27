import { Router } from "express";
import {
  CapNhatDonVi,
  LayDanhSachDonVi,
  TaoDonVi,
} from "../Controllers/DonViController.js";
import { YeuCauQuanTriHeThong } from "../Middlewares/PhanQuyenMiddleware.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";

export const TuyenDonVi = Router();
TuyenDonVi.use(XacThucToken, YeuCauQuanTriHeThong);
TuyenDonVi.get("/", LayDanhSachDonVi);
TuyenDonVi.post("/", TaoDonVi);
TuyenDonVi.put("/:id", CapNhatDonVi);
