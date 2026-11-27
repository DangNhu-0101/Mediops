import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayDanhMucThietBi } from "../Services/ThietBiService";
import {
  LayLichSuMuon,
  LayLichPhanCongThietBi,
  LayMauThietBi,
  LayMucDoMuon,
} from "../Services/ThongKeVanHanhService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import { TheoDoiCapNhatLich } from "../Services/SocketLichService";
import {
  LocMacDinh,
  type LichSuMuon,
  type LichPhanCongThietBi,
  type LocThongKe,
  type MauThietBi,
  type MucDoMuon,
  type SoLuongKho,
  type TongKho,
  type TrangThaiHienThi,
} from "../Types/ThongKeVanHanh";
import type { DanhMucThietBi } from "../Types/ThietBi";

export const NhanTrangThaiHienThi: Record<TrangThaiHienThi, string> = {
  RANH: "Rảnh",
  CHO_SU_DUNG: "Chờ sử dụng",
  DANG_SU_DUNG: "Đang sử dụng",
  BAO_TRI: "Bảo trì",
};
const LopTrangThai: Record<TrangThaiHienThi, string> = {
  RANH: "bg-phosphor/20 text-phosphor",
  CHO_SU_DUNG: "bg-timecode/20 text-timecode",
  DANG_SU_DUNG: "bg-blueprint/20 text-blueprint",
  BAO_TRI: "bg-timecode/20 text-timecode",
};
export const LopTruongThongKe =
  "min-h-11 max-w-full rounded border border-rail bg-case-2 px-3 text-base sm:text-sm";
export const DinhDangGio = (So: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(So);
export const DinhDangThoiGian = (Ngay: string) =>
  new Date(Ngay).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

export function NhanTrangThaiThietBi({
  TrangThai,
  CanhBao = [],
}: {
  TrangThai: TrangThaiHienThi | null | undefined;
  CanhBao?: string[];
}) {
  return (
    <span
      className={`inline-block rounded px-2 py-1 text-xs ${TrangThai ? LopTrangThai[TrangThai] : "bg-timecode/20 text-timecode"}`}
      title={CanhBao.join(". ")}
    >
      {TrangThai
        ? NhanTrangThaiHienThi[TrangThai]
        : "Chưa xác minh · chặn cấp phát"}
    </span>
  );
}

export function BoLocKyThongKe({
  GiaTri,
  OnDoi,
}: {
  GiaTri: LocThongKe;
  OnDoi: (GiaTri: LocThongKe) => void;
}) {
  const NgayHomNay = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm">
        <span>Kỳ thống kê</span>
        <select
          className={LopTruongThongKe}
          value={GiaTri.Ky}
          onChange={(SuKien) => {
            const Ky = SuKien.target.value as LocThongKe["Ky"];
            OnDoi({
              ...GiaTri,
              Ky,
              Trang: 1,
              ...(Ky === "TUY_CHON"
                ? {
                    TuNgay: GiaTri.TuNgay ?? NgayHomNay,
                    DenNgay: GiaTri.DenNgay ?? NgayHomNay,
                  }
                : {}),
            });
          }}
        >
          <option value="TOAN_BO">Toàn bộ</option>
          <option value="TUAN_NAY">Tuần này</option>
          <option value="THANG_NAY">Tháng này</option>
          <option value="TUY_CHON">Khoảng ngày tùy chỉnh</option>
        </select>
      </label>
      {GiaTri.Ky === "TUY_CHON" && (
        <>
          <label className="grid gap-1 text-sm">
            <span>Từ ngày</span>
            <input
              className={LopTruongThongKe}
              type="date"
              value={GiaTri.TuNgay ?? ""}
              onChange={(SuKien) =>
                OnDoi({ ...GiaTri, TuNgay: SuKien.target.value, Trang: 1 })
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Đến hết ngày</span>
            <input
              className={LopTruongThongKe}
              type="date"
              value={GiaTri.DenNgay ?? ""}
              onChange={(SuKien) =>
                OnDoi({ ...GiaTri, DenNgay: SuKien.target.value, Trang: 1 })
              }
            />
          </label>
        </>
      )}
    </div>
  );
}

export function PhanTrangThongKe({
  Trang,
  KichThuoc,
  TongSo,
  OnDoi,
}: {
  Trang: number;
  KichThuoc: number;
  TongSo: number;
  OnDoi: (Trang: number) => void;
}) {
  const TongTrang = Math.max(1, Math.ceil(TongSo / KichThuoc));
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-fog">
      <p>
        {TongSo} mục · Trang {Trang}/{TongTrang}
      </p>
      <div className="flex gap-2">
        <button
          className="min-h-11 rounded border border-rail px-4 disabled:opacity-40"
          type="button"
          disabled={Trang <= 1}
          onClick={() => OnDoi(Trang - 1)}
        >
          Trang trước
        </button>
        <button
          className="min-h-11 rounded border border-rail px-4 disabled:opacity-40"
          type="button"
          disabled={Trang >= TongTrang}
          onClick={() => OnDoi(Trang + 1)}
        >
          Trang sau
        </button>
      </div>
    </div>
  );
}
export function LoiThongKe({
  Loi,
  OnThuLai,
}: {
  Loi: string;
  OnThuLai: () => void;
}) {
  return (
    <div
      role="alert"
      className="my-4 rounded border border-tally/60 bg-tally/10 p-4"
    >
      <p>{Loi}</p>
      <button
        className="mt-3 min-h-11 rounded border border-rail px-4 text-sm"
        type="button"
        onClick={OnThuLai}
      >
        Tải lại dữ liệu
      </button>
    </div>
  );
}
export function SoLuongTongKho({ DuLieu }: { DuLieu: SoLuongKho }) {
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 border-y border-rail py-4 sm:grid-cols-3 xl:grid-cols-5">
        {[
          ["Tổng số lượng", DuLieu.TongSo],
          ["Hiện có", DuLieu.HienCo],
          ["Đang sử dụng", DuLieu.DangSuDung],
          ["Chờ sử dụng", DuLieu.ChoSuDung],
          ["Bảo trì", DuLieu.BaoTri],
        ].map(([Nhan, So]) => (
          <div key={Nhan}>
            <dt className="text-sm text-fog">{Nhan}</dt>
            <dd className="mt-1 font-mono text-2xl">{So}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs leading-relaxed text-fog">
        Hiện có: máy đang ở kho, đủ điều kiện về tình trạng vận hành; bao gồm
        máy chờ sử dụng; không tính máy bảo trì, đã xuất hoặc chưa rõ vị trí.
        Khả dụng cho ca khác vẫn phải kiểm tra lịch.{" "}
        {DuLieu.NgoaiLe > 0 && (
          <strong className="text-timecode">
            Có {DuLieu.NgoaiLe} máy có ngoại lệ cần xác minh.
          </strong>
        )}
      </p>
    </div>
  );
}
export function BangModelKho({
  DuLieu,
  OnChon,
}: {
  DuLieu: TongKho;
  OnChon?: (Id: string | null) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">
        Số lượng theo dòng tài nguyên
      </h2>
      <div className="overflow-x-auto rounded border border-rail">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-case text-fog">
            <tr>
              <th className="p-3">Dòng tài nguyên / danh mục</th>
              <th className="p-3">Tổng</th>
              <th className="p-3">Hiện có</th>
              <th className="p-3">Đang sử dụng</th>
              <th className="p-3">Bảo trì</th>
              <th className="p-3">Ngoại lệ</th>
            </tr>
          </thead>
          <tbody>
            {DuLieu.NhomModel.map((Muc) => (
              <tr className="border-t border-rail" key={Muc.Khoa}>
                <td className="p-3">
                  {OnChon ? (
                    <button
                      className="min-h-11 text-left font-semibold text-blueprint hover:underline"
                      type="button"
                      onClick={() => OnChon(Muc.MauThietBiId)}
                    >
                      {Muc.TenMau}
                    </button>
                  ) : (
                    <strong>{Muc.TenMau}</strong>
                  )}
                  <p className="text-xs text-fog">{Muc.TenDanhMuc}</p>
                </td>
                <td className="p-3 font-mono">{Muc.TongSo}</td>
                <td className="p-3 font-mono">{Muc.HienCo}</td>
                <td className="p-3 font-mono">{Muc.DangSuDung}</td>
                <td className="p-3 font-mono">{Muc.BaoTri}</td>
                <td className="p-3 font-mono">{Muc.NgoaiLe}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!DuLieu.NhomModel.length && (
          <p className="p-5 text-fog">Chưa có thiết bị phù hợp bộ lọc.</p>
        )}
      </div>
    </section>
  );
}

export function MucDoMuonThietBi({ KhoCoDinh }: { KhoCoDinh?: string }) {
  const [Loc, SetLoc] = useState({
    ...LocMacDinh,
    KichThuoc: 5,
    KhoId: KhoCoDinh,
    NhomTheo: "THIET_BI" as "THIET_BI" | "MODEL",
    SapXep: "LUOT_MUON" as "LUOT_MUON" | "GIO_NGOAI_KHO",
    CoSoKho: "HIEN_TAI" as "HIEN_TAI" | "NGUON_XUAT",
  });
  const [DuLieu, SetDuLieu] = useState<MucDoMuon>();
  const [DanhMuc, SetDanhMuc] = useState<DanhMucThietBi[]>([]);
  const [Model, SetModel] = useState<MauThietBi[]>([]);
  const [Loi, SetLoi] = useState("");
  const [DangTai, SetDangTai] = useState(true);
  const [LanTai, SetLanTai] = useState(0);
  useEffect(() => {
    let ConHieuLuc = true;
    void Promise.all([LayDanhMucThietBi(), LayMauThietBi()])
      .then(([CacDanhMuc, CacModel]) => {
        if (ConHieuLuc) {
          SetDanhMuc(CacDanhMuc);
          SetModel(CacModel);
        }
      })
      .catch((LoiTai) => {
        if (ConHieuLuc) SetLoi(LayThongBaoLoi(LoiTai));
      });
    return () => {
      ConHieuLuc = false;
    };
  }, []);
  useEffect(() => {
    let ConHieuLuc = true;
    SetDangTai(true);
    SetLoi("");
    void LayMucDoMuon(Loc)
      .then((Data) => {
        if (ConHieuLuc) SetDuLieu(Data);
      })
      .catch((LoiTai) => {
        if (ConHieuLuc) SetLoi(LayThongBaoLoi(LoiTai));
      })
      .finally(() => {
        if (ConHieuLuc) SetDangTai(false);
      });
    return () => {
      ConHieuLuc = false;
    };
  }, [Loc, LanTai]);
  useEffect(
    () =>
      TheoDoiVanHanh(["kho:xuat-kho", "kho:nhap-kho"], () =>
        SetLanTai((So) => So + 1),
      ),
    [],
  );
  function DoiLoc(GiaTri: Partial<typeof Loc>) {
    SetLoc((Cu) => ({ ...Cu, ...GiaTri, Trang: 1 }));
  }
  return (
    <section
      id="muc-do-muon"
      className="mt-8 scroll-mt-6 space-y-4 border-t border-rail pt-6"
    >
      <h2 className="text-xl font-semibold">Mức độ mượn thiết bị</h2>
      <p className="text-sm text-fog">
        Lượt mượn đếm lần xuất kho thành công bắt đầu trong kỳ. Giờ ngoài kho
        tính phần giao với kỳ, đến thời điểm server nếu chưa trả; không phải giờ
        máy hoạt động.
      </p>
      <BoLocKyThongKe
        GiaTri={Loc}
        OnDoi={(GiaTri) => SetLoc((Cu) => ({ ...Cu, ...GiaTri }))}
      />
      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Nhóm thống kê mượn"
          className={LopTruongThongKe}
          value={Loc.NhomTheo}
          onChange={(E) =>
            DoiLoc({ NhomTheo: E.target.value as typeof Loc.NhomTheo })
          }
        >
          <option value="THIET_BI">Theo từng máy</option>
          <option value="MODEL">Dòng tài nguyên</option>
        </select>
        <select
          aria-label="Xếp hạng mượn"
          className={LopTruongThongKe}
          value={Loc.SapXep}
          onChange={(E) =>
            DoiLoc({ SapXep: E.target.value as typeof Loc.SapXep })
          }
        >
          <option value="LUOT_MUON">Nhiều lượt mượn nhất</option>
          <option value="GIO_NGOAI_KHO">Lâu ngoài kho nhất</option>
        </select>
        <select
          aria-label="Cơ sở lọc kho"
          className={LopTruongThongKe}
          value={Loc.CoSoKho}
          onChange={(E) =>
            DoiLoc({ CoSoKho: E.target.value as typeof Loc.CoSoKho })
          }
        >
          <option value="HIEN_TAI">Theo kho quản lý hiện tại</option>
          <option value="NGUON_XUAT">Theo kho xuất nguồn lịch sử</option>
        </select>
        {!KhoCoDinh && (
          <select
            aria-label="Kho thống kê mượn"
            className={LopTruongThongKe}
            value={Loc.KhoId ?? ""}
            onChange={(E) => DoiLoc({ KhoId: E.target.value || undefined })}
          >
            <option value="">Tất cả kho</option>
            <option value="CHUA_GAN">Chưa xác định kho</option>
            {DuLieu?.CacKho.map((Kho) => (
              <option key={Kho.Id} value={Kho.Id}>
                {Kho.TenKho}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Danh mục thống kê mượn"
          className={LopTruongThongKe}
          value={Loc.DanhMucId ?? ""}
          onChange={(E) =>
            DoiLoc({
              DanhMucId: E.target.value || undefined,
              MauThietBiId: undefined,
            })
          }
        >
          <option value="">Tất cả danh mục</option>
          {DanhMuc.map((Muc) => (
            <option key={Muc.Id} value={Muc.Id}>
              {Muc.TenDanhMuc}
            </option>
          ))}
        </select>
        <select
          aria-label="Dòng tài nguyên thống kê mượn"
          className={LopTruongThongKe}
          value={Loc.MauThietBiId ?? ""}
          onChange={(E) =>
            DoiLoc({ MauThietBiId: E.target.value || undefined })
          }
        >
          <option value="">Tất cả dòng tài nguyên</option>
          <option value="CHUA_XAC_DINH">Chưa xác định dòng tài nguyên</option>
          {Model.filter(
            (Muc) => !Loc.DanhMucId || Muc.DanhMucId === Loc.DanhMucId,
          ).map((Muc) => (
            <option key={Muc.Id} value={Muc.Id}>
              {Muc.TenMau}
            </option>
          ))}
        </select>
        <select
          aria-label="Số mục xếp hạng"
          className={LopTruongThongKe}
          value={Loc.KichThuoc}
          onChange={(E) => DoiLoc({ KichThuoc: Number(E.target.value) })}
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
        </select>
      </div>
      <p className="text-xs text-fog">
        {Loc.CoSoKho === "HIEN_TAI"
          ? "Phạm vi lấy kho quản lý hiện tại của máy; không coi đây là công suất lịch sử từng kho."
          : "Phạm vi lấy kho nguồn đã ghi nhận khi xuất; giao dịch cũ thiếu kho nguồn không được tự gán theo kho hiện tại."}
      </p>
      {Loi ? (
        <LoiThongKe Loi={Loi} OnThuLai={() => SetLanTai((So) => So + 1)} />
      ) : DangTai ? (
        <p role="status" className="py-6 text-fog">
          Đang tổng hợp mức độ mượn…
        </p>
      ) : (
        DuLieu && (
          <>
            {DuLieu.SoMayThieuDuLieu > 0 && (
              <p className="text-sm text-timecode">
                Có {DuLieu.SoMayThieuDuLieu} máy trong đơn vị đang mượn nhưng
                thiếu mốc xuất thực tế. Xếp hạng chỉ phản ánh giao dịch đã ghi
                nhận đầy đủ.
              </p>
            )}
            <div className="overflow-x-auto rounded border border-rail">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-case text-fog">
                  <tr>
                    <th className="p-3">
                      {Loc.NhomTheo === "MODEL"
                        ? "Dòng tài nguyên"
                        : "Thiết bị"}
                    </th>
                    <th className="p-3">Lượt mượn</th>
                    <th className="p-3">Máy có lượt xuất trong kỳ</th>
                    <th className="p-3">Giờ ngoài kho</th>
                  </tr>
                </thead>
                <tbody>
                  {DuLieu.DanhSach.map((Muc) => (
                    <tr className="border-t border-rail" key={Muc.Id}>
                      <td className="p-3">
                        {Loc.NhomTheo === "THIET_BI" ? (
                          <Link
                            className="inline-flex min-h-11 items-center font-semibold text-blueprint hover:underline"
                            to={`/thiet-bi/${Muc.Id}`}
                          >
                            {Muc.Ten}
                          </Link>
                        ) : (
                          Muc.Ten
                        )}
                      </td>
                      <td className="p-3 font-mono">{Muc.SoLuotMuon}</td>
                      <td className="p-3 font-mono">{Muc.SoMayRiengBiet}</td>
                      <td className="p-3 font-mono">
                        {DinhDangGio(Muc.GioNgoaiKho)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!DuLieu.DanhSach.length && (
                <p className="p-5 text-fog">
                  Chưa có lượt mượn phù hợp kỳ và bộ lọc.
                </p>
              )}
            </div>
            <PhanTrangThongKe
              Trang={Loc.Trang}
              KichThuoc={Loc.KichThuoc}
              TongSo={DuLieu.TongSo}
              OnDoi={(Trang) => SetLoc({ ...Loc, Trang })}
            />
            <p className="text-xs text-fog">
              Cập nhật theo giờ server: {DinhDangThoiGian(DuLieu.Ky.HienTai)}.
            </p>
          </>
        )
      )}
    </section>
  );
}

export function LichSuMuonThietBi({ Id }: { Id: string }) {
  const [Loc, SetLoc] = useState(LocMacDinh);
  const [DuLieu, SetDuLieu] = useState<LichSuMuon>();
  const [Loi, SetLoi] = useState("");
  const [LanTai, SetLanTai] = useState(0);
  const [DangTai, SetDangTai] = useState(true);
  useEffect(() => {
    let ConHieuLuc = true;
    SetDangTai(true);
    SetLoi("");
    void LayLichSuMuon(Id, Loc)
      .then((Data) => {
        if (ConHieuLuc) SetDuLieu(Data);
      })
      .catch((LoiTai) => {
        if (ConHieuLuc) SetLoi(LayThongBaoLoi(LoiTai));
      })
      .finally(() => {
        if (ConHieuLuc) SetDangTai(false);
      });
    return () => {
      ConHieuLuc = false;
    };
  }, [Id, Loc, LanTai]);
  useEffect(
    () =>
      TheoDoiVanHanh(["kho:xuat-kho", "kho:nhap-kho"], () =>
        SetLanTai((So) => So + 1),
      ),
    [],
  );
  return (
    <section className="mt-8 space-y-4 border-t border-rail pt-6">
      <h2 className="text-xl font-semibold">Lịch sử xuất nhập thực tế</h2>
      <BoLocKyThongKe GiaTri={Loc} OnDoi={SetLoc} />
      {Loi ? (
        <LoiThongKe Loi={Loi} OnThuLai={() => SetLanTai((So) => So + 1)} />
      ) : DangTai ? (
        <p role="status" className="py-4 text-fog">
          Đang tải lịch sử mượn…
        </p>
      ) : (
        DuLieu && (
          <>
            <p className="text-sm">
              {DuLieu.SoLuotMuon === null
                ? "Chưa đủ dữ liệu lượt xuất thực tế"
                : `${DuLieu.SoLuotMuon} lượt xuất bắt đầu trong kỳ`}{" "}
              ·{" "}
              {DuLieu.GioNgoaiKho === null
                ? "Chưa có dữ liệu thực tế đầy đủ để tính giờ ngoài kho"
                : `${DinhDangGio(DuLieu.GioNgoaiKho)} giờ ngoài kho trong kỳ`}
            </p>
            <div className="overflow-x-auto rounded border border-rail">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-case text-fog">
                  <tr>
                    <th className="p-3">Ca quay</th>
                    <th className="p-3">Kho xuất nguồn</th>
                    <th className="p-3">Xuất</th>
                    <th className="p-3">Nhập</th>
                    <th className="p-3">Giờ trong kỳ</th>
                  </tr>
                </thead>
                <tbody>
                  {DuLieu.DanhSach.map((Muc) => (
                    <tr className="border-t border-rail" key={Muc.Id}>
                      <td className="p-3">{Muc.TenCa}</td>
                      <td className="p-3">
                        {Muc.TenKhoNguon ?? "Chưa ghi nhận"}
                      </td>
                      <td className="p-3">
                        {DinhDangThoiGian(Muc.ThoiGianXuat)}
                      </td>
                      <td className="p-3">
                        {Muc.ThoiGianNhap
                          ? DinhDangThoiGian(Muc.ThoiGianNhap)
                          : "Chưa nhập kho"}
                      </td>
                      <td className="p-3 font-mono">
                        {DinhDangGio(Muc.GioNgoaiKho)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!DuLieu.DanhSach.length && (
                <p className="p-5 text-fog">
                  Chưa có giao dịch xuất kho được ghi nhận trong phạm vi này.
                </p>
              )}
            </div>
            <PhanTrangThongKe
              Trang={Loc.Trang}
              KichThuoc={Loc.KichThuoc}
              TongSo={DuLieu.TongSo}
              OnDoi={(Trang) => SetLoc({ ...Loc, Trang })}
            />
            <p className="text-xs text-fog">
              Kho nguồn lấy từ giao dịch lịch sử. Thời gian chưa trả tính tới{" "}
              {DinhDangThoiGian(DuLieu.Ky.HienTai)}, không phải giờ máy hoạt
              động.
            </p>
          </>
        )
      )}
    </section>
  );
}

export function LichThietBi({ Id }: { Id: string }) {
  const [Loc, SetLoc] = useState(LocMacDinh);
  const [DuLieu, SetDuLieu] = useState<LichPhanCongThietBi>();
  const [Loi, SetLoi] = useState("");
  const [LanTai, SetLanTai] = useState(0);
  const [DangTai, SetDangTai] = useState(true);
  useEffect(() => TheoDoiCapNhatLich(() => SetLanTai((So) => So + 1)), []);
  useEffect(() => {
    let HieuLuc = true;
    SetDangTai(true);
    SetLoi("");
    void LayLichPhanCongThietBi(Id, Loc)
      .then((Data) => {
        if (HieuLuc) SetDuLieu(Data);
      })
      .catch((LoiTai) => {
        if (HieuLuc) SetLoi(LayThongBaoLoi(LoiTai));
      })
      .finally(() => {
        if (HieuLuc) SetDangTai(false);
      });
    return () => {
      HieuLuc = false;
    };
  }, [Id, Loc, LanTai]);
  return (
    <section className="mt-8 space-y-4 border-t border-rail pt-6">
      <h2 className="text-xl font-semibold">Lịch đã phân công</h2>
      <p className="text-sm text-fog">
        Chỉ hiển thị ca được phép xem. Lịch tương lai ngoài khoảng đang xét
        không làm thay đổi trạng thái hiện tại. Khoảng chiếm dụng đã gồm chuẩn
        bị, thu hồi và QC.
      </p>
      <BoLocKyThongKe GiaTri={Loc} OnDoi={SetLoc} />
      {Loi ? (
        <LoiThongKe Loi={Loi} OnThuLai={() => SetLanTai((So) => So + 1)} />
      ) : DangTai ? (
        <p role="status" className="py-4 text-fog">
          Đang tải lịch thiết bị…
        </p>
      ) : (
        DuLieu && (
          <>
            <div className="divide-y divide-rail rounded border border-rail">
              {DuLieu.DanhSach.map((Ca) => (
                <div className="p-4 text-sm" key={Ca.Id}>
                  <Link
                    className="inline-flex min-h-11 items-center font-semibold text-blueprint hover:underline"
                    to={`/ca-quay/${Ca.Id}`}
                  >
                    {Ca.TieuDe}
                  </Link>
                  <p className="text-fog">
                    {Ca.DuAn.TenDuAn} ·{" "}
                    {
                      (
                        {
                          DU_THAO: "Dự thảo",
                          DA_DUYET: "Đã duyệt",
                          DANG_DIEN_RA: "Đang diễn ra",
                          HOAN_THANH: "Hoàn thành",
                          DA_HUY: "Đã hủy",
                        } as Record<string, string>
                      )[Ca.TrangThai]
                    }
                  </p>
                  <p className="mt-2 text-fog">
                    Giờ ca: {DinhDangThoiGian(Ca.ThoiGianBatDau)} →{" "}
                    {DinhDangThoiGian(Ca.ThoiGianKetThuc)}
                  </p>
                  <p className="mt-1 text-fog">
                    Chiếm dụng: {DinhDangThoiGian(Ca.KhoangChiemDung.BatDau)} →{" "}
                    {DinhDangThoiGian(Ca.KhoangChiemDung.KetThuc)}
                  </p>
                </div>
              ))}
              {!DuLieu.DanhSach.length && (
                <p className="p-5 text-fog">
                  Chưa có lịch giao kỳ theo giờ ca trong phạm vi bạn được xem.
                </p>
              )}
            </div>
            <PhanTrangThongKe
              Trang={Loc.Trang}
              KichThuoc={Loc.KichThuoc}
              TongSo={DuLieu.TongSo}
              OnDoi={(Trang) => SetLoc({ ...Loc, Trang })}
            />
          </>
        )
      )}
    </section>
  );
}
