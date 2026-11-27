import { useEffect, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HopThoaiBieuMau } from "../Components/HopThoaiBieuMau";
import { HopThoaiXacNhan } from "../Components/HopThoaiXacNhan";
import { useXacThuc } from "../Contexts/XacThucContext";
import {
  CapNhatNhomQuyen,
  LayDanhSachNhomQuyen,
  TaoNhomQuyen,
  XoaNhomQuyen,
} from "../Services/NhomQuyenService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type { DanhSachNhomQuyen, NhomQuyen } from "../Types/NhomQuyen";
import { NutThemNhanh } from "../Components/NutThemNhanh";

// Vận hành kho toàn đơn vị luôn đi kèm quyền xuất, nhập kho cơ bản.
function DoiQuyen(DanhSach: string[], MaQuyen: string, Chon: boolean) {
  if (!Chon)
    return DanhSach.filter(
      (QuyenCu) =>
        QuyenCu !== MaQuyen &&
        !(
          MaQuyen === "VanHanhKho.QuanLy" && QuyenCu === "VanHanhKho.ToanDonVi"
        ),
    );
  const KetQua = new Set([...DanhSach, MaQuyen]);
  if (MaQuyen === "VanHanhKho.ToanDonVi") KetQua.add("VanHanhKho.QuanLy");
  return [...KetQua];
}

function CungQuyen(Trai: string[], Phai: string[]) {
  return (
    Trai.length === Phai.length && Trai.every((Quyen) => Phai.includes(Quyen))
  );
}

interface ThongTinNhom {
  Id: string | null;
  TenNhom: string;
  MoTa: string;
}

export function QuanLyNhomQuyen() {
  const { NguoiDung, LamMoiNguoiDung } = useXacThuc();
  const [DuLieu, SetDuLieu] = useState<DanhSachNhomQuyen>();
  const [CauHinh, SetCauHinh] = useState<Record<string, string[]>>({});
  const [Loi, SetLoi] = useState("");
  const [DangLuu, SetDangLuu] = useState(false);
  const [DangSua, SetDangSua] = useState<ThongTinNhom | null>(null);
  const [CanXoa, SetCanXoa] = useState<NhomQuyen | null>(null);

  async function Tai() {
    try {
      const KetQua = await LayDanhSachNhomQuyen();
      SetDuLieu(KetQua);
      SetCauHinh(
        Object.fromEntries(
          KetQua.DanhSach.map((Nhom) => [Nhom.Id, Nhom.Quyen ?? []]),
        ),
      );
    } catch (LoiTai) {
      SetLoi(LayThongBaoLoi(LoiTai));
    }
  }
  useEffect(() => {
    void Tai();
  }, []);

  if (!NguoiDung?.QuanTriDonVi)
    return <p role="alert">Bạn không có quyền quản lý nhóm quyền.</p>;

  const DanhSachNhom = DuLieu?.DanhSach ?? [];
  const NhomDaDoi = DanhSachNhom.filter(
    (Nhom) => !CungQuyen(CauHinh[Nhom.Id] ?? [], Nhom.Quyen ?? []),
  );

  async function LuuQuyen() {
    SetDangLuu(true);
    SetLoi("");
    try {
      for (const Nhom of NhomDaDoi)
        await CapNhatNhomQuyen(Nhom.Id, {
          TenNhom: Nhom.TenNhom,
          MoTa: Nhom.MoTa,
          Quyen: CauHinh[Nhom.Id] ?? [],
        });
      await Tai();
      await LamMoiNguoiDung();
      toast.success("Đã lưu quyền của nhóm.");
    } catch (LoiLuu) {
      SetLoi(LayThongBaoLoi(LoiLuu));
    } finally {
      SetDangLuu(false);
    }
  }

  async function LuuThongTin() {
    if (!DangSua) return;
    SetDangLuu(true);
    try {
      const NhomCu = DanhSachNhom.find((Nhom) => Nhom.Id === DangSua.Id);
      const DuLieuGui = {
        TenNhom: DangSua.TenNhom,
        MoTa: DangSua.MoTa.trim() || null,
      };
      if (NhomCu)
        await CapNhatNhomQuyen(NhomCu.Id, {
          ...DuLieuGui,
          Quyen: NhomCu.Quyen ?? [],
        });
      else await TaoNhomQuyen({ ...DuLieuGui, Quyen: [] });
      toast.success(NhomCu ? "Đã cập nhật nhóm quyền." : "Đã thêm nhóm quyền.");
      SetDangSua(null);
      await Tai();
    } catch (LoiLuu) {
      toast.error(LayThongBaoLoi(LoiLuu));
    } finally {
      SetDangLuu(false);
    }
  }

  async function XacNhanXoa() {
    if (!CanXoa) return;
    SetDangLuu(true);
    try {
      await XoaNhomQuyen(CanXoa.Id);
      toast.success("Đã xóa nhóm quyền.");
      SetCanXoa(null);
      await Tai();
    } catch (LoiXoa) {
      toast.error(LayThongBaoLoi(LoiXoa));
    } finally {
      SetDangLuu(false);
    }
  }

  return (
    <section>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Nhóm quyền</h1>
          <p className="my-4 max-w-3xl text-sm text-fog">
            Mỗi nhân sự thuộc một nhóm quyền và nhận đúng các chức năng được
            chọn cho nhóm đó. Người dùng luôn được xem hồ sơ của mình và ca quay
            được phân công. Quản trị viên đơn vị luôn có toàn bộ quyền. Khi
            quyền của nhóm thay đổi, thành viên nhóm cần đăng nhập lại.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NutThemNhanh Loai="NhomQuyen" OnThanhCong={() => void Tai()} />
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold"
            onClick={() => SetDangSua({ Id: null, TenNhom: "", MoTa: "" })}
          >
            <Plus size={17} />
            Thêm nhóm quyền
          </button>
        </div>
      </header>
      {Loi && (
        <p role="alert" className="my-4 text-tally">
          {Loi}
        </p>
      )}
      {!DuLieu?.BangQuyen ? (
        !Loi && <p>Đang tải bảng quyền…</p>
      ) : (
        <form
          onSubmit={(SuKien) => {
            SuKien.preventDefault();
            void LuuQuyen();
          }}
        >
          <div className="overflow-x-auto rounded border border-rail">
            <table className="w-full text-left text-sm">
              <thead className="bg-case">
                <tr>
                  <th className="p-3 align-bottom">Chức năng / quyền</th>
                  {DanhSachNhom.map((Nhom) => (
                    <th className="min-w-40 p-3 align-bottom" key={Nhom.Id}>
                      <span className="block">{Nhom.TenNhom}</span>
                      <span className="block text-xs font-normal text-fog">
                        {Nhom.SoThanhVien} thành viên
                        {Nhom.LaMau ? " · Nhóm mẫu" : ""}
                      </span>
                      <span className="mt-2 flex gap-1">
                        <button
                          type="button"
                          className="grid size-8 place-items-center rounded border border-rail text-fog"
                          aria-label={`Sửa thông tin ${Nhom.TenNhom}`}
                          title="Sửa tên và mô tả"
                          disabled={DangLuu}
                          onClick={() =>
                            SetDangSua({
                              Id: Nhom.Id,
                              TenNhom: Nhom.TenNhom,
                              MoTa: Nhom.MoTa ?? "",
                            })
                          }
                        >
                          <Pencil size={14} />
                        </button>
                        {Nhom.QuyenMau && (
                          <button
                            type="button"
                            className="grid size-8 place-items-center rounded border border-rail text-fog"
                            aria-label={`Khôi phục theo mẫu cho ${Nhom.TenNhom}`}
                            title="Khôi phục theo mẫu"
                            disabled={DangLuu}
                            onClick={() =>
                              SetCauHinh({
                                ...CauHinh,
                                [Nhom.Id]: [...(Nhom.QuyenMau ?? [])],
                              })
                            }
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="grid size-8 place-items-center rounded border border-rail text-tally"
                          aria-label={`Xóa ${Nhom.TenNhom}`}
                          title="Xóa nhóm quyền"
                          disabled={DangLuu}
                          onClick={() => SetCanXoa(Nhom)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(DuLieu.BangQuyen).flatMap(([Nhom, Quyen]) =>
                  Object.entries(Quyen.ThaoTac).map(([ThaoTac, Nhan]) => {
                    const MaQuyen = `${Nhom}.${ThaoTac}`;
                    return (
                      <tr key={MaQuyen} className="border-t border-rail">
                        <th className="p-3 font-normal">
                          {Quyen.Ten} · {Nhan}
                        </th>
                        {DanhSachNhom.map((NhomQuyen) => (
                          <td className="p-3" key={NhomQuyen.Id}>
                            <input
                              type="checkbox"
                              aria-label={`${NhomQuyen.TenNhom}: ${Quyen.Ten}, ${Nhan}`}
                              disabled={DangLuu}
                              checked={
                                CauHinh[NhomQuyen.Id]?.includes(MaQuyen) ??
                                false
                              }
                              onChange={(SuKien) =>
                                SetCauHinh({
                                  ...CauHinh,
                                  [NhomQuyen.Id]: DoiQuyen(
                                    CauHinh[NhomQuyen.Id] ?? [],
                                    MaQuyen,
                                    SuKien.target.checked,
                                  ),
                                })
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              disabled={DangLuu || !NhomDaDoi.length}
              className="rounded border border-rail px-4"
              onClick={() => {
                SetCauHinh(
                  Object.fromEntries(
                    DanhSachNhom.map((Nhom) => [Nhom.Id, Nhom.Quyen ?? []]),
                  ),
                );
                SetLoi("");
              }}
            >
              Hủy thay đổi
            </button>
            <button
              type="submit"
              disabled={DangLuu || !NhomDaDoi.length}
              className="rounded bg-tally px-4"
            >
              {DangLuu ? "Đang lưu…" : "Lưu quyền"}
            </button>
          </div>
        </form>
      )}
      {DangSua && (
        <HopThoaiBieuMau
          TieuDe={DangSua.Id ? "Sửa nhóm quyền" : "Thêm nhóm quyền"}
          DangXuLy={DangLuu}
          OnDong={() => SetDangSua(null)}
        >
          <form
            className="mt-5 grid gap-4"
            onSubmit={(SuKien) => {
              SuKien.preventDefault();
              void LuuThongTin();
            }}
          >
            <label>
              <span className="mb-2 block text-sm">Tên nhóm quyền *</span>
              <input
                className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                required
                minLength={2}
                maxLength={100}
                value={DangSua.TenNhom}
                onChange={(SuKien) =>
                  SetDangSua({ ...DangSua, TenNhom: SuKien.target.value })
                }
              />
            </label>
            <label>
              <span className="mb-2 block text-sm">Mô tả</span>
              <textarea
                className="min-h-24 w-full rounded border border-rail bg-case-2 p-3"
                maxLength={500}
                value={DangSua.MoTa}
                onChange={(SuKien) =>
                  SetDangSua({ ...DangSua, MoTa: SuKien.target.value })
                }
              />
            </label>
            {!DangSua.Id && (
              <p className="text-sm text-fog">
                Nhóm mới chưa có quyền nào; chọn quyền trong bảng sau khi tạo.
              </p>
            )}
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
                disabled={DangLuu}
                className="rounded bg-tally px-4 text-sm font-semibold"
              >
                {DangLuu ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </form>
        </HopThoaiBieuMau>
      )}
      {CanXoa && (
        <HopThoaiXacNhan
          TieuDe="Xóa nhóm quyền"
          MoTa={
            <>
              Nhóm quyền <strong>{CanXoa.TenNhom}</strong> sẽ bị xóa. Chỉ xóa
              được khi nhóm không còn thành viên.
            </>
          }
          NhanXacNhan="Xóa nhóm quyền"
          DangXuLy={DangLuu}
          OnHuy={() => SetCanXoa(null)}
          OnXacNhan={() => void XacNhanXoa()}
        />
      )}
    </section>
  );
}
