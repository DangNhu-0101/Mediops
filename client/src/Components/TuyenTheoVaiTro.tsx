import { Navigate, Outlet } from "react-router-dom";
import { useXacThuc } from "../Contexts/XacThucContext";

export function TuyenUngDungDonVi() {
  const { NguoiDung: NguoiDung } = useXacThuc();
  if (NguoiDung?.LaQuanTriHeThong) {
    return <Navigate to="/quan-tri-he-thong/don-vi" replace />;
  }
  return <Outlet />;
}

export function TuyenQuanTriHeThong() {
  const { NguoiDung: NguoiDung } = useXacThuc();
  if (!NguoiDung?.LaQuanTriHeThong) {
    return <Navigate to="/bang-dieu-khien" replace />;
  }
  return <Outlet />;
}

export function TuyenQuanLy() {
  const { NguoiDung: NguoiDung } = useXacThuc();
  if (!NguoiDung?.Quyen?.includes("Kho.Xem")) {
    return <Navigate to="/bang-dieu-khien" replace />;
  }
  return <Outlet />;
}
