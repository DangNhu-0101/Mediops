import { useEffect, useState } from "react";
import { LayMauThietBi } from "../Services/ThongKeVanHanhService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type { DanhMucThietBi } from "../Types/ThietBi";
import type { MauThietBi } from "../Types/ThongKeVanHanh";

const DongChuaXacDinh = "CHUA_XAC_DINH";
const LopChon =
  "mt-2 min-h-11 w-full rounded border border-rail bg-case px-3 text-sm";

// Lọc theo loại (danh mục) và dòng tài nguyên; chọn dòng sẽ tự chọn loại chứa dòng đó.
export function BoLocDanhMucKho({
  DanhMuc,
  DanhMucId,
  MauThietBiId,
  OnChon,
}: {
  DanhMuc: DanhMucThietBi[];
  DanhMucId: string;
  MauThietBiId: string;
  OnChon: (DanhMucId: string, MauThietBiId: string) => void;
}) {
  const [CacDong, SetCacDong] = useState<MauThietBi[]>([]);
  const [Loi, SetLoi] = useState("");
  useEffect(() => {
    let HieuLuc = true;
    void LayMauThietBi()
      .then((KetQua) => {
        if (HieuLuc) SetCacDong(KetQua);
      })
      .catch((E: unknown) => {
        if (HieuLuc) SetLoi(LayThongBaoLoi(E));
      });
    return () => {
      HieuLuc = false;
    };
  }, []);
  const DongTheoLoai = DanhMucId
    ? CacDong.filter((Dong) => Dong.DanhMucId === DanhMucId)
    : CacDong;
  return (
    <>
      <label className="min-w-0 flex-1 text-sm sm:max-w-56">
        Loại
        <select
          className={LopChon}
          value={DanhMucId}
          onChange={(E) => {
            const LoaiMoi = E.target.value;
            const GiuDong =
              MauThietBiId === DongChuaXacDinh ||
              CacDong.some(
                (Dong) =>
                  Dong.Id === MauThietBiId && Dong.DanhMucId === LoaiMoi,
              );
            OnChon(LoaiMoi, GiuDong ? MauThietBiId : "");
          }}
        >
          <option value="">Tất cả</option>
          {DanhMuc.map((Muc) => (
            <option key={Muc.Id} value={Muc.Id}>
              {Muc.TenDanhMuc}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-0 flex-1 text-sm sm:max-w-56">
        Dòng
        <select
          className={LopChon}
          value={MauThietBiId}
          onChange={(E) => {
            const DongMoi = E.target.value;
            const Dong = CacDong.find((Muc) => Muc.Id === DongMoi);
            OnChon(Dong?.DanhMucId ?? DanhMucId, DongMoi);
          }}
        >
          <option value="">Tất cả</option>
          {DongTheoLoai.map((Dong) => (
            <option key={Dong.Id} value={Dong.Id}>
              {Dong.TenMau}
            </option>
          ))}
          <option value={DongChuaXacDinh}>Chưa xác định dòng</option>
        </select>
        {Loi && (
          <span role="alert" className="mt-1 block text-xs text-tally">
            {Loi}
          </span>
        )}
      </label>
    </>
  );
}
