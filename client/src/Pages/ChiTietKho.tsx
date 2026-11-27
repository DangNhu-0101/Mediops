import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useXacThuc } from "../Contexts/XacThucContext";
import { CoQuyen } from "../Services/QuyenService";
import { LayTongQuanKho } from "../Services/KhoService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import { TheoDoiCapNhatLich } from "../Services/SocketLichService";
import { LocMacDinh, type LocThongKe } from "../Types/ThongKeVanHanh";
import type { KhoThongKe } from "../Types/Kho";
import {
  DinhDangThoiGian,
  LoiThongKe,
  NhanTrangThaiThietBi,
  PhanTrangThongKe,
  SoLuongTongKho,
  NhanTrangThaiHienThi,
} from "../Components/ThongKeVanHanh";
import {
  ThanhTabQuanLy,
  TheLocQuanLy,
  ThietBiMuonNhieu,
  ViTriThietBi,
} from "../Components/DieuHuongKho";

const CacTab = ["Thiết bị", "Dòng tài nguyên", "Xuất nhập", "Sự cố"];
const NhanSuCo: Record<string, string> = {
  CHO_XU_LY: "Chờ xử lý",
  DANG_SUA_CHUA: "Đang sửa chữa",
  DA_KHAC_PHUC: "Đã khắc phục",
};
export function ChiTietKho() {
  const { id: Id = "" } = useParams();
  const [ThamSoDuongDan, SetThamSoDuongDan] = useSearchParams();
  const { NguoiDung } = useXacThuc();
  const TabDuongDan =
    ThamSoDuongDan.get("Tab") === "Theo model"
      ? "Dòng tài nguyên"
      : ThamSoDuongDan.get("Tab");
  const [Tab, SetTab] = useState(
    CacTab.includes(TabDuongDan ?? "") ? TabDuongDan! : "Thiết bị",
  );
  const [Loc, SetLoc] = useState<
    LocThongKe & { LoaiHanhDong?: string; SuCoTrangThai?: string }
  >({
    ...LocMacDinh,
    KichThuoc: 12,
    Trang: Math.max(1, Number(ThamSoDuongDan.get("Trang")) || 1),
    TrangNhom: Math.max(1, Number(ThamSoDuongDan.get("TrangNhom")) || 1),
    LoaiHanhDong: ThamSoDuongDan.get("LoaiHanhDong") ?? undefined,
    SuCoTrangThai: ThamSoDuongDan.get("SuCoTrangThai") ?? undefined,
    TimKiem: ThamSoDuongDan.get("TimKiem") ?? undefined,
    MauThietBiId: ThamSoDuongDan.get("MauThietBiId") ?? undefined,
    TrangThaiHienThi: (ThamSoDuongDan.get("TrangThaiHienThi") ??
      undefined) as LocThongKe["TrangThaiHienThi"],
  });
  const [TuNgay, SetTuNgay] = useState(ThamSoDuongDan.get("TuNgay") ?? "");
  const [DenNgay, SetDenNgay] = useState(ThamSoDuongDan.get("DenNgay") ?? "");
  const [DuLieu, SetDuLieu] = useState<KhoThongKe>();
  const [Loi, SetLoi] = useState("");
  const [DangTai, SetDangTai] = useState(true);
  const [LanTai, SetLanTai] = useState(0);
  useEffect(() => {
    const Moi = new URLSearchParams();
    Moi.set("Tab", Tab);
    for (const [Khoa, GiaTri] of Object.entries({
      Trang: String(Loc.Trang),
      TrangNhom: String(Loc.TrangNhom ?? 1),
      LoaiHanhDong: Loc.LoaiHanhDong,
      SuCoTrangThai: Loc.SuCoTrangThai,
      TimKiem: Loc.TimKiem,
      MauThietBiId: Loc.MauThietBiId,
      TrangThaiHienThi: Loc.TrangThaiHienThi,
      TuNgay,
      DenNgay,
    }))
      if (GiaTri) Moi.set(Khoa, GiaTri);
    SetThamSoDuongDan(Moi, { replace: true });
  }, [Tab, Loc, TuNgay, DenNgay, SetThamSoDuongDan]);
  useEffect(() => {
    let HieuLuc = true;
    SetDangTai(true);
    SetLoi("");
    const TraCuu =
      ["Xuất nhập", "Sự cố"].includes(Tab) && Boolean(TuNgay || DenNgay);
    void LayTongQuanKho(Id, {
      ...Loc,
      Ky: TraCuu ? "TUY_CHON" : "TOAN_BO",
      TuNgay: TraCuu ? TuNgay || "1970-01-01" : undefined,
      DenNgay: TraCuu ? DenNgay || "9998-12-31" : undefined,
    })
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
  }, [Id, Loc, LanTai, Tab, TuNgay, DenNgay]);
  useEffect(
    () =>
      TheoDoiVanHanh(["kho:xuat-kho", "kho:nhap-kho", "bao_tri:cap_nhat"], () =>
        SetLanTai((So) => So + 1),
      ),
    [],
  );
  useEffect(() => TheoDoiCapNhatLich(() => SetLanTai((So) => So + 1)), []);
  const Kho = DuLieu?.TongKho;
  const LopNhap =
    "min-h-11 min-w-0 rounded border border-rail bg-case-2 px-3 text-sm";
  return (
    <section className="space-y-5">
      <Link
        className="inline-flex min-h-11 items-center text-sm text-blueprint hover:underline"
        to="/kho"
      >
        ← Danh sách kho
      </Link>
      {DuLieu && (
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="break-words font-serif text-3xl">{DuLieu.TenKho}</h1>
            <p className="mt-2 text-sm text-fog">
              {DuLieu.MaKho} ·{" "}
              {DuLieu.DangHoatDong
                ? "Đang hoạt động"
                : "Đã vô hiệu hóa — không cấp phát mới"}
            </p>
            <p className="mt-1 text-sm text-fog">{DuLieu.DiaChi}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CoQuyen(NguoiDung, "Kho.Sua") && (
              <Link
                className="inline-flex min-h-11 items-center rounded border border-rail px-3 text-sm"
                to={`/kho?TimKiem=${encodeURIComponent(DuLieu.MaKho)}&ChinhSuaKho=${Id}`}
              >
                Sửa kho
              </Link>
            )}
            {CoQuyen(NguoiDung, "ThietBi.Tao") && (
              <Link
                className="inline-flex min-h-11 items-center rounded bg-tally px-4 text-sm font-semibold"
                to={`/kho-thiet-bi?KhoId=${Id}&TaoMoi=1`}
              >
                Thêm thiết bị
              </Link>
            )}
          </div>
        </header>
      )}
      {Kho && <SoLuongTongKho DuLieu={Kho.ThongKe} />}
      <ThanhTabQuanLy
        CacTab={CacTab}
        DangChon={Tab}
        OnChon={(Ten) => {
          SetTab(Ten);
          SetLoc({ ...Loc, Trang: 1, TrangNhom: 1 });
        }}
      />
      {["Thiết bị", "Dòng tài nguyên"].includes(Tab) && (
        <div className="space-y-3">
          <input
            aria-label="Tìm máy trong kho"
            className={`${LopNhap} w-full`}
            placeholder="Tìm tên máy, QR, seri, dòng tài nguyên hoặc danh mục…"
            value={Loc.TimKiem ?? ""}
            onChange={(E) =>
              SetLoc({
                ...Loc,
                TimKiem: E.target.value,
                Trang: 1,
                TrangNhom: 1,
              })
            }
          />
          <TheLocQuanLy
            Nhan="Dòng tài nguyên"
            GiaTri={Loc.MauThietBiId ?? ""}
            LuaChon={(Kho?.BoLocModel ?? []).map((Muc) => ({
              Id: Muc.Id,
              Ten: `${Muc.Ten} · ${Muc.SoMay}`,
            }))}
            OnChon={(MauThietBiId) =>
              SetLoc({
                ...Loc,
                MauThietBiId: MauThietBiId || undefined,
                Trang: 1,
                TrangNhom: 1,
              })
            }
          />
          <TheLocQuanLy
            Nhan="Trạng thái"
            GiaTri={Loc.TrangThaiHienThi ?? ""}
            LuaChon={[
              ...Object.entries(NhanTrangThaiHienThi).map(([Id, Ten]) => ({
                Id,
                Ten,
              })),
              { Id: "NGOAI_LE", Ten: "Có cảnh báo cần xác minh" },
            ]}
            OnChon={(TrangThaiHienThi) =>
              SetLoc({
                ...Loc,
                TrangThaiHienThi:
                  (TrangThaiHienThi as LocThongKe["TrangThaiHienThi"]) ||
                  undefined,
                Trang: 1,
                TrangNhom: 1,
              })
            }
          />
        </div>
      )}
      {["Xuất nhập", "Sự cố"].includes(Tab) && (
        <div className="flex flex-wrap gap-3">
          <label className="grid gap-1 text-xs text-fog">
            Tra cứu từ ngày
            <input
              type="date"
              className={LopNhap}
              value={TuNgay}
              onChange={(E) => {
                SetTuNgay(E.target.value);
                SetLoc({ ...Loc, Trang: 1 });
              }}
            />
          </label>
          <label className="grid gap-1 text-xs text-fog">
            Đến ngày
            <input
              type="date"
              className={LopNhap}
              value={DenNgay}
              onChange={(E) => {
                SetDenNgay(E.target.value);
                SetLoc({ ...Loc, Trang: 1 });
              }}
            />
          </label>
          {Tab === "Xuất nhập" ? (
            <select
              aria-label="Loại giao dịch"
              className={LopNhap}
              value={Loc.LoaiHanhDong ?? ""}
              onChange={(E) =>
                SetLoc({
                  ...Loc,
                  LoaiHanhDong: E.target.value || undefined,
                  Trang: 1,
                })
              }
            >
              <option value="">Xuất và nhập kho</option>
              <option value="XUAT_KHO">Xuất kho</option>
              <option value="NHAP_KHO">Nhập kho</option>
            </select>
          ) : (
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
          )}
        </div>
      )}
      <div
        className={`grid min-w-0 gap-6 ${CoQuyen(NguoiDung, "ThietBi.Xem") && CoQuyen(NguoiDung, "NhatKy.Xem") ? "xl:grid-cols-[minmax(0,2.6fr)_minmax(15rem,1fr)]" : ""}`}
      >
        <div className="min-w-0">
          {Loi ? (
            <LoiThongKe Loi={Loi} OnThuLai={() => SetLanTai(LanTai + 1)} />
          ) : DangTai ? (
            <p className="py-8 text-fog" role="status">
              Đang tải dữ liệu kho…
            </p>
          ) : (
            DuLieu && (
              <>
                {Tab === "Thiết bị" &&
                  (Kho ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {Kho.DanhSach.map((May) => (
                          <article
                            className="rounded border border-rail bg-case p-4"
                            key={May.Id}
                          >
                            <NhanTrangThaiThietBi
                              TrangThai={May.TrangThaiHienThi}
                              CanhBao={May.CanhBao}
                            />
                            <Link
                              className="mt-2 inline-flex min-h-11 items-center break-words font-semibold text-blueprint hover:underline"
                              to={`/thiet-bi/${May.Id}`}
                            >
                              {May.TenThietBi}
                            </Link>
                            <p className="text-xs text-fog">
                              {May.MaQR} · {May.SoSeri}
                            </p>
                            <p className="mt-2 text-sm">
                              {May.TenMau ?? "Chưa xác định dòng tài nguyên"}
                            </p>
                            <ViTriThietBi May={May} />
                            {May.CanhBao.map((CanhBao) => (
                              <p
                                className="mt-2 text-xs text-timecode"
                                key={CanhBao}
                              >
                                {CanhBao}
                              </p>
                            ))}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Link
                                className="inline-flex min-h-11 items-center text-sm text-blueprint"
                                to={`/thiet-bi/${May.Id}`}
                              >
                                Chi tiết · QR · Lịch sử
                              </Link>
                              {CoQuyen(NguoiDung, "ThietBi.Sua") && (
                                <Link
                                  className="inline-flex min-h-11 items-center rounded border border-rail px-3 text-sm"
                                  to={`/kho-thiet-bi?KhoId=${Id}&TimKiem=${encodeURIComponent(May.MaQR)}&ChinhSua=${May.Id}`}
                                >
                                  Sửa máy
                                </Link>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                      {!Kho.DanhSach.length && (
                        <p className="py-8 text-fog">
                          Chưa có máy phù hợp trong kho.
                        </p>
                      )}
                      <PhanTrangThongKe
                        Trang={Loc.Trang}
                        KichThuoc={Loc.KichThuoc}
                        TongSo={Kho.TongSo}
                        OnDoi={(Trang) => SetLoc({ ...Loc, Trang })}
                      />
                    </>
                  ) : (
                    <p className="py-8 text-fog">
                      Bạn chưa có quyền xem thiết bị.
                    </p>
                  ))}
                {Tab === "Dòng tài nguyên" &&
                  (Kho ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {Kho.NhomModel.map((Mau) => (
                          <article
                            className="rounded border border-rail bg-case p-4"
                            key={Mau.Khoa}
                          >
                            <h2 className="font-semibold">{Mau.TenMau}</h2>
                            <p className="mt-1 text-xs text-fog">
                              {Mau.TenDanhMuc}
                            </p>
                            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                              {[
                                ["Tổng", Mau.TongSo],
                                ["Hiện có", Mau.HienCo],
                                ["Đang sử dụng", Mau.DangSuDung],
                                ["Bảo trì", Mau.BaoTri],
                              ].map(([Nhan, So]) => (
                                <div key={Nhan}>
                                  <dt className="text-xs text-fog">{Nhan}</dt>
                                  <dd className="mt-1 tabular-nums">{So}</dd>
                                </div>
                              ))}
                            </dl>
                            <button
                              className="mt-4 min-h-11 rounded border border-rail px-3 text-sm"
                              type="button"
                              onClick={() => {
                                SetTab("Thiết bị");
                                SetLoc({
                                  ...Loc,
                                  Trang: 1,
                                  MauThietBiId:
                                    Mau.MauThietBiId ?? "CHUA_XAC_DINH",
                                });
                              }}
                            >
                              Xem máy thuộc dòng tài nguyên
                            </button>
                          </article>
                        ))}
                      </div>
                      {!Kho.NhomModel.length && (
                        <p className="py-8 text-fog">
                          Không có dòng tài nguyên phù hợp.
                        </p>
                      )}
                      <PhanTrangThongKe
                        Trang={Loc.TrangNhom ?? 1}
                        KichThuoc={Loc.KichThuoc}
                        TongSo={Kho.TongNhom}
                        OnDoi={(TrangNhom) => SetLoc({ ...Loc, TrangNhom })}
                      />
                      <Link
                        className="inline-flex min-h-11 items-center text-sm text-blueprint"
                        to={`/kho-thiet-bi?Tab=Dòng+tài+nguyên&KhoId=${Id}`}
                      >
                        Quản lý dòng tài nguyên trong Tổng kho →
                      </Link>
                    </>
                  ) : (
                    <p className="py-8 text-fog">
                      Bạn chưa có quyền xem thiết bị.
                    </p>
                  ))}
                {Tab === "Xuất nhập" &&
                  (DuLieu.TongGiaoDich === null ? (
                    <p className="py-8 text-fog">
                      Bạn chưa có quyền xem nhật ký kho.
                    </p>
                  ) : (
                    <>
                      <p className="mb-4 text-xs text-fog">
                        Giao dịch theo kho nguồn/đích ghi nhận khi thực hiện;
                        không viết lại bằng kho quản lý hiện tại.
                      </p>
                      <div className="divide-y divide-rail rounded border border-rail bg-case">
                        {DuLieu.GiaoDich.map((Muc) => (
                          <article className="p-4" key={Muc.Id}>
                            <p className="text-sm font-semibold">
                              {Muc.LoaiHanhDong === "XUAT_KHO"
                                ? "Xuất kho"
                                : "Nhập kho"}{" "}
                              · {Muc._count.DanhSachNhatKy} máy
                            </p>
                            <p className="mt-1 text-xs text-fog">
                              {DinhDangThoiGian(Muc.ThoiGian)}
                            </p>
                            <Link
                              className="inline-flex min-h-11 items-center text-sm text-blueprint"
                              to={`/ca-quay/${Muc.CaQuay.Id}`}
                            >
                              {Muc.CaQuay.TieuDe}
                            </Link>
                          </article>
                        ))}
                        {!DuLieu.GiaoDich.length && (
                          <p className="p-5 text-sm text-fog">
                            Chưa có giao dịch phù hợp.
                          </p>
                        )}
                      </div>
                      <PhanTrangThongKe
                        Trang={Loc.Trang}
                        KichThuoc={Loc.KichThuoc}
                        TongSo={DuLieu.TongGiaoDich}
                        OnDoi={(Trang) => SetLoc({ ...Loc, Trang })}
                      />
                    </>
                  ))}
                {Tab === "Sự cố" &&
                  (DuLieu.TongSuCo === null ? (
                    <p className="py-8 text-fog">
                      Bạn chưa có quyền xem sự cố.
                    </p>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
        {CoQuyen(NguoiDung, "ThietBi.Xem") &&
          CoQuyen(NguoiDung, "NhatKy.Xem") && (
            <ThietBiMuonNhieu
              key={LanTai}
              KhoId={Id}
              MauThietBiId={Loc.MauThietBiId}
            />
          )}
      </div>
    </section>
  );
}
