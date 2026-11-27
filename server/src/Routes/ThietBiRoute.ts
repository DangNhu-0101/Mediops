import { ThongTinBoSung } from "../Controllers/ThongTinBoSungController.js";
import { NhapExcel, TaiMauExcel } from "../Controllers/NhapExcelController.js";
import { TaiTepExcel } from "../Middlewares/TaiTepExcelMiddleware.js";
import {
  TongKho,
  MucDoMuon,
  LichSuMuon,
  LichPhanCongThietBi,
  DanhSachMau,
  TaoMau,
  SuaMau,
  KhoLuaChonThietBi,
  DanhMucQuanLy,
  ModelQuanLy,
  TaoDanhMuc,
  SuaDanhMuc,
  XoaDanhMuc,
  XoaModel,
} from "../Controllers/ThongKeVanHanhController.js";
import { Router } from "express";
import {
  CapNhatThietBi,
  LayChiTietThietBi,
  LayDanhMuc,
  LayDanhSachLuaChon,
  LayDanhSachThietBi,
  TaoThietBi,
  TraCuuQR,
  XoaThietBi,
} from "../Controllers/ThietBiController.js";
import { TaiAnhThietBi } from "../Middlewares/TaiAnhThietBiMiddleware.js";
import { XacThucToken } from "../Middlewares/XacThucTokenMiddleware.js";
import { YeuCauDonVi } from "../Middlewares/YeuCauDonViMiddleware.js";

export const TuyenThietBi = Router();
TuyenThietBi.use(XacThucToken, YeuCauDonVi);
TuyenThietBi.get("/tong-quan", TongKho);
TuyenThietBi.get("/muc-do-muon", MucDoMuon);
TuyenThietBi.get("/model", DanhSachMau);
TuyenThietBi.get("/quan-ly-danh-muc", DanhMucQuanLy);
TuyenThietBi.get("/quan-ly-model", ModelQuanLy);
TuyenThietBi.post("/danh-muc/mau-excel", TaiMauExcel("DanhMuc"));
TuyenThietBi.post("/danh-muc/nhap-excel", TaiTepExcel, NhapExcel("DanhMuc"));
TuyenThietBi.post("/model/mau-excel", TaiMauExcel("DongTaiNguyen"));
TuyenThietBi.post("/model/nhap-excel", TaiTepExcel, NhapExcel("DongTaiNguyen"));
TuyenThietBi.post("/mau-excel", TaiMauExcel("ThietBi"));
TuyenThietBi.post("/nhap-excel", TaiTepExcel, NhapExcel("ThietBi"));
TuyenThietBi.post("/danh-muc", TaoDanhMuc);
TuyenThietBi.put("/danh-muc/:id", SuaDanhMuc);
TuyenThietBi.delete("/danh-muc/:id", XoaDanhMuc);
TuyenThietBi.delete("/model/:id", XoaModel);
TuyenThietBi.get("/kho-lua-chon", KhoLuaChonThietBi);
TuyenThietBi.get("/lua-chon", LayDanhSachLuaChon);
TuyenThietBi.post("/model", TaoMau);
TuyenThietBi.put("/model/:id", SuaMau);
TuyenThietBi.get("/:id/lich-su-muon", LichSuMuon);
TuyenThietBi.get("/:id/lich-phan-cong", LichPhanCongThietBi);
TuyenThietBi.get("/:id/bo-sung", ThongTinBoSung);
TuyenThietBi.put("/:id/bo-sung", ThongTinBoSung);
TuyenThietBi.get("/tra-cuu-qr/:maQR", TraCuuQR);
TuyenThietBi.get("/", LayDanhSachThietBi);
TuyenThietBi.get("/danh-muc", LayDanhMuc);
TuyenThietBi.get("/:id", LayChiTietThietBi);
TuyenThietBi.post("/", TaiAnhThietBi.single("TepAnh"), TaoThietBi);
TuyenThietBi.put("/:id", TaiAnhThietBi.single("TepAnh"), CapNhatThietBi);
TuyenThietBi.delete("/:id", XoaThietBi);
