import { DonPhienHetHan } from "./Services/PhienQuyetDinhService.js";
import { TuyenPhienQuyetDinh } from "./Routes/PhienQuyetDinhRoute.js";
import { TuyenCauHinhCho } from "./Routes/CauHinhThoiGianChoRoute.js";
import { TuyenCauHinhHeThong } from "./Routes/CauHinhHeThongRoute.js";
import { TuyenNhomQuyen } from "./Routes/NhomQuyenRoute.js";
import { TuyenChucDanh } from "./Routes/ChucDanhRoute.js";
import { TuyenSuCoVanHanh } from "./Routes/SuCoVanHanhRoute.js";
import { KiemTraPhien } from "./Services/XacThucService.js";
import { PhamViCaQuay } from "./Services/QuyenService.js";
import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { createServer } from "node:http";
import cors from "cors";
import multer from "multer";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { TuyenXacThuc } from "./Routes/XacThucRoute.js";
import { TuyenDuAn } from "./Routes/DuAnRoute.js";
import { TuyenNhanSu } from "./Routes/NhanSuRoute.js";
import { TuyenPhongStudio } from "./Routes/PhongStudioRoute.js";
import { TuyenCaQuay } from "./Routes/CaQuayRoute.js";
import { TuyenThietBi } from "./Routes/ThietBiRoute.js";
import { TuyenVanHanhKho } from "./Routes/VanHanhKhoRoute.js";
import { TuyenNhatKy, TuyenSuCo } from "./Routes/SuCoRoute.js";
import {
  GanMayChuSocket,
  LayPhamViSocketHopLe,
} from "./Services/SocketService.js";
import { LoiTepAnhKhongHopLe } from "./Middlewares/TaiAnhThietBiMiddleware.js";
import { CoSoDuLieu } from "./Config/Database.js";
import { TuyenDonVi } from "./Routes/DonViRoute.js";
import { TuyenKho } from "./Routes/KhoRoute.js";
import { TuyenBangDieuKhien } from "./Routes/BangDieuKhienRoute.js";

const UngDung = express();
const MayChuHttp = createServer(UngDung);
const DiaChiChoPhep: Array<string | RegExp> = [
  process.env.CLIENT_URL ?? "http://localhost:5173",
  /\.vercel\.app$/,
];
UngDung.use(cors({ origin: DiaChiChoPhep, credentials: true }));
UngDung.use(express.json({ limit: "2mb" }));
export const Io = new Server(MayChuHttp, {
  cors: { origin: DiaChiChoPhep, methods: ["GET", "POST", "PUT"] },
});
GanMayChuSocket(Io);
Io.use(async (KetNoi, TiepTheo) => {
  const Token = KetNoi.handshake.auth.Token;
  const KhoaBiMat = process.env.JWT_SECRET;
  if (typeof Token !== "string" || !KhoaBiMat) {
    return TiepTheo(new Error("Chưa xác thực kết nối thời gian thực"));
  }
  try {
    const DuLieu = jwt.verify(Token, KhoaBiMat);
    if (typeof DuLieu === "string" || typeof DuLieu.nguoiDungId !== "string") {
      return TiepTheo(new Error("Mã xác thực không hợp lệ"));
    }
    if (!(await KiemTraPhien(DuLieu.nguoiDungId, DuLieu.PhienBan)))
      return TiepTheo(new Error("Phiên đăng nhập đã hết hiệu lực."));
    const PhamVi = await LayPhamViSocketHopLe(DuLieu.nguoiDungId);
    if (!PhamVi) {
      return TiepTheo(new Error("Không có quyền nhận dữ liệu đơn vị"));
    }
    KetNoi.data.NguoiDungId = DuLieu.nguoiDungId;
    KetNoi.data.PhienBan = DuLieu.PhienBan;
    KetNoi.data.DonViId = PhamVi.DonViId;
    return TiepTheo();
  } catch {
    return TiepTheo(new Error("Mã xác thực không hợp lệ hoặc đã hết hạn"));
  }
});
Io.on("connection", (KetNoi) => {
  const DonViId = String(KetNoi.data.DonViId);
  void KetNoi.join(`don_vi_${DonViId}`);
  KetNoi.on("tham_gia_ca_quay", async (CaQuayId: string) => {
    const NguoiDungId = KetNoi.data.NguoiDungId;
    const PhamVi =
      typeof NguoiDungId === "string"
        ? await LayPhamViSocketHopLe(NguoiDungId)
        : null;
    if (
      !PhamVi ||
      PhamVi.DonViId !== DonViId ||
      !(await KiemTraPhien(NguoiDungId, KetNoi.data.PhienBan))
    ) {
      KetNoi.disconnect(true);
      return;
    }
    const CaQuay = await CoSoDuLieu.caQuay.findFirst({
      where: {
        Id: CaQuayId,
        DuAn: { DonViId: DonViId },
        ...(PhamVi.Quyen.includes("CaQuay.Xem")
          ? {}
          : PhamViCaQuay(NguoiDungId)),
      },
      select: { Id: true },
    });
    if (CaQuay) await KetNoi.join(`ca_quay_${CaQuayId}`);
  });
});

UngDung.get("/api/ping", (YeuCau, PhanHoi) =>
  PhanHoi.status(200).json({
    TrangThai: "HOAT_DONG",
    ThoiGian: new Date().toISOString(),
  }),
);
UngDung.use("/api/xac-thuc", TuyenXacThuc);
UngDung.use("/api/quan-tri-he-thong/don-vi", TuyenDonVi);
UngDung.use("/api/du-an", TuyenDuAn);
UngDung.use("/api/nhan-su", TuyenNhanSu);
UngDung.use("/api/nhom-quyen", TuyenNhomQuyen);
UngDung.use("/api/chuc-danh", TuyenChucDanh);
UngDung.use("/api/phong-studio", TuyenPhongStudio);
UngDung.use("/api/ca-quay", TuyenCaQuay);
UngDung.use("/api/thiet-bi", TuyenThietBi);
UngDung.use("/api/kho", TuyenKho);
UngDung.use("/api/van-hanh-kho", TuyenVanHanhKho);
UngDung.use("/api/bang-dieu-khien", TuyenBangDieuKhien);
UngDung.use("/api/nhat-ky-muon-tra", TuyenNhatKy);
UngDung.use("/api/su-co-bao-tri", TuyenSuCo);
UngDung.use("/api/su-co-van-hanh", TuyenSuCoVanHanh);
UngDung.use("/api/phien-quyet-dinh", TuyenPhienQuyetDinh);
UngDung.use("/api/quan-tri-he-thong/thoi-gian-cho", TuyenCauHinhCho);
UngDung.use("/api/cau-hinh-he-thong", TuyenCauHinhHeThong);
UngDung.use((YeuCau, PhanHoi) =>
  PhanHoi.status(404).json({ ThongBao: "Không tìm thấy API" }),
);
UngDung.use(
  (
    Loi: unknown,
    YeuCau: Request,
    PhanHoi: Response,
    TiepTheo: NextFunction,
  ) => {
    console.error(
      "Yêu cầu thất bại:",
      Loi instanceof Error ? Loi.name : "Lỗi không xác định",
    );
    // Lỗi do express.json() sinh ra khi thân yêu cầu sai cú pháp hoặc quá lớn.
    const LoaiLoiThanYeuCau =
      typeof Loi === "object" && Loi !== null && "type" in Loi
        ? Loi.type
        : undefined;
    if (LoaiLoiThanYeuCau === "entity.parse.failed") {
      return PhanHoi.status(400).json({
        ThongBao: "Dữ liệu gửi lên không đúng định dạng JSON",
      });
    }
    if (LoaiLoiThanYeuCau === "entity.too.large") {
      return PhanHoi.status(413).json({
        ThongBao: "Dữ liệu gửi lên vượt quá dung lượng cho phép",
      });
    }
    if (
      Loi instanceof multer.MulterError ||
      Loi instanceof LoiTepAnhKhongHopLe
    ) {
      return PhanHoi.status(400).json({
        ThongBao:
          Loi instanceof multer.MulterError
            ? Loi.code === "LIMIT_FILE_SIZE"
              ? "Mỗi ảnh tải lên không được vượt quá 5 MB"
              : Loi.code === "LIMIT_FILE_COUNT"
                ? "Mỗi sự cố chỉ được đính kèm tối đa 5 ảnh"
                : Loi.code === "LIMIT_UNEXPECTED_FILE"
                  ? "Trường tệp tải lên không hợp lệ hoặc có quá nhiều ảnh"
                  : "Dữ liệu ảnh tải lên không hợp lệ"
            : Loi.message,
      });
    }
    const ThongBao =
      "Không thể xử lý yêu cầu. Vui lòng thử lại hoặc liên hệ quản trị viên.";
    PhanHoi.status(500).json({ ThongBao: ThongBao });
  },
);

if (!process.env.SYSTEM_ADMIN_USERNAME || !process.env.SYSTEM_ADMIN_PASSWORD)
  console.warn(
    "Chưa cấu hình đầy đủ SYSTEM_ADMIN_USERNAME và SYSTEM_ADMIN_PASSWORD; đăng nhập quản trị hệ thống chưa sẵn sàng.",
  );
const Cong = Number(process.env.PORT) || 5000;
MayChuHttp.listen(Cong, () =>
  console.log(`Máy chủ đang chạy tại cổng ${Cong}`),
);

setInterval(() => {
  void DonPhienHetHan().catch(() =>
    console.error(
      "Không thể dọn phiên hết hạn; kiểm tra hiệu lực tại truy vấn vẫn hoạt động.",
    ),
  );
}, 60_000).unref();
