import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  LocateFixed,
  MapPin,
  Repeat2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { TrinhQuetQR } from "../Components/TrinhQuetQR";
import {
  KiemTraViTriKho,
  LayChecklistNhapKho,
  LayDanhSachKho,
  NhapKho,
  TraCuuThietBiNhapKho,
  type BangChungViTri,
  type ChecklistNhapKho,
  type PhuongThucQuet,
  type TinhTrangTraThietBi,
} from "../Services/VanHanhKhoService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import type { Kho } from "../Types/ThietBi";
import { LayViTriHienTai } from "../Utils/ViTriKho";

interface KetQuaViTri {
  KhoId: string;
  HetHanLuc: string;
  KhoangCachMet: number;
  ViTri: BangChungViTri;
}

interface KetQuaQuet {
  MaQR: string;
  PhuongThuc: PhuongThucQuet;
  TinhTrang: TinhTrangTraThietBi;
  GhiChu: string;
}

const NhanTinhTrang: Record<TinhTrangTraThietBi, string> = {
  BINH_THUONG: "Bình thường",
  CAN_KIEM_TRA: "Cần kiểm tra",
  HU_HONG: "Có hư hỏng",
};

function LayThongBaoViTri(Loi: unknown) {
  const ThongBaoTuApi = LayThongBaoLoi(Loi);
  return ThongBaoTuApi !== "Đã xảy ra lỗi. Vui lòng thử lại."
    ? ThongBaoTuApi
    : Loi instanceof Error
      ? Loi.message
      : ThongBaoTuApi;
}

export function QuetNhapKho() {
  const { id: Id = "" } = useParams();
  const [ThamSoTimKiem, SetThamSoTimKiem] = useSearchParams();
  const DieuHuong = useNavigate();
  const [Checklist, SetChecklist] = useState<ChecklistNhapKho>();
  const [DanhSachKho, SetDanhSachKho] = useState<Kho[]>([]);
  const [DangTai, SetDangTai] = useState(true);
  const [LoiTai, SetLoiTai] = useState("");
  const [DangLayViTri, SetDangLayViTri] = useState(false);
  const [KetQuaViTri, SetKetQuaViTri] = useState<KetQuaViTri>();
  const [LoiViTri, SetLoiViTri] = useState("");
  const [DaQuet, SetDaQuet] = useState<Map<string, KetQuaQuet>>(new Map());
  const [DangXacNhan, SetDangXacNhan] = useState(false);
  const KhoaXacNhan = useRef(false);
  const NguCanhHienTai = useRef("");
  const [KetQuaHoanTat, SetKetQuaHoanTat] = useState<{
    TenKhoDich: string;
    SoThietBi: number;
    SoChuyenKho: number;
    CoThietBiBatThuong: boolean;
  }>();

  useEffect(() => {
    let ConHieuLuc = true;
    async function TaiDuLieu() {
      SetDangTai(true);
      SetLoiTai("");
      try {
        const [ChecklistMoi, DanhSachKhoMoi] = await Promise.all([
          LayChecklistNhapKho(Id),
          LayDanhSachKho(),
        ]);
        if (ConHieuLuc) {
          SetChecklist(ChecklistMoi);
          SetDanhSachKho(DanhSachKhoMoi);
        }
      } catch (Loi) {
        if (ConHieuLuc) SetLoiTai(LayThongBaoLoi(Loi));
      } finally {
        if (ConHieuLuc) SetDangTai(false);
      }
    }
    if (Id) void TaiDuLieu();
    else {
      SetLoiTai("Ca quay không hợp lệ.");
      SetDangTai(false);
    }
    return () => {
      ConHieuLuc = false;
    };
  }, [Id]);
  useEffect(
    () =>
      TheoDoiVanHanh(
        ["kho:xuat-kho", "kho:nhap-kho", "bao_tri:cap_nhat"],
        (DuLieu) => {
          if (!Id || (DuLieu?.CaQuayId && DuLieu.CaQuayId !== Id)) return;
          void LayChecklistNhapKho(Id)
            .then((Moi) => {
              SetChecklist(Moi);
              const HopLe = new Set(
                Moi.DanhSachThietBi.map((Muc) => Muc.ThietBi.Id),
              );
              SetDaQuet(
                (HienTai) =>
                  new Map(
                    [...HienTai].filter(([ThietBiId]) => HopLe.has(ThietBiId)),
                  ),
              );
            })
            .catch((Loi) => SetLoiTai(LayThongBaoLoi(Loi)));
        },
      ),
    [Id],
  );

  const KhoIdTuUrl = ThamSoTimKiem.get("KhoId") ?? "";
  const KhoGocDauTien = Checklist?.DanhSachThietBi[0]?.ThietBi.Kho?.Id ?? "";
  const KhoDichId = DanhSachKho.some((Kho) => Kho.Id === KhoIdTuUrl)
    ? KhoIdTuUrl
    : DanhSachKho.some((Kho) => Kho.Id === KhoGocDauTien)
      ? KhoGocDauTien
      : (DanhSachKho[0]?.Id ?? "");
  const KhoDich = DanhSachKho.find((Kho) => Kho.Id === KhoDichId);
  const NguCanh = `${Id}/${KhoDichId}`;
  NguCanhHienTai.current = NguCanh;
  useEffect(() => {
    SetKetQuaViTri(undefined);
    SetLoiViTri("");
    SetDaQuet(new Map());
  }, [NguCanh]);
  useEffect(() => {
    if (!KetQuaViTri) return;
    const HenGio = window.setTimeout(
      () => {
        SetKetQuaViTri(undefined);
        SetLoiViTri(
          "Vị trí đã hết hạn. Hãy lấy lại vị trí trước khi tiếp tục.",
        );
      },
      Math.max(0, new Date(KetQuaViTri.HetHanLuc).getTime() - Date.now()),
    );
    return () => window.clearTimeout(HenGio);
  }, [KetQuaViTri]);
  const ViTriHopLe = KetQuaViTri?.KhoId === KhoDichId;
  const DanhSachThietBi = Checklist?.DanhSachThietBi ?? [];
  const DaQuetDu =
    DanhSachThietBi.length > 0 && DaQuet.size === DanhSachThietBi.length;
  const SoChuyenKho = useMemo(
    () =>
      DanhSachThietBi.filter(
        ({ ThietBi: ThietBi }) =>
          ThietBi.Kho?.Id && ThietBi.Kho.Id !== KhoDichId,
      ).length,
    [DanhSachThietBi, KhoDichId],
  );

  function DoiKho(KhoMoiId: string) {
    SetThamSoTimKiem({ KhoId: KhoMoiId }, { replace: true });
    SetKetQuaViTri(undefined);
    SetLoiViTri("");
    SetDaQuet(new Map());
  }

  async function XacMinhViTri() {
    if (!KhoDichId || DangLayViTri || KhoaXacNhan.current) return;
    SetDangLayViTri(true);
    SetLoiViTri("");
    SetKetQuaViTri(undefined);
    try {
      const ViTri = await LayViTriHienTai();
      const KetQua = await KiemTraViTriKho(KhoDichId, ViTri);
      if (NguCanhHienTai.current !== NguCanh) return;
      SetKetQuaViTri({
        KhoId: KhoDichId,
        HetHanLuc: KetQua.HetHanLuc,
        KhoangCachMet: KetQua.KhoangCachMet,
        ViTri,
      });
    } catch (Loi) {
      if (NguCanhHienTai.current === NguCanh)
        SetLoiViTri(LayThongBaoViTri(Loi));
    } finally {
      SetDangLayViTri(false);
    }
  }

  async function XuLyMaQR(MaQR: string, PhuongThuc: PhuongThucQuet) {
    if (!ViTriHopLe || KhoaXacNhan.current)
      throw new Error("Hãy lấy lại vị trí trước khi quét.");
    const ThietBi = await TraCuuThietBiNhapKho({ CaQuayId: Id, MaQR: MaQR });
    if (NguCanhHienTai.current !== NguCanh) return;
    if (DaQuet.has(ThietBi.Id)) {
      toast.info("Thiết bị này đã có trong danh sách kiểm tra.");
      return;
    }
    SetDaQuet((HienTai) => {
      if (HienTai.has(ThietBi.Id)) {
        return HienTai;
      }
      const Moi = new Map(HienTai);
      Moi.set(ThietBi.Id, {
        MaQR,
        PhuongThuc: PhuongThuc,
        TinhTrang: "BINH_THUONG",
        GhiChu: "",
      });
      return Moi;
    });
  }

  function CapNhatTinhTrang(
    ThietBiId: string,
    ThayDoi: Partial<Pick<KetQuaQuet, "TinhTrang" | "GhiChu">>,
  ) {
    SetDaQuet((HienTai) => {
      const ThongTin = HienTai.get(ThietBiId);
      if (!ThongTin) return HienTai;
      const Moi = new Map(HienTai);
      Moi.set(ThietBiId, { ...ThongTin, ...ThayDoi });
      return Moi;
    });
  }

  async function XacNhanNhapKho() {
    if (
      !DaQuetDu ||
      !KhoDichId ||
      !ViTriHopLe ||
      KhoaXacNhan.current ||
      KetQuaHoanTat
    )
      return;
    KhoaXacNhan.current = true;
    SetDangXacNhan(true);
    SetLoiViTri("");
    try {
      const ViTriMoi = await LayViTriHienTai();
      if (NguCanhHienTai.current !== NguCanh) return;
      const KetQua = await NhapKho({
        CaQuayId: Id,
        KhoDichId: KhoDichId,
        DanhSachThietBi: [...DaQuet].map(([ThietBiId, ThongTin]) => ({
          ThietBiId: ThietBiId,
          MaQR: ThongTin.MaQR,
          PhuongThuc: ThongTin.PhuongThuc,
          TinhTrang: ThongTin.TinhTrang,
          GhiChu: ThongTin.GhiChu.trim() || undefined,
        })),
        ViTri: ViTriMoi,
      });
      SetKetQuaHoanTat({
        ...KetQua,
        CoThietBiBatThuong: [...DaQuet.values()].some(
          (Muc) => Muc.TinhTrang !== "BINH_THUONG",
        ),
      });
      toast.success(
        `Đã nhập ${KetQua.SoThietBi} thiết bị tại ${KetQua.TenKhoDich}.`,
      );
    } catch (Loi) {
      SetKetQuaViTri(undefined);
      SetLoiViTri(LayThongBaoViTri(Loi));
    } finally {
      KhoaXacNhan.current = false;
      SetDangXacNhan(false);
    }
  }

  if (DangTai) {
    return <TrangThongBao NoiDung="Đang tải danh sách trả tài nguyên…" />;
  }
  if (LoiTai || !Checklist) {
    return (
      <TrangThongBao
        Loi
        NoiDung={LoiTai || "Không thể tải danh sách trả tài nguyên."}
      />
    );
  }
  if (KetQuaHoanTat) {
    return (
      <main className="min-h-[100dvh] bg-gunmetal p-4 text-paper">
        <section className="mx-auto max-w-xl rounded border border-phosphor/50 bg-case p-6 text-center">
          <CheckCircle2 className="mx-auto text-phosphor" size={36} />
          <h1 className="mt-4 font-serif text-2xl">Nhập kho thành công</h1>
          <p className="mt-2 text-sm leading-6 text-fog">
            Đã ghi nhận {KetQuaHoanTat.SoThietBi} thiết bị tại{" "}
            {KetQuaHoanTat.TenKhoDich}
            {KetQuaHoanTat.SoChuyenKho > 0
              ? `, gồm ${KetQuaHoanTat.SoChuyenKho} thiết bị chuyển kho.`
              : "."}
          </p>
          <ul className="mt-4 space-y-2 text-left text-sm">
            {Checklist.DanhSachThietBi.filter((Muc) =>
              DaQuet.has(Muc.ThietBi.Id),
            ).map((Muc) => (
              <li key={Muc.Id} className="rounded border border-rail p-3">
                <p className="break-words font-semibold">
                  {Muc.ThietBi.TenThietBi}
                </p>
                <p className="mt-1 break-all text-xs text-fog">
                  {Muc.ThietBi.MaQR}
                </p>
                <p className="mt-2 text-phosphor">
                  Đã nhập kho ·{" "}
                  {
                    NhanTinhTrang[
                      DaQuet.get(Muc.ThietBi.Id)?.TinhTrang ?? "BINH_THUONG"
                    ]
                  }
                </p>
              </li>
            ))}
          </ul>
          {KetQuaHoanTat.CoThietBiBatThuong ? (
            <div className="mt-4 rounded border border-timecode/50 bg-timecode/10 p-3 text-left text-sm leading-6">
              Sự cố của thiết bị bất thường đã được chuyển vào quy trình bảo
              trì. Bạn có thể bổ sung ảnh hiện trường ngay trong chi tiết sự cố.
            </div>
          ) : null}
          {KetQuaHoanTat.CoThietBiBatThuong ? (
            <button
              className="mt-4 min-h-11 w-full rounded border border-timecode px-4 text-sm font-semibold text-timecode"
              onClick={() => DieuHuong("/bao-tri")}
              type="button"
            >
              Mở danh sách bảo trì
            </button>
          ) : null}
          <button
            className="mt-3 min-h-11 w-full rounded-sm bg-tally px-4 text-sm font-semibold"
            onClick={() => DieuHuong(`/mobile/ca-quay/${Id}`)}
            type="button"
          >
            Quay lại ca quay
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-gunmetal p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] text-paper">
      <section className="mx-auto max-w-xl">
        <button
          className="flex min-h-11 items-center gap-2 text-sm text-fog"
          onClick={() => DieuHuong(`/mobile/ca-quay/${Id}`)}
          type="button"
        >
          <ArrowLeft aria-hidden size={17} /> Quay lại ca quay
        </button>
        <h1 className="mt-3 break-words font-serif text-2xl">Nhập thiết bị</h1>
        <p className="mt-1 break-words text-sm text-fog">
          {Checklist.TieuDe} · {Checklist.DuAn.TenDuAn}
        </p>

        {DanhSachThietBi.length === 0 ? (
          <div className="mt-5 rounded border border-rail bg-case p-5 text-center">
            <CheckCircle2 className="mx-auto text-phosphor" size={26} />
            <h2 className="mt-3 font-semibold">Không có thiết bị chờ nhập</h2>
            <p className="mt-1 text-sm leading-6 text-fog">
              Toàn bộ thiết bị của ca quay đã được nhập hoặc chưa được xuất kho.
            </p>
          </div>
        ) : (
          <>
            <label className="mt-5 block text-sm font-semibold">
              Kho nhận thiết bị
              <select
                className="mt-2 min-h-12 w-full rounded border border-rail bg-case-2 px-3 text-base"
                onChange={(SuKien) => DoiKho(SuKien.target.value)}
                value={KhoDichId}
                disabled={DangLayViTri || DangXacNhan}
              >
                {DanhSachKho.map((Kho) => (
                  <option key={Kho.Id} value={Kho.Id}>
                    {Kho.TenKho} · {Kho.DiaChi}
                  </option>
                ))}
              </select>
            </label>

            {SoChuyenKho > 0 && KhoDich ? (
              <div className="mt-4 flex gap-3 rounded border border-timecode/50 bg-timecode/10 p-4 text-sm leading-6">
                <Repeat2
                  aria-hidden
                  className="mt-0.5 shrink-0 text-timecode"
                  size={19}
                />
                <p>
                  {SoChuyenKho === 1
                    ? "Một thiết bị"
                    : `${SoChuyenKho} thiết bị`}{" "}
                  sẽ được ghi nhận chuyển từ kho xuất ban đầu sang{" "}
                  <strong>{KhoDich.TenKho}</strong>.
                </p>
              </div>
            ) : null}

            {KhoDich ? (
              <section className="mt-5 rounded border border-rail bg-case p-4">
                <div className="flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 shrink-0 text-blueprint"
                    size={19}
                  />
                  <div>
                    <h2 className="font-semibold">{KhoDich.TenKho}</h2>
                    <p className="mt-1 break-words text-sm text-fog">
                      {KhoDich.DiaChi}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-fog">
                  Vị trí chỉ được lấy khi bạn xác minh hoặc xác nhận nhập kho.
                  Máy chủ kiểm tra vị trí với tọa độ và bán kính đã lưu; ứng
                  dụng không theo dõi liên tục.
                </p>
                {ViTriHopLe && KetQuaViTri ? (
                  <div
                    aria-live="polite"
                    className="mt-4 rounded border border-phosphor/50 bg-phosphor/10 p-3 text-sm"
                  >
                    <p className="flex items-center gap-2 text-phosphor">
                      <CheckCircle2 aria-hidden size={18} /> Vị trí phù hợp với
                      kho nhận
                    </p>
                    <p className="mt-2 text-fog">
                      Khoảng cách do máy chủ tính: khoảng{" "}
                      {Math.round(KetQuaViTri.KhoangCachMet)} m. Độ chính xác
                      thiết bị: khoảng{" "}
                      {Math.round(KetQuaViTri.ViTri.DoChinhXacMet)} m.
                    </p>
                  </div>
                ) : null}
                {LoiViTri ? (
                  <div
                    aria-live="assertive"
                    className="mt-4 flex gap-2 rounded border border-tally/60 bg-tally/10 p-3 text-sm"
                  >
                    <AlertCircle
                      className="mt-0.5 shrink-0 text-tally"
                      size={18}
                    />
                    <p>{LoiViTri}</p>
                  </div>
                ) : null}
                <button
                  className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold disabled:opacity-60"
                  disabled={DangLayViTri || DangXacNhan}
                  onClick={() => void XacMinhViTri()}
                  type="button"
                >
                  <LocateFixed aria-hidden size={18} />
                  {DangLayViTri ? "Đang xác định vị trí…" : "Lấy lại vị trí"}
                </button>
              </section>
            ) : null}

            <section className="mt-5 rounded border border-rail bg-case p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Danh sách kiểm tra khi trả</h2>
                  <p className="mt-1 text-sm text-fog">
                    Đã quét và đánh giá {DaQuet.size}/{DanhSachThietBi.length}
                  </p>
                </div>
                <ClipboardCheck className="shrink-0 text-blueprint" size={22} />
              </div>
              <div className="mt-4 space-y-3">
                {DanhSachThietBi.map(({ Id: PhanCongId, ThietBi: ThietBi }) => {
                  const ThongTin = DaQuet.get(ThietBi.Id);
                  const CoChuyenKho = ThietBi.Kho?.Id !== KhoDichId;
                  return (
                    <article
                      className="min-w-0 rounded border border-rail bg-case-2 p-3"
                      key={PhanCongId}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          aria-label={ThongTin ? "Đã quét" : "Chưa quét"}
                          className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border ${ThongTin ? "border-phosphor bg-phosphor/15 text-phosphor" : "border-rail text-fog"}`}
                        >
                          {ThongTin ? <Check aria-hidden size={14} /> : null}
                        </span>
                        <div className="min-w-0">
                          <h3 className="break-words text-sm font-semibold">
                            {ThietBi.TenThietBi}
                          </h3>
                          <p className="mt-1 break-all font-mono text-[11px] text-fog">
                            {ThietBi.MaQR}
                          </p>
                          <p className="mt-1 break-words text-xs text-fog">
                            Kho xuất: {ThietBi.Kho?.TenKho ?? "Không xác định"}
                            {CoChuyenKho && KhoDich
                              ? ` → Kho nhập: ${KhoDich.TenKho}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      {ThongTin && (
                        <button
                          type="button"
                          disabled={DangXacNhan}
                          className="mt-2 min-h-11 rounded border border-rail px-3 text-sm text-fog"
                          aria-label={`Bỏ mã quét ${ThietBi.TenThietBi}`}
                          onClick={() =>
                            SetDaQuet((Truoc) => {
                              const Moi = new Map(Truoc);
                              Moi.delete(ThietBi.Id);
                              return Moi;
                            })
                          }
                        >
                          Bỏ quét
                        </button>
                      )}
                      {ThongTin ? (
                        <div className="mt-3 border-t border-rail pt-3">
                          <fieldset disabled={DangXacNhan}>
                            <legend className="text-xs font-semibold text-fog">
                              Tình trạng khi trả
                            </legend>
                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                              {(
                                Object.keys(
                                  NhanTinhTrang,
                                ) as TinhTrangTraThietBi[]
                              ).map((TinhTrang) => (
                                <label
                                  className={`flex min-h-11 items-center gap-2 rounded border px-3 text-sm ${ThongTin.TinhTrang === TinhTrang ? "border-blueprint bg-blueprint/15 text-paper" : "border-rail text-fog"}`}
                                  key={TinhTrang}
                                >
                                  <input
                                    checked={ThongTin.TinhTrang === TinhTrang}
                                    className="accent-tally"
                                    name={`tinh-trang-${ThietBi.Id}`}
                                    onChange={() =>
                                      CapNhatTinhTrang(ThietBi.Id, {
                                        TinhTrang: TinhTrang,
                                      })
                                    }
                                    type="radio"
                                  />
                                  {NhanTinhTrang[TinhTrang]}
                                </label>
                              ))}
                            </div>
                          </fieldset>
                          {ThongTin.TinhTrang !== "BINH_THUONG" ? (
                            <>
                              <label
                                className="mt-3 block text-xs font-semibold text-fog"
                                htmlFor={`ghi-chu-${ThietBi.Id}`}
                              >
                                Ghi chú tình trạng
                              </label>
                              <textarea
                                className="mt-2 min-h-20 w-full resize-y rounded border border-rail bg-gunmetal p-3 text-base"
                                id={`ghi-chu-${ThietBi.Id}`}
                                maxLength={1000}
                                disabled={DangXacNhan}
                                onChange={(SuKien) =>
                                  CapNhatTinhTrang(ThietBi.Id, {
                                    GhiChu: SuKien.target.value,
                                  })
                                }
                                placeholder="Mô tả dấu hiệu cần kiểm tra hoặc hư hỏng"
                                value={ThongTin.GhiChu}
                              />
                              {ThongTin.TinhTrang === "HU_HONG" ? (
                                <p className="mt-2 flex gap-2 text-xs leading-5 text-timecode">
                                  <AlertCircle
                                    aria-hidden
                                    className="mt-0.5 shrink-0"
                                    size={15}
                                  />
                                  Thiết bị sẽ được đánh dấu hư hỏng và không trở
                                  lại trạng thái sẵn sàng.
                                </p>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-fog">Chưa quét</p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            {ViTriHopLe && !DangXacNhan ? (
              <TrinhQuetQR key={NguCanh} OnTraCuu={XuLyMaQR} />
            ) : null}
            <button
              className="mt-5 min-h-12 w-full rounded-sm bg-tally px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!DaQuetDu || !ViTriHopLe || DangLayViTri || DangXacNhan}
              onClick={() => void XacNhanNhapKho()}
              type="button"
            >
              {DangXacNhan
                ? "Đang xác nhận vị trí và nhập kho…"
                : "Xác nhận hoàn tất nhập kho"}
            </button>
            {!DaQuetDu ? (
              <p className="mt-2 text-center text-xs text-fog">
                Cần quét và đánh giá đủ thiết bị trước khi xác nhận.
              </p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

function TrangThongBao({
  NoiDung: NoiDung,
  Loi: Loi = false,
}: {
  NoiDung: string;
  Loi?: boolean;
}) {
  return (
    <main className="min-h-[100dvh] bg-gunmetal p-4 text-paper">
      <div
        className={`mx-auto max-w-xl rounded border p-5 text-sm ${Loi ? "border-tally/60 bg-tally/10" : "border-rail bg-case text-fog"}`}
      >
        {NoiDung}
      </div>
    </main>
  );
}
