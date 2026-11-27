import { QuanLyThongTinBoSung } from "../Components/QuanLyThongTinBoSung";
import { CoQuyen } from "../Services/QuyenService";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { HopThoaiXacNhan } from "../Components/HopThoaiXacNhan";
import { HopThoaiBieuMau } from "../Components/HopThoaiBieuMau";
import { useXacThuc } from "../Contexts/XacThucContext";
import { SchemaStudio } from "../Schemas/BieuMau";
import {
  ChuyenThanhCapDuLieu,
  ChuyenThanhDoiTuong,
  type CapDuLieuKyThuat,
} from "../Utils/DuLieuKyThuat";
import {
  CapNhatPhongStudio,
  LayDanhSachPhongStudio,
  TaoPhongStudio,
  XoaPhongStudio,
} from "../Services/PhongStudioService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type {
  DuLieuPhongStudio,
  PhongStudio,
  TrangThaiStudio,
} from "../Types/PhongStudio";
import { NutThemNhanh } from "../Components/NutThemNhanh";

const NhanTrangThai: Record<TrangThaiStudio, string> = {
  SAN_SANG: "Sẵn sàng",
  BAO_TRI: "Bảo trì",
  DONG_CUA: "Đóng cửa",
};
const LopTrangThai: Record<TrangThaiStudio, string> = {
  SAN_SANG: "bg-phosphor/20 text-phosphor",
  BAO_TRI: "bg-timecode/20 text-timecode",
  DONG_CUA: "bg-tally/20 text-tally",
};
const GiaTriMacDinh: z.infer<typeof SchemaStudio> = {
  MaPhong: "",
  TenPhong: "",
  DiaDiem: "",
  SucChua: "",
  KhaNang: "",
  TrangThai: "SAN_SANG",
};

function ChuyenDoiDuLieu(
  DuLieu: z.infer<typeof SchemaStudio>,
  CacKhaNang: CapDuLieuKyThuat[],
): DuLieuPhongStudio {
  return {
    MaPhong: DuLieu.MaPhong || undefined,
    TenPhong: DuLieu.TenPhong,
    DiaDiem: DuLieu.DiaDiem || undefined,
    SucChua: DuLieu.SucChua ? Number(DuLieu.SucChua) : undefined,
    KhaNang: CacKhaNang.length ? ChuyenThanhDoiTuong(CacKhaNang) : undefined,
    TrangThai: DuLieu.TrangThai,
  };
}

export function QuanLyStudio() {
  const { NguoiDung: NguoiDung } = useXacThuc();
  const CoQuyenQuanLy =
    CoQuyen(NguoiDung, "Studio.Sua") || CoQuyen(NguoiDung, "Studio.Xoa");
  const [DanhSach, SetDanhSach] = useState<PhongStudio[]>([]);
  const [TimKiem, SetTimKiem] = useState("");
  const [TrangThai, SetTrangThai] = useState<TrangThaiStudio | "">("");
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");
  const [StudioDangSua, SetStudioDangSua] = useState<PhongStudio | null>(null);
  const [StudioCanXoa, SetStudioCanXoa] = useState<PhongStudio | null>(null);
  const [DangXoa, SetDangXoa] = useState(false);
  const [CacKhaNang, SetCacKhaNang] = useState<CapDuLieuKyThuat[]>([]);
  const {
    register: Register,
    handleSubmit: HandleSubmit,
    reset: Reset,
    formState: { errors: Errors, isSubmitting: IsSubmitting },
  } = useForm<z.infer<typeof SchemaStudio>>({
    resolver: zodResolver(SchemaStudio),
    defaultValues: GiaTriMacDinh,
  });

  async function TaiStudio() {
    SetDangTai(true);
    SetLoi("");
    try {
      SetDanhSach(
        await LayDanhSachPhongStudio({
          TimKiem: TimKiem || undefined,
          TrangThai: TrangThai || undefined,
        }),
      );
    } catch (LoiTai) {
      SetLoi(LayThongBaoLoi(LoiTai));
    } finally {
      SetDangTai(false);
    }
  }
  useEffect(() => {
    void TaiStudio();
  }, [TrangThai]);

  function MoTaoMoi() {
    SetStudioDangSua({} as PhongStudio);
    SetCacKhaNang([]);
    Reset(GiaTriMacDinh);
  }
  function MoChinhSua(Studio: PhongStudio) {
    SetStudioDangSua(Studio);
    SetCacKhaNang(ChuyenThanhCapDuLieu(Studio.KhaNang ?? {}));
    Reset({
      MaPhong: Studio.MaPhong ?? "",
      TenPhong: Studio.TenPhong,
      DiaDiem: Studio.DiaDiem ?? "",
      SucChua: Studio.SucChua?.toString() ?? "",
      KhaNang: Studio.KhaNang ? JSON.stringify(Studio.KhaNang, null, 2) : "",
      TrangThai: Studio.TrangThai,
    });
  }
  async function LuuStudio(DuLieu: z.infer<typeof SchemaStudio>) {
    try {
      const DuLieuGui = ChuyenDoiDuLieu(DuLieu, CacKhaNang);
      if (StudioDangSua?.Id)
        await CapNhatPhongStudio(StudioDangSua.Id, DuLieuGui);
      else await TaoPhongStudio(DuLieuGui);
      toast.success(
        StudioDangSua?.Id
          ? "Cập nhật Studio thành công."
          : "Tạo Studio thành công.",
      );
      SetStudioDangSua(null);
      await TaiStudio();
    } catch (LoiLuu) {
      toast.error(LayThongBaoLoi(LoiLuu));
    }
  }
  async function XacNhanXoa() {
    if (!StudioCanXoa) return;
    SetDangXoa(true);
    try {
      await XoaPhongStudio(StudioCanXoa.Id);
      toast.success("Đã xóa Studio.");
      SetStudioCanXoa(null);
      await TaiStudio();
    } catch (LoiXoa) {
      toast.error(LayThongBaoLoi(LoiXoa));
    } finally {
      SetDangXoa(false);
    }
  }

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-blueprint">
            Vận hành trường quay
          </p>
          <h1 className="mt-2 font-serif text-2xl md:text-3xl">
            Quản lý Studio
          </h1>
          <p className="mt-2 text-sm text-fog">
            Theo dõi không gian quay, trạng thái và sức chứa.
          </p>
        </div>
        {CoQuyen(NguoiDung, "Studio.Tao") && (
          <div className="flex flex-wrap gap-2">
            <NutThemNhanh Loai="Studio" OnThanhCong={() => void TaiStudio()} />
            <button
              className="flex min-h-11 items-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold"
              onClick={MoTaoMoi}
              type="button"
            >
              <Plus size={17} />
              Thêm Studio
            </button>
          </div>
        )}
      </header>
      <div className="mb-5 flex flex-wrap gap-3">
        <input
          className="h-11 w-full flex-none sm:w-auto sm:min-w-56 sm:flex-1 rounded border border-rail bg-case-2 px-3"
          onChange={(E) => SetTimKiem(E.target.value)}
          onKeyDown={(E) => {
            if (E.key === "Enter") void TaiStudio();
          }}
          placeholder="Tìm theo tên, mã hoặc địa điểm"
          value={TimKiem}
        />
        <select
          className="h-11 rounded border border-rail bg-case-2 px-3"
          onChange={(E) => SetTrangThai(E.target.value as TrangThaiStudio | "")}
          value={TrangThai}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(NhanTrangThai).map(([GiaTri, Nhan]) => (
            <option key={GiaTri} value={GiaTri}>
              {Nhan}
            </option>
          ))}
        </select>
        <button
          className="rounded border border-rail px-4 text-sm text-fog hover:bg-case"
          onClick={() => void TaiStudio()}
          type="button"
        >
          Tìm kiếm
        </button>
      </div>
      {DangTai ? (
        <p className="py-12 text-center text-fog">Đang tải Studio…</p>
      ) : Loi ? (
        <div className="rounded border border-tally/60 bg-tally/10 p-4 text-sm">
          {Loi}
        </div>
      ) : DanhSach.length === 0 ? (
        <div className="rounded border border-rail bg-case p-8 text-center text-fog">
          Chưa có Studio phù hợp.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-rail">
          <table className="bang-the-di-dong min-w-full text-left text-sm">
            <thead className="bg-case text-xs uppercase text-fog">
              <tr>
                <th className="p-4">Studio</th>
                <th className="p-4">Địa điểm</th>
                <th className="p-4">Sức chứa</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Ca quay</th>
                {CoQuyenQuanLy && <th className="p-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {DanhSach.map((Studio) => (
                <tr className="border-t border-rail" key={Studio.Id}>
                  <td data-label="Studio" className="p-4">
                    <p className="font-semibold">{Studio.TenPhong}</p>
                    <p className="mt-1 font-mono text-xs text-fog">
                      {Studio.MaPhong ?? "Chưa có mã"}
                    </p>
                  </td>
                  <td data-label="Địa điểm" className="p-4 text-fog">
                    {Studio.DiaDiem ?? "—"}
                  </td>
                  <td data-label="Sức chứa" className="p-4 text-fog">
                    {Studio.SucChua ?? "—"}
                  </td>
                  <td data-label="Trạng thái" className="p-4">
                    <span
                      className={`rounded px-2 py-1 text-xs ${LopTrangThai[Studio.TrangThai]}`}
                    >
                      {NhanTrangThai[Studio.TrangThai]}
                    </span>
                  </td>
                  <td data-label="Ca quay" className="p-4 font-mono text-fog">
                    {Studio._count.DanhSachCa}
                  </td>
                  {CoQuyenQuanLy && (
                    <td data-label="Thao tác" className="p-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {CoQuyen(NguoiDung, "Studio.Sua") && (
                          <QuanLyThongTinBoSung
                            Nhom="phong-studio"
                            Id={Studio.Id}
                            Ten={Studio.TenPhong}
                          />
                        )}
                        <button
                          hidden={!CoQuyen(NguoiDung, "Studio.Sua")}
                          aria-label={`Chỉnh sửa ${Studio.TenPhong}`}
                          className="grid size-9 place-items-center rounded border border-rail text-fog"
                          onClick={() => MoChinhSua(Studio)}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          hidden={!CoQuyen(NguoiDung, "Studio.Xoa")}
                          aria-label={`Xóa ${Studio.TenPhong}`}
                          className="grid size-9 place-items-center rounded border border-rail text-tally"
                          onClick={() => SetStudioCanXoa(Studio)}
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {StudioDangSua && (
        <HopThoaiBieuMau
          DangXuLy={IsSubmitting}
          OnDong={() => SetStudioDangSua(null)}
          TieuDe={StudioDangSua.Id ? "Chỉnh sửa Studio" : "Thêm Studio"}
        >
          <form className="mt-5" onSubmit={HandleSubmit(LuuStudio)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm">Tên Studio *</span>
                <input
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  {...Register("TenPhong")}
                />
                {Errors.TenPhong && (
                  <p className="mt-1 text-sm text-tally">
                    {Errors.TenPhong.message}
                  </p>
                )}
              </label>
              <label>
                <span className="mb-2 block text-sm">Mã Studio</span>
                <input
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  {...Register("MaPhong")}
                />
                {Errors.MaPhong && (
                  <p className="mt-1 text-sm text-tally">
                    {Errors.MaPhong.message}
                  </p>
                )}
              </label>
              <label>
                <span className="mb-2 block text-sm">Địa điểm</span>
                <input
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  {...Register("DiaDiem")}
                />
                {Errors.DiaDiem && (
                  <p className="mt-1 text-sm text-tally">
                    {Errors.DiaDiem.message}
                  </p>
                )}
              </label>
              <label>
                <span className="mb-2 block text-sm">Sức chứa</span>
                <input
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  min="1"
                  type="number"
                  {...Register("SucChua")}
                />
                {Errors.SucChua && (
                  <p className="mt-1 text-sm text-tally">
                    {Errors.SucChua.message}
                  </p>
                )}
              </label>
              <label>
                <span className="mb-2 block text-sm">Trạng thái</span>
                <select
                  className="h-11 w-full rounded border border-rail bg-case-2 px-3"
                  {...Register("TrangThai")}
                >
                  {Object.entries(NhanTrangThai).map(([GiaTri, Nhan]) => (
                    <option key={GiaTri} value={GiaTri}>
                      {Nhan}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-sm">Khả năng Studio</legend>
                <p className="mb-3 text-xs text-fog">
                  Ví dụ: phông xanh, cách âm hoặc hệ thống đèn.
                </p>
                <div className="space-y-2">
                  {CacKhaNang.map((KhaNang, ChiSo) => (
                    <div
                      className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                      key={ChiSo}
                    >
                      <input
                        aria-label="Tên khả năng"
                        className="h-11 rounded border border-rail bg-case-2 px-3"
                        onChange={(E) => {
                          const Moi = [...CacKhaNang];
                          Moi[ChiSo] = { ...KhaNang, Khoa: E.target.value };
                          SetCacKhaNang(Moi);
                        }}
                        placeholder="Tên khả năng"
                        value={KhaNang.Khoa}
                      />
                      <input
                        aria-label="Mô tả khả năng"
                        className="h-11 rounded border border-rail bg-case-2 px-3"
                        onChange={(E) => {
                          const Moi = [...CacKhaNang];
                          Moi[ChiSo] = { ...KhaNang, GiaTri: E.target.value };
                          SetCacKhaNang(Moi);
                        }}
                        placeholder="Mô tả hoặc giá trị"
                        value={KhaNang.GiaTri}
                      />
                      <button
                        aria-label="Xóa khả năng"
                        className="rounded border border-rail px-3 text-tally"
                        onClick={() =>
                          SetCacKhaNang(
                            CacKhaNang.filter(
                              (BoQua, ViTri) => ViTri !== ChiSo,
                            ),
                          )
                        }
                        type="button"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-3 rounded border border-rail px-3 py-2 text-sm text-fog"
                  onClick={() =>
                    SetCacKhaNang([...CacKhaNang, { Khoa: "", GiaTri: "" }])
                  }
                  type="button"
                >
                  Thêm khả năng
                </button>
              </fieldset>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded border border-rail px-4 text-sm"
                onClick={() => SetStudioDangSua(null)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="rounded bg-tally px-4 text-sm font-semibold disabled:opacity-60"
                disabled={IsSubmitting}
                type="submit"
              >
                {IsSubmitting ? "Đang lưu…" : "Lưu Studio"}
              </button>
            </div>
          </form>
        </HopThoaiBieuMau>
      )}
      {StudioCanXoa && (
        <HopThoaiXacNhan
          DangXuLy={DangXoa}
          MoTa={
            <>
              Studio <strong>{StudioCanXoa.TenPhong}</strong> sẽ bị xóa vĩnh
              viễn. Không thể xóa nếu còn ca quay liên quan.
            </>
          }
          NhanXacNhan="Xóa Studio"
          OnHuy={() => SetStudioCanXoa(null)}
          OnXacNhan={() => void XacNhanXoa()}
          TieuDe="Xóa Studio"
        />
      )}
    </section>
  );
}
