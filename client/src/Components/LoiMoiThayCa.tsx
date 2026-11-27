import { useCallback, useEffect, useState } from "react";
import {
  LayLoiMoi,
  NhanLoiMoi,
  TraLoiMoi,
  type LoiMoiCaNhan,
} from "../Services/PhienQuyetDinhService";
import { GioHienThi, GioGuiMayChu } from "../Services/SuCoVanHanhService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";

export function LoiMoiThayCa() {
  const [DanhSach, SetDanhSach] = useState<LoiMoiCaNhan[]>([]);
  const [Trang, SetTrang] = useState(1);
  const [Loi, SetLoi] = useState("");
  const [DangTai, SetDangTai] = useState(true);
  const [GioDen, SetGioDen] = useState<Record<string, string>>({});
  const TaiLai = useCallback(async () => {
    try {
      SetDanhSach(await LayLoiMoi(Trang));
    } catch (LoiTai) {
      SetLoi(LayThongBaoLoi(LoiTai));
    } finally {
      SetDangTai(false);
    }
  }, [Trang]);
  useEffect(() => {
    void TaiLai();
    return TheoDoiVanHanh(["loi_moi:cap_nhat"], () => void TaiLai());
  }, [TaiLai]);
  async function TraLoi(
    Moi: LoiMoiCaNhan,
    LuaChon: "DA_DONG_Y" | "DA_TU_CHOI" | "RUT_DONG_Y",
  ) {
    SetDangTai(true);
    SetLoi("");
    try {
      await TraLoiMoi(
        Moi.Id,
        LuaChon,
        GioDen[Moi.Id] ? GioGuiMayChu(GioDen[Moi.Id]!) : undefined,
      );
      await TaiLai();
    } catch (LoiGui) {
      SetLoi(LayThongBaoLoi(LoiGui));
    } finally {
      SetDangTai(false);
    }
  }
  return (
    <section className="my-5 space-y-3 border-y border-rail py-4">
      <h2 className="font-serif text-xl">Lời mời thay ca</h2>
      <p className="text-sm text-fog">
        Đồng ý vẫn chờ người điều phối chốt. Lời mời chưa khóa lịch của bạn.
      </p>
      {Loi && (
        <p role="alert">
          {Loi}{" "}
          <button className="min-h-11 underline" onClick={() => void TaiLai()}>
            Tải lại
          </button>
        </p>
      )}
      {DangTai && <p role="status">Đang tải hoặc gửi phản hồi lời mời…</p>}
      {!DangTai && !DanhSach.length && !Loi && (
        <p className="text-sm text-fog">
          {Trang === 1
            ? "Chưa có lời mời thay ca."
            : "Chưa có lời mời trong trang này."}
        </p>
      )}
      {DanhSach.map((Moi) => {
        const TrangThai =
          ["CHO_PHAN_HOI", "DA_DONG_Y"].includes(Moi.TrangThai) &&
          Date.parse(Moi.HetHanLuc) <= Date.now()
            ? "HET_HAN"
            : Moi.TrangThai;
        return (
          <article key={Moi.Id} className="space-y-2 border-t border-rail pt-3">
            <h3 className="font-semibold">
              {Moi.NoiDung.TenCa} · {Moi.ChucDanhPhanCong}
            </h3>
            <p>
              {Moi.NoiDung.TenDuAn} · {Moi.NoiDung.DiaDiem}
            </p>
            <p>
              {GioHienThi(Moi.NoiDung.BatDau)} –{" "}
              {GioHienThi(Moi.NoiDung.KetThuc)}
            </p>
            <p>{Moi.GhiChuBanGiao}</p>
            <p>
              {NhanLoiMoi[TrangThai] ?? "Cần tải lại"} · Hạn phản hồi:{" "}
              {GioHienThi(Moi.HetHanLuc)}
            </p>
            {TrangThai === "CHO_PHAN_HOI" && (
              <>
                <label className="block">
                  Giờ sớm nhất có mặt (tùy chọn)
                  <input
                    type="datetime-local"
                    className="block min-h-11 rounded border border-rail bg-case p-2"
                    value={GioDen[Moi.Id] ?? ""}
                    onChange={(SuKien) =>
                      SetGioDen((Cu) => ({
                        ...Cu,
                        [Moi.Id]: SuKien.target.value,
                      }))
                    }
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    disabled={DangTai}
                    className="min-h-11 rounded bg-tally px-4"
                    onClick={() => void TraLoi(Moi, "DA_DONG_Y")}
                  >
                    Đồng ý tham gia
                  </button>
                  <button
                    disabled={DangTai}
                    className="min-h-11 rounded border border-rail px-4"
                    onClick={() => void TraLoi(Moi, "DA_TU_CHOI")}
                  >
                    Từ chối
                  </button>
                </div>
              </>
            )}
            {TrangThai === "DA_DONG_Y" && (
              <button
                className="min-h-11 underline"
                disabled={DangTai}
                onClick={() => void TraLoi(Moi, "RUT_DONG_Y")}
              >
                Rút đồng ý
              </button>
            )}
            <details>
              <summary className="min-h-11 cursor-pointer">
                Lịch sử phản hồi
              </summary>
              {Moi.LichSu.map((Muc, So) => (
                <p key={So}>
                  {GioHienThi(Muc.NgayTao)} · {NhanLoiMoi[Muc.TrangThai]}
                </p>
              ))}
            </details>
          </article>
        );
      })}
      {(Trang > 1 || DanhSach.length >= 20) && (
        <div className="flex items-center gap-2 text-sm">
          <button
            className="min-h-11 rounded border border-rail px-4 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Trang === 1 || DangTai}
            onClick={() => SetTrang((Cu) => Cu - 1)}
            type="button"
          >
            Trước
          </button>
          <span className="px-2 text-fog">Trang {Trang}</span>
          <button
            className="min-h-11 rounded border border-rail px-4 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={DanhSach.length < 20 || DangTai}
            onClick={() => SetTrang((Cu) => Cu + 1)}
            type="button"
          >
            Sau
          </button>
        </div>
      )}
    </section>
  );
}
