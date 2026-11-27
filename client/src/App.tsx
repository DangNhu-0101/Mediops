import { lazy, Suspense } from "react";
import { CauHinhThoiGianCho } from "./Pages/CauHinhThoiGianCho";
import { CaiDatHeThong } from "./Pages/CaiDatHeThong";
import { CaiDat, CaiDatPhanLoai, MucCaiDatMacDinh } from "./Pages/CaiDat";
import { HoSoCaNhan } from "./Pages/HoSoCaNhan";
import { QuanLyNhomQuyen } from "./Pages/QuanLyNhomQuyen";
import { QuanLyChucDanh } from "./Pages/QuanLyChucDanh";
import { Navigate, Route, Routes } from "react-router-dom";
import { TuyenDuocBaoVe } from "./Components/TuyenDuocBaoVe";
import {
  TuyenQuanTriHeThong,
  TuyenQuanLy,
  TuyenUngDungDonVi,
} from "./Components/TuyenTheoVaiTro";
import { AppLayout } from "./Layouts/AppLayout";
import { VanHanhDiDongLayout } from "./Layouts/VanHanhDiDongLayout";
import { QuanTriHeThongLayout } from "./Layouts/QuanTriHeThongLayout";
import { BangDieuKhien } from "./Pages/BangDieuKhien";
import { ChiTietCaQuay } from "./Pages/ChiTietCaQuay";
import { BaoTri as NhatKySuCo } from "./Pages/BaoTri";
import { CaQuayCuaToi } from "./Pages/CaQuayCuaToi";
import { ChiTietCaQuayDiDong } from "./Pages/ChiTietCaQuayDiDong";
import { QuetXuatKho } from "./Pages/QuetXuatKho";
import { QuetNhapKho } from "./Pages/QuetNhapKho";
import { QuanLyDuAn } from "./Pages/QuanLyDuAn";
import { QuanLyNhanSu } from "./Pages/QuanLyNhanSu";
import { QuanLyThietBi } from "./Pages/QuanLyThietBi";
import { QuanLyStudio } from "./Pages/QuanLyStudio";
import { ChiTietThietBiInQR } from "./Pages/ChiTietThietBiInQR";
import { TraCuuNhanhQR } from "./Pages/TraCuuNhanhQR";
import { DangNhap } from "./Pages/DangNhap";
import { QuenMatKhau } from "./Pages/QuenMatKhau";
import { DatLaiMatKhau } from "./Pages/DatLaiMatKhau";
import { TrangChu } from "./Pages/TrangChu";
import { QuanTriDonVi } from "./Pages/QuanTriDonVi";
import { QuanLyKho } from "./Pages/QuanLyKho";
import { NhatKyMuonTra } from "./Pages/NhatKyMuonTra";
import { ChiTietKho } from "./Pages/ChiTietKho";
import { ChiTietDuAn } from "./Pages/ChiTietDuAn";

const LichCaQuay = lazy(async () => {
  const Trang = await import("./Pages/LichCaQuay");
  return { default: Trang.LichCaQuay };
});

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TrangChu />} />
      <Route path="/dang-nhap" element={<DangNhap />} />
      <Route path="/quen-mat-khau" element={<QuenMatKhau />} />
      <Route path="/dat-lai-mat-khau" element={<DatLaiMatKhau />} />
      <Route path="/dang-ky" element={<Navigate to="/dang-nhap" replace />} />
      <Route element={<TuyenDuocBaoVe />}>
        <Route element={<TuyenQuanTriHeThong />}>
          <Route element={<QuanTriHeThongLayout />}>
            <Route
              path="quan-tri-he-thong/chuc-danh"
              element={<QuanLyChucDanh />}
            />
            <Route
              path="quan-tri-he-thong/thoi-gian-cho"
              element={<CauHinhThoiGianCho />}
            />
            <Route path="quan-tri-he-thong/don-vi" element={<QuanTriDonVi />} />
            <Route
              path="quan-tri-he-thong/cai-dat"
              element={<CaiDatHeThong />}
            />
          </Route>
        </Route>
        <Route element={<TuyenUngDungDonVi />}>
          <Route path="tra-cuu/:maQR?" element={<TraCuuNhanhQR />} />
          <Route element={<AppLayout />}>
            <Route path="cai-dat" element={<CaiDat />}>
              <Route index element={<MucCaiDatMacDinh />} />
              <Route
                path="danh-muc"
                element={<CaiDatPhanLoai LaModel={false} />}
              />
              <Route
                path="dong-tai-nguyen"
                element={<CaiDatPhanLoai LaModel />}
              />
              <Route path="nhom-quyen" element={<QuanLyNhomQuyen />} />
              <Route path="chuc-danh" element={<QuanLyChucDanh />} />
              <Route
                path="phan-quyen"
                element={<Navigate to="/cai-dat/nhom-quyen" replace />}
              />
            </Route>
            <Route path="ho-so-ca-nhan" element={<HoSoCaNhan />} />
            <Route
              path="phan-quyen-chuc-vu"
              element={<Navigate to="/cai-dat/nhom-quyen" replace />}
            />
            <Route path="bang-dieu-khien" element={<BangDieuKhien />} />
            <Route
              path="lich-ca-quay"
              element={
                <Suspense
                  fallback={
                    <p role="status" className="py-8 text-fog">
                      Đang tải lịch ca quay…
                    </p>
                  }
                >
                  <LichCaQuay />
                </Suspense>
              }
            />
            <Route path="ca-quay/:id" element={<ChiTietCaQuay />} />
            <Route path="kho-thiet-bi" element={<QuanLyThietBi />} />
            <Route path="studio" element={<QuanLyStudio />} />
            <Route element={<TuyenQuanLy />}>
              <Route path="kho" element={<QuanLyKho />} />
              <Route path="kho/:id" element={<ChiTietKho />} />
            </Route>
            <Route path="thiet-bi/:id" element={<ChiTietThietBiInQR />} />
            <Route path="du-an" element={<QuanLyDuAn />} />
            <Route path="du-an/:id" element={<ChiTietDuAn />} />
            <Route path="nhan-su" element={<QuanLyNhanSu />} />
            <Route path="nhat-ky-su-co" element={<NhatKyMuonTra />} />
            <Route path="bao-tri" element={<NhatKySuCo />} />
          </Route>
          <Route element={<VanHanhDiDongLayout />}>
            <Route path="mobile/ca-quay-cua-toi" element={<CaQuayCuaToi />} />
            <Route
              path="mobile/ca-quay/:id"
              element={<ChiTietCaQuayDiDong />}
            />
          </Route>
          <Route path="mobile/quet-xuat-kho/:id" element={<QuetXuatKho />} />
          <Route path="mobile/quet-nhap-kho/:id" element={<QuetNhapKho />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/bang-dieu-khien" replace />} />
    </Routes>
  );
}
