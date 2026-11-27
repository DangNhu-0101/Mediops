-- CreateEnum
CREATE TYPE "TrangThaiSuCoVanHanh" AS ENUM ('MOI_BAO', 'DA_XAC_MINH', 'DANG_XU_LY', 'DA_KHOI_PHUC', 'DA_HUY');

-- AlterTable
ALTER TABLE "ca_quay_thiet_bi" ADD COLUMN     "hieuLucDen" TIMESTAMP(3),
ADD COLUMN     "hieuLucTu" TIMESTAMP(3),
ADD COLUMN     "loThayTheId" TEXT;

-- AlterTable
ALTER TABLE "su_co_bao_tri" ADD COLUMN     "suCoVanHanhId" TEXT;

-- CreateTable
CREATE TABLE "su_co_van_hanh" (
    "danhSachAnh" JSONB NOT NULL DEFAULT '[]',
    "id" TEXT NOT NULL,
    "donViId" TEXT NOT NULL,
    "caQuayId" TEXT,
    "thietBiId" TEXT,
    "nguoiBaoCaoId" TEXT NOT NULL,
    "maYeuCau" TEXT NOT NULL,
    "nhom" TEXT NOT NULL,
    "nguyenNhan" TEXT NOT NULL,
    "mucAnhHuong" TEXT NOT NULL,
    "moTa" TEXT NOT NULL,
    "taiNguyen" JSONB NOT NULL DEFAULT '[]',
    "thoiDiemXayRa" TIMESTAMP(3) NOT NULL,
    "duKienPhucHoi" TIMESTAMP(3),
    "ketThucAnhHuong" TIMESTAMP(3),
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trangThai" "TrangThaiSuCoVanHanh" NOT NULL DEFAULT 'MOI_BAO',

    CONSTRAINT "su_co_van_hanh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nhat_ky_su_co_van_hanh" (
    "id" TEXT NOT NULL,
    "suCoId" TEXT NOT NULL,
    "nguoiThucHienId" TEXT NOT NULL,
    "noiDung" TEXT NOT NULL,
    "thayDoi" JSONB NOT NULL DEFAULT '{}',
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nhat_ky_su_co_van_hanh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lo_thay_the_thiet_bi" (
    "id" TEXT NOT NULL,
    "suCoId" TEXT NOT NULL,
    "nguoiPhuTrachId" TEXT NOT NULL,
    "thoiDiemHieuLuc" TIMESTAMP(3) NOT NULL,
    "thoiDiemBanGiao" TIMESTAMP(3),

    CONSTRAINT "lo_thay_the_thiet_bi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "su_co_van_hanh_donViId_trangThai_thoiDiemXayRa_idx" ON "su_co_van_hanh"("donViId", "trangThai", "thoiDiemXayRa");

-- CreateIndex
CREATE INDEX "su_co_van_hanh_caQuayId_ngayTao_idx" ON "su_co_van_hanh"("caQuayId", "ngayTao");

-- CreateIndex
CREATE UNIQUE INDEX "su_co_van_hanh_donViId_nguoiBaoCaoId_maYeuCau_key" ON "su_co_van_hanh"("donViId", "nguoiBaoCaoId", "maYeuCau");

-- CreateIndex
CREATE INDEX "nhat_ky_su_co_van_hanh_suCoId_ngayTao_idx" ON "nhat_ky_su_co_van_hanh"("suCoId", "ngayTao");

-- CreateIndex
CREATE INDEX "lo_thay_the_thiet_bi_suCoId_idx" ON "lo_thay_the_thiet_bi"("suCoId");

-- AddForeignKey
ALTER TABLE "ca_quay_thiet_bi" ADD CONSTRAINT "ca_quay_thiet_bi_loThayTheId_fkey" FOREIGN KEY ("loThayTheId") REFERENCES "lo_thay_the_thiet_bi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "su_co_bao_tri" ADD CONSTRAINT "su_co_bao_tri_suCoVanHanhId_fkey" FOREIGN KEY ("suCoVanHanhId") REFERENCES "su_co_van_hanh"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "su_co_van_hanh" ADD CONSTRAINT "su_co_van_hanh_caQuayId_fkey" FOREIGN KEY ("caQuayId") REFERENCES "ca_quay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_su_co_van_hanh" ADD CONSTRAINT "nhat_ky_su_co_van_hanh_suCoId_fkey" FOREIGN KEY ("suCoId") REFERENCES "su_co_van_hanh"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lo_thay_the_thiet_bi" ADD CONSTRAINT "lo_thay_the_thiet_bi_suCoId_fkey" FOREIGN KEY ("suCoId") REFERENCES "su_co_van_hanh"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
