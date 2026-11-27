import { useId, useState } from "react";

export interface NhanSuLuaChon {
  Id: string;
  HoTen: string;
  ChucDanhId: string | null;
  ChucDanh: { TenChucDanh: string } | null;
}
// Vị trí phân công: tên vị trí và các chức danh nhận được vào vị trí đó.
export interface ChucDanhPhanCong {
  TenChucDanh: string;
  DanhSachChucDanhId: string[];
  SoLanSuDung: number;
}
export interface NhomPhanCong {
  TenChucDanh: string;
  NguoiDungId: string[];
}

function ChonNhieuNhanSu({
  Nhan,
  DanhSach,
  DaChon,
  OnDoi,
  DangXuLy,
}: {
  Nhan: string;
  DanhSach: NhanSuLuaChon[];
  DaChon: string[];
  OnDoi: (DanhSach: string[]) => void;
  DangXuLy: boolean;
}) {
  const Id = useId();
  const [TimKiem, SetTimKiem] = useState("");
  const [DangMo, SetDangMo] = useState(false);
  const [ChiSo, SetChiSo] = useState(0);
  const KetQua = DanhSach.filter((Nguoi) =>
    Nguoi.HoTen.toLocaleLowerCase("vi").includes(
      TimKiem.toLocaleLowerCase("vi"),
    ),
  );
  function Chon(IdNguoi: string) {
    OnDoi(
      DaChon.includes(IdNguoi)
        ? DaChon.filter((Ma) => Ma !== IdNguoi)
        : [...DaChon, IdNguoi],
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
        {DaChon.map((Ma) => (
          <button
            disabled={DangXuLy}
            className="rounded border border-rail px-3 py-2 text-sm"
            key={Ma}
            type="button"
            aria-label={`Bỏ ${DanhSach.find((Nguoi) => Nguoi.Id === Ma)?.HoTen ?? "nhân sự"}`}
            onClick={() => Chon(Ma)}
          >
            {DanhSach.find((Nguoi) => Nguoi.Id === Ma)?.HoTen ??
              "Nhân sự đã phân công"}{" "}
            ×
          </button>
        ))}
      </div>
      <input
        role="combobox"
        aria-label={`Chọn nhân sự: ${Nhan}`}
        aria-expanded={DangMo}
        aria-controls={Id}
        aria-autocomplete="list"
        aria-activedescendant={
          DangMo && KetQua[ChiSo] ? `${Id}-${ChiSo}` : undefined
        }
        className="h-11 w-full rounded border border-rail bg-case-2 px-3"
        placeholder="Tìm và chọn một hoặc nhiều người"
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
            KetQua.map((Nguoi, ViTri) => (
              <li
                role="option"
                aria-selected={DaChon.includes(Nguoi.Id)}
                id={`${Id}-${ViTri}`}
                key={Nguoi.Id}
                onMouseDown={(SuKien) => SuKien.preventDefault()}
                onClick={() => {
                  if (!DangXuLy) Chon(Nguoi.Id);
                }}
                className={`cursor-pointer px-3 py-3 text-sm ${ChiSo === ViTri ? "bg-blueprint/20" : ""}`}
              >
                {DaChon.includes(Nguoi.Id) ? "✓ " : ""}
                {Nguoi.HoTen}
              </li>
            ))
          ) : (
            <li className="p-3 text-sm text-fog">Không có nhân sự phù hợp.</li>
          )}
        </ul>
      )}
    </div>
  );
}

export function PhanCongTheoChucVu({
  NguoiPhuTrachId,
  OnDoiNguoiPhuTrach,
  Nhom,
  DanhSach,
  OnDoi,
  ChucDanh,
  DangXuLy = false,
}: {
  NguoiPhuTrachId: string;
  OnDoiNguoiPhuTrach: (NguoiDungId: string) => void;
  Nhom: NhomPhanCong[];
  DanhSach: NhanSuLuaChon[];
  OnDoi: (Nhom: NhomPhanCong[]) => void;
  ChucDanh: ChucDanhPhanCong[];
  DangXuLy?: boolean;
}) {
  const [ChucDanhThem, SetChucDanhThem] = useState("");
  return (
    <fieldset disabled={DangXuLy} className="space-y-4">
      <legend className="mb-3 font-semibold">
        Phân công nhân sự theo chức danh
      </legend>
      <p className="text-sm text-fog">
        Người phụ trách ca có thể là bất kỳ nhân sự nào trong đơn vị. Mỗi người
        đảm nhiệm một vị trí trong ca quay; vị trí chỉ nhận nhân sự có chức danh
        phù hợp.
      </p>
      <label className="block rounded border border-rail p-3">
        <span className="mb-2 block font-semibold">Người phụ trách ca *</span>
        <select
          className="h-11 w-full rounded border border-rail bg-case-2 px-3"
          required
          value={NguoiPhuTrachId}
          onChange={(SuKien) => {
            const Id = SuKien.target.value;
            OnDoiNguoiPhuTrach(Id);
            // Người phụ trách ca không đồng thời giữ vị trí khác trong ca.
            OnDoi(
              Nhom.map((Muc) => ({
                ...Muc,
                NguoiDungId: Muc.NguoiDungId.filter((Ma) => Ma !== Id),
              })),
            );
          }}
        >
          <option value="">Chọn người phụ trách ca</option>
          {DanhSach.map((Nguoi) => (
            <option key={Nguoi.Id} value={Nguoi.Id}>
              {Nguoi.HoTen}
              {Nguoi.ChucDanh ? ` · ${Nguoi.ChucDanh.TenChucDanh}` : ""}
            </option>
          ))}
        </select>
      </label>
      {Nhom.map((Muc, ChiSo) => {
        const ChucDanhPhuHop =
          ChucDanh.find((Nhom) => Nhom.TenChucDanh === Muc.TenChucDanh)
            ?.DanhSachChucDanhId ?? [];
        const UngVien = DanhSach.filter(
          (Nguoi) =>
            Nguoi.Id !== NguoiPhuTrachId &&
            ((!!Nguoi.ChucDanhId &&
              ChucDanhPhuHop.includes(Nguoi.ChucDanhId)) ||
              Muc.NguoiDungId.includes(Nguoi.Id)) &&
            !Nhom.some(
              (NhomKhac, ViTri) =>
                ViTri !== ChiSo && NhomKhac.NguoiDungId.includes(Nguoi.Id),
            ),
        );
        return (
          <div key={Muc.TenChucDanh} className="rounded border border-rail p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="font-semibold">{Muc.TenChucDanh}</h3>
              <button
                type="button"
                className="min-h-11 px-2 text-sm text-tally"
                onClick={() =>
                  OnDoi(Nhom.filter((_, ViTri) => ViTri !== ChiSo))
                }
              >
                Bỏ vị trí
              </button>
            </div>
            <ChonNhieuNhanSu
              Nhan={Muc.TenChucDanh}
              DanhSach={UngVien}
              DaChon={Muc.NguoiDungId}
              DangXuLy={DangXuLy}
              OnDoi={(NguoiDungId) =>
                OnDoi(
                  Nhom.map((Cu, ViTri) =>
                    ViTri === ChiSo ? { ...Cu, NguoiDungId } : Cu,
                  ),
                )
              }
            />
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Chức danh bổ sung"
          className="h-11 rounded border border-rail bg-case-2 px-3"
          value={ChucDanhThem}
          onChange={(SuKien) => SetChucDanhThem(SuKien.target.value)}
        >
          <option value="">Chọn chức danh</option>
          {ChucDanh.map((Muc) => Muc.TenChucDanh)
            .filter((Ten) => !Nhom.some((Muc) => Muc.TenChucDanh === Ten))
            .map((Ten) => (
              <option key={Ten}>{Ten}</option>
            ))}
        </select>
        <button
          type="button"
          disabled={!ChucDanhThem}
          className="rounded border border-rail px-4"
          onClick={() => {
            if (
              ChucDanhThem &&
              !Nhom.some((Muc) => Muc.TenChucDanh === ChucDanhThem)
            )
              OnDoi([...Nhom, { TenChucDanh: ChucDanhThem, NguoiDungId: [] }]);
            SetChucDanhThem("");
          }}
        >
          Thêm vị trí
        </button>
      </div>
    </fieldset>
  );
}

// Gom phân công hiện có của ca theo tên vị trí; phân công riêng của người phụ trách được giữ nguyên khi lưu.
export function TaoNhomTuPhanCong(
  NguoiPhuTrachId: string,
  DanhSachNhanSu: { NguoiDungId: string; ChucDanhPhanCong: string }[],
) {
  const KetQua: NhomPhanCong[] = [];
  for (const PhanCong of DanhSachNhanSu) {
    if (PhanCong.NguoiDungId === NguoiPhuTrachId) continue;
    const Cu = KetQua.find(
      (Muc) => Muc.TenChucDanh === PhanCong.ChucDanhPhanCong,
    );
    if (Cu) Cu.NguoiDungId.push(PhanCong.NguoiDungId);
    else
      KetQua.push({
        TenChucDanh: PhanCong.ChucDanhPhanCong,
        NguoiDungId: [PhanCong.NguoiDungId],
      });
  }
  return KetQua;
}
