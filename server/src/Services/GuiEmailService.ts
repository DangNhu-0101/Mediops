import nodemailer, { type Transporter } from "nodemailer";

// Lỗi khi máy chủ chưa cấu hình tài khoản Gmail dùng để gửi thư.
export class LoiCauHinhEmail extends Error {}

let BoGuiThu: Transporter | null = null;

export function DaCauHinhEmail() {
  return !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD;
}

function LayBoGuiThu() {
  const TaiKhoan = process.env.GMAIL_USER;
  const MatKhauUngDung = process.env.GMAIL_APP_PASSWORD;
  if (!TaiKhoan || !MatKhauUngDung) {
    throw new LoiCauHinhEmail(
      "Máy chủ chưa cấu hình gửi email. Vui lòng liên hệ quản lý đơn vị.",
    );
  }
  if (!BoGuiThu) {
    // Gmail yêu cầu mật khẩu ứng dụng (App Password) khi bật xác minh 2 bước.
    BoGuiThu = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: TaiKhoan,
        pass: MatKhauUngDung.replace(/\s+/g, ""),
      },
    });
  }
  return { BoGuiThu, TaiKhoan };
}

function ThoatHtml(GiaTri: string) {
  return GiaTri.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GuiEmailDatLaiMatKhau(ThongTin: {
  Email: string;
  HoTen: string;
  DuongDan: string;
  SoPhutHieuLuc: number;
}) {
  const { BoGuiThu: BoGui, TaiKhoan } = LayBoGuiThu();
  const HoTen = ThoatHtml(ThongTin.HoTen);
  const DuongDan = ThoatHtml(ThongTin.DuongDan);
  await BoGui.sendMail({
    from: `"MEDIOPS" <${TaiKhoan}>`,
    to: ThongTin.Email,
    subject: "Đặt lại mật khẩu MEDIOPS",
    text: [
      `Xin chào ${ThongTin.HoTen},`,
      "",
      "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.",
      `Mở liên kết sau để đặt mật khẩu mới (hiệu lực ${ThongTin.SoPhutHieuLuc} phút, chỉ dùng một lần):`,
      ThongTin.DuongDan,
      "",
      "Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu hiện tại vẫn giữ nguyên.",
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1f2328;line-height:1.6">
  <h2 style="margin:0 0 12px">Đặt lại mật khẩu</h2>
  <p>Xin chào <strong>${HoTen}</strong>,</p>
  <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản MEDIOPS của bạn.</p>
  <p style="margin:24px 0">
    <a href="${DuongDan}" style="background:#C4462B;color:#fff;padding:12px 20px;border-radius:4px;text-decoration:none;font-weight:600">Đặt mật khẩu mới</a>
  </p>
  <p>Liên kết có hiệu lực trong ${ThongTin.SoPhutHieuLuc} phút và chỉ dùng được một lần.</p>
  <p style="word-break:break-all;font-size:13px;color:#57606a">Nếu nút không hoạt động, hãy sao chép liên kết: ${DuongDan}</p>
  <p style="font-size:13px;color:#57606a">Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu hiện tại vẫn giữ nguyên.</p>
</div>`,
  });
}
