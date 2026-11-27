import type { NguoiDung } from "../Types/XacThuc";

// Danh sách tài khoản đã chọn "Ghi nhớ tôi" trên thiết bị này. Mỗi mục giữ mã
// đăng nhập còn hiệu lực để đăng nhập lại chỉ bằng một lần bấm; khi mã hết hạn
// (8 giờ) hoặc đã đổi mật khẩu, người dùng chỉ cần nhập lại mật khẩu.
const KhoaTaiKhoanGhiNho = "taiKhoanGhiNho";
const SoTaiKhoanToiDa = 8;

export interface TaiKhoanGhiNho {
  Id: string;
  TenDangNhap: string;
  HoTen: string;
  AnhDaiDienUrl: string | null;
  LaQuanTriHeThong: boolean;
  TenDonVi: string | null;
  Token: string | null;
}

// Đọc mục đã lưu; mục lưu trước khi bỏ vai trò cố định được chuyển sang cờ quản trị hệ thống.
function ChuanHoaTaiKhoan(GiaTri: unknown): TaiKhoanGhiNho | null {
  if (typeof GiaTri !== "object" || GiaTri === null) {
    return null;
  }
  const Muc = GiaTri as Record<string, unknown>;
  if (
    typeof Muc.Id !== "string" ||
    typeof Muc.TenDangNhap !== "string" ||
    typeof Muc.HoTen !== "string"
  ) {
    return null;
  }
  return {
    Id: Muc.Id,
    TenDangNhap: Muc.TenDangNhap,
    HoTen: Muc.HoTen,
    AnhDaiDienUrl:
      typeof Muc.AnhDaiDienUrl === "string" ? Muc.AnhDaiDienUrl : null,
    LaQuanTriHeThong:
      Muc.LaQuanTriHeThong === true || Muc.VaiTro === "QUAN_TRI_HE_THONG",
    TenDonVi: typeof Muc.TenDonVi === "string" ? Muc.TenDonVi : null,
    Token: typeof Muc.Token === "string" ? Muc.Token : null,
  };
}

export function LayDanhSachTaiKhoanGhiNho(): TaiKhoanGhiNho[] {
  try {
    const DuLieu: unknown = JSON.parse(
      localStorage.getItem(KhoaTaiKhoanGhiNho) ?? "[]",
    );
    return Array.isArray(DuLieu)
      ? DuLieu.map(ChuanHoaTaiKhoan).filter(
          (Muc): Muc is TaiKhoanGhiNho => Muc !== null,
        )
      : [];
  } catch {
    return [];
  }
}

function LuuDanhSach(DanhSach: TaiKhoanGhiNho[]) {
  localStorage.setItem(
    KhoaTaiKhoanGhiNho,
    JSON.stringify(DanhSach.slice(0, SoTaiKhoanToiDa)),
  );
}

export function GhiNhoTaiKhoan(Nguoi: NguoiDung, Token: string | null) {
  const DanhSachCu = LayDanhSachTaiKhoanGhiNho();
  const MucCu = DanhSachCu.find((Muc) => Muc.Id === Nguoi.Id);
  const MucMoi: TaiKhoanGhiNho = {
    Id: Nguoi.Id,
    TenDangNhap: Nguoi.TenDangNhap,
    HoTen: Nguoi.HoTen,
    AnhDaiDienUrl: Nguoi.AnhDaiDienUrl,
    LaQuanTriHeThong: Nguoi.LaQuanTriHeThong,
    TenDonVi: Nguoi.DonVi?.TenDonVi ?? null,
    Token: Token ?? MucCu?.Token ?? null,
  };
  LuuDanhSach([MucMoi, ...DanhSachCu.filter((Muc) => Muc.Id !== Nguoi.Id)]);
}

// Chỉ cập nhật tên, ảnh… của tài khoản đã có trong danh sách.
export function CapNhatTaiKhoanGhiNho(Nguoi: NguoiDung) {
  const DanhSach = LayDanhSachTaiKhoanGhiNho();
  if (DanhSach.some((Muc) => Muc.Id === Nguoi.Id)) {
    LuuDanhSach(
      DanhSach.map((Muc) =>
        Muc.Id === Nguoi.Id
          ? {
              ...Muc,
              HoTen: Nguoi.HoTen,
              AnhDaiDienUrl: Nguoi.AnhDaiDienUrl,
              LaQuanTriHeThong: Nguoi.LaQuanTriHeThong,
              TenDonVi: Nguoi.DonVi?.TenDonVi ?? null,
            }
          : Muc,
      ),
    );
  }
}

export function XoaMaTaiKhoanGhiNho(Id: string) {
  LuuDanhSach(
    LayDanhSachTaiKhoanGhiNho().map((Muc) =>
      Muc.Id === Id ? { ...Muc, Token: null } : Muc,
    ),
  );
}

export function XoaTaiKhoanGhiNho(Id: string) {
  LuuDanhSach(LayDanhSachTaiKhoanGhiNho().filter((Muc) => Muc.Id !== Id));
}
