import { BieuMauYeuCauTaiNguyen } from "../Components/BieuMauYeuCauTaiNguyen";
import type { YeuCauTaiNguyen } from "../Types/DuLieuNhung";
import { CoQuyen } from "../Services/QuyenService";
import { Api } from "../Services/Api";
import {
  PhanCongTheoChucVu,
  type NhanSuLuaChon,
  type NhomPhanCong,
  type ChucDanhPhanCong,
} from "../Components/PhanCongTheoChucVu";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import viLocale from "@fullcalendar/core/locales/vi";
import type { EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import * as Dialog from "@radix-ui/react-dialog";
import { LoaderCircle, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useXacThuc } from "../Contexts/XacThucContext";
import { LayThongBaoLoi } from "../Services/XacThucService";
import {
  CapNhatThoiGianCaQuay,
  KiemTraXungDotCaQuay,
  LayChiTietCaQuay,
  LayDanhSachCaQuay,
  LayPhanHoiXungDotCaQuay,
  TaoCaQuay,
} from "../Services/CaQuayService";
import { LayDanhSachDuAn } from "../Services/DuAnService";

import { LayDanhSachPhongStudio } from "../Services/PhongStudioService";
import { TheoDoiCapNhatLich } from "../Services/SocketLichService";
import type {
  CaQuay,
  ChiTietXungDotCaQuay,
  TrangThaiCaQuay,
} from "../Types/CaQuay";
import type { DuAn } from "../Types/DuAn";
import type { NhanSu } from "../Types/NhanSu";
import type { PhongStudio } from "../Types/PhongStudio";
import { NutThemNhanh } from "../Components/NutThemNhanh";

function NgayVietNam(ThoiGian: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ThoiGian);
}

const NhanTrangThai: Record<TrangThaiCaQuay, string> = {
  DU_THAO: "Dự thảo",
  DA_DUYET: "Đã duyệt",
  DANG_DIEN_RA: "Đang diễn ra",
  HOAN_THANH: "Hoàn thành",
  DA_HUY: "Đã hủy",
};

function LopTrangThai(TrangThai: TrangThaiCaQuay) {
  return `ca-quay-${TrangThai.toLowerCase()}`;
}

const NhanLoaiTaiNguyen = {
  STUDIO: "Studio",
  THIET_BI: "Thiết bị",
  NHAN_SU: "Nhân sự",
} as const;

function TaoTomTatXungDot(DanhSachXungDot: ChiTietXungDotCaQuay[]) {
  const TaiNguyenTheoLoai = {
    STUDIO: new Set<string>(),
    THIET_BI: new Set<string>(),
    NHAN_SU: new Set<string>(),
  };

  DanhSachXungDot.forEach((XungDot) => {
    TaiNguyenTheoLoai[XungDot.LoaiTaiNguyen].add(
      XungDot.TenTaiNguyen || "Tài nguyên chưa có tên",
    );
  });

  return (Object.keys(TaiNguyenTheoLoai) as (keyof typeof TaiNguyenTheoLoai)[])
    .filter((LoaiTaiNguyen) => TaiNguyenTheoLoai[LoaiTaiNguyen].size > 0)
    .map((LoaiTaiNguyen) => {
      const DanhSachTen = [...TaiNguyenTheoLoai[LoaiTaiNguyen]];
      const CacTenHienThi = DanhSachTen.slice(0, 3).join(", ");
      const SoLuongConLai = DanhSachTen.length - 3;
      return `${NhanLoaiTaiNguyen[LoaiTaiNguyen]}: ${CacTenHienThi}${
        SoLuongConLai > 0 ? ` và ${SoLuongConLai} tài nguyên khác` : ""
      }`;
    })
    .join(" · ");
}

function ThongBaoXungDot(DanhSachXungDot: ChiTietXungDotCaQuay[]) {
  toast.error("Không thể thay đổi lịch vì phát hiện xung đột.", {
    description:
      TaoTomTatXungDot(DanhSachXungDot) ||
      "Hãy chọn thời gian khác rồi thử lại.",
    duration: 8000,
  });
}

function ChuyenSangGiaTriNgayGio(Ngay: Date) {
  const Bu = (GiaTri: number) => String(GiaTri).padStart(2, "0");
  return `${Ngay.getFullYear()}-${Bu(Ngay.getMonth() + 1)}-${Bu(Ngay.getDate())}T${Bu(Ngay.getHours())}:${Bu(Ngay.getMinutes())}`;
}

function TaoKhoangThoiGianMacDinh() {
  const BatDau = new Date();
  BatDau.setMinutes(0, 0, 0);
  BatDau.setHours(BatDau.getHours() + 1);
  const KetThuc = new Date(BatDau.getTime() + 2 * 60 * 60 * 1000);
  return {
    BatDau: ChuyenSangGiaTriNgayGio(BatDau),
    KetThuc: ChuyenSangGiaTriNgayGio(KetThuc),
  };
}

export function LichCaQuay() {
  const ChuyenTrang = useNavigate();
  const [ThamSoDuongDan] = useSearchParams();
  const DuAnMacDinhId = ThamSoDuongDan.get("DuAnId") ?? "";
  const DaMoTuDuAn = useRef(false);
  const { NguoiDung: NguoiDung } = useXacThuc();
  const CoQuyenTao =
    CoQuyen(NguoiDung, "CaQuay.Tao") && CoQuyen(NguoiDung, "CaQuay.PhanCong");
  const [XemDanhSach, SetXemDanhSach] = useState(
    () => window.matchMedia("(max-width: 767px)").matches,
  );
  const [NgayXem, SetNgayXem] = useState(() => NgayVietNam(new Date()));
  const [DanhSachCaQuay, SetDanhSachCaQuay] = useState<CaQuay[]>([]);
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");
  const [HienTaoCaQuay, SetHienTaoCaQuay] = useState(false);
  const [DanhSachDuAn, SetDanhSachDuAn] = useState<DuAn[]>([]);
  const [DanhSachStudio, SetDanhSachStudio] = useState<PhongStudio[]>([]);
  const [DanhSachNhanSu, SetDanhSachNhanSu] = useState<NhanSuLuaChon[]>([]);
  const [ChucDanh, SetChucDanh] = useState<ChucDanhPhanCong[]>([]);
  const [YeuCau, SetYeuCau] = useState<YeuCauTaiNguyen[]>([]);
  const [Nhom, SetNhom] = useState<NhomPhanCong[]>([]);
  const [DangTaiLuaChon, SetDangTaiLuaChon] = useState(false);
  const [DangTao, SetDangTao] = useState(false);
  const [LoiTao, SetLoiTao] = useState("");
  const DanhSachCaDangCapNhat = useRef(new Set<string>());
  const [DuLieuTao, SetDuLieuTao] = useState(() => ({
    TieuDe: "",
    DuAnId: DuAnMacDinhId,
    NguoiPhuTrachId: "",
    PhongStudioId: "",
    ...TaoKhoangThoiGianMacDinh(),
  }));

  async function TaiCaQuay() {
    SetDangTai(true);
    SetLoi("");
    try {
      SetDanhSachCaQuay(await LayDanhSachCaQuay());
    } catch (LoiTai) {
      SetLoi(LayThongBaoLoi(LoiTai));
    } finally {
      SetDangTai(false);
    }
  }

  useEffect(() => {
    void TaiCaQuay();
    return TheoDoiCapNhatLich(() => void TaiCaQuay());
  }, []);

  async function MoTaoCaQuay() {
    SetYeuCau([]);
    SetDuLieuTao({
      TieuDe: "",
      DuAnId: DuAnMacDinhId,
      NguoiPhuTrachId: NguoiDung?.Id ?? "",
      PhongStudioId: "",
      ...TaoKhoangThoiGianMacDinh(),
    });
    SetNhom(
      ChucDanh.slice(0, 2).map((Muc) => ({
        TenChucDanh: Muc.TenChucDanh,
        NguoiDungId: [],
      })),
    );
    SetLoiTao("");
    SetHienTaoCaQuay(true);
    if (DanhSachDuAn.length || DangTaiLuaChon) return;
    SetDangTaiLuaChon(true);
    try {
      const [DuAn, Studio, NhanSu, ChucDanhMoi] = await Promise.all([
        LayDanhSachDuAn({}),
        LayDanhSachPhongStudio({}),
        Api.get<NhanSuLuaChon[]>("/nhan-su/lua-chon").then(
          ({ data: DuLieu }) => DuLieu,
        ),
        Api.get<ChucDanhPhanCong[]>("/nhan-su/chuc-vu-phan-cong").then(
          ({ data: DuLieu }) => DuLieu,
        ),
      ]);
      SetDanhSachDuAn(DuAn);
      SetDanhSachStudio(Studio);
      SetDanhSachNhanSu(NhanSu);
      SetChucDanh(ChucDanhMoi);
      SetNhom(
        ChucDanhMoi.slice(0, 2).map((Muc) => ({
          TenChucDanh: Muc.TenChucDanh,
          NguoiDungId: [],
        })),
      );
    } catch (LoiTai) {
      SetLoiTao(LayThongBaoLoi(LoiTai));
    } finally {
      SetDangTaiLuaChon(false);
    }
  }

  useEffect(() => {
    if (DuAnMacDinhId && CoQuyenTao && !DaMoTuDuAn.current) {
      DaMoTuDuAn.current = true;
      void MoTaoCaQuay();
    }
  }, [DuAnMacDinhId, CoQuyenTao]);

  async function XuLyTaoCaQuay() {
    const NguoiPhuTrachId = DuLieuTao.NguoiPhuTrachId;
    if (!DuLieuTao.TieuDe.trim() || !DuLieuTao.DuAnId || !NguoiPhuTrachId) {
      SetLoiTao("Vui lòng nhập tên ca quay, dự án và người phụ trách ca.");
      return;
    }
    const BatDau = new Date(DuLieuTao.BatDau);
    const KetThuc = new Date(DuLieuTao.KetThuc);
    if (
      Number.isNaN(BatDau.getTime()) ||
      Number.isNaN(KetThuc.getTime()) ||
      KetThuc <= BatDau
    ) {
      SetLoiTao("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }
    SetDangTao(true);
    SetLoiTao("");
    try {
      const CaQuay = await TaoCaQuay({
        DuAnId: DuLieuTao.DuAnId,
        TieuDe: DuLieuTao.TieuDe.trim(),
        ThoiGianBatDau: BatDau.toISOString(),
        ThoiGianKetThuc: KetThuc.toISOString(),
        PhongStudioId: DuLieuTao.PhongStudioId || null,
        NguoiPhuTrachId,
        TrangThai: "DU_THAO",
        DanhSachThietBiId: [],
        CacYeuCauTaiNguyen: YeuCau,
        DanhSachNhanSu: Nhom.flatMap((Muc) =>
          Muc.NguoiDungId.filter((Id) => Id !== NguoiPhuTrachId).map(
            (NguoiDungId) => ({
              NguoiDungId,
              ChucDanhPhanCong: Muc.TenChucDanh,
            }),
          ),
        ),
      });
      SetHienTaoCaQuay(false);
      toast.success("Đã tạo ca quay ở trạng thái dự thảo.");
      ChuyenTrang(`/ca-quay/${CaQuay.Id}`);
    } catch (LoiGui) {
      const PhanHoiXungDot = LayPhanHoiXungDotCaQuay(LoiGui);
      SetLoiTao(
        PhanHoiXungDot
          ? `Phát hiện xung đột: ${TaoTomTatXungDot(PhanHoiXungDot.DanhSachXungDot)}`
          : LayThongBaoLoi(LoiGui),
      );
    } finally {
      SetDangTao(false);
    }
  }

  const SuKien = useMemo(
    () =>
      DanhSachCaQuay.map((CaQuay) => ({
        id: CaQuay.Id,
        title: CaQuay.TieuDe,
        start: CaQuay.ThoiGianBatDau,
        end: CaQuay.ThoiGianKetThuc,
        classNames: [LopTrangThai(CaQuay.TrangThai)],
        extendedProps: {
          PhongStudio: CaQuay.PhongStudio?.TenPhong ?? CaQuay.GhiChuDiaDiem,
          TrangThai: NhanTrangThai[CaQuay.TrangThai],
        },
      })),
    [DanhSachCaQuay],
  );

  async function LuuThayDoiThoiGian(
    ThongTin: EventDropArg | EventResizeDoneArg,
  ) {
    const ThoiGianBatDau = ThongTin.event.start;
    const ThoiGianKetThuc = ThongTin.event.end;
    if (!ThoiGianBatDau || !ThoiGianKetThuc) {
      ThongTin.revert();
      toast.error("Không thể xác định thời gian ca quay mới.");
      return;
    }

    if (DanhSachCaDangCapNhat.current.has(ThongTin.event.id)) {
      ThongTin.revert();
      toast.info(
        "Ca quay này đang được cập nhật, vui lòng chờ trong giây lát.",
      );
      return;
    }
    DanhSachCaDangCapNhat.current.add(ThongTin.event.id);

    const DuLieuThoiGianMoi = {
      ThoiGianBatDau: ThoiGianBatDau.toISOString(),
      ThoiGianKetThuc: ThoiGianKetThuc.toISOString(),
    };

    try {
      try {
        const CaQuay = await LayChiTietCaQuay(ThongTin.event.id);
        const KetQuaXungDot = await KiemTraXungDotCaQuay({
          ...DuLieuThoiGianMoi,
          PhongStudioId: CaQuay.PhongStudioId,
          NguoiPhuTrachId: CaQuay.NguoiPhuTrachId,
          DanhSachThietBiId: CaQuay.DanhSachThietBi.map(
            (PhanCong) => PhanCong.ThietBiId,
          ),
          DanhSachNhanSuId: CaQuay.DanhSachNhanSu.map(
            (PhanCong) => PhanCong.NguoiDungId,
          ),
          CaQuayHienTaiId: CaQuay.Id,
        });

        if (KetQuaXungDot.CoXungDot) {
          ThongTin.revert();
          ThongBaoXungDot(KetQuaXungDot.DanhSachXungDot);
          return;
        }
      } catch (LoiKiemTra) {
        ThongTin.revert();
        toast.error(
          "Không thể kiểm tra xung đột nên lịch chưa được thay đổi.",
          {
            description: LayThongBaoLoi(LoiKiemTra),
          },
        );
        return;
      }

      try {
        await CapNhatThoiGianCaQuay(ThongTin.event.id, DuLieuThoiGianMoi);
        SetDanhSachCaQuay((DanhSachHienTai) =>
          DanhSachHienTai.map((CaQuay) =>
            CaQuay.Id === ThongTin.event.id
              ? { ...CaQuay, ...DuLieuThoiGianMoi }
              : CaQuay,
          ),
        );
        toast.success("Đã cập nhật thời gian ca quay.");
      } catch (LoiCapNhat) {
        ThongTin.revert();
        const PhanHoiXungDot = LayPhanHoiXungDotCaQuay(LoiCapNhat);
        if (PhanHoiXungDot) {
          ThongBaoXungDot(PhanHoiXungDot.DanhSachXungDot);
        } else {
          toast.error("Không thể lưu thời gian mới. Lịch đã được hoàn tác.", {
            description: LayThongBaoLoi(LoiCapNhat),
          });
        }
      }
    } finally {
      DanhSachCaDangCapNhat.current.delete(ThongTin.event.id);
    }
  }

  const CacCaTrongNgay = DanhSachCaQuay.filter(
    (Ca) =>
      NgayVietNam(new Date(Ca.ThoiGianBatDau)) <= NgayXem &&
      NgayVietNam(new Date(Ca.ThoiGianKetThuc)) >= NgayXem,
  );

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-blueprint">
            Vận hành sản xuất
          </p>
          <h1 className="mt-2 font-serif text-2xl md:text-3xl">Lịch ca quay</h1>
          <p className="mt-2 text-sm text-fog">
            Theo dõi và điều chỉnh lịch quay theo tháng, tuần hoặc ngày.
          </p>
        </div>
        {CoQuyenTao && (
          <div className="flex flex-wrap gap-2">
            <NutThemNhanh Loai="CaQuay" OnThanhCong={() => void TaiCaQuay()} />
            <button
              className="flex min-h-11 items-center gap-2 rounded bg-tally px-4 text-sm font-semibold text-paper disabled:opacity-60"
              onClick={() => void MoTaoCaQuay()}
              type="button"
            >
              <Plus size={17} />
              Tạo ca quay
            </button>
          </div>
        )}
      </header>

      <div
        className="mb-4 flex flex-wrap items-center gap-2"
        aria-label="Cách xem lịch"
      >
        <button
          type="button"
          className={`min-h-11 rounded border border-rail px-3 text-sm ${XemDanhSach ? "bg-blueprint/20" : ""}`}
          aria-pressed={XemDanhSach}
          onClick={() => SetXemDanhSach(true)}
        >
          Danh sách theo ngày
        </button>
        <button
          type="button"
          className={`min-h-11 rounded border border-rail px-3 text-sm ${!XemDanhSach ? "bg-blueprint/20" : ""}`}
          aria-pressed={!XemDanhSach}
          onClick={() => SetXemDanhSach(false)}
        >
          Lịch trực quan
        </button>
        {XemDanhSach && (
          <label className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
            Ngày quay{" "}
            <input
              aria-label="Ngày quay"
              type="date"
              value={NgayXem}
              onChange={(E) => SetNgayXem(E.target.value)}
              className="min-h-11 rounded border border-rail bg-case px-3"
            />
          </label>
        )}
      </div>
      {DangTai ? (
        <p className="py-12 text-center text-fog">Đang tải lịch ca quay…</p>
      ) : Loi ? (
        <div className="rounded border border-tally/60 bg-tally/10 p-4 text-sm">
          {Loi}
        </div>
      ) : XemDanhSach ? (
        <div className="space-y-3">
          {CacCaTrongNgay.map((Ca) => (
            <Link
              key={Ca.Id}
              to={`/ca-quay/${Ca.Id}`}
              className="block rounded border border-rail bg-case p-4 hover:bg-case-2"
            >
              <h2 className="font-semibold">{Ca.TieuDe}</h2>
              <p className="mt-2 text-sm text-fog">
                {new Date(Ca.ThoiGianBatDau).toLocaleString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                })}{" "}
                –{" "}
                {new Date(Ca.ThoiGianKetThuc).toLocaleString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                })}
              </p>
              <p className="mt-2 text-sm text-fog">
                {NhanTrangThai[Ca.TrangThai]} ·{" "}
                {Ca.PhongStudio?.TenPhong ?? "Chưa chọn Studio"}
              </p>
            </Link>
          ))}
          {!CacCaTrongNgay.length && (
            <p className="py-8 text-center text-fog">
              Không có ca quay trong ngày đã chọn.
            </p>
          )}
        </div>
      ) : (
        <div className="lich-ca-quay rounded border border-rail bg-case p-3 md:p-5">
          <FullCalendar
            buttonText={{
              today: "Hôm nay",
              month: "Tháng",
              week: "Tuần",
              day: "Ngày",
            }}
            editable={CoQuyen(NguoiDung, "CaQuay.Sua")}
            eventClick={(ThongTin) =>
              ChuyenTrang(`/ca-quay/${ThongTin.event.id}`)
            }
            eventDrop={(ThongTin) => void LuuThayDoiThoiGian(ThongTin)}
            eventResize={(ThongTin) => void LuuThayDoiThoiGian(ThongTin)}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            events={SuKien}
            dayMaxEventRows={false}
            dayMaxEvents={false}
            eventDisplay="block"
            eventMinHeight={28}
            firstDay={1}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            height="auto"
            expandRows
            locale={viLocale}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            selectable={false}
            scrollTime="08:00:00"
            slotDuration="00:30:00"
            slotEventOverlap={false}
            slotMinTime="06:00:00"
            slotMaxTime="23:00:00"
            views={{
              DayGridMonth: { ButtonText: "Tháng" },
              TimeGridWeek: { ButtonText: "Tuần" },
              TimeGridDay: { ButtonText: "Ngày" },
            }}
            eventContent={(ThongTin) => {
              const LaXemThang = ThongTin.view.type === "dayGridMonth";
              return (
                <div className="min-w-0 px-1.5 py-1 text-xs leading-tight">
                  <p className="truncate font-semibold">
                    {ThongTin.timeText} {ThongTin.event.title}
                  </p>
                  {!LaXemThang && ThongTin.event.extendedProps.PhongStudio && (
                    <p className="truncate opacity-80">
                      {ThongTin.event.extendedProps.PhongStudio}
                    </p>
                  )}
                  {!LaXemThang && (
                    <p className="truncate font-mono text-[10px] opacity-80">
                      {ThongTin.event.extendedProps.TrangThai}
                    </p>
                  )}
                </div>
              );
            }}
          />
        </div>
      )}

      <Dialog.Root onOpenChange={SetHienTaoCaQuay} open={HienTaoCaQuay}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-gunmetal/85" />
          <Dialog.Content className="hop-thoai-bieu-mau fixed inset-x-3 top-1/2 z-50 max-h-[90dvh] -translate-y-1/2 overflow-y-auto rounded border border-rail bg-case p-5 shadow-2xl shadow-gunmetal/70 focus:outline-none sm:left-1/2 sm:max-w-2xl sm:-translate-x-1/2 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="font-serif text-2xl text-paper">
                  Tạo ca quay
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-fog">
                  Tạo lịch dự thảo trước, sau đó phân công thiết bị và nhân sự ở
                  trang chi tiết.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  aria-label="Đóng biểu mẫu tạo ca quay"
                  className="grid size-11 shrink-0 place-items-center rounded border border-rail text-fog hover:text-paper"
                  disabled={DangTao}
                  type="button"
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            {DangTaiLuaChon ? (
              <p className="py-10 text-center text-fog" role="status">
                Đang tải dữ liệu biểu mẫu…
              </p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold">
                    Tên ca quay
                  </span>
                  <input
                    autoFocus
                    className="h-11 w-full rounded border border-rail bg-case-2 px-3 outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/30"
                    onChange={(E) =>
                      SetDuLieuTao((HienTai) => ({
                        ...HienTai,
                        TieuDe: E.target.value,
                      }))
                    }
                    placeholder="Ví dụ: Ghi hình tập 03"
                    value={DuLieuTao.TieuDe}
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Dự án
                  </span>
                  <select
                    className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                    onChange={(E) =>
                      SetDuLieuTao((HienTai) => ({
                        ...HienTai,
                        DuAnId: E.target.value,
                      }))
                    }
                    value={DuLieuTao.DuAnId}
                  >
                    <option value="">Chọn dự án</option>
                    {DanhSachDuAn.map((DuAn) => (
                      <option key={DuAn.Id} value={DuAn.Id}>
                        {DuAn.TenDuAn}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <BieuMauYeuCauTaiNguyen GiaTri={YeuCau} OnDoi={SetYeuCau} />
                  <PhanCongTheoChucVu
                    NguoiPhuTrachId={DuLieuTao.NguoiPhuTrachId}
                    OnDoiNguoiPhuTrach={(NguoiPhuTrachId) =>
                      SetDuLieuTao((HienTai) => ({
                        ...HienTai,
                        NguoiPhuTrachId,
                      }))
                    }
                    ChucDanh={ChucDanh}
                    Nhom={Nhom}
                    DanhSach={DanhSachNhanSu}
                    OnDoi={SetNhom}
                    DangXuLy={DangTao}
                  />
                </div>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Bắt đầu
                  </span>
                  <input
                    className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                    onChange={(E) =>
                      SetDuLieuTao((HienTai) => ({
                        ...HienTai,
                        BatDau: E.target.value,
                      }))
                    }
                    type="datetime-local"
                    value={DuLieuTao.BatDau}
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Kết thúc
                  </span>
                  <input
                    className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                    onChange={(E) =>
                      SetDuLieuTao((HienTai) => ({
                        ...HienTai,
                        KetThuc: E.target.value,
                      }))
                    }
                    type="datetime-local"
                    value={DuLieuTao.KetThuc}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold">
                    Studio (không bắt buộc)
                  </span>
                  <select
                    className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                    onChange={(E) =>
                      SetDuLieuTao((HienTai) => ({
                        ...HienTai,
                        PhongStudioId: E.target.value,
                      }))
                    }
                    value={DuLieuTao.PhongStudioId}
                  >
                    <option value="">Chưa phân công Studio</option>
                    {DanhSachStudio.map((Studio) => (
                      <option key={Studio.Id} value={Studio.Id}>
                        {Studio.TenPhong}
                        {Studio.DiaDiem ? ` · ${Studio.DiaDiem}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {LoiTao && (
              <p
                className="mt-5 rounded border border-tally/60 bg-tally/10 px-3 py-2 text-sm text-paper"
                role="alert"
              >
                {LoiTao}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  className="rounded border border-rail px-4 text-sm"
                  disabled={DangTao}
                  type="button"
                >
                  Hủy
                </button>
              </Dialog.Close>
              <button
                className="flex min-h-11 items-center gap-2 rounded bg-tally px-4 text-sm font-semibold text-paper disabled:opacity-60"
                disabled={DangTao || DangTaiLuaChon}
                onClick={() => void XuLyTaoCaQuay()}
                type="button"
              >
                {DangTao ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : (
                  <Plus size={17} />
                )}
                {DangTao ? "Đang tạo…" : "Tạo ca quay"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
