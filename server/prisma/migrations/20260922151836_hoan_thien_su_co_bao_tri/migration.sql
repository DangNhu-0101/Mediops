/*
  Warnings:

  - You are about to drop the column `hinhAnhUrl` on the `su_co_bao_tri` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NguonSuCo" AS ENUM ('NHAP_KHO', 'TRONG_QUA_TRINH_SU_DUNG', 'KIEM_TRA_KHO');

-- AlterTable
ALTER TABLE "su_co_bao_tri" DROP COLUMN "hinhAnhUrl",
ADD COLUMN     "khoId" TEXT,
ADD COLUMN     "ngayBatDauXuLy" TIMESTAMP(3),
ADD COLUMN     "ngayHoanTat" TIMESTAMP(3),
ADD COLUMN     "nguoiBatDauXuLyId" TEXT,
ADD COLUMN     "nguoiHoanTatId" TEXT,
ADD COLUMN     "nguon" "NguonSuCo" NOT NULL DEFAULT 'KIEM_TRA_KHO',
ADD COLUMN     "trangThaiThietBiSauXuLy" "TrangThaiThietBi";

-- CreateTable
CREATE TABLE "anh_su_co_bao_tri" (
    "id" TEXT NOT NULL,
    "suCoBaoTriId" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "publicId" TEXT,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anh_su_co_bao_tri_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anh_su_co_bao_tri_suCoBaoTriId_ngayTao_idx" ON "anh_su_co_bao_tri"("suCoBaoTriId", "ngayTao");

-- CreateIndex
CREATE INDEX "su_co_bao_tri_thietBiId_trangThai_idx" ON "su_co_bao_tri"("thietBiId", "trangThai");

-- CreateIndex
CREATE INDEX "su_co_bao_tri_khoId_trangThai_idx" ON "su_co_bao_tri"("khoId", "trangThai");

-- AddForeignKey
ALTER TABLE "su_co_bao_tri" ADD CONSTRAINT "su_co_bao_tri_khoId_fkey" FOREIGN KEY ("khoId") REFERENCES "kho"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "su_co_bao_tri" ADD CONSTRAINT "su_co_bao_tri_nguoiBatDauXuLyId_fkey" FOREIGN KEY ("nguoiBatDauXuLyId") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "su_co_bao_tri" ADD CONSTRAINT "su_co_bao_tri_nguoiHoanTatId_fkey" FOREIGN KEY ("nguoiHoanTatId") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anh_su_co_bao_tri" ADD CONSTRAINT "anh_su_co_bao_tri_suCoBaoTriId_fkey" FOREIGN KEY ("suCoBaoTriId") REFERENCES "su_co_bao_tri"("id") ON DELETE CASCADE ON UPDATE CASCADE;
