import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import {
  CoQuyen,
  QuyenTrang,
  CacMucCaiDat,
  NhanLoaiTaiKhoan,
} from "../Services/QuyenService";
import { AnhDaiDien } from "../Components/AnhDaiDien";
import {
  CalendarDays,
  Clapperboard,
  Building2,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Package,
  Warehouse,
  Users,
  UserRound,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useXacThuc } from "../Contexts/XacThucContext";
import { useCauHinhHeThong } from "../Contexts/CauHinhHeThongContext";

const CacMucDieuHuong = [
  ["/bang-dieu-khien", "Tổng quan", LayoutDashboard],
  ["/lich-ca-quay", "Lịch ca quay", CalendarDays],
  ["/mobile/ca-quay-cua-toi", "Ca quay của tôi", Clapperboard],
  ["/kho-thiet-bi", "Kho thiết bị", Package],
  ["/studio", "Studio", Building2],
  ["/du-an", "Dự án", FolderKanban],
  ["/nhan-su", "Nhân sự", Users],
  ["/nhat-ky-su-co", "Nhật ký và sự cố", ClipboardList],
] as const;

function LopLienKet({ isActive: IsActive }: { isActive: boolean }) {
  return `flex min-h-11 items-center gap-3 rounded px-3 py-2.5 text-sm transition ${
    IsActive
      ? "bg-tally text-paper"
      : "text-fog hover:bg-case-2 hover:text-paper"
  }`;
}

export function AppLayout() {
  const { NguoiDung: NguoiDung, DangXuat: DangXuat } = useXacThuc();
  const { CauHinh, Logo } = useCauHinhHeThong();
  const DieuHuong = useNavigate();
  const [MoMenu, SetMoMenu] = useState(false);
  const CacMucBanDau = CoQuyen(NguoiDung, "Kho.Xem")
    ? [
        ...CacMucDieuHuong.slice(0, 5),
        ["/kho", "Kho", Warehouse] as const,
        ...CacMucDieuHuong.slice(5),
      ]
    : CacMucDieuHuong;

  // Nhân viên kho vận hành mọi ca: mục ca quay trở thành điểm xuất, nhập kho.
  const KhoToanDonVi = CoQuyen(NguoiDung, "VanHanhKho.ToanDonVi");
  const CacMucHienThi = [
    ...CacMucBanDau.filter(
      ([DuongDan]) =>
        !QuyenTrang(DuongDan) || CoQuyen(NguoiDung, QuyenTrang(DuongDan)!),
    ).map(([DuongDan, Nhan, BieuTuong]) =>
      DuongDan === "/mobile/ca-quay-cua-toi" && KhoToanDonVi
        ? ([DuongDan, "Xuất nhập kho", BieuTuong] as const)
        : ([DuongDan, Nhan, BieuTuong] as const),
    ),

    ...(CacMucCaiDat(NguoiDung).length
      ? [["/cai-dat", "Cài đặt", Settings] as const]
      : []),
  ];
  const CacMucNhanh = [
    CacMucHienThi.find(([DuongDan]) => DuongDan === "/bang-dieu-khien"),
    CacMucHienThi.find(([DuongDan]) => DuongDan === "/mobile/ca-quay-cua-toi"),
    CacMucHienThi.find(([DuongDan]) => DuongDan === "/kho-thiet-bi"),
  ].filter((Muc) => Muc !== undefined);
  function XuLyDangXuat() {
    DangXuat();
    toast.success("Đã đăng xuất.");
    DieuHuong("/dang-nhap", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gunmetal xl:grid xl:grid-cols-[248px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-rail bg-case p-5 xl:flex">
        <div className="mb-6 flex items-center gap-3 px-1">
          <img
            src={Logo}
            alt=""
            className="size-9 shrink-0 rounded-full object-cover"
            height={36}
            width={36}
          />
          <h1 className="truncate text-xl font-bold">{CauHinh.TenHeThong}</h1>
        </div>
        <nav
          aria-label="Điều hướng chính"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto"
        >
          {CacMucHienThi.map(([DuongDan, Nhan, BieuTuong]) => (
            <NavLink className={LopLienKet} key={DuongDan} to={DuongDan}>
              <BieuTuong aria-hidden size={18} />
              {Nhan}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-rail pt-4">
          <NavLink
            to="/ho-so-ca-nhan"
            aria-label="Mở hồ sơ cá nhân"
            className="flex min-h-14 items-center gap-3 rounded p-1 hover:bg-case-2"
          >
            <AnhDaiDien
              HoTen={NguoiDung?.HoTen ?? ""}
              DuongDan={NguoiDung?.AnhDaiDienUrl}
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {NguoiDung?.HoTen}
              </span>
              <span className="mt-1 block truncate text-xs text-fog">
                {NhanLoaiTaiKhoan(NguoiDung, CauHinh.TenHeThong)}
              </span>
            </span>
          </NavLink>

          <button
            className="mt-3 flex min-h-11 w-full items-center gap-3 rounded border border-rail px-3 text-sm text-fog transition hover:bg-case-2 hover:text-paper"
            onClick={XuLyDangXuat}
            type="button"
          >
            <LogOut aria-hidden size={17} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="min-w-0 xl:col-start-2">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-rail bg-case/95 px-4 backdrop-blur xl:hidden">
          <NavLink
            to="/ho-so-ca-nhan"
            aria-label="Mở hồ sơ cá nhân"
            className="flex min-w-0 items-center gap-3 rounded py-1 pr-2"
          >
            <img
              src={Logo}
              alt=""
              className="size-9 shrink-0 rounded-full object-cover"
              height={36}
              width={36}
            />
            <span className="min-w-0">
              <span className="block truncate text-base font-bold">
                {CauHinh.TenHeThong}
              </span>
              <span className="block truncate text-xs text-fog">
                {NguoiDung?.HoTen}
              </span>
            </span>
          </NavLink>
          <button
            aria-label="Đăng xuất"
            className="grid size-11 place-items-center rounded border border-rail text-fog hover:bg-case-2 hover:text-paper"
            onClick={XuLyDangXuat}
            type="button"
          >
            <LogOut aria-hidden size={18} />
          </button>
        </header>

        <main className="min-w-0 noi-dung-ung-dung p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-7 md:pb-[calc(6rem+env(safe-area-inset-bottom))] xl:pb-7">
          <Outlet />
        </main>

        <nav
          aria-label="Điều hướng chính trên thiết bị nhỏ"
          className="fixed inset-x-0 bottom-0 z-20 flex border-t border-rail bg-case/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur xl:hidden"
        >
          {CacMucNhanh.map(([DuongDan, Nhan, BieuTuong]) => (
            <NavLink
              className={({ isActive: IsActive }) =>
                `flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 text-[10px] ${
                  IsActive ? "text-tally" : "text-fog"
                }`
              }
              key={DuongDan}
              to={DuongDan}
            >
              <BieuTuong aria-hidden size={19} />
              <span className="whitespace-nowrap">{Nhan}</span>
            </NavLink>
          ))}
          <button
            type="button"
            className="flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] text-fog"
            onClick={() => SetMoMenu(true)}
            aria-label="Mở toàn bộ điều hướng"
          >
            <Menu size={19} />
            Thêm
          </button>
        </nav>
        <Dialog.Root open={MoMenu} onOpenChange={SetMoMenu}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-30 bg-black/60" />
            <Dialog.Content
              aria-describedby={undefined}
              className="fixed inset-y-0 right-0 z-40 w-[min(100%,360px)] overflow-y-auto border-l border-rail bg-case p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <Dialog.Title className="font-serif text-xl">
                  Điều hướng
                </Dialog.Title>
                <Dialog.Close
                  className="grid size-11 place-items-center"
                  aria-label="Đóng điều hướng"
                >
                  <X size={20} />
                </Dialog.Close>
              </div>
              <nav aria-label="Toàn bộ chức năng" className="space-y-1">
                {CacMucHienThi.map(([DuongDan, Nhan, BieuTuong]) => (
                  <NavLink
                    key={DuongDan}
                    to={DuongDan}
                    className={LopLienKet}
                    onClick={() => SetMoMenu(false)}
                  >
                    <BieuTuong aria-hidden size={18} />
                    {Nhan}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-4 border-t border-rail pt-4">
                <NavLink
                  to="/ho-so-ca-nhan"
                  className={LopLienKet}
                  onClick={() => SetMoMenu(false)}
                >
                  <UserRound aria-hidden size={18} />
                  Hồ sơ cá nhân
                </NavLink>
              </div>
              <button
                type="button"
                className="mt-2 flex min-h-11 w-full items-center gap-3 rounded px-3 text-fog hover:bg-case-2 hover:text-paper"
                onClick={XuLyDangXuat}
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
