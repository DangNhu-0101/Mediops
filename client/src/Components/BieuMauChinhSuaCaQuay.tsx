import { BieuMauYeuCauTaiNguyen } from "./BieuMauYeuCauTaiNguyen";
import type { YeuCauTaiNguyen } from "../Types/DuLieuNhung";
import { useEffect, useState } from "react";
import {
  BoSungNhomTheoYeuCau,
  PhanCongThietBiTheoDanhMuc,
  TaoNhomTuThietBi,
  type NhomThietBi,
} from "./PhanCongThietBiTheoDanhMuc";
import { toast } from "sonner";
import { HopThoaiBieuMau } from "./HopThoaiBieuMau";
import {
  PhanCongTheoChucVu,
  TaoNhomTuPhanCong,
  type NhanSuLuaChon,
  type NhomPhanCong,
  type ChucDanhPhanCong,
} from "./PhanCongTheoChucVu";
import { Api } from "../Services/Api";
import {
  CapNhatCaQuay,
  LayPhanHoiXungDotCaQuay,
} from "../Services/CaQuayService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { LayDanhSachPhongStudio } from "../Services/PhongStudioService";
import { LayThietBiLuaChon } from "../Services/ThietBiService";
import type { ChiTietCaQuay, TrangThaiCaQuay } from "../Types/CaQuay";
import type { PhongStudio } from "../Types/PhongStudio";
import type { ThietBiLuaChon } from "../Types/ThietBi";

const NhanTrangThai: Record<TrangThaiCaQuay, string> = {
  DU_THAO: "Dự thảo",
  DA_DUYET: "Đã duyệt",
  DANG_DIEN_RA: "Đang diễn ra",
  HOAN_THANH: "Hoàn thành",
  DA_HUY: "Đã hủy",
};
function NgayGio(GiaTri: string) {
  const Ngay = new Date(GiaTri);
  return new Date(Ngay.getTime() - Ngay.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export function BieuMauChinhSuaCaQuay({
  CaQuay,
  OnDong,
  OnDaLuu,
}: {
  CaQuay: ChiTietCaQuay;
  OnDong: () => void;
  OnDaLuu: () => Promise<void>;
}) {
  const [DuLieu, SetDuLieu] = useState({
    TieuDe: CaQuay.TieuDe,
    ThoiGianBatDau: NgayGio(CaQuay.ThoiGianBatDau),
    ThoiGianKetThuc: NgayGio(CaQuay.ThoiGianKetThuc),
    PhongStudioId: CaQuay.PhongStudioId ?? "",
    GhiChuDiaDiem: CaQuay.GhiChuDiaDiem ?? "",
    GhiChu: CaQuay.GhiChu ?? "",
    TrangThai: CaQuay.TrangThai,
    MucDoUuTien: CaQuay.MucDoUuTien,
    CoTheDoiLich: CaQuay.CoTheDoiLich,
    ThoiGianChuanBiPhut: CaQuay.ThoiGianChuanBiPhut,
    ThoiGianThuHoiPhut: CaQuay.ThoiGianThuHoiPhut,
  });
  const [NguoiPhuTrachId, SetNguoiPhuTrachId] = useState(
    CaQuay.NguoiPhuTrachId,
  );
  const [Nhom, SetNhom] = useState<NhomPhanCong[]>(() =>
    TaoNhomTuPhanCong(CaQuay.NguoiPhuTrachId, CaQuay.DanhSachNhanSu),
  );
  const [NhomThietBi, SetNhomThietBi] = useState<NhomThietBi[]>([]);
  const [YeuCau, SetYeuCau] = useState<YeuCauTaiNguyen[]>(
    CaQuay.CacYeuCauTaiNguyen ?? [],
  );
  const [ChucDanh, SetChucDanh] = useState<ChucDanhPhanCong[]>([]);
  const [NhanSu, SetNhanSu] = useState<NhanSuLuaChon[]>([]);
  const [Studio, SetStudio] = useState<PhongStudio[]>([]);
  const [ThietBi, SetThietBi] = useState<ThietBiLuaChon[]>([]);
  const [DangTai, SetDangTai] = useState(true);
  const [DangLuu, SetDangLuu] = useState(false);
  const [Loi, SetLoi] = useState("");
  useEffect(() => {
    void Promise.all([
      Api.get<NhanSuLuaChon[]>("/nhan-su/lua-chon"),
      LayDanhSachPhongStudio({}),
      LayThietBiLuaChon(),
      Api.get<ChucDanhPhanCong[]>("/nhan-su/chuc-vu-phan-cong"),
    ])
      .then(([Nguoi, Phong, ThietBiMoi, ChucDanhMoi]) => {
        SetChucDanh(ChucDanhMoi.data);
        if (!CaQuay.DanhSachNhanSu.length)
          SetNhom((Cu) => [
            ...Cu,
            ...ChucDanhMoi.data
              .slice(0, 2)
              .filter(
                (Muc) =>
                  !Cu.some((NhomCu) => NhomCu.TenChucDanh === Muc.TenChucDanh),
              )
              .map((Muc) => ({
                TenChucDanh: Muc.TenChucDanh,
                NguoiDungId: [],
              })),
          ]);
        SetNhanSu(Nguoi.data);
        SetStudio(Phong);
        SetThietBi(ThietBiMoi);
        SetNhomThietBi(
          TaoNhomTuThietBi(
            CaQuay.DanhSachThietBi.map((Muc) => Muc.ThietBiId),
            ThietBiMoi,
          ),
        );
      })
      .catch((LoiTai: unknown) => SetLoi(LayThongBaoLoi(LoiTai)))
      .finally(() => SetDangTai(false));
  }, []);
  // Danh mục có trong yêu cầu thiết bị luôn có nhóm phân công tương ứng.
  useEffect(() => {
    if (!ThietBi.length) return;
    SetNhomThietBi((Cu) => BoSungNhomTheoYeuCau(Cu, ThietBi, YeuCau));
  }, [ThietBi, YeuCau]);
  // Giữ cả phân công không còn trong danh sách lựa chọn để Lưu không vô tình gỡ chúng.
  const ThietBiId = [
    ...new Set([
      ...NhomThietBi.flatMap((Muc) => Muc.ThietBiId),
      ...CaQuay.DanhSachThietBi.map((Muc) => Muc.ThietBiId).filter(
        (Id) => !ThietBi.some((Muc) => Muc.Id === Id),
      ),
    ]),
  ];
  return (
    <HopThoaiBieuMau
      TieuDe="Chỉnh sửa ca quay và phân công"
      KichThuoc="rong"
      DangXuLy={DangLuu}
      OnDong={OnDong}
    >
      <form
        className="mt-5 space-y-5"
        onSubmit={async (SuKien) => {
          SuKien.preventDefault();
          SetLoi("");
          if (!NguoiPhuTrachId) {
            SetLoi("Vui lòng chọn người phụ trách ca.");
            return;
          }
          const DanhSachNhanSu = Nhom.flatMap((Muc) =>
            Muc.NguoiDungId.filter((Id) => Id !== NguoiPhuTrachId).map(
              (NguoiDungId) => ({
                NguoiDungId,
                ChucDanhPhanCong: Muc.TenChucDanh,
              }),
            ),
          );
          if (NguoiPhuTrachId === CaQuay.NguoiPhuTrachId) {
            CaQuay.DanhSachNhanSu.filter(
              (Muc) => Muc.NguoiDungId === NguoiPhuTrachId,
            ).forEach((Muc) =>
              DanhSachNhanSu.push({
                NguoiDungId: Muc.NguoiDungId,
                ChucDanhPhanCong: Muc.ChucDanhPhanCong,
              }),
            );
          }
          SetDangLuu(true);
          try {
            await CapNhatCaQuay(CaQuay.Id, {
              ...DuLieu,
              PhongStudioId: DuLieu.PhongStudioId || null,
              ThoiGianBatDau: new Date(DuLieu.ThoiGianBatDau).toISOString(),
              ThoiGianKetThuc: new Date(DuLieu.ThoiGianKetThuc).toISOString(),
              NguoiPhuTrachId,
              DanhSachNhanSu,
              DanhSachThietBiId: ThietBiId,
              CacYeuCauTaiNguyen: YeuCau,
            });
            toast.success("Đã lưu thông tin ca quay và phân công.");
            await OnDaLuu();
            OnDong();
          } catch (LoiLuu) {
            const XungDot = LayPhanHoiXungDotCaQuay(LoiLuu);
            SetLoi(
              XungDot
                ? `${XungDot.ThongBao} ${XungDot.DanhSachXungDot.map((Muc) => Muc.TenTaiNguyen).join(", ")}`
                : LayThongBaoLoi(LoiLuu),
            );
          } finally {
            SetDangLuu(false);
          }
        }}
      >
        <p className="text-sm text-fog">
          Chỉnh toàn bộ thông tin rồi bấm Lưu một lần. Hủy sẽ bỏ mọi thay đổi
          chưa lưu.
        </p>
        {DangTai && <p role="status">Đang tải các lựa chọn…</p>}
        <fieldset
          disabled={DangLuu || DangTai}
          className="grid gap-4 sm:grid-cols-2"
        >
          {(
            [
              ["TieuDe", "Tên ca quay", "text"],
              ["ThoiGianBatDau", "Bắt đầu", "datetime-local"],
              ["ThoiGianKetThuc", "Kết thúc", "datetime-local"],
              ["GhiChuDiaDiem", "Địa điểm", "text"],
            ] as const
          ).map(([Truong, Nhan, Loai]) => (
            <label key={Truong}>
              <span className="mb-2 block text-sm">{Nhan}</span>
              <input
                className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                type={Loai}
                required={Truong !== "GhiChuDiaDiem"}
                minLength={Truong === "TieuDe" ? 2 : undefined}
                value={DuLieu[Truong]}
                onChange={(SuKien) =>
                  SetDuLieu({ ...DuLieu, [Truong]: SuKien.target.value })
                }
              />
            </label>
          ))}
          <label>
            <span className="mb-2 block text-sm">Phòng quay</span>
            <select
              className="h-11 w-full rounded border border-rail bg-case-2 px-3"
              value={DuLieu.PhongStudioId}
              onChange={(SuKien) =>
                SetDuLieu({ ...DuLieu, PhongStudioId: SuKien.target.value })
              }
            >
              <option value="">Không phân công phòng quay</option>
              {Studio.map((Muc) => (
                <option key={Muc.Id} value={Muc.Id}>
                  {Muc.TenPhong}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-sm">Trạng thái</span>
            <select
              className="h-11 w-full rounded border border-rail bg-case-2 px-3"
              value={DuLieu.TrangThai}
              onChange={(SuKien) =>
                SetDuLieu({
                  ...DuLieu,
                  TrangThai: SuKien.target.value as TrangThaiCaQuay,
                })
              }
            >
              {Object.entries(NhanTrangThai).map(([Ma, Ten]) => (
                <option key={Ma} value={Ma}>
                  {Ten}
                </option>
              ))}
            </select>
          </label>
          {(
            [
              ["MucDoUuTien", "Mức ưu tiên (0–100)"],
              ["ThoiGianChuanBiPhut", "Chuẩn bị (phút)"],
              ["ThoiGianThuHoiPhut", "Thu hồi (phút)"],
            ] as const
          ).map(([Truong, Nhan]) => (
            <label key={Truong}>
              <span className="mb-2 block text-sm">{Nhan}</span>
              <input
                className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                type="number"
                min={0}
                max={Truong === "MucDoUuTien" ? 100 : undefined}
                required
                value={DuLieu[Truong]}
                onChange={(SuKien) =>
                  SetDuLieu({
                    ...DuLieu,
                    [Truong]: Number(SuKien.target.value),
                  })
                }
              />
            </label>
          ))}
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={DuLieu.CoTheDoiLich}
              onChange={(SuKien) =>
                SetDuLieu({ ...DuLieu, CoTheDoiLich: SuKien.target.checked })
              }
            />
            Có thể đổi lịch
          </label>
          <label className="sm:col-span-2">
            <span className="mb-2 block text-sm">Ghi chú</span>
            <textarea
              className="w-full rounded border border-rail bg-case-2 p-3"
              maxLength={2000}
              value={DuLieu.GhiChu}
              onChange={(SuKien) =>
                SetDuLieu({ ...DuLieu, GhiChu: SuKien.target.value })
              }
            />
          </label>
        </fieldset>
        <PhanCongTheoChucVu
          NguoiPhuTrachId={NguoiPhuTrachId}
          OnDoiNguoiPhuTrach={SetNguoiPhuTrachId}
          ChucDanh={ChucDanh}
          Nhom={Nhom}
          DanhSach={NhanSu}
          OnDoi={SetNhom}
          DangXuLy={DangLuu || DangTai}
        />
        <PhanCongThietBiTheoDanhMuc
          Nhom={NhomThietBi}
          OnDoi={SetNhomThietBi}
          DanhSach={ThietBi}
          CacYeuCau={YeuCau}
          DangXuLy={DangLuu || DangTai}
        />
        <BieuMauYeuCauTaiNguyen GiaTri={YeuCau} OnDoi={SetYeuCau} />
        {Loi && (
          <p
            role="alert"
            className="rounded border border-tally p-3 text-sm text-tally"
          >
            {Loi}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={DangLuu}
            className="rounded border border-rail px-4"
            onClick={OnDong}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={DangLuu || DangTai || !NhanSu.length}
            className="rounded bg-tally px-4"
          >
            {DangLuu ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </form>
    </HopThoaiBieuMau>
  );
}
