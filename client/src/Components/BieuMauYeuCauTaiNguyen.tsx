import { useEffect, useState } from "react";
import { Api } from "../Services/Api";
import { LayThongBaoLoi } from "../Services/XacThucService";
import {
  DanhSachTruongKyThuat,
  ChuyenThanhCapDuLieu,
  ChuyenThanhDoiTuong,
  LayNhanDuLieuKyThuat,
  DinhDangGiaTriKyThuat,
} from "../Utils/DuLieuKyThuat";
import { LayDanhSachChucDanh } from "../Services/NhomQuyenService";
import type { YeuCauTaiNguyen } from "../Types/DuLieuNhung";
import type { ChucDanh } from "../Types/NhomQuyen";
import { LayThietBiLuaChon } from "../Services/ThietBiService";
import type { DanhMucThietBi, ThietBiLuaChon } from "../Types/ThietBi";
const LopNhap =
  "mt-1 min-h-11 w-full rounded border border-rail bg-case-2 px-3 text-sm";

function TieuChi({
  GiaTri,
  OnDoi,
  Loai,
  NguonThongSo,
}: {
  GiaTri: Record<string, unknown> | null;
  OnDoi: (Muc: Record<string, unknown> | null) => void;
  Loai: YeuCauTaiNguyen["LoaiTaiNguyen"];
  NguonThongSo: Record<string, unknown>[];
}) {
  const CacCap = ChuyenThanhCapDuLieu(GiaTri ?? {});
  const CacTruong =
    Loai === "NHAN_SU"
      ? [{ Khoa: "trinhDo", Nhan: "Trình độ tối thiểu" }]
      : Loai === "STUDIO"
        ? [
            { Khoa: "sucChua", Nhan: "Sức chứa" },
            ...DanhSachTruongKyThuat.filter((Muc) =>
              ["phongXanh", "cachAm", "gianTreoDenTran", "dienTichM2"].includes(
                Muc.Khoa,
              ),
            ),
          ]
        : DanhSachTruongKyThuat.filter((Muc) =>
            NguonThongSo.some((ThongSo) => Muc.Khoa in ThongSo),
          );
  return (
    <div className="space-y-2">
      {CacCap.map((Cap, ChiSo) => (
        <div key={Cap.Khoa} className="flex flex-wrap items-end gap-2">
          <label className="min-w-40 flex-1 text-sm">
            {LayNhanDuLieuKyThuat(Cap.Khoa)}
            {(() => {
              const Khoa = Cap.Khoa;
              const LaSo =
                [
                  "trinhDo",
                  "sucChua",
                  "dienTichM2",
                  "tocDoKhungHinh4KToiDaFps",
                  "doSauBitToiDa",
                  "doSauBit",
                  "soKenhDauVao",
                  "tanSoLayMauKhz",
                  "tieuCuNhoNhatMm",
                  "tieuCuLonNhatMm",
                  "khauDoLonNhat",
                  "congSuatDauRaW",
                  "cri",
                  "tlci",
                ].includes(Khoa) || typeof Cap.GiaTriGoc === "number";
              const LaBool =
                [
                  "phongXanh",
                  "cachAm",
                  "gianTreoDenTran",
                  "hoTroRgb",
                  "coDay",
                  "dongBoTimecode",
                ].includes(Khoa) || typeof Cap.GiaTriGoc === "boolean";
              const CacGiaTri = [
                ...new Map(
                  NguonThongSo.flatMap((Muc) =>
                    Muc[Khoa] === undefined
                      ? []
                      : [[JSON.stringify(Muc[Khoa]), Muc[Khoa]] as const],
                  ),
                ).values(),
              ];
              if (
                Cap.GiaTriGoc !== undefined &&
                Cap.GiaTriGoc !== "" &&
                !CacGiaTri.some(
                  (Muc) =>
                    JSON.stringify(Muc) === JSON.stringify(Cap.GiaTriGoc),
                )
              )
                CacGiaTri.push(Cap.GiaTriGoc);
              if (LaBool || (!LaSo && CacGiaTri.length))
                return (
                  <select
                    required
                    className={LopNhap}
                    value={
                      Cap.GiaTriGoc === undefined || Cap.GiaTriGoc === ""
                        ? ""
                        : JSON.stringify(Cap.GiaTriGoc)
                    }
                    onChange={(SuKien) => {
                      if (SuKien.target.value)
                        OnDoi({
                          ...GiaTri,
                          [Khoa]: JSON.parse(SuKien.target.value),
                        });
                    }}
                  >
                    <option value="">Chọn giá trị</option>
                    {(LaBool ? [true, false] : CacGiaTri).map((Muc) => (
                      <option
                        key={JSON.stringify(Muc)}
                        value={JSON.stringify(Muc)}
                      >
                        {DinhDangGiaTriKyThuat(Muc)}
                      </option>
                    ))}
                  </select>
                );
              return (
                <input
                  className={LopNhap}
                  required
                  type={LaSo ? "number" : "text"}
                  step={LaSo ? "any" : undefined}
                  value={Cap.GiaTri}
                  onChange={(SuKien) =>
                    OnDoi(
                      ChuyenThanhDoiTuong(
                        CacCap.map((Muc, I) =>
                          I === ChiSo
                            ? { ...Muc, GiaTri: SuKien.target.value }
                            : Muc,
                        ),
                      ),
                    )
                  }
                />
              );
            })()}
          </label>
          <button
            type="button"
            className="min-h-11 px-2 text-sm text-tally"
            onClick={() =>
              OnDoi(
                ChuyenThanhDoiTuong(
                  CacCap.filter((Muc) => Muc.Khoa !== Cap.Khoa),
                ),
              )
            }
          >
            Bỏ tiêu chí
          </button>
        </div>
      ))}
      <label className="block text-sm">
        Thêm tiêu chí
        <select
          value=""
          className={LopNhap}
          onChange={(SuKien) => {
            if (SuKien.target.value)
              OnDoi({ ...GiaTri, [SuKien.target.value]: "" });
          }}
        >
          <option value="">Chọn thông số cần đối chiếu</option>
          {CacTruong.filter(
            (Muc) => !CacCap.some((Cap) => Cap.Khoa === Muc.Khoa),
          ).map((Muc) => (
            <option key={Muc.Khoa} value={Muc.Khoa}>
              {Muc.Nhan}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function BieuMauYeuCauTaiNguyen({
  GiaTri,
  OnDoi,
}: {
  GiaTri: YeuCauTaiNguyen[];
  OnDoi: (DanhSach: YeuCauTaiNguyen[]) => void;
}) {
  const [DanhMuc, SetDanhMuc] = useState<DanhMucThietBi[]>([]),
    [ThietBi, SetThietBi] = useState<ThietBiLuaChon[]>([]),
    [ChucDanh, SetChucDanh] = useState<ChucDanh[]>([]),
    [Loi, SetLoi] = useState("");
  useEffect(() => {
    Promise.all([
      Api.get<DanhMucThietBi[]>("/thiet-bi/danh-muc"),
      LayThietBiLuaChon(),
      LayDanhSachChucDanh(),
    ])
      .then(([Dm, Tb, Cd]) => {
        SetDanhMuc(Dm.data);
        SetThietBi(Tb);
        SetChucDanh(Cd);
      })
      .catch((E: unknown) => SetLoi(LayThongBaoLoi(E)));
  }, []);
  function Doi(Id: string, MucMoi: Partial<YeuCauTaiNguyen>) {
    OnDoi(GiaTri.map((Muc) => (Muc.Id === Id ? { ...Muc, ...MucMoi } : Muc)));
  }
  return (
    <section className="space-y-4">
      <h3 className="font-semibold">Yêu cầu tài nguyên</h3>
      <p className="text-sm text-fog">
        Khai báo nhu cầu để đối chiếu phân công và tìm tài nguyên thay thế khi
        có sự cố. Ca dự thảo có thể lưu trước khi phân công đủ.
      </p>
      {Loi && (
        <p role="alert" className="text-sm text-tally">
          {Loi}
        </p>
      )}
      {!GiaTri.length && (
        <p className="text-sm text-fog">Chưa có yêu cầu riêng cho ca quay.</p>
      )}
      {GiaTri.map((Muc, ChiSo) => (
        <fieldset
          key={Muc.Id}
          className="space-y-4 rounded border border-rail p-4"
        >
          <legend className="px-2 text-sm font-medium">
            Yêu cầu {ChiSo + 1}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Loại tài nguyên
              <select
                className={LopNhap}
                value={Muc.LoaiTaiNguyen}
                onChange={(SuKien) =>
                  Doi(Muc.Id, {
                    LoaiTaiNguyen: SuKien.target
                      .value as YeuCauTaiNguyen["LoaiTaiNguyen"],
                    DanhMucThietBiId: null,
                    ThietBiUuTienId: null,
                    ChucDanhId: null,
                    ThongSoToiThieu: null,
                    ThongSoUuTien: null,
                    ChoPhepThayThe: true,
                  })
                }
              >
                <option value="THIET_BI">Thiết bị</option>
                <option value="NHAN_SU">Nhân sự</option>
                <option value="STUDIO">Studio</option>
              </select>
            </label>
            <label className="text-sm">
              Số lượng
              <input
                className={LopNhap}
                type="number"
                min={1}
                max={100}
                required
                value={Muc.SoLuong}
                onChange={(SuKien) =>
                  Doi(Muc.Id, { SoLuong: Number(SuKien.target.value) })
                }
              />
            </label>
            {Muc.LoaiTaiNguyen === "THIET_BI" && (
              <>
                <label className="text-sm">
                  Danh mục thiết bị
                  <select
                    className={LopNhap}
                    value={Muc.DanhMucThietBiId ?? ""}
                    onChange={(SuKien) =>
                      Doi(Muc.Id, {
                        DanhMucThietBiId: SuKien.target.value || null,
                        ThietBiUuTienId: null,
                      })
                    }
                  >
                    <option value="">Tất cả danh mục</option>
                    {DanhMuc.map((Dm) => (
                      <option key={Dm.Id} value={Dm.Id}>
                        {Dm.TenDanhMuc}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Thiết bị ưu tiên
                  <select
                    className={LopNhap}
                    value={Muc.ThietBiUuTienId ?? ""}
                    onChange={(SuKien) =>
                      Doi(Muc.Id, {
                        ThietBiUuTienId: SuKien.target.value || null,
                      })
                    }
                  >
                    <option value="">Không chỉ định</option>
                    {ThietBi.filter(
                      (Tb) =>
                        !Muc.DanhMucThietBiId ||
                        Tb.DanhMucId === Muc.DanhMucThietBiId,
                    ).map((Tb) => (
                      <option key={Tb.Id} value={Tb.Id}>
                        {Tb.TenThietBi}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {Muc.LoaiTaiNguyen === "NHAN_SU" && (
              <label className="text-sm">
                Chức danh cần có
                <select
                  className={LopNhap}
                  value={Muc.ChucDanhId ?? ""}
                  onChange={(SuKien) =>
                    Doi(Muc.Id, { ChucDanhId: SuKien.target.value || null })
                  }
                >
                  <option value="">Không chỉ định chức danh</option>
                  {ChucDanh.filter(
                    (Cd) => Cd.DangSuDung || Cd.Id === Muc.ChucDanhId,
                  ).map((Cd) => (
                    <option key={Cd.Id} value={Cd.Id}>
                      {Cd.TenChucDanh}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-sm">
              Mức ưu tiên
              <input
                className={LopNhap}
                type="number"
                min={0}
                max={100}
                required
                value={Muc.TrongSo}
                onChange={(SuKien) =>
                  Doi(Muc.Id, { TrongSo: Number(SuKien.target.value) })
                }
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex min-h-10 items-center gap-2">
              <input
                type="checkbox"
                checked={Muc.BatBuoc}
                onChange={(SuKien) =>
                  Doi(Muc.Id, { BatBuoc: SuKien.target.checked })
                }
              />
              Yêu cầu bắt buộc
            </label>
            {Muc.LoaiTaiNguyen === "THIET_BI" && (
              <label className="flex min-h-10 items-center gap-2">
                <input
                  type="checkbox"
                  checked={Muc.ChoPhepThayThe}
                  onChange={(SuKien) =>
                    Doi(Muc.Id, { ChoPhepThayThe: SuKien.target.checked })
                  }
                />
                Cho phép thay thế thiết bị ưu tiên
              </label>
            )}
          </div>
          <details>
            <summary className="cursor-pointer text-sm font-medium">
              Điều kiện tối thiểu
              {Object.keys(Muc.ThongSoToiThieu ?? {}).length
                ? " · Đã cấu hình"
                : ""}
            </summary>
            <div className="mt-3">
              <TieuChi
                GiaTri={Muc.ThongSoToiThieu}
                Loai={Muc.LoaiTaiNguyen}
                NguonThongSo={ThietBi.map((Tb) => Tb.ThongSoKyThuat)}
                OnDoi={(GiaTriMoi) =>
                  Doi(Muc.Id, { ThongSoToiThieu: GiaTriMoi })
                }
              />
            </div>
          </details>
          <details>
            <summary className="cursor-pointer text-sm font-medium">
              Tiêu chí ưu tiên
              {Object.keys(Muc.ThongSoUuTien ?? {}).length
                ? " · Đã cấu hình"
                : ""}
            </summary>
            <div className="mt-3">
              <TieuChi
                GiaTri={Muc.ThongSoUuTien}
                Loai={Muc.LoaiTaiNguyen}
                NguonThongSo={ThietBi.map((Tb) => Tb.ThongSoKyThuat)}
                OnDoi={(GiaTriMoi) => Doi(Muc.Id, { ThongSoUuTien: GiaTriMoi })}
              />
            </div>
          </details>
          <button
            type="button"
            className="min-h-11 text-sm text-tally"
            onClick={() => OnDoi(GiaTri.filter((Cu) => Cu.Id !== Muc.Id))}
          >
            Bỏ yêu cầu {ChiSo + 1}
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="min-h-11 rounded border border-rail px-4 text-sm hover:bg-case-2"
        onClick={() => {
          const Id = crypto.randomUUID();
          OnDoi([
            ...GiaTri,
            {
              Id,
              MaYeuCau: Id,
              LoaiTaiNguyen: "THIET_BI",
              SoLuong: 1,
              BatBuoc: true,
              ChoPhepThayThe: true,
              TrongSo: 50,
              DanhMucThietBiId: null,
              ThietBiUuTienId: null,
              ChucDanhId: null,
              ThongSoToiThieu: null,
              ThongSoUuTien: null,
            },
          ]);
        }}
      >
        Thêm yêu cầu tài nguyên
      </button>
    </section>
  );
}
