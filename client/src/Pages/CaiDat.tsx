import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useXacThuc } from "../Contexts/XacThucContext";
import { CoQuyen, CacMucCaiDat } from "../Services/QuyenService";
import { QuanLyPhanLoaiThietBi } from "../Components/QuanLyPhanLoaiThietBi";
import { LayDanhMucThietBi } from "../Services/ThietBiService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type { DanhMucThietBi } from "../Types/ThietBi";

export function CaiDat() {
  const { NguoiDung } = useXacThuc();
  const CacMuc = CacMucCaiDat(NguoiDung);
  if (!CacMuc.length)
    return <p role="alert">Bạn không có quyền truy cập Cài đặt.</p>;
  return (
    <section className="min-w-0 space-y-5">
      <h1 className="font-serif text-2xl md:text-3xl">Cài đặt</h1>
      <nav
        aria-label="Các mục cài đặt"
        className="flex flex-wrap gap-2 border-b border-rail pb-3"
      >
        {CacMuc.map(([DuongDan, Ten]) => (
          <NavLink
            key={DuongDan}
            to={`/cai-dat/${DuongDan}`}
            className={({ isActive }) =>
              `inline-flex min-h-11 items-center rounded px-3 text-sm ${isActive ? "bg-tally text-paper" : "bg-case text-fog hover:text-paper"}`
            }
          >
            {Ten}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </section>
  );
}

export function MucCaiDatMacDinh() {
  const { NguoiDung } = useXacThuc();
  const Muc = CacMucCaiDat(NguoiDung)[0];
  return Muc ? <Navigate to={Muc[0]} replace /> : null;
}

export function CaiDatPhanLoai({ LaModel }: { LaModel: boolean }) {
  const { NguoiDung } = useXacThuc();
  const DieuHuong = useNavigate();
  const [DanhMuc, SetDanhMuc] = useState<DanhMucThietBi[]>([]);
  const [DanhMucId, SetDanhMucId] = useState("");
  const [Loi, SetLoi] = useState("");
  const [LanTai, SetLanTai] = useState(0);
  useEffect(() => {
    let HieuLuc = true;
    SetLoi("");
    void LayDanhMucThietBi()
      .then((KetQua) => {
        if (HieuLuc) SetDanhMuc(KetQua);
      })
      .catch((E: unknown) => {
        if (HieuLuc) SetLoi(LayThongBaoLoi(E));
      });
    return () => {
      HieuLuc = false;
    };
  }, [LanTai]);
  if (!CoQuyen(NguoiDung, "ThietBi.Xem"))
    return <p role="alert">Bạn không có quyền xem danh mục tài nguyên.</p>;
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {LaModel ? "Dòng tài nguyên" : "Danh mục tài nguyên"}
      </h2>
      {Loi && (
        <p role="alert" className="text-tally">
          {Loi}{" "}
          <button onClick={() => SetLanTai((So) => So + 1)}>Thử lại</button>
        </p>
      )}
      {LaModel && (
        <label className="block text-sm">
          Danh mục
          <select
            className="mt-2 min-h-11 w-full rounded border border-rail bg-case px-3 sm:max-w-sm"
            value={DanhMucId}
            onChange={(E) => SetDanhMucId(E.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {DanhMuc.map((Muc) => (
              <option key={Muc.Id} value={Muc.Id}>
                {Muc.TenDanhMuc}
              </option>
            ))}
          </select>
        </label>
      )}
      <QuanLyPhanLoaiThietBi
        key={String(LaModel)}
        LaModel={LaModel}
        DanhMucId={LaModel ? DanhMucId || undefined : undefined}
        OnThayDoi={() => SetLanTai((So) => So + 1)}
        OnXemMay={(Id) =>
          DieuHuong(
            `/kho-thiet-bi?${LaModel ? "MauThietBiId" : "DanhMucId"}=${encodeURIComponent(Id)}`,
          )
        }
      />
    </div>
  );
}
