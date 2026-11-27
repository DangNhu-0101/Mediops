import { DocKhoangBan, ThanhJson } from "../src/Services/DuLieuNhungService.js";
import "dotenv/config";
import {
  LoaiHanhDong,
  LoaiTaiNguyen,
  MucDoSuCo,
  PhuongThucQuet,
  Prisma,
  PrismaClient,
  TrangThaiCaQuay,
  TrangThaiDuAn,
  TrangThaiMuonTra,
  TrangThaiStudio,
  TrangThaiSuCo,
  TrangThaiThietBi,
} from "@prisma/client";
import bcrypt from "bcrypt";
import { TaoDuLieuMauDonVi } from "../src/Services/DonViService.js";

const PrismaNoiBo = new PrismaClient();
const Ngay = (GiaTri: string) => new Date(GiaTri);
const TaoId = (Nhom: number, So: number) =>
  `${String(Nhom).padEnd(8, "0")}-0000-4000-8000-${String(So).padStart(12, "0")}`;

const Id = {
  DonViA: TaoId(14, 1),
  DonViB: TaoId(14, 2),
  KhoTrungTam: TaoId(17, 1),
  KhoPhiaDong: TaoId(17, 2),
  KhoSaoViet: TaoId(17, 10),
  QuanLy: TaoId(1, 1),
  QuanLyB: TaoId(1, 11),
  NhanSuB: TaoId(1, 12),
  DaoDienAn: TaoId(1, 2),
  DaoDienLinh: TaoId(1, 3),
  QuayPhimBinh: TaoId(1, 4),
  QuayPhimMai: TaoId(1, 5),
  AmThanhCuong: TaoId(1, 6),
  AnhSangHoa: TaoId(1, 7),
  ThuKhoDung: TaoId(1, 8),
  TroLyGiang: TaoId(1, 9),
  StudioA: TaoId(2, 1),
  StudioB: TaoId(2, 2),
  StudioC: TaoId(2, 3),
  StudioDonViB: TaoId(2, 10),
  DmMayQuay: TaoId(3, 1),
  DmOngKinh: TaoId(3, 2),
  DmChieuSang: TaoId(3, 3),
  DmMicro: TaoId(3, 4),
  DmMayGhiAm: TaoId(3, 5),
  DmPhuKien: TaoId(3, 6),
  DmMayQuayDonViB: TaoId(3, 10),
  Fx3: TaoId(4, 1),
  Fx6: TaoId(4, 2),
  A7iv: TaoId(4, 3),
  Sony2470: TaoId(4, 4),
  Sony24105: TaoId(4, 5),
  CanonRf2470: TaoId(4, 6),
  SigmaEf2470: TaoId(4, 7),
  Mc11: TaoId(4, 8),
  Aputure600d: TaoId(4, 9),
  Amaran300c: TaoId(4, 10),
  RodeNtg5: TaoId(4, 11),
  SennheiserMke600: TaoId(4, 12),
  ZoomF6: TaoId(4, 13),
  MayQuayDonViB: TaoId(4, 20),
  DuAnThuongHieu: TaoId(5, 1),
  DuAnTalkshow: TaoId(5, 2),
  DuAnAmNhac: TaoId(5, 3),
  DuAnKiemThu: TaoId(5, 4),
  DuAnDonViB: TaoId(5, 10),
  Demo1: TaoId(6, 1),
  Demo2: TaoId(6, 2),
  Demo3: TaoId(6, 3),
  Demo4: TaoId(6, 4),
  Demo5: TaoId(6, 5),
  Demo6: TaoId(6, 6),
  XungDotStudioA: TaoId(6, 101),
  XungDotStudioB: TaoId(6, 102),
  StudioKhongKhaDung: TaoId(6, 103),
  XungDotThietBiA: TaoId(6, 111),
  XungDotThietBiB: TaoId(6, 112),
  XungDotThietBiC: TaoId(6, 113),
  ThietBiKhongKhaDung: TaoId(6, 114),
  XungDotNhanSuA: TaoId(6, 121),
  XungDotNhanSuB: TaoId(6, 122),
  NhanSuKhongKhaDung: TaoId(6, 123),
  XungDotTongHopA: TaoId(6, 131),
  XungDotTongHopB: TaoId(6, 132),
  BienA: TaoId(6, 141),
  BienB: TaoId(6, 142),
  CaQuayDonViB: TaoId(6, 200),
  ThueNgoaiA: TaoId(6, 151),
  ThueNgoaiB: TaoId(6, 152),
  NhaCungCapA: TaoId(15, 1),
  NhaCungCapB: TaoId(15, 2),
  NhaCungCapDonViB: TaoId(15, 10),
  ThietBiThueFx6XacNhan: TaoId(16, 1),
  ThietBiThueFx6CanLienHe: TaoId(16, 2),
  ThietBiThueZoomXacNhan: TaoId(16, 3),
  ThietBiThueZoomCanLienHe: TaoId(16, 4),
  ThietBiThueDonViB: TaoId(16, 10),
} as const;

const Nguon = {
  Fx3: "https://www.sony.com/electronics/support/camcorders-and-video-cameras-interchangeable-lens-camcorders/ilme-fx3/specifications",
  Fx6: "https://www.sony.com/electronics/support/camcorders-interchangeable-lens-camcorders/ilme-fx6v/specifications",
  A7iv: "https://www.sony.com/electronics/support/e-mount-body-ilce-7-series/ilce-7m4/specifications",
  Sony2470:
    "https://electronics.sony.com/imaging/lenses/all-e-mount/p/sel2470gm2",
  Sony24105:
    "https://www.sony.com/en-om/electronics/camera-lenses/sel24105g/specifications",
  CanonRf2470:
    "https://files.canon-europe.com/files/webcontent/rf-lens-world/features/rf-lineup/index.html",
  SigmaEf2470: "https://www.sigma-global.com/en/lenses/a017_24_70_28/",
  Mc11: "https://www.sigma-global.com/en/accessories/mc-11/",
  Aputure600d: "https://aputure.com/EN-US/products/ls-600d-pro",
  Amaran300c: "https://amarancreators.com/pages/amaran-300c",
  RodeNtg5: "https://rode.com/en-gb/products/ntg5",
  SennheiserMke600:
    "https://docs.cloud.sennheiser.com/en-us/mke-600/mke-600/specifications.html",
  ZoomF6: "https://zoomcorp.com/en/us/field-recorders/field-recorders/f6/",
} as const;

async function DonDuLieuCu() {
  await PrismaNoiBo.nhatKyMuonTra.deleteMany();
  await PrismaNoiBo.giaoDichKho.deleteMany();
  await PrismaNoiBo.nhatKyXuLySuCo.deleteMany();
  await PrismaNoiBo.suCoBaoTri.deleteMany();
  await PrismaNoiBo.caQuayThietBi.deleteMany();
  await PrismaNoiBo.caQuayNhanSu.deleteMany();
  await PrismaNoiBo.caQuay.deleteMany();
  await PrismaNoiBo.duAn.deleteMany();
  await PrismaNoiBo.thietBi.deleteMany();
  await PrismaNoiBo.kho.deleteMany();
  await PrismaNoiBo.danhMucThietBi.deleteMany();
  await PrismaNoiBo.phongStudio.deleteMany();
  await PrismaNoiBo.nguoiDung.deleteMany();
  await PrismaNoiBo.chucDanh.deleteMany();
  await PrismaNoiBo.donVi.deleteMany();
}

async function TaoDonVi() {
  await PrismaNoiBo.donVi.createMany({
    data: [
      {
        Id: Id.DonViA,
        MaDonVi: "MEDIOPS-DEMO-A",
        TenDonVi: "Hãng phim Minh Dương",
        Email: "lienhe.minhduong@mediops.local",
        SoDienThoai: "0901000101",
        DiaChi: "Thành phố Hồ Chí Minh",
      },
      {
        Id: Id.DonViB,
        MaDonVi: "MEDIOPS-DEMO-B",
        TenDonVi: "Studio Sao Việt",
        Email: "lienhe.saoviet@mediops.local",
        SoDienThoai: "0901000202",
        DiaChi: "Hà Nội",
      },
    ],
  });
}

async function TaoKho() {
  await PrismaNoiBo.kho.createMany({
    data: [
      {
        Id: Id.KhoTrungTam,
        DonViId: Id.DonViA,
        MaKho: "KHO-TRUNG-TAM",
        TenKho: "Kho thiết bị Trung tâm",
        DiaChi: "72 Nguyễn Thị Minh Khai, Quận 3, Thành phố Hồ Chí Minh",
        ViDo: new Prisma.Decimal("10.776889"),
        KinhDo: new Prisma.Decimal("106.700806"),
        BanKinhXacMinhMet: 100,
      },
      {
        Id: Id.KhoPhiaDong,
        DonViId: Id.DonViA,
        MaKho: "KHO-PHIA-DONG",
        TenKho: "Kho thiết bị phía Đông",
        DiaChi: "18 Võ Văn Ngân, Thành phố Thủ Đức, Thành phố Hồ Chí Minh",
        ViDo: new Prisma.Decimal("10.849946"),
        KinhDo: new Prisma.Decimal("106.771825"),
        BanKinhXacMinhMet: 120,
      },
      {
        Id: Id.KhoSaoViet,
        DonViId: Id.DonViB,
        MaKho: "KHO-SAOVIET",
        TenKho: "Kho thiết bị Sao Việt",
        DiaChi: "12 Tràng Thi, Hoàn Kiếm, Hà Nội",
        ViDo: new Prisma.Decimal("21.028511"),
        KinhDo: new Prisma.Decimal("105.804817"),
        BanKinhXacMinhMet: 100,
      },
    ],
  });
}

// Nhóm quyền và chức danh mẫu của từng đơn vị, tra theo mã nhóm và tên chức danh.
const MucMauDonVi = new Map<
  string,
  { NhomQuyen: Map<string, string>; ChucDanh: Map<string, string> }
>();
function LayMucMau(DonViId: string) {
  const Muc = MucMauDonVi.get(DonViId);
  if (!Muc) throw new Error("Chưa tạo nhóm quyền và chức danh cho đơn vị");
  return Muc;
}

async function TaoNhomQuyenVaChucDanh() {
  for (const DonViId of [Id.DonViA, Id.DonViB]) {
    const Mau = await TaoDuLieuMauDonVi(PrismaNoiBo, DonViId);
    MucMauDonVi.set(DonViId, {
      NhomQuyen: new Map(Mau.DanhSachNhom.map((N) => [N.MaNhom, N.Id])),
      ChucDanh: new Map(Mau.DanhSachChucDanh.map((C) => [C.TenChucDanh, C.Id])),
    });
  }
}

async function TaoNguoiDungVaTrinhDo() {
  const MatKhauHash = await bcrypt.hash("123456", 10);
  const NguoiDung = [
    [
      Id.QuanLy,
      "quanly",
      "Đặng Ngọc Tâm Như",
      "quanly",
      "QUAN_LY_SAN_XUAT",
      "Quản lý sản xuất",
    ],
    [
      Id.QuanLyB,
      "quanly.saoviet",
      "Nguyễn Thành Nam",
      "quanly.saoviet",
      "QUAN_LY_SAN_XUAT",
      "Quản lý sản xuất",
    ],
    [
      Id.NhanSuB,
      "nhansu.saoviet",
      "Lê Thu Hà",
      "nhansu.saoviet",
      "NHAN_VIEN_SAN_XUAT",
      "Nhân viên sản xuất",
    ],
    [
      Id.DaoDienAn,
      "daodien.an",
      "Trần Văn An",
      "an.tran",
      "NHAN_VIEN_SAN_XUAT",
      "Đạo diễn",
    ],
    [
      Id.DaoDienLinh,
      "daodien.linh",
      "Nguyễn Mỹ Linh",
      "linh.nguyen",
      "NHAN_VIEN_SAN_XUAT",
      "Đạo diễn",
    ],
    [
      Id.QuayPhimBinh,
      "quayphim.binh",
      "Lê Thanh Bình",
      "binh.le",
      "NHAN_VIEN_SAN_XUAT",
      "Quay phim",
    ],
    [
      Id.QuayPhimMai,
      "quayphim.mai",
      "Phan Hoàng Mai",
      "mai.phan",
      "NHAN_VIEN_SAN_XUAT",
      "Quay phim",
    ],
    [
      Id.AmThanhCuong,
      "amthanh.cuong",
      "Phạm Hùng Cường",
      "cuong.pham",
      "NHAN_VIEN_KHO",
      "Âm thanh",
    ],
    [
      Id.AnhSangHoa,
      "anhsang.hoa",
      "Đỗ Minh Hòa",
      "hoa.do",
      "NHAN_VIEN_KHO",
      "Ánh sáng",
    ],
    [
      Id.ThuKhoDung,
      "thukho.dung",
      "Vũ Quốc Dũng",
      "dung.vu",
      "NHAN_VIEN_KHO",
      "Nhân viên kho",
    ],
    [
      Id.TroLyGiang,
      "troly.giang",
      "Bùi Hà Giang",
      "giang.bui",
      "NHAN_VIEN_SAN_XUAT",
      "Nhân viên sản xuất",
    ],
  ] as const;
  await PrismaNoiBo.nguoiDung.createMany({
    data: NguoiDung.map(
      (
        [NguoiDungId, TenDangNhap, HoTen, TenEmail, MaNhom, TenChucDanh],
        ChiSo,
      ) => {
        const DonViId =
          NguoiDungId === Id.QuanLyB || NguoiDungId === Id.NhanSuB
            ? Id.DonViB
            : Id.DonViA;
        const LaQuanTri =
          NguoiDungId === Id.QuanLy || NguoiDungId === Id.QuanLyB;
        return {
          Id: NguoiDungId,
          TenDangNhap: TenDangNhap,
          MatKhauHash: MatKhauHash,
          HoTen: HoTen,
          Email: `${TenEmail}@mediops.local`,
          SoDienThoai: `090100000${ChiSo + 1}`,
          QuanTriDonVi: LaQuanTri,
          DonViId,
          // Quản trị viên đơn vị có toàn quyền nên không gán nhóm quyền và chức danh.
          NhomQuyenId: LaQuanTri
            ? null
            : LayMucMau(DonViId).NhomQuyen.get(MaNhom),
          ChucDanhId: LaQuanTri
            ? null
            : LayMucMau(DonViId).ChucDanh.get(TenChucDanh),
        };
      },
    ),
  });
  // Trình độ theo chức danh của nhân sự sản xuất và kho.
  const TrinhDo = [
    [Id.DaoDienAn, 5],
    [Id.DaoDienLinh, 5],
    [Id.QuayPhimBinh, 5],
    [Id.QuayPhimMai, 4],
    [Id.AmThanhCuong, 5],
    [Id.AnhSangHoa, 5],
    [Id.ThuKhoDung, 5],
    [Id.TroLyGiang, 4],
  ] as const;
  for (const [NguoiDungId, MucTrinhDo] of TrinhDo)
    await PrismaNoiBo.nguoiDung.update({
      where: { Id: NguoiDungId },
      data: { TrinhDo: MucTrinhDo },
    });
}

async function TaoStudioVaDanhMuc() {
  await PrismaNoiBo.phongStudio.createMany({
    data: [
      {
        Id: Id.StudioA,
        DonViId: Id.DonViA,
        MaPhong: "STUDIO-A",
        TenPhong: "Studio A – Phông xanh",
        DiaDiem: "Tầng 1, khu sản xuất",
        SucChua: 30,
        TrangThai: TrangThaiStudio.SAN_SANG,
        KhaNang: {
          phongXanh: true,
          cachAm: true,
          gianTreoDenTran: true,
          dienBaPha: true,
        },
      },
      {
        Id: Id.StudioB,
        DonViId: Id.DonViA,
        MaPhong: "STUDIO-B",
        TenPhong: "Studio B – Talkshow",
        DiaDiem: "Tầng 2, khu sản xuất",
        SucChua: 18,
        TrangThai: TrangThaiStudio.SAN_SANG,
        KhaNang: {
          phongXanh: false,
          cachAm: true,
          gianTreoDenTran: false,
          boBanGheTalkshow: true,
        },
      },
      {
        Id: Id.StudioC,
        DonViId: Id.DonViA,
        MaPhong: "STUDIO-C",
        TenPhong: "Studio C – Sân khấu nhỏ",
        DiaDiem: "Tầng trệt, khu sự kiện",
        SucChua: 60,
        TrangThai: TrangThaiStudio.SAN_SANG,
        KhaNang: {
          phongXanh: false,
          cachAm: false,
          gianTreoDenTran: true,
          sanKhau: true,
        },
      },
      {
        Id: Id.StudioDonViB,
        DonViId: Id.DonViB,
        MaPhong: "STUDIO-A",
        TenPhong: "Studio A – Sao Việt",
        DiaDiem: "Tầng 3, khu sản xuất",
        SucChua: 20,
        TrangThai: TrangThaiStudio.SAN_SANG,
        KhaNang: { cachAm: true, phongXanh: true },
      },
    ],
  });
  await PrismaNoiBo.danhMucThietBi.createMany({
    data: (
      [
        [Id.DmMayQuay, "MAY_QUAY", "Máy quay"],
        [Id.DmOngKinh, "ONG_KINH", "Ống kính"],
        [Id.DmChieuSang, "CHIEU_SANG", "Chiếu sáng"],
        [Id.DmMicro, "MICRO", "Microphone"],
        [Id.DmMayGhiAm, "MAY_GHI_AM", "Máy ghi âm hiện trường"],
        [Id.DmPhuKien, "PHU_KIEN", "Phụ kiện"],
      ] as const
    ).map(([DanhMucId, MaDanhMuc, TenDanhMuc]) => ({
      Id: DanhMucId,
      MaDanhMuc: MaDanhMuc,
      TenDanhMuc: TenDanhMuc,
      DonViId: Id.DonViA,
    })),
  });
  await PrismaNoiBo.danhMucThietBi.create({
    data: {
      Id: Id.DmMayQuayDonViB,
      MaDanhMuc: "MAY_QUAY",
      TenDanhMuc: "Máy quay",
      DonViId: Id.DonViB,
    },
  });
}

function ThongSoMayQuay(DuLieu: {
  Model: string;
  CamBien: string;
  KichThuocCamBienMm: string;
  DoPhanGiaiMp: number;
  DoPhanGiaiVideo: string;
  Fps4K: number;
  Codec: string[];
  Iso: string;
  DaiTuongPhan: string;
  ChongRung: string;
  LayNet: string;
  TheNho: string[];
  KetNoi: string[];
  KichThuocMm: string;
  KhoiLuongG: number;
}) {
  return {
    thuongHieu: "Sony",
    model: DuLieu.Model,
    ngamOngKinh: "SONY_E",
    loaiCamBien: DuLieu.CamBien,
    kichThuocCamBienMm: DuLieu.KichThuocCamBienMm,
    doPhanGiaiHieuDungMp: DuLieu.DoPhanGiaiMp,
    doPhanGiaiVideoToiDa: DuLieu.DoPhanGiaiVideo,
    tocDoKhungHinh4KToiDaFps: DuLieu.Fps4K,
    doSauBitToiDa: 10,
    layMauMauToiDa: "4:2:2",
    codecVideo: DuLieu.Codec,
    isoVideo: DuLieu.Iso,
    daiTuongPhanStop: DuLieu.DaiTuongPhan,
    chongRungThanMay: DuLieu.ChongRung,
    layNetTuDong: DuLieu.LayNet,
    theNho: DuLieu.TheNho,
    ketNoi: DuLieu.KetNoi,
    kichThuocMm: DuLieu.KichThuocMm,
    khoiLuongThanMayG: DuLieu.KhoiLuongG,
  };
}

function ThongSoOngKinh(DuLieu: {
  ThuongHieu: string;
  Model: string;
  Ngam: string;
  TieuCuLonNhat: number;
  KhauDo: number;
  LayNet: string;
  ChongRung: boolean;
  LayNetGanNhat: number | string;
  KinhLoc: number;
  KichThuoc: string;
  KhoiLuong: number;
}) {
  return {
    thuongHieu: DuLieu.ThuongHieu,
    model: DuLieu.Model,
    ngamOngKinh: DuLieu.Ngam,
    dinhDangCamBien: "FULL_FRAME",
    tieuCuNhoNhatMm: 24,
    tieuCuLonNhatMm: DuLieu.TieuCuLonNhat,
    khauDoLonNhat: DuLieu.KhauDo,
    khauDoNhoNhat: 22,
    layNetTuDong: DuLieu.LayNet,
    chongRungQuangHoc: DuLieu.ChongRung,
    khoangLayNetGanNhatM: DuLieu.LayNetGanNhat,
    duongKinhKinhLocMm: DuLieu.KinhLoc,
    kichThuocMm: DuLieu.KichThuoc,
    khoiLuongG: DuLieu.KhoiLuong,
  };
}

async function TaoThietBi() {
  const DanhSach: Prisma.ThietBiCreateManyInput[] = [
    {
      Id: Id.Fx3,
      MaQR: "TB-CAM-SONY-FX3-01",
      SoSeri: "DEMO-ILME-FX3-001",
      TenThietBi: "Sony Cinema Line FX3",
      DanhMucId: Id.DmMayQuay,
      ThongSoKyThuat: ThongSoMayQuay({
        Model: "ILME-FX3",
        CamBien: "CMOS_EXMOR_R_FULL_FRAME",
        KichThuocCamBienMm: "35.6 x 23.8",
        DoPhanGiaiMp: 10.3,
        DoPhanGiaiVideo: "DCI_4K_4096_X_2160",
        Fps4K: 120,
        Codec: ["XAVC_HS_H265", "XAVC_S_H264", "XAVC_SI_H264"],
        Iso: "80-102400; mở rộng 409600",
        DaiTuongPhan: "15+",
        ChongRung: "5_TRUC",
        LayNet: "FAST_HYBRID_AF_627_DIEM_VIDEO",
        TheNho: ["CFEXPRESS_TYPE_A", "SD_UHS_I_II"],
        KetNoi: ["HDMI_TYPE_A", "USB_C", "XLR_TRS_QUA_TAY_CAM", "WIFI"],
        KichThuocMm: "129.7 x 77.8 x 84.5",
        KhoiLuongG: 630,
      }),
      TrangThai: TrangThaiThietBi.SAN_SANG,
      NguonThamKhaoUrl: Nguon.Fx3,
      ViTriKho: "Tủ CAM-A · Ngăn 01",
      ThoiGianKiemTraSauSuDungPhut: 30,
    },
    {
      Id: Id.Fx6,
      MaQR: "TB-CAM-SONY-FX6-01",
      SoSeri: "DEMO-ILME-FX6-001",
      TenThietBi: "Sony Cinema Line FX6",
      DanhMucId: Id.DmMayQuay,
      ThongSoKyThuat: ThongSoMayQuay({
        Model: "ILME-FX6V",
        CamBien: "CMOS_EXMOR_R_FULL_FRAME",
        KichThuocCamBienMm: "35.7 x 18.8",
        DoPhanGiaiMp: 10.2,
        DoPhanGiaiVideo: "DCI_4K_4096_X_2160",
        Fps4K: 120,
        Codec: ["XAVC_I_H264", "XAVC_L_H264"],
        Iso: "ISO cơ sở kép 800/12800; tối đa 409600",
        DaiTuongPhan: "15+",
        ChongRung: "KHONG",
        LayNet: "FAST_HYBRID_AF_627_DIEM",
        TheNho: ["CFEXPRESS_TYPE_A", "SD_UHS_I_II"],
        KetNoi: ["12G_SDI", "HDMI_TYPE_A", "USB_C", "XLR_3_PIN", "WIFI"],
        KichThuocMm: "114 x 116 x 153",
        KhoiLuongG: 890,
      }),
      TrangThai: TrangThaiThietBi.SAN_SANG,
      NguonThamKhaoUrl: Nguon.Fx6,
      ViTriKho: "Tủ CAM-A · Ngăn 02",
      ThoiGianKiemTraSauSuDungPhut: 45,
    },
    {
      Id: Id.A7iv,
      MaQR: "TB-CAM-SONY-A7IV-01",
      SoSeri: "DEMO-ILCE-7M4-001",
      TenThietBi: "Sony Alpha 7 IV",
      DanhMucId: Id.DmMayQuay,
      ThongSoKyThuat: ThongSoMayQuay({
        Model: "ILCE-7M4",
        CamBien: "CMOS_EXMOR_R_FULL_FRAME",
        KichThuocCamBienMm: "35.9 x 23.9",
        DoPhanGiaiMp: 33,
        DoPhanGiaiVideo: "UHD_4K_3840_X_2160",
        Fps4K: 60,
        Codec: ["XAVC_HS_H265", "XAVC_S_H264", "XAVC_SI_H264"],
        Iso: "100-51200; mở rộng 102400",
        DaiTuongPhan: "15+",
        ChongRung: "5_TRUC_5_5_STOP",
        LayNet: "FAST_HYBRID_AF_759_DIEM",
        TheNho: ["CFEXPRESS_TYPE_A", "SD_UHS_I_II"],
        KetNoi: ["MICRO_HDMI", "USB_C", "MIC_3_5_MM", "WIFI", "BLUETOOTH"],
        KichThuocMm: "131.3 x 96.4 x 79.8",
        KhoiLuongG: 658,
      }),
      TrangThai: TrangThaiThietBi.SAN_SANG,
      NguonThamKhaoUrl: Nguon.A7iv,
      ViTriKho: "Tủ CAM-B · Ngăn 01",
      ThoiGianKiemTraSauSuDungPhut: 20,
    },
    {
      Id: Id.Sony2470,
      MaQR: "TB-LEN-SONY-2470GM2-01",
      SoSeri: "DEMO-SEL2470GM2-001",
      TenThietBi: "Sony FE 24–70mm F2.8 GM II",
      DanhMucId: Id.DmOngKinh,
      ThongSoKyThuat: ThongSoOngKinh({
        ThuongHieu: "Sony",
        Model: "SEL2470GM2",
        Ngam: "SONY_E",
        TieuCuLonNhat: 70,
        KhauDo: 2.8,
        LayNet: "XD_LINEAR_MOTOR",
        ChongRung: false,
        LayNetGanNhat: "0.21-0.30",
        KinhLoc: 82,
        KichThuoc: "87.8 x 119.9",
        KhoiLuong: 695,
      }),
      TrangThai: TrangThaiThietBi.SAN_SANG,
      HinhAnhUrl:
        "https://d1ncau8tqf99kp.cloudfront.net/converted/102462_original_local_1200x1050_v3_converted.webp",
      NguonThamKhaoUrl: Nguon.Sony2470,
      ViTriKho: "Tủ LEN-A · Ngăn 01",
      ThoiGianKiemTraSauSuDungPhut: 15,
    },
    {
      Id: Id.Sony24105,
      MaQR: "TB-LEN-SONY-24105G-01",
      SoSeri: "DEMO-SEL24105G-001",
      TenThietBi: "Sony FE 24–105mm F4 G OSS",
      DanhMucId: Id.DmOngKinh,
      ThongSoKyThuat: ThongSoOngKinh({
        ThuongHieu: "Sony",
        Model: "SEL24105G",
        Ngam: "SONY_E",
        TieuCuLonNhat: 105,
        KhauDo: 4,
        LayNet: "DDSSM",
        ChongRung: true,
        LayNetGanNhat: 0.38,
        KinhLoc: 77,
        KichThuoc: "83.4 x 113.3",
        KhoiLuong: 663,
      }),
      TrangThai: TrangThaiThietBi.SAN_SANG,
      NguonThamKhaoUrl: Nguon.Sony24105,
      ViTriKho: "Tủ LEN-A · Ngăn 02",
      ThoiGianKiemTraSauSuDungPhut: 15,
    },
    {
      Id: Id.CanonRf2470,
      MaQR: "TB-LEN-CANON-RF2470-01",
      SoSeri: "DEMO-RF2470L-001",
      TenThietBi: "Canon RF 24–70mm F2.8 L IS USM",
      DanhMucId: Id.DmOngKinh,
      ThongSoKyThuat: ThongSoOngKinh({
        ThuongHieu: "Canon",
        Model: "RF24-70mm F2.8 L IS USM",
        Ngam: "CANON_RF",
        TieuCuLonNhat: 70,
        KhauDo: 2.8,
        LayNet: "NANO_USM",
        ChongRung: true,
        LayNetGanNhat: 0.21,
        KinhLoc: 82,
        KichThuoc: "88.5 x 125.7",
        KhoiLuong: 900,
      }),
      TrangThai: TrangThaiThietBi.BAO_TRI,
      HinhAnhUrl:
        "https://files.canon-europe.com/files/webcontent/rf-lens-world/img/features/rf-lineup/img03-pup.png",
      NguonThamKhaoUrl: Nguon.CanonRf2470,
      ViTriKho: "Tủ LEN-B · Ngăn 01",
      ThoiGianKiemTraSauSuDungPhut: 20,
    },
    {
      Id: Id.SigmaEf2470,
      MaQR: "TB-LEN-SIGMA-EF2470-01",
      SoSeri: "DEMO-A017-EF-001",
      TenThietBi: "Sigma 24–70mm F2.8 DG OS HSM Art (Canon EF)",
      DanhMucId: Id.DmOngKinh,
      ThongSoKyThuat: ThongSoOngKinh({
        ThuongHieu: "Sigma",
        Model: "A017",
        Ngam: "CANON_EF",
        TieuCuLonNhat: 70,
        KhauDo: 2.8,
        LayNet: "HSM",
        ChongRung: true,
        LayNetGanNhat: 0.37,
        KinhLoc: 82,
        KichThuoc: "88 x 107.6",
        KhoiLuong: 1020,
      }),
      TrangThai: TrangThaiThietBi.SAN_SANG,
      HinhAnhUrl:
        "https://www.sigma-global.com/lenses/a017_24_70_28_product_img01.png",
      NguonThamKhaoUrl: Nguon.SigmaEf2470,
      ViTriKho: "Tủ LEN-B · Ngăn 02",
      ThoiGianKiemTraSauSuDungPhut: 20,
    },
    {
      Id: Id.Mc11,
      MaQR: "TB-ACC-SIGMA-MC11-01",
      SoSeri: "DEMO-MC11-EF-E-001",
      TenThietBi: "Sigma Mount Converter MC-11 EF-E",
      DanhMucId: Id.DmPhuKien,
      ThongSoKyThuat: {
        thuongHieu: "Sigma",
        model: "MC-11 EF-E",
        loaiPhuKien: "NGAM_CHUYEN_ONG_KINH",
        ngamNguon: "CANON_EF",
        ngamDich: "SONY_E",
        thuongHieuOngKinhHoTro: ["Sigma"],
        truyenLayNetTuDong: true,
        truyenDuLieuExif: true,
        kichThuocMm: "69.4 x 26",
        khoiLuongG: 125,
      },
      TrangThai: TrangThaiThietBi.SAN_SANG,
      NguonThamKhaoUrl: Nguon.Mc11,
      ViTriKho: "Tủ ACC-A · Ngăn 01",
      ThoiGianKiemTraSauSuDungPhut: 10,
    },
    {
      Id: Id.Aputure600d,
      MaQR: "TB-LGT-APUTURE-600D-01",
      SoSeri: "DEMO-LS600DPRO-001",
      TenThietBi: "Aputure LS 600d Pro",
      DanhMucId: Id.DmChieuSang,
      ThongSoKyThuat: {
        thuongHieu: "Aputure",
        model: "LS 600d Pro",
        loaiDen: "COB_LED_DIEM",
        congSuatDauRaW: 600,
        congSuatTieuThuToiDaW: 720,
        doRoiLux: "8500 tại 3 m với Hyper Reflector",
        nhietDoMauK: "5600 ± 200",
        hoTroRgb: false,
        cri: 96,
        tlci: 96,
        daiDieuChinhPhanTram: "0-100",
        phuongThucDieuKhien: [
          "TRUC_TIEP",
          "SIDUS_LINK",
          "DMX512",
          "ART_NET",
          "CRMX",
        ],
        tuyChonNguon: ["AC_100_240V", "V_MOUNT", "GOLD_MOUNT", "XLR_48V"],
        ngamPhuKien: "BOWENS",
        khoiLuongDauDenG: 4640,
      },
      TrangThai: TrangThaiThietBi.SAN_SANG,
      HinhAnhUrl:
        "https://cdn.shopify.com/s/files/1/1343/1935/files/LS600dPro-_1.png?crop=center&v=1708329212&width=1200",
      NguonThamKhaoUrl: Nguon.Aputure600d,
      ViTriKho: "Kệ LGT-A · Vị trí 01",
      ThoiGianKiemTraSauSuDungPhut: 30,
    },
    {
      Id: Id.Amaran300c,
      MaQR: "TB-LGT-AMARAN-300C-01",
      SoSeri: "DEMO-AMARAN300C-001",
      TenThietBi: "amaran 300c",
      DanhMucId: Id.DmChieuSang,
      ThongSoKyThuat: {
        thuongHieu: "amaran",
        model: "300c",
        loaiDen: "COB_LED_RGBWW",
        congSuatDauRaW: 300,
        congSuatTieuThuToiDaW: 360,
        doRoiLux: "26580 tại 1 m với Hyper Reflector",
        nhietDoMauK: "2500-7500",
        hoTroRgb: true,
        cri: 95,
        tlci: 95,
        daiDieuChinhPhanTram: "0-100",
        phuongThucDieuKhien: ["TRUC_TIEP", "SIDUS_LINK"],
        tuyChonNguon: ["DC_48V", "AC_100_240V", "TRAM_PIN_V_GOLD_TUY_CHON"],
        ngamPhuKien: "BOWENS",
        kichThuocMm: "250 x 155 x 142",
        khoiLuongDauDenG: 2633,
      },
      TrangThai: TrangThaiThietBi.SAN_SANG,
      HinhAnhUrl:
        "https://www.amarancreators.com/cdn/shop/files/2_14A8038-Edit-scaled-e1681662295898-1000x749.webp",
      NguonThamKhaoUrl: Nguon.Amaran300c,
      ViTriKho: "Kệ LGT-A · Vị trí 02",
      ThoiGianKiemTraSauSuDungPhut: 25,
    },
    {
      Id: Id.RodeNtg5,
      MaQR: "TB-MIC-RODE-NTG5-01",
      SoSeri: "DEMO-RODE-NTG5-001",
      TenThietBi: "RØDE NTG5",
      DanhMucId: Id.DmMicro,
      ThongSoKyThuat: {
        thuongHieu: "RØDE",
        model: "NTG5",
        loaiThietBiAmThanh: "MICRO_SHOTGUN_CONDENSER_RF_BIAS",
        huongThu: "SUPER_CARDIOID_SHOTGUN",
        dapTuyenTanSoHz: "20-20000",
        doNhay: "-23.5 dB re 1 V/Pa; 66 mV/Pa",
        ketNoiAmThanh: "XLR_3_PIN",
        coDay: true,
        nguonPhantomV: 48,
        kichThuocMm: "203 x 19",
        khoiLuongG: 76,
      },
      TrangThai: TrangThaiThietBi.SAN_SANG,
      HinhAnhUrl:
        "https://edge.rode.com/images/page/1857/modules/4410/rode-ntg5-tube-line-wide-1080x1080-rgb.jpg",
      NguonThamKhaoUrl: Nguon.RodeNtg5,
      ViTriKho: "Tủ AUD-A · Ngăn 01",
      ThoiGianKiemTraSauSuDungPhut: 15,
    },
    {
      Id: Id.SennheiserMke600,
      MaQR: "TB-MIC-SENN-MKE600-01",
      SoSeri: "DEMO-MKE600-001",
      TenThietBi: "Sennheiser MKE 600",
      DanhMucId: Id.DmMicro,
      ThongSoKyThuat: {
        thuongHieu: "Sennheiser",
        model: "MKE 600",
        loaiThietBiAmThanh: "MICRO_SHOTGUN_CONDENSER",
        huongThu: "SUPER_CARDIOID_LOBAR",
        dapTuyenTanSoHz: "40-20000",
        doNhay: "21 mV/Pa với P48; 19 mV/Pa với pin",
        ketNoiAmThanh: "XLR_3_PIN",
        coDay: true,
        nguonPhantomV: 48,
        kichThuocMm: "256 x 20",
        khoiLuongG: 128,
      },
      TrangThai: TrangThaiThietBi.SAN_SANG,
      HinhAnhUrl:
        "https://assets.sennheiser.com/assets/MKE_600_Product_shot_cutout_front_view.png.png/Zz04ZDBjNTIzYWU3YWYxMWYwOTllMjdhZWFhOWMzNzY0YQ%3D%3D?format=webp&quality=80&width=1920",
      NguonThamKhaoUrl: Nguon.SennheiserMke600,
      ViTriKho: "Tủ AUD-A · Ngăn 02",
      ThoiGianKiemTraSauSuDungPhut: 15,
    },
    {
      Id: Id.ZoomF6,
      MaQR: "TB-REC-ZOOM-F6-01",
      SoSeri: "DEMO-ZOOM-F6-001",
      TenThietBi: "Zoom F6 Field Recorder",
      DanhMucId: Id.DmMayGhiAm,
      ThongSoKyThuat: {
        thuongHieu: "Zoom",
        model: "F6",
        loaiThietBiAmThanh: "MAY_GHI_AM_HIEN_TRUONG",
        soKenhDauVao: 6,
        ketNoiAmThanh: ["XLR_TRS_COMBO", "LINE_OUT_3_5_MM", "HEADPHONE_3_5_MM"],
        nguonPhantomV: 48,
        tanSoLayMauKhz: [44.1, 48, 88.2, 96, 192],
        doSauBit: [16, 24, "32_BIT_FLOAT"],
        dongBoTimecode: "TCXO_0_2_PPM",
        phuongTienGhi: "SD_SDHC_SDXC",
        kichThuocMm: "100 x 119.8 x 62.9",
        khoiLuongG: 520,
      },
      TrangThai: TrangThaiThietBi.SAN_SANG,
      HinhAnhUrl:
        "https://zoomcorp.com/media/original_images/F6_front.jpg.800x482_q70_crop_size_canvas.jpg",
      NguonThamKhaoUrl: Nguon.ZoomF6,
      ViTriKho: "Tủ AUD-B · Ngăn 01",
      ThoiGianKiemTraSauSuDungPhut: 20,
    },
  ];
  await PrismaNoiBo.thietBi.createMany({ data: DanhSach });
  await PrismaNoiBo.thietBi.create({
    data: {
      Id: Id.MayQuayDonViB,
      MaQR: "TB-SAOVIET-CAM-01",
      SoSeri: "SAOVIET-CAM-001",
      TenThietBi: "Máy quay demo Sao Việt",
      DanhMucId: Id.DmMayQuayDonViB,
      ThongSoKyThuat: {
        thuongHieu: "Sony",
        model: "FX30",
        ngamOngKinh: "SONY_E",
        doPhanGiaiVideoToiDa: "UHD_4K_3840_X_2160",
      },
      TrangThai: TrangThaiThietBi.SAN_SANG,
      NguonThamKhaoUrl:
        "https://www.sony.com/electronics/support/e-mount-body-ilme-fx30-series/ilme-fx30/specifications",
      ViTriKho: "Kho Sao Việt",
    },
  });
  await PrismaNoiBo.thietBi.updateMany({
    where: {
      Id: {
        in: [
          Id.Fx3,
          Id.Fx6,
          Id.Sony2470,
          Id.SigmaEf2470,
          Id.Mc11,
          Id.Aputure600d,
          Id.Amaran300c,
        ],
      },
    },
    data: { KhoId: Id.KhoTrungTam },
  });
  await PrismaNoiBo.thietBi.updateMany({
    where: {
      Id: {
        in: [
          Id.A7iv,
          Id.Sony24105,
          Id.CanonRf2470,
          Id.RodeNtg5,
          Id.SennheiserMke600,
          Id.ZoomF6,
        ],
      },
    },
    data: { KhoId: Id.KhoPhiaDong },
  });
  await PrismaNoiBo.thietBi.update({
    where: { Id: Id.MayQuayDonViB },
    data: { KhoId: Id.KhoSaoViet },
  });
}

async function TaoDuAn() {
  await PrismaNoiBo.duAn.createMany({
    data: [
      {
        Id: Id.DuAnThuongHieu,
        DonViId: Id.DonViA,
        MaDuAn: "DA-DEMO-THUONG-HIEU-2026",
        TenDuAn: "Phim thương hiệu Năng lượng xanh",
        TenKhachHang: "Công ty Minh Dương",
        MoTa: "Dữ liệu vận hành bình thường cho lịch, phiếu ca quay và kho.",
        TrangThai: TrangThaiDuAn.DANG_SAN_XUAT,
        NguoiTaoId: Id.QuanLy,
        NgayTao: Ngay("2026-08-20T02:00:00Z"),
        HanChot: Ngay("2026-09-30T10:00:00Z"),
      },
      {
        Id: Id.DuAnTalkshow,
        DonViId: Id.DonViA,
        MaDuAn: "DA-DEMO-TALKSHOW-2026",
        TenDuAn: "Talkshow Chuyện nghề sáng tạo",
        TenKhachHang: "Kênh Nội dung Việt",
        MoTa: "Chuỗi talkshow nhiều tập trong Studio B.",
        TrangThai: TrangThaiDuAn.DANG_SAN_XUAT,
        NguoiTaoId: Id.QuanLy,
        NgayTao: Ngay("2026-08-25T02:00:00Z"),
        HanChot: Ngay("2026-10-05T10:00:00Z"),
      },
      {
        Id: Id.DuAnAmNhac,
        DonViId: Id.DonViA,
        MaDuAn: "DA-DEMO-AM-NHAC-2026",
        TenDuAn: "Phiên live acoustic Tháng Chín",
        TenKhachHang: "Phòng thu Mộc",
        MoTa: "Ghi hình và thu âm ban nhạc tại sân khấu nhỏ.",
        TrangThai: TrangThaiDuAn.DANG_CHUAN_BI,
        NguoiTaoId: Id.QuanLy,
        NgayTao: Ngay("2026-09-01T02:00:00Z"),
        HanChot: Ngay("2026-10-10T10:00:00Z"),
      },
      {
        Id: Id.DuAnKiemThu,
        DonViId: Id.DonViA,
        MaDuAn: "DA-TEST-XUNG-DOT-2026",
        TenDuAn: "[KIỂM THỬ] Kịch bản xung đột tài nguyên",
        TenKhachHang: "Nội bộ",
        MoTa: "Ca có chủ đích để kiểm thử, không dùng làm lịch vận hành thật.",
        TrangThai: TrangThaiDuAn.DANG_CHUAN_BI,
        NguoiTaoId: Id.QuanLy,
        NgayTao: Ngay("2026-09-01T02:00:00Z"),
        HanChot: Ngay("2026-12-31T10:00:00Z"),
      },
      {
        Id: Id.DuAnDonViB,
        DonViId: Id.DonViB,
        MaDuAn: "DA-DEMO-SAOVIET-2026",
        TenDuAn: "Chương trình giới thiệu Sao Việt",
        TenKhachHang: "Nội bộ Sao Việt",
        MoTa: "Dữ liệu riêng dùng để kiểm tra cách ly giữa hai đơn vị.",
        TrangThai: TrangThaiDuAn.DANG_SAN_XUAT,
        NguoiTaoId: Id.QuanLyB,
        NgayTao: Ngay("2026-09-02T02:00:00Z"),
        HanChot: Ngay("2026-10-15T10:00:00Z"),
      },
    ],
  });
}

type DuLieuCa = {
  Id: string;
  Ma: string;
  DuAn: string;
  Ten: string;
  BatDau: string;
  KetThuc: string;
  Studio: string;
  DaoDien: string;
  TrangThai?: TrangThaiCaQuay;
  GhiChu?: string;
  UuTien?: number;
  DoiLich?: boolean;
  SomNhat?: string;
  MuonNhat?: string;
  ChuanBi?: number;
  ThuHoi?: number;
};

const CaBinhThuong: DuLieuCa[] = [
  {
    Id: Id.CaQuayDonViB,
    Ma: "DEMO-SAOVIET-CQ-001",
    DuAn: Id.DuAnDonViB,
    Ten: "Ca quay riêng của Studio Sao Việt",
    BatDau: "2026-10-11T02:00:00Z",
    KetThuc: "2026-10-11T03:00:00Z",
    Studio: Id.StudioDonViB,
    DaoDien: Id.QuanLyB,
    TrangThai: TrangThaiCaQuay.DA_DUYET,
    GhiChu:
      "Trùng thời gian với dữ liệu đơn vị A nhưng không được gây xung đột.",
  },
  {
    Id: Id.Demo1,
    Ma: "DEMO-CQ-001",
    DuAn: Id.DuAnThuongHieu,
    Ten: "Phỏng vấn lãnh đạo tại phông xanh",
    BatDau: "2026-09-10T01:00:00Z",
    KetThuc: "2026-09-10T04:00:00Z",
    Studio: Id.StudioA,
    DaoDien: Id.DaoDienAn,
    TrangThai: TrangThaiCaQuay.HOAN_THANH,
    GhiChu: "Ca đã hoàn thành, có nhật ký xuất và nhập kho.",
  },
  {
    Id: Id.Demo2,
    Ma: "DEMO-CQ-002",
    DuAn: Id.DuAnTalkshow,
    Ten: "Talkshow tập 01 – Khởi nghiệp sáng tạo",
    BatDau: "2026-09-12T06:00:00Z",
    KetThuc: "2026-09-12T09:00:00Z",
    Studio: Id.StudioB,
    DaoDien: Id.DaoDienLinh,
    TrangThai: TrangThaiCaQuay.HOAN_THANH,
  },
  {
    Id: Id.Demo3,
    Ma: "DEMO-CQ-003",
    DuAn: Id.DuAnAmNhac,
    Ten: "Live acoustic – Tổng duyệt ánh sáng",
    BatDau: "2026-09-18T10:00:00Z",
    KetThuc: "2026-09-18T14:00:00Z",
    Studio: Id.StudioC,
    DaoDien: Id.DaoDienAn,
    ChuanBi: 60,
    ThuHoi: 30,
  },
  {
    Id: Id.Demo4,
    Ma: "DEMO-CQ-004",
    DuAn: Id.DuAnThuongHieu,
    Ten: "Cảnh sản phẩm buổi sáng",
    BatDau: "2026-09-20T23:00:00Z",
    KetThuc: "2026-09-21T03:00:00Z",
    Studio: Id.StudioA,
    DaoDien: Id.DaoDienLinh,
    DoiLich: true,
  },
  {
    Id: Id.Demo5,
    Ma: "DEMO-CQ-005",
    DuAn: Id.DuAnTalkshow,
    Ten: "Talkshow tập 02 – Hậu kỳ hình ảnh",
    BatDau: "2026-09-22T07:00:00Z",
    KetThuc: "2026-09-22T11:00:00Z",
    Studio: Id.StudioB,
    DaoDien: Id.DaoDienLinh,
    GhiChu: "Dùng ống kính Sigma Canon EF qua ngàm chuyển Sigma MC-11.",
  },
  {
    Id: Id.Demo6,
    Ma: "DEMO-CQ-006",
    DuAn: Id.DuAnAmNhac,
    Ten: "Live acoustic – Ghi hình chính",
    BatDau: "2026-09-24T02:00:00Z",
    KetThuc: "2026-09-24T05:00:00Z",
    Studio: Id.StudioC,
    DaoDien: Id.DaoDienAn,
    UuTien: 80,
    ChuanBi: 45,
    ThuHoi: 30,
  },
];

const CaXungDot: DuLieuCa[] = [
  [
    Id.XungDotStudioA,
    "TEST-XD-STUDIO-01",
    "Studio trùng lịch – ca bao ngoài",
    "2026-10-05T01:00:00Z",
    "2026-10-05T05:00:00Z",
    Id.StudioA,
  ],
  [
    Id.XungDotStudioB,
    "TEST-XD-STUDIO-02",
    "Studio trùng lịch – ca nằm trong",
    "2026-10-05T02:00:00Z",
    "2026-10-05T04:00:00Z",
    Id.StudioA,
  ],
  [
    Id.StudioKhongKhaDung,
    "TEST-XD-STUDIO-KKD",
    "Studio trong thời gian không khả dụng",
    "2026-10-06T03:00:00Z",
    "2026-10-06T05:00:00Z",
    Id.StudioB,
  ],
  [
    Id.XungDotThietBiA,
    "TEST-XD-THIET-BI-01",
    "FX3 trùng ba ca – ca 01",
    "2026-10-07T01:00:00Z",
    "2026-10-07T05:00:00Z",
    Id.StudioA,
  ],
  [
    Id.XungDotThietBiB,
    "TEST-XD-THIET-BI-02",
    "FX3 trùng ba ca – ca nằm trong",
    "2026-10-07T02:00:00Z",
    "2026-10-07T04:00:00Z",
    Id.StudioB,
  ],
  [
    Id.XungDotThietBiC,
    "TEST-XD-THIET-BI-03",
    "FX3 trùng ba ca – ca 03",
    "2026-10-07T03:00:00Z",
    "2026-10-07T06:00:00Z",
    Id.StudioC,
  ],
  [
    Id.ThietBiKhongKhaDung,
    "TEST-XD-THIET-BI-KKD",
    "FX6 trong thời gian không khả dụng",
    "2026-10-08T01:00:00Z",
    "2026-10-08T03:00:00Z",
    Id.StudioB,
  ],
  [
    Id.XungDotNhanSuA,
    "TEST-XD-NHAN-SU-01",
    "Nhân sự trùng lịch – ca bao ngoài",
    "2026-10-09T01:00:00Z",
    "2026-10-09T05:00:00Z",
    Id.StudioA,
  ],
  [
    Id.XungDotNhanSuB,
    "TEST-XD-NHAN-SU-02",
    "Nhân sự trùng lịch – ca nằm trong",
    "2026-10-09T02:00:00Z",
    "2026-10-09T04:00:00Z",
    Id.StudioB,
  ],
  [
    Id.NhanSuKhongKhaDung,
    "TEST-XD-NHAN-SU-KKD",
    "Nhân sự trong thời gian không khả dụng",
    "2026-10-09T06:00:00Z",
    "2026-10-09T08:00:00Z",
    Id.StudioC,
  ],
  [
    Id.XungDotTongHopA,
    "TEST-XD-TONG-HOP-01",
    "Xung đột tổng hợp – ca bao ngoài",
    "2026-10-11T01:00:00Z",
    "2026-10-11T05:00:00Z",
    Id.StudioC,
  ],
  [
    Id.XungDotTongHopB,
    "TEST-XD-TONG-HOP-02",
    "Xung đột tổng hợp – ca nằm trong",
    "2026-10-11T02:00:00Z",
    "2026-10-11T03:00:00Z",
    Id.StudioC,
  ],
  [
    Id.BienA,
    "TEST-BIEN-KHONG-XD-01",
    "Biên liền kề – kết thúc lúc 10:00",
    "2026-10-12T01:00:00Z",
    "2026-10-12T03:00:00Z",
    Id.StudioA,
  ],
  [
    Id.BienB,
    "TEST-BIEN-KHONG-XD-02",
    "Biên liền kề – bắt đầu lúc 10:00",
    "2026-10-12T03:00:00Z",
    "2026-10-12T05:00:00Z",
    Id.StudioA,
  ],
  [
    Id.ThueNgoaiA,
    "TEST-GQ-THUE-NGOAI-01",
    "Thiếu máy ghi âm – ca giữ tài nguyên",
    "2026-10-13T01:00:00Z",
    "2026-10-13T04:00:00Z",
    Id.StudioA,
  ],
  [
    Id.ThueNgoaiB,
    "TEST-GQ-THUE-NGOAI-02",
    "Thiếu máy ghi âm – ca cần xử lý",
    "2026-10-13T02:00:00Z",
    "2026-10-13T03:00:00Z",
    Id.StudioB,
  ],
].map(([CaId, Ma, Ten, BatDau, KetThuc, Studio], ChiSo) => ({
  Id: CaId,
  Ma: Ma,
  DuAn: Id.DuAnKiemThu,
  Ten: `[KIỂM THỬ] ${Ten}`,
  BatDau: BatDau,
  KetThuc: KetThuc,
  Studio: Studio,
  DaoDien: ChiSo % 2 === 0 ? Id.DaoDienAn : Id.DaoDienLinh,
  DoiLich: Ma === "TEST-XD-TONG-HOP-02",
  SomNhat: Ma === "TEST-XD-TONG-HOP-02" ? "2026-10-10T22:00:00Z" : undefined,
  MuonNhat: Ma === "TEST-XD-TONG-HOP-02" ? "2026-10-12T10:00:00Z" : undefined,
  UuTien:
    Ma === "TEST-XD-TONG-HOP-01" ? 90 : Ma === "TEST-XD-TONG-HOP-02" ? 20 : 50,
})) as DuLieuCa[];

async function TaoCaQuay() {
  await PrismaNoiBo.caQuay.createMany({
    data: [...CaBinhThuong, ...CaXungDot].map((Ca) => ({
      Id: Ca.Id,
      MaCaQuay: Ca.Ma,
      DuAnId: Ca.DuAn,
      TieuDe: Ca.Ten,
      ThoiGianBatDau: Ngay(Ca.BatDau),
      ThoiGianKetThuc: Ngay(Ca.KetThuc),
      PhongStudioId: Ca.Studio,
      NguoiPhuTrachId: Ca.DaoDien,
      TrangThai: Ca.TrangThai ?? TrangThaiCaQuay.DA_DUYET,
      GhiChu: Ca.GhiChu ?? "Dữ liệu kiểm thử có chủ đích.",
      MucDoUuTien: Ca.UuTien ?? 50,
      CoTheDoiLich: Ca.DoiLich ?? false,
      ThoiGianBatDauSomNhat: Ca.SomNhat ? Ngay(Ca.SomNhat) : null,
      ThoiGianKetThucMuonNhat: Ca.MuonNhat ? Ngay(Ca.MuonNhat) : null,
      ThoiGianChuanBiPhut: Ca.ChuanBi ?? 0,
      ThoiGianThuHoiPhut: Ca.ThuHoi ?? 0,
    })),
  });
}

async function TaoPhanCong() {
  const ThietBiTheoCa: Array<[string, string[]]> = [
    [Id.CaQuayDonViB, [Id.MayQuayDonViB]],
    [Id.Demo1, [Id.Fx3, Id.Sony2470, Id.Aputure600d, Id.RodeNtg5, Id.ZoomF6]],
    [
      Id.Demo2,
      [Id.Fx6, Id.Sony24105, Id.Amaran300c, Id.SennheiserMke600, Id.ZoomF6],
    ],
    [Id.Demo3, [Id.A7iv, Id.Sony2470, Id.Amaran300c, Id.RodeNtg5, Id.ZoomF6]],
    [Id.Demo4, [Id.Fx6, Id.Sony2470, Id.Aputure600d, Id.RodeNtg5]],
    [
      Id.Demo5,
      [
        Id.Fx3,
        Id.SigmaEf2470,
        Id.Mc11,
        Id.Amaran300c,
        Id.SennheiserMke600,
        Id.ZoomF6,
      ],
    ],
    [Id.Demo6, [Id.A7iv, Id.Sony24105, Id.Aputure600d, Id.RodeNtg5, Id.ZoomF6]],
    [Id.XungDotThietBiA, [Id.Fx3]],
    [Id.XungDotThietBiB, [Id.Fx3]],
    [Id.XungDotThietBiC, [Id.Fx3]],
    [Id.ThietBiKhongKhaDung, [Id.Fx6]],
    [Id.XungDotTongHopA, [Id.Fx3]],
    [Id.XungDotTongHopB, [Id.Fx3]],
    [Id.ThueNgoaiA, [Id.ZoomF6]],
    [Id.ThueNgoaiB, [Id.ZoomF6]],
  ];
  let ChiSo = 1;
  await PrismaNoiBo.caQuayThietBi.createMany({
    data: ThietBiTheoCa.flatMap(([CaQuayId, DanhSach]) =>
      DanhSach.map((ThietBiId) => ({
        Id: TaoId(7, ChiSo++),
        CaQuayId: CaQuayId,
        ThietBiId: ThietBiId,
      })),
    ),
  });
  const NhanSuTheoCa: Array<[string, Array<[string, string]>]> = [
    [Id.CaQuayDonViB, [[Id.NhanSuB, "Điều phối sản xuất"]]],
    [
      Id.Demo1,
      [
        [Id.QuayPhimBinh, "Quay phim"],
        [Id.AmThanhCuong, "Kỹ thuật âm thanh"],
        [Id.AnhSangHoa, "Kỹ thuật ánh sáng"],
        [Id.TroLyGiang, "Trợ lý sản xuất"],
      ],
    ],
    [
      Id.Demo2,
      [
        [Id.QuayPhimMai, "Quay phim"],
        [Id.AmThanhCuong, "Kỹ thuật âm thanh"],
        [Id.AnhSangHoa, "Kỹ thuật ánh sáng"],
      ],
    ],
    [
      Id.Demo3,
      [
        [Id.QuayPhimBinh, "Quay phim"],
        [Id.AmThanhCuong, "Kỹ thuật âm thanh"],
        [Id.AnhSangHoa, "Thiết kế ánh sáng"],
        [Id.TroLyGiang, "Điều phối sản xuất"],
      ],
    ],
    [
      Id.Demo4,
      [
        [Id.QuayPhimMai, "Quay phim"],
        [Id.AnhSangHoa, "Kỹ thuật ánh sáng"],
        [Id.TroLyGiang, "Trợ lý sản xuất"],
      ],
    ],
    [
      Id.Demo5,
      [
        [Id.QuayPhimBinh, "Quay phim"],
        [Id.AmThanhCuong, "Kỹ thuật âm thanh"],
        [Id.TroLyGiang, "Trợ lý sản xuất"],
      ],
    ],
    [
      Id.Demo6,
      [
        [Id.QuayPhimMai, "Quay phim"],
        [Id.AmThanhCuong, "Kỹ thuật âm thanh"],
        [Id.AnhSangHoa, "Kỹ thuật ánh sáng"],
        [Id.TroLyGiang, "Điều phối sản xuất"],
      ],
    ],
    [Id.XungDotNhanSuA, [[Id.QuayPhimBinh, "Quay phim"]]],
    [Id.XungDotNhanSuB, [[Id.QuayPhimBinh, "Quay phim"]]],
    [Id.NhanSuKhongKhaDung, [[Id.AmThanhCuong, "Kỹ thuật âm thanh"]]],
    [Id.XungDotTongHopA, [[Id.QuayPhimBinh, "Quay phim"]]],
    [Id.XungDotTongHopB, [[Id.QuayPhimBinh, "Quay phim"]]],
    [Id.BienA, [[Id.QuayPhimMai, "Quay phim"]]],
    [Id.BienB, [[Id.QuayPhimMai, "Quay phim"]]],
  ];
  let ChiSoNhanSu = 100;
  await PrismaNoiBo.caQuayNhanSu.createMany({
    data: NhanSuTheoCa.flatMap(([CaQuayId, DanhSach]) =>
      DanhSach.map(([NguoiDungId, ChucDanhPhanCong]) => ({
        Id: TaoId(7, ChiSoNhanSu++),
        CaQuayId: CaQuayId,
        NguoiDungId: NguoiDungId,
        ChucDanhPhanCong: ChucDanhPhanCong,
      })),
    ),
  });
}

async function TaoDuLieuKiemThuVaVanHanh() {
  await PrismaNoiBo.phongStudio.update({
    where: { Id: Id.StudioB },
    data: {
      CacKhoangKhongKhaDung: ThanhJson([
        {
          Id: TaoId(10, 1),
          BatDau: Ngay("2026-10-06T02:00:00Z"),
          KetThuc: Ngay("2026-10-06T06:00:00Z"),
          LyDo: "Bảo dưỡng hệ thống cách âm định kỳ.",
        },
      ]),
    },
  });
  await PrismaNoiBo.thietBi.update({
    where: { Id: Id.Fx6 },
    data: {
      CacKhoangKhongKhaDung: ThanhJson([
        {
          Id: TaoId(10, 2),
          BatDau: Ngay("2026-10-08T00:00:00Z"),
          KetThuc: Ngay("2026-10-08T05:00:00Z"),
          LyDo: "Hiệu chuẩn cảm biến và kiểm tra cổng SDI.",
        },
      ]),
    },
  });
  await PrismaNoiBo.nguoiDung.update({
    where: { Id: Id.AmThanhCuong },
    data: {
      CacKhoangKhongKhaDung: ThanhJson([
        {
          Id: TaoId(10, 3),
          BatDau: Ngay("2026-10-09T05:00:00Z"),
          KetThuc: Ngay("2026-10-09T09:00:00Z"),
          LyDo: "Huấn luyện an toàn điện trường quay.",
        },
      ]),
    },
  });
  const YeuCauMau = [
    {
      Id: TaoId(11, 1),
      CaQuayId: Id.Demo6,
      MaYeuCau: "MAY_QUAY_CHINH",
      LoaiTaiNguyen: LoaiTaiNguyen.THIET_BI,
      DanhMucThietBiId: Id.DmMayQuay,
      ThietBiUuTienId: Id.A7iv,
      ChoPhepThayThe: true,
      TrongSo: 80,
      ThongSoToiThieu: {
        ngamOngKinh: "SONY_E",
        doPhanGiaiVideoToiDa: "UHD_4K_3840_X_2160",
        doSauBitToiDa: 10,
      },
    },
    {
      Id: TaoId(11, 2),
      CaQuayId: Id.Demo6,
      MaYeuCau: "NHAN_SU_AM_THANH",
      LoaiTaiNguyen: LoaiTaiNguyen.NHAN_SU,
      ChucDanhId: LayMucMau(Id.DonViA).ChucDanh.get("Âm thanh") ?? null,
      TrongSo: 70,
    },
    {
      Id: TaoId(11, 3),
      CaQuayId: Id.ThietBiKhongKhaDung,
      MaYeuCau: "MAY_QUAY_4K_120P",
      LoaiTaiNguyen: LoaiTaiNguyen.THIET_BI,
      DanhMucThietBiId: Id.DmMayQuay,
      ThietBiUuTienId: Id.Fx6,
      ThongSoToiThieu: {
        ngamOngKinh: "SONY_E",
        tocDoKhungHinh4KToiDaFps: 120,
        doSauBitToiDa: 10,
      },
    },
  ];
  for (const CaQuayId of new Set(YeuCauMau.map((Muc) => Muc.CaQuayId)))
    await PrismaNoiBo.caQuay.update({
      where: { Id: CaQuayId },
      data: {
        CacYeuCauTaiNguyen: ThanhJson(
          YeuCauMau.filter((Muc) => Muc.CaQuayId === CaQuayId).map(
            ({ CaQuayId: BoQua, ...Muc }) => ({
              SoLuong: 1,
              BatBuoc: true,
              ChoPhepThayThe: true,
              TrongSo: 50,
              DanhMucThietBiId: null,
              ThietBiUuTienId: null,
              ChucDanhId: null,
              ThongSoToiThieu: null,
              ThongSoUuTien: null,
              ...Muc,
            }),
          ),
        ),
      },
    });
  await PrismaNoiBo.suCoBaoTri.create({
    data: {
      Id: TaoId(12, 1),
      ThietBiId: Id.CanonRf2470,
      NguoiBaoCaoId: Id.ThuKhoDung,
      MucDo: MucDoSuCo.TRUNG_BINH,
      MoTaLoi: "Vòng zoom có độ rơ, cần kiểm tra trước khi đưa vào ca quay.",
      TrangThai: TrangThaiSuCo.DANG_SUA_CHUA,
      PhuongAnXuLy: "Kiểm tra cơ cấu vòng zoom và hiệu chuẩn.",
      NgayTao: Ngay("2026-09-15T03:30:00Z"),
    },
  });
  await PrismaNoiBo.caQuayThietBi.updateMany({
    where: { CaQuayId: Id.Demo1 },
    data: {
      TrangThaiMuonTra: TrangThaiMuonTra.DA_NHAP_KHO,
      ThoiGianXuatKho: Ngay("2026-09-10T00:20:00Z"),
      ThoiGianNhapKho: Ngay("2026-09-10T04:35:00Z"),
    },
  });
  const ThietBiMuonTra = [
    Id.Fx3,
    Id.Sony2470,
    Id.Aputure600d,
    Id.RodeNtg5,
    Id.ZoomF6,
  ] as const;
  await PrismaNoiBo.nhatKyMuonTra.createMany({
    data: (
      [
        [
          LoaiHanhDong.XUAT_KHO,
          "2026-09-10T00:20:00Z",
          "Thiết bị đủ phụ kiện, hoạt động bình thường.",
        ],
        [
          LoaiHanhDong.NHAP_KHO,
          "2026-09-10T04:35:00Z",
          "Đã kiểm tra, không phát sinh hư hỏng.",
        ],
      ] as const
    ).flatMap(([LoaiHanhDongNoiBo, ThoiGian, GhiChu], ChiSoHanhDong) =>
      ThietBiMuonTra.map((ThietBiId, ChiSoThietBi) => ({
        Id: TaoId(13, ChiSoHanhDong * 10 + ChiSoThietBi + 1),
        ThietBiId: ThietBiId,
        CaQuayId: Id.Demo1,
        NguoiThucHienId: Id.ThuKhoDung,
        LoaiHanhDong: LoaiHanhDongNoiBo as LoaiHanhDong,
        PhuongThuc:
          ChiSoThietBi === 4
            ? PhuongThucQuet.NHAP_TAY
            : PhuongThucQuet.QUET_QR_CAMERA,
        GhiChuTinhTrang: GhiChu,
        ThoiGian: Ngay(ThoiGian),
      })),
    ),
  });
}

function GiaoNhau(
  BatDauA: Date,
  KetThucA: Date,
  BatDauB: Date,
  KetThucB: Date,
) {
  return BatDauA < KetThucB && KetThucA > BatDauB;
}

function DamBao(DieuKien: unknown, ThongBao: string): asserts DieuKien {
  if (!DieuKien) throw new Error(`Kiểm tra seed thất bại: ${ThongBao}`);
}

async function KiemTraDuLieuMau() {
  const CacCaBinhThuong = await PrismaNoiBo.caQuay.findMany({
    where: { MaCaQuay: { startsWith: "DEMO-CQ-" } },
    orderBy: { ThoiGianBatDau: "asc" },
  });
  DamBao(CacCaBinhThuong.length === 6, "phải có đúng 6 ca bình thường");
  for (let I = 0; I < CacCaBinhThuong.length; I += 1) {
    for (let J = I + 1; J < CacCaBinhThuong.length; J += 1) {
      const CaA = CacCaBinhThuong[I];
      const CaB = CacCaBinhThuong[J];
      DamBao(CaA && CaB, "không đọc được ca bình thường");
      DamBao(
        !GiaoNhau(
          CaA.ThoiGianBatDau,
          CaA.ThoiGianKetThuc,
          CaB.ThoiGianBatDau,
          CaB.ThoiGianKetThuc,
        ),
        `${CaA.MaCaQuay} và ${CaB.MaCaQuay} không được chồng thời gian`,
      );
    }
  }
  const LayCa = (CaQuayId: string) =>
    PrismaNoiBo.caQuay.findUniqueOrThrow({
      where: { Id: CaQuayId },
      include: { DanhSachThietBi: true, DanhSachNhanSu: true },
    });
  const [
    StudioA,
    StudioB,
    ThietBiA,
    ThietBiB,
    ThietBiC,
    ThietBiKkd,
    NhanSuA,
    NhanSuB,
    NhanSuKkd,
    StudioKkd,
    TongHopA,
    TongHopB,
    BienA,
    BienB,
  ] = await Promise.all([
    LayCa(Id.XungDotStudioA),
    LayCa(Id.XungDotStudioB),
    LayCa(Id.XungDotThietBiA),
    LayCa(Id.XungDotThietBiB),
    LayCa(Id.XungDotThietBiC),
    LayCa(Id.ThietBiKhongKhaDung),
    LayCa(Id.XungDotNhanSuA),
    LayCa(Id.XungDotNhanSuB),
    LayCa(Id.NhanSuKhongKhaDung),
    LayCa(Id.StudioKhongKhaDung),
    LayCa(Id.XungDotTongHopA),
    LayCa(Id.XungDotTongHopB),
    LayCa(Id.BienA),
    LayCa(Id.BienB),
  ]);
  DamBao(
    StudioA.PhongStudioId === StudioB.PhongStudioId &&
      GiaoNhau(
        StudioA.ThoiGianBatDau,
        StudioA.ThoiGianKetThuc,
        StudioB.ThoiGianBatDau,
        StudioB.ThoiGianKetThuc,
      ) &&
      StudioB.ThoiGianBatDau > StudioA.ThoiGianBatDau &&
      StudioB.ThoiGianKetThuc < StudioA.ThoiGianKetThuc,
    "kịch bản Studio phải chồng lịch và có khoảng nằm hoàn toàn bên trong",
  );
  DamBao(
    [ThietBiA, ThietBiB, ThietBiC].every((Ca) =>
      Ca.DanhSachThietBi.some((PhanCong) => PhanCong.ThietBiId === Id.Fx3),
    ) &&
      GiaoNhau(
        ThietBiA.ThoiGianBatDau,
        ThietBiA.ThoiGianKetThuc,
        ThietBiB.ThoiGianBatDau,
        ThietBiB.ThoiGianKetThuc,
      ) &&
      GiaoNhau(
        ThietBiA.ThoiGianBatDau,
        ThietBiA.ThoiGianKetThuc,
        ThietBiC.ThoiGianBatDau,
        ThietBiC.ThoiGianKetThuc,
      ),
    "FX3 phải xung đột với nhiều ca chồng nhau",
  );
  DamBao(
    [NhanSuA, NhanSuB].every((Ca) =>
      Ca.DanhSachNhanSu.some(
        (PhanCong) => PhanCong.NguoiDungId === Id.QuayPhimBinh,
      ),
    ) &&
      GiaoNhau(
        NhanSuA.ThoiGianBatDau,
        NhanSuA.ThoiGianKetThuc,
        NhanSuB.ThoiGianBatDau,
        NhanSuB.ThoiGianKetThuc,
      ),
    "nhân sự phải được phân vào hai ca chồng nhau",
  );
  const CungThietBi = TongHopA.DanhSachThietBi.some((PhanCongA) =>
    TongHopB.DanhSachThietBi.some(
      (PhanCongB) => PhanCongA.ThietBiId === PhanCongB.ThietBiId,
    ),
  );
  const CungNhanSu = TongHopA.DanhSachNhanSu.some((PhanCongA) =>
    TongHopB.DanhSachNhanSu.some(
      (PhanCongB) => PhanCongA.NguoiDungId === PhanCongB.NguoiDungId,
    ),
  );
  DamBao(
    TongHopA.PhongStudioId === TongHopB.PhongStudioId &&
      CungThietBi &&
      CungNhanSu &&
      GiaoNhau(
        TongHopA.ThoiGianBatDau,
        TongHopA.ThoiGianKetThuc,
        TongHopB.ThoiGianBatDau,
        TongHopB.ThoiGianKetThuc,
      ),
    "kịch bản tổng hợp phải xung đột cả ba lớp tài nguyên",
  );
  DamBao(
    BienA.ThoiGianKetThuc.getTime() === BienB.ThoiGianBatDau.getTime() &&
      !GiaoNhau(
        BienA.ThoiGianBatDau,
        BienA.ThoiGianKetThuc,
        BienB.ThoiGianBatDau,
        BienB.ThoiGianKetThuc,
      ),
    "hai ca biên phải liền kề nhưng không chồng nhau",
  );
  const [StudioKhaDung, ThietBiKhaDung, NhanSuKhaDung, SoFx3BiTrung] =
    await Promise.all([
      PrismaNoiBo.phongStudio
        .findUniqueOrThrow({ where: { Id: Id.StudioB } })
        .then((Muc) => {
          const Khoang = DocKhoangBan(Muc.CacKhoangKhongKhaDung)[0];
          if (!Khoang) throw new Error("Thiếu khoảng bận mẫu");
          return {
            ...Khoang,
            BatDau: new Date(Khoang.BatDau),
            KetThuc: new Date(Khoang.KetThuc),
            PhongStudioId: Muc.Id,
          };
        }),
      PrismaNoiBo.thietBi
        .findUniqueOrThrow({ where: { Id: Id.Fx6 } })
        .then((Muc) => {
          const Khoang = DocKhoangBan(Muc.CacKhoangKhongKhaDung)[0];
          if (!Khoang) throw new Error("Thiếu khoảng bận mẫu");
          return {
            ...Khoang,
            BatDau: new Date(Khoang.BatDau),
            KetThuc: new Date(Khoang.KetThuc),
            ThietBiId: Muc.Id,
          };
        }),
      PrismaNoiBo.nguoiDung
        .findUniqueOrThrow({ where: { Id: Id.AmThanhCuong } })
        .then((Muc) => {
          const Khoang = DocKhoangBan(Muc.CacKhoangKhongKhaDung)[0];
          if (!Khoang) throw new Error("Thiếu khoảng bận mẫu");
          return {
            ...Khoang,
            BatDau: new Date(Khoang.BatDau),
            KetThuc: new Date(Khoang.KetThuc),
            NguoiDungId: Muc.Id,
          };
        }),
      PrismaNoiBo.caQuayThietBi.count({
        where: {
          ThietBiId: Id.Fx3,
          CaQuayId: {
            in: [Id.XungDotThietBiA, Id.XungDotThietBiB, Id.XungDotThietBiC],
          },
        },
      }),
    ]);
  DamBao(
    StudioKkd.PhongStudioId === StudioKhaDung.PhongStudioId &&
      GiaoNhau(
        StudioKkd.ThoiGianBatDau,
        StudioKkd.ThoiGianKetThuc,
        StudioKhaDung.BatDau,
        StudioKhaDung.KetThuc,
      ),
    "ca Studio không khả dụng phải nằm trong khoảng khóa Studio",
  );
  DamBao(
    ThietBiKkd.DanhSachThietBi.some(
      (PhanCong) => PhanCong.ThietBiId === ThietBiKhaDung.ThietBiId,
    ) &&
      GiaoNhau(
        ThietBiKkd.ThoiGianBatDau,
        ThietBiKkd.ThoiGianKetThuc,
        ThietBiKhaDung.BatDau,
        ThietBiKhaDung.KetThuc,
      ),
    "ca thiết bị không khả dụng phải dùng đúng thiết bị trong khoảng khóa",
  );
  DamBao(
    NhanSuKkd.DanhSachNhanSu.some(
      (PhanCong) => PhanCong.NguoiDungId === NhanSuKhaDung.NguoiDungId,
    ) &&
      GiaoNhau(
        NhanSuKkd.ThoiGianBatDau,
        NhanSuKkd.ThoiGianKetThuc,
        NhanSuKhaDung.BatDau,
        NhanSuKhaDung.KetThuc,
      ),
    "ca nhân sự không khả dụng phải dùng đúng người trong khoảng khóa",
  );
  DamBao(SoFx3BiTrung === 3, "FX3 phải nằm trong ba ca chồng nhau");
  const DanhSachThietBi = await PrismaNoiBo.thietBi.findMany({
    select: {
      TenThietBi: true,
      ThongSoKyThuat: true,
      NguonThamKhaoUrl: true,
      HinhAnhUrl: true,
      DanhMucId: true,
    },
  });
  DamBao(
    DanhSachThietBi.every(
      (ThietBi) =>
        ThietBi.NguonThamKhaoUrl &&
        !JSON.stringify(ThietBi.ThongSoKyThuat).includes("TODO_VERIFY"),
    ),
    "mọi thiết bị phải có nguồn và không còn TODO_VERIFY",
  );
  DanhSachThietBi.filter((ThietBi) => ThietBi.HinhAnhUrl).forEach((ThietBi) =>
    DamBao(
      ThietBi.HinhAnhUrl?.startsWith("https://"),
      `ảnh ${ThietBi.TenThietBi} phải dùng HTTPS`,
    ),
  );
  DamBao(
    DanhSachThietBi.filter((ThietBi) => ThietBi.HinhAnhUrl).length >= 7,
    "phải có ảnh HTTPS chính hãng cho các thiết bị chính có ảnh ổn định",
  );
  const CacNhomTheoDanhMuc = new Map<string, typeof DanhSachThietBi>();
  DanhSachThietBi.forEach((ThietBi) => {
    const DanhSach = CacNhomTheoDanhMuc.get(ThietBi.DanhMucId) ?? [];
    DanhSach.push(ThietBi);
    CacNhomTheoDanhMuc.set(ThietBi.DanhMucId, DanhSach);
  });
  const KhoaSoSanhTheoDanhMuc = new Map<string, string[]>([
    [
      Id.DmMayQuay,
      [
        "ngamOngKinh",
        "loaiCamBien",
        "doPhanGiaiHieuDungMp",
        "doPhanGiaiVideoToiDa",
        "tocDoKhungHinh4KToiDaFps",
        "doSauBitToiDa",
        "codecVideo",
        "isoVideo",
        "daiTuongPhanStop",
        "chongRungThanMay",
        "layNetTuDong",
        "theNho",
        "kichThuocMm",
        "khoiLuongThanMayG",
      ],
    ],
    [
      Id.DmOngKinh,
      [
        "ngamOngKinh",
        "dinhDangCamBien",
        "tieuCuNhoNhatMm",
        "tieuCuLonNhatMm",
        "khauDoLonNhat",
        "layNetTuDong",
        "chongRungQuangHoc",
        "khoangLayNetGanNhatM",
        "duongKinhKinhLocMm",
        "kichThuocMm",
        "khoiLuongG",
      ],
    ],
    [
      Id.DmChieuSang,
      [
        "loaiDen",
        "congSuatDauRaW",
        "doRoiLux",
        "nhietDoMauK",
        "hoTroRgb",
        "cri",
        "tlci",
        "phuongThucDieuKhien",
        "tuyChonNguon",
        "ngamPhuKien",
        "khoiLuongDauDenG",
      ],
    ],
    [
      Id.DmMicro,
      [
        "loaiThietBiAmThanh",
        "huongThu",
        "dapTuyenTanSoHz",
        "doNhay",
        "ketNoiAmThanh",
        "coDay",
        "nguonPhantomV",
        "kichThuocMm",
        "khoiLuongG",
      ],
    ],
  ]);
  KhoaSoSanhTheoDanhMuc.forEach((CacKhoa, DanhMucId) => {
    const DanhSach = CacNhomTheoDanhMuc.get(DanhMucId) ?? [];
    DamBao(DanhSach.length >= 2, `danh mục ${DanhMucId} phải đủ mẫu so sánh`);
    DanhSach.forEach((ThietBi) => {
      const ThongSo = ThietBi.ThongSoKyThuat as Record<string, unknown>;
      DamBao(
        CacKhoa.every((Khoa) => Khoa in ThongSo),
        `thiết bị ${ThietBi.TenThietBi} phải đủ khóa so sánh chung`,
      );
    });
  });
}

async function Main() {
  console.log("Đang làm sạch dữ liệu mẫu cũ...");
  await DonDuLieuCu();
  await TaoDonVi();
  await TaoNhomQuyenVaChucDanh();
  await TaoKho();
  console.log("Đang tạo nhân sự, Studio và thiết bị...");
  await TaoNguoiDungVaTrinhDo();
  await TaoStudioVaDanhMuc();
  await TaoThietBi();

  console.log("Đang tạo dự án, ca quay và phân công...");
  await TaoDuAn();
  await TaoCaQuay();
  await TaoPhanCong();
  await TaoDuLieuKiemThuVaVanHanh();
  console.log("Đang kiểm tra tính toàn vẹn và kịch bản seed...");
  await KiemTraDuLieuMau();
  console.log("Hoàn tất seed dữ liệu demo và kiểm thử xung đột.");
}

Main()
  .catch((Loi: unknown) => {
    console.error("Seed thất bại:", Loi);
    process.exitCode = 1;
  })
  .finally(async () => {
    await PrismaNoiBo.$disconnect();
  });
