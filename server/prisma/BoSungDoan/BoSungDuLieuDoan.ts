// Bổ sung dữ liệu kiểm thử thủ công vào CSDL đang dùng (mặc định `doan`), KHÔNG xóa dữ liệu cũ.
//
//   npm run seed:bo-sung-doan -w server -- --xac-nhan
//
// Việc script làm cho đơn vị MEDIOPS-DEMO-A (Hãng phim Minh Dương):
//   1. Thêm mẫu và thiết bị thật (thông số theo trang nguồn trong DuLieuBoSungDoan.ts),
//      thêm máy #02 cho vài mẫu đã có, gắn ảnh Cloudinary có giấy phép mở.
//   2. Tạo dự án và lịch ca sắp tới (mã BS-CA-...) tính từ ngày chạy, không chồng nhau.
//   3. Ghi khoảng bận: một nhân sự nghỉ phép, một studio bảo trì, một máy hiệu chuẩn.
//   4. Chạy bộ phát hiện xung đột trên mọi ca chưa kết thúc của đơn vị; còn xung đột
//      thì hoàn tác toàn bộ. Dữ liệu nền luôn 0 xung đột: xung đột do người trình bày tạo.
// Chạy lại được nhiều lần: thiết bị cập nhật theo mã QR; ca BS-CA-... chưa phát sinh
// mượn trả được tạo lại theo ngày mới.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Prisma,
  TrangThaiCaQuay,
  TrangThaiDuAn,
  TrangThaiMuonTra,
} from "@prisma/client";
import { CoSoDuLieu } from "../../src/Config/Database.js";
import { ThanhJson } from "../../src/Services/DuLieuNhungService.js";
import { KiemTraXungDotToanDien } from "../../src/Services/ThuatToanXungDotService.js";
import {
  AnhChoMayDaCo,
  DanhSachMauBoSung,
  DanhSachMayCungMau,
  TenKhoTheoMa,
  type MaKho,
} from "./DuLieuBoSungDoan.js";

const MaDonVi = "MEDIOPS-DEMO-A";
const MaDuAnBoSung = "DA-BS-TET-2027";
const TienToMaCa = "BS-CA-";
const MuiGioVietNamPhut = 7 * 60;

// Id cố định cho khoảng bận do script ghi, để chạy lại thì thay chứ không nhân đôi.
const IdKhoangNghiPhep = "b5000000-0000-4000-8000-000000000001";
const IdKhoangBaoTriStudio = "b5000000-0000-4000-8000-000000000002";
const IdKhoangHieuChuan = "b5000000-0000-4000-8000-000000000003";

type Tx = Prisma.TransactionClient;

interface KhoangBan {
  Id: string;
  BatDau: string;
  KetThuc: string;
  LyDo: string | null;
}

interface CaDuKien {
  Ma: string;
  TieuDe: string;
  NgayThu: number;
  GioBatDau: number;
  GioKetThuc: number;
  MaPhong: string;
  DaoDien: string;
  ThietBi: string[];
  NhanSu: Array<[string, string]>;
  GhiChu: string;
}

// Lịch ca sắp tới: cùng ngày thì tài nguyên tách rời, khác ngày thì cách nhau đủ xa,
// nên không có ca nào xung đột. Mã thiết bị là mã QR, người là tên đăng nhập.
const DanhSachCaDuKien: CaDuKien[] = [
  {
    Ma: "BS-CA-01",
    TieuDe: "TVC Tết – cảnh gia đình trong phòng khách",
    NgayThu: 2,
    GioBatDau: 8,
    GioKetThuc: 12,
    MaPhong: "STUDIO-A",
    DaoDien: "daodien.an",
    ThietBi: [
      "TB-CAM-SONY-FX3-01",
      "TB-LEN-SONY-2470GM2-01",
      "TB-LGT-APUTURE-600D-01",
      "TB-MIC-RODE-NTG5-01",
      "TB-REC-ZOOM-F6-01",
    ],
    NhanSu: [
      ["quayphim.binh", "Quay phim chính"],
      ["amthanh.cuong", "Thu âm hiện trường"],
      ["anhsang.hoa", "Ánh sáng"],
    ],
    GhiChu: "Ca nền để thử trùng lịch thiết bị, studio và đạo diễn.",
  },
  {
    Ma: "BS-CA-02",
    TieuDe: "Phỏng vấn khách mời talkshow số 12",
    NgayThu: 2,
    GioBatDau: 8,
    GioKetThuc: 12,
    MaPhong: "STUDIO-C",
    DaoDien: "daodien.linh",
    ThietBi: [
      "TB-CAM-SONY-FX6-01",
      "TB-LEN-SONY-24105G-01",
      "TB-LGT-AMARAN-300C-01",
      "TB-MIC-SENN-MKE600-01",
    ],
    NhanSu: [
      ["quayphim.mai", "Quay phim"],
      ["troly.giang", "Trợ lý sản xuất"],
    ],
    GhiChu: "Chạy song song với BS-CA-01 bằng tài nguyên khác, không xung đột.",
  },
  {
    Ma: "BS-CA-03",
    TieuDe: "Quay sản phẩm hộp quà Tết – cận cảnh",
    NgayThu: 3,
    GioBatDau: 13,
    GioKetThuc: 17,
    MaPhong: "STUDIO-B",
    DaoDien: "daodien.an",
    ThietBi: [
      "TB-CAM-SONY-A7SIII-01",
      "TB-LEN-SONY-35GM-01",
      "TB-LGT-APUTURE-300D2-01",
      "TB-MIC-RODE-WGO2-01",
    ],
    NhanSu: [
      ["quayphim.binh", "Quay phim chính"],
      ["amthanh.cuong", "Thu âm hiện trường"],
    ],
    GhiChu: "Dùng A7S III để thử gợi ý thay bằng máy cùng ngàm Sony E.",
  },
  {
    Ma: "BS-CA-04",
    TieuDe: "Phim tài liệu doanh nghiệp – phỏng vấn ban giám đốc",
    NgayThu: 5,
    GioBatDau: 13,
    GioKetThuc: 18,
    MaPhong: "STUDIO-A",
    DaoDien: "daodien.linh",
    ThietBi: [
      "TB-CAM-CANON-C70-01",
      "TB-LEN-CANON-RF70200-01",
      "TB-REC-SD-MIXPRE6-01",
      "TB-MIC-SENN-MKH416-01",
      "TB-LGT-APUTURE-P300C-01",
    ],
    NhanSu: [
      ["quayphim.mai", "Quay phim"],
      ["amthanh.cuong", "Thu âm hiện trường"],
      ["anhsang.hoa", "Ánh sáng"],
    ],
    GhiChu: "Dùng C70 ngàm Canon RF: máy ngàm Sony E không được gợi ý thay.",
  },
  {
    Ma: "BS-CA-05",
    TieuDe: "Hậu trường TVC Tết – máy cầm tay trên gimbal",
    NgayThu: 7,
    GioBatDau: 8,
    GioKetThuc: 11,
    MaPhong: "STUDIO-B",
    DaoDien: "daodien.an",
    ThietBi: [
      "TB-CAM-SONY-FX30-01",
      "TB-LEN-SIGMA-1835-01",
      "TB-ACC-SIGMA-MC11-01",
      "TB-ACC-DJI-RS3PRO-01",
      "TB-MIC-SENN-EW112-01",
    ],
    NhanSu: [
      ["quayphim.binh", "Quay phim chính"],
      ["troly.giang", "Trợ lý sản xuất"],
    ],
    GhiChu: "Ống kính ngàm Canon EF trên máy Sony E qua ngàm chuyển MC-11.",
  },
];

// ---------------------------------------------------------------- tiện ích thời gian
function MocGioVietNam(NgayThu: number, Gio: number, Phut = 0) {
  const Nay = new Date();
  const NgayVietNam = new Date(Nay.getTime() + MuiGioVietNamPhut * 60_000);
  const Moc = Date.UTC(
    NgayVietNam.getUTCFullYear(),
    NgayVietNam.getUTCMonth(),
    NgayVietNam.getUTCDate() + NgayThu,
    Gio,
    Phut,
  );
  return new Date(Moc - MuiGioVietNamPhut * 60_000);
}

function DocKhoangBan(GiaTri: Prisma.JsonValue): KhoangBan[] {
  return Array.isArray(GiaTri) ? (GiaTri as unknown as KhoangBan[]) : [];
}

function ThayKhoangBan(Cu: Prisma.JsonValue, Moi: KhoangBan) {
  return ThanhJson([
    ...DocKhoangBan(Cu).filter((Khoang) => Khoang.Id !== Moi.Id),
    Moi,
  ]);
}

function DocAnhCloudinary(): Record<string, string> {
  const Tep = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../TrinhDien/AnhThietBiCloudinary.json",
  );
  const DuLieu = JSON.parse(readFileSync(Tep, "utf8")) as Record<
    string,
    { Url?: string }
  >;
  const KetQua: Record<string, string> = {};
  for (const [Ma, Anh] of Object.entries(DuLieu)) {
    if (Anh.Url) KetQua[Ma] = Anh.Url;
  }
  return KetQua;
}

// ---------------------------------------------------------------- các bước
async function BoSungThietBi(
  Db: Tx,
  DonViId: string,
  AnhTheoMa: Record<string, string>,
) {
  const DanhMuc = await Db.danhMucThietBi.findMany({
    where: { DonViId: DonViId },
  });
  const DanhMucTheoMa = new Map(DanhMuc.map((Muc) => [Muc.MaDanhMuc, Muc.Id]));
  const Kho = await Db.kho.findMany({ where: { DonViId: DonViId } });
  const KhoTheoMa = (MaKhoCanTim: MaKho) => {
    const Tim = Kho.find((Muc) => Muc.TenKho === TenKhoTheoMa[MaKhoCanTim]);
    if (!Tim) throw new Error(`Không thấy ${TenKhoTheoMa[MaKhoCanTim]}.`);
    return Tim.Id;
  };

  let SoMayMoi = 0;
  for (const Mau of DanhSachMauBoSung) {
    const DanhMucId = DanhMucTheoMa.get(Mau.MaDanhMuc);
    if (!DanhMucId) throw new Error(`Đơn vị thiếu danh mục ${Mau.MaDanhMuc}.`);
    const MauDaLuu = await Db.mauThietBi.upsert({
      where: {
        DanhMucId_MaMau: { DanhMucId: DanhMucId, MaMau: Mau.MaMau },
      },
      update: { TenMau: Mau.TenMau },
      create: { MaMau: Mau.MaMau, TenMau: Mau.TenMau, DanhMucId: DanhMucId },
    });
    const HinhAnhUrl = Mau.MaAnh ? (AnhTheoMa[Mau.MaAnh] ?? null) : null;
    for (const [MaQR, SoSeri, MaKhoMay, ViTriKho] of Mau.DanhSachMay) {
      const DuLieuMay = {
        TenThietBi: Mau.TenThietBi,
        DanhMucId: DanhMucId,
        MauThietBiId: MauDaLuu.Id,
        ThongSoKyThuat: ThanhJson(Mau.ThongSoKyThuat),
        NguonThamKhaoUrl: Mau.NguonThamKhaoUrl,
        HinhAnhUrl: HinhAnhUrl,
        KhoId: KhoTheoMa(MaKhoMay),
        ViTriKho: ViTriKho,
        ThoiGianKiemTraSauSuDungPhut: Mau.ThoiGianKiemTraSauSuDungPhut,
      };
      const DaCo = await Db.thietBi.findUnique({ where: { MaQR: MaQR } });
      if (DaCo) {
        await Db.thietBi.update({ where: { Id: DaCo.Id }, data: DuLieuMay });
      } else {
        await Db.thietBi.create({
          data: { ...DuLieuMay, MaQR: MaQR, SoSeri: SoSeri },
        });
        SoMayMoi++;
      }
    }
  }

  for (const May of DanhSachMayCungMau) {
    const Goc = await Db.thietBi.findUnique({ where: { MaQR: May.MaQRGoc } });
    if (!Goc) throw new Error(`Không thấy máy gốc ${May.MaQRGoc}.`);
    const DaCo = await Db.thietBi.findUnique({ where: { MaQR: May.MaQR } });
    const DuLieuMay = {
      TenThietBi: Goc.TenThietBi,
      DanhMucId: Goc.DanhMucId,
      MauThietBiId: Goc.MauThietBiId,
      ThongSoKyThuat: ThanhJson(Goc.ThongSoKyThuat),
      NguonThamKhaoUrl: Goc.NguonThamKhaoUrl,
      KhoId: KhoTheoMa(May.MaKho),
      ViTriKho: May.ViTriKho,
      ThoiGianKiemTraSauSuDungPhut: Goc.ThoiGianKiemTraSauSuDungPhut,
    };
    if (DaCo) {
      await Db.thietBi.update({ where: { Id: DaCo.Id }, data: DuLieuMay });
    } else {
      await Db.thietBi.create({
        data: {
          ...DuLieuMay,
          MaQR: May.MaQR,
          SoSeri: May.SoSeri,
          HinhAnhUrl: Goc.HinhAnhUrl,
        },
      });
      SoMayMoi++;
    }
  }

  let SoAnhCapNhat = 0;
  for (const [MaQR, MaAnh] of Object.entries(AnhChoMayDaCo)) {
    const Url = AnhTheoMa[MaAnh];
    if (!Url) continue;
    const KetQua = await Db.thietBi.updateMany({
      where: { MaQR: MaQR },
      data: { HinhAnhUrl: Url },
    });
    SoAnhCapNhat += KetQua.count;
  }
  // Máy #02 dùng chung ảnh với máy #01 sau khi máy #01 đã có ảnh Cloudinary.
  for (const May of DanhSachMayCungMau) {
    const Goc = await Db.thietBi.findUnique({ where: { MaQR: May.MaQRGoc } });
    await Db.thietBi.updateMany({
      where: { MaQR: May.MaQR },
      data: { HinhAnhUrl: Goc?.HinhAnhUrl ?? null },
    });
  }
  return { SoMayMoi, SoAnhCapNhat };
}

async function GhiKhoangBan(Db: Tx, DonViId: string) {
  const NguoiNghi = await Db.nguoiDung.findFirstOrThrow({
    where: { DonViId: DonViId, TenDangNhap: "quayphim.mai" },
  });
  await Db.nguoiDung.update({
    where: { Id: NguoiNghi.Id },
    data: {
      CacKhoangKhongKhaDung: ThayKhoangBan(NguoiNghi.CacKhoangKhongKhaDung, {
        Id: IdKhoangNghiPhep,
        BatDau: MocGioVietNam(4, 0).toISOString(),
        KetThuc: MocGioVietNam(5, 0).toISOString(),
        LyDo: "Nghỉ phép việc gia đình.",
      }),
    },
  });

  const Studio = await Db.phongStudio.findFirstOrThrow({
    where: { DonViId: DonViId, MaPhong: "STUDIO-A" },
  });
  await Db.phongStudio.update({
    where: { Id: Studio.Id },
    data: {
      CacKhoangKhongKhaDung: ThayKhoangBan(Studio.CacKhoangKhongKhaDung, {
        Id: IdKhoangBaoTriStudio,
        BatDau: MocGioVietNam(6, 8).toISOString(),
        KetThuc: MocGioVietNam(6, 17).toISOString(),
        LyDo: "Bảo trì giàn treo đèn trần.",
      }),
    },
  });

  const MayHieuChuan = await Db.thietBi.findUniqueOrThrow({
    where: { MaQR: "TB-CAM-SONY-FX6-01" },
  });
  await Db.thietBi.update({
    where: { Id: MayHieuChuan.Id },
    data: {
      CacKhoangKhongKhaDung: ThayKhoangBan(MayHieuChuan.CacKhoangKhongKhaDung, {
        Id: IdKhoangHieuChuan,
        BatDau: MocGioVietNam(5, 7).toISOString(),
        KetThuc: MocGioVietNam(5, 11).toISOString(),
        LyDo: "Hiệu chuẩn cảm biến định kỳ.",
      }),
    },
  });
}

async function TaoLichCa(Db: Tx, DonViId: string) {
  const NguoiDung = await Db.nguoiDung.findMany({
    where: { DonViId: DonViId },
  });
  const IdNguoi = (TenDangNhap: string) => {
    const Tim = NguoiDung.find((Muc) => Muc.TenDangNhap === TenDangNhap);
    if (!Tim) throw new Error(`Không thấy tài khoản ${TenDangNhap}.`);
    return Tim.Id;
  };
  const QuanLy = IdNguoi("quanly");

  const DuAn = await Db.duAn.upsert({
    where: { DonViId_MaDuAn: { DonViId: DonViId, MaDuAn: MaDuAnBoSung } },
    update: {
      TrangThai: TrangThaiDuAn.DANG_SAN_XUAT,
      HanChot: MocGioVietNam(30, 17),
    },
    create: {
      DonViId: DonViId,
      MaDuAn: MaDuAnBoSung,
      TenDuAn: "Chiến dịch video quảng bá mùa Tết 2027",
      TenKhachHang: "Khách hàng mô phỏng",
      MoTa: "Dự án có lịch ca sắp tới để kiểm thử thủ công phát hiện và giải quyết xung đột.",
      TrangThai: TrangThaiDuAn.DANG_SAN_XUAT,
      NguoiTaoId: QuanLy,
      HanChot: MocGioVietNam(30, 17),
    },
  });

  const CaCu = await Db.caQuay.findMany({
    where: { MaCaQuay: { startsWith: TienToMaCa } },
    include: { NhatKyMuonTra: { select: { Id: true } } },
  });
  const CaGiuNguyen = new Set<string>();
  for (const Ca of CaCu) {
    const DaPhatSinh =
      Ca.NhatKyMuonTra.length > 0 ||
      (Ca.TrangThai !== TrangThaiCaQuay.DU_THAO &&
        Ca.TrangThai !== TrangThaiCaQuay.DA_DUYET);
    if (DaPhatSinh) {
      CaGiuNguyen.add(Ca.MaCaQuay ?? "");
      continue;
    }
    await Db.caQuay.delete({ where: { Id: Ca.Id } });
  }

  const Studio = await Db.phongStudio.findMany({ where: { DonViId: DonViId } });
  let SoCaMoi = 0;
  for (const Ca of DanhSachCaDuKien) {
    if (CaGiuNguyen.has(Ca.Ma)) continue;
    const Phong = Studio.find((Muc) => Muc.MaPhong === Ca.MaPhong);
    if (!Phong) throw new Error(`Không thấy studio ${Ca.MaPhong}.`);
    const ThietBi = await Db.thietBi.findMany({
      where: { MaQR: { in: Ca.ThietBi } },
      select: { Id: true, MaQR: true },
    });
    if (ThietBi.length !== Ca.ThietBi.length) {
      throw new Error(`Ca ${Ca.Ma} thiếu thiết bị trong CSDL.`);
    }
    await Db.caQuay.create({
      data: {
        Id: randomUUID(),
        MaCaQuay: Ca.Ma,
        DuAnId: DuAn.Id,
        TieuDe: Ca.TieuDe,
        ThoiGianBatDau: MocGioVietNam(Ca.NgayThu, Ca.GioBatDau),
        ThoiGianKetThuc: MocGioVietNam(Ca.NgayThu, Ca.GioKetThuc),
        PhongStudioId: Phong.Id,
        NguoiPhuTrachId: IdNguoi(Ca.DaoDien),
        TrangThai: TrangThaiCaQuay.DA_DUYET,
        GhiChu: Ca.GhiChu,
        ThoiGianChuanBiPhut: 60,
        ThoiGianThuHoiPhut: 30,
        DanhSachThietBi: {
          create: ThietBi.map((May) => ({
            ThietBiId: May.Id,
            TrangThaiMuonTra: TrangThaiMuonTra.CHO_XUAT_KHO,
          })),
        },
        DanhSachNhanSu: {
          create: Ca.NhanSu.map(([TenDangNhap, ChucDanhPhanCong]) => ({
            NguoiDungId: IdNguoi(TenDangNhap),
            ChucDanhPhanCong: ChucDanhPhanCong,
          })),
        },
      },
    });
    SoCaMoi++;
  }
  return { SoCaMoi, SoCaGiuNguyen: CaGiuNguyen.size };
}

async function KiemChungKhongXungDot(Db: Tx, DonViId: string) {
  const CaMo = await Db.caQuay.findMany({
    where: {
      DuAn: { DonViId: DonViId },
      TrangThai: {
        notIn: [TrangThaiCaQuay.DA_HUY, TrangThaiCaQuay.HOAN_THANH],
      },
    },
    include: {
      DanhSachThietBi: { where: { HieuLucDen: null } },
      DanhSachNhanSu: { where: { HieuLucDen: null } },
    },
  });
  const Loi: string[] = [];
  for (const Ca of CaMo) {
    const KetQua = await KiemTraXungDotToanDien(
      {
        DonViId: DonViId,
        ThoiGianBatDau: Ca.ThoiGianBatDau,
        ThoiGianKetThuc: Ca.ThoiGianKetThuc,
        PhongStudioId: Ca.PhongStudioId,
        NguoiPhuTrachId: Ca.NguoiPhuTrachId,
        DanhSachThietBiId: Ca.DanhSachThietBi.map((Muc) => Muc.ThietBiId),
        DanhSachNhanSuId: Ca.DanhSachNhanSu.map((Muc) => Muc.NguoiDungId),
        CaQuayHienTaiId: Ca.Id,
        ThoiGianChuanBiPhut: Ca.ThoiGianChuanBiPhut,
        ThoiGianThuHoiPhut: Ca.ThoiGianThuHoiPhut,
      },
      Db,
    );
    if (KetQua.CoXungDot) {
      const CacLoai = KetQua.DanhSachXungDot.map(
        (Muc) => `${Muc.LoaiXungDot}/${Muc.TenTaiNguyen}`,
      );
      Loi.push(`${Ca.MaCaQuay ?? Ca.TieuDe}: ${CacLoai.join(", ")}`);
    }
  }
  return { SoCaMo: CaMo.length, Loi };
}

// ---------------------------------------------------------------- chương trình
async function Main() {
  if (!process.argv.includes("--xac-nhan")) {
    console.error(
      "Script ghi thêm dữ liệu vào CSDL trong DATABASE_URL. Sao lưu CSDL rồi chạy lại với cờ --xac-nhan.",
    );
    process.exitCode = 1;
    return;
  }
  const DonVi = await CoSoDuLieu.donVi.findFirst({
    where: { MaDonVi: MaDonVi },
  });
  if (!DonVi) {
    console.error(`Không thấy đơn vị ${MaDonVi} trong CSDL hiện tại.`);
    process.exitCode = 1;
    return;
  }
  const AnhTheoMa = DocAnhCloudinary();

  const KetQua = await CoSoDuLieu.$transaction(
    async (Db) => {
      const ThietBi = await BoSungThietBi(Db, DonVi.Id, AnhTheoMa);
      await GhiKhoangBan(Db, DonVi.Id);
      const Lich = await TaoLichCa(Db, DonVi.Id);
      const KiemChung = await KiemChungKhongXungDot(Db, DonVi.Id);
      if (KiemChung.Loi.length) {
        throw new Error(
          "Dữ liệu nền còn xung đột, đã hoàn tác:\n" + KiemChung.Loi.join("\n"),
        );
      }
      return { ...ThietBi, ...Lich, SoCaMo: KiemChung.SoCaMo };
    },
    { timeout: 120_000 },
  );

  console.log(`Đơn vị: ${DonVi.TenDonVi}`);
  console.log(`Thiết bị mới: ${KetQua.SoMayMoi}`);
  console.log(`Máy cũ được gắn ảnh Cloudinary: ${KetQua.SoAnhCapNhat}`);
  console.log(
    `Ca ${TienToMaCa}...: tạo ${KetQua.SoCaMoi}, giữ nguyên ${KetQua.SoCaGiuNguyen}`,
  );
  console.log(
    `Kiểm chứng: ${KetQua.SoCaMo} ca chưa kết thúc của đơn vị, 0 xung đột.`,
  );
}

Main()
  .catch((Loi: unknown) => {
    console.error(Loi instanceof Error ? Loi.message : Loi);
    process.exitCode = 1;
  })
  .finally(() => CoSoDuLieu.$disconnect());
