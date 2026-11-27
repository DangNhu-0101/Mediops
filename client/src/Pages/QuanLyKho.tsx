import { PhanTrangThongKe, LoiThongKe } from "../Components/ThongKeVanHanh";
import type { TongKho } from "../Types/ThongKeVanHanh";
import { CoQuyen } from "../Services/QuyenService";
import { useXacThuc } from "../Contexts/XacThucContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { HopThoaiBieuMau } from "../Components/HopThoaiBieuMau";
import { BanDoKho } from "../Components/BanDoKho";
import { HopThoaiXacNhan } from "../Components/HopThoaiXacNhan";
import { SchemaKho } from "../Schemas/BieuMau";
import {
  CapNhatKho,
  CapNhatTrangThaiKho,
  LayTrangKhoQuanLy,
  TaoKho,
  XoaKho,
} from "../Services/KhoService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type { DuLieuKho, KhoQuanLy } from "../Types/Kho";
import { NutThemNhanh } from "../Components/NutThemNhanh";

const GiaTriMacDinh: z.infer<typeof SchemaKho> = {
  MaKho: "",
  TenKho: "",
  DiaChi: "",
  ViDo: "",
  KinhDo: "",
  BanKinhXacMinhMet: "100",
  DangHoatDong: true,
};

function ChuyenDoiDuLieu(DuLieu: z.infer<typeof SchemaKho>): DuLieuKho {
  return {
    ...DuLieu,
    ViDo: Number(DuLieu.ViDo),
    KinhDo: Number(DuLieu.KinhDo),
    BanKinhXacMinhMet: Number(DuLieu.BanKinhXacMinhMet),
  };
}

export function QuanLyKho({
  Nhung = false,
  TuKhoa,
  ChiSo,
  OnThayDoi,
}: {
  Nhung?: boolean;
  TuKhoa?: string;
  ChiSo?: TongKho["NhomKho"];
  OnThayDoi?: () => void;
}) {
  const [ThamSoDuongDan] = useSearchParams();
  const [Trang, SetTrang] = useState(1);
  const [TongSo, SetTongSo] = useState(0);
  const LanYeuCau = useRef(0);
  const { NguoiDung } = useXacThuc();
  const [DanhSach, SetDanhSach] = useState<KhoQuanLy[]>([]);
  const [TimKiem, SetTimKiem] = useState(ThamSoDuongDan.get("TimKiem") ?? "");
  const [DangHoatDong, SetDangHoatDong] = useState<boolean | undefined>();
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");
  const [KhoDangSua, SetKhoDangSua] = useState<KhoQuanLy | null>(null);
  const [KhoCanDoiTrangThai, SetKhoCanDoiTrangThai] =
    useState<KhoQuanLy | null>(null);
  const [KhoCanXoa, SetKhoCanXoa] = useState<KhoQuanLy | null>(null);
  const [DangXuLy, SetDangXuLy] = useState(false);
  const {
    register: Register,
    handleSubmit: HandleSubmit,
    reset: Reset,
    watch: Watch,
    setValue: SetValue,
    formState: { errors: Errors, isSubmitting: IsSubmitting },
  } = useForm<z.infer<typeof SchemaKho>>({
    resolver: zodResolver(SchemaKho),
    defaultValues: GiaTriMacDinh,
  });
  const [ViDo, KinhDo, BanKinh, DiaChi] = Watch([
    "ViDo",
    "KinhDo",
    "BanKinhXacMinhMet",
    "DiaChi",
  ]);

  async function TaiDanhSachKho() {
    const LanNay = ++LanYeuCau.current;
    SetDangTai(true);
    SetLoi("");
    try {
      const KetQua = await LayTrangKhoQuanLy({
        TimKiem: (TuKhoa ?? TimKiem) || undefined,
        DangHoatDong,
        Trang,
        KichThuoc: 12,
      });
      if (LanNay === LanYeuCau.current) {
        SetDanhSach(KetQua.DanhSach);
        SetTongSo(KetQua.TongSo);
      }
    } catch (LoiTai) {
      if (LanNay === LanYeuCau.current) SetLoi(LayThongBaoLoi(LoiTai));
    } finally {
      if (LanNay === LanYeuCau.current) SetDangTai(false);
    }
  }

  useEffect(() => {
    void TaiDanhSachKho();
  }, [DangHoatDong, Trang, TuKhoa]);
  useEffect(() => {
    SetTrang(1);
  }, [DangHoatDong, TuKhoa]);

  const DaMoSua = useRef(false);
  useEffect(() => {
    const Kho = DanhSach.find(
      (Muc) => Muc.Id === ThamSoDuongDan.get("ChinhSuaKho"),
    );
    if (!DaMoSua.current && Kho && CoQuyen(NguoiDung, "Kho.Sua")) {
      DaMoSua.current = true;
      MoChinhSua(Kho);
    }
  }, [DanhSach, ThamSoDuongDan, NguoiDung]);
  function MoTaoMoi() {
    SetKhoDangSua({} as KhoQuanLy);
    Reset(GiaTriMacDinh);
  }

  function MoChinhSua(Kho: KhoQuanLy) {
    SetKhoDangSua(Kho);
    Reset({
      MaKho: Kho.MaKho,
      TenKho: Kho.TenKho,
      DiaChi: Kho.DiaChi,
      ViDo: String(Kho.ViDo),
      KinhDo: String(Kho.KinhDo),
      BanKinhXacMinhMet: String(Kho.BanKinhXacMinhMet),
      DangHoatDong: Kho.DangHoatDong,
    });
  }

  async function LuuKho(DuLieu: z.infer<typeof SchemaKho>) {
    try {
      if (KhoDangSua?.Id)
        await CapNhatKho(KhoDangSua.Id, ChuyenDoiDuLieu(DuLieu));
      else await TaoKho(ChuyenDoiDuLieu(DuLieu));
      toast.success(
        KhoDangSua?.Id ? "Cập nhật kho thành công." : "Tạo kho thành công.",
      );
      SetKhoDangSua(null);
      await TaiDanhSachKho();
      OnThayDoi?.();
    } catch (LoiLuu) {
      toast.error(LayThongBaoLoi(LoiLuu));
    }
  }

  async function XacNhanDoiTrangThai() {
    if (!KhoCanDoiTrangThai) return;
    SetDangXuLy(true);
    try {
      await CapNhatTrangThaiKho(
        KhoCanDoiTrangThai.Id,
        !KhoCanDoiTrangThai.DangHoatDong,
      );
      toast.success(
        KhoCanDoiTrangThai.DangHoatDong
          ? "Đã vô hiệu hóa kho."
          : "Đã kích hoạt kho.",
      );
      SetKhoCanDoiTrangThai(null);
      await TaiDanhSachKho();
      OnThayDoi?.();
    } catch (LoiCapNhat) {
      toast.error(LayThongBaoLoi(LoiCapNhat));
    } finally {
      SetDangXuLy(false);
    }
  }

  async function XacNhanXoa() {
    if (!KhoCanXoa) return;
    SetDangXuLy(true);
    try {
      await XoaKho(KhoCanXoa.Id);
      toast.success("Đã xóa kho.");
      SetKhoCanXoa(null);
      await TaiDanhSachKho();
      OnThayDoi?.();
    } catch (LoiXoa) {
      toast.error(LayThongBaoLoi(LoiXoa));
    } finally {
      SetDangXuLy(false);
    }
  }

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            className={`font-serif ${Nhung ? "text-xl" : "text-2xl md:text-3xl"}`}
          >
            Quản lý kho
          </h2>
          <p className="mt-2 text-sm text-fog">
            Thiết lập kho vật lý và phạm vi xác minh vị trí khi mượn, trả.
          </p>
        </div>
        {CoQuyen(NguoiDung, "Kho.Tao") && (
          <div className="flex flex-wrap gap-2">
            <NutThemNhanh
              Loai="Kho"
              OnThanhCong={() => void TaiDanhSachKho()}
            />
            <button
              className="flex min-h-11 items-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold"
              onClick={MoTaoMoi}
              type="button"
            >
              <Plus size={17} />
              Thêm kho
            </button>
          </div>
        )}
      </header>
      <div className="mb-5 flex flex-wrap gap-3">
        {TuKhoa === undefined && (
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-3 text-fog" size={18} />
            <input
              className="h-11 w-full rounded border border-rail bg-case-2 pl-10 pr-3"
              onChange={(SuKien) => SetTimKiem(SuKien.target.value)}
              onKeyDown={(SuKien) => {
                if (SuKien.key === "Enter") {
                  SetTrang(1);
                  void TaiDanhSachKho();
                }
              }}
              placeholder="Tìm theo tên, mã hoặc địa chỉ"
              value={TimKiem}
            />
          </label>
        )}
        <select
          className="h-11 rounded border border-rail bg-case-2 px-3"
          onChange={(SuKien) =>
            SetDangHoatDong(
              SuKien.target.value === ""
                ? undefined
                : SuKien.target.value === "true",
            )
          }
          value={DangHoatDong === undefined ? "" : String(DangHoatDong)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã vô hiệu hóa</option>
        </select>
        <button
          className="rounded border border-rail px-4 text-sm text-fog hover:bg-case"
          onClick={() => {
            SetTrang(1);
            void TaiDanhSachKho();
          }}
          type="button"
        >
          Tìm kiếm
        </button>
      </div>
      {DangTai ? (
        <p className="py-12 text-center text-fog">Đang tải kho…</p>
      ) : Loi ? (
        <LoiThongKe Loi={Loi} OnThuLai={() => void TaiDanhSachKho()} />
      ) : DanhSach.length === 0 ? (
        <div className="rounded border border-rail bg-case p-8 text-center text-fog">
          Chưa có kho phù hợp.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {DanhSach.map((Kho) => (
            <article
              key={Kho.Id}
              className="rounded border border-rail bg-case p-4"
            >
              <Link
                className="inline-flex min-h-11 items-center font-semibold text-blueprint hover:underline"
                to={`/kho/${Kho.Id}`}
              >
                {Kho.TenKho}
              </Link>
              <p className="text-xs text-fog">
                {Kho.MaKho} ·{" "}
                {Kho.DangHoatDong ? "Đang hoạt động" : "Đã vô hiệu hóa"}
              </p>
              <p className="mt-3 text-sm text-fog">{Kho.DiaChi}</p>
              <p className="mt-2 text-sm">
                {Kho._count.DanhSachThietBi ?? "Chưa có quyền xem số"} máy
              </p>
              {ChiSo?.find((Muc) => Muc.Id === Kho.Id) && (
                <p className="mt-1 text-xs text-fog">
                  Hiện có {ChiSo.find((Muc) => Muc.Id === Kho.Id)!.HienCo} ·
                  Đang sử dụng{" "}
                  {ChiSo.find((Muc) => Muc.Id === Kho.Id)!.DangSuDung} · Bảo trì{" "}
                  {ChiSo.find((Muc) => Muc.Id === Kho.Id)!.BaoTri}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {CoQuyen(NguoiDung, "Kho.Sua") && (
                  <>
                    <button
                      aria-label={`Chỉnh sửa ${Kho.TenKho}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded border border-rail px-3 text-sm"
                      type="button"
                      onClick={() => MoChinhSua(Kho)}
                    >
                      <Pencil size={16} />
                      Sửa
                    </button>
                    <button
                      aria-label={`${Kho.DangHoatDong ? "Vô hiệu hóa" : "Kích hoạt"} ${Kho.TenKho}`}
                      className="inline-flex min-h-11 items-center gap-2 px-3 text-sm text-timecode"
                      type="button"
                      onClick={() => SetKhoCanDoiTrangThai(Kho)}
                    >
                      <Power size={16} />
                      {Kho.DangHoatDong ? "Vô hiệu hóa" : "Kích hoạt"}
                    </button>
                  </>
                )}
                {CoQuyen(NguoiDung, "Kho.Xoa") && (
                  <button
                    aria-label={`Xóa ${Kho.TenKho}`}
                    className="inline-flex min-h-11 items-center gap-2 px-3 text-sm text-tally"
                    type="button"
                    onClick={() => SetKhoCanXoa(Kho)}
                  >
                    <Trash2 size={16} />
                    Xóa
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <PhanTrangThongKe
        Trang={Trang}
        KichThuoc={12}
        TongSo={TongSo}
        OnDoi={SetTrang}
      />
      {KhoDangSua && (
        <HopThoaiBieuMau
          DangXuLy={IsSubmitting}
          OnDong={() => SetKhoDangSua(null)}
          TieuDe={KhoDangSua.Id ? "Chỉnh sửa kho" : "Thêm kho"}
        >
          <form className="mt-5" onSubmit={HandleSubmit(LuuKho)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Truong Nhan="Tên kho *" Loi={Errors.TenKho?.message}>
                <input
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  {...Register("TenKho")}
                />
              </Truong>
              <Truong Nhan="Mã kho *" Loi={Errors.MaKho?.message}>
                <input
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  {...Register("MaKho")}
                />
              </Truong>
              <Truong
                Lop="sm:col-span-2"
                Nhan="Địa chỉ *"
                Loi={Errors.DiaChi?.message}
              >
                <input
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  {...Register("DiaChi")}
                />
              </Truong>
              <fieldset className="sm:col-span-2 rounded border border-rail bg-case-2 p-4">
                <legend className="px-1 text-sm">Tọa độ xác minh vị trí</legend>
                <p className="mb-4 text-xs leading-5 text-fog">
                  Dùng để máy chủ xác minh vị trí khi nhân sự nhận hoặc trả tài
                  nguyên. Không yêu cầu vị trí hiện tại khi mở hoặc chỉnh sửa
                  kho.
                </p>
                <BanDoKho
                  ViDo={ViDo.trim() ? Number(ViDo) : undefined}
                  KinhDo={KinhDo.trim() ? Number(KinhDo) : undefined}
                  BanKinhMet={Number(BanKinh)}
                  DiaChiGoiY={DiaChi}
                  OnChon={(ViDoMoi, KinhDoMoi) => {
                    // Chốt ghim mà chưa có bán kính hợp lệ thì dùng mặc định 100 m.
                    if (!(Number(BanKinh) > 0)) {
                      SetValue("BanKinhXacMinhMet", "100", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                    SetValue("ViDo", ViDoMoi.toFixed(6), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    SetValue("KinhDo", KinhDoMoi.toFixed(6), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Truong Nhan="Vĩ độ *" Loi={Errors.ViDo?.message}>
                    <input
                      className="h-11 w-full rounded border border-rail bg-case px-3"
                      inputMode="decimal"
                      placeholder="Ví dụ: 10.776889"
                      {...Register("ViDo")}
                    />
                  </Truong>
                  <Truong Nhan="Kinh độ *" Loi={Errors.KinhDo?.message}>
                    <input
                      className="h-11 w-full rounded border border-rail bg-case px-3"
                      inputMode="decimal"
                      placeholder="Ví dụ: 106.700806"
                      {...Register("KinhDo")}
                    />
                  </Truong>
                </div>
              </fieldset>
              <Truong
                Nhan="Bán kính xác minh (mét) *"
                Loi={Errors.BanKinhXacMinhMet?.message}
              >
                <input
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  min="1"
                  max="5000"
                  type="number"
                  {...Register("BanKinhXacMinhMet")}
                />
              </Truong>
              <label className="flex min-h-11 items-center gap-3 self-end rounded border border-rail bg-case-2 px-3 text-sm">
                <input
                  className="accent-tally"
                  type="checkbox"
                  {...Register("DangHoatDong")}
                />
                Kích hoạt kho sau khi lưu
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded border border-rail px-4 text-sm"
                onClick={() => SetKhoDangSua(null)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="rounded bg-tally px-4 py-2 text-sm font-semibold disabled:opacity-60"
                disabled={IsSubmitting}
                type="submit"
              >
                {IsSubmitting ? "Đang lưu…" : "Lưu kho"}
              </button>
            </div>
          </form>
        </HopThoaiBieuMau>
      )}
      {KhoCanDoiTrangThai && (
        <HopThoaiXacNhan
          DangXuLy={DangXuLy}
          MoTa={
            <>
              {KhoCanDoiTrangThai.DangHoatDong ? (
                <>
                  Kho <strong>{KhoCanDoiTrangThai.TenKho}</strong> sẽ không thể
                  được gán mới cho thiết bị hoặc dùng để xuất kho.
                </>
              ) : (
                <>
                  Kho <strong>{KhoCanDoiTrangThai.TenKho}</strong> sẽ được phép
                  dùng lại cho phân công và xuất kho.
                </>
              )}
            </>
          }
          NhanXacNhan={
            KhoCanDoiTrangThai.DangHoatDong
              ? "Vô hiệu hóa kho"
              : "Kích hoạt kho"
          }
          OnHuy={() => SetKhoCanDoiTrangThai(null)}
          OnXacNhan={() => void XacNhanDoiTrangThai()}
          TieuDe={
            KhoCanDoiTrangThai.DangHoatDong
              ? "Vô hiệu hóa kho"
              : "Kích hoạt kho"
          }
        />
      )}
      {KhoCanXoa && (
        <HopThoaiXacNhan
          DangXuLy={DangXuLy}
          MoTa={
            <>
              Kho <strong>{KhoCanXoa.TenKho}</strong> sẽ bị xóa vĩnh viễn. Hệ
              thống chỉ cho phép xóa khi kho chưa có thiết bị hoặc giao dịch
              liên quan.
            </>
          }
          NhanXacNhan="Xóa kho"
          OnHuy={() => SetKhoCanXoa(null)}
          OnXacNhan={() => void XacNhanXoa()}
          TieuDe="Xóa kho"
        />
      )}
    </section>
  );
}

function Truong({
  Nhan: Nhan,
  Loi: Loi,
  children: Children,
  Lop: Lop = "",
}: {
  Nhan: string;
  Loi?: string;
  children: React.ReactNode;
  Lop?: string;
}) {
  return (
    <label className={Lop}>
      <span className="mb-2 block text-sm">{Nhan}</span>
      {Children}
      {Loi ? <p className="mt-1 text-sm text-tally">{Loi}</p> : null}
    </label>
  );
}
