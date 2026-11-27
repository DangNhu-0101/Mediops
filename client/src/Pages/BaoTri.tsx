import { CoQuyen } from "../Services/QuyenService";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  ImagePlus,
  Search,
  Settings,
  ShieldAlert,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { BieuMauBaoSuCo } from "../Components/BieuMauBaoSuCo";
import { useXacThuc } from "../Contexts/XacThucContext";
import {
  BatDauXuLySuCo,
  BoSungAnhSuCo,
  HoanTatXuLySuCo,
  LayDanhSachSuCo,
} from "../Services/SuCoBaoTriService";
import { LayDanhSachThietBi } from "../Services/ThietBiService";
import { LayDanhSachKho } from "../Services/VanHanhKhoService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import type {
  MucDoSuCo,
  NguonSuCo,
  SuCoBaoTri,
  TrangThaiSuCo,
} from "../Types/SuCoBaoTri";
import type { Kho, ThietBi, TrangThaiThietBi } from "../Types/ThietBi";

const NhanTrangThai: Record<TrangThaiSuCo, string> = {
  CHO_XU_LY: "Chờ xử lý",
  DANG_SUA_CHUA: "Đang sửa chữa",
  DA_KHAC_PHUC: "Đã khắc phục",
};
const LopTrangThai: Record<TrangThaiSuCo, string> = {
  CHO_XU_LY: "bg-timecode/15 text-timecode",
  DANG_SUA_CHUA: "bg-blueprint/20 text-blueprint",
  DA_KHAC_PHUC: "bg-phosphor/20 text-phosphor",
};
const NhanMucDo: Record<MucDoSuCo, string> = {
  NHE: "Nhẹ",
  TRUNG_BINH: "Trung bình",
  NGHIEM_TRONG: "Nghiêm trọng",
};
const LopMucDo: Record<MucDoSuCo, string> = {
  NHE: "text-timecode",
  TRUNG_BINH: "text-tally",
  NGHIEM_TRONG: "bg-tally/15 text-tally",
};
const NhanNguon: Record<NguonSuCo, string> = {
  NHAP_KHO: "Phát hiện khi nhập kho",
  TRONG_QUA_TRINH_SU_DUNG: "Báo trong quá trình sử dụng",
  KIEM_TRA_KHO: "Phát hiện khi kiểm tra kho",
};
const NhanTrangThaiThietBi: Record<TrangThaiThietBi, string> = {
  SAN_SANG: "Đủ điều kiện sử dụng",
  DANG_SU_DUNG: "Đã ghi nhận xuất kho",
  BAO_TRI: "Cần kiểm tra hoặc sửa chữa",
  HU_HONG: "Có hư hỏng",
};

function DinhDangThoiGian(GiaTri: string | null) {
  if (!GiaTri) return "Chưa ghi nhận";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(GiaTri));
}

function LocSuCo(
  DanhSach: SuCoBaoTri[],
  BoLoc: {
    TrangThai: TrangThaiSuCo | "";
    MucDo: MucDoSuCo | "";
    ThietBiId: string;
    KhoId: string;
    TimKiem: string;
  },
) {
  const TimKiem = BoLoc.TimKiem.trim().toLocaleLowerCase("vi");
  return DanhSach.filter(
    (SuCo) =>
      (!BoLoc.TrangThai || SuCo.TrangThai === BoLoc.TrangThai) &&
      (!BoLoc.MucDo || SuCo.MucDo === BoLoc.MucDo) &&
      (!BoLoc.ThietBiId || SuCo.ThietBiId === BoLoc.ThietBiId) &&
      (!BoLoc.KhoId || SuCo.KhoId === BoLoc.KhoId) &&
      (!TimKiem ||
        [SuCo.MoTaLoi, SuCo.ThietBi.TenThietBi, SuCo.ThietBi.MaQR].some(
          (GiaTri) => GiaTri.toLocaleLowerCase("vi").includes(TimKiem),
        )),
  );
}

export function BaoTri() {
  const [ThamSoDuongDan] = useSearchParams();
  const { NguoiDung } = useXacThuc();
  const [DanhSach, SetDanhSach] = useState<SuCoBaoTri[]>([]);
  const [DanhSachThietBi, SetDanhSachThietBi] = useState<ThietBi[]>([]);
  const [DanhSachKho, SetDanhSachKho] = useState<Kho[]>([]);
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");
  const [SuCoDangXemId, SetSuCoDangXemId] = useState<string | undefined>(
    ThamSoDuongDan.get("SuCoId") ?? undefined,
  );
  const [DangMoBaoCao, SetDangMoBaoCao] = useState(false);
  const [BoLoc, SetBoLoc] = useState({
    TrangThai: "" as TrangThaiSuCo | "",
    MucDo: "" as MucDoSuCo | "",
    ThietBiId: "",
    KhoId: "",
    TimKiem: "",
  });

  async function TaiDuLieu(IdCanGiu?: string) {
    SetDangTai(true);
    SetLoi("");
    try {
      const [SuCo, ThietBi, Kho] = await Promise.all([
        LayDanhSachSuCo(),
        CoQuyen(NguoiDung, "ThietBi.Xem")
          ? LayDanhSachThietBi({})
          : Promise.resolve([]),
        CoQuyen(NguoiDung, "VanHanhKho.QuanLy")
          ? LayDanhSachKho(true)
          : Promise.resolve([]),
      ]);
      SetDanhSach(SuCo);
      SetDanhSachThietBi(ThietBi);
      SetDanhSachKho(Kho);
      const IdDangChon = IdCanGiu ?? SuCoDangXemId;
      SetSuCoDangXemId(
        IdDangChon && SuCo.some((Muc) => Muc.Id === IdDangChon)
          ? IdDangChon
          : SuCo[0]?.Id,
      );
    } catch (LoiTai) {
      SetLoi(LayThongBaoLoi(LoiTai));
    } finally {
      SetDangTai(false);
    }
  }

  useEffect(() => {
    void TaiDuLieu();
    return TheoDoiVanHanh(
      ["kho:nhap-kho", "bao_tri:cap_nhat"],
      () => void TaiDuLieu(),
    );
  }, []);

  const DanhSachDaLoc = useMemo(
    () => LocSuCo(DanhSach, BoLoc),
    [BoLoc, DanhSach],
  );
  const SuCoDangXem = DanhSach.find((Muc) => Muc.Id === SuCoDangXemId);
  const ThongKe = {
    CHO_XU_LY: DanhSach.filter((Muc) => Muc.TrangThai === "CHO_XU_LY").length,
    DANG_SUA_CHUA: DanhSach.filter((Muc) => Muc.TrangThai === "DANG_SUA_CHUA")
      .length,
    DA_KHAC_PHUC: DanhSach.filter((Muc) => Muc.TrangThai === "DA_KHAC_PHUC")
      .length,
  };

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl">Sự cố và bảo trì</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-fog">
            Tiếp nhận sự cố, theo dõi xử lý và kiểm soát trạng thái cấp phát của
            thiết bị.
          </p>
        </div>
        <button
          className="flex min-h-11 items-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold text-white"
          hidden={!CoQuyen(NguoiDung, "SuCo.Tao")}
          onClick={() => SetDangMoBaoCao(true)}
          type="button"
        >
          <AlertTriangle aria-hidden size={17} /> Báo sự cố
        </button>
      </header>

      <nav
        aria-label="Nhật ký và sự cố"
        className="mb-5 flex gap-2 border-b border-rail"
      >
        <Link className="px-4 py-3 text-sm text-fog" to="/nhat-ky-su-co">
          Nhật ký mượn/trả
        </Link>
        <Link
          aria-current="page"
          className="border-b-2 border-tally px-4 py-3 text-sm"
          to="/bao-tri"
        >
          Quản lý bảo trì
        </Link>
      </nav>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {(
          [
            ["CHO_XU_LY", "Chờ xử lý", Clock3, "text-timecode"],
            ["DANG_SUA_CHUA", "Đang sửa chữa", Wrench, "text-blueprint"],
            ["DA_KHAC_PHUC", "Đã khắc phục", CheckCircle2, "text-phosphor"],
          ] as const
        ).map(([GiaTri, Nhan, BieuTuong, Lop]) => (
          <button
            aria-pressed={BoLoc.TrangThai === GiaTri}
            className={`flex min-h-20 items-center gap-3 rounded border p-4 text-left transition ${
              BoLoc.TrangThai === GiaTri
                ? "border-paper/40 bg-case-2"
                : "border-rail bg-case hover:border-fog/60"
            }`}
            key={GiaTri}
            onClick={() =>
              SetBoLoc((HienTai) => ({
                ...HienTai,
                TrangThai: HienTai.TrangThai === GiaTri ? "" : GiaTri,
              }))
            }
            type="button"
          >
            <BieuTuong aria-hidden className={Lop} size={22} />
            <span>
              <span className="block text-sm text-fog">{Nhan}</span>
              <span className="mt-1 block font-mono text-xl">
                {ThongKe[GiaTri]}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_auto_auto_auto]">
        <label className="relative">
          <span className="sr-only">Tìm kiếm sự cố</span>
          <Search
            aria-hidden
            className="absolute left-3 top-3 text-fog"
            size={18}
          />
          <input
            className="h-11 w-full rounded border border-rail bg-case-2 pl-10 pr-3"
            onChange={(SuKien) =>
              SetBoLoc((HienTai) => ({
                ...HienTai,
                TimKiem: SuKien.target.value,
              }))
            }
            placeholder="Tìm thiết bị hoặc mô tả sự cố"
            value={BoLoc.TimKiem}
          />
        </label>
        <select
          aria-label="Lọc theo mức độ"
          className="h-11 rounded border border-rail bg-case-2 px-3"
          onChange={(SuKien) =>
            SetBoLoc((HienTai) => ({
              ...HienTai,
              MucDo: SuKien.target.value as MucDoSuCo | "",
            }))
          }
          value={BoLoc.MucDo}
        >
          <option value="">Tất cả mức độ</option>
          {Object.entries(NhanMucDo).map(([GiaTri, Nhan]) => (
            <option key={GiaTri} value={GiaTri}>
              {Nhan}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc theo thiết bị"
          className="h-11 min-w-48 rounded border border-rail bg-case-2 px-3"
          onChange={(SuKien) =>
            SetBoLoc((HienTai) => ({
              ...HienTai,
              ThietBiId: SuKien.target.value,
            }))
          }
          value={BoLoc.ThietBiId}
        >
          <option value="">Tất cả thiết bị</option>
          {DanhSachThietBi.map((ThietBi) => (
            <option key={ThietBi.Id} value={ThietBi.Id}>
              {ThietBi.TenThietBi}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc theo kho"
          className="h-11 min-w-40 rounded border border-rail bg-case-2 px-3"
          onChange={(SuKien) =>
            SetBoLoc((HienTai) => ({
              ...HienTai,
              KhoId: SuKien.target.value,
            }))
          }
          value={BoLoc.KhoId}
        >
          <option value="">Tất cả kho</option>
          {DanhSachKho.map((Kho) => (
            <option key={Kho.Id} value={Kho.Id}>
              {Kho.TenKho}
            </option>
          ))}
        </select>
      </div>

      {Loi ? (
        <div
          className="rounded border border-tally/60 bg-tally/10 p-4 text-sm"
          role="alert"
        >
          <p>{Loi}</p>
          <button
            className="mt-3 rounded border border-rail px-3 text-sm"
            onClick={() => void TaiDuLieu()}
            type="button"
          >
            Thử tải lại
          </button>
        </div>
      ) : DangTai ? (
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-3">
            {Array.from({ length: 4 }, (BoQua, ChiSo) => (
              <div
                className="h-28 animate-pulse rounded border border-rail bg-case"
                key={ChiSo}
              />
            ))}
          </div>
          <div className="hidden h-96 animate-pulse rounded border border-rail bg-case xl:block" />
        </div>
      ) : DanhSachDaLoc.length === 0 ? (
        <div className="rounded border border-rail bg-case p-8 text-center">
          <ShieldAlert className="mx-auto text-fog" size={32} />
          <h2 className="mt-3 font-semibold">Không có sự cố phù hợp</h2>
          <p className="mt-2 text-sm text-fog">
            Thử bỏ bớt bộ lọc hoặc tạo báo cáo sự cố mới.
          </p>
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-3">
            {DanhSachDaLoc.map((SuCo) => (
              <button
                aria-pressed={SuCo.Id === SuCoDangXemId}
                className={`block min-h-28 w-full rounded border p-4 text-left transition ${
                  SuCo.Id === SuCoDangXemId
                    ? "border-blueprint bg-case-2"
                    : "border-rail bg-case hover:border-fog/60"
                }`}
                key={SuCo.Id}
                onClick={() => SetSuCoDangXemId(SuCo.Id)}
                type="button"
              >
                <span className="flex flex-wrap items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block break-words font-semibold">
                      {SuCo.ThietBi.TenThietBi}
                    </span>
                    <span className="mt-1 block font-mono text-[11px] text-fog">
                      {SuCo.ThietBi.MaQR} · {DinhDangThoiGian(SuCo.NgayTao)}
                    </span>
                  </span>
                  <span
                    className={`rounded px-2 py-1 font-mono text-[11px] ${LopTrangThai[SuCo.TrangThai]}`}
                  >
                    {NhanTrangThai[SuCo.TrangThai]}
                  </span>
                </span>
                <span className="mt-3 line-clamp-2 block text-sm leading-6 text-fog">
                  {SuCo.MoTaLoi}
                </span>
                <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                  <span className={LopMucDo[SuCo.MucDo]}>
                    {NhanMucDo[SuCo.MucDo]}
                  </span>
                  <span className="text-fog">{SuCo.NguoiBaoCao.HoTen}</span>
                  {SuCo.Kho ? (
                    <span className="text-fog">{SuCo.Kho.TenKho}</span>
                  ) : null}
                  {SuCo.DanhSachAnh.length ? (
                    <span className="text-fog">
                      {SuCo.DanhSachAnh.length} ảnh
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
          {SuCoDangXem ? (
            <ChiTietSuCo
              key={SuCoDangXem.Id}
              OnCapNhat={(SuCoMoi) => {
                SetDanhSach((HienTai) =>
                  HienTai.map((Muc) => (Muc.Id === SuCoMoi.Id ? SuCoMoi : Muc)),
                );
              }}
              SuCo={SuCoDangXem}
            />
          ) : null}
        </div>
      )}

      {DangMoBaoCao ? (
        <BieuMauBaoSuCo
          OnDong={() => SetDangMoBaoCao(false)}
          OnThanhCong={(SuCo) => {
            SetBoLoc({
              TrangThai: "",
              MucDo: "",
              ThietBiId: "",
              KhoId: "",
              TimKiem: "",
            });
            SetSuCoDangXemId(SuCo.Id);
            void TaiDuLieu(SuCo.Id);
          }}
        />
      ) : null}
    </section>
  );
}

function ChiTietSuCo({
  SuCo: SuCo,
  OnCapNhat: OnCapNhat,
}: {
  SuCo: SuCoBaoTri;
  OnCapNhat: (SuCo: SuCoBaoTri) => void;
}) {
  const { NguoiDung: NguoiDung } = useXacThuc();
  const CoQuyenXuLy = CoQuyen(NguoiDung, "SuCo.Sua");
  const [DangXuLy, SetDangXuLy] = useState(false);
  const [DangMoHoanTat, SetDangMoHoanTat] = useState(false);
  const [GhiChuXuLy, SetGhiChuXuLy] = useState("");
  const [KetQuaThietBi, SetKetQuaThietBi] = useState<
    "SAN_SANG" | "BAO_TRI" | "HU_HONG"
  >("SAN_SANG");
  const [AnhMoi, SetAnhMoi] = useState<File[]>([]);
  const [BoAnhId, SetBoAnhId] = useState<string[]>([]);
  const [Loi, SetLoi] = useState("");
  const ChiTietRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.innerWidth < 1280)
      ChiTietRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  const XemTruocAnhMoi = useMemo(
    () => AnhMoi.map((Tep) => ({ Tep: Tep, Url: URL.createObjectURL(Tep) })),
    [AnhMoi],
  );
  useEffect(
    () => () => {
      XemTruocAnhMoi.forEach((Anh) => URL.revokeObjectURL(Anh.Url));
    },
    [XemTruocAnhMoi],
  );

  async function BatDau() {
    SetDangXuLy(true);
    SetLoi("");
    try {
      const KetQua = await BatDauXuLySuCo(SuCo.Id);
      OnCapNhat(KetQua);
      toast.success("Đã bắt đầu xử lý sự cố.");
    } catch (LoiBatDau) {
      SetLoi(LayThongBaoLoi(LoiBatDau));
    } finally {
      SetDangXuLy(false);
    }
  }

  async function HoanTat() {
    if (GhiChuXuLy.trim().length < 2) {
      SetLoi("Vui lòng ghi rõ nội dung đã kiểm tra hoặc sửa chữa.");
      return;
    }
    SetDangXuLy(true);
    SetLoi("");
    try {
      const KetQua = await HoanTatXuLySuCo(SuCo.Id, {
        GhiChuXuLy: GhiChuXuLy.trim(),
        TrangThaiThietBi: KetQuaThietBi,
      });
      OnCapNhat(KetQua);
      SetDangMoHoanTat(false);
      toast.success(
        KetQua.TrangThai === "DA_KHAC_PHUC"
          ? "Đã hoàn tất xử lý và xác nhận thiết bị sẵn sàng."
          : "Đã lưu kết quả. Sự cố vẫn đang được xử lý.",
      );
    } catch (LoiHoanTat) {
      SetLoi(LayThongBaoLoi(LoiHoanTat));
    } finally {
      SetDangXuLy(false);
    }
  }

  function ChonAnh(SuKien: ChangeEvent<HTMLInputElement>) {
    const CacTep = Array.from(SuKien.target.files ?? []);
    SuKien.target.value = "";
    if (
      SuCo.DanhSachAnh.length - BoAnhId.length + AnhMoi.length + CacTep.length >
      5
    ) {
      SetLoi("Mỗi sự cố chỉ được lưu tối đa 5 ảnh.");
      return;
    }
    const TepKhongHopLe = CacTep.find(
      (Tep) => !Tep.type.startsWith("image/") || Tep.size > 5 * 1024 * 1024,
    );
    if (TepKhongHopLe) {
      SetLoi("Mỗi tệp phải là ảnh hợp lệ và không vượt quá 5 MB.");
      return;
    }
    SetLoi("");
    SetAnhMoi((HienTai) => [...HienTai, ...CacTep]);
  }

  async function TaiAnhBoSung() {
    if (!AnhMoi.length && !BoAnhId.length) return;
    SetDangXuLy(true);
    SetLoi("");
    try {
      const KetQua = await BoSungAnhSuCo(SuCo.Id, AnhMoi, BoAnhId);
      OnCapNhat(KetQua);
      SetAnhMoi([]);
      SetBoAnhId([]);
      toast.success("Đã lưu thay đổi ảnh hiện trường.");
    } catch (LoiTai) {
      SetLoi(LayThongBaoLoi(LoiTai));
    } finally {
      SetDangXuLy(false);
    }
  }

  return (
    <aside
      className="rounded border border-rail bg-case p-5 xl:sticky xl:top-24"
      ref={ChiTietRef}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl">Chi tiết sự cố</h2>
          <p className="mt-1 font-mono text-[11px] text-fog">
            {SuCo.ThietBi.MaQR}
          </p>
        </div>
        <span
          className={`rounded px-2 py-1 font-mono text-[11px] ${LopTrangThai[SuCo.TrangThai]}`}
        >
          {NhanTrangThai[SuCo.TrangThai]}
        </span>
      </div>

      <div className="mt-5 border-y border-rail py-4">
        <p className="font-semibold">{SuCo.ThietBi.TenThietBi}</p>
        <p className="mt-1 text-sm text-fog">
          Tình trạng vận hành đã ghi nhận:{" "}
          {NhanTrangThaiThietBi[SuCo.ThietBi.TrangThai]}
        </p>
        <p className={`mt-2 text-sm font-semibold ${LopMucDo[SuCo.MucDo]}`}>
          Mức độ: {NhanMucDo[SuCo.MucDo]}
        </p>
      </div>

      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-1">
        <div>
          <dt className="text-xs text-fog">Nguồn ghi nhận</dt>
          <dd className="mt-1">{NhanNguon[SuCo.Nguon]}</dd>
        </div>
        <div>
          <dt className="text-xs text-fog">Người báo cáo</dt>
          <dd className="mt-1">{SuCo.NguoiBaoCao.HoTen}</dd>
        </div>
        <div>
          <dt className="text-xs text-fog">Thời điểm báo cáo</dt>
          <dd className="mt-1">{DinhDangThoiGian(SuCo.NgayTao)}</dd>
        </div>
        {SuCo.Kho ? (
          <div>
            <dt className="text-xs text-fog">Kho liên quan</dt>
            <dd className="mt-1">{SuCo.Kho.TenKho}</dd>
          </div>
        ) : null}
        {SuCo.CaQuay ? (
          <div className="sm:col-span-2 xl:col-span-1">
            <dt className="text-xs text-fog">Ca quay liên quan</dt>
            <dd className="mt-1">{SuCo.CaQuay.TieuDe}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-5">
        <h3 className="text-sm font-semibold">Mô tả tình trạng</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-fog">
          {SuCo.MoTaLoi}
        </p>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Ảnh hiện trường</h3>
          <span className="font-mono text-[11px] text-fog">
            {SuCo.DanhSachAnh.length}/5
          </span>
        </div>
        {SuCo.DanhSachAnh.length ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {SuCo.DanhSachAnh.filter((Anh) => !BoAnhId.includes(Anh.Id)).map(
              (Anh, ChiSo) => (
                <div key={Anh.Id} className="relative">
                  <a
                    className="block aspect-square overflow-hidden rounded border border-rail bg-case-2 focus:outline-none focus:ring-2 focus:ring-blueprint"
                    href={Anh.SecureUrl}
                    key={Anh.Id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <img
                      alt={`Ảnh hiện trường sự cố ${ChiSo + 1} của ${SuCo.ThietBi.TenThietBi}`}
                      className="size-full object-cover"
                      src={Anh.SecureUrl}
                    />
                  </a>
                  {CoQuyenXuLy && (
                    <button
                      type="button"
                      disabled={DangXuLy}
                      aria-label={`Bỏ ảnh hiện trường ${ChiSo + 1}`}
                      className="absolute right-1 top-1 grid size-10 place-items-center rounded bg-gunmetal/90"
                      onClick={() => SetBoAnhId([...BoAnhId, Anh.Id])}
                    >
                      <X size={16} aria-hidden />
                    </button>
                  )}
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="mt-3 flex min-h-20 items-center justify-center gap-2 rounded border border-dashed border-rail text-sm text-fog">
            <ImagePlus aria-hidden size={19} /> Chưa có ảnh hiện trường
          </div>
        )}
        {XemTruocAnhMoi.length ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {XemTruocAnhMoi.map(({ Tep: Tep, Url: Url }, ChiSo) => (
              <div
                className="relative aspect-square overflow-hidden rounded border border-blueprint"
                key={`${Tep.name}-${ChiSo}`}
              >
                <img
                  alt={`Ảnh bổ sung đã chọn ${ChiSo + 1}`}
                  className="size-full object-cover"
                  src={Url}
                />
                <button
                  aria-label={`Bỏ ảnh bổ sung ${ChiSo + 1}`}
                  className="absolute right-1 top-1 grid size-11 place-items-center rounded bg-gunmetal/90"
                  onClick={() =>
                    SetAnhMoi((HienTai) =>
                      HienTai.filter((BoQua, ViTri) => ViTri !== ChiSo),
                    )
                  }
                  type="button"
                >
                  <X aria-hidden size={17} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {CoQuyenXuLy &&
        SuCo.DanhSachAnh.length - BoAnhId.length + AnhMoi.length < 5 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded border border-rail px-3 text-sm text-fog hover:bg-case-2 hover:text-paper">
              <Camera aria-hidden size={17} /> Chọn ảnh bổ sung
              <input
                accept="image/*"
                className="sr-only"
                disabled={DangXuLy}
                multiple
                onChange={ChonAnh}
                type="file"
              />
            </label>
          </div>
        ) : null}
      </div>

      {CoQuyenXuLy && (AnhMoi.length > 0 || BoAnhId.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={DangXuLy}
            className="min-h-11 rounded bg-blueprint px-4 text-sm text-white"
            onClick={() => void TaiAnhBoSung()}
          >
            {DangXuLy ? "Đang lưu…" : "Lưu thay đổi ảnh"}
          </button>
          <button
            type="button"
            disabled={DangXuLy}
            className="min-h-11 rounded border border-rail px-4 text-sm"
            onClick={() => {
              SetAnhMoi([]);
              SetBoAnhId([]);
            }}
          >
            Hủy thay đổi ảnh
          </button>
        </div>
      )}
      {SuCo.NgayBatDauXuLy ? (
        <div className="mt-5 rounded border border-rail bg-case-2 p-3 text-sm">
          <p className="font-semibold">Đã bắt đầu xử lý</p>
          <p className="mt-1 text-fog">
            {SuCo.NguoiBatDauXuLy?.HoTen ?? "Nhân sự kỹ thuật"} ·{" "}
            {DinhDangThoiGian(SuCo.NgayBatDauXuLy)}
          </p>
        </div>
      ) : null}

      {SuCo.NhatKyXuLy.length ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold">Lịch sử xử lý</h3>
          <ol className="mt-3 space-y-3">
            {SuCo.NhatKyXuLy.map((Muc) => (
              <li
                className="rounded border border-rail bg-case-2 p-3 text-sm"
                key={Muc.Id}
              >
                <p className="font-semibold">
                  {NhanTrangThaiThietBi[Muc.TrangThaiThietBi]}
                </p>
                <p className="mt-1 whitespace-pre-wrap leading-6 text-fog">
                  {Muc.GhiChu}
                </p>
                <p className="mt-2 text-xs text-fog">
                  {Muc.NguoiThucHien.HoTen} · {DinhDangThoiGian(Muc.NgayTao)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : SuCo.PhuongAnXuLy ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold">Nội dung kiểm tra, sửa chữa</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-fog">
            {SuCo.PhuongAnXuLy}
          </p>
        </div>
      ) : null}

      {SuCo.NgayHoanTat ? (
        <p className="mt-3 text-xs text-phosphor">
          Hoàn tất bởi {SuCo.NguoiHoanTat?.HoTen ?? "nhân sự kỹ thuật"} ·{" "}
          {DinhDangThoiGian(SuCo.NgayHoanTat)}
        </p>
      ) : null}

      {Loi ? (
        <div
          className="mt-4 rounded border border-tally/60 bg-tally/10 p-3 text-sm"
          role="alert"
        >
          {Loi}
        </div>
      ) : null}

      {CoQuyenXuLy && SuCo.TrangThai === "CHO_XU_LY" ? (
        <button
          className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-timecode px-4 text-sm font-semibold text-gunmetal disabled:opacity-60"
          disabled={DangXuLy}
          onClick={() => void BatDau()}
          type="button"
        >
          <Wrench aria-hidden size={17} />
          {DangXuLy ? "Đang cập nhật…" : "Bắt đầu xử lý"}
        </button>
      ) : null}

      {CoQuyenXuLy && SuCo.TrangThai === "DANG_SUA_CHUA" ? (
        DangMoHoanTat ? (
          <div className="mt-5 border-t border-rail pt-5">
            <h3 className="font-semibold">Ghi nhận kết quả xử lý</h3>
            <label className="mt-3 block text-sm">
              Nội dung đã kiểm tra hoặc sửa chữa
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded border border-rail bg-case-2 px-3 py-3"
                maxLength={2000}
                onChange={(SuKien) => SetGhiChuXuLy(SuKien.target.value)}
                value={GhiChuXuLy}
              />
            </label>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">
                Tình trạng thiết bị sau xử lý
              </legend>
              <div className="mt-2 space-y-2">
                {(
                  [
                    [
                      "SAN_SANG",
                      "Đủ điều kiện sử dụng",
                      "Đóng sự cố; khoản mượn và lịch vẫn được kiểm tra khi cấp phát",
                    ],
                    [
                      "BAO_TRI",
                      "Tiếp tục bảo trì",
                      "Giữ sự cố đang mở và thiết bị không khả dụng",
                    ],
                    [
                      "HU_HONG",
                      "Vẫn hư hỏng",
                      "Giữ sự cố đang mở và đánh dấu thiết bị hư hỏng",
                    ],
                  ] as const
                ).map(([GiaTri, Nhan, MoTa]) => (
                  <label
                    className={`flex cursor-pointer gap-3 rounded border p-3 ${
                      KetQuaThietBi === GiaTri
                        ? "border-blueprint bg-blueprint/10"
                        : "border-rail bg-case-2"
                    }`}
                    key={GiaTri}
                  >
                    <input
                      checked={KetQuaThietBi === GiaTri}
                      name="ket-qua-thiet-bi"
                      onChange={() => SetKetQuaThietBi(GiaTri)}
                      type="radio"
                    />
                    <span>
                      <span className="block text-sm font-semibold">
                        {Nhan}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-fog">
                        {MoTa}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded border border-rail px-4 text-sm text-fog"
                disabled={DangXuLy}
                onClick={() => SetDangMoHoanTat(false)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="min-h-11 rounded-sm bg-tally px-4 text-sm font-semibold text-white disabled:opacity-60"
                disabled={DangXuLy}
                onClick={() => void HoanTat()}
                type="button"
              >
                {DangXuLy
                  ? "Đang lưu…"
                  : KetQuaThietBi === "SAN_SANG"
                    ? "Hoàn tất xử lý"
                    : "Lưu kết quả, tiếp tục xử lý"}
              </button>
            </div>
          </div>
        ) : (
          <button
            className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold text-white"
            onClick={() => SetDangMoHoanTat(true)}
            type="button"
          >
            <Settings aria-hidden size={17} /> Ghi nhận kết quả xử lý
          </button>
        )
      ) : null}
    </aside>
  );
}
