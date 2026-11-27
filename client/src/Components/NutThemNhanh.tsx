import * as Dialog from "@radix-ui/react-dialog";
import {
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  DocLoiNhapExcel,
  NhapFileExcel,
  TaiFileMauExcel,
} from "../Services/NhapExcelService";
import type { LoaiNhapExcel, LoiDongExcel } from "../Types/NhapExcel";

const TenMuc: Record<LoaiNhapExcel, string> = {
  DuAn: "dự án",
  CaQuay: "ca quay",
  Kho: "kho",
  Studio: "studio",
  NhanSu: "nhân sự",
  ThietBi: "thiết bị",
  DanhMuc: "danh mục tài nguyên",
  DongTaiNguyen: "dòng tài nguyên",
  NhomQuyen: "nhóm quyền",
  ChucDanh: "chức danh",
};

interface KetQuaHienThi {
  LoaiThongBao: "thanh-cong" | "mot-phan" | "that-bai";
  ThongBao: string;
  DanhSachLoi: LoiDongExcel[];
}

const LopThongBao: Record<KetQuaHienThi["LoaiThongBao"], string> = {
  "thanh-cong": "border-phosphor/60 text-phosphor",
  "mot-phan": "border-timecode/60 text-timecode",
  "that-bai": "border-tally/60 text-tally",
};

export function NutThemNhanh({
  Loai,
  OnThanhCong,
  className,
}: {
  Loai: LoaiNhapExcel;
  OnThanhCong: () => void;
  className?: string;
}) {
  const [DangMo, SetDangMo] = useState(false);
  const [DangTaiMau, SetDangTaiMau] = useState(false);
  const [DangNhap, SetDangNhap] = useState(false);
  const [KetQua, SetKetQua] = useState<KetQuaHienThi | null>(null);
  const OChonTep = useRef<HTMLInputElement>(null);
  const Ten = TenMuc[Loai];
  const DangXuLy = DangTaiMau || DangNhap;

  function Mo() {
    SetKetQua(null);
    SetDangMo(true);
  }

  function Dong() {
    if (DangXuLy) return;
    SetDangMo(false);
  }

  async function TaiMau() {
    SetDangTaiMau(true);
    try {
      await TaiFileMauExcel(Loai);
    } catch (Loi) {
      toast.error((await DocLoiNhapExcel(Loi)).ThongBao);
    } finally {
      SetDangTaiMau(false);
    }
  }

  async function ChonTep(SuKien: ChangeEvent<HTMLInputElement>) {
    const Tep = SuKien.target.files?.[0];
    // Cho phép chọn lại cùng một tệp sau khi sửa lỗi.
    SuKien.target.value = "";
    if (!Tep) return;
    if (!/\.xlsx$/i.test(Tep.name)) {
      const ThongBao = "Chỉ nhận tệp Excel có đuôi .xlsx.";
      SetKetQua({ LoaiThongBao: "that-bai", ThongBao, DanhSachLoi: [] });
      toast.error(ThongBao);
      return;
    }
    SetKetQua(null);
    SetDangNhap(true);
    try {
      const PhanHoi = await NhapFileExcel(Loai, Tep);
      if (PhanHoi.SoDongThanhCong > 0) OnThanhCong();
      if (!PhanHoi.DanhSachLoi.length) {
        toast.success(`Đã nhập thành công ${PhanHoi.SoDongThanhCong} ${Ten}.`);
        SetDangMo(false);
        return;
      }
      const ThongBao =
        PhanHoi.SoDongThanhCong > 0
          ? `Đã nhập ${PhanHoi.SoDongThanhCong}/${PhanHoi.TongSoDong} dòng. ${PhanHoi.DanhSachLoi.length} dòng không lưu được.`
          : `Không lưu được dòng nào trong tệp.`;
      SetKetQua({
        LoaiThongBao: PhanHoi.SoDongThanhCong > 0 ? "mot-phan" : "that-bai",
        ThongBao,
        DanhSachLoi: PhanHoi.DanhSachLoi,
      });
      if (PhanHoi.SoDongThanhCong > 0) toast.warning(ThongBao);
      else toast.error(ThongBao);
    } catch (Loi) {
      const ChiTiet = await DocLoiNhapExcel(Loi);
      SetKetQua({
        LoaiThongBao: "that-bai",
        ThongBao: ChiTiet.ThongBao,
        DanhSachLoi: ChiTiet.DanhSachLoi,
      });
      toast.error(`Nhập tệp thất bại: ${ChiTiet.ThongBao}`);
    } finally {
      SetDangNhap(false);
    }
  }

  return (
    <>
      <button
        className={
          className ??
          "flex min-h-11 items-center gap-2 rounded-sm border border-rail px-4 text-sm font-semibold hover:bg-case-2"
        }
        onClick={Mo}
        type="button"
      >
        <Zap aria-hidden size={17} />
        Thêm nhanh
      </button>
      {DangMo && (
        <Dialog.Root
          open
          onOpenChange={(Mo) => {
            if (!Mo) Dong();
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-30 bg-black/60" />
            <Dialog.Content className="hop-thoai-bieu-mau fixed top-1/2 left-1/2 z-40 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded border border-rail bg-case p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <Dialog.Title className="font-serif text-xl">
                  Thêm nhanh {Ten}
                </Dialog.Title>
                <Dialog.Close
                  aria-label="Đóng"
                  className="-mt-1 -mr-1 flex size-11 shrink-0 items-center justify-center rounded text-fog hover:bg-case-2 hover:text-paper disabled:opacity-50"
                  disabled={DangXuLy}
                  title="Đóng"
                >
                  <X size={20} />
                </Dialog.Close>
              </div>
              <Dialog.Description className="mt-3 flex gap-3 text-sm text-fog">
                <FileSpreadsheet
                  aria-hidden
                  className="mt-0.5 shrink-0 text-phosphor"
                  size={20}
                />
                <span>
                  Nhập nhiều {Ten} cùng lúc bằng file Excel. Tải file mẫu, điền
                  dữ liệu theo trang “Hướng dẫn” trong file (cột có dấu * là bắt
                  buộc), sau đó bấm Nhập file. Dữ liệu được kiểm tra như khi tạo
                  mới; nếu tệp có dòng sai, chưa có dòng nào được lưu.
                </span>
              </Dialog.Description>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  className="flex min-h-11 items-center gap-2 rounded-sm border border-rail px-4 text-sm font-semibold hover:bg-case-2 disabled:opacity-60"
                  disabled={DangXuLy}
                  onClick={() => void TaiMau()}
                  type="button"
                >
                  {DangTaiMau ? (
                    <LoaderCircle
                      aria-hidden
                      className="animate-spin"
                      size={17}
                    />
                  ) : (
                    <Download aria-hidden size={17} />
                  )}
                  Tải file mẫu
                </button>
                <button
                  className="flex min-h-11 items-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold text-paper disabled:opacity-60"
                  disabled={DangXuLy}
                  onClick={() => OChonTep.current?.click()}
                  type="button"
                >
                  <Upload aria-hidden size={17} />
                  Nhập file
                </button>
                <input
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(SuKien) => void ChonTep(SuKien)}
                  ref={OChonTep}
                  type="file"
                />
              </div>

              {DangNhap && (
                <p
                  className="mt-5 flex items-center gap-3 rounded border border-rail bg-case-2 p-3 text-sm"
                  role="status"
                >
                  <LoaderCircle
                    aria-hidden
                    className="animate-spin text-timecode"
                    size={20}
                  />
                  Đang kiểm tra và lưu dữ liệu, vui lòng chờ…
                </p>
              )}

              {KetQua && (
                <div
                  className={`mt-5 rounded border bg-case-2 p-3 text-sm ${LopThongBao[KetQua.LoaiThongBao]}`}
                  role="alert"
                >
                  <p className="font-semibold">{KetQua.ThongBao}</p>
                  {KetQua.DanhSachLoi.length > 0 && (
                    <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto text-paper">
                      {KetQua.DanhSachLoi.map((Loi) => (
                        <li key={`${Loi.Dong}-${Loi.ThongBao}`}>
                          <span className="font-semibold text-fog">
                            Dòng {Loi.Dong}:
                          </span>{" "}
                          {Loi.ThongBao}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
}
