import * as Dialog from "@radix-ui/react-dialog";
import { Building2, Pencil, Plus, Power, PowerOff, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HopThoaiXacNhan } from "../Components/HopThoaiXacNhan";
import {
  CapNhatDonVi,
  LayDanhSachDonVi,
  TaoDonVi,
} from "../Services/DonViService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type { DonVi, DuLieuDonVi, DuLieuTaoDonVi } from "../Types/DonVi";

const DonViMacDinh: DuLieuDonVi = {
  MaDonVi: "",
  TenDonVi: "",
  Email: "",
  SoDienThoai: "",
  DiaChi: "",
};

const QuanLyMacDinh: DuLieuTaoDonVi["QuanLy"] = {
  TenDangNhap: "",
  MatKhau: "",
  HoTen: "",
  Email: "",
  SoDienThoai: "",
};

function BoGiaTriRong(DuLieu: DuLieuDonVi): DuLieuDonVi {
  const SoDienThoai = DuLieu.SoDienThoai?.replace(/[\s.\-()]/g, "").trim();
  return {
    MaDonVi: DuLieu.MaDonVi.trim(),
    TenDonVi: DuLieu.TenDonVi.trim(),
    ...(DuLieu.Email?.trim() ? { Email: DuLieu.Email.trim() } : {}),
    ...(SoDienThoai ? { SoDienThoai } : {}),
    ...(DuLieu.DiaChi?.trim() ? { DiaChi: DuLieu.DiaChi.trim() } : {}),
    ...(DuLieu.DangHoatDong === undefined
      ? {}
      : { DangHoatDong: DuLieu.DangHoatDong }),
  };
}

export function QuanTriDonVi() {
  const [DanhSach, SetDanhSach] = useState<DonVi[]>([]);
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");
  const [DangGui, SetDangGui] = useState(false);
  const [DangTao, SetDangTao] = useState(false);
  const [DonViDangSua, SetDonViDangSua] = useState<DonVi | null>(null);
  const [DonViDoiTrangThai, SetDonViDoiTrangThai] = useState<DonVi | null>(
    null,
  );
  const [DuLieuDonVi, SetDuLieuDonVi] = useState<DuLieuDonVi>(DonViMacDinh);
  const [DuLieuQuanLy, SetDuLieuQuanLy] =
    useState<DuLieuTaoDonVi["QuanLy"]>(QuanLyMacDinh);
  const PhanTuMoBieuMau = useRef<HTMLElement | null>(null);

  async function TaiDanhSach() {
    SetDangTai(true);
    SetLoi("");
    try {
      SetDanhSach(await LayDanhSachDonVi());
    } catch (LoiTai) {
      SetLoi(LayThongBaoLoi(LoiTai));
    } finally {
      SetDangTai(false);
    }
  }

  useEffect(() => {
    void TaiDanhSach();
  }, []);

  function MoTaoMoi() {
    PhanTuMoBieuMau.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    SetDuLieuDonVi(DonViMacDinh);
    SetDuLieuQuanLy(QuanLyMacDinh);
    SetDangTao(true);
  }

  function MoChinhSua(DonVi: DonVi) {
    PhanTuMoBieuMau.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    SetDuLieuDonVi({
      MaDonVi: DonVi.MaDonVi,
      TenDonVi: DonVi.TenDonVi,
      Email: DonVi.Email ?? "",
      SoDienThoai: DonVi.SoDienThoai ?? "",
      DiaChi: DonVi.DiaChi ?? "",
      DangHoatDong: DonVi.DangHoatDong,
    });
    SetDonViDangSua(DonVi);
  }

  function TraFocusVePhanTuMo() {
    requestAnimationFrame(() => PhanTuMoBieuMau.current?.focus());
  }

  function DongBieuMauTao() {
    SetDangTao(false);
    TraFocusVePhanTuMo();
  }

  function DongBieuMauChinhSua() {
    SetDonViDangSua(null);
    TraFocusVePhanTuMo();
  }

  async function XuLyTao(EventNoiBo: React.FormEvent) {
    EventNoiBo.preventDefault();
    SetDangGui(true);
    try {
      await TaoDonVi({
        DonVi: BoGiaTriRong(DuLieuDonVi),
        QuanLy: {
          ...DuLieuQuanLy,
          SoDienThoai:
            DuLieuQuanLy.SoDienThoai?.replace(/[\s.\-()]/g, "").trim() ||
            undefined,
        },
      });
      toast.success("Đã tạo đơn vị và tài khoản Quản trị viên đơn vị.");
      DongBieuMauTao();
      await TaiDanhSach();
    } catch (LoiTao) {
      toast.error(LayThongBaoLoi(LoiTao));
    } finally {
      SetDangGui(false);
    }
  }

  async function XuLyCapNhat(EventNoiBo: React.FormEvent) {
    EventNoiBo.preventDefault();
    if (!DonViDangSua) return;
    SetDangGui(true);
    try {
      await CapNhatDonVi(DonViDangSua.Id, BoGiaTriRong(DuLieuDonVi));
      toast.success("Đã cập nhật thông tin đơn vị.");
      DongBieuMauChinhSua();
      await TaiDanhSach();
    } catch (LoiCapNhat) {
      toast.error(LayThongBaoLoi(LoiCapNhat));
    } finally {
      SetDangGui(false);
    }
  }

  async function XuLyDoiTrangThai() {
    if (!DonViDoiTrangThai) return;
    SetDangGui(true);
    try {
      await CapNhatDonVi(DonViDoiTrangThai.Id, {
        MaDonVi: DonViDoiTrangThai.MaDonVi,
        TenDonVi: DonViDoiTrangThai.TenDonVi,
        Email: DonViDoiTrangThai.Email ?? undefined,
        SoDienThoai: DonViDoiTrangThai.SoDienThoai ?? undefined,
        DiaChi: DonViDoiTrangThai.DiaChi ?? undefined,
        DangHoatDong: !DonViDoiTrangThai.DangHoatDong,
      });
      toast.success(
        DonViDoiTrangThai.DangHoatDong
          ? "Đã vô hiệu hóa đơn vị."
          : "Đã kích hoạt đơn vị.",
      );
      SetDonViDoiTrangThai(null);
      await TaiDanhSach();
    } catch (LoiCapNhat) {
      toast.error(LayThongBaoLoi(LoiCapNhat));
    } finally {
      SetDangGui(false);
    }
  }

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl">Quản lý đơn vị</h1>
          <p className="mt-2 max-w-2xl text-sm text-fog">
            Khởi tạo không gian riêng cho từng đơn vị và quản lý trạng thái truy
            cập hệ thống.
          </p>
        </div>
        <button
          className="flex min-h-11 items-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold text-white"
          onClick={MoTaoMoi}
          type="button"
        >
          <Plus aria-hidden size={17} />
          Tạo đơn vị
        </button>
      </header>

      {DangTai ? (
        <p className="py-12 text-center text-fog" role="status">
          Đang tải danh sách đơn vị…
        </p>
      ) : Loi ? (
        <div className="rounded border border-tally/60 bg-tally/10 p-4 text-sm">
          {Loi}
        </div>
      ) : DanhSach.length === 0 ? (
        <div className="rounded border border-rail bg-case p-8 text-center text-fog">
          Chưa có đơn vị nào. Hãy tạo đơn vị đầu tiên.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-rail">
          <table className="bang-the-di-dong min-w-full text-left text-sm">
            <thead className="bg-case text-xs uppercase text-fog">
              <tr>
                <th className="p-4">Đơn vị</th>
                <th className="p-4">Quản lý chính</th>
                <th className="p-4">Tài khoản</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {DanhSach.map((DonVi) => {
                const QuanLy = DonVi.DanhSachNguoiDung[0];
                return (
                  <tr className="border-t border-rail" key={DonVi.Id}>
                    <td data-label="Đơn vị" className="p-4">
                      <div className="flex items-start gap-3">
                        <Building2
                          className="mt-0.5 text-blueprint"
                          size={18}
                        />
                        <div>
                          <p className="font-semibold">{DonVi.TenDonVi}</p>
                          <p className="mt-1 font-mono text-xs text-fog">
                            {DonVi.MaDonVi}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td data-label="Quản lý chính" className="p-4">
                      {QuanLy ? (
                        <>
                          <p>{QuanLy.HoTen}</p>
                          <p className="mt-1 text-xs text-fog">
                            {QuanLy.Email}
                          </p>
                        </>
                      ) : (
                        <span className="text-timecode">Chưa có quản lý</span>
                      )}
                    </td>
                    <td
                      data-label="Tài khoản"
                      className="p-4 font-mono text-fog"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Users aria-hidden size={15} />
                        {DonVi._count.DanhSachNguoiDung}
                      </span>
                    </td>
                    <td data-label="Trạng thái" className="p-4">
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          DonVi.DangHoatDong
                            ? "bg-phosphor/20 text-phosphor"
                            : "bg-tally/20 text-tally"
                        }`}
                      >
                        {DonVi.DangHoatDong
                          ? "Đang hoạt động"
                          : "Đã vô hiệu hóa"}
                      </span>
                    </td>
                    <td data-label="Thao tác" className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`Chỉnh sửa ${DonVi.TenDonVi}`}
                          className="grid size-11 place-items-center rounded border border-rail text-fog hover:bg-case-2 hover:text-paper"
                          onClick={() => MoChinhSua(DonVi)}
                          type="button"
                        >
                          <Pencil aria-hidden size={16} />
                        </button>
                        <button
                          aria-label={`${DonVi.DangHoatDong ? "Vô hiệu hóa" : "Kích hoạt"} ${DonVi.TenDonVi}`}
                          className={`grid size-11 place-items-center rounded border border-rail ${
                            DonVi.DangHoatDong ? "text-tally" : "text-phosphor"
                          }`}
                          onClick={() => SetDonViDoiTrangThai(DonVi)}
                          type="button"
                        >
                          {DonVi.DangHoatDong ? (
                            <PowerOff aria-hidden size={16} />
                          ) : (
                            <Power aria-hidden size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {DangTao && (
        <BieuMauDonVi
          DangGui={DangGui}
          DuLieuDonVi={DuLieuDonVi}
          DuLieuQuanLy={DuLieuQuanLy}
          LaTaoMoi
          OnDong={DongBieuMauTao}
          OnDoiDonVi={SetDuLieuDonVi}
          OnDoiQuanLy={SetDuLieuQuanLy}
          OnSubmit={XuLyTao}
        />
      )}
      {DonViDangSua && (
        <BieuMauDonVi
          DangGui={DangGui}
          DuLieuDonVi={DuLieuDonVi}
          OnDong={DongBieuMauChinhSua}
          OnDoiDonVi={SetDuLieuDonVi}
          OnSubmit={XuLyCapNhat}
        />
      )}
      {DonViDoiTrangThai && (
        <HopThoaiXacNhan
          TieuDe={
            DonViDoiTrangThai.DangHoatDong
              ? "Vô hiệu hóa đơn vị"
              : "Kích hoạt đơn vị"
          }
          MoTa={
            DonViDoiTrangThai.DangHoatDong
              ? `Người dùng của ${DonViDoiTrangThai.TenDonVi} sẽ không thể tiếp tục truy cập ứng dụng nghiệp vụ.`
              : `Người dùng của ${DonViDoiTrangThai.TenDonVi} sẽ có thể đăng nhập trở lại.`
          }
          NhanXacNhan={
            DonViDoiTrangThai.DangHoatDong ? "Vô hiệu hóa" : "Kích hoạt"
          }
          DangXuLy={DangGui}
          OnHuy={() => SetDonViDoiTrangThai(null)}
          OnXacNhan={() => void XuLyDoiTrangThai()}
        />
      )}
    </section>
  );
}

function BieuMauDonVi({
  DuLieuDonVi: DuLieuDonVi,
  DuLieuQuanLy: DuLieuQuanLy,
  LaTaoMoi: LaTaoMoi = false,
  DangGui: DangGui,
  OnDoiDonVi: OnDoiDonVi,
  OnDoiQuanLy: OnDoiQuanLy,
  OnDong: OnDong,
  OnSubmit: OnSubmit,
}: {
  DuLieuDonVi: DuLieuDonVi;
  DuLieuQuanLy?: DuLieuTaoDonVi["QuanLy"];
  LaTaoMoi?: boolean;
  DangGui: boolean;
  OnDoiDonVi: (DuLieu: DuLieuDonVi) => void;
  OnDoiQuanLy?: (DuLieu: DuLieuTaoDonVi["QuanLy"]) => void;
  OnDong: () => void;
  OnSubmit: (EventNoiBo: React.FormEvent) => void;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(DangMo) => {
        if (!DangMo && !DangGui) OnDong();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-black/60" />
        <Dialog.Content asChild>
          <form
            autoComplete="off"
            className="hop-thoai-bieu-mau fixed top-4 left-1/2 z-40 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-y-auto rounded border border-rail bg-case p-5 shadow-2xl"
            onSubmit={OnSubmit}
          >
            <Dialog.Title asChild>
              <h2 className="font-serif text-xl">
                {LaTaoMoi ? "Tạo đơn vị mới" : "Chỉnh sửa đơn vị"}
              </h2>
            </Dialog.Title>
            <Dialog.Description asChild>
              <p className="mt-2 text-sm text-fog">
                {LaTaoMoi
                  ? "Đơn vị và tài khoản Quản trị viên đơn vị sẽ được tạo cùng lúc."
                  : "Cập nhật thông tin nhận diện và liên hệ của đơn vị."}
              </p>
            </Dialog.Description>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TruongNhap
                BatBuoc
                TenTruong="maDonVi"
                Nhan="Mã đơn vị"
                GiaTri={DuLieuDonVi.MaDonVi}
                OnDoi={(GiaTri) =>
                  OnDoiDonVi({ ...DuLieuDonVi, MaDonVi: GiaTri })
                }
              />
              <TruongNhap
                BatBuoc
                TenTruong="tenDonVi"
                Nhan="Tên đơn vị"
                GiaTri={DuLieuDonVi.TenDonVi}
                OnDoi={(GiaTri) =>
                  OnDoiDonVi({ ...DuLieuDonVi, TenDonVi: GiaTri })
                }
              />
              <TruongNhap
                GoiYTuDong="off"
                TenTruong="emailLienHeDonVi"
                Nhan="Email liên hệ"
                Loai="email"
                GiaTri={DuLieuDonVi.Email ?? ""}
                OnDoi={(GiaTri) =>
                  OnDoiDonVi({ ...DuLieuDonVi, Email: GiaTri })
                }
              />
              <TruongNhap
                GoiYTuDong="off"
                TenTruong="soDienThoaiDonVi"
                Nhan="Số điện thoại"
                Loai="tel"
                GiaTri={DuLieuDonVi.SoDienThoai ?? ""}
                OnDoi={(GiaTri) =>
                  OnDoiDonVi({ ...DuLieuDonVi, SoDienThoai: GiaTri })
                }
              />
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm">Địa chỉ</span>
                <textarea
                  autoComplete="off"
                  className="min-h-20 w-full rounded border border-rail bg-case-2 px-3 py-2 outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/30"
                  maxLength={500}
                  name="diaChiDonVi"
                  value={DuLieuDonVi.DiaChi ?? ""}
                  onChange={(EventNoiBo) =>
                    OnDoiDonVi({
                      ...DuLieuDonVi,
                      DiaChi: EventNoiBo.target.value,
                    })
                  }
                />
              </label>
            </div>

            {LaTaoMoi && DuLieuQuanLy && OnDoiQuanLy && (
              <>
                <h3 className="mt-7 border-t border-rail pt-5 font-semibold">
                  Quản trị viên đơn vị
                </h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <TruongNhap
                    BatBuoc
                    GoiYTuDong="off"
                    TenTruong="hoTenQuanLy"
                    Nhan="Họ và tên"
                    GiaTri={DuLieuQuanLy.HoTen}
                    OnDoi={(GiaTri) =>
                      OnDoiQuanLy({ ...DuLieuQuanLy, HoTen: GiaTri })
                    }
                  />
                  <TruongNhap
                    BatBuoc
                    GoiYTuDong="off"
                    TenTruong="tenDangNhapQuanLy"
                    Nhan="Tên đăng nhập"
                    GiaTri={DuLieuQuanLy.TenDangNhap}
                    OnDoi={(GiaTri) =>
                      OnDoiQuanLy({ ...DuLieuQuanLy, TenDangNhap: GiaTri })
                    }
                  />
                  <TruongNhap
                    BatBuoc
                    GoiYTuDong="off"
                    TenTruong="emailQuanLy"
                    Nhan="Email"
                    Loai="email"
                    GiaTri={DuLieuQuanLy.Email}
                    OnDoi={(GiaTri) =>
                      OnDoiQuanLy({ ...DuLieuQuanLy, Email: GiaTri })
                    }
                  />
                  <TruongNhap
                    BatBuoc
                    GoiYTuDong="off"
                    TenTruong="soDienThoaiQuanLy"
                    Nhan="Số điện thoại"
                    Loai="tel"
                    GiaTri={DuLieuQuanLy.SoDienThoai ?? ""}
                    OnDoi={(GiaTri) =>
                      OnDoiQuanLy({ ...DuLieuQuanLy, SoDienThoai: GiaTri })
                    }
                  />
                  <TruongNhap
                    BatBuoc
                    GoiYTuDong="new-password"
                    TenTruong="matKhauMoiQuanLy"
                    Nhan="Mật khẩu ban đầu"
                    Loai="password"
                    GiaTri={DuLieuQuanLy.MatKhau}
                    OnDoi={(GiaTri) =>
                      OnDoiQuanLy({ ...DuLieuQuanLy, MatKhau: GiaTri })
                    }
                  />
                </div>
              </>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                className="min-h-11 rounded border border-rail px-4 text-sm text-fog hover:bg-case-2"
                disabled={DangGui}
                onClick={OnDong}
                type="button"
              >
                Hủy
              </button>
              <button
                className="min-h-11 rounded bg-tally px-4 text-sm font-semibold text-white disabled:opacity-60"
                disabled={DangGui}
                type="submit"
              >
                {DangGui
                  ? "Đang lưu…"
                  : LaTaoMoi
                    ? "Tạo đơn vị"
                    : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TruongNhap({
  Nhan: Nhan,
  GiaTri: GiaTri,
  Loai: Loai = "text",
  BatBuoc: BatBuoc = false,
  GoiYTuDong: GoiYTuDong,
  TenTruong: TenTruong,
  OnDoi: OnDoi,
}: {
  Nhan: string;
  GiaTri: string;
  Loai?: "text" | "email" | "tel" | "password";
  BatBuoc?: boolean;
  GoiYTuDong?: string;
  TenTruong: string;
  OnDoi: (GiaTri: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm">
        {Nhan}
        {BatBuoc ? " *" : ""}
      </span>
      <input
        autoComplete={GoiYTuDong}
        className="h-11 w-full rounded border border-rail bg-case-2 px-3 outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/30"
        minLength={BatBuoc ? (Loai === "password" ? 6 : 2) : undefined}
        name={TenTruong}
        required={BatBuoc}
        type={Loai}
        value={GiaTri}
        onChange={(EventNoiBo) => OnDoi(EventNoiBo.target.value)}
      />
    </label>
  );
}
