import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { z } from "zod";
import { KhungXacThuc } from "../Components/KhungXacThuc";
import { SchemaDatLaiMatKhau } from "../Schemas/BieuMau";
import {
  GuiDatLaiMatKhau,
  KiemTraLienKetDatLai,
  LayThongBaoLoi,
} from "../Services/XacThucService";

type TrangThaiLienKet = "DangKiemTra" | "HopLe" | "KhongHopLe";

const LopONhap =
  "h-12 w-full rounded border border-rail bg-case-2 px-4 pr-12 outline-none transition focus:border-blueprint focus:ring-2 focus:ring-blueprint/30";

export function DatLaiMatKhau() {
  const [ThamSo] = useSearchParams();
  const Token = ThamSo.get("Token") ?? "";
  const DieuHuong = useNavigate();
  const [TrangThai, SetTrangThai] = useState<TrangThaiLienKet>(
    Token ? "DangKiemTra" : "KhongHopLe",
  );
  const [LoiLienKet, SetLoiLienKet] = useState(
    Token ? "" : "Liên kết đặt lại mật khẩu không hợp lệ.",
  );
  const [Loi, SetLoi] = useState("");
  const [HienMatKhau, SetHienMatKhau] = useState(false);
  const {
    register: Register,
    handleSubmit: HandleSubmit,
    formState: { errors: Errors, isSubmitting: IsSubmitting },
  } = useForm<z.infer<typeof SchemaDatLaiMatKhau>>({
    resolver: zodResolver(SchemaDatLaiMatKhau),
    defaultValues: { MatKhau: "", XacNhanMatKhau: "" },
  });

  useEffect(() => {
    if (!Token) return;
    let DaHuy = false;
    KiemTraLienKetDatLai(Token)
      .then(() => {
        if (!DaHuy) SetTrangThai("HopLe");
      })
      .catch((LoiKiemTra: unknown) => {
        if (DaHuy) return;
        SetLoiLienKet(LayThongBaoLoi(LoiKiemTra));
        SetTrangThai("KhongHopLe");
      });
    return () => {
      DaHuy = true;
    };
  }, [Token]);

  async function XuLyDatLai(DuLieu: z.infer<typeof SchemaDatLaiMatKhau>) {
    SetLoi("");
    try {
      const KetQua = await GuiDatLaiMatKhau(
        Token,
        DuLieu.MatKhau,
        DuLieu.XacNhanMatKhau,
      );
      toast.success(KetQua.ThongBao);
      DieuHuong("/dang-nhap", { replace: true });
    } catch (LoiDatLai) {
      const ThongBao = LayThongBaoLoi(LoiDatLai);
      SetLoi(ThongBao);
      toast.error(ThongBao);
    }
  }

  return (
    <KhungXacThuc>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-tally">
        Khôi phục tài khoản
      </p>
      <h2 className="mt-3 font-serif text-3xl">Đặt lại mật khẩu</h2>

      {TrangThai === "DangKiemTra" && (
        <p className="mt-6 text-sm text-fog" role="status">
          Đang kiểm tra liên kết…
        </p>
      )}

      {TrangThai === "KhongHopLe" && (
        <div className="mt-6 space-y-4">
          <p
            className="rounded border border-tally/60 bg-tally/10 px-3 py-2 text-sm text-paper"
            role="alert"
          >
            {LoiLienKet}
          </p>
          <Link
            className="flex h-12 w-full items-center justify-center rounded-sm bg-tally px-4 font-semibold text-white transition hover:bg-[#d05236]"
            to="/quen-mat-khau"
          >
            Gửi lại liên kết mới
          </Link>
        </div>
      )}

      {TrangThai === "HopLe" && (
        <>
          <p className="mt-2 text-sm text-fog">
            Đặt mật khẩu mới cho tài khoản. Các phiên đăng nhập cũ sẽ hết hiệu
            lực.
          </p>
          <form className="mt-8 space-y-5" onSubmit={HandleSubmit(XuLyDatLai)}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Mật khẩu mới
              </span>
              <span className="relative block">
                <input
                  autoComplete="new-password"
                  className={LopONhap}
                  {...Register("MatKhau")}
                  placeholder="Ít nhất 6 ký tự"
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
                <p className="mt-1 text-sm text-tally">
                  {Errors.MatKhau.message}
                </p>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Xác nhận mật khẩu mới
              </span>
              <input
                autoComplete="new-password"
                className={LopONhap}
                {...Register("XacNhanMatKhau")}
                placeholder="Nhập lại mật khẩu mới"
                type={HienMatKhau ? "text" : "password"}
              />
              {Errors.XacNhanMatKhau && (
                <p className="mt-1 text-sm text-tally">
                  {Errors.XacNhanMatKhau.message}
                </p>
              )}
            </label>

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
              {IsSubmitting ? "Đang lưu…" : "Lưu mật khẩu mới"}
            </button>
          </form>
        </>
      )}

      <Link
        className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm text-fog hover:text-paper"
        to="/dang-nhap"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Quay lại đăng nhập
      </Link>
    </KhungXacThuc>
  );
}
