import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import { z } from "zod";
import {
  LoiDuLieuKhongHopLe,
  LoiKhongTimThay,
  LoiXungDotDuLieu,
  LoiXungDotLichCaQuay,
} from "./LoiNghiepVuService.js";
import { LoiTepAnhKhongHopLe } from "../Middlewares/TaiAnhThietBiMiddleware.js";
import { KiemTraNoiDungAnh, type TepAnhDuLieu } from "./TaiAnhService.js";

// Giới hạn số dòng mỗi lần nhập để tránh một yêu cầu giữ kết nối quá lâu.
export const SoDongNhapToiDa = 500;

export interface CotExcel {
  Khoa: string;
  TieuDe: string;
  BatBuoc?: boolean;
  MoTa: string;
  ViDu: string;
  // Tên cột trong trang "Danh sách chọn" dùng làm danh sách thả xuống.
  DanhSachChon?: string;
}

export interface DanhSachChonExcel {
  TieuDe: string;
  GiaTri: string[];
}

export interface CauHinhNhapExcel<TNguCanh, TDuLieu> {
  TenTrang: string;
  DanhSachCot: CotExcel[];
  LayNguCanh: () => Promise<TNguCanh>;
  LayDanhSachChon?: (NguCanh: TNguCanh) => DanhSachChonExcel[];
  // Chuyển một dòng Excel thành dữ liệu giống hệt dữ liệu biểu mẫu tạo mới.
  ChuyenDong: (
    Dong: Record<string, string>,
    NguCanh: TNguCanh,
    BanDoLoi: z.ZodErrorMap,
  ) => TDuLieu;
  // Khóa định danh để phát hiện trùng lặp ngay trong tệp.
  LayKhoaTrung?: (DuLieu: TDuLieu) => string | undefined;
  ThongBaoTrung?: string;
  // Khóa cột chứa ảnh chèn trực tiếp vào ô; ảnh nằm trong ô góc trên bên trái của dòng.
  KhoaAnh?: string;
  Luu: (DuLieu: TDuLieu, Anh?: TepAnhDuLieu) => Promise<unknown>;
}

export interface LoiDongExcel {
  Dong: number;
  ThongBao: string;
}

export interface KetQuaNhapExcel {
  TongSoDong: number;
  SoDongThanhCong: number;
  DanhSachLoi: LoiDongExcel[];
}

// Lỗi toàn tệp: không có dòng nào được lưu.
export class LoiNhapExcel extends Error {
  constructor(
    Message: string,
    public readonly DanhSachLoi: LoiDongExcel[] = [],
  ) {
    super(Message);
  }
}

// Lỗi của một ô dữ liệu, hiển thị nguyên văn cho người dùng.
export class LoiOExcel extends Error {}

function ChuanHoaTieuDe(GiaTri: string) {
  return GiaTri.replace(/\*/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function HaiChuSo(GiaTri: number) {
  return String(GiaTri).padStart(2, "0");
}

// Excel lưu ngày giờ như giờ treo tường; ExcelJS trả về Date theo UTC cùng giá trị.
function DinhDangNgayExcel(GiaTri: Date) {
  const Ngay = `${HaiChuSo(GiaTri.getUTCDate())}/${HaiChuSo(GiaTri.getUTCMonth() + 1)}/${GiaTri.getUTCFullYear()}`;
  if (GiaTri.getUTCHours() === 0 && GiaTri.getUTCMinutes() === 0) return Ngay;
  return `${Ngay} ${HaiChuSo(GiaTri.getUTCHours())}:${HaiChuSo(GiaTri.getUTCMinutes())}`;
}

function DocGiaTriO(GiaTri: ExcelJS.CellValue): string {
  if (GiaTri === null || GiaTri === undefined) return "";
  if (GiaTri instanceof Date) return DinhDangNgayExcel(GiaTri);
  if (typeof GiaTri === "string") return GiaTri.trim();
  if (typeof GiaTri === "number") return String(GiaTri);
  if (typeof GiaTri === "boolean") return GiaTri ? "Có" : "Không";
  if (typeof GiaTri === "object") {
    if ("richText" in GiaTri)
      return GiaTri.richText
        .map((Doan) => Doan.text)
        .join("")
        .trim();
    if ("text" in GiaTri && typeof GiaTri.text === "string")
      return GiaTri.text.trim();
    if ("result" in GiaTri)
      return DocGiaTriO(GiaTri.result as ExcelJS.CellValue);
  }
  return "";
}

const NhanLoaiTaiNguyen: Record<string, string> = {
  THIET_BI: "Thiết bị",
  NHAN_SU: "Nhân sự",
  STUDIO: "Studio",
};

// Lý do khoảng bận của nhân sự có thể nhạy cảm nên chỉ nêu loại xung đột.
function MoTaXungDot(Loi: LoiXungDotLichCaQuay) {
  const CacMoTa = Loi.DanhSachXungDot.map((XungDot) => {
    const TaiNguyen = `${NhanLoaiTaiNguyen[XungDot.LoaiTaiNguyen] ?? "Tài nguyên"} “${XungDot.TenTaiNguyen}”`;
    switch (XungDot.LoaiXungDot) {
      case "TRUNG_LICH_CA_QUAY":
        return `${TaiNguyen} trùng lịch với ca “${XungDot.CaQuayBiTrung?.TieuDe ?? "khác"}”`;
      case "KHONG_KHA_DUNG":
        return `${TaiNguyen} đang trong lịch bận`;
      case "TRANG_THAI_KHONG_CHO_PHEP":
        return `${TaiNguyen} đang ở trạng thái không cho phép sử dụng`;
      case "CHUA_HOAN_TRA":
        return `${TaiNguyen} chưa được hoàn trả từ ca trước`;
      case "SU_CO_CHUA_XU_LY":
        return `${TaiNguyen} có sự cố chưa xử lý`;
      default:
        return `${TaiNguyen} không khả dụng`;
    }
  });
  const KhongTrung = [...new Set(CacMoTa)];
  return KhongTrung.length
    ? `Xung đột lịch: ${KhongTrung.join("; ")}.`
    : Loi.message;
}

function LayThongBaoLoi(Loi: unknown): string {
  if (Loi instanceof LoiXungDotLichCaQuay) return MoTaXungDot(Loi);
  if (Loi instanceof z.ZodError)
    return Loi.issues[0]?.message ?? "Dữ liệu không hợp lệ.";
  if (
    Loi instanceof LoiOExcel ||
    Loi instanceof LoiTepAnhKhongHopLe ||
    Loi instanceof LoiKhongTimThay ||
    Loi instanceof LoiXungDotDuLieu ||
    Loi instanceof LoiDuLieuKhongHopLe
  )
    return Loi.message;
  console.error(
    "Nhập Excel thất bại tại một dòng:",
    Loi instanceof Error ? Loi.name : "Lỗi không xác định",
  );
  return "Không thể lưu dòng này. Vui lòng kiểm tra lại dữ liệu hoặc thử lại sau.";
}

// Thông báo lỗi Zod mặc định bằng tiếng Việt, gắn với tên cột Excel.
function TaoBanDoLoi(DanhSachCot: CotExcel[]): z.ZodErrorMap {
  return (VanDe) => {
    const Khoa = VanDe.path[0];
    const Cot = DanhSachCot.find((Muc) => Muc.Khoa === Khoa);
    const Ten = Cot ? `"${Cot.TieuDe}"` : "Dữ liệu";
    if (VanDe.code === z.ZodIssueCode.invalid_type)
      return VanDe.received === "undefined" || VanDe.received === "null"
        ? { message: `Vui lòng nhập ${Ten}.` }
        : { message: `${Ten} không đúng định dạng.` };
    if (VanDe.code === z.ZodIssueCode.too_small)
      return {
        message:
          VanDe.type === "string"
            ? `${Ten} phải có ít nhất ${String(VanDe.minimum)} ký tự.`
            : `${Ten} phải lớn hơn hoặc bằng ${String(VanDe.minimum)}.`,
      };
    if (VanDe.code === z.ZodIssueCode.too_big)
      return {
        message:
          VanDe.type === "string"
            ? `${Ten} không được quá ${String(VanDe.maximum)} ký tự.`
            : `${Ten} phải nhỏ hơn hoặc bằng ${String(VanDe.maximum)}.`,
      };
    return { message: `${Ten} không hợp lệ.` };
  };
}

const MauTieuDe: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: "FFFFFFFF" } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } },
  alignment: { vertical: "middle", wrapText: true },
};

export async function TaoTepMauExcel<TNguCanh, TDuLieu>(
  CauHinh: CauHinhNhapExcel<TNguCanh, TDuLieu>,
): Promise<Buffer> {
  const NguCanh = await CauHinh.LayNguCanh();
  const SoTay = new ExcelJS.Workbook();
  SoTay.creator = "MEDIOPS";
  SoTay.created = new Date();

  const TrangDuLieu = SoTay.addWorksheet(CauHinh.TenTrang, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  TrangDuLieu.columns = CauHinh.DanhSachCot.map((Cot) => ({
    header: Cot.BatBuoc ? `${Cot.TieuDe} *` : Cot.TieuDe,
    key: Cot.Khoa,
    width: Math.max(18, Cot.TieuDe.length + 6),
    // Định dạng văn bản để Excel không tự đổi mã, số điện thoại hay ngày giờ.
    style: { numFmt: "@" },
  }));
  const DongTieuDe = TrangDuLieu.getRow(1);
  DongTieuDe.height = 30;
  DongTieuDe.eachCell((O) => {
    O.style = { ...MauTieuDe, numFmt: "@" };
  });

  const DanhSachChon = CauHinh.LayDanhSachChon?.(NguCanh) ?? [];
  if (DanhSachChon.length) {
    const TrangChon = SoTay.addWorksheet("Danh sách chọn");
    DanhSachChon.forEach((Nhom, ViTri) => {
      const SoCot = ViTri + 1;
      TrangChon.getColumn(SoCot).width = Math.max(24, Nhom.TieuDe.length + 4);
      const OTieuDe = TrangChon.getCell(1, SoCot);
      OTieuDe.value = Nhom.TieuDe;
      OTieuDe.style = MauTieuDe;
      Nhom.GiaTri.forEach((GiaTri, Dong) => {
        TrangChon.getCell(Dong + 2, SoCot).value = GiaTri;
      });
    });
    CauHinh.DanhSachCot.forEach((Cot, ViTri) => {
      if (!Cot.DanhSachChon) return;
      const ViTriNhom = DanhSachChon.findIndex(
        (Nhom) => Nhom.TieuDe === Cot.DanhSachChon,
      );
      const Nhom = DanhSachChon[ViTriNhom];
      if (!Nhom?.GiaTri.length) return;
      const TenCot = TrangChon.getColumn(ViTriNhom + 1).letter;
      const CongThuc = `'Danh sách chọn'!$${TenCot}$2:$${TenCot}$${Nhom.GiaTri.length + 1}`;
      for (let Dong = 2; Dong <= SoDongNhapToiDa + 1; Dong++) {
        TrangDuLieu.getCell(Dong, ViTri + 1).dataValidation = {
          type: "list",
          allowBlank: !Cot.BatBuoc,
          formulae: [CongThuc],
          showErrorMessage: true,
          errorStyle: "warning",
          errorTitle: "Giá trị chưa có trong danh sách",
          error: `Vui lòng chọn giá trị trong cột "${Nhom.TieuDe}" của trang Danh sách chọn.`,
        };
      }
    });
  }

  const TrangHuongDan = SoTay.addWorksheet("Hướng dẫn");
  TrangHuongDan.columns = [
    { header: "Cột", key: "Cot", width: 30 },
    { header: "Bắt buộc", key: "BatBuoc", width: 12 },
    { header: "Mô tả và định dạng", key: "MoTa", width: 70 },
    { header: "Ví dụ", key: "ViDu", width: 32 },
  ];
  TrangHuongDan.getRow(1).eachCell((O) => {
    O.style = MauTieuDe;
  });
  for (const Cot of CauHinh.DanhSachCot) {
    TrangHuongDan.addRow({
      Cot: Cot.TieuDe,
      BatBuoc: Cot.BatBuoc ? "Có" : "Không",
      MoTa: Cot.MoTa,
      ViDu: Cot.ViDu,
    });
  }
  TrangHuongDan.addRow({});
  TrangHuongDan.addRow({
    Cot: "Lưu ý",
    MoTa: `Nhập dữ liệu từ dòng 2 của trang "${CauHinh.TenTrang}", không đổi tên hoặc thứ tự tiêu đề. Cột có dấu * là bắt buộc. Mỗi lần nhập tối đa ${SoDongNhapToiDa} dòng.`,
  });
  TrangHuongDan.eachRow((Dong) => {
    Dong.alignment = { vertical: "top", wrapText: true };
  });

  const DuLieu = await SoTay.xlsx.writeBuffer();
  return Buffer.from(DuLieu);
}

// Gom ảnh chèn trong cột ảnh theo số dòng; ảnh được xác định bởi ô góc trên bên trái.
function DocAnhTheoDong(
  SoTay: ExcelJS.Workbook,
  TrangDuLieu: ExcelJS.Worksheet,
  SoCot: number,
) {
  const KetQua = new Map<number, ExcelJS.Image[]>();
  for (const Anh of TrangDuLieu.getImages()) {
    const SoDong = Anh.range.tl.nativeRow + 1;
    if (Anh.range.tl.nativeCol !== SoCot - 1 || SoDong < 2) continue;
    const DanhSach = KetQua.get(SoDong) ?? [];
    DanhSach.push(SoTay.getImage(Number(Anh.imageId)));
    KetQua.set(SoDong, DanhSach);
  }
  return KetQua;
}

function DocAnhExcel(Anh: ExcelJS.Image): TepAnhDuLieu {
  if (!Anh.buffer)
    throw new LoiOExcel("Không đọc được ảnh chèn trong dòng này.");
  const NoiDungAnh = Anh.buffer as unknown as Buffer;
  const Tep: TepAnhDuLieu = {
    buffer: NoiDungAnh,
    size: NoiDungAnh.length,
    mimetype: `image/${Anh.extension}`,
  };
  KiemTraNoiDungAnh(Tep);
  return Tep;
}

export async function NhapTepExcel<TNguCanh, TDuLieu>(
  CauHinh: CauHinhNhapExcel<TNguCanh, TDuLieu>,
  NoiDungTep: Buffer,
): Promise<KetQuaNhapExcel> {
  const SoTay = new ExcelJS.Workbook();
  try {
    await SoTay.xlsx.load(NoiDungTep as unknown as ExcelJS.Buffer);
  } catch {
    throw new LoiNhapExcel(
      "Không đọc được tệp. Vui lòng dùng tệp Excel (.xlsx) tải từ nút Tải file mẫu.",
    );
  }
  const TrangDuLieu =
    SoTay.getWorksheet(CauHinh.TenTrang) ?? SoTay.worksheets[0];
  if (!TrangDuLieu)
    throw new LoiNhapExcel("Tệp Excel không có trang dữ liệu nào.");

  // Ghép tiêu đề trong tệp với cột của mẫu, không phụ thuộc thứ tự cột.
  const ViTriCot = new Map<string, number>();
  TrangDuLieu.getRow(1).eachCell((O, SoCot) => {
    const TieuDe = ChuanHoaTieuDe(DocGiaTriO(O.value));
    const Cot = CauHinh.DanhSachCot.find(
      (Muc) => ChuanHoaTieuDe(Muc.TieuDe) === TieuDe,
    );
    if (Cot && !ViTriCot.has(Cot.Khoa)) ViTriCot.set(Cot.Khoa, SoCot);
  });
  const CotThieu = CauHinh.DanhSachCot.filter(
    (Cot) => Cot.BatBuoc && !ViTriCot.has(Cot.Khoa),
  );
  if (CotThieu.length)
    throw new LoiNhapExcel(
      `Tệp không đúng mẫu, thiếu cột: ${CotThieu.map((Cot) => Cot.TieuDe).join(", ")}. Vui lòng tải file mẫu và nhập lại.`,
    );

  const SoCotAnh = CauHinh.KhoaAnh ? ViTriCot.get(CauHinh.KhoaAnh) : undefined;
  const AnhTheoDong = SoCotAnh
    ? DocAnhTheoDong(SoTay, TrangDuLieu, SoCotAnh)
    : new Map<number, ExcelJS.Image[]>();

  const DanhSachDong: { SoDong: number; DuLieu: Record<string, string> }[] = [];
  // Dòng chỉ có ảnh không làm tăng rowCount nên phải xét thêm các dòng chứa ảnh.
  const SoDongCuoi = Math.max(
    TrangDuLieu.rowCount,
    ...Array.from(AnhTheoDong.keys()),
  );
  for (let SoDong = 2; SoDong <= SoDongCuoi; SoDong++) {
    const DongExcel = TrangDuLieu.getRow(SoDong);
    const DuLieu: Record<string, string> = {};
    for (const Cot of CauHinh.DanhSachCot) {
      const SoCot = ViTriCot.get(Cot.Khoa);
      DuLieu[Cot.Khoa] = SoCot
        ? DocGiaTriO(DongExcel.getCell(SoCot).value)
        : "";
    }
    if (
      Object.values(DuLieu).every((GiaTri) => !GiaTri) &&
      !AnhTheoDong.has(SoDong)
    )
      continue;
    DanhSachDong.push({ SoDong, DuLieu });
  }
  if (!DanhSachDong.length)
    throw new LoiNhapExcel(
      "Tệp chưa có dòng dữ liệu nào. Vui lòng nhập dữ liệu từ dòng thứ 2.",
    );
  if (DanhSachDong.length > SoDongNhapToiDa)
    throw new LoiNhapExcel(
      `Mỗi lần chỉ nhập tối đa ${SoDongNhapToiDa} dòng. Vui lòng chia nhỏ tệp.`,
    );

  // Bước 1: kiểm tra toàn bộ tệp, có lỗi thì không lưu dòng nào.
  const NguCanh = await CauHinh.LayNguCanh();
  const BanDoLoi = TaoBanDoLoi(CauHinh.DanhSachCot);
  const DanhSachLoi: LoiDongExcel[] = [];
  const DanhSachHopLe: {
    SoDong: number;
    DuLieu: TDuLieu;
    Anh?: TepAnhDuLieu;
  }[] = [];
  const KhoaDaGap = new Map<string, number>();
  for (const Dong of DanhSachDong) {
    try {
      const DanhSachAnh = AnhTheoDong.get(Dong.SoDong) ?? [];
      if (DanhSachAnh.length > 1)
        throw new LoiOExcel("Mỗi dòng chỉ được chèn một ảnh.");
      const Anh = DanhSachAnh[0] ? DocAnhExcel(DanhSachAnh[0]) : undefined;
      const DuLieu = CauHinh.ChuyenDong(Dong.DuLieu, NguCanh, BanDoLoi);
      const Khoa = CauHinh.LayKhoaTrung?.(DuLieu)?.trim().toLowerCase();
      if (Khoa) {
        const DongTruoc = KhoaDaGap.get(Khoa);
        if (DongTruoc !== undefined)
          throw new LoiOExcel(
            `${CauHinh.ThongBaoTrung ?? "Dữ liệu bị trùng"} với dòng ${DongTruoc}.`,
          );
        KhoaDaGap.set(Khoa, Dong.SoDong);
      }
      DanhSachHopLe.push({ SoDong: Dong.SoDong, DuLieu, Anh });
    } catch (Loi) {
      DanhSachLoi.push({ Dong: Dong.SoDong, ThongBao: LayThongBaoLoi(Loi) });
    }
  }
  if (DanhSachLoi.length)
    throw new LoiNhapExcel(
      `Tệp có ${DanhSachLoi.length} dòng chưa hợp lệ nên chưa có dữ liệu nào được lưu.`,
      DanhSachLoi,
    );

  // Bước 2: lưu từng dòng qua đúng nghiệp vụ tạo mới.
  let SoDongThanhCong = 0;
  for (const Dong of DanhSachHopLe) {
    try {
      await CauHinh.Luu(Dong.DuLieu, Dong.Anh);
      SoDongThanhCong++;
    } catch (Loi) {
      DanhSachLoi.push({ Dong: Dong.SoDong, ThongBao: LayThongBaoLoi(Loi) });
    }
  }
  return {
    TongSoDong: DanhSachHopLe.length,
    SoDongThanhCong,
    DanhSachLoi,
  };
}

// ---- Bộ chuyển đổi ô dùng chung ----

export function ChuoiTuyChon(GiaTri: string | undefined) {
  const DaCat = GiaTri?.trim();
  return DaCat ? DaCat : undefined;
}

export function ChuoiBatBuoc(GiaTri: string | undefined, TenCot: string) {
  const DaCat = ChuoiTuyChon(GiaTri);
  if (!DaCat) throw new LoiOExcel(`Vui lòng nhập "${TenCot}".`);
  return DaCat;
}

function ChuanHoaSoSanh(GiaTri: string) {
  return GiaTri.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
}

export function TimTheoNhan<T extends string>(
  GiaTri: string | undefined,
  BangNhan: Record<T, string[]>,
  TenCot: string,
): T | undefined {
  const DaCat = ChuoiTuyChon(GiaTri);
  if (!DaCat) return undefined;
  const CanTim = ChuanHoaSoSanh(DaCat);
  for (const [Khoa, DanhSachNhan] of Object.entries(BangNhan) as [
    T,
    string[],
  ][]) {
    if (DanhSachNhan.some((Nhan) => ChuanHoaSoSanh(Nhan) === CanTim))
      return Khoa;
  }
  throw new LoiOExcel(
    `"${TenCot}" không hợp lệ. Giá trị cho phép: ${(Object.values(BangNhan) as string[][]).map((DanhSach) => DanhSach[0]).join(", ")}.`,
  );
}

export function TimTrongDanhSach<T>(
  GiaTri: string | undefined,
  DanhSach: T[],
  LayKhoa: (Muc: T) => (string | null | undefined)[],
  ThongBaoKhongThay: string,
): T | undefined {
  const DaCat = ChuoiTuyChon(GiaTri);
  if (!DaCat) return undefined;
  const CanTim = ChuanHoaSoSanh(DaCat);
  const KetQua = DanhSach.filter((Muc) =>
    LayKhoa(Muc).some((Khoa) => Khoa && ChuanHoaSoSanh(Khoa) === CanTim),
  );
  if (!KetQua.length) throw new LoiOExcel(ThongBaoKhongThay);
  if (KetQua.length > 1)
    throw new LoiOExcel(
      `"${DaCat}" khớp với nhiều mục. Vui lòng dùng mã để xác định duy nhất.`,
    );
  return KetQua[0];
}

export function SoTuyChon(
  GiaTri: string | undefined,
  TenCot: string,
  SoNguyen = false,
) {
  const DaCat = ChuoiTuyChon(GiaTri);
  if (!DaCat) return undefined;
  const So = Number(DaCat.replace(",", "."));
  if (!Number.isFinite(So) || (SoNguyen && !Number.isInteger(So)))
    throw new LoiOExcel(
      `"${TenCot}" phải là ${SoNguyen ? "số nguyên" : "số"}.`,
    );
  return So;
}

export function CoKhong(GiaTri: string | undefined, TenCot: string) {
  const DaCat = ChuoiTuyChon(GiaTri);
  if (!DaCat) return undefined;
  const CanTim = ChuanHoaSoSanh(DaCat);
  if (["có", "co", "x", "1", "true", "yes"].includes(CanTim)) return true;
  if (["không", "khong", "0", "false", "no"].includes(CanTim)) return false;
  throw new LoiOExcel(`"${TenCot}" chỉ nhận "Có" hoặc "Không".`);
}

const MauNgayGio =
  /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?)?$/;

function DocNgayGioVietNam(GiaTri: string, TenCot: string, CanGio: boolean) {
  let DaCat = GiaTri.trim();
  // Ô ngày giờ đặt định dạng văn bản vẫn có thể giữ số sê-ri ngày của Excel.
  if (/^\d+(\.\d+)?$/.test(DaCat) && Number(DaCat) > 59) {
    const SoPhut = Math.round((Number(DaCat) - 25569) * 24 * 60);
    DaCat = DinhDangNgayExcel(new Date(SoPhut * 60 * 1000));
    if (CanGio && !DaCat.includes(":")) DaCat = `${DaCat} 00:00`;
  }
  const KetQua = MauNgayGio.exec(DaCat);
  const ViDu = CanGio ? "dd/mm/yyyy hh:mm" : "dd/mm/yyyy";
  if (!KetQua || (CanGio && KetQua[4] === undefined))
    throw new LoiOExcel(`"${TenCot}" phải theo định dạng ${ViDu}.`);
  const Ngay = Number(KetQua[1]);
  const Thang = Number(KetQua[2]);
  const Nam = Number(KetQua[3]);
  const Gio = Number(KetQua[4] ?? 0);
  const Phut = Number(KetQua[5] ?? 0);
  const KiemTra = new Date(Date.UTC(Nam, Thang - 1, Ngay, Gio, Phut));
  if (
    KiemTra.getUTCFullYear() !== Nam ||
    KiemTra.getUTCMonth() !== Thang - 1 ||
    KiemTra.getUTCDate() !== Ngay ||
    Gio > 23 ||
    Phut > 59
  )
    throw new LoiOExcel(`"${TenCot}" không phải ngày giờ hợp lệ.`);
  return { Nam, Thang, Ngay, Gio, Phut };
}

// Trả chuỗi YYYY-MM-DD giống giá trị ô ngày của biểu mẫu.
export function NgayTuyChon(GiaTri: string | undefined, TenCot: string) {
  const DaCat = ChuoiTuyChon(GiaTri);
  if (!DaCat) return undefined;
  const { Nam, Thang, Ngay } = DocNgayGioVietNam(DaCat, TenCot, false);
  return `${Nam}-${HaiChuSo(Thang)}-${HaiChuSo(Ngay)}`;
}

// Ngày giờ nhập theo giờ Việt Nam, chuyển về mốc UTC như biểu mẫu gửi lên.
export function NgayGioTuyChon(GiaTri: string | undefined, TenCot: string) {
  const DaCat = ChuoiTuyChon(GiaTri);
  if (!DaCat) return undefined;
  const { Nam, Thang, Ngay, Gio, Phut } = DocNgayGioVietNam(
    DaCat,
    TenCot,
    true,
  );
  return new Date(Date.UTC(Nam, Thang - 1, Ngay, Gio - 7, Phut));
}

export function TachDanhSach(GiaTri: string | undefined) {
  return (ChuoiTuyChon(GiaTri) ?? "")
    .split(/[;\n]/)
    .map((Muc) => Muc.trim())
    .filter(Boolean);
}

// "Nhãn: giá trị; Nhãn: giá trị" → đối tượng thông số; Có/Không và số được chuyển kiểu như biểu mẫu.
export function ThongSoTuChuoi(
  GiaTri: string | undefined,
  TenCot: string,
  TimKhoa: (Nhan: string) => string | undefined,
) {
  const KetQua: Record<string, string | number | boolean> = {};
  for (const Muc of TachDanhSach(GiaTri)) {
    const ViTri = Muc.indexOf(":");
    if (ViTri < 1)
      throw new LoiOExcel(
        `"${TenCot}": mục "${Muc}" phải theo dạng "Tên thông số: giá trị".`,
      );
    const Nhan = Muc.slice(0, ViTri).trim();
    const GiaTriMuc = Muc.slice(ViTri + 1).trim();
    const Khoa = TimKhoa(Nhan);
    if (!Khoa)
      throw new LoiOExcel(
        `"${TenCot}": chưa hỗ trợ thông số "${Nhan}". Xem danh sách tên thông số trong trang Danh sách chọn.`,
      );
    if (!GiaTriMuc)
      throw new LoiOExcel(`"${TenCot}": vui lòng nhập giá trị cho "${Nhan}".`);
    KetQua[Khoa] =
      GiaTriMuc === "Có"
        ? true
        : GiaTriMuc === "Không"
          ? false
          : /^-?\d+([.,]\d+)?$/.test(GiaTriMuc)
            ? Number(GiaTriMuc.replace(",", "."))
            : GiaTriMuc;
  }
  return KetQua;
}

const MauKhoangBan =
  /^(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2})\s*(?:đến|-|–)\s*(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2})\s*(?:\((.*)\))?$/i;

// "dd/mm/yyyy hh:mm đến dd/mm/yyyy hh:mm (lý do); ..." theo giờ Việt Nam.
export function KhoangBanTuChuoi(GiaTri: string | undefined, TenCot: string) {
  return TachDanhSach(GiaTri).map((Muc) => {
    const KetQua = MauKhoangBan.exec(Muc);
    if (!KetQua)
      throw new LoiOExcel(
        `"${TenCot}": "${Muc}" phải theo dạng "dd/mm/yyyy hh:mm đến dd/mm/yyyy hh:mm (lý do)".`,
      );
    const BatDau = NgayGioTuyChon(KetQua[1], TenCot);
    const KetThuc = NgayGioTuyChon(KetQua[2], TenCot);
    if (!BatDau || !KetThuc || KetThuc <= BatDau)
      throw new LoiOExcel(
        `"${TenCot}": thời gian kết thúc phải sau thời gian bắt đầu (${Muc}).`,
      );
    return {
      Id: randomUUID(),
      BatDau: BatDau.toISOString(),
      KetThuc: KetThuc.toISOString(),
      LyDo: KetQua[3]?.trim() || null,
    };
  });
}
