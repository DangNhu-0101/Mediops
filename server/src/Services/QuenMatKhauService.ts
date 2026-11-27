import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { CoSoDuLieu } from "../Config/Database.js";
import {
  DaCauHinhEmail,
  GuiEmailDatLaiMatKhau,
  LoiCauHinhEmail,
} from "./GuiEmailService.js";
import { LoiDuLieuKhongHopLe } from "./LoiNghiepVuService.js";
import { NgatKetNoiNguoiDung } from "./SocketService.js";

const SoPhutHieuLuc = 15;
const MucDichToken = "DatLaiMatKhau";
const KhoangChoGuiLaiMs = 60_000;
const ThongBaoLienKetKhongHopLe =
  "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại yêu cầu.";

// Lưu thời điểm gửi gần nhất theo email để hạn chế gửi thư liên tục.
const LanGuiGanNhat = new Map<string, number>();

export class LoiGuiQuaNhanh extends Error {}

function LayKhoaKy(MatKhauHash: string) {
  const KhoaBiMat = process.env.JWT_SECRET;
  if (!KhoaBiMat) throw new Error("Máy chủ chưa cấu hình khóa ký JWT");
  // Gắn mã băm mật khẩu hiện tại vào khóa ký: khi mật khẩu đổi, liên kết cũ tự mất hiệu lực.
  return `${KhoaBiMat}:${MatKhauHash}`;
}

function LayDiaChiGiaoDien() {
  return (process.env.CLIENT_URL ?? "http://localhost:5173").replace(
    /\/+$/,
    "",
  );
}

export async function YeuCauDatLaiMatKhau(Email: string) {
  if (!DaCauHinhEmail()) {
    throw new LoiCauHinhEmail(
      "Máy chủ chưa cấu hình gửi email. Vui lòng liên hệ quản lý đơn vị.",
    );
  }
  const EmailChuan = Email.trim().toLowerCase();
  const BayGio = Date.now();
  const LanTruoc = LanGuiGanNhat.get(EmailChuan);
  if (LanTruoc && BayGio - LanTruoc < KhoangChoGuiLaiMs) {
    throw new LoiGuiQuaNhanh(
      "Bạn vừa gửi yêu cầu. Vui lòng chờ một phút rồi thử lại.",
    );
  }
  LanGuiGanNhat.set(EmailChuan, BayGio);
  for (const [Khoa, ThoiDiem] of LanGuiGanNhat) {
    if (BayGio - ThoiDiem >= KhoangChoGuiLaiMs) LanGuiGanNhat.delete(Khoa);
  }

  const NguoiDung = await CoSoDuLieu.nguoiDung.findFirst({
    where: {
      Email: { equals: EmailChuan, mode: "insensitive" },
      LaQuanTriHeThong: false,
      DonVi: { DangHoatDong: true },
    },
    select: { Id: true, HoTen: true, Email: true, MatKhauHash: true },
  });
  // Không tiết lộ email có tồn tại hay không: luôn trả cùng một phản hồi.
  if (!NguoiDung) return;

  const Token = jwt.sign(
    { nguoiDungId: NguoiDung.Id, MucDich: MucDichToken },
    LayKhoaKy(NguoiDung.MatKhauHash),
    { expiresIn: `${SoPhutHieuLuc}m` },
  );
  const DuongDan = `${LayDiaChiGiaoDien()}/dat-lai-mat-khau?Token=${encodeURIComponent(Token)}`;
  GuiEmailDatLaiMatKhau({
    Email: NguoiDung.Email,
    HoTen: NguoiDung.HoTen,
    DuongDan,
    SoPhutHieuLuc,
  }).catch((Loi: unknown) => {
    console.error("Không gửi được email đặt lại mật khẩu:", Loi);
  });
}

async function GiaiMaToken(Token: string) {
  const DuLieuTho = jwt.decode(Token);
  if (
    !DuLieuTho ||
    typeof DuLieuTho === "string" ||
    typeof DuLieuTho.nguoiDungId !== "string" ||
    DuLieuTho.MucDich !== MucDichToken
  ) {
    throw new LoiDuLieuKhongHopLe(ThongBaoLienKetKhongHopLe);
  }
  const NguoiDung = await CoSoDuLieu.nguoiDung.findFirst({
    where: {
      Id: DuLieuTho.nguoiDungId,
      LaQuanTriHeThong: false,
      DonVi: { DangHoatDong: true },
    },
    select: { Id: true, MatKhauHash: true },
  });
  if (!NguoiDung) throw new LoiDuLieuKhongHopLe(ThongBaoLienKetKhongHopLe);
  try {
    jwt.verify(Token, LayKhoaKy(NguoiDung.MatKhauHash));
  } catch {
    throw new LoiDuLieuKhongHopLe(ThongBaoLienKetKhongHopLe);
  }
  return NguoiDung;
}

export async function KiemTraLienKetDatLai(Token: string) {
  await GiaiMaToken(Token);
}

export async function DatLaiMatKhauBangLienKet(Token: string, MatKhau: string) {
  const NguoiDung = await GiaiMaToken(Token);
  const MatKhauHash = await bcrypt.hash(MatKhau, 10);
  const KetQua = await CoSoDuLieu.nguoiDung.updateMany({
    where: { Id: NguoiDung.Id, MatKhauHash: NguoiDung.MatKhauHash },
    data: { MatKhauHash, PhienBanToken: { increment: 1 } },
  });
  if (!KetQua.count) throw new LoiDuLieuKhongHopLe(ThongBaoLienKetKhongHopLe);
  await NgatKetNoiNguoiDung(NguoiDung.Id);
}
