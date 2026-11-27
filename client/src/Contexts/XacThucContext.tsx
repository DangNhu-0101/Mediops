import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LayTokenDaLuu, LuuToken, XoaToken } from "../Services/Api";
import { GuiDangNhap, LayNguoiDungHienTai } from "../Services/XacThucService";
import {
  CapNhatTaiKhoanGhiNho,
  GhiNhoTaiKhoan,
  XoaMaTaiKhoanGhiNho,
  XoaTaiKhoanGhiNho,
  type TaiKhoanGhiNho,
} from "../Services/TaiKhoanGhiNhoService";
import type { NguoiDung } from "../Types/XacThuc";

interface GiaTriXacThuc {
  NguoiDung: NguoiDung | null;
  DangKhoiPhuc: boolean;
  DangNhap: (
    TenDangNhap: string,
    MatKhau: string,
    GhiNho: boolean,
  ) => Promise<NguoiDung>;
  DangNhapBangTaiKhoanGhiNho: (TaiKhoan: TaiKhoanGhiNho) => Promise<NguoiDung>;
  DangXuat: () => void;
  LamMoiNguoiDung: () => Promise<void>;
}

const XacThucContext = createContext<GiaTriXacThuc | null>(null);

export function XacThucProvider({
  children: Children,
}: {
  children: ReactNode;
}) {
  const [NguoiDung, SetNguoiDung] = useState<NguoiDung | null>(null);
  const [DangKhoiPhuc, SetDangKhoiPhuc] = useState(true);

  const DangXuat = useCallback(() => {
    XoaToken();
    SetNguoiDung(null);
  }, []);

  useEffect(() => {
    const XuLyHetHan = () => SetNguoiDung(null);
    window.addEventListener("xac-thuc-het-han", XuLyHetHan);

    async function KhoiPhucDangNhap() {
      if (!LayTokenDaLuu()) {
        SetDangKhoiPhuc(false);
        return;
      }

      try {
        const NguoiDaKhoiPhuc = await LayNguoiDungHienTai();
        CapNhatTaiKhoanGhiNho(NguoiDaKhoiPhuc);
        SetNguoiDung(NguoiDaKhoiPhuc);
      } catch {
        DangXuat();
      } finally {
        SetDangKhoiPhuc(false);
      }
    }

    void KhoiPhucDangNhap();
    return () => window.removeEventListener("xac-thuc-het-han", XuLyHetHan);
  }, [DangXuat]);

  const DangNhap = useCallback(
    async (TenDangNhap: string, MatKhau: string, GhiNho: boolean) => {
      const KetQua = await GuiDangNhap(TenDangNhap, MatKhau);
      LuuToken(KetQua.Token, GhiNho);
      if (GhiNho) {
        GhiNhoTaiKhoan(KetQua.NguoiDung, KetQua.Token);
      } else {
        XoaTaiKhoanGhiNho(KetQua.NguoiDung.Id);
      }
      SetNguoiDung(KetQua.NguoiDung);
      return KetQua.NguoiDung;
    },
    [],
  );

  // Đăng nhập lại bằng mã đã ghi nhớ; mã hết hạn thì xóa mã để người dùng nhập mật khẩu.
  const DangNhapBangTaiKhoanGhiNho = useCallback(
    async (TaiKhoan: TaiKhoanGhiNho) => {
      if (!TaiKhoan.Token) {
        throw new Error("Phiên ghi nhớ đã hết hạn.");
      }
      LuuToken(TaiKhoan.Token, true);
      try {
        const NguoiDaDangNhap = await LayNguoiDungHienTai();
        GhiNhoTaiKhoan(NguoiDaDangNhap, TaiKhoan.Token);
        SetNguoiDung(NguoiDaDangNhap);
        return NguoiDaDangNhap;
      } catch (Loi) {
        XoaToken();
        XoaMaTaiKhoanGhiNho(TaiKhoan.Id);
        throw Loi;
      }
    },
    [],
  );

  const LamMoiNguoiDung = useCallback(async () => {
    const NguoiMoi = await LayNguoiDungHienTai();
    CapNhatTaiKhoanGhiNho(NguoiMoi);
    SetNguoiDung(NguoiMoi);
  }, []);
  const GiaTri = useMemo(
    () => ({
      NguoiDung,
      DangKhoiPhuc,
      DangNhap,
      DangNhapBangTaiKhoanGhiNho,
      DangXuat,
      LamMoiNguoiDung,
    }),
    [
      NguoiDung,
      DangKhoiPhuc,
      DangNhap,
      DangNhapBangTaiKhoanGhiNho,
      DangXuat,
      LamMoiNguoiDung,
    ],
  );

  return (
    <XacThucContext.Provider value={GiaTri}>{Children}</XacThucContext.Provider>
  );
}

export function useXacThuc() {
  const GiaTri = useContext(XacThucContext);
  if (!GiaTri) {
    throw new Error("useXacThuc phải được dùng bên trong XacThucProvider");
  }
  return GiaTri;
}
