import { randomUUID } from "node:crypto";
import { CoSoDuLieu } from "../Config/Database.js";
import {
  DocYeuCau,
  ThanhJson,
  type YeuCauTaiNguyen,
} from "./DuLieuNhungService.js";

// Dựng/cập nhật dữ liệu thử trong cột JSON, không giả lập delegate của bảng đã bỏ.
export async function TaoYeuCauKiemThu({
  data: DuLieu,
}: {
  data: Partial<YeuCauTaiNguyen> & {
    CaQuayId: string;
    MaYeuCau: string;
    LoaiTaiNguyen: YeuCauTaiNguyen["LoaiTaiNguyen"];
  };
}) {
  const { CaQuayId, ...ThongTin } = DuLieu;
  const YeuCau: YeuCauTaiNguyen = {
    Id: randomUUID(),
    SoLuong: 1,
    BatBuoc: true,
    ChoPhepThayThe: true,
    TrongSo: 50,
    DanhMucThietBiId: null,
    ThietBiUuTienId: null,
    ChucDanhId: null,
    ThongSoToiThieu: null,
    ThongSoUuTien: null,
    ...ThongTin,
  };
  const Ca = await CoSoDuLieu.caQuay.findUniqueOrThrow({
    where: { Id: CaQuayId },
  });
  await CoSoDuLieu.caQuay.update({
    where: { Id: CaQuayId },
    data: {
      CacYeuCauTaiNguyen: ThanhJson([
        ...DocYeuCau(Ca.CacYeuCauTaiNguyen),
        YeuCau,
      ]),
    },
  });
  return YeuCau;
}
export async function SuaYeuCauKiemThu({
  where: DieuKien,
  data: DuLieu,
}: {
  where: { CaQuayId?: string; Id?: string };
  data: Partial<YeuCauTaiNguyen>;
}) {
  const CacCa = await CoSoDuLieu.caQuay.findMany({
    where: {
      ...(DieuKien.CaQuayId
        ? { Id: DieuKien.CaQuayId }
        : { CacYeuCauTaiNguyen: { array_contains: [{ Id: DieuKien.Id }] } }),
    },
  });
  for (const Ca of CacCa)
    await CoSoDuLieu.caQuay.update({
      where: { Id: Ca.Id },
      data: {
        CacYeuCauTaiNguyen: ThanhJson(
          DocYeuCau(Ca.CacYeuCauTaiNguyen).map((Muc) =>
            !DieuKien.Id || Muc.Id === DieuKien.Id
              ? { ...Muc, ...DuLieu }
              : Muc,
          ),
        ),
      },
    });
}
