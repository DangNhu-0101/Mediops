import "dotenv/config";
import { PrismaClient } from "@prisma/client";

declare global {
  var PrismaToanCuc: PrismaClient | undefined;
}
export const CoSoDuLieu = globalThis.PrismaToanCuc ?? new PrismaClient();
if (process.env.NODE_ENV !== "production")
  globalThis.PrismaToanCuc = CoSoDuLieu;
