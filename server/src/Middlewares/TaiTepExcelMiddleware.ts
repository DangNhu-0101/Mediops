import type { NextFunction, Response } from "express";
import multer from "multer";
import type { YeuCauXacThuc } from "../Types/index.js";

export const DungLuongExcelToiDa = 5 * 1024 * 1024;

class LoiTepExcelKhongHopLe extends Error {}

const BoTaiTepExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: DungLuongExcelToiDa, files: 1 },
  fileFilter: (YeuCau, Tep, HoanTat) => {
    if (!/\.xlsx$/i.test(Tep.originalname))
      return HoanTat(
        new LoiTepExcelKhongHopLe("Chỉ nhận tệp Excel có đuôi .xlsx."),
      );
    return HoanTat(null, true);
  },
}).single("TepExcel");

// Nhận một tệp Excel trong bộ nhớ và trả lỗi tải tệp bằng tiếng Việt.
export function TaiTepExcel(
  YeuCau: YeuCauXacThuc,
  PhanHoi: Response,
  TiepTheo: NextFunction,
) {
  BoTaiTepExcel(YeuCau, PhanHoi, (Loi: unknown) => {
    if (!Loi) return TiepTheo();
    if (Loi instanceof LoiTepExcelKhongHopLe)
      return PhanHoi.status(400).json({ ThongBao: Loi.message });
    if (Loi instanceof multer.MulterError)
      return PhanHoi.status(400).json({
        ThongBao:
          Loi.code === "LIMIT_FILE_SIZE"
            ? "Tệp Excel không được vượt quá 5 MB."
            : "Vui lòng chọn đúng một tệp Excel để nhập.",
      });
    return TiepTheo(Loi);
  });
}
