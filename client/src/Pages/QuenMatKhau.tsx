import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { z } from "zod";
import { KhungXacThuc } from "../Components/KhungXacThuc";
import { SchemaQuenMatKhau } from "../Schemas/BieuMau";
import {
  GuiYeuCauQuenMatKhau,
  LayThongBaoLoi,
} from "../Services/XacThucService";

export function QuenMatKhau() {
  const [Loi, SetLoi] = useState("");
  const [DaGui, SetDaGui] = useState("");
  const {
    register: Register,
    handleSubmit: HandleSubmit,
    getValues: GetValues,
    formState: { errors: Errors, isSubmitting: IsSubmitting },
  } = useForm<z.infer<typeof SchemaQuenMatKhau>>({
    resolver: zodResolver(SchemaQuenMatKhau),
    defaultValues: { Email: "" },
  });

  async function XuLyGui(DuLieu: z.infer<typeof SchemaQuenMatKhau>) {
    SetLoi("");
    try {
      const KetQua = await GuiYeuCauQuenMatKhau(DuLieu.Email);
      SetDaGui(KetQua.ThongBao);
      toast.success("Đã gửi yêu cầu đặt lại mật khẩu.");
    } catch (LoiGui) {
      const ThongBao = LayThongBaoLoi(LoiGui);
      SetLoi(ThongBao);
      toast.error(ThongBao);
    }
  }

  return (
    <KhungXacThuc>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-tally">
        Khôi phục tài khoản
      </p>
      <h2 className="mt-3 font-serif text-3xl">Quên mật khẩu</h2>
      <p className="mt-2 text-sm text-fog">
        Nhập email của tài khoản. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu qua
        Gmail.
      </p>

      {DaGui ? (
        <div
          className="mt-8 rounded border border-blueprint/50 bg-blueprint/10 p-4 text-sm"
          role="status"
        >
          <p className="flex items-center gap-2 font-semibold text-paper">
            <MailCheck size={18} aria-hidden="true" />
            Kiểm tra hộp thư của bạn
          </p>
          <p className="mt-2 leading-6 text-fog">{DaGui}</p>
          <p className="mt-2 break-all text-fog">
            Email: <span className="text-paper">{GetValues("Email")}</span>
          </p>
          <button
            className="mt-4 min-h-11 text-sm font-semibold text-blueprint hover:underline"
            onClick={() => SetDaGui("")}
            type="button"
          >
            Gửi lại hoặc dùng email khác
          </button>
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={HandleSubmit(XuLyGui)}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Email</span>
            <input
              autoComplete="email"
              className="h-12 w-full rounded border border-rail bg-case-2 px-4 outline-none transition focus:border-blueprint focus:ring-2 focus:ring-blueprint/30"
              inputMode="email"
              {...Register("Email")}
              placeholder="ten@vidu.vn"
              type="email"
            />
            {Errors.Email && (
              <p className="mt-1 text-sm text-tally">{Errors.Email.message}</p>
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
            {IsSubmitting ? "Đang gửi…" : "Gửi liên kết đặt lại"}
          </button>
        </form>
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
