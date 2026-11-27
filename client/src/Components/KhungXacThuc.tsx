import type { ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CircleCheck,
  QrCode,
  Star,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import LogoTron from "../../assets/Logo2.png";

const CacChiSoMinhHoa = [
  ["Ca quay hôm nay", "12", CalendarDays],
  ["Thiết bị sẵn sàng", "86%", Camera],
  ["Nhân sự trực", "24", UsersRound],
] as const;

const CacCaQuayMinhHoa = [
  ["MV Ánh sáng", "Studio A", "08:00", "w-[62%]", "bg-tally"],
  ["Phỏng vấn nghệ sĩ", "Studio B", "13:30", "w-[44%]", "bg-blueprint"],
  ["TVC Sản phẩm", "Ngoại cảnh", "15:00", "w-[78%]", "bg-timecode"],
] as const;

// Minh họa giao diện dịch vụ web trong khung trình duyệt.
function MinhHoaDichVu() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-xl">
      <div className="overflow-hidden rounded-xl border border-rail bg-gunmetal/90 shadow-[0_40px_90px_rgb(4_5_6/55%)]">
        <div className="flex items-center gap-2 border-b border-rail bg-case-2 px-4 py-3">
          <span className="size-2.5 rounded-full bg-tally/80" />
          <span className="size-2.5 rounded-full bg-timecode/80" />
          <span className="size-2.5 rounded-full bg-phosphor/80" />
          <span className="ml-3 flex-1 truncate rounded-full border border-rail bg-gunmetal px-3 py-1 font-mono text-[11px] text-fog">
            MEDIOPS · Bảng điều khiển
          </span>
        </div>
        <div className="grid gap-4 p-5">
          <div className="grid grid-cols-3 gap-3">
            {CacChiSoMinhHoa.map(([Nhan, GiaTri, BieuTuong]) => (
              <div
                className="rounded-lg border border-rail bg-case p-3"
                key={Nhan}
              >
                <BieuTuong className="text-tally" size={16} />
                <p className="mt-2 font-serif text-2xl leading-none">
                  {GiaTri}
                </p>
                <p className="mt-1 truncate text-[11px] text-fog">{Nhan}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-rail bg-case p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold">Lịch ca quay hôm nay</p>
              <p className="font-mono text-[10px] text-fog">THỨ SÁU</p>
            </div>
            <div className="grid gap-3">
              {CacCaQuayMinhHoa.map(([Ten, NoiQuay, Gio, DoRong, Mau]) => (
                <div
                  className="grid grid-cols-[52px_1fr] items-center gap-3"
                  key={Ten}
                >
                  <span className="font-mono text-[11px] text-fog">{Gio}</span>
                  <div className="rounded-md bg-case-2 p-1">
                    <div className={`${DoRong} ${Mau} rounded px-2 py-1.5`}>
                      <p className="truncate text-[11px] font-semibold text-paper">
                        {Ten}
                      </p>
                      <p className="truncate text-[10px] text-paper/75">
                        {NoiQuay}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-7 -left-6 hidden items-center gap-3 rounded-lg border border-rail bg-case-2/95 px-4 py-3 shadow-xl backdrop-blur lg:flex">
        <span className="grid size-9 place-items-center rounded-md bg-phosphor/20 text-phosphor">
          <QrCode size={18} />
        </span>
        <span>
          <p className="text-xs font-semibold">Đã xuất kho 8 thiết bị</p>
          <p className="text-[11px] text-fog">Quét QR · 2 phút trước</p>
        </span>
      </div>

      <div className="absolute -right-5 -top-5 hidden items-center gap-2 rounded-full border border-rail bg-case-2/95 px-4 py-2 shadow-xl backdrop-blur lg:flex">
        <CircleCheck className="text-phosphor" size={16} />
        <span className="text-xs font-semibold">Không có xung đột lịch</span>
      </div>
    </div>
  );
}

export function KhungXacThuc({ children: Children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-gunmetal md:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-rail bg-case p-10 md:flex md:flex-col md:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,#C4462B55,transparent_32%),radial-gradient(circle_at_80%_78%,#5C7A8A44,transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(#2c2f3355_1px,transparent_1px),linear-gradient(90deg,#2c2f3355_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(circle_at_50%_45%,black,transparent_75%)]" />

        <Link
          className="relative flex w-max items-center gap-3 text-paper"
          to="/"
        >
          <span className="size-10 overflow-hidden rounded-full border border-rail bg-gunmetal">
            <img
              alt=""
              className="size-full object-cover"
              height={2000}
              src={LogoTron}
              width={2000}
            />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-[0.09em]">
              MEDIOPS
            </span>
            <span className="block text-[11px] text-fog">
              Điều phối sản xuất
            </span>
          </span>
        </Link>

        <div className="relative my-8">
          <h1 className="font-serif text-4xl leading-[1.08] tracking-tight xl:text-5xl">
            Điều phối thông minh.
            <br />
            <span className="text-tally">Lên hình hoàn hảo.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-fog">
            Ca quay, Studio, thiết bị và ê-kíp — tất cả đồng bộ trên một nền
            tảng, để bạn dành trọn tâm sức cho sáng tạo.
          </p>
          <div className="mt-9 pb-6">
            <MinhHoaDichVu />
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fog">
          <span className="flex gap-0.5 text-timecode" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((ViTri) => (
              <Star fill="currentColor" key={ViTri} size={14} />
            ))}
          </span>
          <span>
            <strong className="text-paper">4,9/5</strong> từ hơn 1.200 đơn vị
            sản xuất tin dùng
          </span>
        </div>
      </section>

      <section className="flex flex-col px-5 py-8 sm:px-8 md:px-10">
        <Link
          className="inline-flex min-h-11 w-max items-center gap-2 text-sm text-fog transition hover:text-paper"
          to="/"
        >
          <ArrowLeft size={16} />
          Về trang chủ
        </Link>
        <div className="flex flex-1 items-center py-6">
          <div className="mx-auto w-full max-w-md">{Children}</div>
        </div>
      </section>
    </main>
  );
}
