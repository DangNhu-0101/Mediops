import { DemNguocGiuCho } from "./DemNguocGiuCho";
import { MoiNhanSuPhuongAn } from "./MoiNhanSuPhuongAn";
import {
  DocPhienCa,
  TaoPhienCa,
  ChotPhuongAn,
  HuyPhien,
  type PhienQuyetDinh,
} from "../Services/PhienQuyetDinhService";
import { GioHienThi } from "../Services/SuCoVanHanhService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  LoaderCircle,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GoiYGiaiQuyetXungDotCaQuay } from "../Services/CaQuayService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import type {
  KetQuaGiaiQuyetXungDot,
  NhomPhuongAnGiaiQuyet,
  PhuongAnGiaiQuyetXungDot,
} from "../Types/CaQuay";

const NhanNhom: Record<NhomPhuongAnGiaiQuyet, string> = {
  GIU_NGUYEN_LICH: "Giữ nguyên lịch",
  DIEU_CHINH_THOI_GIAN: "Điều chỉnh thời gian",
  THAY_DOI_TAI_NGUYEN: "Thay đổi tài nguyên",
  THUE_NGOAI: "Thuê ngoài",
  CAN_XU_LY_THU_CONG: "Cần xử lý thủ công",
};

const ThuTuNhom: NhomPhuongAnGiaiQuyet[] = [
  "GIU_NGUYEN_LICH",
  "DIEU_CHINH_THOI_GIAN",
  "THAY_DOI_TAI_NGUYEN",
  "THUE_NGOAI",
  "CAN_XU_LY_THU_CONG",
];

function DinhDangThoiGian(GiaTri: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(GiaTri));
}

function DinhDangChiPhi(PhuongAn: PhuongAnGiaiQuyetXungDot) {
  const SoTien = PhuongAn.ChiPhiBoSung.SoTien;
  if (!SoTien) return PhuongAn.ChiPhiBoSung.Nhan;
  return `${new Intl.NumberFormat("vi-VN").format(Number(SoTien))} ₫ / ngày`;
}

// Chỉ hiện hai câu đầu; phần đầy đủ nằm trong mục xem tiêu chí.
function RutGonGiaiThich(NoiDung: string) {
  const CacCau = NoiDung.split(/(?<=\.)\s+/);
  return CacCau.slice(0, 2).join(" ");
}

function TomTatThayDoi(PhuongAn: PhuongAnGiaiQuyetXungDot) {
  const ThayDoi = PhuongAn.ThayDoi;
  const KetQua: string[] = [];
  if (ThayDoi.ThoiGian) {
    KetQua.push(
      `${DinhDangThoiGian(ThayDoi.ThoiGian.BatDau)} đến ${DinhDangThoiGian(ThayDoi.ThoiGian.KetThuc)}`,
    );
  }
  if (ThayDoi.Studio) KetQua.push(`Studio: ${ThayDoi.Studio.TenStudio}`);
  ThayDoi.ThietBi?.forEach((Muc) =>
    KetQua.push(`${Muc.TenThietBiGoc} → ${Muc.TenThietBiMoi}`),
  );
  ThayDoi.NhanSu?.forEach((Muc) =>
    KetQua.push(`${Muc.TenNhanSuGoc} → ${Muc.TenNhanSuMoi}`),
  );
  if (ThayDoi.NguoiPhuTrach) {
    KetQua.push(
      `Người phụ trách ca: ${ThayDoi.NguoiPhuTrach.TenNguoiGoc} → ${ThayDoi.NguoiPhuTrach.TenNguoiMoi}`,
    );
  }
  return KetQua.length ? KetQua : ["Không tự động thay đổi dữ liệu"];
}

function ThePhuongAn({
  Phien,
  OnTaiLai,
  PhuongAn: PhuongAn,
  DangApDung: DangApDung,
  DuocChonSoSanh: DuocChonSoSanh,
  OnApDung: OnApDung,
  OnChonSoSanh: OnChonSoSanh,
}: {
  Phien?: PhienQuyetDinh;
  OnTaiLai: () => void;
  PhuongAn: PhuongAnGiaiQuyetXungDot;
  DangApDung: boolean;
  DuocChonSoSanh: boolean;
  OnApDung: () => void;
  OnChonSoSanh: () => void;
}) {
  const [MoChiTiet, SetMoChiTiet] = useState(false);
  const ChuaDatYeuCau = PhuongAn.DanhGiaYeuCau?.DapUngBatBuoc === false;
  const DaGiaiQuyetHet = PhuongAn.XungDotConLai.length === 0 && !ChuaDatYeuCau;
  const ThueNgoai = PhuongAn.ThayDoi.ThietBi?.find(
    (Muc) => Muc.Nguon === "THUE_NGOAI",
  );
  return (
    <article className="rounded border border-rail bg-case-2 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-timecode">
              Ưu tiên đề xuất #{PhuongAn.ThuTuUuTien}
            </span>
            <span
              className={`rounded px-2 py-1 ${
                DaGiaiQuyetHet
                  ? "bg-phosphor/15 text-phosphor"
                  : "bg-timecode/15 text-timecode"
              }`}
            >
              {DaGiaiQuyetHet
                ? "Đạt kiểm tra hiện tại"
                : ChuaDatYeuCau
                  ? PhuongAn.DanhGiaYeuCau?.TrangThai === "CHUA_DU_DU_LIEU"
                    ? "Cần xác nhận yêu cầu"
                    : "Chưa đáp ứng yêu cầu"
                  : `Còn ${PhuongAn.XungDotConLai.length} xung đột`}
            </span>
          </div>
          <h4 className="mt-3 text-lg font-bold leading-snug text-tally">
            {PhuongAn.TieuDe}
          </h4>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-fog">
            {RutGonGiaiThich(PhuongAn.GiaiThich)}
          </p>
        </div>
        <label className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded border border-rail px-3 text-sm text-fog hover:text-paper sm:w-auto sm:justify-start">
          <input
            checked={DuocChonSoSanh}
            className="accent-tally"
            onChange={OnChonSoSanh}
            type="checkbox"
          />
          So sánh
        </label>
      </div>

      <ul className="mt-4 grid gap-2 text-sm text-paper sm:grid-cols-2">
        {TomTatThayDoi(PhuongAn).map((Muc) => (
          <li className="flex items-start gap-2" key={Muc}>
            <Check className="mt-0.5 shrink-0 text-phosphor" size={15} />
            <strong>{Muc}</strong>
          </li>
        ))}
      </ul>

      {Phien && (
        <MoiNhanSuPhuongAn
          Phien={Phien}
          PhuongAn={PhuongAn}
          OnCapNhat={OnTaiLai}
        />
      )}
      {ThueNgoai && (
        <p className="mt-4 text-sm text-timecode">
          Cần liên hệ bên cho thuê để xác nhận thông số, số lượng, giá và thời
          gian giao nhận.
        </p>
      )}

      <button
        className="mt-4 flex min-h-10 items-center gap-2 text-sm font-semibold text-blueprint hover:text-paper"
        onClick={() => SetMoChiTiet((GiaTri) => !GiaTri)}
        type="button"
      >
        {MoChiTiet ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {MoChiTiet ? "Ẩn tiêu chí và đánh đổi" : "Xem tiêu chí và đánh đổi"}
      </button>

      {MoChiTiet && (
        <div className="mt-3 grid gap-4 border-t border-rail pt-4 md:grid-cols-2">
          <p className="text-sm leading-6 text-fog md:col-span-2">
            {PhuongAn.GiaiThich}
          </p>
          <div>
            <p className="text-sm font-semibold text-paper">
              Vì sao được xếp hạng
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-fog">
              {PhuongAn.TieuChiXepHang.map((Muc) => (
                <li key={Muc}>• {Muc}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-paper">
              Đánh đổi cần lưu ý
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-fog">
              {(PhuongAn.DanhSachDanhDoi.length
                ? PhuongAn.DanhSachDanhDoi
                : ["Không có đánh đổi đáng kể từ dữ liệu hiện có."]
              ).map((Muc) => (
                <li key={Muc}>• {Muc}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rail pt-4">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-fog">
          <span className="flex items-center gap-1.5">
            <Clock3 size={14} />
            {PhuongAn.AnhHuongThoiGianPhut === 0
              ? "Không đổi giờ"
              : `${PhuongAn.AnhHuongThoiGianPhut > 0 ? "Trễ" : "Sớm"} ${Math.abs(PhuongAn.AnhHuongThoiGianPhut)} phút`}
          </span>
          <span>{DinhDangChiPhi(PhuongAn)}</span>
        </div>
        {Phien &&
        Phien.NoiDungConHieuLuc &&
        Date.parse(Phien.HetHanLuc) > Date.now() &&
        PhuongAn.ApDungDuoc &&
        DaGiaiQuyetHet ? (
          <button
            className="flex min-h-11 items-center gap-2 rounded bg-tally px-4 text-sm font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-60"
            disabled={DangApDung}
            onClick={OnApDung}
            type="button"
          >
            {DangApDung ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <ShieldCheck size={17} />
            )}
            {DangApDung ? "Đang kiểm tra lại…" : "Chọn phương án"}
          </button>
        ) : (
          <span className="text-sm font-semibold text-timecode">
            {PhuongAn.KhaThi === "CAN_XAC_NHAN"
              ? "Cần xác nhận trước khi chọn"
              : "Phương án tư vấn, không tự động áp dụng"}
          </span>
        )}
      </div>
    </article>
  );
}

function BangSoSanh({
  DanhSach: DanhSach,
}: {
  DanhSach: PhuongAnGiaiQuyetXungDot[];
}) {
  if (DanhSach.length < 2) return null;
  const Hang = [
    ["Thứ hạng", (Muc: PhuongAnGiaiQuyetXungDot) => `Top ${Muc.ThuTuUuTien}`],
    [
      "Tương đồng kỹ thuật",
      (Muc: PhuongAnGiaiQuyetXungDot) =>
        Muc.ThayDoi.ThietBi?.filter(
          (ThietBi) => ThietBi.DiemTuongDong !== undefined,
        )
          .map((ThietBi) => `${ThietBi.DiemTuongDong}%`)
          .join(", ") || "Không áp dụng",
    ],
    [
      "Thông số khác biệt",
      (Muc: PhuongAnGiaiQuyetXungDot) => {
        if (!Muc.SoSanh) return "Không áp dụng";
        const KhacBiet = Muc.SoSanh.filter(
          (TieuChi) => TieuChi.KetLuan !== "Đạt yêu cầu",
        ).map(
          (TieuChi) =>
            `${TieuChi.TieuChi}: ${TieuChi.DangCan} → ${TieuChi.DeXuat}`,
        );
        return KhacBiet.length ? KhacBiet.join("; ") : "Giống máy gốc";
      },
    ],
    [
      "Vị trí lấy",
      (Muc: PhuongAnGiaiQuyetXungDot) => Muc.ViTriDeXuat ?? "Không áp dụng",
    ],
    [
      "Đánh đổi",
      (Muc: PhuongAnGiaiQuyetXungDot) =>
        Muc.DanhSachDanhDoi.length ? Muc.DanhSachDanhDoi.join(" ") : "Không có",
    ],
    [
      "Thời gian",
      (Muc: PhuongAnGiaiQuyetXungDot) =>
        Muc.AnhHuongThoiGianPhut === 0
          ? "Giữ nguyên"
          : `${Muc.AnhHuongThoiGianPhut > 0 ? "Trễ" : "Sớm"} ${Math.abs(Muc.AnhHuongThoiGianPhut)} phút`,
    ],
    [
      "Mức thay đổi",
      (Muc: PhuongAnGiaiQuyetXungDot) =>
        `${TomTatThayDoi(Muc).length} hạng mục`,
    ],
    ["Chi phí", DinhDangChiPhi],
    [
      "Xác nhận",
      (Muc: PhuongAnGiaiQuyetXungDot) =>
        Muc.KhaThi === "KHA_THI"
          ? "Đã đủ dữ liệu"
          : Muc.KhaThi === "CAN_XAC_NHAN"
            ? "Cần xác nhận"
            : "Tư vấn",
    ],
    [
      "Kết quả",
      (Muc: PhuongAnGiaiQuyetXungDot) =>
        Muc.DanhGiaYeuCau?.DapUngBatBuoc === false
          ? Muc.DanhGiaYeuCau.TrangThai === "CHUA_DU_DU_LIEU"
            ? "Cần xác nhận yêu cầu"
            : "Chưa đáp ứng yêu cầu"
          : Muc.XungDotConLai.length
            ? `Còn ${Muc.XungDotConLai.length} xung đột`
            : "Giải quyết toàn bộ",
    ],
  ] as const;
  return (
    <section className="overflow-hidden rounded border border-blueprint/60 bg-blueprint/10">
      <div className="flex items-center gap-2 border-b border-blueprint/30 px-4 py-3">
        <Scale className="text-blueprint" size={18} />
        <h3 className="font-semibold text-paper">So sánh phương án đã chọn</h3>
      </div>
      <div className="space-y-4 p-4 md:hidden">
        {DanhSach.map((Muc) => (
          <article
            key={Muc.Id}
            className="border-b border-rail pb-4 last:border-0"
          >
            <h4 className="font-bold text-tally">{Muc.TieuDe}</h4>
            <dl className="mt-3 space-y-3 text-sm">
              {Hang.map(([Nhan, LayGiaTri]) => (
                <div key={Nhan}>
                  <dt className="text-fog">{Nhan}</dt>
                  <dd className="mt-1 text-paper">{LayGiaTri(Muc)}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[680px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-blueprint/30 text-fog">
              <th className="px-4 py-3 font-semibold">Tiêu chí</th>
              {DanhSach.map((Muc) => (
                <th
                  className="px-4 py-3 text-base font-bold text-tally"
                  key={Muc.Id}
                >
                  {Muc.TieuDe}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Hang.map(([Nhan, LayGiaTri]) => {
              // Hàng có giá trị khác nhau giữa các phương án được làm nổi bật.
              const KhacNhau =
                new Set(DanhSach.map((Muc) => LayGiaTri(Muc))).size > 1;
              return (
                <tr
                  className={`border-b border-blueprint/20 last:border-0 ${
                    KhacNhau ? "bg-timecode/10" : ""
                  }`}
                  key={Nhan}
                >
                  <th className="px-4 py-3 font-semibold text-fog">
                    {Nhan}
                    {KhacNhau && (
                      <span className="ml-2 text-xs text-timecode">
                        Khác nhau
                      </span>
                    )}
                  </th>
                  {DanhSach.map((Muc) => (
                    <td
                      className={`px-4 py-3 ${
                        KhacNhau ? "font-semibold text-paper" : "text-fog"
                      }`}
                      key={Muc.Id}
                    >
                      {LayGiaTri(Muc)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TrungTamGiaiQuyetXungDot({
  CaQuayId: CaQuayId,
  DangMo: DangMo,
  OnDong: OnDong,
  OnDaApDung: OnDaApDung,
}: {
  CaQuayId: string;
  DangMo: boolean;
  OnDong: () => void;
  OnDaApDung: () => Promise<void>;
}) {
  const [Phien, SetPhien] = useState<PhienQuyetDinh>();
  const [NguoiPhuTrachId, SetNguoiPhuTrach] = useState("");
  const [PhuongAnCho, SetPhuongAnCho] = useState("");
  const [DaXacNhan, SetXacNhan] = useState(false);
  const [KetQua, SetKetQua] = useState<KetQuaGiaiQuyetXungDot>();
  const [DangTai, SetDangTai] = useState(false);
  const [Loi, SetLoi] = useState("");
  const [DangApDungId, SetDangApDungId] = useState("");
  const [CacIdSoSanh, SetCacIdSoSanh] = useState<string[]>([]);

  async function TaiPhuongAn(TaoMoi = false, AmTham = false) {
    if (!AmTham) {
      SetDangTai(true);
      SetLoi("");
    }
    if (TaoMoi) SetCacIdSoSanh([]);
    try {
      // Mở danh sách là tạo phiên và giữ chỗ luôn; phiên hết hạn thì tự tính lại.
      const PhienDangCo = TaoMoi ? null : await DocPhienCa(CaQuayId);
      const ConHan =
        !!PhienDangCo &&
        PhienDangCo.NoiDungConHieuLuc &&
        Date.parse(PhienDangCo.HetHanLuc) > Date.now();
      let KetQuaPhien = PhienDangCo;
      if (!ConHan) {
        try {
          KetQuaPhien = await TaoPhienCa(CaQuayId, !!PhienDangCo || !!Phien);
        } catch (LoiTao) {
          KetQuaPhien = null;
          SetLoi(LayThongBaoLoi(LoiTao));
        }
      }
      SetPhien(KetQuaPhien ?? undefined);
      SetKetQua(
        KetQuaPhien
          ? {
              CaQuayId,
              MaPhienBan: KetQuaPhien.MaPhienBan,
              DanhSachXungDot: [],
              DanhSachPhuongAn: KetQuaPhien.DanhSachPhuongAn,
              ThongBao: KetQuaPhien.CanhBao,
            }
          : await GoiYGiaiQuyetXungDotCaQuay(CaQuayId),
      );
    } catch (LoiTai) {
      SetLoi(LayThongBaoLoi(LoiTai));
    } finally {
      if (!AmTham) SetDangTai(false);
    }
  }

  useEffect(() => {
    if (DangMo) void TaiPhuongAn();
  }, [CaQuayId, DangMo]);

  useEffect(() => {
    if (!DangMo) return;
    return TheoDoiVanHanh(
      ["loi_moi:cap_nhat", "quyet_dinh:cap_nhat"],
      () => void TaiPhuongAn(false, true),
    );
  }, [CaQuayId, DangMo]);
  const CacNhom = useMemo(
    () =>
      ThuTuNhom.map((Nhom) => ({
        Nhom: Nhom,
        DanhSach:
          KetQua?.DanhSachPhuongAn.filter((Muc) => Muc.Nhom === Nhom) ?? [],
      })).filter((Muc) => Muc.DanhSach.length),
    [KetQua],
  );
  const DanhSachSoSanh =
    KetQua?.DanhSachPhuongAn.filter((Muc) => CacIdSoSanh.includes(Muc.Id)) ??
    [];

  function ChonSoSanh(Id: string) {
    SetCacIdSoSanh((HienTai) => {
      if (HienTai.includes(Id)) return HienTai.filter((Muc) => Muc !== Id);
      if (HienTai.length >= 3) {
        toast.info("Có thể so sánh tối đa 3 phương án cùng lúc.");
        return HienTai;
      }
      return [...HienTai, Id];
    });
  }

  async function ApDung(PhuongAnId: string) {
    if (!KetQua || !Phien || !DaXacNhan || !NguoiPhuTrachId) return;
    SetDangApDungId(PhuongAnId);
    try {
      await ChotPhuongAn(Phien.PhienId, PhuongAnId, NguoiPhuTrachId);
      toast.success("Đã áp dụng phương án và kiểm tra lại lịch ca quay.");
      await OnDaApDung();
      OnDong();
    } catch (LoiApDung) {
      SetLoi(LayThongBaoLoi(LoiApDung));
    } finally {
      SetDangApDungId("");
    }
  }

  if (!DangMo) return null;
  return (
    <section
      aria-labelledby="tieu-de-trung-tam-xung-dot"
      className="rounded border border-tally/50 bg-case p-4 md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            className="font-serif text-xl text-paper md:text-2xl"
            id="tieu-de-trung-tam-xung-dot"
          >
            Các phương án xử lý
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-fog">
            Hệ thống phân tích và xếp thứ tự để hỗ trợ quyết định. Không phương
            án nào được tự động chọn thay bạn.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="min-h-11 rounded border border-rail px-3 text-sm text-fog hover:text-paper"
            disabled={Boolean(DangApDungId)}
            onClick={OnDong}
            type="button"
          >
            Đóng
          </button>
        </div>
      </div>

      {Phien && (
        <div className="mt-4 space-y-2 text-sm">
          <p>
            {Phien.NoiDungConHieuLuc && Date.parse(Phien.HetHanLuc) > Date.now()
              ? "Phiên quyết định đang mở"
              : "Phiên đã hết hiệu lực; cần tính lại"}
            . Tạo lượt mới hủy lời mời cũ.
          </p>
          {Phien.GiuCho.map((Muc) => (
            <p key={`${Muc.TaiNguyenId}:${Muc.BatDau}`}>
              Giữ <strong>{Muc.TenTaiNguyen}</strong> đến{" "}
              {GioHienThi(Muc.HetHanLuc)} ·{" "}
              <DemNguocGiuCho
                HetHanLuc={Muc.HetHanLuc}
                GioMayChu={Phien.GioMayChu}
                OnHetHan={() => void TaiPhuongAn(false, true)}
              />{" "}
              · Khoảng sử dụng: {GioHienThi(Muc.BatDau)} –{" "}
              {GioHienThi(Muc.KetThuc)}
            </p>
          ))}
          <button
            className="min-h-11 underline"
            onClick={() =>
              void HuyPhien(Phien.PhienId)
                .then(() => TaiPhuongAn())
                .catch((LoiHuy) => SetLoi(LayThongBaoLoi(LoiHuy)))
            }
          >
            Hủy phiên và giải phóng giữ chỗ
          </button>
        </div>
      )}
      {PhuongAnCho && Phien && (
        <fieldset className="mt-4 space-y-3 border-t border-rail pt-4">
          <legend>Chốt phương án đã chọn</legend>
          <label className="block">
            Người phụ trách bàn giao
            <select
              className="ml-2 min-h-11 border border-rail bg-case p-2"
              value={NguoiPhuTrachId}
              onChange={(SuKien) => SetNguoiPhuTrach(SuKien.target.value)}
            >
              <option value="">Chọn người trong ca</option>
              {Phien.NguoiPhuTrach.map((Nguoi) => (
                <option key={Nguoi.Id} value={Nguoi.Id}>
                  {Nguoi.HoTen}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={DaXacNhan}
              onChange={(SuKien) => SetXacNhan(SuKien.target.checked)}
            />
            Đã xác nhận địa điểm, thời gian và kế hoạch bàn giao
          </label>
          <button
            className="min-h-11 rounded bg-tally px-4 disabled:opacity-50"
            disabled={!DaXacNhan || !NguoiPhuTrachId || !!DangApDungId}
            onClick={() => void ApDung(PhuongAnCho)}
          >
            Chốt phân công
          </button>
        </fieldset>
      )}
      {Loi && (
        <div
          className="mt-5 flex items-start gap-3 rounded border border-tally/60 bg-tally/10 p-4"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 shrink-0 text-tally" size={18} />
          <div>
            <p className="font-semibold text-paper">
              Không thể hoàn tất yêu cầu
            </p>
            <p className="mt-1 text-sm text-fog">{Loi}</p>
          </div>
        </div>
      )}

      {DangTai ? (
        <div
          className="mt-6 space-y-3"
          role="status"
          aria-label="Đang phân tích phương án"
        >
          {[0, 1, 2].map((Muc) => (
            <div
              className="h-44 animate-pulse rounded border border-rail bg-case-2"
              key={Muc}
            />
          ))}
        </div>
      ) : KetQua?.DanhSachPhuongAn.length ? (
        <div className="mt-6 space-y-7">
          <BangSoSanh DanhSach={DanhSachSoSanh} />
          {CacNhom.map((Nhom) => (
            <section key={Nhom.Nhom}>
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-paper">
                {Nhom.Nhom === "GIU_NGUYEN_LICH" ? (
                  <ShieldCheck className="text-phosphor" size={18} />
                ) : (
                  <Clock3 className="text-timecode" size={18} />
                )}
                {NhanNhom[Nhom.Nhom]}
              </h3>
              <div className="space-y-3">
                {Nhom.DanhSach.map((PhuongAn) => (
                  <ThePhuongAn
                    DangApDung={DangApDungId === PhuongAn.Id}
                    DuocChonSoSanh={CacIdSoSanh.includes(PhuongAn.Id)}
                    key={PhuongAn.Id}
                    OnApDung={() => SetPhuongAnCho(PhuongAn.Id)}
                    Phien={Phien}
                    OnTaiLai={() => void TaiPhuongAn(false, true)}
                    OnChonSoSanh={() => ChonSoSanh(PhuongAn.Id)}
                    PhuongAn={PhuongAn}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded border border-rail bg-case-2 px-5 py-10 text-center">
          <ShieldCheck className="mx-auto text-phosphor" size={30} />
          <p className="mt-3 font-semibold text-paper">
            {KetQua?.ThongBao ?? "Chưa có phương án xử lý"}
          </p>
        </div>
      )}
    </section>
  );
}
