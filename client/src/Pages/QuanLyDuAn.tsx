import { CoQuyen } from "../Services/QuyenService";
import { PhanTrangThongKe, LoiThongKe } from "../Components/ThongKeVanHanh";
import { LayTomTatDuAn } from "../Services/ThongKeVanHanhService";
import type { TongQuanDuAn } from "../Types/ThongKeVanHanh";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HopThoaiXacNhan } from "../Components/HopThoaiXacNhan";
import { HopThoaiBieuMau } from "../Components/HopThoaiBieuMau";
import { useXacThuc } from "../Contexts/XacThucContext";
import {
  CapNhatDuAn,
  LayDanhSachDuAn,
  TaoDuAn,
  XoaDuAn,
} from "../Services/DuAnService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { TheoDoiCapNhatLich } from "../Services/SocketLichService";
import type { DuAn, DuLieuDuAn, TrangThaiDuAn } from "../Types/DuAn";
import { SchemaDuAn } from "../Schemas/BieuMau";
import type { z } from "zod";
import { NutThemNhanh } from "../Components/NutThemNhanh";

const NhanTrangThai: Record<TrangThaiDuAn, string> = {
  DANG_CHUAN_BI: "Đang chuẩn bị",
  DANG_SAN_XUAT: "Đang sản xuất",
  HOAN_THANH: "Hoàn thành",
  DA_HUY: "Đã hủy",
};
const LopTrangThai: Record<TrangThaiDuAn, string> = {
  DANG_CHUAN_BI: "bg-blueprint/20 text-blueprint",
  DANG_SAN_XUAT: "bg-timecode/20 text-timecode",
  HOAN_THANH: "bg-phosphor/20 text-phosphor",
  DA_HUY: "bg-tally/20 text-tally",
};
const GiaTriMacDinh: DuLieuDuAn = { TenDuAn: "", TrangThai: "DANG_CHUAN_BI" };

export function QuanLyDuAn() {
  const [ThamSoDuongDan] = useSearchParams();
  const { NguoiDung: NguoiDung } = useXacThuc();
  const CoQuyenQuanLy =
    CoQuyen(NguoiDung, "DuAn.Sua") || CoQuyen(NguoiDung, "DuAn.Xoa");
  const [DanhSach, SetDanhSach] = useState<DuAn[]>([]);
  const [TimKiem, SetTimKiem] = useState(ThamSoDuongDan.get("TimKiem") ?? "");
  const [TrangThai, SetTrangThai] = useState<TrangThaiDuAn | "">("");
  const [Trang, SetTrang] = useState(1);
  const [TongQuan, SetTongQuan] =
    useState<Pick<TongQuanDuAn, "TongDuAn" | "TheoTrangThai">>();
  const LanYeuCau = useRef(0);
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");
  const [DuLieuBieuMau, SetDuLieuBieuMau] = useState<DuLieuDuAn>(GiaTriMacDinh);
  const [DuAnDangSua, SetDuAnDangSua] = useState<DuAn | null>(null);
  const [DuAnCanXoa, SetDuAnCanXoa] = useState<DuAn | null>(null);
  const [DangGui, SetDangGui] = useState(false);
  const {
    handleSubmit: HandleSubmit,
    reset: Reset,
    formState: { errors: Errors },
  } = useForm<z.infer<typeof SchemaDuAn>>({
    resolver: zodResolver(SchemaDuAn),
    defaultValues: {
      ...GiaTriMacDinh,
      MaDuAn: "",
      TenKhachHang: "",
      MoTa: "",
      HanChot: "",
    },
  });

  async function TaiDuAn() {
    const LanNay = ++LanYeuCau.current;
    SetDangTai(true);
    SetLoi("");
    try {
      const [CacDuAn, ThongKe] = await Promise.all([
        LayDanhSachDuAn({
          TimKiem: TimKiem || undefined,
          TrangThai: TrangThai || undefined,
          Trang,
          KichThuoc: 12,
        }),
        LayTomTatDuAn({
          TimKiem: TimKiem || undefined,
          TrangThai: TrangThai || undefined,
        }),
      ]);
      if (LanNay !== LanYeuCau.current) return;
      SetDanhSach(CacDuAn);
      SetTongQuan(ThongKe);
    } catch (LoiTai) {
      if (LanNay === LanYeuCau.current) SetLoi(LayThongBaoLoi(LoiTai));
    } finally {
      if (LanNay === LanYeuCau.current) SetDangTai(false);
    }
  }
  useEffect(() => {
    void TaiDuAn();
  }, [TrangThai, Trang]);

  useEffect(
    () => TheoDoiCapNhatLich(() => void TaiDuAn()),
    [TrangThai, Trang, TimKiem],
  );
  const DaMoSua = useRef(false);
  useEffect(() => {
    const DuAn = DanhSach.find(
      (Muc) => Muc.Id === ThamSoDuongDan.get("ChinhSua"),
    );
    if (!DaMoSua.current && DuAn && CoQuyen(NguoiDung, "DuAn.Sua")) {
      DaMoSua.current = true;
      MoChinhSua(DuAn);
    }
  }, [DanhSach, ThamSoDuongDan, NguoiDung]);
  function MoTaoMoi() {
    SetDuAnDangSua({} as DuAn);
    SetDuLieuBieuMau(GiaTriMacDinh);
    Reset({
      ...GiaTriMacDinh,
      MaDuAn: "",
      TenKhachHang: "",
      MoTa: "",
      HanChot: "",
    });
  }
  function MoChinhSua(DuAn: DuAn) {
    SetDuAnDangSua(DuAn);
    const DuLieuMoi = {
      MaDuAn: DuAn.MaDuAn ?? undefined,
      TenDuAn: DuAn.TenDuAn,
      TenKhachHang: DuAn.TenKhachHang ?? undefined,
      MoTa: DuAn.MoTa ?? undefined,
      TrangThai: DuAn.TrangThai,
      HanChot: DuAn.HanChot?.slice(0, 10),
    };
    SetDuLieuBieuMau(DuLieuMoi);
    Reset({
      ...DuLieuMoi,
      MaDuAn: DuLieuMoi.MaDuAn ?? "",
      TenKhachHang: DuLieuMoi.TenKhachHang ?? "",
      MoTa: DuLieuMoi.MoTa ?? "",
      HanChot: DuLieuMoi.HanChot ?? "",
    });
  }
  async function LuuDuAn() {
    SetDangGui(true);
    try {
      if (DuAnDangSua?.Id) await CapNhatDuAn(DuAnDangSua.Id, DuLieuBieuMau);
      else await TaoDuAn(DuLieuBieuMau);
      toast.success(
        DuAnDangSua?.Id
          ? "Cập nhật thông tin thành công."
          : "Tạo dự án thành công.",
      );
      SetDuAnDangSua(null);
      await TaiDuAn();
    } catch (LoiLuu) {
      toast.error(LayThongBaoLoi(LoiLuu));
    } finally {
      SetDangGui(false);
    }
  }
  async function XacNhanXoa() {
    if (!DuAnCanXoa) return;
    SetDangGui(true);
    try {
      await XoaDuAn(DuAnCanXoa.Id);
      toast.success("Đã xóa dự án.");
      SetDuAnCanXoa(null);
      await TaiDuAn();
    } catch (LoiXoa) {
      toast.error(LayThongBaoLoi(LoiXoa));
    } finally {
      SetDangGui(false);
    }
  }

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mt-2 font-serif text-2xl md:text-3xl">
            Quản lý dự án
          </h1>
          <p className="mt-2 text-sm text-fog">
            Theo dõi tiến độ và các ca quay liên quan.
          </p>
        </div>
        {CoQuyen(NguoiDung, "DuAn.Tao") && (
          <div className="flex flex-wrap gap-2">
            <NutThemNhanh Loai="DuAn" OnThanhCong={() => void TaiDuAn()} />
            <button
              className="flex min-h-11 items-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold"
              onClick={MoTaoMoi}
              type="button"
            >
              <Plus size={17} />
              Tạo dự án
            </button>
          </div>
        )}
      </header>
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          className="h-11 min-w-56 flex-1 rounded border border-rail bg-case-2 px-3"
          placeholder="Tìm kiếm dự án"
          value={TimKiem}
          onChange={(E) => SetTimKiem(E.target.value)}
          onKeyDown={(E) => {
            if (E.key === "Enter") {
              SetTrang(1);
              void TaiDuAn();
            }
          }}
        />
        <select
          className="h-11 rounded border border-rail bg-case-2 px-3"
          value={TrangThai}
          onChange={(E) => {
            SetTrangThai(E.target.value as TrangThaiDuAn | "");
            SetTrang(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(NhanTrangThai).map(([GiaTri, Nhan]) => (
            <option key={GiaTri} value={GiaTri}>
              {Nhan}
            </option>
          ))}
        </select>
        <button
          className="rounded border border-rail px-4 text-sm text-fog hover:bg-case"
          onClick={() => {
            SetTrang(1);
            void TaiDuAn();
          }}
          type="button"
        >
          Tìm kiếm
        </button>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(NhanTrangThai).map(([GiaTri, Nhan]) => (
          <div className="rounded border border-rail bg-case p-4" key={GiaTri}>
            <p className="text-sm text-fog">{Nhan}</p>
            <p className="mt-2 font-mono text-2xl">
              {TongQuan?.TheoTrangThai[GiaTri] ?? 0}
            </p>
            <p className="mt-1 text-xs text-fog">Trong kết quả lọc hiện tại.</p>
          </div>
        ))}
      </div>
      {!DangTai && !Loi && TongQuan && (
        <p className="mb-4 text-sm text-fog">
          {TongQuan.TongDuAn} dự án trong kết quả hiện tại.
        </p>
      )}
      {DangTai ? (
        <p className="py-12 text-center text-fog">Đang tải dự án…</p>
      ) : Loi ? (
        <LoiThongKe Loi={Loi} OnThuLai={() => void TaiDuAn()} />
      ) : DanhSach.length === 0 ? (
        <div className="rounded border border-rail bg-case p-8 text-center text-fog">
          Chưa có dự án phù hợp.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {DanhSach.map((DuAn) => (
            <article
              key={DuAn.Id}
              className="flex flex-col rounded border border-rail bg-case p-5"
            >
              <span
                className={`self-start rounded px-2 py-1 text-xs ${LopTrangThai[DuAn.TrangThai]}`}
              >
                {NhanTrangThai[DuAn.TrangThai]}
              </span>
              <Link
                className="mt-3 inline-flex min-h-11 items-center break-words font-semibold text-blueprint hover:underline"
                to={`/du-an/${DuAn.Id}`}
              >
                {DuAn.TenDuAn}
              </Link>
              <p className="mt-1 text-xs text-fog">
                {DuAn.MaDuAn ?? "Chưa có mã"} ·{" "}
                {DuAn.TenKhachHang ?? "Chưa ghi khách hàng"}
              </p>
              {DuAn.MoTa && (
                <p className="mt-3 line-clamp-2 text-sm text-fog">
                  {DuAn.MoTa}
                </p>
              )}
             
              {DuAn.HanChot && (
                <p className="mt-1 text-xs text-fog">
                  Hạn chót: {new Date(DuAn.HanChot).toLocaleDateString("vi-VN")}
                </p>
              )}
              {CoQuyenQuanLy && (
                <div className="mt-auto flex justify-end gap-2 pt-4">
                  {CoQuyen(NguoiDung, "DuAn.Sua") && (
                    <button
                      aria-label={`Chỉnh sửa ${DuAn.TenDuAn}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded border border-rail px-3 text-sm"
                      type="button"
                      onClick={() => MoChinhSua(DuAn)}
                    >
                      <Pencil size={16} />
                      Sửa
                    </button>
                  )}
                  {CoQuyen(NguoiDung, "DuAn.Xoa") && (
                    <button
                      aria-label={`Xóa ${DuAn.TenDuAn}`}
                      className="inline-flex min-h-11 items-center gap-2 px-3 text-sm text-tally"
                      type="button"
                      onClick={() => SetDuAnCanXoa(DuAn)}
                    >
                      <Trash2 size={16} />
                      Xóa
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {TongQuan && (
        <PhanTrangThongKe
          Trang={Trang}
          KichThuoc={12}
          TongSo={TongQuan.TongDuAn}
          OnDoi={SetTrang}
        />
      )}
      {DuAnDangSua && (
        <HopThoaiBieuMau
          DangXuLy={DangGui}
          OnDong={() => SetDuAnDangSua(null)}
          TieuDe={DuAnDangSua.Id ? "Chỉnh sửa dự án" : "Tạo dự án"}
        >
          <form className="mt-5" onSubmit={HandleSubmit(LuuDuAn)}>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["TenDuAn", "Tên dự án"],
                  ["MaDuAn", "Mã dự án"],
                  ["TenKhachHang", "Khách hàng"],
                ] as const
              ).map(([Truong, Nhan]) => (
                <label
                  key={Truong}
                  className={Truong === "TenDuAn" ? "sm:col-span-2" : ""}
                >
                  <span className="mb-2 block text-sm">
                    {Nhan}
                    {Truong === "TenDuAn" ? " *" : ""}
                  </span>
                  <input
                    className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                    required={Truong === "TenDuAn"}
                    onBlur={() =>
                      Reset({
                        ...DuLieuBieuMau,
                        MaDuAn: DuLieuBieuMau.MaDuAn ?? "",
                        TenKhachHang: DuLieuBieuMau.TenKhachHang ?? "",
                        MoTa: DuLieuBieuMau.MoTa ?? "",
                        HanChot: DuLieuBieuMau.HanChot ?? "",
                      })
                    }
                    value={DuLieuBieuMau[Truong] ?? ""}
                    onChange={(E) => {
                      const DuLieuMoi = {
                        ...DuLieuBieuMau,
                        [Truong]: E.target.value || undefined,
                      };
                      SetDuLieuBieuMau(DuLieuMoi);
                      Reset({
                        ...DuLieuMoi,
                        MaDuAn: DuLieuMoi.MaDuAn ?? "",
                        TenKhachHang: DuLieuMoi.TenKhachHang ?? "",
                        MoTa: DuLieuMoi.MoTa ?? "",
                        HanChot: DuLieuMoi.HanChot ?? "",
                      });
                    }}
                  />
                  {Errors[Truong] && (
                    <p className="mt-1 text-sm text-tally">
                      {Errors[Truong]?.message}
                    </p>
                  )}
                </label>
              ))}
              <label>
                <span className="mb-2 block text-sm">Trạng thái</span>
                <select
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  value={DuLieuBieuMau.TrangThai}
                  onChange={(E) => {
                    const DuLieuMoi = {
                      ...DuLieuBieuMau,
                      TrangThai: E.target.value as TrangThaiDuAn,
                    };
                    SetDuLieuBieuMau(DuLieuMoi);
                    Reset({
                      ...DuLieuMoi,
                      MaDuAn: DuLieuMoi.MaDuAn ?? "",
                      TenKhachHang: DuLieuMoi.TenKhachHang ?? "",
                      MoTa: DuLieuMoi.MoTa ?? "",
                      HanChot: DuLieuMoi.HanChot ?? "",
                    });
                  }}
                >
                  {Object.entries(NhanTrangThai).map(([GiaTri, Nhan]) => (
                    <option key={GiaTri} value={GiaTri}>
                      {Nhan}
                    </option>
                  ))}
                </select>
              </label>
              {Errors.TrangThai && (
                <p className="text-sm text-tally">{Errors.TrangThai.message}</p>
              )}
              <label>
                <span className="mb-2 block text-sm">Hạn chót</span>
                <input
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  type="date"
                  value={DuLieuBieuMau.HanChot ?? ""}
                  onChange={(E) => {
                    const DuLieuMoi = {
                      ...DuLieuBieuMau,
                      HanChot: E.target.value || undefined,
                    };
                    SetDuLieuBieuMau(DuLieuMoi);
                    Reset({
                      ...DuLieuMoi,
                      MaDuAn: DuLieuMoi.MaDuAn ?? "",
                      TenKhachHang: DuLieuMoi.TenKhachHang ?? "",
                      MoTa: DuLieuMoi.MoTa ?? "",
                      HanChot: DuLieuMoi.HanChot ?? "",
                    });
                  }}
                />
              </label>
              {Errors.HanChot && (
                <p className="text-sm text-tally">{Errors.HanChot.message}</p>
              )}
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm">Mô tả</span>
                <textarea
                  className="min-h-24 w-full rounded border border-rail bg-case-2 p-3"
                  value={DuLieuBieuMau.MoTa ?? ""}
                  onChange={(E) => {
                    const DuLieuMoi = {
                      ...DuLieuBieuMau,
                      MoTa: E.target.value || undefined,
                    };
                    SetDuLieuBieuMau(DuLieuMoi);
                    Reset({
                      ...DuLieuMoi,
                      MaDuAn: DuLieuMoi.MaDuAn ?? "",
                      TenKhachHang: DuLieuMoi.TenKhachHang ?? "",
                      MoTa: DuLieuMoi.MoTa ?? "",
                      HanChot: DuLieuMoi.HanChot ?? "",
                    });
                  }}
                />
              </label>
              {Errors.MoTa && (
                <p className="text-sm text-tally">{Errors.MoTa.message}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded border border-rail px-4 text-sm"
                onClick={() => SetDuAnDangSua(null)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="rounded bg-tally px-4 text-sm font-semibold"
                disabled={DangGui}
                type="submit"
              >
                {DangGui ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </form>
        </HopThoaiBieuMau>
      )}
      {DuAnCanXoa && (
        <HopThoaiXacNhan
          TieuDe="Xóa dự án"
          MoTa={
            <>
              Dự án <strong>{DuAnCanXoa.TenDuAn}</strong> sẽ bị xóa vĩnh viễn.
              Không thể xóa nếu dự án còn ca quay liên quan.
            </>
          }
          NhanXacNhan="Xóa dự án"
          DangXuLy={DangGui}
          OnHuy={() => SetDuAnCanXoa(null)}
          OnXacNhan={() => void XacNhanXoa()}
        />
      )}
    </section>
  );
}
