import { BanDoLoiThongKe } from "../Services/KyThongKeService.js";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { YeuCauXacThuc } from "../Types/index.js";
import { LayDonViId } from "../Middlewares/YeuCauDonViMiddleware.js";
import {
  LayTongKho,
  LayMucDoMuon,
  LayLichSuMuon,
  LayLichPhanCongThietBi,
  SchemaLocKho,
} from "../Services/ThongKeKhoService.js";
import { LayDanhSachMau, LuuMau } from "../Services/MauThietBiService.js";
import {
  LoiKhongTimThay,
  LoiXungDotDuLieu,
} from "../Services/LoiNghiepVuService.js";
import { LayKhoLuaChonThietBi } from "../Services/KhoService.js";
import {
  QuanLyDanhMuc,
  LuuDanhMuc,
  XoaDanhMucHoacModel,
} from "../Services/QuanLyDanhMucService.js";

export const DanhMucQuanLy = XuLy((YeuCau) =>
  QuanLyDanhMuc(LayDonViId(YeuCau), YeuCau.query, false),
);
export const ModelQuanLy = XuLy((YeuCau) =>
  QuanLyDanhMuc(LayDonViId(YeuCau), YeuCau.query, true),
);
export const TaoDanhMuc = XuLy((YeuCau) =>
  LuuDanhMuc(LayDonViId(YeuCau), YeuCau.body),
);
export const SuaDanhMuc = XuLy((YeuCau) =>
  LuuDanhMuc(LayDonViId(YeuCau), YeuCau.body, String(YeuCau.params.id)),
);
export const XoaDanhMuc = XuLy((YeuCau) =>
  XoaDanhMucHoacModel(LayDonViId(YeuCau), String(YeuCau.params.id), false),
);
export const XoaModel = XuLy((YeuCau) =>
  XoaDanhMucHoacModel(LayDonViId(YeuCau), String(YeuCau.params.id), true),
);

function XuLy(TacVu: (YeuCau: YeuCauXacThuc) => Promise<unknown>) {
  return async (
    YeuCau: YeuCauXacThuc,
    PhanHoi: Response,
    TiepTheo: NextFunction,
  ) => {
    try {
      return PhanHoi.json(await TacVu(YeuCau));
    } catch (Loi) {
      if (Loi instanceof z.ZodError)
        return PhanHoi.status(400).json({
          ThongBao: Loi.issues[0]?.message ?? "Bộ lọc không hợp lệ.",
        });
      if (Loi instanceof LoiKhongTimThay)
        return PhanHoi.status(404).json({ ThongBao: Loi.message });
      if (Loi instanceof LoiXungDotDuLieu)
        return PhanHoi.status(409).json({ ThongBao: Loi.message });
      return TiepTheo(Loi);
    }
  };
}
export const TongKho = XuLy((YeuCau) =>
  LayTongKho(
    LayDonViId(YeuCau),
    SchemaLocKho.parse(YeuCau.query, { errorMap: BanDoLoiThongKe }),
    {
      NguoiDungId: YeuCau.NguoiDung!.nguoiDungId,
      Quyen: YeuCau.NguoiDung!.Quyen ?? [],
    },
  ),
);
export const MucDoMuon = XuLy((YeuCau) =>
  LayMucDoMuon(
    LayDonViId(YeuCau),
    SchemaLocKho.parse(YeuCau.query, { errorMap: BanDoLoiThongKe }),
  ),
);
export const LichSuMuon = XuLy((YeuCau) =>
  LayLichSuMuon(
    String(YeuCau.params.id),
    LayDonViId(YeuCau),
    SchemaLocKho.parse(YeuCau.query, { errorMap: BanDoLoiThongKe }),
  ),
);
export const LichPhanCongThietBi = XuLy((YeuCau) =>
  LayLichPhanCongThietBi(
    String(YeuCau.params.id),
    LayDonViId(YeuCau),
    SchemaLocKho.parse(YeuCau.query, { errorMap: BanDoLoiThongKe }),
    {
      NguoiDungId: YeuCau.NguoiDung!.nguoiDungId,
      Quyen: YeuCau.NguoiDung!.Quyen ?? [],
    },
  ),
);
export const DanhSachMau = XuLy((YeuCau) => LayDanhSachMau(LayDonViId(YeuCau)));
export const KhoLuaChonThietBi = XuLy((YeuCau) =>
  LayKhoLuaChonThietBi(LayDonViId(YeuCau)),
);
export const SchemaMau = z
  .object({
    MaMau: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập mã dòng tài nguyên.")
      .max(100),
    TenMau: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên dòng tài nguyên.")
      .max(200),
    DanhMucId: z.string().uuid("Danh mục không hợp lệ."),
  })
  .strict("Dữ liệu dòng tài nguyên chứa trường không được hỗ trợ.");
export const TaoMau = XuLy((YeuCau) =>
  LuuMau(
    LayDonViId(YeuCau),
    SchemaMau.parse(YeuCau.body, { errorMap: BanDoLoiThongKe }),
  ),
);
export const SuaMau = XuLy((YeuCau) =>
  LuuMau(
    LayDonViId(YeuCau),
    SchemaMau.parse(YeuCau.body, { errorMap: BanDoLoiThongKe }),
    String(YeuCau.params.id),
  ),
);
