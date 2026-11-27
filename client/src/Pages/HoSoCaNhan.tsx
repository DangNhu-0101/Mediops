import { BieuMauKhoangBan } from "../Components/BieuMauKhoangBan";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Camera,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Pencil,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AnhDaiDien } from "../Components/AnhDaiDien";
import { useXacThuc } from "../Contexts/XacThucContext";
import { Api } from "../Services/Api";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { NhanLoaiTaiKhoan } from "../Services/QuyenService";
import { useCauHinhHeThong } from "../Contexts/CauHinhHeThongContext";

const LopNhap =
  "min-h-11 w-full rounded-lg border border-rail bg-case-2 px-3 py-2 text-paper outline-none transition focus:border-paper focus:ring-1 focus:ring-paper disabled:opacity-60";
const LopNut =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rail px-4 text-sm font-medium transition hover:bg-case-2 disabled:cursor-not-allowed disabled:opacity-50";

export function HoSoCaNhan() {
  const { NguoiDung, LamMoiNguoiDung, DangXuat } = useXacThuc();
  const { CauHinh } = useCauHinhHeThong();
  const DieuHuong = useNavigate();
  const GiaTri = () => ({
    HoTen: NguoiDung?.HoTen ?? "",
    TenDangNhap: NguoiDung?.TenDangNhap ?? "",
    Email: NguoiDung?.Email ?? "",
    SoDienThoai: NguoiDung?.SoDienThoai ?? "",
    GioiThieu: NguoiDung?.GioiThieu ?? "",
    CacKhoangKhongKhaDung: NguoiDung?.CacKhoangKhongKhaDung ?? [],
  });
  const [DuLieu, SetDuLieu] = useState(GiaTri);
  const [DangSua, SetDangSua] = useState(false);
  const [DangLuu, SetDangLuu] = useState(false);
  const [Loi, SetLoi] = useState("");
  const [TepAnh, SetTepAnh] = useState<File | null>(null);
  const [AnhXemTruoc, SetAnhXemTruoc] = useState<string | null>(null);
  const [XoaAnh, SetXoaAnh] = useState(false);
  const ChonTep = useRef<HTMLInputElement>(null);
  const [MoMatKhau, SetMoMatKhau] = useState(false);
  const [HienMatKhau, SetHienMatKhau] = useState(false);
  const [DangDoi, SetDangDoi] = useState(false);
  const [LoiMatKhau, SetLoiMatKhau] = useState("");
  const [MatKhau, SetMatKhau] = useState({
    MatKhauHienTai: "",
    MatKhauMoi: "",
    XacNhanMatKhau: "",
  });
  useEffect(() => {
    if (!TepAnh) {
      SetAnhXemTruoc(null);
      return;
    }
    const DuongDan = URL.createObjectURL(TepAnh);
    SetAnhXemTruoc(DuongDan);
    return () => URL.revokeObjectURL(DuongDan);
  }, [TepAnh]);
  function HuyChinhSua() {
    SetDuLieu(GiaTri());
    SetTepAnh(null);
    SetXoaAnh(false);
    SetLoi("");
    SetDangSua(false);
  }
  async function LuuHoSo(SuKien: FormEvent) {
    SuKien.preventDefault();
    SetDangLuu(true);
    SetLoi("");
    try {
      const BieuMau = new FormData();
      Object.entries(DuLieu).forEach(([Truong, GiaTriTruong]) =>
        BieuMau.append(
          Truong,
          typeof GiaTriTruong === "string"
            ? GiaTriTruong
            : JSON.stringify(GiaTriTruong),
        ),
      );
      BieuMau.append("XoaAnh", String(XoaAnh));
      if (TepAnh) BieuMau.append("TepAnh", TepAnh);
      await Api.put("/xac-thuc/thong-tin-ca-nhan", BieuMau);
      await LamMoiNguoiDung();
      SetDangSua(false);
      SetTepAnh(null);
      SetXoaAnh(false);
      toast.success("Đã lưu hồ sơ cá nhân.");
    } catch (LoiLuu) {
      SetLoi(LayThongBaoLoi(LoiLuu));
    } finally {
      SetDangLuu(false);
    }
  }
  async function DoiMatKhau(SuKien: FormEvent) {
    SuKien.preventDefault();
    SetLoiMatKhau("");
    if (MatKhau.MatKhauMoi !== MatKhau.XacNhanMatKhau) {
      SetLoiMatKhau("Mật khẩu xác nhận không khớp.");
      return;
    }
    SetDangDoi(true);
    try {
      await Api.put("/xac-thuc/doi-mat-khau", MatKhau);
      SetMatKhau({ MatKhauHienTai: "", MatKhauMoi: "", XacNhanMatKhau: "" });
      DangXuat();
      toast.success("Đã đổi mật khẩu. Vui lòng đăng nhập lại.");
      DieuHuong("/dang-nhap", { replace: true });
    } catch (LoiDoi) {
      SetLoiMatKhau(LayThongBaoLoi(LoiDoi));
    } finally {
      SetDangDoi(false);
    }
  }
  if (!NguoiDung) return null;
  const DuongDanAnh = AnhXemTruoc ?? (XoaAnh ? null : NguoiDung.AnhDaiDienUrl);
  return (
    <section className="mx-auto max-w-5xl space-y-7">
      <div>
        <h1 className="font-serif text-3xl text-paper">Hồ sơ cá nhân</h1>
        <p className="mt-2 text-sm text-fog">
          Thông tin của bạn và cách đồng nghiệp liên hệ khi phối hợp công việc.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-rail bg-case">
        <div className="h-20 border-b border-rail bg-case-2 sm:h-28" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4 sm:-mt-12">
            <AnhDaiDien
              HoTen={NguoiDung.HoTen}
              DuongDan={DuongDanAnh}
              KichThuoc="size-24 sm:size-28"
              Lop="border-4 border-case text-3xl"
            />
            {!DangSua && (
              <button
                type="button"
                className={LopNut}
                onClick={() => {
                  SetDuLieu(GiaTri());
                  SetDangSua(true);
                }}
              >
                <Pencil size={16} aria-hidden />
                Chỉnh sửa hồ sơ
              </button>
            )}
          </div>
          <h2 className="mt-4 break-words text-2xl font-semibold text-paper">
            {NguoiDung.HoTen}
          </h2>
          <p className="mt-1 break-all text-sm text-fog">
            @{NguoiDung.TenDangNhap}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <span>{NhanLoaiTaiKhoan(NguoiDung, CauHinh.TenHeThong)}</span>
            {NguoiDung.TrinhDo && (
              <span className="text-fog">Trình độ {NguoiDung.TrinhDo}/5</span>
            )}
            <span className="text-fog">{NguoiDung.DonVi?.TenDonVi}</span>
          </div>
          {NguoiDung.GioiThieu && (
            <p className="mt-4 max-w-2xl whitespace-pre-wrap break-words text-sm leading-6 text-fog">
              {NguoiDung.GioiThieu}
            </p>
          )}
        </div>
      </div>
      <div className="grid items-start gap-7 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 rounded-xl border border-rail bg-case p-5 sm:p-7">
          <h2 className="text-lg font-semibold">
            {DangSua ? "Chỉnh sửa thông tin" : "Thông tin cá nhân"}
          </h2>
          <p className="mt-1 text-sm text-fog">
            {DangSua
              ? "Thay đổi chỉ được cập nhật khi bạn bấm Lưu thay đổi."
              : "Quản lý thông tin liên hệ và giới thiệu bản thân."}
          </p>
          {DangSua ? (
            <form onSubmit={LuuHoSo} className="mt-6 space-y-5">
              <fieldset
                disabled={DangLuu}
                className="space-y-5 disabled:opacity-70"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={ChonTep}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    aria-label="Chọn ảnh đại diện"
                    onChange={(SuKien) => {
                      const Tep = SuKien.target.files?.[0];
                      SuKien.target.value = "";
                      if (!Tep) return;
                      if (
                        ![
                          "image/jpeg",
                          "image/png",
                          "image/webp",
                          "image/gif",
                        ].includes(Tep.type) ||
                        Tep.size > 5 * 1024 * 1024
                      ) {
                        SetLoi(
                          "Chọn ảnh JPG, PNG, WEBP hoặc GIF không quá 5 MB.",
                        );
                        return;
                      }
                      SetTepAnh(Tep);
                      SetXoaAnh(false);
                      SetLoi("");
                    }}
                  />
                  <button
                    type="button"
                    className={LopNut}
                    onClick={() => ChonTep.current?.click()}
                  >
                    <Camera size={16} aria-hidden />
                    Đổi ảnh đại diện
                  </button>
                  {DuongDanAnh && (
                    <button
                      type="button"
                      className="min-h-11 px-2 text-sm text-fog hover:text-paper"
                      onClick={() => {
                        SetTepAnh(null);
                        SetXoaAnh(true);
                      }}
                    >
                      Xóa ảnh
                    </button>
                  )}
                  <p className="w-full text-xs text-fog">
                    JPG, PNG, WEBP hoặc GIF · Tối đa 5 MB
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {(
                    [
                      ["HoTen", "Họ và tên", "text", "name"],
                      ["TenDangNhap", "Tên đăng nhập", "text", "username"],
                      ["Email", "Email", "email", "email"],
                      ["SoDienThoai", "Số điện thoại", "tel", "tel"],
                    ] as const
                  ).map(([Truong, Nhan, Loai, TuDong]) => (
                    <label key={Truong} className="block text-sm">
                      <span className="mb-2 block font-medium">{Nhan}</span>
                      <input
                        className={LopNhap}
                        type={Loai}
                        autoComplete={TuDong}
                        value={DuLieu[Truong]}
                        required
                        minLength={
                          Truong === "HoTen"
                            ? 2
                            : Truong === "TenDangNhap"
                              ? 3
                              : undefined
                        }
                        maxLength={
                          Truong === "HoTen"
                            ? 200
                            : Truong === "TenDangNhap"
                              ? 100
                              : Truong === "SoDienThoai"
                                ? 16
                                : 254
                        }
                        onChange={(SuKien) =>
                          SetDuLieu({
                            ...DuLieu,
                            [Truong]: SuKien.target.value,
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                <label className="block text-sm">
                  <span className="mb-2 block font-medium">
                    Giới thiệu bản thân{" "}
                    <span className="font-normal text-fog">
                      (không bắt buộc)
                    </span>
                  </span>
                  <textarea
                    className={`${LopNhap} min-h-28 resize-y`}
                    maxLength={500}
                    value={DuLieu.GioiThieu}
                    onChange={(SuKien) =>
                      SetDuLieu({ ...DuLieu, GioiThieu: SuKien.target.value })
                    }
                  />
                  <span className="mt-1 block text-right text-xs text-fog">
                    {DuLieu.GioiThieu.length}/500 ký tự
                  </span>
                </label>
                <BieuMauKhoangBan
                  GiaTri={DuLieu.CacKhoangKhongKhaDung}
                  OnDoi={(CacKhoangKhongKhaDung) =>
                    SetDuLieu({ ...DuLieu, CacKhoangKhongKhaDung })
                  }
                />
              </fieldset>
              {Loi && (
                <p role="alert" className="text-sm text-tally">
                  {Loi}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-3 border-t border-rail pt-5">
                <button
                  type="button"
                  disabled={DangLuu}
                  className={LopNut}
                  onClick={HuyChinhSua}
                >
                  <X size={16} aria-hidden />
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={DangLuu}
                  className={`${LopNut} border-transparent bg-tally text-paper hover:bg-tally/90`}
                >
                  <Check size={16} aria-hidden />
                  {DangLuu ? "Đang lưu…" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          ) : (
            <dl className="mt-5 divide-y divide-rail">
              {(
                [
                  ["Họ và tên", NguoiDung.HoTen, UserRound],
                  ["Tên đăng nhập", NguoiDung.TenDangNhap, UserRound],
                  ["Email", NguoiDung.Email, Mail],
                  [
                    "Số điện thoại",
                    NguoiDung.SoDienThoai || "Chưa bổ sung",
                    Phone,
                  ],
                ] as const
              ).map(([Nhan, GiaTriTruong, BieuTuong]) => (
                <div key={Nhan} className="flex items-start gap-3 py-4">
                  <BieuTuong
                    size={17}
                    className="mt-1 shrink-0 text-fog"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <dt className="text-xs text-fog">{Nhan}</dt>
                    <dd className="mt-1 break-words text-sm">{GiaTriTruong}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}
        </div>
        <aside className="rounded-xl border border-rail bg-case p-5 sm:p-6">
          <LockKeyhole size={22} className="mb-4 text-fog" aria-hidden />
          <h2 className="text-lg font-semibold">Bảo mật tài khoản</h2>
          <p className="mt-2 text-sm leading-6 text-fog">
            Đổi mật khẩu để bảo vệ tài khoản. Sau khi đổi, bạn cần đăng nhập lại
            trên các thiết bị.
          </p>
          {!MoMatKhau ? (
            <button
              type="button"
              className={`${LopNut} mt-5 w-full`}
              onClick={() => SetMoMatKhau(true)}
            >
              Đổi mật khẩu
            </button>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={DoiMatKhau}>
              <fieldset disabled={DangDoi} className="space-y-4">
                {(
                  [
                    ["MatKhauHienTai", "Mật khẩu hiện tại", "current-password"],
                    ["MatKhauMoi", "Mật khẩu mới", "new-password"],
                    ["XacNhanMatKhau", "Xác nhận mật khẩu mới", "new-password"],
                  ] as const
                ).map(([Truong, Nhan, TuDong]) => (
                  <label className="block text-sm" key={Truong}>
                    <span className="mb-2 block">{Nhan}</span>
                    <input
                      className={LopNhap}
                      type={HienMatKhau ? "text" : "password"}
                      autoComplete={TuDong}
                      required
                      minLength={Truong === "MatKhauHienTai" ? 1 : 6}
                      maxLength={72}
                      value={MatKhau[Truong]}
                      onChange={(SuKien) =>
                        SetMatKhau({
                          ...MatKhau,
                          [Truong]: SuKien.target.value,
                        })
                      }
                    />
                  </label>
                ))}
              </fieldset>
              <button
                type="button"
                aria-pressed={HienMatKhau}
                className="flex min-h-10 items-center gap-2 text-xs text-fog hover:text-paper"
                onClick={() => SetHienMatKhau(!HienMatKhau)}
              >
                {HienMatKhau ? (
                  <EyeOff size={16} aria-hidden />
                ) : (
                  <Eye size={16} aria-hidden />
                )}
                {HienMatKhau ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              </button>
              <p className="text-xs leading-5 text-fog">
                Mật khẩu mới từ 6 đến 72 ký tự, tối đa 72 byte.
              </p>
              {LoiMatKhau && (
                <p role="alert" className="text-sm text-tally">
                  {LoiMatKhau}
                </p>
              )}
              <button
                type="submit"
                disabled={DangDoi}
                className={`${LopNut} w-full bg-tally text-paper hover:bg-tally/90`}
              >
                {DangDoi ? "Đang đổi…" : "Xác nhận đổi mật khẩu"}
              </button>
              <button
                type="button"
                disabled={DangDoi}
                className={`${LopNut} w-full`}
                onClick={() => {
                  SetMoMatKhau(false);
                  SetLoiMatKhau("");
                  SetHienMatKhau(false);
                  SetMatKhau({
                    MatKhauHienTai: "",
                    MatKhauMoi: "",
                    XacNhanMatKhau: "",
                  });
                }}
              >
                Hủy
              </button>
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}
