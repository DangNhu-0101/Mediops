import { CoSoDuLieu } from "../Config/Database.js";

// Máy hợp lệ trong các fixture lịch phải có vị trí đã xác định như dữ liệu thật.
export async function TaoKhoKiemThu(DonViId: string) {
  const Kho = await CoSoDuLieu.kho.upsert({
    where: { DonViId_MaKho: { DonViId, MaKho: "KHO-KIEM-THU" } },
    create: {
      DonViId,
      MaKho: "KHO-KIEM-THU",
      TenKho: "Kho kiểm thử",
      DiaChi: "Địa chỉ kiểm thử",
      ViDo: 10,
      KinhDo: 106,
      BanKinhXacMinhMet: 100,
    },
    update: {},
  });
  return Kho.Id;
}
