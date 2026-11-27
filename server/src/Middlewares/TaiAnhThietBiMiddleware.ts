import multer from "multer";

const DinhDangAnhChoPhep = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const SoAnhSuCoToiDa = 5;
export const DungLuongAnhToiDa = 5 * 1024 * 1024;

export class LoiTepAnhKhongHopLe extends Error {}

const CauHinhTaiAnh: multer.Options = {
  storage: multer.memoryStorage(),
  limits: { fileSize: DungLuongAnhToiDa },
  fileFilter: (YeuCau, Tep, HoanTat) => {
    if (!DinhDangAnhChoPhep.has(Tep.mimetype))
      return HoanTat(
        new LoiTepAnhKhongHopLe(
          "Tệp tải lên phải là ảnh JPG, PNG, WEBP hoặc GIF",
        ),
      );
    return HoanTat(null, true);
  },
};

export const TaiAnhThietBi = multer({
  ...CauHinhTaiAnh,
  limits: { ...CauHinhTaiAnh.limits, files: 1 },
});

export const TaiAnhSuCo = multer({
  ...CauHinhTaiAnh,
  limits: { ...CauHinhTaiAnh.limits, files: SoAnhSuCoToiDa },
});
