import { QuanLyThongTinBoSung } from "../Components/QuanLyThongTinBoSung";
import { CoQuyen as KiemTraQuyen } from "../Services/QuyenService";
import { HopThoaiDatLaiMatKhau } from "../Components/HopThoaiDatLaiMatKhau";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HopThoaiXacNhan } from "../Components/HopThoaiXacNhan";
import { HopThoaiBieuMau } from "../Components/HopThoaiBieuMau";
import { useXacThuc } from "../Contexts/XacThucContext";
import {
  CapNhatNhanSu,
  LayDanhSachNhanSu,
  TaoNhanSu,
  XoaNhanSu,
} from "../Services/NhanSuService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import {
  LayDanhSachChucDanh,
  LayDanhSachNhomQuyen,
} from "../Services/NhomQuyenService";
import type { DuLieuNhanSu, NhanSu } from "../Types/NhanSu";
import type { ChucDanh, NhomQuyen } from "../Types/NhomQuyen";
import { SchemaNhanSu } from "../Schemas/BieuMau";
import type { z } from "zod";
import { NutThemNhanh } from "../Components/NutThemNhanh";

const MacDinh: DuLieuNhanSu = {
  TenDangNhap: "",
  HoTen: "",
  Email: "",
  SoDienThoai: "",
  NhomQuyenId: "",
  ChucDanhId: "",
  MatKhau: "",
};
export function QuanLyNhanSu() {
  const { NguoiDung: NguoiDung, LamMoiNguoiDung } = useXacThuc();
  const CoQuyen = [
    "NhanSu.Tao",
    "NhanSu.Sua",
    "NhanSu.Xoa",
    "NhanSu.DatLaiMatKhau",
  ].some((Quyen) => KiemTraQuyen(NguoiDung, Quyen));
  const [CanDatLai, SetCanDatLai] = useState<NhanSu | null>(null);
  const [DanhSach, SetDanhSach] = useState<NhanSu[]>([]);
  const [TimKiem, SetTimKiem] = useState("");
  const [LocNhomQuyenId, SetLocNhomQuyenId] = useState("");
  const [LocChucDanhId, SetLocChucDanhId] = useState("");
  const [DanhSachNhomQuyen, SetDanhSachNhomQuyen] = useState<NhomQuyen[]>([]);
  const [DanhSachChucDanh, SetDanhSachChucDanh] = useState<ChucDanh[]>([]);
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");
  const [DangSua, SetDangSua] = useState<NhanSu | null>(null);
  const [DuLieu, SetDuLieu] = useState<DuLieuNhanSu>(MacDinh);
  const [CanXoa, SetCanXoa] = useState<NhanSu | null>(null);
  const [DangGui, SetDangGui] = useState(false);
  const {
    handleSubmit: HandleSubmit,
    reset: Reset,
    formState: { errors: Errors },
  } = useForm<z.infer<ReturnType<typeof SchemaNhanSu>>>({
    resolver: zodResolver(SchemaNhanSu(!DangSua?.Id)),
    defaultValues: MacDinh,
  });
  async function Tai() {
    SetDangTai(true);
    SetLoi("");
    try {
      SetDanhSach(
        await LayDanhSachNhanSu({
          TimKiem: TimKiem || undefined,
          NhomQuyenId: LocNhomQuyenId || undefined,
          ChucDanhId: LocChucDanhId || undefined,
        }),
      );
    } catch (E) {
      SetLoi(LayThongBaoLoi(E));
    } finally {
      SetDangTai(false);
    }
  }
  useEffect(() => {
    void Tai();
  }, [LocNhomQuyenId, LocChucDanhId]);
  useEffect(() => {
    void Promise.all([LayDanhSachNhomQuyen(), LayDanhSachChucDanh()])
      .then(([NhomQuyen, ChucDanh]) => {
        SetDanhSachNhomQuyen(NhomQuyen.DanhSach);
        SetDanhSachChucDanh(ChucDanh);
      })
      .catch((LoiTai: unknown) => SetLoi(LayThongBaoLoi(LoiTai)));
  }, []);
  // Chức danh ngừng sử dụng chỉ hiện khi đang là chức danh hiện tại của nhân sự được sửa.
  const ChucDanhChon = DanhSachChucDanh.filter(
    (Muc) => Muc.DangSuDung || Muc.Id === DangSua?.ChucDanhId,
  );
  function MoTao() {
    SetDangSua({} as NhanSu);
    SetDuLieu(MacDinh);
    Reset(MacDinh);
  }
  function MoSua(N: NhanSu) {
    SetDangSua(N);
    const DuLieuMoi = {
      TenDangNhap: N.TenDangNhap,
      HoTen: N.HoTen,
      Email: N.Email,
      SoDienThoai: N.SoDienThoai ?? "",
      NhomQuyenId: N.NhomQuyenId ?? "",
      ChucDanhId: N.ChucDanhId ?? "",
      ...(NguoiDung?.QuanTriDonVi
        ? { QuanTriDonVi: N.QuanTriDonVi ?? false }
        : {}),
      MatKhau: "",
    };
    SetDuLieu(DuLieuMoi);
    Reset(DuLieuMoi);
  }
  async function Luu() {
    SetDangGui(true);
    try {
      const { MatKhau, ...ThongTin } = DuLieu;
      const Gui = DangSua?.Id
        ? ThongTin
        : { ...ThongTin, MatKhau: MatKhau || undefined };
      if (DangSua?.Id) await CapNhatNhanSu(DangSua.Id, Gui);
      else await TaoNhanSu(Gui);
      toast.success(
        DangSua?.Id
          ? "Cập nhật thông tin thành công."
          : "Tạo nhân sự thành công.",
      );
      SetDangSua(null);
      await LamMoiNguoiDung();
      await Tai();
    } catch (Er) {
      toast.error(LayThongBaoLoi(Er));
    } finally {
      SetDangGui(false);
    }
  }
  async function XacNhan() {
    if (!CanXoa) return;
    SetDangGui(true);
    try {
      await XoaNhanSu(CanXoa.Id);
      toast.success("Đã xóa nhân sự.");
      SetCanXoa(null);
      await Tai();
    } catch (E) {
      toast.error(LayThongBaoLoi(E));
    } finally {
      SetDangGui(false);
    }
  }
  return (
    <section>
      {CanDatLai && (
        <HopThoaiDatLaiMatKhau
          NguoiDungId={CanDatLai.Id}
          HoTen={CanDatLai.HoTen}
          OnDong={() => SetCanDatLai(null)}
        />
      )}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-blueprint">
            Vận hành sản xuất
          </p>
          <h1 className="mt-2 font-serif text-2xl md:text-3xl">
            Quản lý nhân sự
          </h1>
          <p className="mt-2 text-sm text-fog">
            Quản lý tài khoản, nhóm quyền và chức danh của nhân sự trong đơn vị.
          </p>
        </div>
        {KiemTraQuyen(NguoiDung, "NhanSu.Tao") && (
          <div className="flex flex-wrap gap-2">
            <NutThemNhanh Loai="NhanSu" OnThanhCong={() => void Tai()} />
            <button
              className="flex min-h-11 items-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold"
              onClick={MoTao}
              type="button"
            >
              <Plus size={17} />
              Thêm nhân sự
            </button>
          </div>
        )}
      </header>
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          className="h-11 w-full flex-none sm:w-auto sm:min-w-56 sm:flex-1 rounded border border-rail bg-case-2 px-3"
          placeholder="Tìm kiếm nhân sự"
          value={TimKiem}
          onChange={(E) => SetTimKiem(E.target.value)}
          onKeyDown={(E) => {
            if (E.key === "Enter") void Tai();
          }}
        />
        <select
          aria-label="Lọc theo nhóm quyền"
          className="h-11 rounded border border-rail bg-case-2 px-3"
          value={LocNhomQuyenId}
          onChange={(E) => SetLocNhomQuyenId(E.target.value)}
        >
          <option value="">Tất cả nhóm quyền</option>
          {DanhSachNhomQuyen.map((Nhom) => (
            <option key={Nhom.Id} value={Nhom.Id}>
              {Nhom.TenNhom}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc theo chức danh"
          className="h-11 rounded border border-rail bg-case-2 px-3"
          value={LocChucDanhId}
          onChange={(E) => SetLocChucDanhId(E.target.value)}
        >
          <option value="">Tất cả chức danh</option>
          {DanhSachChucDanh.map((Muc) => (
            <option key={Muc.Id} value={Muc.Id}>
              {Muc.TenChucDanh}
            </option>
          ))}
        </select>
        <button
          className="rounded border border-rail px-4 text-sm text-fog"
          onClick={() => void Tai()}
          type="button"
        >
          Tìm kiếm
        </button>
      </div>
      {DangTai ? (
        <p className="py-12 text-center text-fog">Đang tải nhân sự…</p>
      ) : Loi ? (
        <div className="rounded border border-tally/60 bg-tally/10 p-4 text-sm">
          {Loi}
        </div>
      ) : DanhSach.length === 0 ? (
        <div className="rounded border border-rail bg-case p-8 text-center text-fog">
          Chưa có nhân sự phù hợp.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-rail">
          <table className="bang-the-di-dong min-w-full text-left text-sm">
            <thead className="bg-case text-xs uppercase text-fog">
              <tr>
                <th className="p-4">Nhân sự</th>
                <th className="p-4">Liên hệ</th>
                <th className="p-4">Chức danh</th>
                <th className="p-4">Nhóm quyền</th>
                <th className="p-4">Ca quay</th>
                {CoQuyen && <th className="p-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {DanhSach.map((N) => (
                <tr className="border-t border-rail" key={N.Id}>
                  <td data-label="Nhân sự" className="p-4">
                    <p className="font-semibold">{N.HoTen}</p>
                    <p className="mt-1 font-mono text-xs text-fog">
                      @{N.TenDangNhap}
                    </p>
                  </td>
                  <td data-label="Liên hệ" className="p-4 text-fog">
                    <p>{N.Email}</p>
                    <p>{N.SoDienThoai ?? "—"}</p>
                  </td>
                  <td data-label="Chức danh" className="p-4">
                    {N.ChucDanh?.TenChucDanh ?? "Chưa có chức danh"}
                  </td>
                  <td data-label="Nhóm quyền" className="p-4">
                    <span className="rounded bg-blueprint/20 px-2 py-1 text-xs text-blueprint">
                      {N.QuanTriDonVi
                        ? "Quản trị đơn vị · Toàn quyền"
                        : (N.NhomQuyen?.TenNhom ?? "Chưa có nhóm quyền")}
                    </span>
                  </td>
                  <td data-label="Ca quay" className="p-4 font-mono text-fog">
                    {N._count.CaQuayPhuTrach + N._count.CaQuayThamGia}
                  </td>
                  {CoQuyen && (
                    <td data-label="Thao tác" className="p-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {KiemTraQuyen(NguoiDung, "NhanSu.Sua") &&
                          (!N.QuanTriDonVi || NguoiDung?.QuanTriDonVi) && (
                            <QuanLyThongTinBoSung
                              Nhom="nhan-su"
                              Id={N.Id}
                              Ten={N.HoTen}
                            />
                          )}
                        {KiemTraQuyen(NguoiDung, "NhanSu.Sua") &&
                          (!N.QuanTriDonVi || NguoiDung?.QuanTriDonVi) && (
                            <button
                              className="grid size-9 place-items-center rounded border border-rail text-fog"
                              aria-label={`Chỉnh sửa ${N.HoTen}`}
                              onClick={() => MoSua(N)}
                              type="button"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                        {KiemTraQuyen(NguoiDung, "NhanSu.DatLaiMatKhau") &&
                          (!N.QuanTriDonVi || NguoiDung?.QuanTriDonVi) && (
                            <button
                              type="button"
                              className="rounded border border-rail px-3 text-sm"
                              onClick={() => SetCanDatLai(N)}
                            >
                              Đặt lại mật khẩu
                            </button>
                          )}
                        {KiemTraQuyen(NguoiDung, "NhanSu.Xoa") &&
                          (!N.QuanTriDonVi || NguoiDung?.QuanTriDonVi) && (
                            <button
                              className="grid size-9 place-items-center rounded border border-rail text-tally"
                              aria-label={`Xóa ${N.HoTen}`}
                              onClick={() => SetCanXoa(N)}
                              type="button"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {DangSua && (
        <HopThoaiBieuMau
          DangXuLy={DangGui}
          OnDong={() => SetDangSua(null)}
          TieuDe={DangSua.Id ? "Chỉnh sửa nhân sự" : "Thêm nhân sự"}
        >
          <form className="mt-5" onSubmit={HandleSubmit(Luu)}>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["HoTen", "Họ và tên", "text"],
                  ["TenDangNhap", "Tên đăng nhập", "text"],
                  ["Email", "Email", "email"],
                  ["SoDienThoai", "Số điện thoại", "tel"],
                ] as const
              ).map(([T, N, K]) => (
                <label key={T}>
                  <span className="mb-2 block text-sm">
                    {N}
                    {" *"}
                  </span>
                  <input
                    className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                    required
                    type={K}
                    value={DuLieu[T] ?? ""}
                    onChange={(E) => {
                      const DuLieuMoi = {
                        ...DuLieu,
                        [T]: E.target.value,
                      };
                      SetDuLieu(DuLieuMoi);
                      Reset(DuLieuMoi);
                    }}
                  />
                  {Errors[T] && (
                    <p className="mt-1 text-sm text-tally">
                      {Errors[T]?.message}
                    </p>
                  )}
                </label>
              ))}
              <label>
                <span className="mb-2 block text-sm">
                  Nhóm quyền{DuLieu.QuanTriDonVi ? "" : " *"}
                </span>
                <select
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3 disabled:opacity-60"
                  required={!DuLieu.QuanTriDonVi}
                  disabled={DuLieu.QuanTriDonVi}
                  value={DuLieu.QuanTriDonVi ? "" : DuLieu.NhomQuyenId}
                  onChange={(E) => {
                    const DuLieuMoi = {
                      ...DuLieu,
                      NhomQuyenId: E.target.value,
                    };
                    SetDuLieu(DuLieuMoi);
                    Reset(DuLieuMoi);
                  }}
                >
                  <option value="">
                    {DuLieu.QuanTriDonVi
                      ? "Toàn quyền, không thuộc nhóm"
                      : "Chọn nhóm quyền"}
                  </option>
                  {DanhSachNhomQuyen.map((Nhom) => (
                    <option key={Nhom.Id} value={Nhom.Id}>
                      {Nhom.TenNhom}
                    </option>
                  ))}
                </select>
                {Errors.NhomQuyenId && (
                  <p className="mt-1 text-sm text-tally">
                    {Errors.NhomQuyenId.message}
                  </p>
                )}
              </label>
              <label>
                <span className="mb-2 block text-sm">
                  Chức danh{DuLieu.QuanTriDonVi ? "" : " *"}
                </span>
                <select
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  required={!DuLieu.QuanTriDonVi}
                  value={DuLieu.ChucDanhId}
                  onChange={(E) => {
                    const DuLieuMoi = {
                      ...DuLieu,
                      ChucDanhId: E.target.value,
                    };
                    SetDuLieu(DuLieuMoi);
                    Reset(DuLieuMoi);
                  }}
                >
                  <option value="">
                    {DuLieu.QuanTriDonVi
                      ? "Không gán chức danh"
                      : "Chọn chức danh"}
                  </option>
                  {ChucDanhChon.map((Muc) => (
                    <option key={Muc.Id} value={Muc.Id}>
                      {Muc.TenChucDanh}
                      {Muc.DangSuDung ? "" : " (ngừng sử dụng)"}
                    </option>
                  ))}
                </select>
                {Errors.ChucDanhId && (
                  <p className="mt-1 text-sm text-tally">
                    {Errors.ChucDanhId.message}
                  </p>
                )}
              </label>
              {NguoiDung?.QuanTriDonVi && (
                <label className="flex min-h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={DuLieu.QuanTriDonVi ?? false}
                    onChange={(SuKien) => {
                      const DuLieuMoi = {
                        ...DuLieu,
                        QuanTriDonVi: SuKien.target.checked,
                      };
                      SetDuLieu(DuLieuMoi);
                      Reset(DuLieuMoi);
                    }}
                  />
                  Quản trị viên đơn vị
                </label>
              )}
              {!DangSua.Id && (
                <label>
                  <span className="mb-2 block text-sm">Mật khẩu *</span>
                  <input
                    className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                    minLength={6}
                    type="password"
                    value={DuLieu.MatKhau ?? ""}
                    onChange={(E) => {
                      const DuLieuMoi = {
                        ...DuLieu,
                        MatKhau: E.target.value,
                      };
                      SetDuLieu(DuLieuMoi);
                      Reset(DuLieuMoi);
                    }}
                  />
                </label>
              )}
              {Errors.MatKhau && (
                <p className="text-sm text-tally">{Errors.MatKhau.message}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded border border-rail px-4 text-sm"
                onClick={() => SetDangSua(null)}
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
      {CanXoa && (
        <HopThoaiXacNhan
          TieuDe="Xóa nhân sự"
          MoTa={
            <>
              Nhân sự <strong>{CanXoa.HoTen}</strong> sẽ bị xóa vĩnh viễn nếu
              không còn dữ liệu nghiệp vụ liên quan.
            </>
          }
          NhanXacNhan="Xóa nhân sự"
          DangXuLy={DangGui}
          OnHuy={() => SetCanXoa(null)}
          OnXacNhan={() => void XacNhan()}
        />
      )}
    </section>
  );
}
