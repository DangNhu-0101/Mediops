import type { Html5Qrcode } from "html5-qrcode";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  RotateCcw,
  ScanLine,
  Square,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type { PhuongThucQuet } from "../Services/VanHanhKhoService";

type TrangThaiQuet =
  | "cho"
  | "yeu_cau_camera"
  | "dang_quet"
  | "dang_tra_cuu"
  | "thanh_cong"
  | "khong_hop_le"
  | "loi_camera";

interface Camera {
  id: string;
  label: string;
}

interface TrinhQuetQRProps {
  OnTraCuu: (MaQR: string, PhuongThuc: PhuongThucQuet) => Promise<void>;
}

function TaoThongBaoLoiCamera(Loi: unknown) {
  const TenLoi =
    Loi instanceof Error ? `${Loi.name} ${Loi.message}` : String(Loi);
  if (/NotAllowedError|PermissionDenied|permission denied/i.test(TenLoi)) {
    return "Bạn chưa cho phép sử dụng camera. Hãy cấp quyền hoặc nhập mã QR thủ công.";
  }
  if (/NotFoundError|DevicesNotFound|no camera/i.test(TenLoi)) {
    return "Không tìm thấy camera trên thiết bị này. Hãy nhập mã QR thủ công.";
  }
  return "Không thể khởi động camera. Hãy thử lại hoặc nhập mã QR thủ công.";
}

export function TrinhQuetQR({ OnTraCuu: OnTraCuu }: TrinhQuetQRProps) {
  const MaVungQuet = useId().replace(/:/g, "");
  const MayQuet = useRef<Html5Qrcode | null>(null);
  const DangQuet = useRef(false);
  const DaHuy = useRef(false);
  const PhienQuet = useRef(0);
  const MaDangXuLy = useRef<string | null>(null);
  const MaVuaQuet = useRef<{ GiaTri: string; ThoiDiem: number } | null>(null);
  const [TrangThai, SetTrangThai] = useState<TrangThaiQuet>("cho");
  const [ThongBao, SetThongBao] = useState("");
  const [MaNhapTay, SetMaNhapTay] = useState("");
  const [DanhSachCamera, SetDanhSachCamera] = useState<Camera[]>([]);
  const [CameraDangChon, SetCameraDangChon] = useState("");

  const DungMayQuet = useCallback(async () => {
    PhienQuet.current += 1;
    const MayQuetHienTai = MayQuet.current;
    MayQuet.current = null;
    if (!MayQuetHienTai) return;
    try {
      if (DangQuet.current) await MayQuetHienTai.stop();
    } catch {
      // Camera đã dừng hoặc bị trình duyệt thu hồi quyền.
    } finally {
      DangQuet.current = false;
      try {
        await MayQuetHienTai.clear();
      } catch {
        // Vùng xem trước có thể đã bị tháo khi rời trang.
      }
    }
  }, []);

  const XuLyMaQR = useCallback(
    async (MaGoc: string, PhuongThuc: PhuongThucQuet) => {
      const MaQR = MaGoc.trim();
      if (!MaQR) {
        SetTrangThai("khong_hop_le");
        SetThongBao("Mã QR không được để trống.");
        return;
      }
      if (MaQR.length > 100) {
        SetTrangThai("khong_hop_le");
        SetThongBao("Mã QR không hợp lệ.");
        return;
      }
      const LucNay = Date.now();
      const LanQuetTruoc = MaVuaQuet.current;
      if (
        MaDangXuLy.current ||
        (LanQuetTruoc?.GiaTri === MaQR && LucNay - LanQuetTruoc.ThoiDiem < 1500)
      ) {
        return;
      }

      MaDangXuLy.current = MaQR;
      MaVuaQuet.current = { GiaTri: MaQR, ThoiDiem: LucNay };
      await DungMayQuet();
      if (DaHuy.current) return;
      SetTrangThai("dang_tra_cuu");
      SetThongBao("Đang xác minh thiết bị…");
      try {
        await OnTraCuu(MaQR, PhuongThuc);
        if (!DaHuy.current) {
          SetTrangThai("thanh_cong");
          SetThongBao("Đã nhận diện thiết bị.");
        }
      } catch (Loi) {
        if (!DaHuy.current) {
          SetTrangThai("khong_hop_le");
          const ThongBaoLoi = LayThongBaoLoi(Loi);
          SetThongBao(
            ThongBaoLoi === "Đã xảy ra lỗi. Vui lòng thử lại." &&
              Loi instanceof Error
              ? Loi.message
              : ThongBaoLoi,
          );
        }
      } finally {
        MaDangXuLy.current = null;
      }
    },
    [DungMayQuet, OnTraCuu],
  );

  const BatDauQuet = useCallback(
    async (MaCameraDaChon?: string) => {
      if (!window.isSecureContext) {
        SetTrangThai("loi_camera");
        SetThongBao(
          "Camera cần kết nối HTTPS. Hãy mở địa chỉ HTTPS của hệ thống hoặc nhập mã QR thủ công.",
        );
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        SetTrangThai("loi_camera");
        SetThongBao(
          "Trình duyệt này không hỗ trợ quét QR bằng camera. Hãy nhập mã QR thủ công.",
        );
        return;
      }
      await DungMayQuet();
      const PhienHienTai = PhienQuet.current + 1;
      PhienQuet.current = PhienHienTai;
      SetTrangThai("yeu_cau_camera");
      SetThongBao("Đang yêu cầu quyền sử dụng camera…");
      try {
        const { Html5Qrcode: LopMayQuet } = await import("html5-qrcode");
        if (DaHuy.current || PhienQuet.current !== PhienHienTai) return;
        const CameraNoiBo = await LopMayQuet.getCameras();
        if (DaHuy.current || PhienQuet.current !== PhienHienTai) return;
        if (CameraNoiBo.length === 0)
          throw new DOMException("Không có camera", "NotFoundError");
        const CameraUuTien =
          CameraNoiBo.find((Muc) => Muc.id === MaCameraDaChon) ??
          CameraNoiBo.find((Muc) => /back|rear|environment/i.test(Muc.label)) ??
          CameraNoiBo[0];
        if (!CameraUuTien)
          throw new DOMException("Không có camera", "NotFoundError");

        SetDanhSachCamera(CameraNoiBo);
        SetCameraDangChon(CameraUuTien.id);
        const MayQuetMoi = new LopMayQuet(MaVungQuet, { verbose: false });
        MayQuet.current = MayQuetMoi;
        await MayQuetMoi.start(
          MaCameraDaChon ? CameraUuTien.id : { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (Rong, Cao) => {
              const Canh = Math.floor(Math.min(Rong, Cao) * 0.72);
              return { width: Canh, height: Canh };
            },
            aspectRatio: 1,
          },
          (MaDaGiai) => void XuLyMaQR(MaDaGiai, "QUET_QR_CAMERA"),
          () => undefined,
        );
        if (DaHuy.current || PhienQuet.current !== PhienHienTai) {
          await MayQuetMoi.stop();
          MayQuetMoi.clear();
          return;
        }
        DangQuet.current = true;
        SetTrangThai("dang_quet");
        SetThongBao("Đưa mã QR vào trong khung để quét.");
      } catch (Loi) {
        const VanLaPhienHienTai = PhienQuet.current === PhienHienTai;
        await DungMayQuet();
        if (!DaHuy.current && VanLaPhienHienTai) {
          SetTrangThai("loi_camera");
          SetThongBao(TaoThongBaoLoiCamera(Loi));
        }
      }
    },
    [DungMayQuet, MaVungQuet, XuLyMaQR],
  );

  useEffect(() => {
    DaHuy.current = false;
    const DungKhiAnTrang = () => {
      if (document.hidden) void DungMayQuet().then(() => SetTrangThai("cho"));
    };
    const DungKhiRoiTrang = () => void DungMayQuet();
    document.addEventListener("visibilitychange", DungKhiAnTrang);
    window.addEventListener("pagehide", DungKhiRoiTrang);
    return () => {
      DaHuy.current = true;
      document.removeEventListener("visibilitychange", DungKhiAnTrang);
      window.removeEventListener("pagehide", DungKhiRoiTrang);
      void DungMayQuet();
    };
  }, [DungMayQuet]);

  function GuiMaNhapTay(SuKien: FormEvent<HTMLFormElement>) {
    SuKien.preventDefault();
    void XuLyMaQR(MaNhapTay, "NHAP_TAY");
  }

  const DangXuLy =
    TrangThai === "yeu_cau_camera" || TrangThai === "dang_tra_cuu";

  return (
    <section className="mt-6 rounded border border-rail bg-case p-4">
      <div className="flex items-start gap-3">
        <ScanLine aria-hidden className="mt-0.5 text-blueprint" size={20} />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-blueprint">
            Nhận diện thiết bị
          </p>
          <h2 className="mt-1 text-base font-semibold">Quét mã QR thiết bị</h2>
          <p className="mt-1 text-sm leading-6 text-fog">
            Chỉ nhận diện thiết bị; chưa phát sinh xuất hoặc nhập kho.
          </p>
        </div>
      </div>

      <div
        className={`relative mt-4 aspect-square overflow-hidden rounded border border-rail bg-gunmetal ${
          TrangThai === "dang_quet" || TrangThai === "yeu_cau_camera"
            ? ""
            : "hidden"
        }`}
      >
        <div className="absolute inset-0 grid place-items-center text-center text-sm text-fog">
          Đang mở camera…
        </div>
        <div className="relative z-10 size-full" id={MaVungQuet} />
        <div className="pointer-events-none absolute inset-1/2 z-20 size-56 max-h-[72%] max-w-[72%] -translate-x-1/2 -translate-y-1/2 border-2 border-paper/80">
          <div className="absolute inset-x-2 top-1/2 h-px bg-phosphor shadow-[0_0_12px_2px_rgba(111,158,119,0.65)] motion-safe:animate-pulse" />
        </div>
      </div>

      <div
        aria-live="polite"
        className="mt-4 rounded border border-rail bg-case-2 p-3 text-sm"
      >
        {TrangThai === "thanh_cong" ? (
          <p className="flex gap-2 text-phosphor">
            <CheckCircle2 aria-hidden className="shrink-0" size={18} />
            {ThongBao}
          </p>
        ) : TrangThai === "khong_hop_le" || TrangThai === "loi_camera" ? (
          <p className="flex gap-2 text-paper">
            <AlertCircle
              aria-hidden
              className="shrink-0 text-tally"
              size={18}
            />
            {ThongBao}
          </p>
        ) : (
          <p className="text-fog">
            {ThongBao || "Bắt đầu quét bằng camera hoặc nhập mã QR thủ công."}
          </p>
        )}
      </div>

      {TrangThai === "dang_quet" ? (
        <div className="mt-3 flex gap-2">
          <button
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded border border-rail text-sm text-fog"
            onClick={() => void DungMayQuet().then(() => SetTrangThai("cho"))}
            type="button"
          >
            <Square aria-hidden size={17} /> Dừng camera
          </button>
          {DanhSachCamera.length > 1 ? (
            <label className="sr-only" htmlFor={`${MaVungQuet}-camera`}>
              Chọn camera
            </label>
          ) : null}
          {DanhSachCamera.length > 1 ? (
            <select
              className="min-h-11 max-w-40 rounded border border-rail bg-case px-2 text-sm"
              id={`${MaVungQuet}-camera`}
              onChange={(SuKien) => void BatDauQuet(SuKien.target.value)}
              value={CameraDangChon}
            >
              {DanhSachCamera.map((CameraNoiBo, ChiSo) => (
                <option key={CameraNoiBo.id} value={CameraNoiBo.id}>
                  {CameraNoiBo.label || `Camera ${ChiSo + 1}`}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      ) : (
        <button
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold text-paper disabled:opacity-60"
          disabled={DangXuLy}
          onClick={() => void BatDauQuet()}
          type="button"
        >
          <Camera aria-hidden size={18} />{" "}
          {TrangThai === "thanh_cong" || TrangThai === "khong_hop_le"
            ? "Quét mã khác"
            : "Bắt đầu quét"}
        </button>
      )}

      <form className="mt-4 border-t border-rail pt-4" onSubmit={GuiMaNhapTay}>
        <label
          className="text-sm font-semibold"
          htmlFor={`${MaVungQuet}-ma-qr`}
        >
          Hoặc nhập mã QR
        </label>
        <div className="mt-2 flex gap-2">
          <input
            className="min-h-11 min-w-0 flex-1 rounded border border-rail bg-gunmetal px-3 text-base"
            disabled={DangXuLy}
            id={`${MaVungQuet}-ma-qr`}
            maxLength={100}
            onChange={(SuKien) => SetMaNhapTay(SuKien.target.value)}
            placeholder="Mã QR trên tem thiết bị"
            value={MaNhapTay}
          />
          <button
            className="min-h-11 shrink-0 rounded border border-rail px-3 text-sm font-semibold disabled:opacity-60"
            disabled={DangXuLy}
            type="submit"
          >
            Tra cứu
          </button>
        </div>
      </form>

      {(TrangThai === "thanh_cong" ||
        TrangThai === "khong_hop_le" ||
        TrangThai === "loi_camera") && (
        <button
          className="mt-3 flex min-h-11 items-center gap-2 text-sm text-fog"
          onClick={() => {
            SetThongBao("");
            SetTrangThai("cho");
            SetMaNhapTay("");
          }}
          type="button"
        >
          <RotateCcw aria-hidden size={16} /> Quét lại
        </button>
      )}
    </section>
  );
}
