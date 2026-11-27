import { Prisma } from "@prisma/client";
import { setTimeout as ChoThuLai } from "node:timers/promises";
import { CoSoDuLieu } from "../Config/Database.js";
import { LoiXungDotDuLieu } from "./LoiNghiepVuService.js";

// Chỉ nhận thao tác cơ sở dữ liệu; sự kiện bên ngoài phải chờ commit cuối cùng.
export async function ThucHienGiaoDichLich<T>(
  ThaoTac: (Db: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const SoLanToiDa = 3;
  for (let Lan = 1; Lan <= SoLanToiDa; Lan++) {
    try {
      return await CoSoDuLieu.$transaction(ThaoTac, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15_000,
      });
    } catch (Loi) {
      if (
        !(Loi instanceof Prisma.PrismaClientKnownRequestError) ||
        Loi.code !== "P2034"
      ) {
        throw Loi;
      }
      if (Lan === SoLanToiDa) {
        throw new LoiXungDotDuLieu(
          "Lịch hoặc tài nguyên vừa được người khác cập nhật. Hãy tải lại và thử lại.",
        );
      }
      // Lùi cố định 25/50 ms ngoài transaction để tránh thử lại dồn dập.
      await ChoThuLai(Lan * 25);
    }
  }
  throw new Error("Không thể thực hiện giao dịch lịch");
}
