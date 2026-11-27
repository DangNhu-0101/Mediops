import { useState } from "react";
import type { PhuongAnGiaiQuyetXungDot } from "../Types/CaQuay";
import {
  GuiLoiMoi,
  RutLoiMoi,
  NhanLoiMoi,
  type PhienQuyetDinh,
} from "../Services/PhienQuyetDinhService";
import { GioHienThi } from "../Services/SuCoVanHanhService";
import { LayThongBaoLoi } from "../Services/XacThucService";

export function MoiNhanSuPhuongAn({
  Phien,
  PhuongAn,
  OnCapNhat,
}: {
  Phien: PhienQuyetDinh;
  PhuongAn: PhuongAnGiaiQuyetXungDot;
  OnCapNhat: () => void;
}) {
  const [NguoiNhan, SetNguoiNhan] = useState<string[]>([]);
  const [GhiChu, SetGhiChu] = useState("");
  const [Loi, SetLoi] = useState("");
  const [DangGui, SetDangGui] = useState(false);
  const UngVien = [
    ...(PhuongAn.ThayDoi.NhanSu ?? []).map((Muc) => ({
      Id: Muc.DenId,
      Ten: Muc.TenNhanSuMoi,
    })),
    ...(PhuongAn.ThayDoi.NguoiPhuTrach
      ? [
          {
            Id: PhuongAn.ThayDoi.NguoiPhuTrach.DenId,
            Ten: PhuongAn.ThayDoi.NguoiPhuTrach.TenNguoiMoi,
          },
        ]
      : []),
  ];
  if (!UngVien.length) return null;
  async function ThucHien(ThaoTac: () => Promise<unknown>) {
    SetDangGui(true);
    SetLoi("");
    try {
      await ThaoTac();
      SetNguoiNhan([]);
      OnCapNhat();
    } catch (LoiGui) {
      SetLoi(LayThongBaoLoi(LoiGui));
    } finally {
      SetDangGui(false);
    }
  }
  return (
    <fieldset
      className="space-y-2 border-t border-rail pt-3"
      disabled={DangGui || !PhuongAn.ApDungDuoc || !Phien.NoiDungConHieuLuc}
    >
      <legend>Chọn người nhận lời mời</legend>
      <p className="text-sm text-fog">
        Chỉ gửi đến người bạn chọn. Đồng ý vẫn cần người điều phối chốt.
      </p>
      {UngVien.map((Nguoi) => {
        const Moi = Phien.LoiMoi.find(
          (Muc) =>
            Muc.PhuongAnId === PhuongAn.Id && Muc.NguoiNhanId === Nguoi.Id,
        );
        const TrangThai =
          Moi &&
          ["CHO_PHAN_HOI", "DA_DONG_Y"].includes(Moi.TrangThai) &&
          Date.parse(Moi.HetHanLuc) <= Date.now()
            ? "HET_HAN"
            : Moi?.TrangThai;
        return (
          <div key={Nguoi.Id}>
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                disabled={!!Moi}
                checked={NguoiNhan.includes(Nguoi.Id)}
                onChange={(SuKien) =>
                  SetNguoiNhan((Cu) =>
                    SuKien.target.checked
                      ? [...Cu, Nguoi.Id]
                      : Cu.filter((Ma) => Ma !== Nguoi.Id),
                  )
                }
              />
              {Nguoi.Ten}
            </label>
            {Moi && (
              <p className="text-sm">
                {NhanLoiMoi[TrangThai ?? ""]} · {GioHienThi(Moi.HetHanLuc)}
                {["CHO_PHAN_HOI", "DA_DONG_Y"].includes(TrangThai ?? "") && (
                  <button
                    className="ml-2 min-h-11 underline"
                    onClick={() => void ThucHien(() => RutLoiMoi(Moi.Id))}
                  >
                    Rút lời mời
                  </button>
                )}
              </p>
            )}
          </div>
        );
      })}
      <label className="block text-sm">
        Ghi chú bàn giao cho người nhận
        <textarea
          className="mt-1 min-h-20 w-full rounded border border-rail bg-case p-2"
          maxLength={500}
          value={GhiChu}
          onChange={(SuKien) => SetGhiChu(SuKien.target.value)}
        />
      </label>
      <button
        className="min-h-11 rounded border border-rail px-3 disabled:opacity-50"
        disabled={!NguoiNhan.length || GhiChu.trim().length < 3}
        onClick={() =>
          void ThucHien(() =>
            GuiLoiMoi(Phien.PhienId, PhuongAn.Id, NguoiNhan, GhiChu),
          )
        }
      >
        {DangGui ? "Đang gửi…" : "Gửi lời mời thay ca"}
      </button>
      {Loi && (
        <p role="alert" className="text-tally">
          {Loi}
        </p>
      )}
    </fieldset>
  );
}
