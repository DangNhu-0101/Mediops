import { AlertTriangle, Camera, Images, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { BaoSuCo } from "../Services/SuCoBaoTriService";
import { LayDanhSachThietBi } from "../Services/ThietBiService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type { MucDoSuCo, NguonSuCo, SuCoBaoTri } from "../Types/SuCoBaoTri";
import type { ThietBi } from "../Types/ThietBi";
import { HopThoaiBieuMau } from "./HopThoaiBieuMau";

const SoAnhToiDa = 5;
const DungLuongToiDa = 5 * 1024 * 1024;

const CacMucDo: Array<{
  GiaTri: MucDoSuCo;
  Nhan: string;
  MoTa: string;
  Lop: string;
}> = [
  {
    GiaTri: "NHE",
    Nhan: "Nhẹ",
    MoTa: "Cần kiểm tra trước lần sử dụng tiếp theo",
    Lop: "border-timecode/60 bg-timecode/10",
  },
  {
    GiaTri: "TRUNG_BINH",
    Nhan: "Trung bình",
    MoTa: "Thiết bị không nên tiếp tục được cấp phát",
    Lop: "border-tally/60 bg-tally/10",
  },
  {
    GiaTri: "NGHIEM_TRONG",
    Nhan: "Nghiêm trọng",
    MoTa: "Ngừng sử dụng và bàn giao kỹ thuật ngay",
    Lop: "border-tally bg-tally/15",
  },
];

type ThietBiRutGon = Pick<ThietBi, "Id" | "TenThietBi" | "MaQR" | "KhoId">;

export function BieuMauBaoSuCo({
  ThietBiCoDinh: ThietBiCoDinh,
  CaQuayId: CaQuayId,
  Nguon: Nguon = "KIEM_TRA_KHO",
  OnDong: OnDong,
  OnThanhCong: OnThanhCong,
}: {
  ThietBiCoDinh?: ThietBiRutGon;
  CaQuayId?: string;
  Nguon?: Exclude<NguonSuCo, "NHAP_KHO">;
  OnDong: () => void;
  OnThanhCong?: (SuCo: SuCoBaoTri) => void;
}) {
  const [DanhSachThietBi, SetDanhSachThietBi] = useState<ThietBiRutGon[]>(
    ThietBiCoDinh ? [ThietBiCoDinh] : [],
  );
  const [ThietBiId, SetThietBiId] = useState(ThietBiCoDinh?.Id ?? "");
  const [MucDo, SetMucDo] = useState<MucDoSuCo>("TRUNG_BINH");
  const [MoTaLoi, SetMoTaLoi] = useState("");
  const [DanhSachAnh, SetDanhSachAnh] = useState<File[]>([]);
  const [DangTaiThietBi, SetDangTaiThietBi] = useState(!ThietBiCoDinh);
  const [DangGui, SetDangGui] = useState(false);
  const [Loi, SetLoi] = useState("");

  useEffect(() => {
    if (ThietBiCoDinh) return;
    let ConHieuLuc = true;
    LayDanhSachThietBi({})
      .then((DanhSach) => {
        if (ConHieuLuc) SetDanhSachThietBi(DanhSach);
      })
      .catch((LoiTai) => {
        if (ConHieuLuc) SetLoi(LayThongBaoLoi(LoiTai));
      })
      .finally(() => {
        if (ConHieuLuc) SetDangTaiThietBi(false);
      });
    return () => {
      ConHieuLuc = false;
    };
  }, [ThietBiCoDinh]);

  const DanhSachXemTruoc = useMemo(
    () =>
      DanhSachAnh.map((Tep) => ({ Tep: Tep, Url: URL.createObjectURL(Tep) })),
    [DanhSachAnh],
  );
  useEffect(
    () => () => {
      DanhSachXemTruoc.forEach((Anh) => URL.revokeObjectURL(Anh.Url));
    },
    [DanhSachXemTruoc],
  );

  function ThemAnh(SuKien: ChangeEvent<HTMLInputElement>) {
    const CacTepMoi = Array.from(SuKien.target.files ?? []);
    SuKien.target.value = "";
    const TepKhongHopLe = CacTepMoi.find(
      (Tep) => !Tep.type.startsWith("image/") || Tep.size > DungLuongToiDa,
    );
    if (TepKhongHopLe) {
      SetLoi("Mỗi tệp phải là ảnh hợp lệ và không vượt quá 5 MB.");
      return;
    }
    if (DanhSachAnh.length + CacTepMoi.length > SoAnhToiDa) {
      SetLoi(`Mỗi sự cố chỉ được đính kèm tối đa ${SoAnhToiDa} ảnh.`);
      return;
    }
    SetLoi("");
    SetDanhSachAnh((HienTai) => [...HienTai, ...CacTepMoi]);
  }

  async function GuiBaoCao() {
    if (!ThietBiId) {
      SetLoi("Vui lòng chọn thiết bị.");
      return;
    }
    if (MoTaLoi.trim().length < 5) {
      SetLoi("Mô tả tình trạng phải có ít nhất 5 ký tự.");
      return;
    }
    const ThietBi = DanhSachThietBi.find((Muc) => Muc.Id === ThietBiId);
    SetDangGui(true);
    SetLoi("");
    try {
      const SuCo = await BaoSuCo(
        {
          ThietBiId: ThietBiId,
          CaQuayId: CaQuayId,
          KhoId: ThietBi?.KhoId ?? undefined,
          MucDo: MucDo,
          MoTaLoi: MoTaLoi.trim(),
          Nguon: Nguon,
        },
        DanhSachAnh,
      );
      toast.success(
        "Đã ghi nhận sự cố và chuyển thiết bị sang quy trình bảo trì.",
      );
      OnThanhCong?.(SuCo);
      OnDong();
    } catch (LoiGui) {
      SetLoi(LayThongBaoLoi(LoiGui));
    } finally {
      SetDangGui(false);
    }
  }

  return (
    <HopThoaiBieuMau
      DangXuLy={DangGui}
      KichThuoc="rong"
      OnDong={OnDong}
      TieuDe="Báo cáo sự cố thiết bị"
    >
      <form
        className="mt-5 space-y-5"
        onSubmit={(SuKien) => {
          SuKien.preventDefault();
          void GuiBaoCao();
        }}
      >
        <label className="block">
          <span className="text-sm font-semibold">Thiết bị</span>
          {ThietBiCoDinh ? (
            <span className="mt-2 block rounded border border-rail bg-case-2 px-3 py-3 text-sm">
              {ThietBiCoDinh.TenThietBi}
              <span className="ml-2 font-mono text-xs text-fog">
                {ThietBiCoDinh.MaQR}
              </span>
            </span>
          ) : (
            <select
              className="mt-2 h-12 w-full rounded border border-rail bg-case-2 px-3 text-base"
              disabled={DangTaiThietBi || DangGui}
              onChange={(SuKien) => SetThietBiId(SuKien.target.value)}
              value={ThietBiId}
            >
              <option value="">
                {DangTaiThietBi ? "Đang tải thiết bị…" : "Chọn thiết bị"}
              </option>
              {DanhSachThietBi.map((ThietBi) => (
                <option key={ThietBi.Id} value={ThietBi.Id}>
                  {ThietBi.TenThietBi} · {ThietBi.MaQR}
                </option>
              ))}
            </select>
          )}
        </label>

        <fieldset>
          <legend className="text-sm font-semibold">Mức độ sự cố</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {CacMucDo.map((Muc) => (
              <label
                className={`min-h-20 cursor-pointer rounded border p-3 transition ${
                  MucDo === Muc.GiaTri
                    ? Muc.Lop
                    : "border-rail bg-case-2 hover:border-fog"
                }`}
                key={Muc.GiaTri}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    checked={MucDo === Muc.GiaTri}
                    disabled={DangGui}
                    name="muc-do-su-co"
                    onChange={() => SetMucDo(Muc.GiaTri)}
                    type="radio"
                  />
                  {Muc.Nhan}
                </span>
                <span className="mt-1 block text-xs leading-5 text-fog">
                  {Muc.MoTa}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-sm font-semibold">Mô tả tình trạng</span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded border border-rail bg-case-2 px-3 py-3 text-base"
            disabled={DangGui}
            maxLength={2000}
            onChange={(SuKien) => SetMoTaLoi(SuKien.target.value)}
            placeholder="Nêu dấu hiệu bất thường, thời điểm phát hiện và thao tác đã dừng…"
            value={MoTaLoi}
          />
          <span className="mt-1 block text-right font-mono text-[11px] text-fog">
            {MoTaLoi.length}/2.000
          </span>
        </label>

        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Ảnh hiện trường</p>
              <p className="mt-1 text-xs text-fog">
                Tối đa 5 ảnh, mỗi ảnh không quá 5 MB.
              </p>
            </div>
            <span className="font-mono text-xs text-fog">
              {DanhSachAnh.length}/{SoAnhToiDa}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded border border-rail px-3 text-sm text-fog hover:bg-case-2 hover:text-paper">
              <Camera aria-hidden size={18} /> Chụp ảnh
              <input
                accept="image/*"
                capture="environment"
                className="sr-only"
                disabled={DangGui || DanhSachAnh.length >= SoAnhToiDa}
                onChange={ThemAnh}
                type="file"
              />
            </label>
            <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded border border-rail px-3 text-sm text-fog hover:bg-case-2 hover:text-paper">
              <Images aria-hidden size={18} /> Chọn ảnh
              <input
                accept="image/*"
                className="sr-only"
                disabled={DangGui || DanhSachAnh.length >= SoAnhToiDa}
                multiple
                onChange={ThemAnh}
                type="file"
              />
            </label>
          </div>
          {DanhSachXemTruoc.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {DanhSachXemTruoc.map(({ Tep: Tep, Url: Url }, ChiSo) => (
                <figure
                  className="relative aspect-square overflow-hidden rounded border border-rail bg-case-2"
                  key={`${Tep.name}-${Tep.lastModified}-${ChiSo}`}
                >
                  <img
                    alt={`Ảnh hiện trường đã chọn ${ChiSo + 1}`}
                    className="size-full object-cover"
                    src={Url}
                  />
                  <button
                    aria-label={`Bỏ ảnh ${ChiSo + 1}`}
                    className="absolute right-1 top-1 grid size-11 place-items-center rounded bg-gunmetal/90 text-paper"
                    disabled={DangGui}
                    onClick={() =>
                      SetDanhSachAnh((HienTai) =>
                        HienTai.filter((BoQua, ViTri) => ViTri !== ChiSo),
                      )
                    }
                    type="button"
                  >
                    <Trash2 aria-hidden size={17} />
                  </button>
                </figure>
              ))}
            </div>
          ) : null}
        </div>

        {Loi ? (
          <div
            className="flex gap-2 rounded border border-tally/60 bg-tally/10 p-3 text-sm"
            role="alert"
          >
            <AlertTriangle
              aria-hidden
              className="mt-0.5 shrink-0 text-tally"
              size={18}
            />
            <p>{Loi}</p>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-rail pt-4 sm:flex-row sm:justify-end">
          <button
            className="min-h-12 rounded border border-rail px-4 text-sm text-fog hover:bg-case-2 hover:text-paper"
            disabled={DangGui}
            onClick={OnDong}
            type="button"
          >
            Hủy
          </button>
          <button
            className="min-h-12 rounded-sm bg-tally px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={DangGui || DangTaiThietBi}
            type="submit"
          >
            {DangGui ? "Đang gửi báo cáo…" : "Gửi báo cáo sự cố"}
          </button>
        </div>
      </form>
    </HopThoaiBieuMau>
  );
}
