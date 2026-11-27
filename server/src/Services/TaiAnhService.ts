import { Readable } from "node:stream";
import { LuuTruAnh } from "../Config/Cloudinary.js";
import {
  DungLuongAnhToiDa,
  LoiTepAnhKhongHopLe,
} from "../Middlewares/TaiAnhThietBiMiddleware.js";

export interface AnhDaTaiLen {
  SecureUrl: string;
  PublicId: string;
}

// Ảnh chỉ cần nội dung, dung lượng và loại; dùng chung cho tệp tải lên và ảnh chèn trong Excel.
export type TepAnhDuLieu = Pick<
  Express.Multer.File,
  "buffer" | "size" | "mimetype"
>;

export interface CongCuLuuTruAnh {
  TaiAnh: (Tep: Express.Multer.File, ThuMuc: string) => Promise<AnhDaTaiLen>;
  XoaAnh: (PublicId: string) => Promise<void>;
}

function NhanDinhDangAnh(DuLieu: Buffer) {
  if (DuLieu[0] === 0xff && DuLieu[1] === 0xd8 && DuLieu[2] === 0xff) {
    return "image/jpeg";
  }
  if (DuLieu.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
    return "image/png";
  }
  const DauGif = DuLieu.subarray(0, 6).toString("ascii");
  if (DauGif === "GIF87a" || DauGif === "GIF89a") return "image/gif";
  if (
    DuLieu.subarray(0, 4).toString("ascii") === "RIFF" &&
    DuLieu.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return undefined;
}

export function KiemTraNoiDungAnh(Tep: TepAnhDuLieu) {
  if (Tep.size > DungLuongAnhToiDa || Tep.buffer.length > DungLuongAnhToiDa) {
    throw new LoiTepAnhKhongHopLe("Mỗi ảnh tải lên không được vượt quá 5 MB");
  }
  const DinhDangThuc = NhanDinhDangAnh(Tep.buffer);
  if (!DinhDangThuc) {
    throw new LoiTepAnhKhongHopLe("Nội dung tệp không phải là ảnh hợp lệ");
  }
  if (DinhDangThuc !== Tep.mimetype) {
    throw new LoiTepAnhKhongHopLe(
      "Định dạng nội dung ảnh không khớp với loại tệp đã khai báo",
    );
  }
}

export async function TaiAnhMacDinh(
  Tep: TepAnhDuLieu,
  ThuMuc: string,
): Promise<AnhDaTaiLen> {
  KiemTraNoiDungAnh(Tep);
  return new Promise((GiaiQuyet, TuChoi) => {
    const TaiLen = LuuTruAnh.uploader.upload_stream(
      { folder: ThuMuc, resource_type: "image" },
      (Loi, KetQua) => {
        if (Loi || !KetQua?.secure_url || !KetQua.public_id) {
          return TuChoi(Loi ?? new Error("Không thể tải ảnh lên Cloudinary"));
        }
        return GiaiQuyet({
          SecureUrl: KetQua.secure_url,
          PublicId: KetQua.public_id,
        });
      },
    );
    Readable.from(Tep.buffer).pipe(TaiLen);
  });
}

async function XoaAnhMacDinh(PublicId: string) {
  await LuuTruAnh.uploader.destroy(PublicId, { resource_type: "image" });
}

export const CongCuLuuTruAnhCloudinary: CongCuLuuTruAnh = {
  TaiAnh: TaiAnhMacDinh,
  XoaAnh: XoaAnhMacDinh,
};

export async function TaiDanhSachAnhAnToan<T>(ThamSo: {
  DanhSachTep: Express.Multer.File[];
  ThuMuc: string;
  LuuVaoCoSoDuLieu: (DanhSachAnh: AnhDaTaiLen[]) => Promise<T>;
  CongCu?: CongCuLuuTruAnh;
}) {
  const CongCu = ThamSo.CongCu ?? CongCuLuuTruAnhCloudinary;
  ThamSo.DanhSachTep.forEach(KiemTraNoiDungAnh);
  const DanhSachDaTai: AnhDaTaiLen[] = [];
  try {
    for (const Tep of ThamSo.DanhSachTep) {
      DanhSachDaTai.push(await CongCu.TaiAnh(Tep, ThamSo.ThuMuc));
    }
    return await ThamSo.LuuVaoCoSoDuLieu(DanhSachDaTai);
  } catch (Loi) {
    await Promise.allSettled(
      DanhSachDaTai.map((Anh) => CongCu.XoaAnh(Anh.PublicId)),
    );
    throw Loi;
  }
}

export async function TaiAnhLenCloudinary(Tep: Express.Multer.File) {
  const KetQua = await TaiAnhMacDinh(Tep, "mediops/thiet-bi");
  return KetQua.SecureUrl;
}
