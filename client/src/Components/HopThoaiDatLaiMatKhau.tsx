import { useState } from "react";
import { toast } from "sonner";
import { HopThoaiBieuMau } from "./HopThoaiBieuMau";
import { Api } from "../Services/Api";
import { LayThongBaoLoi } from "../Services/XacThucService";

export function HopThoaiDatLaiMatKhau({
  NguoiDungId,
  HoTen,
  OnDong,
}: {
  NguoiDungId: string;
  HoTen: string;
  OnDong: () => void;
}) {
  const [MatKhau, SetMatKhau] = useState("");
  const [XacNhanMatKhau, SetXacNhanMatKhau] = useState("");
  const [Loi, SetLoi] = useState("");
  const [DangLuu, SetDangLuu] = useState(false);
  return (
    <HopThoaiBieuMau
      TieuDe="Đặt lại mật khẩu"
      DangXuLy={DangLuu}
      OnDong={OnDong}
    >
      <form
        className="mt-5 space-y-4"
        onSubmit={async (SuKien) => {
          SuKien.preventDefault();
          SetLoi("");
          if (MatKhau !== XacNhanMatKhau) {
            SetLoi("Mật khẩu xác nhận không khớp.");
            return;
          }
          if (new TextEncoder().encode(MatKhau).length > 72) {
            SetLoi("Mật khẩu không được quá 72 byte.");
            return;
          }
          SetDangLuu(true);
          try {
            await Api.post(`/nhan-su/${NguoiDungId}/dat-lai-mat-khau`, {
              MatKhau,
              XacNhanMatKhau,
            });
            toast.success(
              "Đã đặt lại mật khẩu và kết thúc các phiên đăng nhập cũ.",
            );
            OnDong();
          } catch (LoiLuu) {
            SetLoi(LayThongBaoLoi(LoiLuu));
          } finally {
            SetDangLuu(false);
          }
        }}
      >
        <p className="text-sm text-fog">
          Đặt mật khẩu mới cho {HoTen}. Các phiên đăng nhập cũ sẽ hết hiệu lực.
        </p>
        <label className="block">
          <span className="mb-2 block">Mật khẩu mới</span>
          <input
            autoComplete="new-password"
            type="password"
            required
            minLength={6}
            maxLength={72}
            disabled={DangLuu}
            className="h-11 w-full rounded border border-rail bg-case-2 px-3"
            value={MatKhau}
            onChange={(SuKien) => SetMatKhau(SuKien.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block">Xác nhận mật khẩu mới</span>
          <input
            autoComplete="new-password"
            type="password"
            required
            minLength={6}
            maxLength={72}
            disabled={DangLuu}
            className="h-11 w-full rounded border border-rail bg-case-2 px-3"
            value={XacNhanMatKhau}
            onChange={(SuKien) => SetXacNhanMatKhau(SuKien.target.value)}
          />
        </label>
        {Loi && (
          <p role="alert" className="text-sm text-tally">
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
            disabled={DangLuu}
            className="rounded bg-tally px-4"
          >
            {DangLuu ? "Đang lưu…" : "Xác nhận đặt lại"}
          </button>
        </div>
      </form>
    </HopThoaiBieuMau>
  );
}
