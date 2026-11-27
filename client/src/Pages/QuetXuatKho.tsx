import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  LocateFixed,
  MapPin,
  PackageCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { TrinhQuetQR } from "../Components/TrinhQuetQR";
import {
  KiemTraViTriKho,
  LayChecklistXuatKho,
  TraCuuThietBiXuatKho,
  XuatKho,
  type BangChungViTri,
  type ChecklistXuatKho,
  type PhuongThucQuet,
} from "../Services/VanHanhKhoService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import { TheoDoiCapNhatLich } from "../Services/SocketLichService";
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
}

function LayThongBaoViTri(Loi: unknown) {
  const ThongBaoTuApi = LayThongBaoLoi(Loi);
  return ThongBaoTuApi !== "Đã xảy ra lỗi. Vui lòng thử lại."
    ? ThongBaoTuApi
    : Loi instanceof Error
      ? Loi.message
      : ThongBaoTuApi;
}

export function QuetXuatKho() {
  const { id: Id = "" } = useParams();
  const [ThamSoTimKiem, SetThamSoTimKiem] = useSearchParams();
  const LoThayTheId = ThamSoTimKiem.get("LoThayTheId") ?? undefined;
  const DieuHuong = useNavigate();
  const [Checklist, SetChecklist] = useState<ChecklistXuatKho>();
  const [DangTai, SetDangTai] = useState(true);
  const [LoiTai, SetLoiTai] = useState("");
  const [DangLayViTri, SetDangLayViTri] = useState(false);
  const [KetQuaViTri, SetKetQuaViTri] = useState<KetQuaViTri>();
  const [LoiViTri, SetLoiViTri] = useState("");
  const [DaQuet, SetDaQuet] = useState<Map<string, KetQuaQuet>>(new Map());
  const KhoaXacNhan = useRef(false);
  const NguCanhHienTai = useRef("");
  const [DangXacNhan, SetDangXacNhan] = useState(false);
  const [DaHoanTat, SetDaHoanTat] = useState(false);

  useEffect(() => {
    let ConHieuLuc = true;
    async function TaiChecklist() {
      SetDangTai(true);
      SetLoiTai("");
      try {
        const DuLieu = await LayChecklistXuatKho(Id);
        if (ConHieuLuc) SetChecklist(DuLieu);
      } catch (Loi) {
        if (ConHieuLuc) SetLoiTai(LayThongBaoLoi(Loi));
      } finally {
        if (ConHieuLuc) SetDangTai(false);
      }
    }
    if (Id) void TaiChecklist();
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
          void LayChecklistXuatKho(Id)
            .then((Moi) => {
              SetChecklist(Moi);
              const HopLe = new Set(
                Moi.DanhSachThietBi.filter(
                  (Muc) =>
                    Muc.TrangThaiMuonTra === "CHO_XUAT_KHO" &&
                    Muc.ThietBi.TrangThai === "SAN_SANG",
                ).map((Muc) => Muc.ThietBi.Id),
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

  useEffect(
    () =>
      TheoDoiCapNhatLich(() => {
        if (!Id) return;
        void LayChecklistXuatKho(Id)
          .then((Moi) => {
            SetChecklist(Moi);
            const HopLe = new Set(
              Moi.DanhSachThietBi.filter(
                (Muc) =>
                  Muc.TrangThaiMuonTra === "CHO_XUAT_KHO" &&
                  Muc.ThietBi.TrangThai === "SAN_SANG",
              ).map((Muc) => Muc.ThietBi.Id),
            );
            SetDaQuet(
              (HienTai) =>
                new Map(
                  [...HienTai].filter(([ThietBiId]) => HopLe.has(ThietBiId)),
                ),
            );
          })
          .catch((Loi) => SetLoiTai(LayThongBaoLoi(Loi)));
      }, Id),
    [Id],
  );

  const DanhSachKho = useMemo(() => {
    const TheoId = new Map<
      string,
      NonNullable<ChecklistXuatKho["DanhSachThietBi"][number]["ThietBi"]["Kho"]>
    >();
    Checklist?.DanhSachThietBi.filter(
      (Muc) =>
        !Muc.HieuLucDen && (Muc.LoThayTheId ?? undefined) === LoThayTheId,
    ).forEach(({ ThietBi: ThietBi }) => {
      if (ThietBi.Kho?.DangHoatDong) TheoId.set(ThietBi.Kho.Id, ThietBi.Kho);
    });
    return [...TheoId.values()];
  }, [Checklist, LoThayTheId]);

  const KhoIdTuUrl = ThamSoTimKiem.get("KhoId") ?? "";
  const KhoId = DanhSachKho.some((Kho) => Kho.Id === KhoIdTuUrl)
    ? KhoIdTuUrl
    : (DanhSachKho[0]?.Id ?? "");
  const KhoDangChon = DanhSachKho.find((Kho) => Kho.Id === KhoId);
  const NguCanh = `${Id}/${KhoId}/${LoThayTheId ?? ""}`;
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
  const ViTriHopLe = KetQuaViTri?.KhoId === KhoId;
  const DanhSachTheoKho =
    Checklist?.DanhSachThietBi.filter(
      (Muc) =>
        Muc.ThietBi.Kho?.Id === KhoId &&
        !Muc.HieuLucDen &&
        (Muc.LoThayTheId ?? undefined) === LoThayTheId,
    ) ?? [];
  const DanhSachChoXuat = DanhSachTheoKho.filter(
    ({ TrangThaiMuonTra: TrangThaiMuonTra }) =>
      TrangThaiMuonTra === "CHO_XUAT_KHO",
  );
  const DaQuetDu =
    DanhSachChoXuat.length > 0 && DaQuet.size === DanhSachChoXuat.length;

  function DoiKho(KhoMoiId: string) {
    SetThamSoTimKiem(
      { KhoId: KhoMoiId, ...(LoThayTheId ? { LoThayTheId } : {}) },
      { replace: true },
    );
    SetKetQuaViTri(undefined);
    SetLoiViTri("");
    SetDaQuet(new Map());
  }

  async function XacMinhViTri() {
    if (!KhoId || DangLayViTri || KhoaXacNhan.current) return;
    SetDangLayViTri(true);
    SetLoiViTri("");
    SetKetQuaViTri(undefined);
    try {
      const ViTri = await LayViTriHienTai();
      const KetQua = await KiemTraViTriKho(KhoId, ViTri);
      if (NguCanhHienTai.current !== NguCanh) return;
      SetKetQuaViTri({
        KhoId,
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
    const ThietBi = await TraCuuThietBiXuatKho({
      CaQuayId: Id,
      KhoId: KhoId,
      MaQR: MaQR,
    });
    if (NguCanhHienTai.current !== NguCanh) return;
    if (!DanhSachChoXuat.some((Muc) => Muc.ThietBi.Id === ThietBi.Id)) {
      throw new Error(
        "Thiết bị không thuộc lô đang xuất. Hãy kiểm tra lô thay thế đã chọn.",
      );
    }
    if (DaQuet.has(ThietBi.Id)) {
      toast.info("Thiết bị này đã có trong danh sách kiểm tra.");
      return;
    }
    SetDaQuet((HienTai) => {
      if (HienTai.has(ThietBi.Id)) {
        return HienTai;
      }
      const Moi = new Map(HienTai);
      Moi.set(ThietBi.Id, { MaQR, PhuongThuc });
      return Moi;
    });
  }

  async function XacNhanXuatKho() {
    if (!DaQuetDu || !KhoId || !ViTriHopLe || KhoaXacNhan.current || DaHoanTat)
      return;
    KhoaXacNhan.current = true;
    SetDangXacNhan(true);
    SetLoiViTri("");
    try {
      const ViTriMoi = await LayViTriHienTai();
      if (NguCanhHienTai.current !== NguCanh) return;
      const KetQua = await XuatKho({
        LoThayTheId,
        CaQuayId: Id,
        KhoId: KhoId,
        DanhSachThietBi: [...DaQuet].map(([ThietBiId, ThongTin]) => ({
          ThietBiId: ThietBiId,
          MaQR: ThongTin.MaQR,
          PhuongThuc: ThongTin.PhuongThuc,
        })),
        ViTri: ViTriMoi,
      });
      SetDaHoanTat(true);
      toast.success(
        `Đã xuất ${KetQua.SoThietBi} thiết bị tại ${KetQua.TenKho}.`,
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
    return (
      <main className="min-h-[100dvh] bg-gunmetal p-4 text-paper">
        <div className="mx-auto max-w-xl rounded border border-rail bg-case p-5 text-sm text-fog">
          Đang tải danh sách nhận tài nguyên…
        </div>
      </main>
    );
  }
  if (LoiTai || !Checklist) {
    return (
      <main className="min-h-[100dvh] bg-gunmetal p-4 text-paper">
        <div className="mx-auto max-w-xl rounded border border-tally/60 bg-tally/10 p-5 text-sm">
          {LoiTai || "Không thể tải danh sách nhận tài nguyên."}
        </div>
      </main>
    );
  }
  if (DaHoanTat) {
    return (
      <main className="min-h-[100dvh] bg-gunmetal p-4 text-paper">
        <section className="mx-auto max-w-xl rounded border border-phosphor/50 bg-case p-6 text-center">
          <CheckCircle2 className="mx-auto text-phosphor" size={36} />
          <h1 className="mt-4 font-serif text-2xl">Xuất kho thành công</h1>
          <p className="mt-2 text-sm leading-6 text-fog">
            Toàn bộ thiết bị trong lô đã được ghi nhận cùng bằng chứng vị trí.
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
                <p className="mt-2 text-phosphor">Đã xuất kho</p>
              </li>
            ))}
          </ul>
          <button
            className="mt-6 min-h-11 w-full rounded-sm bg-tally px-4 text-sm font-semibold"
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
    <main className="min-h-[100dvh] bg-gunmetal p-4 pb-[calc(2rem+env(safe-area-inset-bottom))] text-paper">
      <section className="mx-auto max-w-xl">
        <button
          className="flex min-h-11 items-center gap-2 text-sm text-fog"
          onClick={() => DieuHuong(`/mobile/ca-quay/${Id}`)}
          type="button"
        >
          <ArrowLeft aria-hidden size={17} /> Quay lại ca quay
        </button>
        <h1 className="mt-3 break-words font-serif text-2xl">Xuất thiết bị</h1>
        <p className="mt-1 break-words text-sm text-fog">
          {Checklist.TieuDe} · {Checklist.DuAn.TenDuAn}
        </p>

        {DanhSachKho.length > 1 ? (
          <label className="mt-5 block text-sm font-semibold">
            Kho thực hiện
            <select
              className="mt-2 min-h-11 w-full rounded border border-rail bg-case-2 px-3 text-base"
              onChange={(SuKien) => DoiKho(SuKien.target.value)}
              value={KhoId}
              disabled={DangLayViTri || DangXacNhan}
            >
              {DanhSachKho.map((Kho) => (
                <option key={Kho.Id} value={Kho.Id}>
                  {Kho.TenKho}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {!KhoDangChon ? (
          <div className="mt-5 rounded border border-tally/60 bg-tally/10 p-4 text-sm">
            Ca quay chưa có thiết bị thuộc kho đang hoạt động.
          </div>
        ) : (
          <>
            <section className="mt-5 rounded border border-rail bg-case p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 shrink-0 text-blueprint" size={19} />
                <div className="min-w-0">
                  <h2 className="break-words font-semibold">
                    {KhoDangChon.TenKho}
                  </h2>
                  <p className="mt-1 break-words text-sm text-fog">
                    {KhoDangChon.DiaChi}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-fog">
                MEDIOPS cần vị trí hiện tại để xác nhận bạn đang thực hiện giao
                dịch tại đúng kho. Vị trí chỉ được lấy khi bạn xác minh hoặc xác
                nhận xuất kho, không được theo dõi liên tục.
              </p>
              {ViTriHopLe && KetQuaViTri ? (
                <div
                  aria-live="polite"
                  className="mt-4 rounded border border-phosphor/50 bg-phosphor/10 p-3 text-sm"
                >
                  <p className="flex items-center gap-2 text-phosphor">
                    <CheckCircle2 aria-hidden size={18} /> Vị trí phù hợp với
                    kho
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
                className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-tally px-4 text-sm font-semibold disabled:opacity-60"
                disabled={DangLayViTri || DangXacNhan}
                onClick={() => void XacMinhViTri()}
                type="button"
              >
                <LocateFixed aria-hidden size={18} />
                {DangLayViTri ? "Đang xác định vị trí..." : "Lấy lại vị trí"}
              </button>
            </section>

            <section className="mt-5 rounded border border-rail bg-case p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Danh sách kiểm tra thiết bị</h2>
                  <p className="mt-1 text-sm text-fog">
                    Đã quét {DaQuet.size}/{DanhSachChoXuat.length} thiết bị chờ
                    xuất
                  </p>
                </div>
                <PackageCheck className="shrink-0 text-blueprint" size={22} />
              </div>
              <div className="mt-4 space-y-2">
                {DanhSachTheoKho.map(
                  ({
                    Id: PhanCongId,
                    TrangThaiMuonTra: TrangThaiMuonTra,
                    ThietBi: ThietBi,
                  }) => {
                    const DaQuetThietBi = DaQuet.has(ThietBi.Id);
                    const DaXuat = TrangThaiMuonTra === "DA_XUAT_KHO";
                    return (
                      <article
                        className="flex items-start gap-3 rounded border border-rail bg-case-2 p-3"
                        key={PhanCongId}
                      >
                        <span
                          aria-label={
                            DaXuat
                              ? "Đã xuất kho"
                              : DaQuetThietBi
                                ? "Đã quét"
                                : "Chưa quét"
                          }
                          className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border ${
                            DaXuat || DaQuetThietBi
                              ? "border-phosphor bg-phosphor/15 text-phosphor"
                              : "border-rail text-fog"
                          }`}
                        >
                          {DaXuat || DaQuetThietBi ? (
                            <Check aria-hidden size={14} />
                          ) : null}
                        </span>
                        <div className="min-w-0">
                          <h3 className="break-words text-sm font-semibold">
                            {ThietBi.TenThietBi}
                          </h3>
                          <p className="mt-1 break-all font-mono text-[11px] text-fog">
                            {ThietBi.MaQR}
                          </p>
                          <p className="mt-1 text-xs text-fog">
                            {DaXuat
                              ? "Đã xuất kho"
                              : DaQuetThietBi
                                ? "Đã quét"
                                : "Chưa quét"}
                          </p>
                        </div>
                        {DaQuetThietBi && !DaXuat && (
                          <button
                            type="button"
                            disabled={DangXacNhan}
                            aria-label={`Bỏ mã quét ${ThietBi.TenThietBi}`}
                            className="ml-auto min-h-11 shrink-0 rounded border border-rail px-3 text-sm text-fog"
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
                      </article>
                    );
                  },
                )}
              </div>
            </section>

            {ViTriHopLe && !DangXacNhan && DanhSachChoXuat.length > 0 ? (
              <TrinhQuetQR key={NguCanh} OnTraCuu={XuLyMaQR} />
            ) : null}

            <button
              className="mt-5 min-h-12 w-full rounded-sm bg-tally px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!DaQuetDu || !ViTriHopLe || DangLayViTri || DangXacNhan}
              onClick={() => void XacNhanXuatKho()}
              type="button"
            >
              {DangXacNhan
                ? "Đang xác nhận vị trí và xuất kho..."
                : "Xác nhận hoàn tất xuất kho"}
            </button>
            {!DaQuetDu && DanhSachChoXuat.length > 0 ? (
              <p className="mt-2 text-center text-xs text-fog">
                Cần quét đủ thiết bị của kho trước khi xác nhận.
              </p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
