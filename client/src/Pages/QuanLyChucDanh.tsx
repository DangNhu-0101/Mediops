import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HopThoaiBieuMau } from "../Components/HopThoaiBieuMau";
import { HopThoaiXacNhan } from "../Components/HopThoaiXacNhan";
import { useXacThuc } from "../Contexts/XacThucContext";
import {
  CapNhatChucDanh,
  LayDanhSachChucDanh,
  TaoChucDanh,
  XoaChucDanh,
} from "../Services/NhomQuyenService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type { ChucDanh } from "../Types/NhomQuyen";
import { NutThemNhanh } from "../Components/NutThemNhanh";

export function QuanLyChucDanh() {
  const { NguoiDung } = useXacThuc();
  // Quản trị hệ thống quản lý danh mục dùng chung; quản trị đơn vị quản lý chức danh riêng.
  const LaHeThong = !!NguoiDung?.LaQuanTriHeThong;
  const [DanhSach, SetDanhSach] = useState<ChucDanh[]>();
  const [Loi, SetLoi] = useState("");
  const [DangXuLy, SetDangXuLy] = useState(false);
  const [DangSua, SetDangSua] = useState<{
    Id: string | null;
    TenChucDanh: string;
  } | null>(null);
  const [CanXoa, SetCanXoa] = useState<ChucDanh | null>(null);

  async function Tai() {
    try {
      SetDanhSach(await LayDanhSachChucDanh());
    } catch (LoiTai) {
      SetLoi(LayThongBaoLoi(LoiTai));
    }
  }
  useEffect(() => {
    void Tai();
  }, []);

  if (!NguoiDung?.QuanTriDonVi && !LaHeThong)
    return <p role="alert">Bạn không có quyền quản lý chức danh.</p>;

  async function ThucHien(ThaoTac: () => Promise<void>, ThongBao: string) {
    SetDangXuLy(true);
    try {
      await ThaoTac();
      toast.success(ThongBao);
      await Tai();
      return true;
    } catch (LoiXuLy) {
      toast.error(LayThongBaoLoi(LoiXuLy));
      return false;
    } finally {
      SetDangXuLy(false);
    }
  }

  return (
    <section>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">
            {LaHeThong ? "Chức danh dùng chung" : "Chức danh"}
          </h1>
          <p className="my-4 max-w-3xl text-sm text-fog">
            {LaHeThong
              ? "Danh mục chức danh áp dụng cho mọi đơn vị. Khi thêm hoặc đổi tên trùng với chức danh riêng của đơn vị, chức danh riêng được gộp vào chức danh dùng chung."
              : "Chức danh mô tả chuyên môn của nhân sự, dùng khi lập yêu cầu nhân sự, phân công ca quay và tìm người thay thế cùng chức danh. Chức danh dùng chung do quản trị hệ thống quản lý; đơn vị có thể thêm chức danh riêng. Chức danh không cấp quyền."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NutThemNhanh Loai="ChucDanh" OnThanhCong={() => void Tai()} />
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold"
            onClick={() => SetDangSua({ Id: null, TenChucDanh: "" })}
          >
            <Plus size={17} />
            Thêm chức danh
          </button>
        </div>
      </header>
      {Loi && (
        <p role="alert" className="my-4 text-tally">
          {Loi}
        </p>
      )}
      {!DanhSach ? (
        !Loi && <p>Đang tải chức danh…</p>
      ) : DanhSach.length === 0 ? (
        <div className="rounded border border-rail bg-case p-8 text-center text-fog">
          {LaHeThong
            ? "Chưa có chức danh dùng chung."
            : "Đơn vị chưa có chức danh."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-rail">
          <table className="bang-the-di-dong min-w-full text-left text-sm">
            <thead className="bg-case text-xs uppercase text-fog">
              <tr>
                <th className="p-4">Chức danh</th>
                {!LaHeThong && <th className="p-4">Phạm vi</th>}
                <th className="p-4">Nhân sự</th>
                <th className="p-4">Lượt phân công</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {DanhSach.map((Muc) => {
                const ChiXem = !LaHeThong && Muc.LaDungChung;
                return (
                  <tr className="border-t border-rail" key={Muc.Id}>
                    <td data-label="Chức danh" className="p-4 font-semibold">
                      {Muc.TenChucDanh}
                    </td>
                    {!LaHeThong && (
                      <td data-label="Phạm vi" className="p-4 text-fog">
                        {Muc.LaDungChung ? "Dùng chung" : "Riêng của đơn vị"}
                      </td>
                    )}
                    <td data-label="Nhân sự" className="p-4 font-mono text-fog">
                      {Muc.SoNguoiDung}
                    </td>
                    <td
                      data-label="Lượt phân công"
                      className="p-4 font-mono text-fog"
                    >
                      {Muc.SoLanPhanCong}
                    </td>
                    <td data-label="Trạng thái" className="p-4">
                      {ChiXem ? (
                        <span className="text-fog">
                          {Muc.DangSuDung ? "Đang sử dụng" : "Ngừng sử dụng"}
                        </span>
                      ) : (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Muc.DangSuDung}
                            disabled={DangXuLy}
                            onChange={(SuKien) =>
                              void ThucHien(
                                () =>
                                  CapNhatChucDanh(Muc.Id, {
                                    DangSuDung: SuKien.target.checked,
                                  }),
                                SuKien.target.checked
                                  ? "Đã dùng lại chức danh."
                                  : "Đã ngừng sử dụng chức danh.",
                              )
                            }
                          />
                          {Muc.DangSuDung ? "Đang sử dụng" : "Ngừng sử dụng"}
                        </label>
                      )}
                    </td>
                    <td data-label="Thao tác" className="p-4">
                      {ChiXem ? (
                        <p className="text-right text-xs text-fog">Chỉ xem</p>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="grid size-9 place-items-center rounded border border-rail text-fog"
                            aria-label={`Đổi tên ${Muc.TenChucDanh}`}
                            disabled={DangXuLy}
                            onClick={() =>
                              SetDangSua({
                                Id: Muc.Id,
                                TenChucDanh: Muc.TenChucDanh,
                              })
                            }
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="grid size-9 place-items-center rounded border border-rail text-tally"
                            aria-label={`Xóa ${Muc.TenChucDanh}`}
                            disabled={DangXuLy}
                            onClick={() => SetCanXoa(Muc)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {DangSua && (
        <HopThoaiBieuMau
          TieuDe={DangSua.Id ? "Đổi tên chức danh" : "Thêm chức danh"}
          DangXuLy={DangXuLy}
          OnDong={() => SetDangSua(null)}
        >
          <form
            className="mt-5 grid gap-4"
            onSubmit={async (SuKien) => {
              SuKien.preventDefault();
              const Id = DangSua.Id;
              const ThanhCong = await ThucHien(
                () =>
                  Id
                    ? CapNhatChucDanh(Id, { TenChucDanh: DangSua.TenChucDanh })
                    : TaoChucDanh(DangSua.TenChucDanh),
                Id ? "Đã đổi tên chức danh." : "Đã thêm chức danh.",
              );
              if (ThanhCong) SetDangSua(null);
            }}
          >
            <label>
              <span className="mb-2 block text-sm">Tên chức danh *</span>
              <input
                className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                required
                minLength={2}
                maxLength={100}
                value={DangSua.TenChucDanh}
                onChange={(SuKien) =>
                  SetDangSua({ ...DangSua, TenChucDanh: SuKien.target.value })
                }
              />
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="rounded border border-rail px-4 text-sm"
                onClick={() => SetDangSua(null)}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={DangXuLy}
                className="rounded bg-tally px-4 text-sm font-semibold"
              >
                {DangXuLy ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </form>
        </HopThoaiBieuMau>
      )}
      {CanXoa && (
        <HopThoaiXacNhan
          TieuDe="Xóa chức danh"
          MoTa={
            <>
              Chức danh <strong>{CanXoa.TenChucDanh}</strong> sẽ bị xóa. Chức
              danh còn nhân sự, đang được yêu cầu trong ca quay hoặc đã có trong
              lịch sử phân công chỉ có thể ngừng sử dụng.
            </>
          }
          NhanXacNhan="Xóa chức danh"
          DangXuLy={DangXuLy}
          OnHuy={() => SetCanXoa(null)}
          OnXacNhan={async () => {
            const Id = CanXoa.Id;
            if (await ThucHien(() => XoaChucDanh(Id), "Đã xóa chức danh."))
              SetCanXoa(null);
          }}
        />
      )}
    </section>
  );
}
