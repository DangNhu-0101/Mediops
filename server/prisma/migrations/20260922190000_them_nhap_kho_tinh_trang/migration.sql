-- CreateEnum
CREATE TYPE "TinhTrangTraThietBi" AS ENUM ('BINH_THUONG', 'CAN_KIEM_TRA', 'HU_HONG');

-- AlterTable
ALTER TABLE "nhat_ky_muon_tra"
ADD COLUMN "khoNguonId" TEXT,
ADD COLUMN "tinhTrangTra" "TinhTrangTraThietBi";

-- CreateIndex
CREATE INDEX "nhat_ky_muon_tra_khoNguonId_idx" ON "nhat_ky_muon_tra"("khoNguonId");

-- AddForeignKey
ALTER TABLE "nhat_ky_muon_tra"
ADD CONSTRAINT "nhat_ky_muon_tra_khoNguonId_fkey"
FOREIGN KEY ("khoNguonId") REFERENCES "kho"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
