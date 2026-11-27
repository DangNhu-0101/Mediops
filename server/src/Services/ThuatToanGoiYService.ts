import { KiemTraTuongThichThietBi } from "./TuongThichThietBiService.js";
import {
  LoaiTaiNguyen,
  Prisma,
  TrangThaiSuCo,
  TrangThaiThietBi,
} from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiKhongTimThay } from "./LoiNghiepVuService.js";
import { KiemTraXungDotToanDien } from "./ThuatToanXungDotService.js";
import {
  DanhGiaYeuCauTaiNguyen,
  LayTaiNguyenDoiChieu,
  LayYeuCauCaQuay,
  type DanhGiaYeuCau,
} from "./YeuCauTaiNguyenService.js";

type ThongSo = Record<string, unknown>;

export interface SoSanhThongSo {
  TenThongSo: string;
  GiaTriGoc: unknown;
  GiaTriUngVien?: unknown;
  MucTuongDong: number;
}

export interface ThietBiDeXuat {
  ThietBi: {
    Id: string;
    MaQR: string;
    SoSeri: string;
    TenThietBi: string;
    DanhMucId: string;
    ThongSoKyThuat: Prisma.JsonValue;
    TrangThai: TrangThaiThietBi;
    HinhAnhUrl: string | null;
    ViTriKho: string | null;
    DanhMuc: { Id: string; TenDanhMuc: string };
  };
  DiemTuongDong: number;
  TyLePhanTram: string;
  ThongSoTuongDong: SoSanhThongSo[];
  ThongSoKhacBiet: SoSanhThongSo[];
  ThongSoThieu: SoSanhThongSo[];
  KhaDung: true;
  TuongThichKyThuat: {
    HopLe: true;
    CanThietBiTrungGian: boolean;
    ThietBiTrungGian: Array<{ Id: string; TenThietBi: string }>;
    DienGiai: string[];
  };
  LyDoGoiY: string;
  DanhGiaYeuCau: DanhGiaYeuCau;
}

export interface ThamSoGoiYThayThe {
  DonViId: string;
  ThietBiGocId: string;
  CaQuayId?: string;
  ThoiGianBatDau?: Date;
  ThoiGianKetThuc?: Date;
  ThoiGianChuanBiPhut?: number;
}

export const NhanThongSo: Record<string, string> = {
  thuongHieu: "Thương hiệu",
  ngamOngKinh: "Ngàm ống kính",
  loaiCamBien: "Loại cảm biến",
  kichThuocCamBienMm: "Kích thước cảm biến",
  doPhanGiaiHieuDungMp: "Độ phân giải hiệu dụng",
  doPhanGiaiVideoToiDa: "Độ phân giải video tối đa",
  tocDoKhungHinh4KToiDaFps: "Tốc độ khung hình 4K tối đa",
  daiTuongPhanStop: "Dải tương phản",
  doSauBitToiDa: "Độ sâu bit tối đa",
  layMauMauToiDa: "Lấy mẫu màu tối đa",
  codecVideo: "Codec video",
  chongRungThanMay: "Chống rung thân máy",
  isoVideo: "Dải ISO video",
  khoiLuongThanMayG: "Khối lượng thân máy",
  layNetTuDong: "Lấy nét tự động",
  theNho: "Thẻ nhớ",
  ketNoi: "Kết nối",
  dinhDangCamBien: "Định dạng cảm biến",
  tieuCuNhoNhatMm: "Tiêu cự nhỏ nhất",
  tieuCuLonNhatMm: "Tiêu cự lớn nhất",
  khauDoLonNhat: "Khẩu độ lớn nhất",
  chongRungQuangHoc: "Chống rung quang học",
  ketNoiAmThanh: "Kết nối âm thanh",
  nguonPhantomV: "Nguồn phantom",
  congSuatDauRaW: "Công suất đầu ra",
  ngamPhuKien: "Ngàm phụ kiện",
};

const CacThongSoDinhDanh = new Set(["model"]);
const CacThongSoTrongYeu = [
  /ngam/i,
  /loai/i,
  /camBien/i,
  /doPhanGiai/i,
  /tocDoKhungHinh/i,
  /ketNoi/i,
  /dinhDang/i,
  /huongThu/i,
];
const CacThongSoVatLy = [/kichThuoc/i, /khoiLuong/i];

function LaDoiTuong(GiaTri: unknown): GiaTri is Record<string, unknown> {
  return (
    typeof GiaTri === "object" && GiaTri !== null && !Array.isArray(GiaTri)
  );
}

function ChuanHoaChuoi(GiaTri: unknown): string {
  return String(GiaTri).trim().toLocaleLowerCase("vi");
}

function TrongSoThongSo(TenThongSo: string): number {
  if (TenThongSo === "thuongHieu") return 0.5;
  if (CacThongSoVatLy.some((Mau) => Mau.test(TenThongSo))) return 0.25;
  if (CacThongSoTrongYeu.some((Mau) => Mau.test(TenThongSo))) return 2;
  return 1;
}

function SoSanhMang(Goc: unknown[], UngVien: unknown[]): number {
  const TapGoc = new Set(Goc.map(ChuanHoaChuoi));
  const TapUngVien = new Set(UngVien.map(ChuanHoaChuoi));
  const Hop = new Set([...TapGoc, ...TapUngVien]);
  if (!Hop.size) return 1;
  const Giao = [...TapGoc].filter((GiaTri) => TapUngVien.has(GiaTri)).length;
  return Giao / Hop.size;
}

function MucTuongDong(Goc: unknown, UngVien: unknown): number {
  if (Array.isArray(Goc) && Array.isArray(UngVien)) {
    return SoSanhMang(Goc, UngVien);
  }
  if (typeof Goc === "number" && typeof UngVien === "number") {
    if (Goc === UngVien) return 1;
    const MauSo = Math.max(Math.abs(Goc), Math.abs(UngVien));
    return MauSo === 0 ? 1 : Math.max(0, 1 - Math.abs(Goc - UngVien) / MauSo);
  }
  if (LaDoiTuong(Goc) && LaDoiTuong(UngVien)) {
    return TinhDiemTuongDongThongSo(Goc, UngVien).DiemTuongDong / 100;
  }
  return ChuanHoaChuoi(Goc) === ChuanHoaChuoi(UngVien) ? 1 : 0;
}

export function TinhDiemTuongDongThongSo(
  ThongSoGoc: ThongSo,
  ThongSoUngVien: ThongSo,
) {
  const ThongSoTuongDong: SoSanhThongSo[] = [];
  const ThongSoKhacBiet: SoSanhThongSo[] = [];
  const ThongSoThieu: SoSanhThongSo[] = [];
  let TongTrongSo = 0;
  let TongDiem = 0;

  for (const TenThongSo of Object.keys(ThongSoGoc).sort()) {
    if (CacThongSoDinhDanh.has(TenThongSo)) continue;
    const GiaTriGoc = ThongSoGoc[TenThongSo];
    if (GiaTriGoc === null || GiaTriGoc === undefined || GiaTriGoc === "") {
      continue;
    }
    const TrongSo = TrongSoThongSo(TenThongSo);
    TongTrongSo += TrongSo;
    const GiaTriUngVien = ThongSoUngVien[TenThongSo];
    if (
      GiaTriUngVien === null ||
      GiaTriUngVien === undefined ||
      GiaTriUngVien === ""
    ) {
      ThongSoThieu.push({
        TenThongSo: TenThongSo,
        GiaTriGoc: GiaTriGoc,
        MucTuongDong: 0,
      });
      continue;
    }
    const MucDo = MucTuongDong(GiaTriGoc, GiaTriUngVien);
    const ChiTiet = {
      TenThongSo: TenThongSo,
      GiaTriGoc: GiaTriGoc,
      GiaTriUngVien: GiaTriUngVien,
      MucTuongDong: Math.round(MucDo * 100),
    };
    TongDiem += TrongSo * MucDo;
    (MucDo >= 0.8 ? ThongSoTuongDong : ThongSoKhacBiet).push(ChiTiet);
  }

  return {
    DiemTuongDong:
      TongTrongSo === 0 ? 0 : Math.round((TongDiem / TongTrongSo) * 100),
    ThongSoTuongDong: ThongSoTuongDong,
    ThongSoKhacBiet: ThongSoKhacBiet,
    ThongSoThieu: ThongSoThieu,
  };
}

export function TaoNhanThongSo(TenThongSo: string) {
  return (
    NhanThongSo[TenThongSo] ??
    TenThongSo.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLocaleLowerCase("vi")
  );
}

function TaoLyDoGoiY(
  Diem: number,
  ThongSoTuongDong: SoSanhThongSo[],
  DienGiai: string[],
) {
  const CacDiemNoiBat = ThongSoTuongDong.filter(
    (ChiTiet) => ChiTiet.MucTuongDong === 100,
  )
    .slice(0, 3)
    .map((ChiTiet) => TaoNhanThongSo(ChiTiet.TenThongSo));
  const TomTat = CacDiemNoiBat.length
    ? `Tương đồng ${CacDiemNoiBat.join(", ")}`
    : "Có thông số kỹ thuật gần với thiết bị gốc";
  return [`${TomTat}; điểm tương đồng ${Diem}%.`, ...DienGiai].join(" ");
}

async function LayKhoangThoiGian(
  ThamSo: ThamSoGoiYThayThe,
  Db: Prisma.TransactionClient,
) {
  const CaQuay = ThamSo.CaQuayId
    ? await Db.caQuay.findFirst({
        where: { Id: ThamSo.CaQuayId, DuAn: { DonViId: ThamSo.DonViId } },
        select: {
          Id: true,
          ThoiGianBatDau: true,
          ThoiGianKetThuc: true,
          ThoiGianChuanBiPhut: true,
          ThoiGianThuHoiPhut: true,
          DanhSachThietBi: {
            where: { HieuLucDen: null },
            select: { ThietBiId: true },
          },
        },
      })
    : null;
  if (ThamSo.CaQuayId && !CaQuay) {
    throw new LoiKhongTimThay("Không tìm thấy ca quay");
  }
  const ThoiGianBatDau = ThamSo.ThoiGianBatDau ?? CaQuay?.ThoiGianBatDau;
  const ThoiGianKetThuc = ThamSo.ThoiGianKetThuc ?? CaQuay?.ThoiGianKetThuc;
  if (
    !ThoiGianBatDau ||
    !ThoiGianKetThuc ||
    Number.isNaN(ThoiGianBatDau.getTime()) ||
    Number.isNaN(ThoiGianKetThuc.getTime()) ||
    ThoiGianBatDau >= ThoiGianKetThuc
  ) {
    throw new Error("Khoảng thời gian đề xuất không hợp lệ");
  }
  return {
    ThoiGianBatDau: ThoiGianBatDau,
    ThoiGianKetThuc: ThoiGianKetThuc,
    CaQuay: CaQuay,
  };
}

export async function TimThietBiThayThe(
  ThamSo: ThamSoGoiYThayThe,
  Db: Prisma.TransactionClient = CoSoDuLieu,
): Promise<ThietBiDeXuat[]> {
  const {
    ThoiGianBatDau: ThoiGianBatDau,
    ThoiGianKetThuc: ThoiGianKetThuc,
    CaQuay: CaQuay,
  } = await LayKhoangThoiGian(ThamSo, Db);
  const ThietBiGoc = await Db.thietBi.findFirst({
    where: {
      Id: ThamSo.ThietBiGocId,
      DanhMuc: { DonViId: ThamSo.DonViId },
    },
  });
  if (!ThietBiGoc) throw new LoiKhongTimThay("Không tìm thấy thiết bị gốc");

  const DanhSachUngVien = await Db.thietBi.findMany({
    where: {
      Id: { not: ThietBiGoc.Id },
      DanhMuc: { DonViId: ThamSo.DonViId },
      DanhMucId: ThietBiGoc.DanhMucId,
      TrangThai: TrangThaiThietBi.SAN_SANG,
      Kho: { DangHoatDong: true },
      LichSuCaQuay: { none: { TrangThaiMuonTra: "THAT_LAC" } },
      DanhSachSuCo: {
        none: { TrangThai: { not: TrangThaiSuCo.DA_KHAC_PHUC } },
      },
    },
    include: { DanhMuc: { select: { Id: true, TenDanhMuc: true } } },
  });

  const CacThietBiTrongCa = (CaQuay?.DanhSachThietBi ?? [])
    .map((PhanCong) => PhanCong.ThietBiId)
    .filter((Id) => Id !== ThietBiGoc.Id);
  const CacYeuCau = CaQuay
    ? (await LayYeuCauCaQuay(CaQuay.Id, ThamSo.DonViId, Db)).filter(
        (Muc) => Muc.LoaiTaiNguyen === LoaiTaiNguyen.THIET_BI,
      )
    : [];
  const TaiNguyenGiuLai = CacYeuCau.length
    ? await LayTaiNguyenDoiChieu(
        { DonViId: ThamSo.DonViId, DanhSachThietBiId: CacThietBiTrongCa },
        Db,
      )
    : [];
  const ThietBiGiuLai = await Db.thietBi.findMany({
    where: {
      Id: { in: CacThietBiTrongCa },
      DanhMuc: { DonViId: ThamSo.DonViId },
    },
  });
  const BoChuyen = await Db.thietBi.findMany({
    where: {
      DanhMuc: { DonViId: ThamSo.DonViId },
      TrangThai: TrangThaiThietBi.SAN_SANG,
      Kho: { DangHoatDong: true },
      LichSuCaQuay: { none: { TrangThaiMuonTra: "THAT_LAC" } },
      DanhSachSuCo: {
        none: { TrangThai: { not: TrangThaiSuCo.DA_KHAC_PHUC } },
      },
      ThongSoKyThuat: { path: ["loaiPhuKien"], equals: "NGAM_CHUYEN_ONG_KINH" },
    },
  });
  const CacIdCanKiemTraKhaDung = [
    ...new Set([
      ...DanhSachUngVien.map((Muc) => Muc.Id),
      ...BoChuyen.map((Muc) => Muc.Id),
    ]),
  ];
  const KetQuaKhaDung = await KiemTraXungDotToanDien(
    {
      DonViId: ThamSo.DonViId,
      ThoiGianBatDau: ThoiGianBatDau,
      ThoiGianKetThuc: ThoiGianKetThuc,
      DanhSachThietBiId: CacIdCanKiemTraKhaDung,
      CaQuayHienTaiId: CaQuay?.Id,
      ThoiGianChuanBiPhut:
        ThamSo.ThoiGianChuanBiPhut ?? CaQuay?.ThoiGianChuanBiPhut,
      ThoiGianThuHoiPhut: CaQuay?.ThoiGianThuHoiPhut,
    },
    Db,
  );
  const CacIdKhongKhaDung = new Set(
    KetQuaKhaDung.DanhSachXungDot.map((XungDot) => XungDot.TaiNguyenId),
  );
  const BoChuyenKhaDung = BoChuyen.filter(
    (Muc) => !CacIdKhongKhaDung.has(Muc.Id),
  );
  const ThongSoGoc = LaDoiTuong(ThietBiGoc.ThongSoKyThuat)
    ? ThietBiGoc.ThongSoKyThuat
    : {};
  return DanhSachUngVien.flatMap((ThietBi): ThietBiDeXuat[] => {
    const DanhGiaYeuCau = DanhGiaYeuCauTaiNguyen(CacYeuCau, [
      ...TaiNguyenGiuLai,
      {
        Id: ThietBi.Id,
        LoaiTaiNguyen: LoaiTaiNguyen.THIET_BI,
        DanhMucId: ThietBi.DanhMucId,
        ThongSo: ThietBi.ThongSoKyThuat,
      },
    ]);
    if (!DanhGiaYeuCau.DapUngBatBuoc) return [];
    if (CacIdKhongKhaDung.has(ThietBi.Id)) return [];
    const TuongThich = KiemTraTuongThichThietBi(
      ThietBi,
      ThietBiGoc,
      ThietBiGiuLai,
      BoChuyenKhaDung,
    );
    if (!TuongThich.HopLe) return [];
    const { ThietBiTrungGian, DienGiai } = TuongThich;
    const ThongSoUngVien = LaDoiTuong(ThietBi.ThongSoKyThuat)
      ? ThietBi.ThongSoKyThuat
      : {};
    const SoSanh = TinhDiemTuongDongThongSo(ThongSoGoc, ThongSoUngVien);
    return [
      {
        ThietBi: ThietBi,
        DiemTuongDong: SoSanh.DiemTuongDong,
        TyLePhanTram: `${SoSanh.DiemTuongDong}%`,
        ThongSoTuongDong: SoSanh.ThongSoTuongDong,
        ThongSoKhacBiet: SoSanh.ThongSoKhacBiet,
        ThongSoThieu: SoSanh.ThongSoThieu,
        KhaDung: true,
        TuongThichKyThuat: {
          HopLe: true,
          CanThietBiTrungGian: ThietBiTrungGian.length > 0,
          ThietBiTrungGian: ThietBiTrungGian,
          DienGiai: DienGiai,
        },
        DanhGiaYeuCau: DanhGiaYeuCau,
        LyDoGoiY: [
          ...DanhGiaYeuCau.DienGiai,
          TaoLyDoGoiY(SoSanh.DiemTuongDong, SoSanh.ThongSoTuongDong, DienGiai),
        ].join(" "),
      },
    ];
  }).sort(
    (A, B) =>
      B.DanhGiaYeuCau.DiemUuTien - A.DanhGiaYeuCau.DiemUuTien ||
      B.DiemTuongDong - A.DiemTuongDong ||
      A.ThietBi.TenThietBi.localeCompare(B.ThietBi.TenThietBi, "vi") ||
      A.ThietBi.Id.localeCompare(B.ThietBi.Id),
  );
}
