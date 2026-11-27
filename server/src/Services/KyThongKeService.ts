import { z } from "zod";
import { Prisma } from "@prisma/client";
export const BanDoLoiThongKe: z.ZodErrorMap = () => ({
  message: "Bộ lọc không hợp lệ. Vui lòng kiểm tra kỳ, ngày và số trang.",
});

// Cột DateTime Prisma là timestamp UTC không kèm múi giờ. Ép từ chuỗi UTC
// để PostgreSQL không tự áp múi giờ của phiên khi so sánh/tính thời lượng.
export const MocThoiGianSql = (Ngay: Date) =>
  Prisma.sql`${Ngay.toISOString()}::timestamp`;

export const SchemaKyThongKe = z.object({
  Ky: z
    .enum(["TOAN_BO", "TUAN_NAY", "THANG_NAY", "TUY_CHON"])
    .default("TOAN_BO"),
  TuNgay: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày bắt đầu không hợp lệ")
    .optional(),
  DenNgay: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày kết thúc không hợp lệ")
    .optional(),
  Trang: z.coerce.number().int().min(1).max(100000).default(1),
  KichThuoc: z.coerce.number().int().min(1).max(50).default(10),
});
export type ThamSoKyThongKe = z.infer<typeof SchemaKyThongKe>;
export interface KyThongKe {
  BatDau: Date;
  KetThuc: Date;
  HienTai: Date;
  ToanBo: boolean;
}

export function LayKyThongKe(
  ThamSo: ThamSoKyThongKe,
  HienTai = new Date(),
): KyThongKe {
  const NgayVietNam = new Date(HienTai.getTime() + 7 * 3600000);
  let TuNgay: string;
  let DenNgay: string;
  if (ThamSo.Ky === "TOAN_BO")
    return {
      BatDau: new Date("1970-01-01Z"),
      KetThuc: new Date("9999-01-01Z"),
      HienTai,
      ToanBo: true,
    };
  if (ThamSo.Ky === "TUY_CHON") {
    if (!ThamSo.TuNgay || !ThamSo.DenNgay)
      throw new z.ZodError([
        {
          code: "custom",
          path: ["TuNgay"],
          message: "Vui lòng chọn đủ ngày bắt đầu và kết thúc.",
        },
      ]);
    TuNgay = ThamSo.TuNgay;
    DenNgay = ThamSo.DenNgay;
  } else {
    const Dau = new Date(NgayVietNam);
    if (ThamSo.Ky === "TUAN_NAY")
      Dau.setUTCDate(Dau.getUTCDate() - ((Dau.getUTCDay() + 6) % 7));
    else Dau.setUTCDate(1);
    TuNgay = Dau.toISOString().slice(0, 10);
    const Cuoi = new Date(Dau);
    if (ThamSo.Ky === "TUAN_NAY") Cuoi.setUTCDate(Cuoi.getUTCDate() + 6);
    else {
      Cuoi.setUTCMonth(Cuoi.getUTCMonth() + 1);
      Cuoi.setUTCDate(0);
    }
    DenNgay = Cuoi.toISOString().slice(0, 10);
  }
  const BatDau = new Date(`${TuNgay}T00:00:00+07:00`);
  const CuoiNgay = new Date(`${DenNgay}T00:00:00+07:00`);
  if (
    !Number.isFinite(BatDau.getTime()) ||
    !Number.isFinite(CuoiNgay.getTime()) ||
    new Date(BatDau.getTime() + 7 * 3600000).toISOString().slice(0, 10) !==
      TuNgay ||
    new Date(CuoiNgay.getTime() + 7 * 3600000).toISOString().slice(0, 10) !==
      DenNgay ||
    CuoiNgay < BatDau
  ) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["TuNgay"],
        message: "Khoảng ngày không hợp lệ.",
      },
    ]);
  }
  return {
    BatDau,
    KetThuc: new Date(CuoiNgay.getTime() + 86400000),
    HienTai,
    ToanBo: false,
  };
}

// Hợp khoảng trước khi cộng: một tài nguyên không bị tính hai lần cùng lúc.
export function TinhGioHop(
  CacKhoang: Array<{ BatDau: Date; KetThuc: Date }>,
  Ky: Pick<KyThongKe, "BatDau" | "KetThuc">,
) {
  const Hop = CacKhoang.map((Khoang) => ({
    BatDau: Math.max(+Khoang.BatDau, +Ky.BatDau),
    KetThuc: Math.min(+Khoang.KetThuc, +Ky.KetThuc),
  }))
    .filter((Khoang) => Khoang.KetThuc > Khoang.BatDau)
    .sort((A, B) => A.BatDau - B.BatDau);
  let Tong = 0;
  let Cuoi = -Infinity;
  for (const Khoang of Hop) {
    Tong += Math.max(0, Khoang.KetThuc - Math.max(Cuoi, Khoang.BatDau));
    Cuoi = Math.max(Cuoi, Khoang.KetThuc);
  }
  return Tong / 3600000;
}
