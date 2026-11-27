import { BieuMauSuCoVanHanh } from "../Components/BieuMauSuCoVanHanh";
import { GioHienThi } from "../Services/SuCoVanHanhService";
import { SuCoVanHanh } from "../Components/SuCoVanHanh";
import { ThongTinYeuCauTaiNguyen } from "../Components/ThongTinYeuCauTaiNguyen";
import { BieuMauChinhSuaCaQuay } from "../Components/BieuMauChinhSuaCaQuay";
import { CoQuyen } from "../Services/QuyenService";
import { HopThoaiBieuMau } from "../Components/HopThoaiBieuMau";
import { HopThoaiXacNhan } from "../Components/HopThoaiXacNhan";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useXacThuc } from "../Contexts/XacThucContext";
import { TrungTamGiaiQuyetXungDot } from "../Components/TrungTamGiaiQuyetXungDot";
import {
  KiemTraXungDotCaQuay,
  LayChiTietCaQuay,
  NhanBanCaQuay,
  XoaCaQuay,
} from "../Services/CaQuayService";

import { TheoDoiCapNhatLich } from "../Services/SocketLichService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type {
  ChiTietCaQuay,
  ChiTietXungDotCaQuay,
  PhanHoiXungDotCaQuay,
  TrangThaiCaQuay,
} from "../Types/CaQuay";

import type { PhongStudio } from "../Types/PhongStudio";
import type { ThietBi } from "../Types/ThietBi";

// Nhãn vị trí của người phụ trách ca khi liệt kê cùng phân công nhân sự.
const NhanNguoiPhuTrach = "Người phụ trách ca";
const NhanTrangThai: Record<TrangThaiCaQuay, string> = {
  DU_THAO: "Dự thảo",
  DA_DUYET: "Đã duyệt",
  DANG_DIEN_RA: "Đang diễn ra",
  HOAN_THANH: "Hoàn thành",
  DA_HUY: "Đã hủy",
};

function DinhDangThoiGian(ThoiGian: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ThoiGian));
}

function ChuyenSangGiaTriNgayGio(ThoiGian: string) {
  const Ngay = new Date(ThoiGian);
  const Bu = (GiaTri: number) => String(GiaTri).padStart(2, "0");
  return `${Ngay.getFullYear()}-${Bu(Ngay.getMonth() + 1)}-${Bu(Ngay.getDate())}T${Bu(Ngay.getHours())}:${Bu(Ngay.getMinutes())}`;
}

function TinhThoiLuong(BatDau: string, KetThuc: string) {
  const Phut = Math.max(
    0,
    Math.round(
      (new Date(KetThuc).getTime() - new Date(BatDau).getTime()) / 60000,
    ),
  );
  return `${Math.floor(Phut / 60)} giờ ${Phut % 60} phút`;
}

const NhanLoaiTaiNguyen = {
  STUDIO: "Studio",
  THIET_BI: "Thiết bị",
  NHAN_SU: "Nhân sự",
} as const;

function TaoMoTaXungDot(XungDot: ChiTietXungDotCaQuay) {
  if (XungDot.MuonTraQuaHan) {
    return (
      <>
        Chưa được nhập kho sau ca quay “{XungDot.MuonTraQuaHan.TieuDeCaQuay}” ,
        kết thúc lúc {DinhDangThoiGian(XungDot.MuonTraQuaHan.ThoiGianKetThuc)}.
      </>
    );
  }
  if (XungDot.LoaiXungDot === "SU_CO_CHUA_XU_LY") {
    return <>Đang có sự cố hoặc yêu cầu kiểm tra chất lượng chưa khắc phục.</>;
  }
  if (XungDot.TrangThaiTaiNguyen) {
    const NhanTrangThaiTaiNguyen: Record<string, string> = {
      BAO_TRI: "đang bảo trì",
      HU_HONG: "đang hư hỏng",
      DANG_SU_DUNG: "đang được sử dụng",
      DONG_CUA: "đang đóng cửa",
    };
    return (
      <>
        Trạng thái hiện tại:{" "}
        {NhanTrangThaiTaiNguyen[XungDot.TrangThaiTaiNguyen] ??
          "không cho phép phân công"}
        .
      </>
    );
  }
  if (XungDot.CaQuayBiTrung) {
    return (
      <>
        Đã được phân công cho <strong>“{XungDot.CaQuayBiTrung.TieuDe}”</strong>
        {XungDot.CaQuayBiTrung.MaCaQuay
          ? ` (${XungDot.CaQuayBiTrung.MaCaQuay})`
          : ""}
        , từ {DinhDangThoiGian(XungDot.CaQuayBiTrung.ThoiGianBatDau)} đến{" "}
        {DinhDangThoiGian(XungDot.CaQuayBiTrung.ThoiGianKetThuc)}.
      </>
    );
  }
  if (XungDot.KhoangKhongKhaDung) {
    return (
      <>
        Không khả dụng từ {DinhDangThoiGian(XungDot.KhoangKhongKhaDung.BatDau)}{" "}
        đến {DinhDangThoiGian(XungDot.KhoangKhongKhaDung.KetThuc)}
        {XungDot.KhoangKhongKhaDung.LyDo
          ? `. ${XungDot.KhoangKhongKhaDung.LyDo}`
          : "."}
      </>
    );
  }
  return <>Tài nguyên không thể được phân công trong thời gian này.</>;
}

function ThongBaoXungDot({
  PhanHoi: PhanHoi,
}: {
  PhanHoi: PhanHoiXungDotCaQuay;
}) {
  const XungDotTheoLoai = (
    Object.keys(NhanLoaiTaiNguyen) as Array<keyof typeof NhanLoaiTaiNguyen>
  )
    .map((LoaiTaiNguyen) => ({
      LoaiTaiNguyen: LoaiTaiNguyen,
      DanhSach: PhanHoi.DanhSachXungDot.filter(
        (XungDot) => XungDot.LoaiTaiNguyen === LoaiTaiNguyen,
      ),
    }))
    .filter((Nhom) => Nhom.DanhSach.length > 0);

  return (
    <div
      aria-live="assertive"
      className="rounded border border-tally/60 bg-tally/10 p-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-tally" size={19} />
        <div className="min-w-0">
          <h3 className="font-semibold text-paper">Phát hiện xung đột</h3>
          <p className="mt-1 text-sm text-fog">
            Một hoặc nhiều tài nguyên chưa thể đáp ứng lịch quay này. Các lựa
            chọn hiện tại vẫn được giữ nguyên để bạn xem xét.
          </p>
        </div>
      </div>
      <div className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-1">
        {XungDotTheoLoai.map((Nhom) => (
          <section key={Nhom.LoaiTaiNguyen}>
            <h4 className="font-mono text-xs font-semibold uppercase text-timecode">
              {NhanLoaiTaiNguyen[Nhom.LoaiTaiNguyen]} ({Nhom.DanhSach.length})
            </h4>
            <ul className="mt-2 space-y-2">
              {Nhom.DanhSach.map((XungDot, ChiSo) => (
                <li
                  className="min-w-0 rounded border border-rail bg-case-2 p-3 text-sm"
                  key={`${XungDot.LoaiTaiNguyen}-${XungDot.TaiNguyenId}-${ChiSo}`}
                >
                  <p className="break-words font-semibold text-paper">
                    {XungDot.ViTriNguoi === "NGUOI_PHU_TRACH"
                      ? "Người phụ trách ca · "
                      : ""}
                    {XungDot.TenTaiNguyen || "Tài nguyên chưa có tên"}
                  </p>
                  <p className="mt-1 break-words text-fog">
                    {TaoMoTaXungDot(XungDot)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function MoInCallSheet(CaQuay: ChiTietCaQuay) {
  const CuaSoIn = window.open("", "_blank");
  if (!CuaSoIn) {
    toast.error(
      "Trình duyệt đang chặn cửa sổ in. Hãy cho phép cửa sổ bật lên.",
    );
    return;
  }
  const MaHoaHtml = (GiaTri: string | null | undefined) =>
    (GiaTri ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  const Studio = MaHoaHtml(
    CaQuay.PhongStudio?.TenPhong ?? CaQuay.GhiChuDiaDiem ?? "Chưa cập nhật",
  );
  const DongThietBi = CaQuay.DanhSachThietBi.map(
    (PhanCong) =>
      `<li><strong>${MaHoaHtml(PhanCong.ThietBi.TenThietBi)}</strong> · ${MaHoaHtml(PhanCong.ThietBi.MaQR)} · ${MaHoaHtml(PhanCong.ThietBi.DanhMuc.TenDanhMuc)}</li>`,
  ).join("");
  const DongNhanSu = [
    { NguoiDung: CaQuay.NguoiPhuTrach, ChucDanhPhanCong: NhanNguoiPhuTrach },
    ...CaQuay.DanhSachNhanSu,
  ]
    .map(
      (PhanCong) =>
        `<li><strong>${MaHoaHtml(PhanCong.NguoiDung.HoTen)}</strong> · ${MaHoaHtml(PhanCong.ChucDanhPhanCong)}</li>`,
    )
    .join("");
  CuaSoIn.document.write(
    `<!doctype html><html lang="vi"><head><title>Phiếu ca quay - ${MaHoaHtml(CaQuay.TieuDe)}</title><style>body{font-family:Arial,sans-serif;color:#101214;margin:18mm;line-height:1.5}header{border-bottom:3px solid #C4462B;padding-bottom:10px}h1{margin:0;font-size:25px}h2{font-size:15px;margin:22px 0 8px;text-transform:uppercase;color:#5C7A8A}dl{display:grid;grid-template-columns:150px 1fr;gap:7px;margin:0}dt{font-weight:700}dd{margin:0}ul{margin:0;padding-left:20px}.ma{font-family:monospace;color:#555}.chu-ky{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:55px}.chu-ky div{border-top:1px solid #555;padding-top:8px;text-align:center}@media print{@page{size:A4;margin:15mm}}</style></head><body><header><p class="ma">PHIẾU CA QUAY · ${MaHoaHtml(CaQuay.MaCaQuay ?? "CHƯA CẤP MÃ")}</p><h1>${MaHoaHtml(CaQuay.TieuDe)}</h1><p>Dự án: <strong>${MaHoaHtml(CaQuay.DuAn.TenDuAn)}</strong> · ${NhanTrangThai[CaQuay.TrangThai]}</p></header><h2>Thông tin ca quay</h2><dl><dt>Thời gian</dt><dd>${DinhDangThoiGian(CaQuay.ThoiGianBatDau)} – ${DinhDangThoiGian(CaQuay.ThoiGianKetThuc)}</dd><dt>Thời lượng</dt><dd>${TinhThoiLuong(CaQuay.ThoiGianBatDau, CaQuay.ThoiGianKetThuc)}</dd><dt>Studio / địa điểm</dt><dd>${Studio}</dd><dt>Ghi chú</dt><dd>${MaHoaHtml(CaQuay.GhiChu ?? "Không có")}</dd></dl><h2>Nhân sự</h2><ul>${DongNhanSu || "<li>Chưa phân công nhân sự.</li>"}</ul><h2>Thiết bị</h2><ul>${DongThietBi || "<li>Chưa phân công thiết bị.</li>"}</ul><div class="chu-ky"><div>Người phụ trách ca</div><div>Đại diện ê-kíp</div><div>Điều phối sản xuất</div></div><script>window.onload=()=>window.print()<\/script></body></html>`,
  );
  CuaSoIn.document.close();
}

export function ChiTietCaQuay() {
  const { id: Id } = useParams();
  const ChuyenTrang = useNavigate();
  const { NguoiDung } = useXacThuc();
  const [DangBaoSuCo, SetDangBaoSuCo] = useState(false);
  const CoQuyenSua =
    CoQuyen(NguoiDung, "CaQuay.Sua") && CoQuyen(NguoiDung, "CaQuay.PhanCong");
  const [CaQuay, SetCaQuay] = useState<ChiTietCaQuay>();
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");
  const [HienChinhSua, SetHienChinhSua] = useState(false);
  const [HienNhanBan, SetHienNhanBan] = useState(false);
  const [HienXoa, SetHienXoa] = useState(false);
  const [DangLuu, SetDangLuu] = useState(false);
  const [BatDau, SetBatDau] = useState("");
  const [KetThuc, SetKetThuc] = useState("");
  const [LoiNhanBan, SetLoiNhanBan] = useState("");
  const [XungDot, SetXungDot] = useState<PhanHoiXungDotCaQuay | null>(null);
  const [HienTrungTam, SetHienTrungTam] = useState(false);
  const DangSua = useRef(false);
  DangSua.current = HienChinhSua || HienNhanBan;
  async function TaiDuLieu() {
    if (!Id) return;
    try {
      const ChiTiet = await LayChiTietCaQuay(Id);
      SetCaQuay(ChiTiet);
      SetLoi("");
      if (CoQuyen(NguoiDung, "CaQuay.PhanCong")) {
        const KiemTra = await KiemTraXungDotCaQuay({
          ThoiGianBatDau: ChiTiet.ThoiGianBatDau,
          ThoiGianKetThuc: ChiTiet.ThoiGianKetThuc,
          PhongStudioId: ChiTiet.PhongStudioId,
          NguoiPhuTrachId: ChiTiet.NguoiPhuTrachId,
          DanhSachNhanSuId: ChiTiet.DanhSachNhanSu.map(
            (Muc) => Muc.NguoiDungId,
          ),
          DanhSachThietBiId: ChiTiet.DanhSachThietBi.filter(
            (Muc) => !Muc.HieuLucDen,
          ).map((Muc) => Muc.ThietBiId),
          CaQuayHienTaiId: ChiTiet.Id,
          ThoiGianChuanBiPhut: ChiTiet.ThoiGianChuanBiPhut,
          ThoiGianThuHoiPhut: ChiTiet.ThoiGianThuHoiPhut,
        });
        SetXungDot(
          KiemTra.CoXungDot
            ? {
                ThongBao: "Phát hiện xung đột lịch.",
                MaLoi: "XUNG_DOT_LICH_CA_QUAY",
                DanhSachXungDot: KiemTra.DanhSachXungDot,
              }
            : null,
        );
      }
    } catch (LoiTai) {
      SetLoi(LayThongBaoLoi(LoiTai));
    } finally {
      SetDangTai(false);
    }
  }
  useEffect(() => {
    void TaiDuLieu();
    const LamMoi = () => {
      if (!DangSua.current) void TaiDuLieu();
    };
    const HuyLich = TheoDoiCapNhatLich(LamMoi, Id);
    const HuyKho = TheoDoiVanHanh(
      ["kho:xuat-kho", "kho:nhap-kho", "bao_tri:cap_nhat"],
      LamMoi,
    );
    return () => {
      HuyLich();
      HuyKho();
    };
  }, [Id]);
  if (DangTai) return <p role="status">Đang tải ca quay…</p>;
  if (!CaQuay)
    return (
      <p role="alert" className="text-tally">
        {Loi || "Không tìm thấy ca quay."}
      </p>
    );
  const PhanCong = [
    {
      NguoiDungId: CaQuay.NguoiPhuTrachId,
      ChucDanhPhanCong: NhanNguoiPhuTrach,
      NguoiDung: CaQuay.NguoiPhuTrach,
      HieuLucTu: CaQuay.NguoiPhuTrachHieuLucTu,
      HieuLucDen: null,
    },
    ...CaQuay.DanhSachNhanSu,
  ];
  const ViTri = [...new Set(PhanCong.map((Muc) => Muc.ChucDanhPhanCong))];
  return (
    <section>
      <button
        className="mb-4 flex items-center gap-2 text-sm text-fog"
        type="button"
        onClick={() => ChuyenTrang("/lich-ca-quay")}
      >
        <ArrowLeft size={16} />
        Lịch quay
      </button>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-blueprint">
            {CaQuay.MaCaQuay ?? "Chưa cấp mã"}
          </p>
          <h1 className="mt-2 font-serif text-3xl">{CaQuay.TieuDe}</h1>
          <p className="mt-2 text-sm text-fog">
            {CaQuay.DuAn.TenDuAn} · {NhanTrangThai[CaQuay.TrangThai]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="min-h-11 rounded bg-tally px-4 text-paper"
            onClick={() => SetDangBaoSuCo(true)}
          >
            Báo sự cố
          </button>
          <button
            type="button"
            className="rounded border border-rail px-4 text-sm"
            onClick={() => MoInCallSheet(CaQuay)}
          >
            Xuất phiếu ca quay
          </button>
          {CoQuyenSua && (
            <button
              type="button"
              className="rounded bg-tally px-4 text-sm"
              onClick={() => SetHienChinhSua(true)}
            >
              Chỉnh sửa ca quay và phân công
            </button>
          )}
          {CoQuyen(NguoiDung, "CaQuay.Tao") &&
            CoQuyen(NguoiDung, "CaQuay.PhanCong") && (
              <button
                type="button"
                className="rounded border border-rail px-4 text-sm"
                onClick={() => {
                  SetBatDau(ChuyenSangGiaTriNgayGio(CaQuay.ThoiGianBatDau));
                  SetKetThuc(ChuyenSangGiaTriNgayGio(CaQuay.ThoiGianKetThuc));
                  SetLoiNhanBan("");
                  SetHienNhanBan(true);
                }}
              >
                Nhân bản ca quay
              </button>
            )}
          {CoQuyen(NguoiDung, "CaQuay.Xoa") && (
            <button
              type="button"
              className="rounded border border-tally px-4 text-sm text-tally"
              onClick={() => SetHienXoa(true)}
            >
              Xóa ca quay
            </button>
          )}
        </div>
      </header>
      {Loi && (
        <p role="alert" className="mb-4 text-tally">
          {Loi}
        </p>
      )}
      <div className="mb-5">
        <ThongTinYeuCauTaiNguyen DanhSach={CaQuay.CacYeuCauHienThi ?? []} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded border border-rail bg-case p-5">
          <h2 className="font-semibold">Thông tin chung</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[160px_1fr]">
            <dt className="text-fog">Dự án</dt>
            <dd>{CaQuay.DuAn.TenDuAn}</dd>
            <dt className="text-fog">Thời gian</dt>
            <dd>
              {DinhDangThoiGian(CaQuay.ThoiGianBatDau)} –{" "}
              {DinhDangThoiGian(CaQuay.ThoiGianKetThuc)}
            </dd>
            <dt className="text-fog">Thời lượng</dt>
            <dd>
              {TinhThoiLuong(CaQuay.ThoiGianBatDau, CaQuay.ThoiGianKetThuc)}
            </dd>
            <dt className="text-fog">Mức độ ưu tiên</dt>
            <dd>{CaQuay.MucDoUuTien}/100</dd>
            <dt className="text-fog">Lịch linh hoạt</dt>
            <dd>{CaQuay.CoTheDoiLich ? "Có thể đổi lịch" : "Lịch cố định"}</dd>
            <dt className="text-fog">Chuẩn bị / thu hồi</dt>
            <dd>
              {CaQuay.ThoiGianChuanBiPhut} phút / {CaQuay.ThoiGianThuHoiPhut}{" "}
              phút
            </dd>
            <dt className="text-fog">Ghi chú</dt>
            <dd>{CaQuay.GhiChu || "Chưa có ghi chú."}</dd>
          </dl>
        </article>
        <article className="rounded border border-rail bg-case p-5">
          <h2 className="font-semibold">Phòng quay / địa điểm</h2>
          <p className="mt-4 text-sm">
            {CaQuay.PhongStudio?.TenPhong ??
              CaQuay.GhiChuDiaDiem ??
              "Chưa phân công phòng quay."}
          </p>
          {CaQuay.GhiChuDiaDiem && (
            <p className="mt-3 text-sm text-fog">{CaQuay.GhiChuDiaDiem}</p>
          )}
        </article>
      </div>
      {XungDot && (
        <div className="mt-5">
          <ThongBaoXungDot PhanHoi={XungDot} />
          {CoQuyen(NguoiDung, "CaQuay.PhanCong") && (
            <button
              type="button"
              className="mt-3 rounded border border-rail px-4"
              onClick={() => SetHienTrungTam(true)}
            >
              Xem các phương án xử lý
            </button>
          )}
        </div>
      )}
      <TrungTamGiaiQuyetXungDot
        CaQuayId={CaQuay.Id}
        DangMo={HienTrungTam}
        OnDaApDung={TaiDuLieu}
        OnDong={() => SetHienTrungTam(false)}
      />
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <article className="rounded border border-rail bg-case p-5">
          <h2 className="font-semibold">
            Thiết bị · {CaQuay.DanhSachThietBi.length}
          </h2>
          <ul className="mt-4 space-y-3">
            {CaQuay.DanhSachThietBi.map((Muc) => (
              <li
                key={Muc.Id}
                className="rounded border border-rail bg-case-2 p-3 text-sm"
              >
                <p>{Muc.ThietBi.TenThietBi}</p>
                {Muc.HieuLucDen && (
                  <p className="mt-1 text-timecode">
                    Hết hiệu lực sử dụng từ {GioHienThi(Muc.HieuLucDen)} · Vẫn
                    cần thu hồi nếu chưa nhập kho
                  </p>
                )}
                {Muc.HieuLucTu && (
                  <p className="mt-1 text-fog">
                    Máy thay thế · Hiệu lực từ {GioHienThi(Muc.HieuLucTu)}
                  </p>
                )}
                <p className="mt-1 font-mono text-xs text-fog">
                  {Muc.ThietBi.MaQR}
                </p>
              </li>
            ))}
          </ul>
          {!CaQuay.DanhSachThietBi.length && (
            <p className="mt-4 text-sm text-fog">Chưa phân công thiết bị.</p>
          )}
        </article>
        <article className="rounded border border-rail bg-case p-5">
          <h2 className="font-semibold">Nhân sự theo vị trí</h2>
          <div className="mt-4 space-y-4">
            {ViTri.map((Ten) => (
              <div key={Ten}>
                <h3 className="text-sm text-blueprint">{Ten}</h3>
                <ul className="mt-2 space-y-2">
                  {PhanCong.filter((Muc) => Muc.ChucDanhPhanCong === Ten).map(
                    (Muc, ViTri) => (
                      <li
                        className="rounded border border-rail bg-case-2 p-3 text-sm"
                        key={Muc.NguoiDungId + ViTri}
                      >
                        {Muc.NguoiDung.HoTen}
                        {Muc.NguoiDung.ChucDanh && (
                          <span className="text-fog">
                            {" "}
                            · {Muc.NguoiDung.ChucDanh.TenChucDanh}
                          </span>
                        )}
                        {Muc.HieuLucTu && (
                          <p className="mt-1 text-xs text-fog">
                            Nhận phần việc từ {GioHienThi(Muc.HieuLucTu)}
                          </p>
                        )}
                        {Muc.HieuLucDen && (
                          <p className="mt-1 text-xs text-fog">
                            Phân công có hiệu lực đến{" "}
                            {GioHienThi(Muc.HieuLucDen)}
                          </p>
                        )}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
          </div>
        </article>
      </div>
      {HienChinhSua && (
        <BieuMauChinhSuaCaQuay
          CaQuay={CaQuay}
          OnDong={() => SetHienChinhSua(false)}
          OnDaLuu={TaiDuLieu}
        />
      )}
      {HienXoa && (
        <HopThoaiXacNhan
          TieuDe="Xóa ca quay"
          MoTa="Ca quay sẽ bị xóa nếu không có dữ liệu vận hành liên quan."
          NhanXacNhan="Xóa ca quay"
          DangXuLy={DangLuu}
          OnHuy={() => SetHienXoa(false)}
          OnXacNhan={async () => {
            SetDangLuu(true);
            try {
              await XoaCaQuay(CaQuay.Id);
              toast.success("Đã xóa ca quay.");
              ChuyenTrang("/lich-ca-quay");
            } catch (LoiXoa) {
              toast.error(LayThongBaoLoi(LoiXoa));
            } finally {
              SetDangLuu(false);
            }
          }}
        />
      )}
      {HienNhanBan && (
        <HopThoaiBieuMau
          TieuDe="Nhân bản ca quay"
          DangXuLy={DangLuu}
          OnDong={() => SetHienNhanBan(false)}
        >
          <form
            className="mt-5 space-y-4"
            onSubmit={async (SuKien) => {
              SuKien.preventDefault();
              SetDangLuu(true);
              SetLoiNhanBan("");
              try {
                const KetQua = await NhanBanCaQuay({
                  DuAnId: CaQuay.DuAn.Id,
                  TieuDe: CaQuay.TieuDe + " (bản sao)",
                  ThoiGianBatDau: new Date(BatDau).toISOString(),
                  ThoiGianKetThuc: new Date(KetThuc).toISOString(),
                  PhongStudioId: CaQuay.PhongStudioId,
                  NguoiPhuTrachId: CaQuay.NguoiPhuTrachId,
                  CacYeuCauTaiNguyen: (CaQuay.CacYeuCauTaiNguyen ?? []).map(
                    (Muc) => ({ ...Muc, Id: crypto.randomUUID() }),
                  ),
                  GhiChu: CaQuay.GhiChu ?? undefined,
                  GhiChuDiaDiem: CaQuay.GhiChuDiaDiem ?? undefined,
                  MucDoUuTien: CaQuay.MucDoUuTien,
                  CoTheDoiLich: CaQuay.CoTheDoiLich,
                  ThoiGianChuanBiPhut: CaQuay.ThoiGianChuanBiPhut,
                  ThoiGianThuHoiPhut: CaQuay.ThoiGianThuHoiPhut,
                  TrangThai: "DU_THAO",
                  DanhSachThietBiId: CaQuay.DanhSachThietBi.map(
                    (Muc) => Muc.ThietBiId,
                  ),
                  DanhSachNhanSu: CaQuay.DanhSachNhanSu.map((Muc) => ({
                    NguoiDungId: Muc.NguoiDungId,
                    ChucDanhPhanCong: Muc.ChucDanhPhanCong,
                  })),
                });
                SetHienNhanBan(false);
                ChuyenTrang("/ca-quay/" + KetQua.Id);
              } catch (LoiTao) {
                SetLoiNhanBan(LayThongBaoLoi(LoiTao));
              } finally {
                SetDangLuu(false);
              }
            }}
          >
            <label className="block">
              <span className="mb-2 block">Bắt đầu</span>
              <input
                required
                type="datetime-local"
                className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                value={BatDau}
                onChange={(SuKien) => SetBatDau(SuKien.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block">Kết thúc</span>
              <input
                required
                type="datetime-local"
                className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                value={KetThuc}
                onChange={(SuKien) => SetKetThuc(SuKien.target.value)}
              />
            </label>
            {LoiNhanBan && (
              <p role="alert" className="text-tally">
                {LoiNhanBan}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded border border-rail px-4"
                disabled={DangLuu}
                onClick={() => SetHienNhanBan(false)}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded bg-tally px-4"
                disabled={DangLuu}
              >
                {DangLuu ? "Đang tạo…" : "Tạo bản sao"}
              </button>
            </div>
          </form>
        </HopThoaiBieuMau>
      )}
      {DangBaoSuCo && (
        <BieuMauSuCoVanHanh
          CaQuayId={CaQuay.Id}
          OnDong={() => SetDangBaoSuCo(false)}
        />
      )}
      <SuCoVanHanh CaQuayId={CaQuay.Id} />
    </section>
  );
}
