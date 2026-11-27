import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import LogoTron from "../../assets/Logo2.png";
import { useCauHinhHeThong } from "../Contexts/CauHinhHeThongContext";
import { useXacThuc } from "../Contexts/XacThucContext";
import { LuuCauHinhHeThong } from "../Services/CauHinhHeThongService";
import { LayThongBaoLoi } from "../Services/XacThucService";

const LopNhap =
  "mt-2 min-h-11 w-full rounded border border-rail bg-case-2 px-3 text-paper";
const DinhDangLogo = "image/jpeg,image/png,image/webp,image/gif";
const DungLuongToiDa = 5 * 1024 * 1024;

export function CaiDatHeThong() {
  const { CauHinh, Logo, CapNhatCauHinh } = useCauHinhHeThong();
  const { LamMoiNguoiDung } = useXacThuc();
  const [BanNhap, SetBanNhap] = useState({
    TenHeThong: CauHinh.TenHeThong,
    KhauHieu: CauHinh.KhauHieu ?? "",
    EmailHoTro: CauHinh.EmailHoTro ?? "",
    SoDienThoaiHoTro: CauHinh.SoDienThoaiHoTro ?? "",
  });
  const [TepLogo, SetTepLogo] = useState<File | null>(null);
  const [XemTruoc, SetXemTruoc] = useState<string | null>(null);
  const [XoaLogo, SetXoaLogo] = useState(false);
  const [Loi, SetLoi] = useState("");
  const [DangLuu, SetDangLuu] = useState(false);

  function DatLaiBanNhap() {
    SetBanNhap({
      TenHeThong: CauHinh.TenHeThong,
      KhauHieu: CauHinh.KhauHieu ?? "",
      EmailHoTro: CauHinh.EmailHoTro ?? "",
      SoDienThoaiHoTro: CauHinh.SoDienThoaiHoTro ?? "",
    });
    SetTepLogo(null);
    SetXoaLogo(false);
    SetLoi("");
  }

  useEffect(DatLaiBanNhap, [CauHinh]);

  useEffect(() => {
    if (!TepLogo) {
      SetXemTruoc(null);
      return;
    }
    const DuongDan = URL.createObjectURL(TepLogo);
    SetXemTruoc(DuongDan);
    return () => URL.revokeObjectURL(DuongDan);
  }, [TepLogo]);

  const LogoHienThi = XemTruoc ?? (XoaLogo ? LogoTron : Logo);

  async function Luu(SuKien: FormEvent) {
    SuKien.preventDefault();
    SetDangLuu(true);
    SetLoi("");
    try {
      const KetQua = await LuuCauHinhHeThong({ ...BanNhap, TepLogo, XoaLogo });
      CapNhatCauHinh(KetQua);
      await LamMoiNguoiDung();
      toast.success("Đã lưu cài đặt hệ thống.");
    } catch (LoiLuu) {
      SetLoi(LayThongBaoLoi(LoiLuu));
    } finally {
      SetDangLuu(false);
    }
  }

  return (
    <section className="max-w-3xl space-y-5">
      <div>
        <h1 className="font-serif text-2xl">Cài đặt hệ thống</h1>
        <p className="mt-2 text-sm text-fog">
          Tên và logo được dùng cho tiêu đề trang, biểu tượng trình duyệt, thanh
          điều hướng của mọi đơn vị và tên hiển thị của tài khoản hệ thống.
        </p>
      </div>
      {Loi && (
        <p role="alert" className="text-sm text-tally">
          {Loi}
        </p>
      )}
      <form
        className="space-y-5 rounded border border-rail bg-case p-5"
        onSubmit={(SuKien) => void Luu(SuKien)}
      >
        <fieldset disabled={DangLuu} className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <img
              src={LogoHienThi}
              alt="Logo website"
              className="size-20 rounded-full border border-rail object-cover"
              height={80}
              width={80}
            />
            <div className="space-y-2">
              <label className="inline-flex min-h-11 cursor-pointer items-center rounded border border-rail px-4 text-sm hover:bg-case-2">
                Chọn logo mới
                <input
                  type="file"
                  accept={DinhDangLogo}
                  className="sr-only"
                  onChange={(SuKien) => {
                    const Tep = SuKien.target.files?.[0] ?? null;
                    SuKien.target.value = "";
                    if (!Tep) return;
                    if (Tep.size > DungLuongToiDa) {
                      SetLoi("Logo không được vượt quá 5 MB.");
                      return;
                    }
                    SetLoi("");
                    SetTepLogo(Tep);
                    SetXoaLogo(false);
                  }}
                />
              </label>
              {(TepLogo || (CauHinh.LogoUrl && !XoaLogo)) && (
                <button
                  type="button"
                  className="ml-3 min-h-11 px-3 text-sm text-tally"
                  onClick={() => {
                    SetTepLogo(null);
                    SetXoaLogo(Boolean(CauHinh.LogoUrl));
                  }}
                >
                  Dùng logo mặc định
                </button>
              )}
              <p className="text-xs text-fog">
                JPG, PNG, WEBP hoặc GIF, tối đa 5 MB. Ảnh chỉ được tải lên khi
                bấm Lưu.
              </p>
            </div>
          </div>
          <label className="block text-sm">
            Tên website *
            <input
              className={LopNhap}
              required
              minLength={2}
              maxLength={60}
              value={BanNhap.TenHeThong}
              onChange={(SuKien) =>
                SetBanNhap({ ...BanNhap, TenHeThong: SuKien.target.value })
              }
            />
          </label>
          <label className="block text-sm">
            Khẩu hiệu
            <input
              className={LopNhap}
              maxLength={200}
              placeholder="Ví dụ: Điều phối sản xuất truyền thông"
              value={BanNhap.KhauHieu}
              onChange={(SuKien) =>
                SetBanNhap({ ...BanNhap, KhauHieu: SuKien.target.value })
              }
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Email hỗ trợ
              <input
                type="email"
                className={LopNhap}
                value={BanNhap.EmailHoTro}
                onChange={(SuKien) =>
                  SetBanNhap({ ...BanNhap, EmailHoTro: SuKien.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Số điện thoại hỗ trợ
              <input
                inputMode="tel"
                className={LopNhap}
                value={BanNhap.SoDienThoaiHoTro}
                onChange={(SuKien) =>
                  SetBanNhap({
                    ...BanNhap,
                    SoDienThoaiHoTro: SuKien.target.value,
                  })
                }
              />
            </label>
          </div>
        </fieldset>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={DangLuu}
            className="min-h-11 rounded border border-rail px-4"
            onClick={DatLaiBanNhap}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={DangLuu}
            className="min-h-11 rounded bg-tally px-4 text-white"
          >
            {DangLuu ? "Đang lưu…" : "Lưu cài đặt"}
          </button>
        </div>
      </form>
    </section>
  );
}
