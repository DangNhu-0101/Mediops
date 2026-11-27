import { ThucHienGiaoDichLich } from "./GiaoDichLichService.js";
import { KiemTraXungDotToanDien } from "./ThuatToanXungDotService.js";
import {
  LoaiHanhDong,
  MucDoSuCo,
  NguonSuCo,
  PhuongThucQuet,
  Prisma,
  TrangThaiSuCo,
  TrangThaiMuonTra,
  TrangThaiThietBi,
  TinhTrangTraThietBi,
} from "@prisma/client";
import { CoSoDuLieu } from "../Config/Database.js";
import {
  type BangChungViTri,
  ChinhSachViTriKho,
  KiemTraBangChungViTri,
} from "./ChinhSachViTriKhoService.js";
import { LoiVanHanhKho } from "./LoiNghiepVuService.js";
import { LayTrangThaiChanTheoMucDo } from "./SuCoBaoTriService.js";
import {
  ChonDuLieuQuyen,
  LayQuyenHieuLuc,
  PhamViCaQuay,
} from "./QuyenService.js";

export interface ThietBiXuatKho {
  ThietBiId: string;
  MaQR: string;
  PhuongThuc: PhuongThucQuet;
}

export interface DuLieuXuatKho {
  LoThayTheId?: string;
  CaQuayId: string;
  KhoId: string;
  DanhSachThietBi: ThietBiXuatKho[];
  ViTri: BangChungViTri;
}

export interface ThietBiNhapKho {
  ThietBiId: string;
  MaQR: string;
  PhuongThuc: PhuongThucQuet;
  TinhTrang: TinhTrangTraThietBi;
  GhiChu?: string;
}

export interface DuLieuNhapKho {
  CaQuayId: string;
  KhoDichId: string;
  DanhSachThietBi: ThietBiNhapKho[];
  ViTri: BangChungViTri;
}

const ChonKho = {
  Id: true,
  MaKho: true,
  TenKho: true,
  DiaChi: true,
  ViDo: true,
  KinhDo: true,
  BanKinhXacMinhMet: true,
  DangHoatDong: true,
} satisfies Prisma.KhoSelect;

async function KiemTraQuyenGiaoDich(
  Db: Prisma.TransactionClient,
  NguoiThucHienId: string,
  DonViId: string,
  CaQuayId: string,
) {
  const NguoiDung = await Db.nguoiDung.findFirst({
    where: { Id: NguoiThucHienId, DonViId, DonVi: { DangHoatDong: true } },
    select: ChonDuLieuQuyen,
  });
  const Quyen = NguoiDung ? LayQuyenHieuLuc(NguoiDung) : [];
  if (!NguoiDung || !Quyen.includes("VanHanhKho.QuanLy")) {
    throw new LoiVanHanhKho(
      "Bạn không có quyền vận hành kho.",
      403,
      "KHONG_CO_QUYEN",
    );
  }
  if (!NguoiDung.QuanTriDonVi && !Quyen.includes("VanHanhKho.ToanDonVi")) {
    const CaDuocPhep = await Db.caQuay.findFirst({
      where: {
        Id: CaQuayId,
        DuAn: { DonViId },
        ...PhamViCaQuay(NguoiThucHienId),
      },
      select: { Id: true },
    });
    if (!CaDuocPhep) {
      throw new LoiVanHanhKho(
        "Bạn không được phân công vào ca quay này.",
        403,
        "KHONG_CO_QUYEN",
      );
    }
  }
}

function KiemTraDanhSachQR(
  DanhSach: Array<{ ThietBiId: string; MaQR: string }>,
  PhanCong: Array<{ ThietBiId: string; ThietBi: { MaQR: string } }>,
) {
  const MaTheoId = new Map(
    PhanCong.map((Muc) => [Muc.ThietBiId, Muc.ThietBi.MaQR]),
  );
  if (
    new Set(DanhSach.map((Muc) => Muc.MaQR)).size !== DanhSach.length ||
    DanhSach.some(
      (Muc) => !Muc.MaQR || MaTheoId.get(Muc.ThietBiId) !== Muc.MaQR,
    )
  ) {
    throw new LoiVanHanhKho(
      "Mã QR không khớp thiết bị trong phiếu. Vui lòng quét lại danh sách.",
      422,
      "QR_KHONG_KHOP",
    );
  }
}

export function LayDanhSachKho(
  DonViId: string,
  BaoGomKhoNgungHoatDong = false,
) {
  return CoSoDuLieu.kho.findMany({
    where: {
      DonViId: DonViId,
      ...(BaoGomKhoNgungHoatDong ? {} : { DangHoatDong: true }),
    },
    select: {
      Id: true,
      MaKho: true,
      TenKho: true,
      DiaChi: true,
      BanKinhXacMinhMet: true,
    },
    orderBy: { TenKho: "asc" },
  });
}

export async function LayChecklistXuatKho(CaQuayId: string, DonViId: string) {
  const CaQuay = await CoSoDuLieu.caQuay.findFirst({
    where: { Id: CaQuayId, DuAn: { DonViId: DonViId } },
    select: {
      Id: true,
      MaCaQuay: true,
      TieuDe: true,
      TrangThai: true,
      DuAn: { select: { TenDuAn: true } },
      DanhSachThietBi: {
        select: {
          Id: true,
          TrangThaiMuonTra: true,
          LoThayTheId: true,
          HieuLucDen: true,
          ThietBi: {
            select: {
              Id: true,
              MaQR: true,
              TenThietBi: true,
              TrangThai: true,
              ViTriKho: true,
              Kho: {
                select: {
                  Id: true,
                  MaKho: true,
                  TenKho: true,
                  DiaChi: true,
                  BanKinhXacMinhMet: true,
                  DangHoatDong: true,
                },
              },
            },
          },
        },
        orderBy: { ThietBi: { TenThietBi: "asc" } },
      },
    },
  });
  if (!CaQuay) {
    throw new LoiVanHanhKho(
      "Không tìm thấy ca quay.",
      404,
      "KHONG_TIM_THAY_CA_QUAY",
    );
  }
  return CaQuay;
}

export async function LayChecklistNhapKho(CaQuayId: string, DonViId: string) {
  const CaQuay = await CoSoDuLieu.caQuay.findFirst({
    where: { Id: CaQuayId, DuAn: { DonViId: DonViId } },
    select: {
      Id: true,
      MaCaQuay: true,
      TieuDe: true,
      TrangThai: true,
      DuAn: { select: { TenDuAn: true } },
      DanhSachThietBi: {
        where: { TrangThaiMuonTra: TrangThaiMuonTra.DA_XUAT_KHO },
        select: {
          Id: true,
          TrangThaiMuonTra: true,
          ThietBi: {
            select: {
              Id: true,
              MaQR: true,
              TenThietBi: true,
              TrangThai: true,
              Kho: {
                select: { Id: true, MaKho: true, TenKho: true, DiaChi: true },
              },
            },
          },
        },
        orderBy: { ThietBi: { TenThietBi: "asc" } },
      },
    },
  });
  if (!CaQuay) {
    throw new LoiVanHanhKho(
      "Không tìm thấy ca quay.",
      404,
      "KHONG_TIM_THAY_CA_QUAY",
    );
  }
  return CaQuay;
}

export async function TraCuuThietBiNhapKho(
  ThamSo: { CaQuayId: string; MaQR: string },
  DonViId: string,
) {
  const ThietBi = await CoSoDuLieu.thietBi.findFirst({
    where: { MaQR: ThamSo.MaQR, DanhMuc: { DonViId: DonViId } },
    select: {
      Id: true,
      MaQR: true,
      TenThietBi: true,
      TrangThai: true,
      Kho: { select: { Id: true, TenKho: true } },
      LichSuCaQuay: {
        where: { CaQuayId: ThamSo.CaQuayId },
        select: { TrangThaiMuonTra: true },
      },
    },
  });
  if (!ThietBi) {
    throw new LoiVanHanhKho(
      "Không tìm thấy thiết bị.",
      404,
      "KHONG_TIM_THAY_THIET_BI",
    );
  }
  const PhanCong = ThietBi.LichSuCaQuay[0];
  if (!PhanCong) {
    throw new LoiVanHanhKho(
      "Thiết bị không thuộc ca quay này.",
      422,
      "THIET_BI_KHONG_THUOC_CA_QUAY",
    );
  }
  if (PhanCong.TrangThaiMuonTra === TrangThaiMuonTra.DA_NHAP_KHO) {
    throw new LoiVanHanhKho(
      "Thiết bị đã được nhập kho.",
      409,
      "THIET_BI_DA_NHAP_KHO",
    );
  }
  if (
    PhanCong.TrangThaiMuonTra !== TrangThaiMuonTra.DA_XUAT_KHO ||
    ThietBi.TrangThai !== TrangThaiThietBi.DANG_SU_DUNG
  ) {
    throw new LoiVanHanhKho(
      "Thiết bị chưa được xuất hoặc hiện không đủ điều kiện nhập kho.",
      409,
      "THIET_BI_KHONG_THE_NHAP",
    );
  }
  const { LichSuCaQuay: LichSuCaQuay, ...KetQua } = ThietBi;
  return KetQua;
}

export async function TraCuuThietBiTrongLo(
  ThamSo: {
    CaQuayId: string;
    KhoId: string;
    MaQR: string;
  },
  DonViId: string,
) {
  const ThietBi = await CoSoDuLieu.thietBi.findFirst({
    where: { MaQR: ThamSo.MaQR, DanhMuc: { DonViId: DonViId } },
    select: {
      Id: true,
      MaQR: true,
      TenThietBi: true,
      TrangThai: true,
      Kho: { select: { Id: true, TenKho: true } },
      LichSuCaQuay: {
        where: { CaQuayId: ThamSo.CaQuayId },
        select: { Id: true, TrangThaiMuonTra: true },
      },
      DanhSachSuCo: {
        where: { TrangThai: { not: TrangThaiSuCo.DA_KHAC_PHUC } },
        select: { Id: true },
        take: 1,
      },
    },
  });
  if (!ThietBi) {
    throw new LoiVanHanhKho(
      "Không tìm thấy thiết bị.",
      404,
      "KHONG_TIM_THAY_THIET_BI",
    );
  }
  if (!ThietBi.Kho) {
    throw new LoiVanHanhKho(
      "Thiết bị chưa được gán kho và chưa thể xuất.",
      422,
      "THIET_BI_CHUA_CO_KHO",
    );
  }
  if (ThietBi.Kho.Id !== ThamSo.KhoId) {
    const KhoDangChon = await CoSoDuLieu.kho.findFirst({
      where: { Id: ThamSo.KhoId, DonViId: DonViId },
      select: { TenKho: true },
    });
    if (!KhoDangChon) {
      throw new LoiVanHanhKho("Không tìm thấy kho.", 404, "KHONG_TIM_THAY_KHO");
    }
    throw new LoiVanHanhKho(
      `Thiết bị này thuộc ${ThietBi.Kho.TenKho} và không thể xuất tại ${KhoDangChon.TenKho}.`,
      422,
      "SAI_KHO",
      { KhoDung: ThietBi.Kho },
    );
  }
  const PhanCong = ThietBi.LichSuCaQuay[0];
  if (!PhanCong) {
    throw new LoiVanHanhKho(
      "Thiết bị không thuộc danh sách phân công của ca quay.",
      422,
      "THIET_BI_KHONG_THUOC_CA_QUAY",
    );
  }
  if (
    PhanCong.TrangThaiMuonTra !== TrangThaiMuonTra.CHO_XUAT_KHO ||
    ThietBi.TrangThai !== TrangThaiThietBi.SAN_SANG ||
    ThietBi.DanhSachSuCo.length > 0
  ) {
    throw new LoiVanHanhKho(
      PhanCong.TrangThaiMuonTra === TrangThaiMuonTra.DA_XUAT_KHO
        ? "Thiết bị đã được xuất kho."
        : "Thiết bị hiện không đủ điều kiện xuất kho.",
      409,
      "THIET_BI_KHONG_THE_XUAT",
    );
  }
  const {
    LichSuCaQuay: LichSuCaQuay,
    DanhSachSuCo: DanhSachSuCo,
    ...KetQua
  } = ThietBi;
  return KetQua;
}

function ChuyenKhoSangToaDo(Kho: {
  ViDo: Prisma.Decimal;
  KinhDo: Prisma.Decimal;
  BanKinhXacMinhMet: number;
}) {
  return {
    ViDo: Kho.ViDo.toNumber(),
    KinhDo: Kho.KinhDo.toNumber(),
    BanKinhXacMinhMet: Kho.BanKinhXacMinhMet,
  };
}

export async function KiemTraViTriKho(
  KhoId: string,
  ViTri: BangChungViTri,
  DonViId: string,
) {
  const Kho = await CoSoDuLieu.kho.findFirst({
    where: { Id: KhoId, DonViId: DonViId, DangHoatDong: true },
    select: ChonKho,
  });
  if (!Kho) {
    throw new LoiVanHanhKho(
      "Không tìm thấy kho đang hoạt động trong đơn vị.",
      404,
      "KHONG_TIM_THAY_KHO",
    );
  }
  const KetQua = KiemTraBangChungViTri(ViTri, ChuyenKhoSangToaDo(Kho));
  if (!KetQua.ViTriDat) {
    throw new LoiVanHanhKho(
      `Bạn đang cách ${Kho.TenKho} khoảng ${Math.round(KetQua.KhoangCachMet)} m, vượt phạm vi xác nhận ${Kho.BanKinhXacMinhMet} m.`,
      422,
      "NGOAI_PHAM_VI_KHO",
      {
        TenKho: Kho.TenKho,
        KhoangCachMet: KetQua.KhoangCachMet,
        BanKinhXacMinhMet: Kho.BanKinhXacMinhMet,
      },
    );
  }
  return {
    Kho: {
      Id: Kho.Id,
      TenKho: Kho.TenKho,
      BanKinhXacMinhMet: Kho.BanKinhXacMinhMet,
    },
    KhoangCachMet: KetQua.KhoangCachMet,
    ViTriDat: true as const,
    HetHanLuc: new Date(
      ViTri.ThoiDiemGhiNhan.getTime() + ChinhSachViTriKho.ThoiGianHieuLucMs,
    ),
  };
}

export async function XuatKhoTheoLo(
  DuLieu: DuLieuXuatKho,
  NguoiThucHienId: string,
  DonViId: string,
) {
  const DanhSachId = DuLieu.DanhSachThietBi.map((Muc) => Muc.ThietBiId);
  if (new Set(DanhSachId).size !== DanhSachId.length) {
    throw new LoiVanHanhKho(
      "Danh sách thiết bị có mục bị trùng.",
      400,
      "TRUNG_THIET_BI",
    );
  }

  return ThucHienGiaoDichLich(async (Db) => {
    await KiemTraQuyenGiaoDich(Db, NguoiThucHienId, DonViId, DuLieu.CaQuayId);
    const [Kho, CaQuay, DanhSachPhanCong] = await Promise.all([
      Db.kho.findFirst({
        where: { Id: DuLieu.KhoId, DonViId: DonViId, DangHoatDong: true },
        select: ChonKho,
      }),
      Db.caQuay.findFirst({
        where: { Id: DuLieu.CaQuayId, DuAn: { DonViId: DonViId } },
        select: {
          Id: true,
          TrangThai: true,
          ThoiGianBatDau: true,
          ThoiGianKetThuc: true,
          ThoiGianThuHoiPhut: true,
        },
      }),
      Db.caQuayThietBi.findMany({
        where: {
          CaQuayId: DuLieu.CaQuayId,
          HieuLucDen: null,
          LoThayTheId: DuLieu.LoThayTheId ?? null,
          ThietBi: { KhoId: DuLieu.KhoId, DanhMuc: { DonViId: DonViId } },
        },
        select: {
          Id: true,
          ThietBiId: true,
          TrangThaiMuonTra: true,
          ThietBi: {
            select: {
              MaQR: true,
              TrangThai: true,
              DanhSachSuCo: {
                where: { TrangThai: { not: TrangThaiSuCo.DA_KHAC_PHUC } },
                select: { Id: true },
                take: 1,
              },
            },
          },
        },
      }),
    ]);
    if (!Kho) {
      throw new LoiVanHanhKho(
        "Không tìm thấy kho đang hoạt động trong đơn vị.",
        404,
        "KHONG_TIM_THAY_KHO",
      );
    }
    if (!CaQuay) {
      throw new LoiVanHanhKho(
        "Không tìm thấy ca quay trong đơn vị.",
        404,
        "KHONG_TIM_THAY_CA_QUAY",
      );
    }
    if (!["DA_DUYET", "DANG_DIEN_RA"].includes(CaQuay.TrangThai)) {
      throw new LoiVanHanhKho(
        "Ca quay chưa ở trạng thái cho phép xuất kho.",
        409,
        "CA_QUAY_KHONG_THE_XUAT",
      );
    }
    if (!DanhSachId.length) {
      throw new LoiVanHanhKho(
        "Vui lòng quét đầy đủ thiết bị trước khi xác nhận.",
        400,
        "DANH_SACH_TRONG",
      );
    }

    const KetQuaViTri = KiemTraBangChungViTri(
      DuLieu.ViTri,
      ChuyenKhoSangToaDo(Kho),
    );
    if (!KetQuaViTri.ViTriDat) {
      throw new LoiVanHanhKho(
        `Bạn đang cách ${Kho.TenKho} khoảng ${Math.round(KetQuaViTri.KhoangCachMet)} m, vượt phạm vi xác nhận ${Kho.BanKinhXacMinhMet} m.`,
        422,
        "NGOAI_PHAM_VI_KHO",
        {
          TenKho: Kho.TenKho,
          KhoangCachMet: KetQuaViTri.KhoangCachMet,
          BanKinhXacMinhMet: Kho.BanKinhXacMinhMet,
        },
      );
    }

    const DanhSachChoXuat = DanhSachPhanCong.filter(
      (Muc) => Muc.TrangThaiMuonTra === TrangThaiMuonTra.CHO_XUAT_KHO,
    );
    const IdChoXuat = new Set(DanhSachChoXuat.map((Muc) => Muc.ThietBiId));
    if (
      DanhSachChoXuat.length !== DanhSachId.length ||
      DanhSachId.some((ThietBiId) => !IdChoXuat.has(ThietBiId))
    ) {
      throw new LoiVanHanhKho(
        "Danh sách thiết bị không khớp lô đang chờ xuất tại kho này.",
        422,
        "LO_THIET_BI_KHONG_HOP_LE",
      );
    }
    KiemTraDanhSachQR(DuLieu.DanhSachThietBi, DanhSachChoXuat);
    if (
      DanhSachChoXuat.some(
        (Muc) =>
          Muc.ThietBi.TrangThai !== TrangThaiThietBi.SAN_SANG ||
          Muc.ThietBi.DanhSachSuCo.length > 0,
      )
    ) {
      throw new LoiVanHanhKho(
        "Có thiết bị không còn ở trạng thái sẵn sàng. Toàn bộ lô chưa được xuất.",
        409,
        "THIET_BI_KHONG_THE_XUAT",
      );
    }
    const DangDuocMuon = await Db.caQuayThietBi.count({
      where: {
        ThietBiId: { in: DanhSachId },
        OR: [
          {
            TrangThaiMuonTra: {
              in: [TrangThaiMuonTra.DA_XUAT_KHO, TrangThaiMuonTra.THAT_LAC],
            },
          },
          { ThoiGianXuatKho: { not: null }, ThoiGianNhapKho: null },
        ],
      },
    });
    if (DangDuocMuon > 0) {
      throw new LoiVanHanhKho(
        "Có thiết bị đã được xuất kho cho ca quay khác.",
        409,
        "THIET_BI_DA_XUAT_KHO",
      );
    }

    if (DuLieu.LoThayTheId) {
      const Lo = await Db.loThayTheThietBi.findFirst({
        where: {
          Id: DuLieu.LoThayTheId,
          SuCo: { CaQuayId: CaQuay.Id, DonViId },
        },
      });
      if (!Lo)
        throw new LoiVanHanhKho(
          "Lô thay thế không thuộc ca quay.",
          422,
          "LO_KHONG_HOP_LE",
        );
    }
    const KiemTra = await KiemTraXungDotToanDien(
      {
        DonViId,
        CaQuayHienTaiId: CaQuay.Id,
        ThoiGianBatDau: new Date(
          Math.max(Date.now(), CaQuay.ThoiGianBatDau.getTime()),
        ),
        ThoiGianKetThuc: CaQuay.ThoiGianKetThuc,
        ThoiGianThuHoiPhut: CaQuay.ThoiGianThuHoiPhut,
        DanhSachThietBiId: DanhSachId,
      },
      Db,
    );
    if (KiemTra.CoXungDot)
      throw new LoiVanHanhKho(
        "Thiết bị có xung đột hoặc sự cố mới. Toàn bộ lô chưa được xuất.",
        409,
        "XUNG_DOT_THIET_BI",
      );
    const ThoiGianXuat = new Date();
    // Tái kiểm tra độ mới sau các bước đối chiếu, ngay trước khi ghi dữ liệu.
    KiemTraBangChungViTri(DuLieu.ViTri, ChuyenKhoSangToaDo(Kho), ThoiGianXuat);
    const CapNhatPhanCong = await Db.caQuayThietBi.updateMany({
      where: {
        Id: { in: DanhSachChoXuat.map((Muc) => Muc.Id) },
        TrangThaiMuonTra: TrangThaiMuonTra.CHO_XUAT_KHO,
      },
      data: {
        TrangThaiMuonTra: TrangThaiMuonTra.DA_XUAT_KHO,
        ThoiGianXuatKho: ThoiGianXuat,
      },
    });
    const CapNhatThietBi = await Db.thietBi.updateMany({
      where: {
        Id: { in: DanhSachId },
        KhoId: Kho.Id,
        DanhMuc: { DonViId: DonViId },
        TrangThai: TrangThaiThietBi.SAN_SANG,
      },
      data: { TrangThai: TrangThaiThietBi.DANG_SU_DUNG },
    });
    if (
      CapNhatPhanCong.count !== DanhSachId.length ||
      CapNhatThietBi.count !== DanhSachId.length
    ) {
      throw new LoiVanHanhKho(
        "Trạng thái thiết bị vừa thay đổi. Toàn bộ lô chưa được xuất.",
        409,
        "XUNG_DOT_TRANG_THAI",
      );
    }

    const GiaoDich = await Db.giaoDichKho.create({
      data: {
        KhoId: Kho.Id,
        CaQuayId: CaQuay.Id,
        NguoiThucHienId: NguoiThucHienId,
        LoaiHanhDong: LoaiHanhDong.XUAT_KHO,
        ViDoGhiNhan: DuLieu.ViTri.ViDo,
        KinhDoGhiNhan: DuLieu.ViTri.KinhDo,
        DoChinhXacMet: DuLieu.ViTri.DoChinhXacMet,
        KhoangCachDenKhoMet: KetQuaViTri.KhoangCachMet,
        ViTriDat: true,
        ThoiDiemGhiNhan: DuLieu.ViTri.ThoiDiemGhiNhan,
      },
    });
    await Db.nhatKyMuonTra.createMany({
      data: DuLieu.DanhSachThietBi.map((Muc) => ({
        CaQuayId: CaQuay.Id,
        ThietBiId: Muc.ThietBiId,
        NguoiThucHienId: NguoiThucHienId,
        LoaiHanhDong: LoaiHanhDong.XUAT_KHO,
        PhuongThuc: Muc.PhuongThuc,
        GiaoDichKhoId: GiaoDich.Id,
        ThoiGian: ThoiGianXuat,
      })),
    });
    return {
      GiaoDichId: GiaoDich.Id,
      KhoId: Kho.Id,
      TenKho: Kho.TenKho,
      SoThietBi: DanhSachId.length,
      KhoangCachMet: KetQuaViTri.KhoangCachMet,
      ThoiGian: ThoiGianXuat,
    };
  });
}

export async function NhapKhoTheoLo(
  DuLieu: DuLieuNhapKho,
  NguoiThucHienId: string,
  DonViId: string,
) {
  const DanhSachId = DuLieu.DanhSachThietBi.map((Muc) => Muc.ThietBiId);
  if (new Set(DanhSachId).size !== DanhSachId.length) {
    throw new LoiVanHanhKho(
      "Danh sách thiết bị có mục bị trùng.",
      400,
      "TRUNG_THIET_BI",
    );
  }
  if (!DanhSachId.length) {
    throw new LoiVanHanhKho(
      "Vui lòng quét đầy đủ thiết bị trước khi xác nhận.",
      400,
      "DANH_SACH_TRONG",
    );
  }

  return ThucHienGiaoDichLich(async (Db) => {
    await KiemTraQuyenGiaoDich(Db, NguoiThucHienId, DonViId, DuLieu.CaQuayId);
    const [KhoDich, CaQuay, DanhSachDangMuon] = await Promise.all([
      Db.kho.findFirst({
        where: { Id: DuLieu.KhoDichId, DonViId: DonViId, DangHoatDong: true },
        select: ChonKho,
      }),
      Db.caQuay.findFirst({
        where: { Id: DuLieu.CaQuayId, DuAn: { DonViId: DonViId } },
        select: { Id: true, TrangThai: true },
      }),
      Db.caQuayThietBi.findMany({
        where: {
          CaQuayId: DuLieu.CaQuayId,
          TrangThaiMuonTra: TrangThaiMuonTra.DA_XUAT_KHO,
          ThietBi: { DanhMuc: { DonViId: DonViId } },
        },
        select: {
          Id: true,
          ThietBiId: true,
          ThietBi: {
            select: {
              MaQR: true,
              TrangThai: true,
              KhoId: true,
              TenThietBi: true,
              DanhSachSuCo: {
                where: { TrangThai: { not: TrangThaiSuCo.DA_KHAC_PHUC } },
                select: { Id: true, CaQuayId: true, MucDo: true },
              },
            },
          },
        },
      }),
    ]);
    if (!KhoDich) {
      throw new LoiVanHanhKho(
        "Không tìm thấy kho đích đang hoạt động trong đơn vị.",
        404,
        "KHONG_TIM_THAY_KHO",
      );
    }
    if (!CaQuay) {
      throw new LoiVanHanhKho(
        "Không tìm thấy ca quay trong đơn vị.",
        404,
        "KHONG_TIM_THAY_CA_QUAY",
      );
    }
    const IdDangMuon = new Set(DanhSachDangMuon.map((Muc) => Muc.ThietBiId));
    // Khoản mượn thật vẫn phải được trả cả khi ca đã hoàn thành hoặc hủy.
    if (CaQuay.TrangThai === "DU_THAO") {
      throw new LoiVanHanhKho(
        "Ca quay dự thảo không cho phép nhập kho.",
        409,
        "CA_QUAY_KHONG_THE_NHAP",
      );
    }
    if (
      DanhSachDangMuon.length !== DanhSachId.length ||
      DanhSachId.some((Id) => !IdDangMuon.has(Id))
    ) {
      throw new LoiVanHanhKho(
        "Danh sách thiết bị không khớp toàn bộ thiết bị đang chờ nhập của ca quay.",
        422,
        "LO_THIET_BI_KHONG_HOP_LE",
      );
    }
    KiemTraDanhSachQR(DuLieu.DanhSachThietBi, DanhSachDangMuon);
    if (
      DanhSachDangMuon.some(
        (Muc) =>
          Muc.ThietBi.TrangThai !== TrangThaiThietBi.DANG_SU_DUNG ||
          !Muc.ThietBi.KhoId,
      )
    ) {
      throw new LoiVanHanhKho(
        "Có thiết bị không còn đủ điều kiện nhập kho. Toàn bộ lô chưa được nhập.",
        409,
        "THIET_BI_KHONG_THE_NHAP",
      );
    }

    const KetQuaViTri = KiemTraBangChungViTri(
      DuLieu.ViTri,
      ChuyenKhoSangToaDo(KhoDich),
    );
    if (!KetQuaViTri.ViTriDat) {
      throw new LoiVanHanhKho(
        `Bạn đang cách ${KhoDich.TenKho} khoảng ${Math.round(KetQuaViTri.KhoangCachMet)} m, vượt phạm vi xác nhận ${KhoDich.BanKinhXacMinhMet} m.`,
        422,
        "NGOAI_PHAM_VI_KHO",
      );
    }

    const TheoId = new Map(
      DuLieu.DanhSachThietBi.map((Muc) => [Muc.ThietBiId, Muc]),
    );
    const ThuTuMucDo: Record<MucDoSuCo, number> = {
      [MucDoSuCo.NHE]: 1,
      [MucDoSuCo.TRUNG_BINH]: 2,
      [MucDoSuCo.NGHIEM_TRONG]: 3,
    };
    const TrangThaiSauNhap = new Map<string, TrangThaiThietBi>();
    for (const Muc of DanhSachDangMuon) {
      const TinhTrang = TheoId.get(Muc.ThietBiId)!.TinhTrang;
      const SuCoNangNhat = [...Muc.ThietBi.DanhSachSuCo].sort(
        (A, B) => ThuTuMucDo[B.MucDo] - ThuTuMucDo[A.MucDo],
      )[0];
      if (TinhTrang === TinhTrangTraThietBi.HU_HONG) {
        TrangThaiSauNhap.set(Muc.ThietBiId, TrangThaiThietBi.HU_HONG);
      } else if (TinhTrang === TinhTrangTraThietBi.CAN_KIEM_TRA) {
        TrangThaiSauNhap.set(
          Muc.ThietBiId,
          SuCoNangNhat
            ? LayTrangThaiChanTheoMucDo(SuCoNangNhat.MucDo)
            : TrangThaiThietBi.BAO_TRI,
        );
      } else {
        TrangThaiSauNhap.set(
          Muc.ThietBiId,
          SuCoNangNhat
            ? LayTrangThaiChanTheoMucDo(SuCoNangNhat.MucDo)
            : TrangThaiThietBi.SAN_SANG,
        );
      }
    }
    const IdBinhThuong = [...TrangThaiSauNhap]
      .filter(([, TrangThai]) => TrangThai === TrangThaiThietBi.SAN_SANG)
      .map(([Id]) => Id);
    const IdCanKiemTra = [...TrangThaiSauNhap]
      .filter(([, TrangThai]) => TrangThai === TrangThaiThietBi.BAO_TRI)
      .map(([Id]) => Id);
    const IdHuHong = [...TrangThaiSauNhap]
      .filter(([, TrangThai]) => TrangThai === TrangThaiThietBi.HU_HONG)
      .map(([Id]) => Id);
    const ThoiGianNhap = new Date();
    KiemTraBangChungViTri(
      DuLieu.ViTri,
      ChuyenKhoSangToaDo(KhoDich),
      ThoiGianNhap,
    );
    const CapNhatPhanCong = await Db.caQuayThietBi.updateMany({
      where: {
        Id: { in: DanhSachDangMuon.map((Muc) => Muc.Id) },
        TrangThaiMuonTra: TrangThaiMuonTra.DA_XUAT_KHO,
      },
      data: {
        TrangThaiMuonTra: TrangThaiMuonTra.DA_NHAP_KHO,
        ThoiGianNhapKho: ThoiGianNhap,
      },
    });
    if (CapNhatPhanCong.count !== DanhSachId.length) {
      throw new LoiVanHanhKho(
        "Trạng thái mượn trả vừa thay đổi. Toàn bộ lô chưa được nhập.",
        409,
        "XUNG_DOT_TRANG_THAI",
      );
    }

    for (const [CacId, TrangThai] of [
      [IdBinhThuong, TrangThaiThietBi.SAN_SANG],
      [IdCanKiemTra, TrangThaiThietBi.BAO_TRI],
      [IdHuHong, TrangThaiThietBi.HU_HONG],
    ] as const) {
      if (!CacId.length) continue;
      const KetQua = await Db.thietBi.updateMany({
        where: {
          Id: { in: [...CacId] },
          DanhMuc: { DonViId: DonViId },
          TrangThai: TrangThaiThietBi.DANG_SU_DUNG,
        },
        data: { KhoId: KhoDich.Id, TrangThai: TrangThai },
      });
      if (KetQua.count !== CacId.length) {
        throw new LoiVanHanhKho(
          "Trạng thái thiết bị vừa thay đổi. Toàn bộ lô chưa được nhập.",
          409,
          "XUNG_DOT_TRANG_THAI",
        );
      }
    }

    const CanBaoTri = DanhSachDangMuon.filter((Muc) => {
      const TinhTrang = TheoId.get(Muc.ThietBiId)?.TinhTrang;
      return (
        (TinhTrang === TinhTrangTraThietBi.CAN_KIEM_TRA ||
          TinhTrang === TinhTrangTraThietBi.HU_HONG) &&
        !Muc.ThietBi.DanhSachSuCo.some((SuCo) => SuCo.CaQuayId === CaQuay.Id)
      );
    });
    if (CanBaoTri.length) {
      await Db.suCoBaoTri.createMany({
        data: CanBaoTri.map((Muc) => {
          const ThongTin = TheoId.get(Muc.ThietBiId)!;
          const HuHong = ThongTin.TinhTrang === TinhTrangTraThietBi.HU_HONG;
          return {
            ThietBiId: Muc.ThietBiId,
            CaQuayId: CaQuay.Id,
            KhoId: KhoDich.Id,
            NguoiBaoCaoId: NguoiThucHienId,
            Nguon: NguonSuCo.NHAP_KHO,
            MucDo: HuHong ? ("TRUNG_BINH" as const) : ("NHE" as const),
            MoTaLoi:
              ThongTin.GhiChu ??
              (HuHong
                ? "Thiết bị được ghi nhận có hư hỏng khi nhập kho."
                : "Thiết bị cần được kiểm tra thêm sau khi nhập kho."),
          };
        }),
      });
    }

    const GiaoDich = await Db.giaoDichKho.create({
      data: {
        KhoId: KhoDich.Id,
        CaQuayId: CaQuay.Id,
        NguoiThucHienId: NguoiThucHienId,
        LoaiHanhDong: LoaiHanhDong.NHAP_KHO,
        ViDoGhiNhan: DuLieu.ViTri.ViDo,
        KinhDoGhiNhan: DuLieu.ViTri.KinhDo,
        DoChinhXacMet: DuLieu.ViTri.DoChinhXacMet,
        KhoangCachDenKhoMet: KetQuaViTri.KhoangCachMet,
        ViTriDat: true,
        ThoiDiemGhiNhan: DuLieu.ViTri.ThoiDiemGhiNhan,
      },
    });
    await Db.nhatKyMuonTra.createMany({
      data: DanhSachDangMuon.map((Muc) => {
        const ThongTin = TheoId.get(Muc.ThietBiId)!;
        return {
          CaQuayId: CaQuay.Id,
          ThietBiId: Muc.ThietBiId,
          NguoiThucHienId: NguoiThucHienId,
          LoaiHanhDong: LoaiHanhDong.NHAP_KHO,
          PhuongThuc: ThongTin.PhuongThuc,
          GhiChuTinhTrang: ThongTin.GhiChu,
          TinhTrangTra: ThongTin.TinhTrang,
          KhoNguonId: Muc.ThietBi.KhoId,
          GiaoDichKhoId: GiaoDich.Id,
          ThoiGian: ThoiGianNhap,
        };
      }),
    });

    const SoChuyenKho = DanhSachDangMuon.filter(
      (Muc) => Muc.ThietBi.KhoId !== KhoDich.Id,
    ).length;
    return {
      GiaoDichId: GiaoDich.Id,
      KhoDichId: KhoDich.Id,
      TenKhoDich: KhoDich.TenKho,
      SoThietBi: DanhSachId.length,
      SoChuyenKho: SoChuyenKho,
      KhoangCachMet: KetQuaViTri.KhoangCachMet,
      ThoiGian: ThoiGianNhap,
    };
  });
}
