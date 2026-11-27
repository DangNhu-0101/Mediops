import type { BangChungViTri } from "../Services/VanHanhKhoService";

const TuyChonViTri: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15_000,
};

function TaoLoiViTri(Loi: GeolocationPositionError) {
  if (Loi.code === Loi.PERMISSION_DENIED) {
    return new Error(
      "Bạn chưa cho phép truy cập vị trí. Hãy cấp quyền trong trình duyệt rồi thử lại.",
    );
  }
  if (Loi.code === Loi.POSITION_UNAVAILABLE) {
    return new Error("Không thể xác định vị trí hiện tại. Vui lòng thử lại.");
  }
  if (Loi.code === Loi.TIMEOUT) {
    return new Error("Yêu cầu vị trí đã hết thời gian. Vui lòng thử lại.");
  }
  return new Error("Không thể xác định vị trí hiện tại.");
}

export function LayViTriHienTai(): Promise<BangChungViTri> {
  if (!window.isSecureContext) {
    return Promise.reject(
      new Error(
        "Định vị cần kết nối HTTPS. Hãy mở địa chỉ HTTPS của hệ thống rồi lấy lại vị trí.",
      ),
    );
  }
  if (!navigator.geolocation) {
    return Promise.reject(
      new Error(
        "Trình duyệt này không hỗ trợ xác định vị trí. Vui lòng dùng thiết bị khác.",
      ),
    );
  }
  return new Promise((Resolve, Reject) => {
    navigator.geolocation.getCurrentPosition(
      (ViTri) =>
        Resolve({
          ViDo: ViTri.coords.latitude,
          KinhDo: ViTri.coords.longitude,
          DoChinhXacMet: ViTri.coords.accuracy,
          ThoiDiemGhiNhan: new Date(ViTri.timestamp).toISOString(),
        }),
      (Loi) => Reject(TaoLoiViTri(Loi)),
      TuyChonViTri,
    );
  });
}
