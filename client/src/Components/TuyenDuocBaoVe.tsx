import { CoQuyen, QuyenTrang } from "../Services/QuyenService";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useXacThuc } from "../Contexts/XacThucContext";

export function TuyenDuocBaoVe() {
  const { NguoiDung: NguoiDung, DangKhoiPhuc: DangKhoiPhuc } = useXacThuc();
  const ViTri = useLocation();

  if (DangKhoiPhuc) {
    return (
      <main className="grid min-h-screen place-items-center bg-gunmetal text-fog">
        <p role="status">Đang khôi phục phiên đăng nhập…</p>
      </main>
    );
  }

  if (!NguoiDung) {
    return (
      <Navigate
        to="/dang-nhap"
        replace
        state={{ Tu: `${ViTri.pathname}${ViTri.search}${ViTri.hash}` }}
      />
    );
  }

  const Quyen = QuyenTrang(ViTri.pathname);
  const CanVanHanh = ViTri.pathname.startsWith("/mobile/quet-");
  if (
    (CanVanHanh && !CoQuyen(NguoiDung, "VanHanhKho.QuanLy")) ||
    (Quyen && !CoQuyen(NguoiDung, Quyen)) ||
    (["/cai-dat/nhom-quyen", "/cai-dat/chuc-danh"].includes(ViTri.pathname) &&
      !NguoiDung.QuanTriDonVi)
  ) {
    return (
      <main className="p-6">
        <p role="alert">Bạn không có quyền truy cập chức năng này.</p>
        <a
          className="mt-4 inline-block text-blueprint"
          href="/mobile/ca-quay-cua-toi"
        >
          Về ca quay của tôi
        </a>
      </main>
    );
  }
  return <Outlet />;
}
