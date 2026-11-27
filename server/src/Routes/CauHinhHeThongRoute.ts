import { Router } from "express";
import { YeuCauQuanTriHeThong } from "../Middlewares/PhanQuyenMiddleware.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { TaiAnhThietBi } from "../Middlewares/TaiAnhThietBiMiddleware.js";
import {
  CapNhatCauHinh,
  LayCauHinh,
} from "../Controllers/CauHinhHeThongController.js";

// Đọc công khai để hiển thị tên và logo website trước khi đăng nhập.
export const TuyenCauHinhHeThong = Router();
TuyenCauHinhHeThong.get("/", LayCauHinh);
TuyenCauHinhHeThong.put(
  "/",
  XacThucToken,
  YeuCauQuanTriHeThong,
  TaiAnhThietBi.single("TepLogo"),
  CapNhatCauHinh,
);
