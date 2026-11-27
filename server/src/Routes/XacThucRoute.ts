import {
  CapNhatHoSo,
  DoiMatKhauCaNhan,
} from "../Controllers/HoSoController.js";
import { TaiAnhThietBi } from "../Middlewares/TaiAnhThietBiMiddleware.js";
import { Router } from "express";
import {
  DangKy,
  DangNhap,
  DatLaiMatKhauQuaEmail,
  KiemTraMaDatLai,
  LayThongTinCaNhan,
  QuenMatKhau,
} from "../Controllers/XacThucController.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
export const TuyenXacThuc = Router();
TuyenXacThuc.post("/dang-ky", DangKy);
TuyenXacThuc.post("/dang-nhap", DangNhap);
TuyenXacThuc.post("/quen-mat-khau", QuenMatKhau);
TuyenXacThuc.get("/dat-lai-mat-khau", KiemTraMaDatLai);
TuyenXacThuc.post("/dat-lai-mat-khau", DatLaiMatKhauQuaEmail);
TuyenXacThuc.get("/thong-tin-ca-nhan", XacThucToken, LayThongTinCaNhan);

TuyenXacThuc.put(
  "/thong-tin-ca-nhan",
  XacThucToken,
  TaiAnhThietBi.single("TepAnh"),
  CapNhatHoSo,
);
TuyenXacThuc.put("/doi-mat-khau", XacThucToken, DoiMatKhauCaNhan);
