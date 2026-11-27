import { ThietBiMuonNhieu, ViTriThietBi } from "../Components/DieuHuongKho";
import { BoLocDanhMucKho } from "../Components/BoLocDanhMucKho";
import { QuanLyThongTinBoSung } from "../Components/QuanLyThongTinBoSung";
import { ChonMauThietBi } from "../Components/ChonMauThietBi";
import {
  NhanTrangThaiHienThi,
  NhanTrangThaiThietBi,
  PhanTrangThongKe,
  SoLuongTongKho,
} from "../Components/ThongKeVanHanh";
import { LayTongKho } from "../Services/ThongKeVanHanhService";
import {
  LocMacDinh,
  type LocThongKe,
  type TongKho,
  type TrangThaiHienThi,
} from "../Types/ThongKeVanHanh";
import { CoQuyen } from "../Services/QuyenService";
import { ImagePlus, Pencil, Plus, Printer, Search, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { HopThoaiXacNhan } from "../Components/HopThoaiXacNhan";
import { HopThoaiBieuMau } from "../Components/HopThoaiBieuMau";
import { TemInQR } from "../Components/TemInQR";
import { useXacThuc } from "../Contexts/XacThucContext";
import {
  CapNhatThietBi,
  LayDanhMucThietBi,
  LayDanhSachThietBi,
  LayKhoLuaChon,
  TaoThietBi,
  XoaThietBi,
} from "../Services/ThietBiService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import { TheoDoiCapNhatLich } from "../Services/SocketLichService";
import type {
  DanhMucThietBi,
  DuLieuThietBi,
  ThietBi,
  TrangThaiThietBi,
  Kho,
} from "../Types/ThietBi";
import { SchemaThietBi } from "../Schemas/BieuMau";
import {
  ChuyenThanhCapDuLieu,
  ChuyenThanhDoiTuong,
  DanhSachTruongKyThuat,
  type CapDuLieuKyThuat,
} from "../Utils/DuLieuKyThuat";
import type { z } from "zod";
import { NutThemNhanh } from "../Components/NutThemNhanh";

const NhanTrangThai: Record<TrangThaiThietBi, string> = {
  SAN_SANG: "Đủ điều kiện sử dụng",
  DANG_SU_DUNG: "Đang sử dụng",
  BAO_TRI: "Bảo trì",
  HU_HONG: "Có hư hỏng — chặn cấp phát",
};
const DuLieuMacDinh: DuLieuThietBi = {
  MauThietBiId: "",
  TenThietBi: "",
  MaQR: "",
  SoSeri: "",
  DanhMucId: "",
  ThongSoKyThuat: "{}",
  TrangThai: "SAN_SANG",
  KhoId: "",
  ViTriKho: "",
  ThoiGianKiemTraSauSuDungPhut: "0",
};

function AnhThietBi({
  ThietBi: ThietBi,
  Lon: Lon = false,
}: {
  ThietBi: ThietBi;
  Lon?: boolean;
}) {
  const [LoiAnh, SetLoiAnh] = useState(false);
  return (
    <div
      className={`relative overflow-hidden bg-case-2 ${Lon ? "h-44" : "h-40"}`}
    >
      {ThietBi.HinhAnhUrl && !LoiAnh ? (
        <img
          alt={ThietBi.TenThietBi}
          className="size-full object-cover"
          onError={() => SetLoiAnh(true)}
          src={ThietBi.HinhAnhUrl}
        />
      ) : (
        <div className="grid size-full place-items-center text-fog">
          <ImagePlus size={32} />
          <span className="mt-2 text-xs">Chưa có ảnh</span>
        </div>
      )}
    </div>
  );
}

export function QuanLyThietBi() {
  const [ThamSoDuongDan, SetThamSoDuongDan] = useSearchParams();
  const DieuHuong = useNavigate();
  useEffect(() => {
    const TabCu = ThamSoDuongDan.get("Tab");
    if (["Theo model", "Dòng tài nguyên", "Danh mục"].includes(TabCu ?? "")) {
      DieuHuong(
        `/cai-dat/${TabCu === "Danh mục" ? "danh-muc" : "dong-tai-nguyen"}`,
        { replace: true },
      );
    }
  }, []);
  const { NguoiDung: NguoiDung } = useXacThuc();
  const CoQuyenQuanLy =
    CoQuyen(NguoiDung, "ThietBi.Sua") || CoQuyen(NguoiDung, "ThietBi.Xoa");
  const [DanhSach, SetDanhSach] = useState<ThietBi[]>([]);
  const [DanhMuc, SetDanhMuc] = useState<DanhMucThietBi[]>([]);
  const [DanhSachKho, SetDanhSachKho] = useState<Kho[]>([]);
  const [TimKiem, SetTimKiem] = useState(ThamSoDuongDan.get("TimKiem") ?? "");
  const [DanhMucId, SetDanhMucId] = useState(
    ThamSoDuongDan.get("DanhMucId") ?? "",
  );
  const [TrangThai, SetTrangThai] = useState<
    TrangThaiHienThi | "NGOAI_LE" | ""
  >(
    (ThamSoDuongDan.get("TrangThai") ?? "") as
      TrangThaiHienThi | "NGOAI_LE" | "",
  );
  const [LocKy, SetLocKy] = useState<LocThongKe>({
    ...LocMacDinh,
    KichThuoc: 12,
    Trang: Math.max(1, Number(ThamSoDuongDan.get("Trang")) || 1),
  });
  const [TongQuan, SetTongQuan] = useState<TongKho>();
  const [MauThietBiId, SetMauThietBiId] = useState(
    ThamSoDuongDan.get("MauThietBiId") ?? "",
  );
  const LanYeuCau = useRef(0);
  const [KhoId, SetKhoId] = useState(ThamSoDuongDan.get("KhoId") ?? "");
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");
  const [ThietBiDangSua, SetThietBiDangSua] = useState<ThietBi | null>(null);
  const [ThietBiCanXoa, SetThietBiCanXoa] = useState<ThietBi | null>(null);
  const [DuLieu, SetDuLieu] = useState<DuLieuThietBi>(DuLieuMacDinh);
  const [NguonAnh, SetNguonAnh] = useState<"tep" | "url">("tep");
  const [TepAnh, SetTepAnh] = useState<File>();
  const [DangGui, SetDangGui] = useState(false);
  const [IdDaChon, SetIdDaChon] = useState<Set<string>>(new Set());
  const [CacThongSo, SetCacThongSo] = useState<CapDuLieuKyThuat[]>([]);
  const {
    handleSubmit: HandleSubmit,
    reset: Reset,
    formState: { errors: Errors },
  } = useForm<z.infer<typeof SchemaThietBi>>({
    resolver: zodResolver(SchemaThietBi),
    defaultValues: DuLieuMacDinh,
  });

  useEffect(() => {
    const ThamSoMoi = new URLSearchParams();
    for (const Khoa of ["ChinhSua", "TaoMoi"]) {
      const GiaTri = ThamSoDuongDan.get(Khoa);
      if (GiaTri) ThamSoMoi.set(Khoa, GiaTri);
    }
    for (const [Khoa, GiaTri] of Object.entries({
      KhoId,
      DanhMucId,
      MauThietBiId,
      TimKiem,
      TrangThai,
      Trang: String(LocKy.Trang),
    }))
      if (GiaTri) ThamSoMoi.set(Khoa, GiaTri);
    SetThamSoDuongDan(ThamSoMoi, { replace: true });
  }, [
    KhoId,
    DanhMucId,
    MauThietBiId,
    TimKiem,
    TrangThai,
    LocKy.Trang,
    SetThamSoDuongDan,
  ]);
  async function TaiDuLieu() {
    const LanNay = ++LanYeuCau.current;
    SetDangTai(true);
    SetLoi("");
    try {
      const ThamSo = {
        ...LocKy,
        TimKiem: TimKiem || undefined,
        DanhMucId: DanhMucId || undefined,
        TrangThaiHienThi: TrangThai || undefined,
        KhoId: KhoId || undefined,
        MauThietBiId: MauThietBiId || undefined,
      };
      const [CacThietBi, ThongKe] = await Promise.all([
        LayDanhSachThietBi(ThamSo),
        LayTongKho(ThamSo),
      ]);
      if (LanNay !== LanYeuCau.current) return;
      SetDanhSach(CacThietBi);
      SetTongQuan(ThongKe);
    } catch (LoiTai) {
      if (LanNay === LanYeuCau.current) SetLoi(LayThongBaoLoi(LoiTai));
    } finally {
      if (LanNay === LanYeuCau.current) SetDangTai(false);
    }
  }
  useEffect(() => {
    void TaiDuLieu();
  }, [DanhMucId, TrangThai, KhoId, MauThietBiId, LocKy]);
  useEffect(
    () =>
      TheoDoiVanHanh(
        ["kho:xuat-kho", "kho:nhap-kho", "bao_tri:cap_nhat"],
        () => void TaiDuLieu(),
      ),
    [DanhMucId, TrangThai, TimKiem, KhoId, MauThietBiId, LocKy],
  );
  useEffect(() => {
    Promise.all([LayDanhMucThietBi(), LayKhoLuaChon()])
      .then(([DanhMucMoi, DanhSachKhoMoi]) => {
        SetDanhMuc(DanhMucMoi);
        SetDanhSachKho(DanhSachKhoMoi);
      })
      .catch((LoiTai) => SetLoi(LayThongBaoLoi(LoiTai)));
  }, []);
  useEffect(
    () => TheoDoiCapNhatLich(() => void TaiDuLieu()),
    [DanhMucId, TrangThai, TimKiem, KhoId, MauThietBiId, LocKy],
  );
  const DaMoTuDuongDan = useRef(false);
  useEffect(() => {
    if (DaMoTuDuongDan.current || DangTai) return;
    const IdCanSua = ThamSoDuongDan.get("ChinhSua");
    const May = DanhSach.find((Muc) => Muc.Id === IdCanSua);
    if (May && CoQuyen(NguoiDung, "ThietBi.Sua")) {
      DaMoTuDuongDan.current = true;
      MoChinhSua(May);
    } else if (
      ThamSoDuongDan.get("TaoMoi") === "1" &&
      CoQuyen(NguoiDung, "ThietBi.Tao")
    ) {
      DaMoTuDuongDan.current = true;
      MoTaoMoi();
    }
  }, [DanhSach, DangTai, ThamSoDuongDan, NguoiDung]);
  function MoTaoMoi() {
    SetThietBiDangSua({} as ThietBi);
    SetDuLieu({
      ...DuLieuMacDinh,
      KhoId: KhoId && KhoId !== "CHUA_GAN" ? KhoId : "",
    });
    SetNguonAnh("tep");
    SetTepAnh(undefined);
    SetCacThongSo([]);
    Reset({
      ...DuLieuMacDinh,
      KhoId: KhoId && KhoId !== "CHUA_GAN" ? KhoId : "",
    });
  }
  function MoChinhSua(ThietBi: ThietBi) {
    SetThietBiDangSua(ThietBi);
    SetDuLieu({
      MaQR: ThietBi.MaQR,
      SoSeri: ThietBi.SoSeri,
      TenThietBi: ThietBi.TenThietBi,
      DanhMucId: ThietBi.DanhMucId,
      MauThietBiId: ThietBi.MauThietBiId ?? "",
      ThongSoKyThuat: JSON.stringify(ThietBi.ThongSoKyThuat, null, 2),
      TrangThai: ThietBi.TrangThai,
      KhoId: ThietBi.KhoId ?? "",
      ViTriKho: ThietBi.ViTriKho ?? "",
      ThoiGianKiemTraSauSuDungPhut: String(
        ThietBi.ThoiGianKiemTraSauSuDungPhut,
      ),
    });
    SetNguonAnh("tep");
    SetTepAnh(undefined);
    SetCacThongSo(ChuyenThanhCapDuLieu(ThietBi.ThongSoKyThuat));
    Reset({
      MaQR: ThietBi.MaQR,
      SoSeri: ThietBi.SoSeri,
      TenThietBi: ThietBi.TenThietBi,
      DanhMucId: ThietBi.DanhMucId,
      MauThietBiId: ThietBi.MauThietBiId ?? "",
      ThongSoKyThuat: JSON.stringify(ThietBi.ThongSoKyThuat, null, 2),
      TrangThai: ThietBi.TrangThai,
      KhoId: ThietBi.KhoId ?? "",
      HinhAnhUrl: "",
      ViTriKho: ThietBi.ViTriKho ?? "",
      ThoiGianKiemTraSauSuDungPhut: String(
        ThietBi.ThoiGianKiemTraSauSuDungPhut,
      ),
    });
  }
  function CapNhatThongSo(CacCapMoi: CapDuLieuKyThuat[]) {
    SetCacThongSo(CacCapMoi);
    const DuLieuMoi = {
      ...DuLieu,
      ThongSoKyThuat: JSON.stringify(ChuyenThanhDoiTuong(CacCapMoi)),
    };
    SetDuLieu(DuLieuMoi);
    Reset({ ...DuLieuMoi, HinhAnhUrl: DuLieuMoi.HinhAnhUrl ?? "" });
  }
  async function LuuThietBi() {
    SetDangGui(true);
    try {
      if (ThietBiDangSua?.Id)
        await CapNhatThietBi(ThietBiDangSua.Id, DuLieu, TepAnh);
      else await TaoThietBi(DuLieu, TepAnh);
      toast.success(
        ThietBiDangSua?.Id
          ? "Cập nhật thiết bị thành công."
          : "Tạo thiết bị thành công.",
      );
      SetThietBiDangSua(null);
      await TaiDuLieu();
    } catch (LoiLuu) {
      toast.error(LayThongBaoLoi(LoiLuu));
    } finally {
      SetDangGui(false);
    }
  }
  async function XacNhanXoa() {
    if (!ThietBiCanXoa) return;
    SetDangGui(true);
    try {
      await XoaThietBi(ThietBiCanXoa.Id);
      toast.success("Đã xóa thiết bị.");
      SetThietBiCanXoa(null);
      await TaiDuLieu();
    } catch (LoiXoa) {
      toast.error(LayThongBaoLoi(LoiXoa));
    } finally {
      SetDangGui(false);
    }
  }
  const DanhSachDaChon = DanhSach.filter((ThietBi) => IdDaChon.has(ThietBi.Id));
  const DaChonTatCa =
    DanhSach.length > 0 && DanhSachDaChon.length === DanhSach.length;

  function ChuyenTrangThaiChon(Id: string) {
    SetIdDaChon((IdHienTai) => {
      const IdMoi = new Set(IdHienTai);
      if (IdMoi.has(Id)) IdMoi.delete(Id);
      else IdMoi.add(Id);
      return IdMoi;
    });
  }

  function ChonTatCa() {
    SetIdDaChon(
      DaChonTatCa ? new Set() : new Set(DanhSach.map((ThietBi) => ThietBi.Id)),
    );
  }
  const XemTruocAnh = TepAnh
    ? URL.createObjectURL(TepAnh)
    : NguonAnh === "url"
      ? DuLieu.HinhAnhUrl
      : ThietBiDangSua?.HinhAnhUrl;
  const KhoDangHienThi = ThietBiDangSua?.Kho;
  const DanhSachKhoChon =
    KhoDangHienThi && !DanhSachKho.some((Kho) => Kho.Id === KhoDangHienThi.Id)
      ? [...DanhSachKho, KhoDangHienThi]
      : DanhSachKho;
  return (
    <section className="quan-ly-thiet-bi">
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: white !important; }
          body * { visibility: hidden; }
          .khu-vuc-in-hang-loat, .khu-vuc-in-hang-loat * { visibility: visible; }
          .khu-vuc-in-hang-loat { display: block !important; position: absolute; inset: 0; width: 100%; }
          .luoi-tem-a4 { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 5mm !important; }
          .luoi-tem-a4 .tem-in-qr { box-sizing: border-box; min-height: 45mm; border: 0.25mm solid #000; break-inside: avoid; }
        }
      `}</style>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mt-2 font-serif text-2xl md:text-3xl">Kho thiết bị</h1>
          <p className="mt-2 text-sm text-fog">
            Theo dõi tài sản, tình trạng và vị trí lưu kho.
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          {DanhSachDaChon.length > 0 && (
            <button
              className="flex min-h-11 items-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold"
              onClick={() => window.print()}
              type="button"
            >
              <Printer size={17} />
              In mã QR ({DanhSachDaChon.length})
            </button>
          )}
          {CoQuyen(NguoiDung, "ThietBi.Tao") && (
            <NutThemNhanh Loai="ThietBi" OnThanhCong={() => void TaiDuLieu()} />
          )}
          {CoQuyen(NguoiDung, "ThietBi.Tao") && (
            <button
              className="flex min-h-11 items-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold"
              onClick={MoTaoMoi}
              type="button"
            >
              <Plus size={17} />
              Thêm thiết bị
            </button>
          )}
        </div>
      </header>
      <form
        className="mb-5 flex gap-2"
        onSubmit={(E) => {
          E.preventDefault();
          SetLocKy({ ...LocKy, Trang: 1 });
        }}
      >
        <label className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="absolute left-3 top-3 text-fog"
            size={18}
          />
          <input
            aria-label="Tìm kiếm tài nguyên"
            className="min-h-11 w-full rounded border border-rail bg-case-2 pl-10 pr-3 text-base"
            placeholder="Tên máy, mã QR, seri, dòng tài nguyên, danh mục hoặc kho…"
            value={TimKiem}
            onChange={(E) => SetTimKiem(E.target.value)}
          />
        </label>
        <button className="min-h-11 rounded border border-rail px-4 text-sm">
          Tìm kiếm
        </button>
      </form>
      <div className="mb-5 flex flex-wrap gap-3">
        <BoLocDanhMucKho
          DanhMuc={DanhMuc}
          DanhMucId={DanhMucId}
          MauThietBiId={MauThietBiId}
          OnChon={(DanhMucMoi, DongMoi) => {
            SetDanhMucId(DanhMucMoi);
            SetMauThietBiId(DongMoi);
            SetLocKy({ ...LocKy, Trang: 1 });
          }}
        />
        <label className="min-w-0 flex-1 text-sm sm:max-w-56">
          Trạng thái
          <select
            className="mt-2 min-h-11 w-full rounded border border-rail bg-case px-3"
            value={TrangThai}
            onChange={(E) => {
              SetTrangThai(E.target.value as typeof TrangThai);
              SetLocKy({ ...LocKy, Trang: 1 });
            }}
          >
            <option value="">Tất cả</option>
            {Object.entries(NhanTrangThaiHienThi).map(([Id, Ten]) => (
              <option key={Id} value={Id}>
                {Ten}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 flex-1 text-sm sm:max-w-56">
          Kho
          <select
            className="mt-2 min-h-11 w-full rounded border border-rail bg-case px-3"
            value={KhoId}
            onChange={(E) => {
              SetKhoId(E.target.value);
              SetLocKy({ ...LocKy, Trang: 1 });
            }}
          >
            <option value="">Tất cả kho</option>
            {DanhSachKho.map((Kho) => (
              <option key={Kho.Id} value={Kho.Id}>
                {Kho.TenKho}
              </option>
            ))}
            <option value="CHUA_GAN">Chưa gán kho</option>
          </select>
        </label>
      </div>
      <div
        className={`grid min-w-0 gap-5 ${
          CoQuyen(NguoiDung, "NhatKy.Xem")
            ? "xl:grid-cols-[minmax(0,1fr)_300px]"
            : ""
        }`}
      >
        <div className="min-w-0">
          {TongQuan && (
            <section
              aria-label="Tổng quan kho"
              className="mb-5 rounded border border-rail p-3"
            >
              <h2 className="text-sm font-semibold">
                Tổng quan kho · {TongQuan.ThongKe.TongSo} thiết bị
              </h2>
              <SoLuongTongKho DuLieu={TongQuan.ThongKe} />
              <p className="mt-2 text-xs text-fog">
                {TongQuan.ChuaGanKho} máy chưa gán kho trên toàn đơn vị.
              </p>
            </section>
          )}
          {!DangTai && !Loi && DanhSach.length > 0 && (
            <div className="no-print mb-4 flex items-center gap-3 text-sm text-fog">
              <label className="flex min-h-11 items-center gap-2">
                <input
                  checked={DaChonTatCa}
                  onChange={ChonTatCa}
                  type="checkbox"
                />
                Chọn tất cả thiết bị đang hiển thị
              </label>
              {DanhSachDaChon.length > 0 && (
                <span>Đã chọn {DanhSachDaChon.length} thiết bị</span>
              )}
            </div>
          )}
          {DangTai ? (
            <p className="py-12 text-center text-fog">Đang tải thiết bị…</p>
          ) : Loi ? (
            <div className="rounded border border-tally/60 bg-tally/10 p-4 text-sm">
              {Loi}
            </div>
          ) : DanhSach.length === 0 ? (
            <div className="rounded border border-rail bg-case p-8 text-center text-fog">
              Chưa có thiết bị phù hợp.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {DanhSach.map((ThietBi) => (
                <article
                  className="overflow-hidden rounded border border-rail bg-case"
                  key={ThietBi.Id}
                >
                  <AnhThietBi ThietBi={ThietBi} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <input
                          aria-label={`Chọn ${ThietBi.TenThietBi} để in mã QR`}
                          checked={IdDaChon.has(ThietBi.Id)}
                          className="no-print mt-1 size-4 shrink-0 accent-tally"
                          onChange={() => ChuyenTrangThaiChon(ThietBi.Id)}
                          type="checkbox"
                        />
                        <div>
                          <h2 className="font-semibold">
                            {ThietBi.TenThietBi}
                          </h2>
                          <p className="mt-1 font-mono text-xs text-fog">
                            {ThietBi.MaQR} · {ThietBi.SoSeri}
                          </p>
                        </div>
                      </div>
                      <NhanTrangThaiThietBi
                        TrangThai={ThietBi.TrangThaiHienThi}
                        CanhBao={ThietBi.CanhBao}
                      />
                    </div>
                    <p className="mt-4 text-sm text-fog">
                      {ThietBi.DanhMuc.TenDanhMuc}
                    </p>
                    <p className="mt-1 text-sm text-fog">
                      Dòng tài nguyên:{" "}
                      {ThietBi.MauThietBi?.TenMau ??
                        "Chưa xác định dòng tài nguyên"}
                    </p>
                    {ThietBi.CanhBao?.map((CanhBao) => (
                      <p className="mt-1 text-xs text-timecode" key={CanhBao}>
                        {CanhBao}
                      </p>
                    ))}
                    {TongQuan?.DanhSach.find(
                      (May) => May.Id === ThietBi.Id,
                    ) && (
                      <ViTriThietBi
                        May={TongQuan.DanhSach.find(
                          (May) => May.Id === ThietBi.Id,
                        )!}
                      />
                    )}
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <Link
                        aria-label={`Xem chi tiết ${ThietBi.TenThietBi}`}
                        className="inline-flex min-h-11 items-center rounded border border-rail px-3 text-sm text-fog hover:text-paper"
                        to={`/thiet-bi/${ThietBi.Id}`}
                      >
                        Xem chi tiết
                      </Link>
                      {CoQuyenQuanLy && (
                        <>
                          {CoQuyen(NguoiDung, "ThietBi.Sua") && (
                            <QuanLyThongTinBoSung
                              Nhom="thiet-bi"
                              Id={ThietBi.Id}
                              Ten={ThietBi.TenThietBi}
                            />
                          )}
                          <button
                            hidden={!CoQuyen(NguoiDung, "ThietBi.Sua")}
                            aria-label={`Chỉnh sửa ${ThietBi.TenThietBi}`}
                            className="grid size-11 place-items-center rounded border border-rail text-fog hover:text-paper"
                            onClick={() => MoChinhSua(ThietBi)}
                            type="button"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            hidden={!CoQuyen(NguoiDung, "ThietBi.Xoa")}
                            aria-label={`Xóa ${ThietBi.TenThietBi}`}
                            className="grid size-11 place-items-center rounded border border-rail text-tally"
                            onClick={() => SetThietBiCanXoa(ThietBi)}
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {!DangTai && !Loi && TongQuan && (
            <PhanTrangThongKe
              Trang={LocKy.Trang}
              KichThuoc={LocKy.KichThuoc}
              TongSo={TongQuan.TongSo}
              OnDoi={(Trang) => SetLocKy({ ...LocKy, Trang })}
            />
          )}
        </div>
        {CoQuyen(NguoiDung, "NhatKy.Xem") && (
          <ThietBiMuonNhieu
            key={TongQuan?.Ky.HienTai}
            KhoId={KhoId || undefined}
            DanhMucId={DanhMucId || undefined}
            MauThietBiId={MauThietBiId || undefined}
          />
        )}
      </div>
      {DanhSachDaChon.length > 0 && (
        <div className="khu-vuc-in-hang-loat hidden">
          <div className="luoi-tem-a4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DanhSachDaChon.map((ThietBi) => (
              <TemInQR key={ThietBi.Id} ThietBi={ThietBi} />
            ))}
          </div>
        </div>
      )}
      {ThietBiDangSua && (
        <HopThoaiBieuMau
          DangXuLy={DangGui}
          KichThuoc="rong"
          OnDong={() => SetThietBiDangSua(null)}
          TieuDe={ThietBiDangSua.Id ? "Chỉnh sửa thiết bị" : "Thêm thiết bị"}
        >
          <form className="mt-5" onSubmit={HandleSubmit(LuuThietBi)}>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["TenThietBi", "Tên thiết bị", true],
                  ["MaQR", "Mã QR", false],
                  ["SoSeri", "Số seri", true],
                  ["ViTriKho", "Vị trí trong kho (kệ, tủ, ngăn)", false],
                ] as const
              ).map(([Truong, Nhan, BatBuoc]) => (
                <label key={Truong}>
                  <span className="mb-2 block text-sm">
                    {Nhan}
                    {BatBuoc ? " *" : ""}
                  </span>
                  <input
                    className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                    required={BatBuoc}
                    value={DuLieu[Truong] ?? ""}
                    onChange={(E) => {
                      const DuLieuMoi = { ...DuLieu, [Truong]: E.target.value };
                      SetDuLieu(DuLieuMoi);
                      Reset({
                        ...DuLieuMoi,
                        HinhAnhUrl: DuLieuMoi.HinhAnhUrl ?? "",
                      });
                    }}
                  />
                  {Errors[Truong] && (
                    <p className="mt-1 text-sm text-tally">
                      {Errors[Truong]?.message}
                    </p>
                  )}
                </label>
              ))}
              <label>
                <span className="mb-2 block text-sm">Kho quản lý *</span>
                <select
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  required
                  value={DuLieu.KhoId ?? ""}
                  onChange={(E) => {
                    const DuLieuMoi = { ...DuLieu, KhoId: E.target.value };
                    SetDuLieu(DuLieuMoi);
                    Reset({
                      ...DuLieuMoi,
                      HinhAnhUrl: DuLieuMoi.HinhAnhUrl ?? "",
                    });
                  }}
                >
                  <option value="">Chọn kho</option>
                  {DanhSachKhoChon.map((Kho) => (
                    <option
                      key={Kho.Id}
                      value={Kho.Id}
                      disabled={
                        "DangHoatDong" in Kho &&
                        !Kho.DangHoatDong &&
                        Kho.Id !== ThietBiDangSua?.KhoId
                      }
                    >
                      {Kho.TenKho}
                      {"DangHoatDong" in Kho && !Kho.DangHoatDong
                        ? " (đã vô hiệu hóa)"
                        : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-fog">
                  Kho là nơi lưu trữ vật lý; vị trí trong kho là kệ, tủ hoặc
                  ngăn cụ thể.
                </p>
                {Errors.KhoId && (
                  <p className="mt-1 text-sm text-tally">
                    {Errors.KhoId.message}
                  </p>
                )}
              </label>
              <label>
                <span className="mb-2 block text-sm">Danh mục *</span>
                <select
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  required
                  value={DuLieu.DanhMucId}
                  onChange={(E) => {
                    const DuLieuMoi = {
                      ...DuLieu,
                      DanhMucId: E.target.value,
                      MauThietBiId: "",
                    };
                    SetDuLieu(DuLieuMoi);
                    Reset({
                      ...DuLieuMoi,
                      HinhAnhUrl: DuLieuMoi.HinhAnhUrl ?? "",
                    });
                  }}
                >
                  <option value="">Chọn danh mục</option>
                  {DanhMuc.map((Muc) => (
                    <option key={Muc.Id} value={Muc.Id}>
                      {Muc.TenDanhMuc}
                    </option>
                  ))}
                </select>
              </label>
              {Errors.DanhMucId && (
                <p className="text-sm text-tally">{Errors.DanhMucId.message}</p>
              )}
              <ChonMauThietBi
                DanhMucId={DuLieu.DanhMucId}
                GiaTri={DuLieu.MauThietBiId ?? ""}
                ChoPhepTao={CoQuyen(NguoiDung, "ThietBi.Tao")}
                OnDoi={(Id) => {
                  const Moi = { ...DuLieu, MauThietBiId: Id };
                  SetDuLieu(Moi);
                  Reset({ ...Moi, HinhAnhUrl: Moi.HinhAnhUrl ?? "" });
                }}
              />
              <label>
                <span className="mb-2 block text-sm">Tình trạng vận hành</span>
                <select
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  value={DuLieu.TrangThai}
                  onChange={(E) => {
                    const DuLieuMoi = {
                      ...DuLieu,
                      TrangThai: E.target.value as TrangThaiThietBi,
                    };
                    SetDuLieu(DuLieuMoi);
                    Reset({
                      ...DuLieuMoi,
                      HinhAnhUrl: DuLieuMoi.HinhAnhUrl ?? "",
                    });
                  }}
                >
                  {Object.entries(NhanTrangThai).map(([GiaTri, Nhan]) => (
                    <option key={GiaTri} value={GiaTri}>
                      {Nhan}
                    </option>
                  ))}
                </select>
              </label>
              {Errors.TrangThai && (
                <p className="text-sm text-tally">{Errors.TrangThai.message}</p>
              )}
              <label>
                <span className="mb-2 block text-sm">
                  Phút kiểm tra sau sử dụng
                </span>
                <input
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  min="0"
                  type="number"
                  value={DuLieu.ThoiGianKiemTraSauSuDungPhut ?? ""}
                  onChange={(E) => {
                    const DuLieuMoi = {
                      ...DuLieu,
                      ThoiGianKiemTraSauSuDungPhut: E.target.value,
                    };
                    SetDuLieu(DuLieuMoi);
                    Reset({
                      ...DuLieuMoi,
                      HinhAnhUrl: DuLieuMoi.HinhAnhUrl ?? "",
                    });
                  }}
                />
              </label>
              {Errors.ThoiGianKiemTraSauSuDungPhut && (
                <p className="text-sm text-tally">
                  {Errors.ThoiGianKiemTraSauSuDungPhut.message}
                </p>
              )}
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-sm">Thông số kỹ thuật</legend>
                <p className="mb-3 text-xs text-fog">
                  Thêm từng thông số để người dùng dễ đọc và tra cứu.
                </p>
                <div className="space-y-2">
                  {CacThongSo.map((ThongSo, ChiSo) => (
                    <div
                      className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                      key={ChiSo}
                    >
                      <select
                        aria-label="Tên thông số"
                        className="h-11 rounded border border-rail bg-case-2 px-3"
                        onChange={(E) => {
                          const Moi = [...CacThongSo];
                          Moi[ChiSo] = { ...ThongSo, Khoa: E.target.value };
                          CapNhatThongSo(Moi);
                        }}
                        value={ThongSo.Khoa}
                      >
                        <option value="">Chọn thông số</option>
                        {DanhSachTruongKyThuat.map((Truong) => (
                          <option key={Truong.Khoa} value={Truong.Khoa}>
                            {Truong.Nhan}
                          </option>
                        ))}
                      </select>
                      <input
                        aria-label="Giá trị thông số"
                        className="h-11 rounded border border-rail bg-case-2 px-3"
                        onChange={(E) => {
                          const Moi = [...CacThongSo];
                          Moi[ChiSo] = { ...ThongSo, GiaTri: E.target.value };
                          CapNhatThongSo(Moi);
                        }}
                        placeholder="Giá trị"
                        value={ThongSo.GiaTri}
                      />
                      <button
                        aria-label="Xóa thông số"
                        className="rounded border border-rail px-3 text-tally"
                        onClick={() =>
                          CapNhatThongSo(
                            CacThongSo.filter(
                              (BoQua, ViTri) => ViTri !== ChiSo,
                            ),
                          )
                        }
                        type="button"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-3 rounded border border-rail px-3 py-2 text-sm text-fog"
                  onClick={() =>
                    CapNhatThongSo([...CacThongSo, { Khoa: "", GiaTri: "" }])
                  }
                  type="button"
                >
                  Thêm thông số
                </button>
              </fieldset>
              {Errors.ThongSoKyThuat && (
                <p className="text-sm text-tally">
                  {Errors.ThongSoKyThuat.message}
                </p>
              )}
            </div>
            <fieldset className="mt-5 border-t border-rail pt-4">
              <legend className="px-1 text-sm">Nguồn ảnh</legend>
              <div className="flex gap-4 text-sm">
                <label>
                  <input
                    checked={NguonAnh === "tep"}
                    name="nguon-anh"
                    onChange={() => {
                      SetNguonAnh("tep");
                      SetDuLieu({ ...DuLieu, HinhAnhUrl: undefined });
                    }}
                    type="radio"
                  />{" "}
                  Tải ảnh từ máy
                </label>
                <label>
                  <input
                    checked={NguonAnh === "url"}
                    name="nguon-anh"
                    onChange={() => {
                      SetNguonAnh("url");
                      SetTepAnh(undefined);
                    }}
                    type="radio"
                  />{" "}
                  Nhập URL ảnh
                </label>
              </div>
              {NguonAnh === "tep" ? (
                <input
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="mt-3 block w-full text-sm text-fog"
                  onChange={(E) => {
                    const Tep = E.target.files?.[0];
                    if (
                      Tep &&
                      (!Tep.type.match(/^image\/(jpeg|png|webp|gif)$/) ||
                        Tep.size > 5 * 1024 * 1024)
                    ) {
                      toast.error(
                        "Ảnh phải là JPG, PNG, WEBP hoặc GIF và không quá 5 MB.",
                      );
                      E.target.value = "";
                      return;
                    }
                    SetTepAnh(Tep);
                  }}
                  type="file"
                />
              ) : (
                <>
                  <input
                    className="mt-3 h-11 w-full rounded border border-rail bg-case-2 px-3"
                    placeholder="https://..."
                    type="url"
                    value={DuLieu.HinhAnhUrl ?? ""}
                    onChange={(E) => {
                      const DuLieuMoi = {
                        ...DuLieu,
                        HinhAnhUrl: E.target.value,
                      };
                      SetDuLieu(DuLieuMoi);
                      Reset({
                        ...DuLieuMoi,
                        HinhAnhUrl: DuLieuMoi.HinhAnhUrl ?? "",
                      });
                    }}
                  />
                  {Errors.HinhAnhUrl && (
                    <p className="mt-1 text-sm text-tally">
                      {Errors.HinhAnhUrl.message}
                    </p>
                  )}
                </>
              )}
              {XemTruocAnh && (
                <img
                  alt="Xem trước ảnh thiết bị"
                  className="mt-3 h-32 w-48 rounded border border-rail object-cover"
                  src={XemTruocAnh}
                />
              )}
            </fieldset>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded border border-rail px-4 text-sm"
                onClick={() => SetThietBiDangSua(null)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="rounded bg-tally px-4 text-sm font-semibold"
                disabled={DangGui}
                type="submit"
              >
                {DangGui ? "Đang lưu…" : "Lưu thiết bị"}
              </button>
            </div>
          </form>
        </HopThoaiBieuMau>
      )}
      {ThietBiCanXoa && (
        <HopThoaiXacNhan
          DangXuLy={DangGui}
          MoTa={
            <>
              Thiết bị <strong>{ThietBiCanXoa.TenThietBi}</strong> sẽ bị xóa
              vĩnh viễn. Không thể xóa nếu còn dữ liệu nghiệp vụ liên quan.
            </>
          }
          NhanXacNhan="Xóa thiết bị"
          OnHuy={() => SetThietBiCanXoa(null)}
          OnXacNhan={() => void XacNhanXoa()}
          TieuDe="Xóa thiết bị"
        />
      )}
    </section>
  );
}
