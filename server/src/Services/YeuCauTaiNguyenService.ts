import { DocYeuCau, type YeuCauTaiNguyen } from "./DuLieuNhungService.js";
import { LoaiTaiNguyen, type Prisma } from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiKhongTimThay } from "./LoiNghiepVuService.js";

export type TrangThaiDapUng = "DAP_UNG" | "KHONG_DAP_UNG" | "CHUA_DU_DU_LIEU";
export interface DanhGiaYeuCau {
  TrangThai: TrangThaiDapUng;
  DapUngBatBuoc: boolean;
  DiemUuTien: number;
  DienGiai: string[];
}

export interface TaiNguyenDoiChieu {
  Id: string;
  LoaiTaiNguyen: LoaiTaiNguyen;
  DanhMucId?: string | null;
  ThongSo: unknown;
  // Chỉ có ở nhân sự: chức danh đang giữ và trình độ theo chức danh đó.
  ChucDanhId?: string | null;
  TrinhDo?: number | null;
}

function LaDoiTuong(GiaTri: unknown): GiaTri is Record<string, unknown> {
  return (
    typeof GiaTri === "object" && GiaTri !== null && !Array.isArray(GiaTri)
  );
}

function ChuanHoa(GiaTri: string) {
  return GiaTri.trim().toLocaleLowerCase("vi");
}

function LaySo(GiaTri: unknown) {
  if (typeof GiaTri === "number" && Number.isFinite(GiaTri)) return GiaTri;
  if (typeof GiaTri === "string" && /^\d+(\.\d+)?$/.test(GiaTri.trim()))
    return Number(GiaTri);
  return null;
}

// Chỉ đọc kích thước được lưu, không suy đoán kích thước từ tên tiếp thị “4K”.
function LayDoPhanGiai(GiaTri: unknown) {
  if (typeof GiaTri !== "string") return null;
  const Khop = GiaTri.replaceAll("_", " ").match(/(\d+)\s*[x×]\s*(\d+)/i);
  return Khop ? [Number(Khop[1]), Number(Khop[2])] : null;
}

export function SoSanhThongSoYeuCau(
  Khoa: string,
  YeuCau: unknown,
  DuLieu: unknown,
): TrangThaiDapUng {
  if (DuLieu === null || DuLieu === undefined || DuLieu === "")
    return "CHUA_DU_DU_LIEU";
  if (Khoa === "doPhanGiaiVideoToiDa") {
    const Can = LayDoPhanGiai(YeuCau);
    const Co = LayDoPhanGiai(DuLieu);
    if (!Can || !Co) return "CHUA_DU_DU_LIEU";
    return Co[0]! >= Can[0]! && Co[1]! >= Can[1]! ? "DAP_UNG" : "KHONG_DAP_UNG";
  }
  const SoCan = LaySo(YeuCau);
  if (SoCan !== null) {
    const SoCo = LaySo(DuLieu);
    if (SoCo === null) return "CHUA_DU_DU_LIEU";
    const CangNhoCangTot =
      Khoa === "khauDoLonNhat" || Khoa === "tieuCuNhoNhatMm";
    return (CangNhoCangTot ? SoCo <= SoCan : SoCo >= SoCan)
      ? "DAP_UNG"
      : "KHONG_DAP_UNG";
  }
  if (typeof YeuCau === "string") {
    return typeof DuLieu === "string"
      ? ChuanHoa(YeuCau) === ChuanHoa(DuLieu)
        ? "DAP_UNG"
        : "KHONG_DAP_UNG"
      : "CHUA_DU_DU_LIEU";
  }
  if (typeof YeuCau === "boolean")
    return typeof DuLieu === "boolean"
      ? YeuCau === DuLieu
        ? "DAP_UNG"
        : "KHONG_DAP_UNG"
      : "CHUA_DU_DU_LIEU";
  if (Array.isArray(YeuCau)) {
    if (!Array.isArray(DuLieu)) return "CHUA_DU_DU_LIEU";
    return GopTrangThai(
      YeuCau.map((Can) => {
        const CacKetQua = DuLieu.map((Co) =>
          SoSanhThongSoYeuCau(Khoa, Can, Co),
        );
        return CacKetQua.includes("DAP_UNG")
          ? "DAP_UNG"
          : CacKetQua.includes("CHUA_DU_DU_LIEU")
            ? "CHUA_DU_DU_LIEU"
            : "KHONG_DAP_UNG";
      }),
    );
  }
  if (LaDoiTuong(YeuCau)) {
    if (!LaDoiTuong(DuLieu)) return "CHUA_DU_DU_LIEU";
    return GopTrangThai(
      Object.keys(YeuCau)
        .sort()
        .map((Ten) => SoSanhThongSoYeuCau(Ten, YeuCau[Ten], DuLieu[Ten])),
    );
  }
  return "CHUA_DU_DU_LIEU";
}

function GopTrangThai(CacTrangThai: TrangThaiDapUng[]): TrangThaiDapUng {
  if (CacTrangThai.includes("KHONG_DAP_UNG")) return "KHONG_DAP_UNG";
  if (CacTrangThai.includes("CHUA_DU_DU_LIEU")) return "CHUA_DU_DU_LIEU";
  return "DAP_UNG";
}

function DoiChieuThongSo(
  YeuCau: unknown,
  TaiNguyen: TaiNguyenDoiChieu,
  ChucDanhId: string | null,
) {
  if (YeuCau === null || YeuCau === undefined) return "DAP_UNG" as const;
  if (!LaDoiTuong(YeuCau)) return "CHUA_DU_DU_LIEU" as const;
  const ThongSo = LaDoiTuong(TaiNguyen.ThongSo) ? TaiNguyen.ThongSo : {};
  return GopTrangThai(
    Object.keys(YeuCau)
      .sort()
      .map((Khoa) => {
        const GiaTri =
          Khoa === "trinhDo" &&
          TaiNguyen.LoaiTaiNguyen === LoaiTaiNguyen.NHAN_SU
            ? !ChucDanhId || TaiNguyen.ChucDanhId === ChucDanhId
              ? TaiNguyen.TrinhDo
              : null
            : ThongSo[Khoa];
        return SoSanhThongSoYeuCau(Khoa, YeuCau[Khoa], GiaTri);
      }),
  );
}

function DoiChieuMotYeuCau(
  YeuCau: YeuCauTaiNguyen,
  TaiNguyen: TaiNguyenDoiChieu,
): TrangThaiDapUng {
  if (TaiNguyen.LoaiTaiNguyen !== YeuCau.LoaiTaiNguyen) return "KHONG_DAP_UNG";
  const CacTrangThai: TrangThaiDapUng[] = [];
  if (YeuCau.DanhMucThietBiId)
    CacTrangThai.push(
      !TaiNguyen.DanhMucId
        ? "CHUA_DU_DU_LIEU"
        : TaiNguyen.DanhMucId === YeuCau.DanhMucThietBiId
          ? "DAP_UNG"
          : "KHONG_DAP_UNG",
    );
  if (
    YeuCau.LoaiTaiNguyen === LoaiTaiNguyen.THIET_BI &&
    !YeuCau.ChoPhepThayThe
  ) {
    CacTrangThai.push(
      !YeuCau.ThietBiUuTienId
        ? "CHUA_DU_DU_LIEU"
        : TaiNguyen.Id === YeuCau.ThietBiUuTienId
          ? "DAP_UNG"
          : "KHONG_DAP_UNG",
    );
  }
  if (YeuCau.ChucDanhId)
    CacTrangThai.push(
      TaiNguyen.ChucDanhId === undefined
        ? "CHUA_DU_DU_LIEU"
        : TaiNguyen.ChucDanhId === YeuCau.ChucDanhId
          ? "DAP_UNG"
          : "KHONG_DAP_UNG",
    );
  CacTrangThai.push(
    DoiChieuThongSo(YeuCau.ThongSoToiThieu, TaiNguyen, YeuCau.ChucDanhId),
  );
  return GopTrangThai(CacTrangThai);
}

export function TinhDiemUuTienYeuCau(
  CacYeuCau: YeuCauTaiNguyen[],
  TaiNguyen: TaiNguyenDoiChieu,
) {
  let Diem = 0;
  for (const YeuCau of CacYeuCau) {
    if (
      YeuCau.LoaiTaiNguyen !== TaiNguyen.LoaiTaiNguyen ||
      (YeuCau.DanhMucThietBiId &&
        TaiNguyen.DanhMucId !== YeuCau.DanhMucThietBiId)
    )
      continue;
    const TrongSo = Math.max(0, YeuCau.TrongSo);
    if (!YeuCau.BatBuoc && DoiChieuMotYeuCau(YeuCau, TaiNguyen) === "DAP_UNG")
      Diem += TrongSo;
    if (YeuCau.ThietBiUuTienId === TaiNguyen.Id) Diem += TrongSo;
    if (
      LaDoiTuong(YeuCau.ThongSoUuTien) &&
      Object.keys(YeuCau.ThongSoUuTien).length &&
      DoiChieuThongSo(YeuCau.ThongSoUuTien, TaiNguyen, YeuCau.ChucDanhId) ===
        "DAP_UNG"
    )
      Diem += TrongSo;
  }
  return Diem;
}

// Ghép các suất yêu cầu với tài nguyên khác nhau, tránh đếm một người/thiết bị hai lần.
function DuSoLuong(
  CacYeuCau: YeuCauTaiNguyen[],
  TaiNguyen: TaiNguyenDoiChieu[],
  ChoPhepThieuDuLieu: boolean,
) {
  if (
    CacYeuCau.some((Muc) => !Number.isInteger(Muc.SoLuong) || Muc.SoLuong < 1)
  )
    return false;
  const TongSoLuong = CacYeuCau.reduce((Tong, Muc) => Tong + Muc.SoLuong, 0);
  if (TongSoLuong > TaiNguyen.length) return false;
  const CacSuat = CacYeuCau.flatMap((Muc) =>
    Array.from({ length: Muc.SoLuong }, () => Muc),
  );
  const PhanCong = new Map<number, number>();
  function Ghep(Suat: number, DaXet: Set<number>): boolean {
    for (let ViTri = 0; ViTri < TaiNguyen.length; ViTri++) {
      if (DaXet.has(ViTri)) continue;
      const TrangThai = DoiChieuMotYeuCau(CacSuat[Suat]!, TaiNguyen[ViTri]!);
      if (
        TrangThai === "KHONG_DAP_UNG" ||
        (TrangThai === "CHUA_DU_DU_LIEU" && !ChoPhepThieuDuLieu)
      )
        continue;
      DaXet.add(ViTri);
      const SuatCu = PhanCong.get(ViTri);
      if (SuatCu === undefined || Ghep(SuatCu, DaXet)) {
        PhanCong.set(ViTri, Suat);
        return true;
      }
    }
    return false;
  }
  return CacSuat.every((BoQua, Suat) => Ghep(Suat, new Set()));
}

export function DanhGiaYeuCauTaiNguyen(
  CacYeuCau: YeuCauTaiNguyen[],
  CacTaiNguyen: TaiNguyenDoiChieu[],
): DanhGiaYeuCau {
  const TaiNguyen = [
    ...new Map(
      CacTaiNguyen.map((Muc) => [`${Muc.LoaiTaiNguyen}:${Muc.Id}`, Muc]),
    ).values(),
  ];
  const YeuCau = [...CacYeuCau].sort(
    (A, B) => A.MaYeuCau.localeCompare(B.MaYeuCau) || A.Id.localeCompare(B.Id),
  );
  const CacTrangThai: TrangThaiDapUng[] = [];
  const DienGiai: string[] = [];
  const Nhan = { THIET_BI: "thiết bị", NHAN_SU: "nhân sự", STUDIO: "Studio" };
  for (const Loai of Object.values(LoaiTaiNguyen)) {
    const BatBuoc = YeuCau.filter(
      (Muc) => Muc.BatBuoc && Muc.LoaiTaiNguyen === Loai,
    );
    if (!BatBuoc.length) continue;
    const Nguon = TaiNguyen.filter((Muc) => Muc.LoaiTaiNguyen === Loai);
    const TrangThai = DuSoLuong(BatBuoc, Nguon, false)
      ? "DAP_UNG"
      : DuSoLuong(BatBuoc, Nguon, true)
        ? "CHUA_DU_DU_LIEU"
        : "KHONG_DAP_UNG";
    CacTrangThai.push(TrangThai);
    DienGiai.push(
      TrangThai === "DAP_UNG"
        ? `Đáp ứng yêu cầu bắt buộc về ${Nhan[Loai]} và số lượng.`
        : TrangThai === "CHUA_DU_DU_LIEU"
          ? `Chưa đủ dữ liệu để xác nhận yêu cầu bắt buộc về ${Nhan[Loai]}.`
          : `Không đáp ứng yêu cầu bắt buộc về ${Nhan[Loai]} hoặc chưa đủ số lượng.`,
    );
    if (
      TrangThai === "DAP_UNG" &&
      BatBuoc.some((Muc) => Muc.ThongSoToiThieu !== null)
    )
      DienGiai.push(
        Loai === LoaiTaiNguyen.NHAN_SU
          ? "Đạt trình độ/thông tin nhân sự tối thiểu đã yêu cầu."
          : "Đạt thông số tối thiểu đã yêu cầu.",
      );
    if (TrangThai === "DAP_UNG" && BatBuoc.some((Muc) => Muc.ChucDanhId))
      DienGiai.push("Đáp ứng chức danh yêu cầu.");
  }
  const DiemUuTien = TaiNguyen.reduce(
    (Tong, Muc) => Tong + TinhDiemUuTienYeuCau(YeuCau, Muc),
    0,
  );
  if (DiemUuTien > 0)
    DienGiai.push("Đáp ứng tiêu chí ưu tiên đã lưu của ca quay.");
  const TrangThai = GopTrangThai(CacTrangThai);
  return {
    TrangThai: TrangThai,
    DapUngBatBuoc: TrangThai === "DAP_UNG",
    DiemUuTien: DiemUuTien,
    DienGiai: DienGiai,
  };
}

export async function LayYeuCauCaQuay(
  CaQuayId: string,
  DonViId: string,
  Db: Prisma.TransactionClient = CoSoDuLieu,
) {
  const CaQuay = await Db.caQuay.findFirst({
    where: { Id: CaQuayId, DuAn: { DonViId } },
    select: { CacYeuCauTaiNguyen: true },
  });
  if (!CaQuay) throw new LoiKhongTimThay("Không tìm thấy ca quay");
  const CacYeuCau = DocYeuCau(CaQuay.CacYeuCauTaiNguyen);
  await KiemTraThamChieuYeuCau(CacYeuCau, DonViId, Db);
  return CacYeuCau.sort(
    (A, B) => A.MaYeuCau.localeCompare(B.MaYeuCau) || A.Id.localeCompare(B.Id),
  );
}

export async function KiemTraThamChieuYeuCau(
  CacYeuCau: YeuCauTaiNguyen[],
  DonViId: string,
  Db: Prisma.TransactionClient,
) {
  const DanhMucId = [
    ...new Set(
      CacYeuCau.flatMap((Muc) =>
        Muc.DanhMucThietBiId ? [Muc.DanhMucThietBiId] : [],
      ),
    ),
  ];
  const ThietBiId = [
    ...new Set(
      CacYeuCau.flatMap((Muc) =>
        Muc.ThietBiUuTienId ? [Muc.ThietBiUuTienId] : [],
      ),
    ),
  ];
  const ChucDanhId = [
    ...new Set(
      CacYeuCau.flatMap((Muc) => (Muc.ChucDanhId ? [Muc.ChucDanhId] : [])),
    ),
  ];
  const [DanhMuc, ThietBi, ChucDanh] = await Promise.all([
    Db.danhMucThietBi.count({ where: { Id: { in: DanhMucId }, DonViId } }),
    Db.thietBi.findMany({
      where: { Id: { in: ThietBiId }, DanhMuc: { DonViId } },
      select: { Id: true, DanhMucId: true },
    }),
    Db.chucDanh.count({
      where: {
        Id: { in: ChucDanhId },
        OR: [{ DonViId }, { DonViId: null }],
      },
    }),
  ]);
  if (
    DanhMuc !== DanhMucId.length ||
    ThietBi.length !== ThietBiId.length ||
    ChucDanh !== ChucDanhId.length ||
    CacYeuCau.some(
      (Muc) =>
        Muc.ThietBiUuTienId &&
        Muc.DanhMucThietBiId &&
        !ThietBi.some(
          (Tb) =>
            Tb.Id === Muc.ThietBiUuTienId &&
            Tb.DanhMucId === Muc.DanhMucThietBiId,
        ),
    )
  )
    throw new LoiKhongTimThay(
      "Yêu cầu tài nguyên chứa tham chiếu không hợp lệ hoặc không thuộc đơn vị",
    );
}

export async function LayTaiNguyenDoiChieu(
  ThamSo: {
    DonViId: string;
    DanhSachThietBiId?: string[];
    DanhSachNhanSuId?: string[];
    PhongStudioId?: string | null;
  },
  Db: Prisma.TransactionClient,
): Promise<TaiNguyenDoiChieu[]> {
  const [ThietBi, NhanSu, Studio] = await Promise.all([
    ThamSo.DanhSachThietBiId?.length
      ? Db.thietBi.findMany({
          where: {
            Id: { in: ThamSo.DanhSachThietBiId },
            DanhMuc: { DonViId: ThamSo.DonViId },
          },
          select: { Id: true, DanhMucId: true, ThongSoKyThuat: true },
        })
      : [],
    ThamSo.DanhSachNhanSuId?.length
      ? Db.nguoiDung.findMany({
          where: {
            Id: { in: ThamSo.DanhSachNhanSuId },
            DonViId: ThamSo.DonViId,
          },
          select: { Id: true, ChucDanhId: true, TrinhDo: true },
        })
      : [],
    ThamSo.PhongStudioId
      ? Db.phongStudio.findFirst({
          where: { Id: ThamSo.PhongStudioId, DonViId: ThamSo.DonViId },
          select: { Id: true, SucChua: true, KhaNang: true },
        })
      : null,
  ]);
  return [
    ...ThietBi.map((Muc) => ({
      Id: Muc.Id,
      LoaiTaiNguyen: LoaiTaiNguyen.THIET_BI,
      DanhMucId: Muc.DanhMucId,
      ThongSo: Muc.ThongSoKyThuat,
    })),
    ...NhanSu.map((Muc) => ({
      Id: Muc.Id,
      LoaiTaiNguyen: LoaiTaiNguyen.NHAN_SU,
      ThongSo: {},
      ChucDanhId: Muc.ChucDanhId,
      TrinhDo: Muc.TrinhDo,
    })),
    ...(Studio
      ? [
          {
            Id: Studio.Id,
            LoaiTaiNguyen: LoaiTaiNguyen.STUDIO,
            ThongSo: {
              ...(LaDoiTuong(Studio.KhaNang) ? Studio.KhaNang : {}),
              sucChua: Studio.SucChua,
            },
          },
        ]
      : []),
  ];
}

export async function LayNhanYeuCau(
  CacYeuCau: YeuCauTaiNguyen[],
  DonViId: string,
) {
  if (!CacYeuCau.length) return [];
  const [DanhMuc, ThietBi, ChucDanh] = await Promise.all([
    CoSoDuLieu.danhMucThietBi.findMany({
      where: {
        DonViId,
        Id: {
          in: CacYeuCau.flatMap((Muc) =>
            Muc.DanhMucThietBiId ? [Muc.DanhMucThietBiId] : [],
          ),
        },
      },
      select: { Id: true, TenDanhMuc: true },
    }),
    CoSoDuLieu.thietBi.findMany({
      where: {
        DanhMuc: { DonViId },
        Id: {
          in: CacYeuCau.flatMap((Muc) =>
            Muc.ThietBiUuTienId ? [Muc.ThietBiUuTienId] : [],
          ),
        },
      },
      select: { Id: true, TenThietBi: true },
    }),
    CoSoDuLieu.chucDanh.findMany({
      where: {
        OR: [{ DonViId }, { DonViId: null }],
        Id: {
          in: CacYeuCau.flatMap((Muc) =>
            Muc.ChucDanhId ? [Muc.ChucDanhId] : [],
          ),
        },
      },
      select: { Id: true, TenChucDanh: true },
    }),
  ]);
  return CacYeuCau.map((Muc) => ({
    ...Muc,
    TenDanhMuc:
      DanhMuc.find((Dm) => Dm.Id === Muc.DanhMucThietBiId)?.TenDanhMuc ?? null,
    TenThietBiUuTien:
      ThietBi.find((Tb) => Tb.Id === Muc.ThietBiUuTienId)?.TenThietBi ?? null,
    TenChucDanh:
      ChucDanh.find((Cd) => Cd.Id === Muc.ChucDanhId)?.TenChucDanh ?? null,
  }));
}
