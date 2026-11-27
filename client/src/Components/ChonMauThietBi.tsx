import { useEffect, useState } from "react";
import {
  LayMauThietBi,
  TaoMauThietBi,
} from "../Services/ThongKeVanHanhService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type { MauThietBi } from "../Types/ThongKeVanHanh";
import { HopThoaiBieuMau } from "./HopThoaiBieuMau";
import { LopTruongThongKe } from "./ThongKeVanHanh";

export function ChonMauThietBi({
  DanhMucId,
  GiaTri,
  OnDoi,
  ChoPhepTao,
}: {
  DanhMucId: string;
  GiaTri: string;
  OnDoi: (Id: string) => void;
  ChoPhepTao: boolean;
}) {
  const [DanhSach, SetDanhSach] = useState<MauThietBi[]>([]);
  const [TimKiem, SetTimKiem] = useState("");
  const [DangTai, SetDangTai] = useState(true);
  const [LanTai, SetLanTai] = useState(0);
  const [LoiTai, SetLoiTai] = useState("");
  const [DangMo, SetDangMo] = useState(false);
  const [MaMau, SetMaMau] = useState("");
  const [TenMau, SetTenMau] = useState("");
  const [Loi, SetLoi] = useState("");
  const [DangGui, SetDangGui] = useState(false);
  useEffect(() => {
    let HieuLuc = true;
    SetDangTai(true);
    SetLoiTai("");
    void LayMauThietBi()
      .then((Data) => {
        if (HieuLuc) SetDanhSach(Data);
      })
      .catch((LoiTai) => {
        if (HieuLuc) SetLoiTai(LayThongBaoLoi(LoiTai));
      })
      .finally(() => {
        if (HieuLuc) SetDangTai(false);
      });
    return () => {
      HieuLuc = false;
    };
  }, [LanTai]);
  const TuKhoa = TimKiem.trim().toLocaleLowerCase("vi");
  const LuaChon = DanhSach.filter(
    (Muc) =>
      Muc.DanhMucId === DanhMucId &&
      (Muc.Id === GiaTri ||
        `${Muc.TenMau} ${Muc.MaMau}`.toLocaleLowerCase("vi").includes(TuKhoa)),
  );
  async function TaoMau() {
    SetDangGui(true);
    SetLoi("");
    try {
      const Mau = await TaoMauThietBi({ DanhMucId, MaMau, TenMau });
      SetDanhSach((Cu) => [...Cu, Mau]);
      SetTimKiem("");
      OnDoi(Mau.Id);
      SetDangMo(false);
      SetMaMau("");
      SetTenMau("");
    } catch (LoiTao) {
      SetLoi(LayThongBaoLoi(LoiTao));
    } finally {
      SetDangGui(false);
    }
  }
  return (
    <div className="space-y-2 sm:col-span-2">
      
      <label className="grid gap-2 text-sm">
        <span>Dòng tài nguyên</span>
        <select
          className={LopTruongThongKe}
          value={GiaTri}
          disabled={!DanhMucId || DangGui || DangTai}
          onChange={(E) => OnDoi(E.target.value)}
        >
          <option value="">Chưa xác định dòng tài nguyên</option>
          {LuaChon.map((Muc) => (
            <option key={Muc.Id} value={Muc.Id}>
              {Muc.TenMau} · {Muc.MaMau}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs leading-relaxed text-fog">
        Một dòng có thể dùng cho nhiều thiết bị. Mỗi máy vẫn giữ mã QR, seri và
        tình trạng riêng.
      </p>
      {DangTai && (
        <p role="status" className="text-sm text-fog">
          Đang tải dòng tài nguyên…
        </p>
      )}
      {!DangTai && !LoiTai && DanhMucId && !LuaChon.length && (
        <p role="status" className="text-sm text-fog">
          Không có dòng tài nguyên phù hợp trong danh mục này.
        </p>
      )}
      {LoiTai && (
        <div role="alert" className="text-sm text-timecode">
          {LoiTai}{" "}
          <button
            type="button"
            className="min-h-11 underline"
            onClick={() => SetLanTai((Cu) => Cu + 1)}
          >
            Thử tải lại
          </button>
        </div>
      )}
      {ChoPhepTao && (
        <button
          className="min-h-11 text-sm text-blueprint hover:underline disabled:opacity-40"
          disabled={!DanhMucId || DangGui || DangTai}
          type="button"
          onClick={() => {
            SetLoi("");
            SetDangMo(true);
          }}
        >
          + Thêm dòng tài nguyên
        </button>
      )}
      {DangMo && (
        <HopThoaiBieuMau
          TieuDe="Thêm dòng tài nguyên"
          DangXuLy={DangGui}
          OnDong={() => {
            SetLoi("");
            SetDangMo(false);
          }}
        >
          <div
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onKeyDown={(E) => {
              if (E.key === "Enter" && E.target instanceof HTMLInputElement) {
                E.preventDefault();
                if (!DangGui && MaMau.trim() && TenMau.trim()) void TaoMau();
              }
            }}
          >
            <p className="text-sm text-fog sm:col-span-2">
              Dòng mới thuộc danh mục đang chọn của thiết bị.
            </p>
            <label className="grid gap-1 text-sm">
              <span>Mã dòng tài nguyên</span>
              <input
                className={LopTruongThongKe}
                disabled={DangGui}
                maxLength={100}
                value={MaMau}
                onChange={(E) => SetMaMau(E.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Tên dòng tài nguyên</span>
              <input
                className={LopTruongThongKe}
                disabled={DangGui}
                maxLength={200}
                value={TenMau}
                onChange={(E) => SetTenMau(E.target.value)}
              />
            </label>
            <button
              className="min-h-11 rounded border border-blueprint px-4 text-sm text-blueprint disabled:opacity-40 sm:col-span-2"
              disabled={DangGui || !MaMau.trim() || !TenMau.trim()}
              onClick={() => void TaoMau()}
              type="button"
            >
              {DangGui
                ? "Đang tạo dòng tài nguyên…"
                : "Tạo và chọn dòng tài nguyên"}
            </button>
            {Loi && (
              <p role="alert" className="text-sm text-timecode sm:col-span-2">
                {Loi}
              </p>
            )}
            <button
              type="button"
              className="min-h-11 text-sm text-fog sm:col-span-2"
              disabled={DangGui}
              onClick={() => {
                SetLoi("");
                SetDangMo(false);
              }}
            >
              Hủy
            </button>
          </div>
        </HopThoaiBieuMau>
      )}
      {!DangMo && Loi && (
        <p role="alert" className="text-sm text-timecode">
          {Loi}
        </p>
      )}
    </div>
  );
}
