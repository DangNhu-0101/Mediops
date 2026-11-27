import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Clock3,
  PackageCheck,
  Settings,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useXacThuc } from "../Contexts/XacThucContext";
import { LayDuLieuBangDieuKhien } from "../Services/BangDieuKhienService";
import { TheoDoiCapNhatLich } from "../Services/SocketLichService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import type { DuLieuBangDieuKhien } from "../Types/BangDieuKhien";
import type { TrangThaiCaQuay } from "../Types/CaQuay";
import type { MucDoSuCo, TrangThaiSuCo } from "../Types/SuCoBaoTri";

const NhanTrangThaiCaQuay: Record<TrangThaiCaQuay, string> = {
  DU_THAO: "Dự thảo",
  DA_DUYET: "Đã duyệt",
  DANG_DIEN_RA: "Đang diễn ra",
  HOAN_THANH: "Hoàn thành",
  DA_HUY: "Đã hủy",
};

const LopTrangThaiCaQuay: Record<TrangThaiCaQuay, string> = {
  DU_THAO: "bg-case-2 text-fog",
  DA_DUYET: "bg-timecode/15 text-timecode",
  DANG_DIEN_RA: "bg-blueprint/20 text-blueprint",
  HOAN_THANH: "bg-phosphor/15 text-phosphor",
  DA_HUY: "bg-tally/15 text-tally",
};

const NhanTrangThaiSuCo: Record<TrangThaiSuCo, string> = {
  CHO_XU_LY: "Chờ xử lý",
  DANG_SUA_CHUA: "Đang sửa chữa",
  DA_KHAC_PHUC: "Đã khắc phục",
};

const NhanMucDo: Record<MucDoSuCo, string> = {
  NHE: "Nhẹ",
  TRUNG_BINH: "Trung bình",
  NGHIEM_TRONG: "Nghiêm trọng",
};

function DinhDangNgay(Ngay: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "full",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(`${Ngay}T12:00:00+07:00`));
}

function DinhDangGio(ThoiGian: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(ThoiGian));
}

function DinhDangThoiDiem(ThoiGian: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(ThoiGian));
}

function HangDangTai() {
  return <div className="h-20 animate-pulse rounded bg-case-2" />;
}

export function BangDieuKhien() {
  const { NguoiDung: NguoiDung } = useXacThuc();
  const [DuLieu, SetDuLieu] = useState<DuLieuBangDieuKhien>();
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState(false);
  const BoHenTaiLai = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  async function TaiDuLieu() {
    SetDangTai(true);
    SetLoi(false);
    try {
      SetDuLieu(await LayDuLieuBangDieuKhien());
    } catch {
      SetLoi(true);
    } finally {
      SetDangTai(false);
    }
  }

  useEffect(() => {
    void TaiDuLieu();
    return () => {
      if (BoHenTaiLai.current) clearTimeout(BoHenTaiLai.current);
    };
  }, []);

  useEffect(() => {
    function HenTaiLai() {
      if (BoHenTaiLai.current) clearTimeout(BoHenTaiLai.current);
      BoHenTaiLai.current = setTimeout(() => void TaiDuLieu(), 350);
    }

    const BoTheoDoiLich = TheoDoiCapNhatLich(HenTaiLai);
    const BoTheoDoiVanHanh = TheoDoiVanHanh(
      ["kho:xuat-kho", "kho:nhap-kho", "bao_tri:cap_nhat"],
      HenTaiLai,
    );
    return () => {
      BoTheoDoiLich();
      BoTheoDoiVanHanh();
    };
  }, []);

  const TenGoi = NguoiDung?.HoTen.split(" ").at(-1) ?? "bạn";
  const ThietBi = DuLieu?.ThongKeThietBi;
  const TongThietBi = ThietBi?.TongSo ?? 0;

  return (
    <section className="mx-auto max-w-[1480px]">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl">
            Chào {TenGoi}, đây là vận hành hôm nay
          </h1>
          <p className="mt-2 text-sm leading-6 text-fog">
            {DuLieu
              ? `${DinhDangNgay(DuLieu.Ngay)} · ${DuLieu.TongCaQuayHomNay} ca quay đang được theo dõi.`
              : "Theo dõi lịch quay, thiết bị và hoạt động kho của đơn vị."}
          </p>
        </div>
        <Link
          className="flex min-h-11 items-center gap-2 rounded border border-rail px-4 text-sm font-semibold text-paper transition hover:border-blueprint hover:bg-case-2"
          to="/lich-ca-quay"
        >
          <CalendarDays aria-hidden size={17} /> Xem lịch ca quay
        </Link>
      </header>

      {Loi ? (
        <div className="mb-5 rounded border border-tally/50 bg-tally/10 p-4 text-sm text-paper">
          <p className="flex items-center gap-2">
            <CircleAlert aria-hidden size={17} /> Không thể tải Bảng điều khiển.
          </p>
          <button
            className="mt-3 min-h-10 border-b border-paper font-semibold"
            onClick={() => void TaiDuLieu()}
            type="button"
          >
            Thử lại
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-live="polite">
        <Link
          className="rounded border border-rail bg-case p-4 transition hover:border-blueprint"
          to="/lich-ca-quay"
        >
          <CalendarDays aria-hidden className="text-blueprint" size={19} />
          <p className="mt-3 text-sm text-fog sm:mt-5">Ca quay hôm nay</p>
          <p className="mt-1 font-serif text-3xl tabular-nums">
            {DangTai ? "—" : (DuLieu?.TongCaQuayHomNay ?? 0)}
          </p>
        </Link>
        {DuLieu?.CoTheXemXungDot ? (
          <Link
            className="rounded border border-rail bg-case p-4 transition hover:border-tally"
            to="/lich-ca-quay"
          >
            <AlertTriangle aria-hidden className="text-tally" size={19} />
            <p className="mt-3 text-sm text-fog sm:mt-5">Xung đột cần xử lý</p>
            <p className="mt-1 font-serif text-3xl tabular-nums">
              {DangTai ? "—" : DuLieu.TongXungDot}
            </p>
          </Link>
        ) : (
          <article className="rounded border border-rail bg-case p-4">
            <AlertTriangle aria-hidden className="text-fog" size={19} />
            <p className="mt-3 text-sm text-fog sm:mt-5">Xung đột lịch</p>
            <p className="mt-1 text-sm leading-6 text-fog">
              Xem tại chi tiết ca quay khi được phân công.
            </p>
          </article>
        )}
        <article className="rounded border border-rail bg-case p-4">
          <PackageCheck aria-hidden className="text-blueprint" size={19} />
          <p className="mt-3 text-sm text-fog sm:mt-5">Thiết bị đang sử dụng</p>
          <p className="mt-1 font-serif text-3xl tabular-nums">
            {DangTai || !ThietBi ? "—" : ThietBi.DangSuDung}
          </p>
        </article>
        <Link
          className="rounded border border-rail bg-case p-4 transition hover:border-timecode"
          to="/bao-tri"
        >
          <Wrench aria-hidden className="text-timecode" size={19} />
          <p className="mt-3 text-sm text-fog sm:mt-5">Thiết bị cần bảo trì</p>
          <p className="mt-1 font-serif text-3xl tabular-nums">
            {DangTai || !ThietBi ? "—" : ThietBi.BaoTri}
          </p>
        </Link>
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Ca quay hôm nay</h2>
            <Link
              className="text-sm font-semibold text-blueprint hover:text-paper"
              to="/lich-ca-quay"
            >
              Xem lịch
            </Link>
          </div>
          <div className="overflow-hidden rounded border border-rail bg-case">
            {DangTai ? (
              <div className="space-y-px bg-rail p-px">
                <HangDangTai />
                <HangDangTai />
                <HangDangTai />
              </div>
            ) : null}
            {!DangTai && DuLieu?.DanhSachCaQuay.length === 0 ? (
              <div className="p-6 text-center">
                <CalendarDays
                  aria-hidden
                  className="mx-auto text-fog"
                  size={24}
                />
                <h3 className="mt-3 font-semibold">Chưa có ca quay hôm nay</h3>
                <p className="mt-1 text-sm leading-6 text-fog">
                  Lịch quay của đơn vị sẽ xuất hiện tại đây khi được tạo.
                </p>
              </div>
            ) : null}
            {!DangTai
              ? DuLieu?.DanhSachCaQuay.map((CaQuay) => (
                  <Link
                    className="block border-b border-rail p-4 last:border-b-0 transition hover:bg-case-2"
                    key={CaQuay.Id}
                    to={`/ca-quay/${CaQuay.Id}`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                      <p className="shrink-0 font-mono sm:w-24 text-xs tabular-nums text-blueprint">
                        {DinhDangGio(CaQuay.ThoiGianBatDau)} –{" "}
                        {DinhDangGio(CaQuay.ThoiGianKetThuc)}
                      </p>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="break-words font-semibold">
                            {CaQuay.TieuDe}
                          </h3>
                          <span
                            className={`rounded px-2 py-1 font-mono text-[10px] ${LopTrangThaiCaQuay[CaQuay.TrangThai]}`}
                          >
                            {NhanTrangThaiCaQuay[CaQuay.TrangThai]}
                          </span>
                        </div>
                        <p className="mt-1 break-words text-sm text-fog">
                          {CaQuay.DuAn} · {CaQuay.Studio}
                        </p>
                        <p className="mt-2 text-xs text-fog">
                          Người phụ trách ca: {CaQuay.NguoiPhuTrach} ·{" "}
                          {CaQuay.SoThietBi === 0
                            ? "Chưa phân công thiết bị"
                            : `${CaQuay.SoThietBi} thiết bị`}
                        </p>
                        {CaQuay.CoXungDot ? (
                          <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-tally">
                            <AlertTriangle aria-hidden size={14} /> Có xung đột
                            cần kiểm tra
                          </p>
                        ) : null}
                      </div>
                      <ChevronRight
                        aria-hidden
                        className="mt-1 shrink-0 text-fog"
                        size={18}
                      />
                    </div>
                  </Link>
                ))
              : null}
            {!DangTai && (DuLieu?.ConCaQuayKhac ?? 0) > 0 ? (
              <Link
                className="block p-3 text-center text-sm font-semibold text-blueprint hover:bg-case-2 hover:text-paper"
                to="/lich-ca-quay"
              >
                Còn {DuLieu?.ConCaQuayKhac} ca quay trong lịch
              </Link>
            ) : null}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Cần xử lý</h2>
          </div>
          <div className="overflow-hidden rounded border border-rail bg-case">
            {DangTai ? (
              <div className="space-y-px bg-rail p-px">
                <HangDangTai />
                <HangDangTai />
              </div>
            ) : null}
            {!DangTai && DuLieu?.CanXuLy.length === 0 ? (
              <div className="p-6 text-center">
                <Settings
                  aria-hidden
                  className="mx-auto text-phosphor"
                  size={24}
                />
                <h3 className="mt-3 font-semibold">Không có việc cần xử lý</h3>
                <p className="mt-1 text-sm leading-6 text-fog">
                  Không có xung đột, sự cố mở hoặc tác vụ kho cần chú ý.
                </p>
              </div>
            ) : null}
            {!DangTai
              ? DuLieu?.CanXuLy.map((Muc) => (
                  <Link
                    className="flex gap-3 border-b border-rail p-4 last:border-b-0 hover:bg-case-2"
                    key={`${Muc.Loai}-${Muc.Id}`}
                    to={Muc.DuongDan}
                  >
                    {Muc.Loai === "XUNG_DOT" ? (
                      <AlertTriangle
                        aria-hidden
                        className="mt-0.5 shrink-0 text-tally"
                        size={17}
                      />
                    ) : Muc.Loai === "SU_CO" ? (
                      <Wrench
                        aria-hidden
                        className="mt-0.5 shrink-0 text-timecode"
                        size={17}
                      />
                    ) : (
                      <PackageCheck
                        aria-hidden
                        className="mt-0.5 shrink-0 text-blueprint"
                        size={17}
                      />
                    )}
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-semibold leading-5">
                        {Muc.TieuDe}
                      </h3>
                      <p className="mt-1 break-words text-xs leading-5 text-fog">
                        {Muc.MoTa}
                      </p>
                    </div>
                    <ChevronRight
                      aria-hidden
                      className="mt-1 shrink-0 text-fog"
                      size={16}
                    />
                  </Link>
                ))
              : null}
          </div>
        </section>
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tình trạng thiết bị</h2>
            <Link
              className="text-sm font-semibold text-blueprint hover:text-paper"
              to="/kho-thiet-bi"
            >
              Quản lý thiết bị
            </Link>
          </div>
          <div className="rounded border border-rail bg-case p-5">
            {DangTai ? (
              <HangDangTai />
            ) : !ThietBi ? (
              <p className="text-sm text-fog">
                Bạn chưa có quyền xem thống kê thiết bị.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-sm text-fog">Rảnh</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-phosphor">
                      {ThietBi?.Ranh ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-fog">Đang sử dụng</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-blueprint">
                      {ThietBi?.DangSuDung ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-fog">Bảo trì</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-timecode">
                      {ThietBi?.BaoTri ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-fog">Chờ sử dụng</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-tally">
                      {ThietBi?.ChoSuDung ?? 0}
                    </p>
                  </div>
                </div>
                {(ThietBi?.NgoaiLe ?? 0) > 0 && (
                  <p className="mt-4 text-sm text-timecode">
                    Có {ThietBi?.NgoaiLe} thiết bị cần xác minh hoặc đang bị
                    chặn cấp phát. Xem cảnh báo tại danh sách thiết bị.
                  </p>
                )}
                {TongThietBi > 0 ? (
                  <div
                    aria-label="Phân bố tình trạng thiết bị"
                    className="mt-6 flex h-2 overflow-hidden rounded bg-case-2"
                  >
                    <span
                      className="bg-phosphor"
                      style={{
                        width: `${((ThietBi?.Ranh ?? 0) / TongThietBi) * 100}%`,
                      }}
                    />
                    <span
                      className="bg-blueprint"
                      style={{
                        width: `${((ThietBi?.DangSuDung ?? 0) / TongThietBi) * 100}%`,
                      }}
                    />
                    <span
                      className="bg-timecode"
                      style={{
                        width: `${((ThietBi?.BaoTri ?? 0) / TongThietBi) * 100}%`,
                      }}
                    />
                    <span
                      className="bg-tally"
                      style={{
                        width: `${((ThietBi?.ChoSuDung ?? 0) / TongThietBi) * 100}%`,
                      }}
                    />
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-fog">
                    Chưa có thiết bị trong đơn vị.
                  </p>
                )}
              </>
            )}
          </div>
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sự cố &amp; bảo trì</h2>
            <Link
              className="text-sm font-semibold text-blueprint hover:text-paper"
              to="/bao-tri"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="overflow-hidden rounded border border-rail bg-case">
            {DangTai ? (
              <div className="space-y-px bg-rail p-px">
                <HangDangTai />
                <HangDangTai />
              </div>
            ) : null}
            {!DangTai && DuLieu?.DanhSachSuCo.length === 0 ? (
              <div className="p-6 text-center">
                <Wrench
                  aria-hidden
                  className="mx-auto text-phosphor"
                  size={24}
                />
                <h3 className="mt-3 font-semibold">
                  {DuLieu.CoTheXemSuCo
                    ? "Không có sự cố cần xử lý"
                    : "Bạn chưa có quyền xem sự cố"}
                </h3>
                <p className="mt-1 text-sm leading-6 text-fog">
                  Chỉ hiển thị dữ liệu trong phạm vi được phép xem.
                </p>
              </div>
            ) : null}
            {!DangTai
              ? DuLieu?.DanhSachSuCo.map((SuCo) => (
                  <Link
                    className="block border-b border-rail p-4 last:border-b-0 hover:bg-case-2"
                    key={SuCo.Id}
                    to="/bao-tri"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="break-words text-sm font-semibold">
                        {SuCo.ThietBi.TenThietBi}
                      </h3>
                      <span className="shrink-0 text-xs font-semibold text-tally">
                        {NhanMucDo[SuCo.MucDo]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-fog">
                      {NhanTrangThaiSuCo[SuCo.TrangThai]} · Báo lúc{" "}
                      {DinhDangThoiDiem(SuCo.NgayTao)}
                    </p>
                  </Link>
                ))
              : null}
          </div>
        </section>
      </div>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Hoạt động kho gần đây</h2>
          <Link
            className="text-sm font-semibold text-blueprint hover:text-paper"
            to="/nhat-ky-su-co"
          >
            Xem nhật ký
          </Link>
        </div>
        <div className="overflow-hidden rounded border border-rail bg-case">
          {DangTai ? (
            <div className="space-y-px bg-rail p-px">
              <HangDangTai />
              <HangDangTai />
            </div>
          ) : null}
          {!DangTai && DuLieu?.HoatDongKho.length === 0 ? (
            <div className="p-6 text-center">
              <Clock3 aria-hidden className="mx-auto text-fog" size={24} />
              <h3 className="mt-3 font-semibold">
                {DuLieu.CoTheXemNhatKy
                  ? "Chưa có hoạt động kho gần đây"
                  : "Bạn chưa có quyền xem nhật ký kho"}
              </h3>
              <p className="mt-1 text-sm leading-6 text-fog">
                Chỉ hiển thị giao dịch trong phạm vi ca được phép xem.
              </p>
            </div>
          ) : null}
          {!DangTai
            ? DuLieu?.HoatDongKho.map((Muc) => (
                <Link
                  className="grid gap-2 border-b border-rail p-4 last:border-b-0 hover:bg-case-2 md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
                  key={Muc.Id}
                  to="/nhat-ky-su-co"
                >
                  <p className="font-mono text-xs text-fog">
                    {DinhDangThoiDiem(Muc.ThoiGian)}
                  </p>
                  <p className="break-words text-sm font-semibold">
                    {Muc.LoaiHanhDong === "XUAT_KHO" ? "Xuất kho" : "Nhập kho"}{" "}
                    · {Muc.ThietBi.TenThietBi}
                  </p>
                  <p className="break-words text-xs text-fog">
                    {Muc.CaQuay.TieuDe} ·{" "}
                    {Muc.GiaoDichKho?.Kho.TenKho ?? "Chưa ghi nhận kho"}
                  </p>
                  <p className="text-xs text-fog">{Muc.NguoiThucHien.HoTen}</p>
                </Link>
              ))
            : null}
        </div>
      </section>
    </section>
  );
}
