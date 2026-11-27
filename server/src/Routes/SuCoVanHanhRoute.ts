import { TaiAnhSuCo } from "../Middlewares/TaiAnhThietBiMiddleware.js";
import { Router } from "express";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";
import { TaoXuLySuCo } from "../Controllers/SuCoVanHanhController.js";

export const TuyenSuCoVanHanh = Router();
TuyenSuCoVanHanh.use(XacThucToken, YeuCauDonVi);
TuyenSuCoVanHanh.get("/", TaoXuLySuCo("danh-sach"));
TuyenSuCoVanHanh.get("/ngu-canh", TaoXuLySuCo("ngu-canh"));
TuyenSuCoVanHanh.post("/", TaoXuLySuCo("bao"));
TuyenSuCoVanHanh.get("/:id", TaoXuLySuCo("chi-tiet"));
TuyenSuCoVanHanh.put("/:id", TaoXuLySuCo("cap-nhat"));
TuyenSuCoVanHanh.post("/:id/phan-tich", TaoXuLySuCo("phan-tich"));
TuyenSuCoVanHanh.post("/:id/ap-dung", TaoXuLySuCo("ap-dung"));
TuyenSuCoVanHanh.post("/:id/ban-giao", TaoXuLySuCo("ban-giao"));

TuyenSuCoVanHanh.post(
  "/:id/anh",
  TaiAnhSuCo.array("AnhSuCo", 5),
  TaoXuLySuCo("anh"),
);
