import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayDanhSachCaQuay } from "../Services/CaQuayService";
import { LayDanhSachNhanSu } from "../Services/NhanSuService";
import {
  LayNhatKyMuonTra,
  type BoLocNhatKyMuonTra,
  type NhatKyMuonTra as DongNhatKy,
} from "../Services/NhatKyMuonTraService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import { LayDanhSachThietBi } from "../Services/ThietBiService";
import { LayDanhSachKho } from "../Services/VanHanhKhoService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type { CaQuay } from "../Types/CaQuay";
import type { NhanSu } from "../Types/NhanSu";
import type { Kho, ThietBi } from "../Types/ThietBi";

const KichThuocTrang = 25;
const NhanTinhTrang = {
  BINH_THUONG: "Bình thường",
  CAN_KIEM_TRA: "Cần kiểm tra",
  HU_HONG: "Có hư hỏng",
} as const;

function DinhDangNgay(Ngay: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(Ngay));
}

export function NhatKyMuonTra() {
  const [BoLoc, SetBoLoc] = useState({
    TuNgay: "",
    DenNgay: "",
    LoaiHanhDong: "",
    KhoId: "",
    ThietBiId: "",
    CaQuayId: "",
    NguoiThucHienId: "",
  });
  const [Trang, SetTrang] = useState(1);
  const [LanTai, SetLanTai] = useState(0);
  const [DanhSach, SetDanhSach] = useState<DongNhatKy[]>([]);
  const [TongSo, SetTongSo] = useState(0);
  const [CacKho, SetCacKho] = useState<Kho[]>([]);
  const [CacThietBi, SetCacThietBi] = useState<ThietBi[]>([]);
  const [CacCaQuay, SetCacCaQuay] = useState<CaQuay[]>([]);
  const [CacNhanSu, SetCacNhanSu] = useState<NhanSu[]>([]);
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");

  useEffect(() => {
    void Promise.all([
      LayDanhSachKho(true),
      LayDanhSachThietBi({}),
      LayDanhSachCaQuay(),
      LayDanhSachNhanSu({}),
    ])
      .then(([Kho, ThietBi, CaQuay, NhanSu]) => {
        SetCacKho(Kho);
        SetCacThietBi(ThietBi);
        SetCacCaQuay(CaQuay);
        SetCacNhanSu(NhanSu);
      })
      .catch((LoiTai) => SetLoi(LayThongBaoLoi(LoiTai)));
    return TheoDoiVanHanh(["kho:xuat-kho", "kho:nhap-kho"], () =>
      SetLanTai((Lan) => Lan + 1),
    );
  }, []);

  useEffect(() => {
    let ConHieuLuc = true;
    const ThamSo: BoLocNhatKyMuonTra = {
      Trang: Trang,
      KichThuocTrang: KichThuocTrang,
      TuNgay: BoLoc.TuNgay
        ? new Date(`${BoLoc.TuNgay}T00:00:00+07:00`).toISOString()
        : undefined,
      DenNgay: BoLoc.DenNgay
        ? new Date(`${BoLoc.DenNgay}T23:59:59.999+07:00`).toISOString()
        : undefined,
      LoaiHanhDong:
        (BoLoc.LoaiHanhDong as BoLocNhatKyMuonTra["LoaiHanhDong"]) || undefined,
      KhoId: BoLoc.KhoId || undefined,
      ThietBiId: BoLoc.ThietBiId || undefined,
      CaQuayId: BoLoc.CaQuayId || undefined,
      NguoiThucHienId: BoLoc.NguoiThucHienId || undefined,
    };
    void LayNhatKyMuonTra(ThamSo)
      .then((DuLieu) => {
        if (ConHieuLuc) {
          SetDanhSach(DuLieu.DanhSach);
          SetTongSo(DuLieu.TongSo);
          SetLoi("");
          SetDangTai(false);
        }
      })
      .catch((LoiTai) => {
        if (ConHieuLuc) {
          SetLoi(LayThongBaoLoi(LoiTai));
          SetDangTai(false);
        }
      });
    return () => {
      ConHieuLuc = false;
    };
  }, [BoLoc, Trang, LanTai]);

  function DoiBoLoc(Ten: keyof typeof BoLoc, GiaTri: string) {
    SetBoLoc((HienTai) => ({ ...HienTai, [Ten]: GiaTri }));
    SetTrang(1);
    SetDangTai(true);
  }

  return (
    <section>
      <header className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl">Nhật ký và sự cố</h1>
        <p className="mt-2 text-sm text-fog">
          Lịch sử xuất, nhập kho được lưu từ giao dịch đã hoàn tất.
        </p>
      </header>
      <nav
        aria-label="Nhật ký và sự cố"
        className="mb-5 flex gap-2 border-b border-rail"
      >
        <Link
          aria-current="page"
          className="border-b-2 border-tally px-4 py-3 text-sm"
          to="/nhat-ky-su-co"
        >
          Nhật ký mượn/trả
        </Link>
        <Link className="px-4 py-3 text-sm text-fog" to="/bao-tri">
          Quản lý bảo trì
        </Link>
      </nav>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm text-fog">
          Từ ngày
          <input
            className="mt-1 h-11 w-full rounded border border-rail bg-case-2 px-3 text-paper"
            type="date"
            value={BoLoc.TuNgay}
            onChange={(E) => DoiBoLoc("TuNgay", E.target.value)}
          />
        </label>
        <label className="text-sm text-fog">
          Đến ngày
          <input
            className="mt-1 h-11 w-full rounded border border-rail bg-case-2 px-3 text-paper"
            type="date"
            value={BoLoc.DenNgay}
            onChange={(E) => DoiBoLoc("DenNgay", E.target.value)}
          />
        </label>
        <label className="text-sm text-fog">
          Thao tác
          <select
            className="mt-1 h-11 w-full rounded border border-rail bg-case-2 px-3 text-paper"
            value={BoLoc.LoaiHanhDong}
            onChange={(E) => DoiBoLoc("LoaiHanhDong", E.target.value)}
          >
            <option value="">Tất cả thao tác</option>
            <option value="XUAT_KHO">Xuất kho</option>
            <option value="NHAP_KHO">Nhập kho</option>
          </select>
        </label>
        <label className="text-sm text-fog">
          Kho
          <select
            className="mt-1 h-11 w-full rounded border border-rail bg-case-2 px-3 text-paper"
            value={BoLoc.KhoId}
            onChange={(E) => DoiBoLoc("KhoId", E.target.value)}
          >
            <option value="">Tất cả kho</option>
            {CacKho.map((Kho) => (
              <option key={Kho.Id} value={Kho.Id}>
                {Kho.TenKho}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-fog">
          Thiết bị
          <select
            className="mt-1 h-11 w-full rounded border border-rail bg-case-2 px-3 text-paper"
            value={BoLoc.ThietBiId}
            onChange={(E) => DoiBoLoc("ThietBiId", E.target.value)}
          >
            <option value="">Tất cả thiết bị</option>
            {CacThietBi.map((ThietBi) => (
              <option key={ThietBi.Id} value={ThietBi.Id}>
                {ThietBi.TenThietBi}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-fog">
          Ca quay
          <select
            className="mt-1 h-11 w-full rounded border border-rail bg-case-2 px-3 text-paper"
            value={BoLoc.CaQuayId}
            onChange={(E) => DoiBoLoc("CaQuayId", E.target.value)}
          >
            <option value="">Tất cả ca quay</option>
            {CacCaQuay.map((CaQuay) => (
              <option key={CaQuay.Id} value={CaQuay.Id}>
                {CaQuay.TieuDe}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-fog">
          Người thực hiện
          <select
            className="mt-1 h-11 w-full rounded border border-rail bg-case-2 px-3 text-paper"
            value={BoLoc.NguoiThucHienId}
            onChange={(E) => DoiBoLoc("NguoiThucHienId", E.target.value)}
          >
            <option value="">Tất cả nhân sự</option>
            {CacNhanSu.map((Nguoi) => (
              <option key={Nguoi.Id} value={Nguoi.Id}>
                {Nguoi.HoTen}
              </option>
            ))}
          </select>
        </label>
      </div>
      {Loi ? (
        <p
          role="alert"
          className="rounded border border-tally/50 bg-tally/10 p-4 text-sm"
        >
          {Loi}
        </p>
      ) : DangTai ? (
        <p className="p-5 text-sm text-fog">Đang tải nhật ký…</p>
      ) : DanhSach.length ? (
        <div className="space-y-3">
          {DanhSach.map((Muc) => (
            <article
              key={Muc.Id}
              className="min-w-0 rounded border border-rail bg-case p-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <strong className="break-words">
                    {Muc.ThietBi.TenThietBi}
                  </strong>
                  <span className="ml-2 text-xs text-fog">
                    {Muc.ThietBi.MaQR}
                  </span>
                </div>
                <span className="rounded bg-blueprint/15 px-2 py-1 text-xs">
                  {Muc.LoaiHanhDong === "XUAT_KHO" ? "Xuất kho" : "Nhập kho"}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-fog sm:grid-cols-2 xl:grid-cols-4">
                <p>{DinhDangNgay(Muc.ThoiGian)}</p>
                <p>Người thực hiện: {Muc.NguoiThucHien.HoTen}</p>
                <p>Ca quay: {Muc.CaQuay.TieuDe}</p>
                <p>Kho: {Muc.GiaoDichKho?.Kho.TenKho ?? "Chưa ghi nhận"}</p>
                <p>
                  Phương thức:{" "}
                  {Muc.PhuongThuc === "NHAP_TAY"
                    ? "Nhập mã bằng tay"
                    : "Quét mã QR"}
                </p>
                {Muc.TinhTrangTra ? (
                  <p>Tình trạng trả: {NhanTinhTrang[Muc.TinhTrangTra]}</p>
                ) : null}
                {Muc.KhoNguon && Muc.GiaoDichKho?.Kho.Id !== Muc.KhoNguon.Id ? (
                  <p>
                    Chuyển kho: {Muc.KhoNguon.TenKho} →{" "}
                    {Muc.GiaoDichKho?.Kho.TenKho}
                  </p>
                ) : null}
                {Muc.GiaoDichKho ? (
                  <p>
                    Vị trí:{" "}
                    {Muc.GiaoDichKho.ViTriDat ? "Đã xác minh" : "Chưa đạt"} ·{" "}
                    {Number(Muc.GiaoDichKho.KhoangCachDenKhoMet).toFixed(0)} m
                  </p>
                ) : null}
              </div>
              {Muc.GhiChuTinhTrang ? (
                <p className="mt-2 break-words text-fog">
                  Ghi chú: {Muc.GhiChuTinhTrang}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded border border-rail bg-case p-6 text-sm text-fog">
          Không có giao dịch phù hợp.
        </p>
      )}
      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-fog">
        <span>
          {TongSo} bản ghi · Trang {Trang}/
          {Math.max(1, Math.ceil(TongSo / KichThuocTrang))}
        </span>
        <div className="flex gap-2">
          <button
            className="min-h-11 rounded border border-rail px-4 disabled:opacity-40"
            disabled={Trang <= 1}
            onClick={() => {
              SetTrang((HienTai) => HienTai - 1);
              SetDangTai(true);
            }}
            type="button"
          >
            Trang trước
          </button>
          <button
            className="min-h-11 rounded border border-rail px-4 disabled:opacity-40"
            disabled={Trang * KichThuocTrang >= TongSo}
            onClick={() => {
              SetTrang((HienTai) => HienTai + 1);
              SetDangTai(true);
            }}
            type="button"
          >
            Trang sau
          </button>
        </div>
      </footer>
    </section>
  );
}
