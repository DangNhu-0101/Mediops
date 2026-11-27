import type { NextFunction, Response } from "express";
import type { YeuCauXacThuc } from "../Types/index.js";
import { CoSoDuLieu } from "../Config/Database.js";
import { PhamViCaQuay } from "../Services/QuyenService.js";

const NhomApi: Record<string, string> = {
  "nhan-su": "NhanSu",
  "du-an": "DuAn",
  "ca-quay": "CaQuay",
  "phong-studio": "Studio",
  "thiet-bi": "ThietBi",
  kho: "Kho",
  "su-co-bao-tri": "SuCo",
  "su-co-van-hanh": "SuCoVanHanh",
  "phien-quyet-dinh": "PhienQuyetDinh",
  "nhat-ky-muon-tra": "NhatKy",
  "bang-dieu-khien": "BangDieuKhien",
  "van-hanh-kho": "VanHanhKho",
  "nhom-quyen": "NhomQuyen",
  "chuc-danh": "ChucDanh",
};

// Ngoài quản trị đơn vị, chỉ đọc danh sách khi cấp tài khoản, lập yêu cầu hoặc phân công ca.
const QuyenDocDanhMucQuanTri: Record<string, string[]> = {
  NhomQuyen: ["NhanSu.Xem"],
  ChucDanh: ["NhanSu.Xem", "CaQuay.Tao", "CaQuay.Sua", "CaQuay.PhanCong"],
};

export async function KiemTraQuyenApi(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  const NguoiDung = YeuCau.NguoiDung!;
  const Quyen = NguoiDung.Quyen ?? [];
  const Nhom = NhomApi[YeuCau.baseUrl.split("/").at(-1)?.toLowerCase() ?? ""];
  // Express chấp nhận chữ hoa và dấu / cuối đường dẫn; quyền phải kiểm tra cùng một cách.
  const DuongDan = YeuCau.path.toLowerCase().replace(/\/+$/, "") || "/";
  const LaDoc = YeuCau.method === "GET";
  const TuChoi = () =>
    PhanHoi.status(403).json({
      ThongBao: "Bạn không có quyền thực hiện thao tác này.",
    });
  if (!Nhom) return TuChoi();
  const QuyenDocDanhMuc = QuyenDocDanhMucQuanTri[Nhom];
  if (QuyenDocDanhMuc) {
    if (NguoiDung.QuanTriDonVi) return TiepTheo();
    return LaDoc &&
      DuongDan === "/" &&
      QuyenDocDanhMuc.some((Ma) => Quyen.includes(Ma))
      ? TiepTheo()
      : TuChoi();
  }
  if (Nhom === "PhienQuyetDinh") {
    if (
      (LaDoc && DuongDan === "/loi-moi/cua-toi") ||
      (YeuCau.method === "POST" && /^\/loi-moi\/[^/]+\/tra-loi$/.test(DuongDan))
    )
      return TiepTheo(); // Service chỉ đọc/ghi lời mời của chính người nhận.
    return Quyen.includes("CaQuay.PhanCong") ? TiepTheo() : TuChoi();
  }
  // Phạm vi ca được kiểm tra lại trong service cho cả đọc và ghi.
  if (Nhom === "SuCoVanHanh") {
    if (
      LaDoc ||
      (YeuCau.method === "POST" &&
        (DuongDan === "/" ||
          DuongDan.endsWith("/phan-tich") ||
          DuongDan.endsWith("/anh")))
    )
      return TiepTheo();
    if (!Quyen.includes("SuCo.Sua")) return TuChoi();
    if (DuongDan.endsWith("/ap-dung") && !Quyen.includes("CaQuay.PhanCong"))
      return TuChoi();
    return TiepTheo();
  }
  if (
    Nhom === "ThietBi" &&
    LaDoc &&
    ["/quan-ly-danh-muc", "/quan-ly-model"].includes(DuongDan)
  )
    return Quyen.includes("ThietBi.Xem") ? TiepTheo() : TuChoi();
  if (Nhom === "DuAn" && LaDoc && DuongDan === "/tong-quan")
    return Quyen.includes("DuAn.Xem") ? TiepTheo() : TuChoi();
  if (
    Nhom === "ThietBi" &&
    LaDoc &&
    (DuongDan === "/muc-do-muon" || DuongDan.endsWith("/lich-su-muon"))
  ) {
    return Quyen.includes("ThietBi.Xem") && Quyen.includes("NhatKy.Xem")
      ? TiepTheo()
      : TuChoi();
  }
  if (Nhom === "ThietBi" && LaDoc && DuongDan === "/tong-quan") {
    return Quyen.includes("ThietBi.Xem") ? TiepTheo() : TuChoi();
  }
  if (Nhom === "NhanSu" && !LaDoc && !NguoiDung.QuanTriDonVi) {
    if (YeuCau.body && "QuanTriDonVi" in YeuCau.body) return TuChoi();
    if (DuongDan !== "/") {
      try {
        const Dich = await CoSoDuLieu.nguoiDung.findFirst({
          where: { Id: DuongDan.split("/")[1], DonViId: NguoiDung.DonViId! },
          select: { QuanTriDonVi: true },
        });
        if (Dich?.QuanTriDonVi) return TuChoi();
      } catch (Loi) {
        return TiepTheo(Loi);
      }
    }
  }
  if (
    Nhom === "NhanSu" &&
    ["/lua-chon", "/chuc-vu-phan-cong"].includes(DuongDan)
  ) {
    return Quyen.includes("CaQuay.PhanCong") ? TiepTheo() : TuChoi();
  }
  // Danh mục tối thiểu phục vụ biểu mẫu phân công, không cấp quyền hồ sơ nhân sự.
  if (
    LaDoc &&
    ["DuAn", "Studio", "ThietBi"].includes(Nhom) &&
    Quyen.includes("CaQuay.PhanCong")
  )
    return TiepTheo();
  if (Nhom === "VanHanhKho") {
    if (LaDoc && ["/ca-quay-hom-nay"].includes(DuongDan)) return TiepTheo();
    if (!Quyen.includes("VanHanhKho.QuanLy")) return TuChoi();
    const CaQuayId = DuongDan.startsWith("/checklist")
      ? DuongDan.split("/")[2]
      : (YeuCau.body?.CaQuayId ?? YeuCau.query.CaQuayId);
    if (typeof CaQuayId === "string") {
      try {
        const CaQuay = await CoSoDuLieu.caQuay.findFirst({
          where: {
            Id: CaQuayId,
            DuAn: { DonViId: NguoiDung.DonViId! },
            ...(NguoiDung.QuanTriDonVi || Quyen.includes("VanHanhKho.ToanDonVi")
              ? {}
              : PhamViCaQuay(NguoiDung.nguoiDungId)),
          },
          select: { Id: true },
        });
        if (!CaQuay) return TuChoi();
      } catch (Loi) {
        return TiepTheo(Loi);
      }
    }
    return TiepTheo();
  }
  if (Nhom === "CaQuay" && LaDoc) {
    if (DuongDan === "/goi-y-thay-the")
      return Quyen.includes("CaQuay.PhanCong") ? TiepTheo() : TuChoi();
    if (Quyen.includes("CaQuay.Xem")) return TiepTheo();
    if (DuongDan === "/") return TiepTheo(); // Controller giới hạn danh sách về ca được phân công.
    try {
      const CaQuay = await CoSoDuLieu.caQuay.findFirst({
        where: {
          Id: DuongDan.slice(1),
          DuAn: { DonViId: NguoiDung.DonViId! },
          ...PhamViCaQuay(NguoiDung.nguoiDungId),
        },
        select: { Id: true },
      });
      return CaQuay ? TiepTheo() : TuChoi();
    } catch (Loi) {
      return TiepTheo(Loi);
    }
  }
  let ThaoTac = LaDoc
    ? "Xem"
    : YeuCau.method === "DELETE"
      ? "Xoa"
      : YeuCau.method === "POST"
        ? "Tao"
        : "Sua";
  if (Nhom === "NhanSu" && DuongDan.endsWith("/dat-lai-mat-khau"))
    ThaoTac = "DatLaiMatKhau";
  if (Nhom === "SuCo" && DuongDan !== "/" && !LaDoc) ThaoTac = "Sua";
  if (Nhom === "CaQuay") {
    if (DuongDan.includes("xung-dot") || DuongDan.includes("giai-phap"))
      ThaoTac = "PhanCong";
    if (
      YeuCau.body &&
      [
        "DanhSachNhanSu",
        "DanhSachThietBiId",
        "NguoiPhuTrachId",
        "PhongStudioId",
      ].some((Truong) => Truong in YeuCau.body) &&
      !Quyen.includes("CaQuay.PhanCong")
    )
      return TuChoi();
  }
  return Quyen.includes(`${Nhom}.${ThaoTac}`) ? TiepTheo() : TuChoi();
}
