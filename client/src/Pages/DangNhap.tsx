import type { NguoiDung as KieuNguoiDung } from "../Types/XacThuc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnhDaiDien } from "../Components/AnhDaiDien";
import { KhungXacThuc } from "../Components/KhungXacThuc";
import { useXacThuc } from "../Contexts/XacThucContext";
import { useCauHinhHeThong } from "../Contexts/CauHinhHeThongContext";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { SchemaDangNhap } from "../Schemas/BieuMau";
import {
  LayDanhSachTaiKhoanGhiNho,
  XoaTaiKhoanGhiNho,
  type TaiKhoanGhiNho,
} from "../Services/TaiKhoanGhiNhoService";
import { toast } from "sonner";
import type { z } from "zod";

export function DangNhap() {
  const {
    NguoiDung: NguoiDung,
    DangKhoiPhuc: DangKhoiPhuc,
    DangNhap: DangNhapNoiBo,
    DangNhapBangTaiKhoanGhiNho,
  } = useXacThuc();
  const { CauHinh } = useCauHinhHeThong();
  const [HienMatKhau, SetHienMatKhau] = useState(false);
  const [Loi, SetLoi] = useState("");
  const [DanhSachGhiNho, SetDanhSachGhiNho] = useState(
    LayDanhSachTaiKhoanGhiNho,
  );
  const [IdDangDangNhap, SetIdDangDangNhap] = useState<string | null>(null);
  const {
    register: Register,
    handleSubmit: HandleSubmit,
    setValue: SetValue,
    setFocus: SetFocus,
    formState: { errors: Errors, isSubmitting: IsSubmitting },
  } = useForm<z.infer<typeof SchemaDangNhap>>({
    resolver: zodResolver(SchemaDangNhap),
    defaultValues: { TenDangNhap: "", MatKhau: "", GhiNho: true },
  });
  const DieuHuong = useNavigate();
  const ViTri = useLocation();
  const DuongDanSauDangNhap =
    typeof ViTri.state === "object" &&
    ViTri.state !== null &&
    "Tu" in ViTri.state &&
    typeof ViTri.state.Tu === "string"
      ? ViTri.state.Tu
      : "";

  const DuongDanMacDinh = (Nguoi: KieuNguoiDung) =>
    Nguoi.LaQuanTriHeThong
      ? "/quan-tri-he-thong/don-vi"
      : Nguoi.Quyen.includes("BangDieuKhien.Xem")
        ? "/bang-dieu-khien"
        : "/mobile/ca-quay-cua-toi";

  if (!DangKhoiPhuc && NguoiDung) {
    return <Navigate to={DuongDanMacDinh(NguoiDung)} replace />;
  }

  function DieuHuongSauDangNhap(Nguoi: KieuNguoiDung) {
    DieuHuong(
      Nguoi.LaQuanTriHeThong
        ? "/quan-tri-he-thong/don-vi"
        : !DuongDanSauDangNhap ||
            DuongDanSauDangNhap.startsWith("/quan-tri-he-thong")
          ? DuongDanMacDinh(Nguoi)
          : DuongDanSauDangNhap,
      { replace: true },
    );
  }

  function YeuCauNhapMatKhau(TaiKhoan: TaiKhoanGhiNho) {
    SetValue("TenDangNhap", TaiKhoan.TenDangNhap);
    SetValue("MatKhau", "");
    SetFocus("MatKhau");
  }

  async function ChonTaiKhoanGhiNho(TaiKhoan: TaiKhoanGhiNho) {
    SetLoi("");
    if (!TaiKhoan.Token) {
      YeuCauNhapMatKhau(TaiKhoan);
      return;
    }
    SetIdDangDangNhap(TaiKhoan.Id);
    try {
      const NguoiDaDangNhap = await DangNhapBangTaiKhoanGhiNho(TaiKhoan);
      toast.success(`Chào mừng trở lại, ${NguoiDaDangNhap.HoTen}.`);
      DieuHuongSauDangNhap(NguoiDaDangNhap);
    } catch {
      SetDanhSachGhiNho(LayDanhSachTaiKhoanGhiNho());
      YeuCauNhapMatKhau(TaiKhoan);
      toast.info("Phiên ghi nhớ đã hết hạn. Vui lòng nhập mật khẩu.");
    } finally {
      SetIdDangDangNhap(null);
    }
  }

  function GoTaiKhoanGhiNho(TaiKhoan: TaiKhoanGhiNho) {
    XoaTaiKhoanGhiNho(TaiKhoan.Id);
    SetDanhSachGhiNho(LayDanhSachTaiKhoanGhiNho());
  }

  async function XuLyDangNhap(DuLieu: z.infer<typeof SchemaDangNhap>) {
    SetLoi("");
    try {
      const NguoiDungDaDangNhap = await DangNhapNoiBo(
        DuLieu.TenDangNhap,
        DuLieu.MatKhau,
        DuLieu.GhiNho,
      );
      toast.success("Đăng nhập thành công.");
      DieuHuongSauDangNhap(NguoiDungDaDangNhap);
    } catch (LoiDangNhap) {
      const ThongBao = LayThongBaoLoi(LoiDangNhap);
      SetLoi(ThongBao);
      toast.error(ThongBao);
    }
  }

  return (
    <KhungXacThuc>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-tally">
        Điều phối trường quay
      </p>
      <h2 className="mt-3 font-serif text-3xl">Chào mừng trở lại</h2>
      <p className="mt-2 text-sm text-fog">
        Đăng nhập để tiếp tục điều phối mọi ca quay của bạn.
      </p>

      {DanhSachGhiNho.length > 0 && (
        <section aria-label="Tài khoản đã ghi nhớ" className="mt-8">
          <p className="mb-3 text-sm font-semibold">Tài khoản đã ghi nhớ</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {DanhSachGhiNho.map((TaiKhoan) => (
              <li className="relative" key={TaiKhoan.Id}>
                <button
                  className="flex w-full flex-col items-center gap-2 rounded border border-rail bg-case-2 px-2 py-3 text-center transition hover:border-blueprint disabled:cursor-wait disabled:opacity-60"
                  disabled={IdDangDangNhap !== null}
                  onClick={() => void ChonTaiKhoanGhiNho(TaiKhoan)}
                  title={
                    TaiKhoan.Token
                      ? `Đăng nhập bằng ${TaiKhoan.TenDangNhap}`
                      : `Nhập mật khẩu cho ${TaiKhoan.TenDangNhap}`
                  }
                  type="button"
                >
                  <AnhDaiDien
                    DuongDan={TaiKhoan.AnhDaiDienUrl}
                    HoTen={TaiKhoan.HoTen}
                    KichThuoc="size-12"
                  />
                  <span className="w-full truncate text-xs font-semibold">
                    {TaiKhoan.HoTen}
                  </span>
                  <span className="w-full truncate text-[11px] text-fog">
                    {IdDangDangNhap === TaiKhoan.Id
                      ? "Đang đăng nhập…"
                      : TaiKhoan.LaQuanTriHeThong
                        ? CauHinh.TenHeThong
                        : (TaiKhoan.TenDonVi ?? "")}
                  </span>
                </button>
                <button
                  aria-label={`Gỡ ${TaiKhoan.HoTen} khỏi thiết bị này`}
                  className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-rail bg-case text-fog hover:text-paper"
                  onClick={() => GoTaiKhoanGhiNho(TaiKhoan)}
                  title="Gỡ khỏi thiết bị này"
                  type="button"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form className="mt-8 space-y-5" onSubmit={HandleSubmit(XuLyDangNhap)}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">
            Email hoặc tên đăng nhập
          </span>
          <input
            autoComplete="username"
            className="h-12 w-full rounded border border-rail bg-case-2 px-4 outline-none transition focus:border-blueprint focus:ring-2 focus:ring-blueprint/30"
            {...Register("TenDangNhap")}
            placeholder="Nhập email hoặc tên đăng nhập"
          />
          {Errors.TenDangNhap && (
            <p className="mt-1 text-sm text-tally">
              {Errors.TenDangNhap.message}
            </p>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Mật khẩu</span>
          <span className="relative block">
            <input
              autoComplete="current-password"
              className="h-12 w-full rounded border border-rail bg-case-2 px-4 pr-12 outline-none transition focus:border-blueprint focus:ring-2 focus:ring-blueprint/30"
              {...Register("MatKhau")}
              placeholder="Nhập mật khẩu"
              type={HienMatKhau ? "text" : "password"}
            />
            <button
              aria-label={HienMatKhau ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center text-fog hover:text-paper"
              onClick={() => SetHienMatKhau((GiaTri) => !GiaTri)}
              type="button"
            >
              {HienMatKhau ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {Errors.MatKhau && (
            <p className="mt-1 text-sm text-tally">{Errors.MatKhau.message}</p>
          )}
        </label>

        <div className="flex flex-wrap items-center justify-between gap-x-4 text-sm">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-fog">
            <input
              {...Register("GhiNho")}
              className="size-4 accent-tally"
              type="checkbox"
            />
            Ghi nhớ tôi
          </label>
          <Link
            className="inline-flex min-h-11 items-center text-fog hover:text-paper hover:underline"
            to="/quen-mat-khau"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {Loi && (
          <p
            className="rounded border border-tally/60 bg-tally/10 px-3 py-2 text-sm text-paper"
            role="alert"
          >
            {Loi}
          </p>
        )}

        <button
          className="h-12 w-full rounded-sm bg-tally px-4 font-semibold text-white transition hover:bg-[#d05236] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={IsSubmitting}
          type="submit"
        >
          {IsSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-fog">
        Tài khoản được quản lý bởi đơn vị của bạn.
      </p>
    </KhungXacThuc>
  );
}
