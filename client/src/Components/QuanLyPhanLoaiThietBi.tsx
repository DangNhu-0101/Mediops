import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Api } from "../Services/Api";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { LayDanhMucThietBi } from "../Services/ThietBiService";
import { CoQuyen } from "../Services/QuyenService";
import { useXacThuc } from "../Contexts/XacThucContext";
import type { DanhMucThietBi } from "../Types/ThietBi";
import { HopThoaiBieuMau } from "./HopThoaiBieuMau";
import { HopThoaiXacNhan } from "./HopThoaiXacNhan";
import { LoiThongKe, PhanTrangThongKe } from "./ThongKeVanHanh";
import { NutThemNhanh } from "./NutThemNhanh";

interface BanGhiPhanLoai {
  Id: string;
  Hang?: string | null;
  MaMau?: string;
  TenMau?: string;
  DanhMucId?: string;
  MaDanhMuc?: string | null;
  TenDanhMuc?: string;
  MoTa?: string | null;
  DanhMuc?: { TenDanhMuc: string };
  _count: { DanhSachThietBi: number; DanhSachMau?: number };
  ThongKe?: {
    TongSo: number;
    HienCo: number;
    DangSuDung: number;
    BaoTri: number;
  };
}
interface TrangPhanLoai {
  DanhSach: BanGhiPhanLoai[];
  TongSo: number;
}
export function QuanLyPhanLoaiThietBi({
  LaModel,
  DanhMucId,
  KhoId,
  TrangThaiHienThi,
  TuKhoa,
  OnXemMay,
  OnThayDoi,
}: {
  LaModel: boolean;
  DanhMucId?: string;
  KhoId?: string;
  TrangThaiHienThi?: string;
  TuKhoa?: string;
  OnXemMay: (Id: string) => void;
  OnThayDoi: () => void;
}) {
  const { NguoiDung } = useXacThuc();
  const [Trang, SetTrang] = useState(1);
  const [Tim, SetTim] = useState("");
  const [TimDaGui, SetTimDaGui] = useState("");
  const [DuLieu, SetDuLieu] = useState<TrangPhanLoai>();
  const [DanhMuc, SetDanhMuc] = useState<DanhMucThietBi[]>([]);
  const [LanTai, SetLanTai] = useState(0);
  const [Loi, SetLoi] = useState("");
  const [DangTai, SetDangTai] = useState(true);
  const [DangGui, SetDangGui] = useState(false);
  const [DangSua, SetDangSua] = useState<BanGhiPhanLoai | null>(null);
  const [CanXoa, SetCanXoa] = useState<BanGhiPhanLoai | null>(null);
  const [ChiTiet, SetChiTiet] = useState<BanGhiPhanLoai | null>(null);
  const [Ma, SetMa] = useState("");
  const [Ten, SetTen] = useState("");
  const [MoTa, SetMoTa] = useState("");
  const [DanhMucChon, SetDanhMucChon] = useState("");
  useEffect(() => {
    SetTrang(1);
  }, [DanhMucId, LaModel, TuKhoa, KhoId, TrangThaiHienThi]);
  useEffect(() => {
    let HieuLuc = true;
    SetDangTai(true);
    SetLoi("");
    Promise.all([
      Api.get<TrangPhanLoai>(
        LaModel ? "/thiet-bi/quan-ly-model" : "/thiet-bi/quan-ly-danh-muc",
        {
          params: {
            TimKiem: TuKhoa ?? TimDaGui,
            Trang,
            KichThuoc: 12,
            DanhMucId: DanhMucId || undefined,
            KhoId: KhoId || undefined,
            TrangThaiHienThi: TrangThaiHienThi || undefined,
          },
        },
      ),
      LayDanhMucThietBi(),
    ])
      .then(([KetQua, CacDanhMuc]) => {
        if (HieuLuc) {
          SetDuLieu(KetQua.data);
          SetDanhMuc(CacDanhMuc);
        }
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
  }, [
    Trang,
    TimDaGui,
    TuKhoa,
    LaModel,
    DanhMucId,
    KhoId,
    TrangThaiHienThi,
    LanTai,
  ]);
  function MoSua(Muc?: BanGhiPhanLoai) {
    SetDangSua(Muc ?? { Id: "", _count: { DanhSachThietBi: 0 } });
    SetMa((LaModel ? Muc?.MaMau : Muc?.MaDanhMuc) ?? "");
    SetTen((LaModel ? Muc?.TenMau : Muc?.TenDanhMuc) ?? "");
    SetMoTa(Muc?.MoTa ?? "");
    SetDanhMucChon(Muc?.DanhMucId ?? DanhMucId ?? "");
  }
  function DaThayDoi() {
    SetLanTai((So) => So + 1);
    OnThayDoi();
  }
  async function Luu() {
    SetDangGui(true);
    try {
      const DuongDan = LaModel ? "/thiet-bi/model" : "/thiet-bi/danh-muc";
      const Body = LaModel
        ? { MaMau: Ma, TenMau: Ten, DanhMucId: DanhMucChon }
        : { MaDanhMuc: Ma, TenDanhMuc: Ten, MoTa };
      if (DangSua?.Id) await Api.put(`${DuongDan}/${DangSua.Id}`, Body);
      else await Api.post(DuongDan, Body);
      toast.success("Đã lưu thông tin.");
      SetDangSua(null);
      DaThayDoi();
    } catch (E) {
      toast.error(LayThongBaoLoi(E));
    } finally {
      SetDangGui(false);
    }
  }
  async function Xoa() {
    if (!CanXoa) return;
    SetDangGui(true);
    try {
      await Api.delete(
        `/thiet-bi/${LaModel ? "model" : "danh-muc"}/${CanXoa.Id}`,
      );
      toast.success("Đã xóa bản ghi.");
      SetCanXoa(null);
      DaThayDoi();
    } catch (E) {
      toast.error(LayThongBaoLoi(E));
    } finally {
      SetDangGui(false);
    }
  }
  return (
    <section className="space-y-4">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(E) => {
          E.preventDefault();
          SetTimDaGui(Tim);
          SetTrang(1);
          SetLanTai(LanTai + 1);
        }}
      >
        {TuKhoa === undefined && (
          <>
            <input
              aria-label={`Tìm ${LaModel ? "dòng tài nguyên" : "danh mục"}`}
              className="min-h-11 w-full min-w-0 flex-none sm:w-auto sm:flex-1 rounded border border-rail bg-case px-3 text-sm"
              placeholder="Tìm tên hoặc mã"
              value={Tim}
              onChange={(E) => SetTim(E.target.value)}
            />
            <button className="min-h-11 rounded border border-rail px-3 text-sm">
              Tìm kiếm
            </button>
          </>
        )}
        {CoQuyen(NguoiDung, "ThietBi.Tao") && (
          <NutThemNhanh
            Loai={LaModel ? "DongTaiNguyen" : "DanhMuc"}
            OnThanhCong={DaThayDoi}
          />
        )}
        {CoQuyen(NguoiDung, "ThietBi.Tao") && (
          <button
            type="button"
            className="min-h-11 rounded bg-tally px-3 text-sm font-semibold"
            onClick={() => MoSua()}
          >
            Thêm {LaModel ? "dòng tài nguyên" : "danh mục"}
          </button>
        )}
      </form>
      {DangTai ? (
        <p role="status" className="py-8 text-fog">
          Đang tải danh sách…
        </p>
      ) : Loi ? (
        <LoiThongKe Loi={Loi} OnThuLai={() => SetLanTai(LanTai + 1)} />
      ) : !DuLieu?.DanhSach.length ? (
        <p className="py-8 text-fog">Chưa có bản ghi phù hợp.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {DuLieu.DanhSach.map((Muc) => (
            <article
              key={Muc.Id}
              className="rounded border border-rail bg-case p-4"
            >
              <button
                type="button"
                onClick={() => SetChiTiet(Muc)}
                className="min-h-11 text-left font-semibold text-blueprint hover:underline"
              >
                {LaModel ? Muc.TenMau : Muc.TenDanhMuc}
              </button>
              <p className="break-words text-xs text-fog">
                {LaModel ? Muc.MaMau : (Muc.MaDanhMuc ?? "Chưa có mã")}
                {Muc.DanhMuc ? ` · ${Muc.DanhMuc.TenDanhMuc}` : ""}
              </p>
              {LaModel && (
                <p className="mt-2 text-xs text-fog">
                  Hãng: {Muc.Hang ?? "Chưa xác minh hãng"}
                </p>
              )}
              {LaModel && Muc.ThongKe ? (
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Tổng", Muc.ThongKe.TongSo],
                    ["Hiện có", Muc.ThongKe.HienCo],
                    ["Đang sử dụng", Muc.ThongKe.DangSuDung],
                    ["Bảo trì", Muc.ThongKe.BaoTri],
                  ].map(([Nhan, So]) => (
                    <div key={Nhan}>
                      <dt className="text-xs text-fog">{Nhan}</dt>
                      <dd className="mt-1 tabular-nums">{So}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-4 text-sm text-fog">
                  {!LaModel &&
                    `${Muc._count.DanhSachMau ?? 0} dòng tài nguyên · `}
                  {Muc._count.DanhSachThietBi} máy
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="min-h-11 rounded border border-rail px-3 text-sm"
                  onClick={() => OnXemMay(Muc.Id)}
                >
                  Xem máy
                </button>
                {CoQuyen(NguoiDung, "ThietBi.Sua") && (
                  <button
                    type="button"
                    className="min-h-11 px-3 text-sm text-blueprint"
                    onClick={() => MoSua(Muc)}
                  >
                    Sửa
                  </button>
                )}
                {CoQuyen(NguoiDung, "ThietBi.Xoa") && (
                  <button
                    type="button"
                    className="min-h-11 px-3 text-sm text-tally"
                    onClick={() => SetCanXoa(Muc)}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {DuLieu && (
        <PhanTrangThongKe
          Trang={Trang}
          KichThuoc={12}
          TongSo={DuLieu.TongSo}
          OnDoi={SetTrang}
        />
      )}
      {DangSua && (
        <HopThoaiBieuMau
          TieuDe={`${DangSua.Id ? "Sửa" : "Thêm"} ${LaModel ? "dòng tài nguyên" : "danh mục"}`}
          DangXuLy={DangGui}
          OnDong={() => SetDangSua(null)}
        >
          <form
            className="mt-5 space-y-4"
            onSubmit={(E) => {
              E.preventDefault();
              void Luu();
            }}
          >
            {[
              { Nhan: "Mã", GiaTri: Ma, OnDoi: SetMa, GioiHan: 100 },
              { Nhan: "Tên", GiaTri: Ten, OnDoi: SetTen, GioiHan: 200 },
            ].map(({ Nhan, GiaTri, OnDoi, GioiHan }) => (
              <label className="block text-sm" key={Nhan}>
                {Nhan} *
                <input
                  required
                  maxLength={GioiHan}
                  className="mt-1 min-h-11 w-full rounded border border-rail bg-case-2 px-3"
                  value={GiaTri}
                  onChange={(E) => OnDoi(E.target.value)}
                />
              </label>
            ))}
            {LaModel ? (
              <label className="block text-sm">
                Danh mục *
                <select
                  required
                  disabled={Boolean(DangSua.Id)}
                  className="mt-1 min-h-11 w-full rounded border border-rail bg-case-2 px-3"
                  value={DanhMucChon}
                  onChange={(E) => SetDanhMucChon(E.target.value)}
                >
                  <option value="">Chọn danh mục</option>
                  {DanhMuc.map((Muc) => (
                    <option key={Muc.Id} value={Muc.Id}>
                      {Muc.TenDanhMuc}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block text-sm">
                Mô tả
                <textarea
                  maxLength={1000}
                  className="mt-1 min-h-24 w-full rounded border border-rail bg-case-2 p-3"
                  value={MoTa}
                  onChange={(E) => SetMoTa(E.target.value)}
                />
              </label>
            )}
            <p className="text-xs text-fog">
              Bản ghi có máy hoặc lịch sử liên quan sẽ được kiểm tra trước khi
              xóa.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={DangGui}
                className="min-h-11 px-4"
                onClick={() => SetDangSua(null)}
              >
                Hủy
              </button>
              <button
                disabled={DangGui}
                className="min-h-11 rounded bg-tally px-4 text-sm font-semibold"
              >
                {DangGui ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </form>
        </HopThoaiBieuMau>
      )}
      {ChiTiet && (
        <HopThoaiBieuMau
          TieuDe={
            LaModel
              ? (ChiTiet.TenMau ?? "Dòng tài nguyên")
              : (ChiTiet.TenDanhMuc ?? "Danh mục")
          }
          OnDong={() => SetChiTiet(null)}
        >
          <p className="mt-4 break-words text-sm">
            Mã: {LaModel ? ChiTiet.MaMau : (ChiTiet.MaDanhMuc ?? "Chưa có mã")}
          </p>
          {ChiTiet.DanhMuc && (
            <p className="mt-3 text-sm">
              Danh mục: {ChiTiet.DanhMuc.TenDanhMuc}
            </p>
          )}
          <p className="mt-3 text-sm text-fog">
            {ChiTiet.MoTa ||
              `${ChiTiet._count.DanhSachThietBi} máy thuộc bản ghi này.`}
          </p>
          <button
            className="mt-5 min-h-11 rounded border border-rail px-4 text-sm"
            type="button"
            onClick={() => SetChiTiet(null)}
          >
            Đóng
          </button>
        </HopThoaiBieuMau>
      )}
      {CanXoa && (
        <HopThoaiXacNhan
          TieuDe={`Xóa ${LaModel ? "dòng tài nguyên" : "danh mục"}?`}
          MoTa="Chỉ xóa khi không có dữ liệu phụ thuộc. Máy và lịch sử không bị xóa kèm."
          NhanXacNhan="Xóa"
          DangXuLy={DangGui}
          OnHuy={() => SetCanXoa(null)}
          OnXacNhan={() => void Xoa()}
        />
      )}
    </section>
  );
}
