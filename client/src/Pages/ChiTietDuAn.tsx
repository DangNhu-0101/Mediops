import { SuCoVanHanh } from "../Components/SuCoVanHanh";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useXacThuc } from "../Contexts/XacThucContext";
import { CoQuyen } from "../Services/QuyenService";
import { LayDuAnThongKe } from "../Services/ThongKeVanHanhService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import { TheoDoiCapNhatLich } from "../Services/SocketLichService";
import {
  LocMacDinh,
  type DuAnThongKe,
  type LocThongKe,
} from "../Types/ThongKeVanHanh";
import {
  DinhDangGio,
  DinhDangThoiGian,
  LoiThongKe,
  PhanTrangThongKe,
} from "../Components/ThongKeVanHanh";
import { ThanhTabQuanLy } from "../Components/DieuHuongKho";

const NhanCa: Record<string, string> = {
  DU_THAO: "Dự thảo",
  DA_DUYET: "Đã duyệt",
  DANG_DIEN_RA: "Đang diễn ra",
  HOAN_THANH: "Hoàn thành",
  DA_HUY: "Đã hủy",
};
const NhanDuAn: Record<string, string> = {
  DANG_CHUAN_BI: "Đang chuẩn bị",
  DANG_SAN_XUAT: "Đang sản xuất",
  HOAN_THANH: "Hoàn thành",
  DA_HUY: "Đã hủy",
};
const NhanSuCo: Record<string, string> = {
  CHO_XU_LY: "Chờ xử lý",
  DANG_SUA_CHUA: "Đang sửa chữa",
  DA_KHAC_PHUC: "Đã khắc phục",
};
const CacTab = ["Tổng quan", "Ca quay", "Tài nguyên", "Sự cố"];
interface LocTraCuuDuAn extends LocThongKe {
  TrangTaiNguyen: number;
  CaTimKiem?: string;
  CaTrangThai?: string;
  CaTuNgay?: string;
  CaDenNgay?: string;
  TaiNguyenTimKiem?: string;
  TaiNguyenCa?: string;
  SuCoTrangThai?: string;
  SuCoTuNgay?: string;
  SuCoDenNgay?: string;
}
export function ChiTietDuAn() {
  const { id: Id = "" } = useParams();
  const [ThamSoDuongDan, SetThamSoDuongDan] = useSearchParams();
  const { NguoiDung } = useXacThuc();
  const [DuLieu, SetDuLieu] = useState<DuAnThongKe>();
  const [Tab, SetTab] = useState(
    CacTab.includes(ThamSoDuongDan.get("Tab") ?? "")
      ? ThamSoDuongDan.get("Tab")!
      : "Tổng quan",
  );
  const [Nhom, SetNhom] = useState<"ThietBi" | "NhanSu" | "Studio">(
    (["ThietBi", "NhanSu", "Studio"].includes(ThamSoDuongDan.get("Nhom") ?? "")
      ? ThamSoDuongDan.get("Nhom")!
      : "ThietBi") as "ThietBi" | "NhanSu" | "Studio",
  );
  const [Loc, SetLoc] = useState<LocTraCuuDuAn>({
    ...LocMacDinh,
    Trang: Math.max(1, Number(ThamSoDuongDan.get("Trang")) || 1),
    TrangTaiNguyen: Math.max(
      1,
      Number(ThamSoDuongDan.get("TrangTaiNguyen")) || 1,
    ),
    ...Object.fromEntries(
      [
        "CaTimKiem",
        "CaTrangThai",
        "CaTuNgay",
        "CaDenNgay",
        "TaiNguyenTimKiem",
        "TaiNguyenCa",
        "SuCoTrangThai",
        "SuCoTuNgay",
        "SuCoDenNgay",
      ].flatMap((Khoa) =>
        ThamSoDuongDan.get(Khoa) ? [[Khoa, ThamSoDuongDan.get(Khoa)!]] : [],
      ),
    ),
  });
  const [Loi, SetLoi] = useState("");
  const [DangTai, SetDangTai] = useState(true);
  const [LanTai, SetLanTai] = useState(0);
  useEffect(() => {
    const Moi = new URLSearchParams();
    Moi.set("Tab", Tab);
    Moi.set("Nhom", Nhom);
    for (const [Khoa, GiaTri] of Object.entries(Loc))
      if (GiaTri && !["Ky", "TuNgay", "DenNgay"].includes(Khoa))
        Moi.set(Khoa, String(GiaTri));
    SetThamSoDuongDan(Moi, { replace: true });
  }, [Tab, Loc, Nhom, SetThamSoDuongDan]);
  useEffect(() => {
    let HieuLuc = true;
    SetDangTai(true);
    SetLoi("");
    void LayDuAnThongKe(Id, { ...Loc, Ky: "TOAN_BO" })
      .then((Moi) => {
        if (HieuLuc) SetDuLieu(Moi);
      })
      .catch((E) => {
        if (HieuLuc) SetLoi(LayThongBaoLoi(E));
      })
      .finally(() => {
        if (HieuLuc) SetDangTai(false);
      });
    return () => {
      HieuLuc = false;
    };
  }, [Id, Loc, LanTai]);
  useEffect(
    () =>
      TheoDoiVanHanh(["kho:xuat-kho", "kho:nhap-kho", "bao_tri:cap_nhat"], () =>
        SetLanTai((So) => So + 1),
      ),
    [],
  );
  useEffect(() => TheoDoiCapNhatLich(() => SetLanTai((So) => So + 1)), []);
  const LopNhap =
    "min-h-11 min-w-0 rounded border border-rail bg-case-2 px-3 text-sm";
  const TaiNguyen = DuLieu?.TaiNguyen[Nhom];
  return (
    <section className="space-y-5">
      <Link
        className="inline-flex min-h-11 items-center text-sm text-blueprint hover:underline"
        to="/du-an"
      >
        ← Danh sách dự án
      </Link>
      {DuLieu && (
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="break-words font-serif text-3xl">
              {DuLieu.TenDuAn}
            </h1>
            <p className="mt-2 text-sm text-fog">
              {DuLieu.MaDuAn ?? "Chưa có mã"} · {NhanDuAn[DuLieu.TrangThai]}
              {DuLieu.TenKhachHang ? ` · ${DuLieu.TenKhachHang}` : ""}
            </p>
            {DuLieu.MoTa && (
              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm text-fog">
                {DuLieu.MoTa}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {CoQuyen(NguoiDung, "DuAn.Sua") && (
              <Link
                className="inline-flex min-h-11 items-center rounded border border-rail px-4 text-sm"
                to={`/du-an?TimKiem=${encodeURIComponent(DuLieu.MaDuAn ?? DuLieu.TenDuAn)}&ChinhSua=${Id}`}
              >
                Sửa dự án
              </Link>
            )}
            {CoQuyen(NguoiDung, "CaQuay.Tao") &&
              CoQuyen(NguoiDung, "CaQuay.PhanCong") && (
                <Link
                  className="inline-flex min-h-11 items-center rounded bg-tally px-4 text-sm font-semibold"
                  to={`/lich-ca-quay?DuAnId=${Id}`}
                >
                  Tạo ca quay
                </Link>
              )}
          </div>
        </header>
      )}
      <ThanhTabQuanLy
        CacTab={CacTab}
        DangChon={Tab}
        OnChon={(Ten) => {
          SetTab(Ten);
          SetLoc({ ...Loc, Trang: 1, TrangTaiNguyen: 1 });
        }}
      />
      {DuLieu && (
        <p className="text-xs text-fog">
          Thống kê toàn bộ dự án ·{" "}
          {DuLieu.PhamViCa === "DUOC_PHAN_CONG"
            ? "chỉ gồm ca bạn được phân công"
            : "trong phạm vi được xem"}
          . Bộ lọc bên dưới chỉ phục vụ tra cứu danh sách.
        </p>
      )}
      {Tab === "Ca quay" && (
        <div className="flex flex-wrap gap-3">
          <input
            className={`${LopNhap} flex-1`}
            aria-label="Tìm ca quay"
            placeholder="Tìm tên hoặc mã ca"
            value={Loc.CaTimKiem ?? ""}
            onChange={(E) =>
              SetLoc({ ...Loc, CaTimKiem: E.target.value, Trang: 1 })
            }
          />
          <select
            aria-label="Trạng thái ca quay"
            className={LopNhap}
            value={Loc.CaTrangThai ?? ""}
            onChange={(E) =>
              SetLoc({
                ...Loc,
                CaTrangThai: E.target.value || undefined,
                Trang: 1,
              })
            }
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(NhanCa).map(([Ma, Ten]) => (
              <option key={Ma} value={Ma}>
                {Ten}
              </option>
            ))}
          </select>
          <label className="grid gap-1 text-xs text-fog">
            Quay từ ngày
            <input
              type="date"
              className={LopNhap}
              value={Loc.CaTuNgay ?? ""}
              onChange={(E) =>
                SetLoc({
                  ...Loc,
                  CaTuNgay: E.target.value || undefined,
                  Trang: 1,
                })
              }
            />
          </label>
          <label className="grid gap-1 text-xs text-fog">
            Đến ngày
            <input
              type="date"
              className={LopNhap}
              value={Loc.CaDenNgay ?? ""}
              onChange={(E) =>
                SetLoc({
                  ...Loc,
                  CaDenNgay: E.target.value || undefined,
                  Trang: 1,
                })
              }
            />
          </label>
        </div>
      )}
      {Tab === "Tài nguyên" && (
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Loại tài nguyên"
            className={LopNhap}
            value={Nhom}
            onChange={(E) => {
              SetNhom(E.target.value as typeof Nhom);
              SetLoc({ ...Loc, TrangTaiNguyen: 1 });
            }}
          >
            <option value="ThietBi">Thiết bị</option>
            <option value="NhanSu">Nhân sự và người phụ trách ca</option>
            <option value="Studio">Studio</option>
          </select>
          <input
            className={`${LopNhap} flex-1`}
            aria-label="Tìm tài nguyên"
            placeholder="Tên tài nguyên hoặc mã máy"
            value={Loc.TaiNguyenTimKiem ?? ""}
            onChange={(E) =>
              SetLoc({
                ...Loc,
                TaiNguyenTimKiem: E.target.value,
                TrangTaiNguyen: 1,
              })
            }
          />
          <input
            className={`${LopNhap} flex-1`}
            aria-label="Lọc theo ca liên quan"
            placeholder="Tên hoặc mã ca liên quan"
            value={Loc.TaiNguyenCa ?? ""}
            onChange={(E) =>
              SetLoc({ ...Loc, TaiNguyenCa: E.target.value, TrangTaiNguyen: 1 })
            }
          />
        </div>
      )}
      {Tab === "Sự cố" && (
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Trạng thái sự cố"
            className={LopNhap}
            value={Loc.SuCoTrangThai ?? ""}
            onChange={(E) =>
              SetLoc({
                ...Loc,
                SuCoTrangThai: E.target.value || undefined,
                Trang: 1,
              })
            }
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(NhanSuCo).map(([Ma, Ten]) => (
              <option key={Ma} value={Ma}>
                {Ten}
              </option>
            ))}
          </select>
          <label className="grid gap-1 text-xs text-fog">
            Báo từ ngày
            <input
              type="date"
              className={LopNhap}
              value={Loc.SuCoTuNgay ?? ""}
              onChange={(E) =>
                SetLoc({
                  ...Loc,
                  SuCoTuNgay: E.target.value || undefined,
                  Trang: 1,
                })
              }
            />
          </label>
          <label className="grid gap-1 text-xs text-fog">
            Đến ngày
            <input
              type="date"
              className={LopNhap}
              value={Loc.SuCoDenNgay ?? ""}
              onChange={(E) =>
                SetLoc({
                  ...Loc,
                  SuCoDenNgay: E.target.value || undefined,
                  Trang: 1,
                })
              }
            />
          </label>
        </div>
      )}
      {Loi ? (
        <LoiThongKe Loi={Loi} OnThuLai={() => SetLanTai(LanTai + 1)} />
      ) : DangTai ? (
        <p className="py-8 text-fog" role="status">
          Đang tải dự án…
        </p>
      ) : (
        DuLieu && (
          <>
            {Tab === "Tổng quan" && (
              <div className="space-y-5">
                <dl className="grid grid-cols-2 gap-x-5 gap-y-6 border-y border-rail py-5 md:grid-cols-4">
                  {[
                    ["Ca quay", DuLieu.ThongKeCa.TongSo],
                    [
                      "Ca hoàn thành",
                      DuLieu.ThongKeCa.TheoTrangThai.HOAN_THANH ?? 0,
                    ],
                    ["Giờ quay theo lịch", DinhDangGio(DuLieu.GioQuayTheoLich)],
                    ["Sự cố", DuLieu.TongSuCoToanDuAn ?? "Chưa có quyền xem"],
                    [
                      "Thiết bị riêng biệt",
                      DuLieu.TaiNguyen.ThietBi.SoLuongRiengBiet,
                    ],
                    [
                      "Nhân sự và người phụ trách ca",
                      DuLieu.TaiNguyen.NhanSu.SoLuongRiengBiet,
                    ],
                    [
                      "Studio riêng biệt",
                      DuLieu.TaiNguyen.Studio.SoLuongRiengBiet,
                    ],
                  ].map(([Nhan, So]) => (
                    <div key={Nhan}>
                      <dt className="text-xs text-fog">{Nhan}</dt>
                      <dd className="mt-2 text-2xl font-semibold tabular-nums">
                        {So}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="rounded border border-rail bg-case p-5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <h2 className="font-semibold">Tiến độ hoàn thành</h2>
                    <span className="tabular-nums">
                      {DuLieu.ThongKeCa.TienDo === null
                        ? "Chưa có ca hợp lệ"
                        : `${Math.round(DuLieu.ThongKeCa.TienDo)}%`}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Tiến độ ca quay"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={DuLieu.ThongKeCa.TienDo ?? 0}
                    className="mt-3 h-2 overflow-hidden rounded bg-case-2"
                  >
                    <div
                      className="h-full bg-phosphor"
                      style={{ width: `${DuLieu.ThongKeCa.TienDo ?? 0}%` }}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-fog">
                    {Object.entries(NhanCa).map(([Ma, Ten]) => (
                      <span key={Ma}>
                        {Ten}: {DuLieu.ThongKeCa.TheoTrangThai[Ma] ?? 0}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs leading-5 text-fog">
                  Giờ quay là tổng thời lượng ca theo lịch, không gồm đệm; ca
                  hủy và dự thảo không tính vào giờ lịch hợp lệ. Tài nguyên
                  riêng biệt tính trên các ca hợp lệ, không nhân đôi người kiêm
                  phụ trách ca. Giờ vận hành thực tế: chưa có dữ liệu thực tế.
                </p>
              </div>
            )}
            {Tab === "Ca quay" && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {DuLieu.DanhSachCa.map((Ca) => (
                    <article
                      key={Ca.Id}
                      className="rounded border border-rail bg-case p-4"
                    >
                      <p className="text-xs text-fog">
                        {Ca.MaCaQuay ?? "Chưa có mã"} · {NhanCa[Ca.TrangThai]}
                      </p>
                      <Link
                        className="mt-2 inline-flex min-h-11 items-center font-semibold text-blueprint hover:underline"
                        to={`/ca-quay/${Ca.Id}`}
                      >
                        {Ca.TieuDe}
                      </Link>
                      <p className="mt-2 text-sm text-fog">
                        {DinhDangThoiGian(Ca.ThoiGianBatDau)} –{" "}
                        {DinhDangThoiGian(Ca.ThoiGianKetThuc)}
                      </p>
                      <p className="mt-1 text-xs text-fog">
                        {Ca.PhongStudio?.TenPhong ?? "Địa điểm theo ca"}
                      </p>
                      <Link
                        className="mt-3 inline-flex min-h-11 items-center text-sm text-blueprint"
                        to={`/ca-quay/${Ca.Id}`}
                      >
                        Xem và quản lý ca →
                      </Link>
                    </article>
                  ))}
                </div>
                {!DuLieu.DanhSachCa.length && (
                  <p className="py-8 text-fog">
                    Không có ca phù hợp trong phạm vi được xem.
                  </p>
                )}
                <PhanTrangThongKe
                  Trang={Loc.Trang}
                  KichThuoc={Loc.KichThuoc}
                  TongSo={DuLieu.TongCaTraCuu}
                  OnDoi={(Trang) => SetLoc({ ...Loc, Trang })}
                />
              </>
            )}
            {Tab === "Tài nguyên" && TaiNguyen && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {TaiNguyen.DanhSach.map((Muc) => (
                    <article
                      key={Muc.Id}
                      className="rounded border border-rail bg-case p-4"
                    >
                      <h2 className="break-words font-semibold">
                        {Nhom === "ThietBi" &&
                        CoQuyen(NguoiDung, "ThietBi.Xem") ? (
                          <Link
                            className="inline-flex min-h-11 items-center text-blueprint hover:underline"
                            to={`/thiet-bi/${Muc.Id}`}
                          >
                            {Muc.Ten}
                          </Link>
                        ) : (
                          Muc.Ten
                        )}
                      </h2>
                      <p className="mt-2 text-xs text-fog">
                        {Muc.TongCaLienQuan} ca liên quan
                        {Muc.LuotDuThao ? " · có phân công dự thảo" : ""}
                      </p>
                      <div className="mt-2 space-y-1">
                        {Muc.CacCa.map((Ca) => (
                          <Link
                            key={Ca.Id}
                            className="block min-h-11 py-3 text-sm text-blueprint hover:underline"
                            to={`/ca-quay/${Ca.Id}`}
                          >
                            {Ca.TieuDe}
                          </Link>
                        ))}
                      </div>
                      {Muc.TongCaLienQuan > Muc.CacCa.length && (
                        <button
                          type="button"
                          className="min-h-11 text-sm text-blueprint"
                          onClick={() => {
                            SetTab("Ca quay");
                            SetLoc({ ...Loc, CaTimKiem: "", Trang: 1 });
                          }}
                        >
                          Tra cứu thêm tại danh sách ca
                        </button>
                      )}
                    </article>
                  ))}
                </div>
                {!TaiNguyen.DanhSach.length && (
                  <p className="py-8 text-fog">Chưa có tài nguyên phù hợp.</p>
                )}
                <PhanTrangThongKe
                  Trang={Loc.TrangTaiNguyen}
                  KichThuoc={Loc.KichThuoc}
                  TongSo={TaiNguyen.TongSo}
                  OnDoi={(TrangTaiNguyen) => SetLoc({ ...Loc, TrangTaiNguyen })}
                />
              </>
            )}
            {Tab === "Sự cố" &&
              (DuLieu.TongSuCo === null ? (
                <p className="py-8 text-fog">Bạn chưa có quyền xem sự cố.</p>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {DuLieu.SuCo.map((Muc) => (
                      <article
                        className="rounded border border-rail bg-case p-4"
                        key={Muc.Id}
                      >
                        <h2 className="font-semibold">
                          {Muc.ThietBi.TenThietBi}
                        </h2>
                        <p className="mt-1 text-xs text-fog">
                          {NhanSuCo[Muc.TrangThai]} ·{" "}
                          {DinhDangThoiGian(Muc.NgayTao)}
                        </p>
                        <p className="mt-3 text-sm">{Muc.MoTaLoi}</p>
                        <Link
                          className="mt-3 inline-flex min-h-11 items-center text-sm text-blueprint"
                          to={`/bao-tri?SuCoId=${Muc.Id}`}
                        >
                          Mở hồ sơ sự cố →
                        </Link>
                      </article>
                    ))}
                  </div>
                  {!DuLieu.SuCo.length && (
                    <p className="py-8 text-fog">Chưa có sự cố phù hợp.</p>
                  )}
                  <PhanTrangThongKe
                    Trang={Loc.Trang}
                    KichThuoc={Loc.KichThuoc}
                    TongSo={DuLieu.TongSuCo}
                    OnDoi={(Trang) => SetLoc({ ...Loc, Trang })}
                  />
                </>
              ))}
          </>
        )
      )}
      {Tab === "Sự cố" && <SuCoVanHanh DuAnId={Id} />}
    </section>
  );
}
