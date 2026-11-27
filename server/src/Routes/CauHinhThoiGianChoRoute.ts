import { Router } from "express";
import { YeuCauQuanTriHeThong } from "../Middlewares/PhanQuyenMiddleware.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { XuLyCauHinhCho } from "../Controllers/CauHinhThoiGianChoController.js";
export const TuyenCauHinhCho = Router();
TuyenCauHinhCho.use(XacThucToken, YeuCauQuanTriHeThong);
TuyenCauHinhCho.get("/", XuLyCauHinhCho);
TuyenCauHinhCho.put("/", XuLyCauHinhCho);
