import { Router } from "express";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";
import { XuLyPhien } from "../Controllers/PhienQuyetDinhController.js";

export const TuyenPhienQuyetDinh = Router();
TuyenPhienQuyetDinh.use(XacThucToken, YeuCauDonVi);
TuyenPhienQuyetDinh.get("/loi-moi/cua-toi", XuLyPhien("cua-toi"));
TuyenPhienQuyetDinh.post("/loi-moi/:id/tra-loi", XuLyPhien("tra-loi"));
TuyenPhienQuyetDinh.post("/loi-moi/:id/rut", XuLyPhien("rut"));
TuyenPhienQuyetDinh.get("/su-co/:id", XuLyPhien("doc"));
TuyenPhienQuyetDinh.post("/su-co/:id", XuLyPhien("tao"));
TuyenPhienQuyetDinh.post("/:id/huy", XuLyPhien("huy"));
TuyenPhienQuyetDinh.post("/:id/loi-moi", XuLyPhien("moi"));
TuyenPhienQuyetDinh.post("/:id/chot", XuLyPhien("chot"));

TuyenPhienQuyetDinh.get("/ca-quay/:id", XuLyPhien("doc-ca"));
TuyenPhienQuyetDinh.post("/ca-quay/:id", XuLyPhien("tao-ca"));
