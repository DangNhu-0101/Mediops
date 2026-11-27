import { LoiMoiThayCa } from "../Components/LoiMoiThayCa";
import { BieuMauSuCoVanHanh } from "../Components/BieuMauSuCoVanHanh";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  MapPin,
  Package,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayCaQuayCuaNguoiDung } from "../Services/VanHanhKhoService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import { TheoDoiCapNhatLich } from "../Services/SocketLichService";
import { useXacThuc } from "../Contexts/XacThucContext";
import { CoQuyen } from "../Services/QuyenService";
import type { CaQuayVanHanh, TrangThaiCaQuay } from "../Types/CaQuay";

const NhanTrangThai: Record<TrangThaiCaQuay, string> = {
  DU_THAO: "Dự thảo",
  DA_DUYET: "Đã duyệt",
  DANG_DIEN_RA: "Đang diễn ra",
  HOAN_THANH: "Hoàn thành",
  DA_HUY: "Đã hủy",
};

const MauTrangThai: Record<TrangThaiCaQuay, string> = {
  DU_THAO: "bg-blueprint/20 text-blueprint",
  DA_DUYET: "bg-timecode/20 text-timecode",
  DANG_DIEN_RA: "bg-blueprint/20 text-blueprint",
  HOAN_THANH: "bg-phosphor/20 text-phosphor",
  DA_HUY: "bg-tally/20 text-tally",
};

function DinhDangNgay(Ngay: Date) {
  return Ngay.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function DinhDangThu(Ngay: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  })
    .format(Ngay)
    .replace(".", "")
    .toUpperCase();
}

function DinhDangThoiGian(ThoiGian: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(ThoiGian));
}

function TaoDanhSachNgay() {
  const HomNay = new Date(`${DinhDangNgay(new Date())}T05:00:00Z`);
  return Array.from({ length: 15 }, (BoQua, ChiSo) => {
    return new Date(HomNay.getTime() + (ChiSo - 7) * 24 * 60 * 60 * 1000);
  });
}

function TheCaQuay({ CaQuay: CaQuay }: { CaQuay: CaQuayVanHanh }) {
  const DieuHuong = useNavigate();
  const [DangBao, SetDangBao] = useState(false);
  const Studio =
    CaQuay.PhongStudio?.TenPhong ??
    CaQuay.GhiChuDiaDiem ??
    "Chưa xác định địa điểm";
  const {
    TongSo: TongSo,
    ChoXuatKho: ChoXuatKho,
    DaXuatKho: DaXuatKho,
  } = CaQuay.TomTatThietBi;

  return (
    <>
      <button
        className="w-full rounded border border-rail bg-case p-4 text-left transition hover:border-blueprint focus:outline-none focus:ring-2 focus:ring-tally"
        onClick={() => DieuHuong(`/mobile/ca-quay/${CaQuay.Id}`)}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-wide text-fog">
              {CaQuay.MaCaQuay ?? "Ca quay"}
            </p>
            <h2 className="mt-1 break-words text-base font-semibold leading-6 text-paper">
              {CaQuay.TieuDe}
            </h2>
          </div>
          <span
            className={`shrink-0 rounded px-2 py-1 font-mono text-[10px] ${MauTrangThai[CaQuay.TrangThai]}`}
          >
            {NhanTrangThai[CaQuay.TrangThai]}
          </span>
        </div>
        <p className="mt-3 text-sm text-fog">{CaQuay.DuAn.TenDuAn}</p>
        <div className="mt-4 grid gap-2 text-sm text-fog">
          <p className="flex items-center gap-2">
            <CalendarDays aria-hidden size={15} />
            {DinhDangThoiGian(CaQuay.ThoiGianBatDau)} –{" "}
            {DinhDangThoiGian(CaQuay.ThoiGianKetThuc)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin aria-hidden size={15} />
            <span className="break-words">{Studio}</span>
          </p>
          <p className="flex items-center gap-2">
            <Package aria-hidden size={15} />
            {TongSo === 0
              ? "Chưa phân công thiết bị"
              : `${DaXuatKho}/${TongSo} thiết bị đã xuất kho${ChoXuatKho > 0 ? ` · còn ${ChoXuatKho}` : ""}`}
          </p>
        </div>
        <div className="mt-4 flex items-center justify-end gap-1 text-sm font-semibold text-paper">
          Xem thiết bị <ChevronRight aria-hidden size={17} />
        </div>
      </button>
      <button
        className="min-h-11 w-full px-4 text-left text-tally"
        onClick={() => SetDangBao(true)}
      >
        Báo sự cố
      </button>
      {DangBao && (
        <BieuMauSuCoVanHanh
          CaQuayId={CaQuay.Id}
          OnDong={() => SetDangBao(false)}
        />
      )}
    </>
  );
}

export function CaQuayCuaToi() {
  const { NguoiDung } = useXacThuc();
  // Nhân viên kho vận hành toàn đơn vị thấy mọi ca trong ngày đã chọn.
  const KhoToanDonVi =
    CoQuyen(NguoiDung, "VanHanhKho.ToanDonVi") || !!NguoiDung?.QuanTriDonVi;
  const DanhSachNgay = useMemo(TaoDanhSachNgay, []);
  const [NgayDangChon, SetNgayDangChon] = useState(() =>
    DinhDangNgay(new Date()),
  );
  const [DanhSachCaQuay, SetDanhSachCaQuay] = useState<CaQuayVanHanh[]>([]);
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");
  const [LanTaiLai, SetLanTaiLai] = useState(0);
  const DaiNgayRef = useRef<HTMLDivElement>(null);

  // Cuộn dải ngày để ngày hôm nay nằm giữa khi mở trang (không cuộn trang dọc).
  useEffect(() => {
    const DaiNgay = DaiNgayRef.current;
    const NutChon = DaiNgay?.querySelector<HTMLElement>("[data-dang-chon]");
    if (!DaiNgay || !NutChon) return;
    const HopDai = DaiNgay.getBoundingClientRect();
    const HopNut = NutChon.getBoundingClientRect();
    DaiNgay.scrollLeft +=
      HopNut.left - HopDai.left - (HopDai.width - HopNut.width) / 2;
  }, []);

  useEffect(() => {
    let ConHieuLuc = true;
    async function TaiDuLieu() {
      SetDangTai(true);
      SetLoi("");
      try {
        const DuLieu = await LayCaQuayCuaNguoiDung(NgayDangChon);
        if (ConHieuLuc) SetDanhSachCaQuay(DuLieu);
      } catch {
        if (ConHieuLuc) SetLoi("Không thể tải ca quay. Vui lòng thử lại.");
      } finally {
        if (ConHieuLuc) SetDangTai(false);
      }
    }
    void TaiDuLieu();
    return () => {
      ConHieuLuc = false;
    };
  }, [NgayDangChon, LanTaiLai]);
  useEffect(
    () =>
      TheoDoiVanHanh(["kho:xuat-kho", "kho:nhap-kho", "bao_tri:cap_nhat"], () =>
        SetLanTaiLai((Lan) => Lan + 1),
      ),
    [],
  );
  useEffect(() => TheoDoiCapNhatLich(() => SetLanTaiLai((Lan) => Lan + 1)), []);

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-blueprint">
        Vận hành hiện trường
      </p>
      <h1 className="mt-2 font-serif text-2xl">
        {KhoToanDonVi ? "Xuất, nhập kho theo ca" : "Ca quay của tôi"}
      </h1>
      <LoiMoiThayCa />
      <p className="mt-2 text-sm leading-6 text-fog">
        {KhoToanDonVi
          ? "Danh sách mọi ca quay của đơn vị trong ngày. Chọn ca để quét QR xuất kho trước giờ quay và nhập kho khi ê-kíp hoàn trả."
          : "Chọn ca quay để xem danh sách thiết bị trước khi thực hiện tác vụ kho."}
      </p>
      <div
        aria-label="Chọn ngày"
        className="-mx-4 mt-5 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-2 md:-mx-7 md:scroll-px-7 md:px-7"
        ref={DaiNgayRef}
      >
        {DanhSachNgay.map((Ngay) => {
          const GiaTri = DinhDangNgay(Ngay);
          const DangChon = GiaTri === NgayDangChon;
          return (
            <button
              aria-pressed={DangChon}
              data-dang-chon={DangChon || undefined}
              className={`min-h-16 min-w-14 snap-start rounded border px-2 font-mono text-xs ${DangChon ? "border-tally bg-tally text-paper" : "border-rail bg-case text-fog"}`}
              key={GiaTri}
              onClick={() => SetNgayDangChon(GiaTri)}
              type="button"
            >
              <span className="block text-[10px] uppercase">
                {DinhDangThu(Ngay)}
              </span>
              <span className="mt-1 block text-lg">
                {Number(DinhDangNgay(Ngay).slice(-2))}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-fog">
        {new Intl.DateTimeFormat("vi-VN", {
          dateStyle: "full",
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(new Date(`${NgayDangChon}T12:00:00+07:00`))}
      </p>
      <div className="mt-5 space-y-3" aria-live="polite">
        {DangTai ? (
          <div className="rounded border border-rail bg-case p-5 text-sm text-fog">
            Đang tải ca quay…
          </div>
        ) : null}
        {!DangTai && Loi ? (
          <div className="rounded border border-tally/50 bg-tally/10 p-4 text-sm text-paper">
            <p className="flex items-center gap-2">
              <AlertCircle aria-hidden size={17} />
              {Loi}
            </p>
            <button
              className="mt-3 border-b border-paper text-sm font-semibold"
              onClick={() => SetLanTaiLai((GiaTri) => GiaTri + 1)}
              type="button"
            >
              Thử lại
            </button>
          </div>
        ) : null}
        {!DangTai && !Loi && DanhSachCaQuay.length === 0 ? (
          <div className="rounded border border-rail bg-case p-5 text-center">
            <CalendarDays aria-hidden className="mx-auto text-fog" size={24} />
            <h2 className="mt-3 font-semibold">Không có ca quay</h2>
            <p className="mt-1 text-sm leading-6 text-fog">
              Bạn chưa được phân công hoặc phụ trách ca quay nào trong ngày đã
              chọn.
            </p>
          </div>
        ) : null}
        {!DangTai && !Loi
          ? DanhSachCaQuay.map((CaQuay) => (
              <TheCaQuay CaQuay={CaQuay} key={CaQuay.Id} />
            ))
          : null}
      </div>
    </section>
  );
}
