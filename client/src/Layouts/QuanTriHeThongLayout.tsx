import { Building2, LogOut, Settings,BriefcaseBusiness, Hourglass } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useXacThuc } from "../Contexts/XacThucContext";
import { useCauHinhHeThong } from "../Contexts/CauHinhHeThongContext";

export function QuanTriHeThongLayout() {
  const { DangXuat: DangXuat } = useXacThuc();
  const { CauHinh, Logo } = useCauHinhHeThong();
  const DieuHuong = useNavigate();

  function XuLyDangXuat() {
    DangXuat();
    toast.success("Đã đăng xuất.");
    DieuHuong("/dang-nhap", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gunmetal xl:grid xl:grid-cols-[248px_1fr]">
      <aside className="border-b border-rail bg-case p-5 xl:fixed xl:inset-y-0 xl:left-0 xl:w-[248px] xl:border-r xl:border-b-0">
        <div className="flex items-center gap-3">
          <img
            src={Logo}
            alt=""
            className="size-10 shrink-0 rounded-full object-cover"
            height={40}
            width={40}
          />
          <div className="min-w-0">
            <p className="truncate font-serif text-lg">{CauHinh.TenHeThong}</p>
            {CauHinh.KhauHieu && (
              <p className="truncate text-xs text-fog">{CauHinh.KhauHieu}</p>
            )}
          </div>
        </div>
        <nav
          className="mt-4 flex flex-wrap gap-2 xl:mt-6 xl:block"
          aria-label="Điều hướng quản trị hệ thống"
        >
          <NavLink
            className={({ isActive: IsActive }) =>
              `flex min-h-11 items-center gap-3 rounded px-3 text-sm ${
                IsActive ? "bg-tally text-white" : "text-fog hover:bg-case-2"
              }`
            }
            to="/quan-tri-he-thong/don-vi"
          >
            <Building2 aria-hidden size={18} />
            Đơn vị
          </NavLink>
          <NavLink
            to="/quan-tri-he-thong/chuc-danh"
            className={({ isActive: IsActive }) =>
              `mt-2 flex min-h-11 items-center gap-3 rounded px-3 text-sm ${
                IsActive ? "bg-tally text-white" : "text-fog hover:bg-case-2"
              }`
            }
          >
            <BriefcaseBusiness aria-hidden size={18} />
            Chức danh dùng chung
          </NavLink>
          <NavLink
            to="/quan-tri-he-thong/thoi-gian-cho"
            className="mt-2 flex min-h-11 items-center gap-3 rounded px-3 text-sm text-fog hover:bg-case-2"
          >
            <Hourglass aria-hidden size={18} />
            Thời gian chờ
          </NavLink>
          <NavLink
            to="/quan-tri-he-thong/cai-dat"
            className={({ isActive: IsActive }) =>
              `mt-2 flex min-h-11 items-center gap-3 rounded px-3 text-sm ${
                IsActive ? "bg-tally text-white" : "text-fog hover:bg-case-2"
              }`
            }
          >
            <Settings aria-hidden size={18} />
            Cài đặt hệ thống
          </NavLink>
        </nav>
        <div className="mt-6 border-t border-rail pt-4 xl:absolute xl:right-5 xl:bottom-5 xl:left-5">
      
          <button
            className="mt-3 flex min-h-11 w-full items-center gap-3 rounded border border-rail px-3 text-sm text-fog hover:bg-case-2 hover:text-paper"
            onClick={XuLyDangXuat}
            type="button"
          >
            <LogOut aria-hidden size={17} />
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-7 xl:col-start-2">
        <Outlet />
      </main>
    </div>
  );
}
