import { useId, useState } from "react";
import type { YeuCauTaiNguyen } from "../Types/DuLieuNhung";
import type { ThietBiLuaChon, TrangThaiThietBi } from "../Types/ThietBi";

export interface NhomThietBi {
  DanhMucId: string;
  ThietBiId: string[];
}

const NhanTrangThaiChan: Record<TrangThaiThietBi, string | null> = {
  SAN_SANG: null,
  DANG_SU_DUNG: "Đang sử dụng",
  BAO_TRI: "Bảo trì",
  HU_HONG: "Hư hỏng",
};

function TenHienThi(ThietBi: ThietBiLuaChon) {
  const TrangThai = NhanTrangThaiChan[ThietBi.TrangThai];
  return `${ThietBi.TenThietBi} · ${ThietBi.MaQR}${TrangThai ? ` · ${TrangThai}` : ""}`;
}

// Danh mục mà một yêu cầu thiết bị trỏ tới: lấy trực tiếp, hoặc suy từ thiết bị ưu tiên.
function LayDanhMucCuaYeuCau(
  YeuCau: YeuCauTaiNguyen,
  DanhSach: ThietBiLuaChon[],
) {
  if (YeuCau.DanhMucThietBiId) return YeuCau.DanhMucThietBiId;
  return (
    DanhSach.find((ThietBi) => ThietBi.Id === YeuCau.ThietBiUuTienId)
      ?.DanhMucId ?? null
  );
}

// Gom thiết bị đã phân công của ca theo danh mục.
export function TaoNhomTuThietBi(
  ThietBiIdDaChon: string[],
  DanhSach: ThietBiLuaChon[],
) {
  const KetQua: NhomThietBi[] = [];
  for (const Id of ThietBiIdDaChon) {
    const ThietBi = DanhSach.find((Muc) => Muc.Id === Id);
    if (!ThietBi) continue;
    const Cu = KetQua.find((Muc) => Muc.DanhMucId === ThietBi.DanhMucId);
    if (Cu) Cu.ThietBiId.push(Id);
    else KetQua.push({ DanhMucId: ThietBi.DanhMucId, ThietBiId: [Id] });
  }
  return KetQua;
}

// Mỗi danh mục có yêu cầu thiết bị luôn có một nhóm phân công. Nhóm còn trống được
// điền sẵn thiết bị ưu tiên của yêu cầu; nhóm đã có lựa chọn thì giữ nguyên.
export function BoSungNhomTheoYeuCau(
  Nhom: NhomThietBi[],
  DanhSach: ThietBiLuaChon[],
  CacYeuCau: YeuCauTaiNguyen[],
) {
  let CoThayDoi = false;
  const KetQua = Nhom.map((Muc) => ({ ...Muc }));
  for (const YeuCau of CacYeuCau) {
    if (YeuCau.LoaiTaiNguyen !== "THIET_BI") continue;
    const DanhMucId = LayDanhMucCuaYeuCau(YeuCau, DanhSach);
    if (!DanhMucId) continue;
    const ThietBiUuTien = DanhSach.find(
      (ThietBi) =>
        ThietBi.Id === YeuCau.ThietBiUuTienId &&
        ThietBi.DanhMucId === DanhMucId,
    );
    const Cu = KetQua.find((Muc) => Muc.DanhMucId === DanhMucId);
    if (!Cu) {
      KetQua.push({
        DanhMucId,
        ThietBiId: ThietBiUuTien ? [ThietBiUuTien.Id] : [],
      });
      CoThayDoi = true;
    } else if (!Cu.ThietBiId.length && ThietBiUuTien) {
      Cu.ThietBiId = [ThietBiUuTien.Id];
      CoThayDoi = true;
    }
  }
  return CoThayDoi ? KetQua : Nhom;
}

function ChonNhieuThietBi({
  Nhan,
  DanhSach,
  DaChon,
  OnDoi,
  DangXuLy,
}: {
  Nhan: string;
  DanhSach: ThietBiLuaChon[];
  DaChon: string[];
  OnDoi: (DanhSach: string[]) => void;
  DangXuLy: boolean;
}) {
  const Id = useId();
  const [TimKiem, SetTimKiem] = useState("");
  const [DangMo, SetDangMo] = useState(false);
  const [ChiSo, SetChiSo] = useState(0);
  const TuKhoa = TimKiem.toLocaleLowerCase("vi");
  const KetQua = DanhSach.filter(
    (ThietBi) =>
      ThietBi.TenThietBi.toLocaleLowerCase("vi").includes(TuKhoa) ||
      ThietBi.MaQR.toLocaleLowerCase("vi").includes(TuKhoa),
  );
  function Chon(IdThietBi: string) {
    OnDoi(
      DaChon.includes(IdThietBi)
        ? DaChon.filter((Ma) => Ma !== IdThietBi)
        : [...DaChon, IdThietBi],
    );
  }
  return (
    <div
      className="min-w-0"
      onBlur={(SuKien) => {
        if (!SuKien.currentTarget.contains(SuKien.relatedTarget))
          SetDangMo(false);
      }}
    >
      <div className="mb-2 flex flex-wrap gap-2">
        {DaChon.map((Ma) => {
          const ThietBi = DanhSach.find((Muc) => Muc.Id === Ma);
          return (
            <button
              disabled={DangXuLy}
              className="rounded border border-rail px-3 py-2 text-sm"
              key={Ma}
              type="button"
              aria-label={`Bỏ ${ThietBi?.TenThietBi ?? "thiết bị"}`}
              onClick={() => Chon(Ma)}
            >
              {ThietBi ? TenHienThi(ThietBi) : "Thiết bị đã phân công"} ×
            </button>
          );
        })}
      </div>
      <input
        role="combobox"
        aria-label={`Chọn thiết bị: ${Nhan}`}
        aria-expanded={DangMo}
        aria-controls={Id}
        aria-autocomplete="list"
        aria-activedescendant={
          DangMo && KetQua[ChiSo] ? `${Id}-${ChiSo}` : undefined
        }
        className="h-11 w-full rounded border border-rail bg-case-2 px-3"
        placeholder="Tìm theo tên hoặc mã QR"
        value={TimKiem}
        disabled={DangXuLy}
        onFocus={() => SetDangMo(true)}
        onChange={(SuKien) => {
          SetTimKiem(SuKien.target.value);
          SetChiSo(0);
          SetDangMo(true);
        }}
        onKeyDown={(SuKien) => {
          if (SuKien.key === "Escape") {
            SetDangMo(false);
            SuKien.stopPropagation();
          }
          if (SuKien.key === "ArrowDown" || SuKien.key === "ArrowUp") {
            SuKien.preventDefault();
            SetDangMo(true);
            SetChiSo((Cu) =>
              Math.max(
                0,
                Math.min(
                  KetQua.length - 1,
                  Cu + (SuKien.key === "ArrowDown" ? 1 : -1),
                ),
              ),
            );
          }
          if (SuKien.key === "Enter") {
            SuKien.preventDefault();
            if (DangMo && KetQua[ChiSo]) Chon(KetQua[ChiSo].Id);
            SetDangMo(true);
          }
        }}
      />
      {DangMo && (
        <ul
          id={Id}
          role="listbox"
          aria-label={Nhan}
          aria-multiselectable="true"
          className="mt-1 max-h-48 overflow-y-auto rounded border border-rail bg-case-2"
        >
          {KetQua.length ? (
            KetQua.map((ThietBi, ViTri) => (
              <li
                role="option"
                aria-selected={DaChon.includes(ThietBi.Id)}
                id={`${Id}-${ViTri}`}
                key={ThietBi.Id}
                onMouseDown={(SuKien) => SuKien.preventDefault()}
                onClick={() => {
                  if (!DangXuLy) Chon(ThietBi.Id);
                }}
                className={`cursor-pointer px-3 py-3 text-sm ${ChiSo === ViTri ? "bg-blueprint/20" : ""}`}
              >
                {DaChon.includes(ThietBi.Id) ? "✓ " : ""}
                {TenHienThi(ThietBi)}
              </li>
            ))
          ) : (
            <li className="p-3 text-sm text-fog">Không có thiết bị phù hợp.</li>
          )}
        </ul>
      )}
    </div>
  );
}

export function PhanCongThietBiTheoDanhMuc({
  Nhom,
  OnDoi,
  DanhSach,
  CacYeuCau,
  DangXuLy = false,
}: {
  Nhom: NhomThietBi[];
  OnDoi: (Nhom: NhomThietBi[]) => void;
  DanhSach: ThietBiLuaChon[];
  CacYeuCau: YeuCauTaiNguyen[];
  DangXuLy?: boolean;
}) {
  const [DanhMucThem, SetDanhMucThem] = useState("");
  const CacDanhMuc = [
    ...new Map(
      DanhSach.map((ThietBi) => [ThietBi.DanhMucId, ThietBi.DanhMuc]),
    ).values(),
  ].sort((A, B) => A.TenDanhMuc.localeCompare(B.TenDanhMuc, "vi"));
  return (
    <fieldset disabled={DangXuLy} className="space-y-4">
      <legend className="mb-3 font-semibold">
        Phân công thiết bị theo danh mục
      </legend>
      <p className="text-sm text-fog">
        Danh mục có trong yêu cầu tài nguyên được thêm sẵn. Khả dụng của thiết
        bị được kiểm tra khi bấm Lưu.
      </p>
      {Nhom.map((Muc, ChiSo) => {
        const TenDanhMuc =
          CacDanhMuc.find((DanhMuc) => DanhMuc.Id === Muc.DanhMucId)
            ?.TenDanhMuc ?? "Danh mục";
        const YeuCauCuaNhom = CacYeuCau.filter(
          (YeuCau) =>
            YeuCau.LoaiTaiNguyen === "THIET_BI" &&
            LayDanhMucCuaYeuCau(YeuCau, DanhSach) === Muc.DanhMucId,
        );
        const SoCan = YeuCauCuaNhom.reduce(
          (Tong, YeuCau) => Tong + YeuCau.SoLuong,
          0,
        );
        const BatBuoc = YeuCauCuaNhom.some((YeuCau) => YeuCau.BatBuoc);
        return (
          <div key={Muc.DanhMucId} className="rounded border border-rail p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{TenDanhMuc}</h3>
                {SoCan > 0 && (
                  <p
                    className={`text-sm ${Muc.ThietBiId.length < SoCan ? "text-timecode" : "text-fog"}`}
                  >
                    Theo yêu cầu: {Muc.ThietBiId.length}/{SoCan} thiết bị
                    {BatBuoc ? " · bắt buộc" : " · ưu tiên"}
                  </p>
                )}
              </div>
              {!YeuCauCuaNhom.length && (
                <button
                  type="button"
                  className="min-h-11 px-2 text-sm text-tally"
                  onClick={() =>
                    OnDoi(Nhom.filter((_, ViTri) => ViTri !== ChiSo))
                  }
                >
                  Bỏ danh mục
                </button>
              )}
            </div>
            <ChonNhieuThietBi
              Nhan={TenDanhMuc}
              DanhSach={DanhSach.filter(
                (ThietBi) => ThietBi.DanhMucId === Muc.DanhMucId,
              )}
              DaChon={Muc.ThietBiId}
              DangXuLy={DangXuLy}
              OnDoi={(ThietBiId) =>
                OnDoi(
                  Nhom.map((Cu, ViTri) =>
                    ViTri === ChiSo ? { ...Cu, ThietBiId } : Cu,
                  ),
                )
              }
            />
          </div>
        );
      })}
      {!Nhom.length && (
        <p className="text-sm text-fog">Chưa phân công thiết bị.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Danh mục thiết bị bổ sung"
          className="h-11 rounded border border-rail bg-case-2 px-3"
          value={DanhMucThem}
          onChange={(SuKien) => SetDanhMucThem(SuKien.target.value)}
        >
          <option value="">Chọn danh mục</option>
          {CacDanhMuc.filter(
            (DanhMuc) => !Nhom.some((Muc) => Muc.DanhMucId === DanhMuc.Id),
          ).map((DanhMuc) => (
            <option key={DanhMuc.Id} value={DanhMuc.Id}>
              {DanhMuc.TenDanhMuc}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!DanhMucThem}
          className="rounded border border-rail px-4"
          onClick={() => {
            if (
              DanhMucThem &&
              !Nhom.some((Muc) => Muc.DanhMucId === DanhMucThem)
            )
              OnDoi([...Nhom, { DanhMucId: DanhMucThem, ThietBiId: [] }]);
            SetDanhMucThem("");
          }}
        >
          Thêm danh mục
        </button>
      </div>
    </fieldset>
  );
}
