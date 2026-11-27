-- AlterTable
ALTER TABLE "nhat_ky_muon_tra" ADD COLUMN     "giaoDichKhoId" TEXT;

-- AlterTable
ALTER TABLE "thiet_bi" ADD COLUMN     "khoId" TEXT;

-- CreateTable
CREATE TABLE "kho" (
    "id" TEXT NOT NULL,
    "donViId" TEXT NOT NULL,
    "maKho" TEXT NOT NULL,
    "tenKho" TEXT NOT NULL,
    "diaChi" TEXT NOT NULL,
    "viDo" DECIMAL(9,6) NOT NULL,
    "kinhDo" DECIMAL(9,6) NOT NULL,
    "banKinhXacMinhMet" INTEGER NOT NULL DEFAULT 100,
    "dangHoatDong" BOOLEAN NOT NULL DEFAULT true,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngayCapNhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giao_dich_kho" (
    "id" TEXT NOT NULL,
    "khoId" TEXT NOT NULL,
    "caQuayId" TEXT NOT NULL,
    "nguoiThucHienId" TEXT NOT NULL,
    "loaiHanhDong" "LoaiHanhDong" NOT NULL,
    "viDoGhiNhan" DECIMAL(9,6) NOT NULL,
    "kinhDoGhiNhan" DECIMAL(9,6) NOT NULL,
    "doChinhXacMet" DECIMAL(8,2) NOT NULL,
    "khoangCachDenKhoMet" DECIMAL(10,2) NOT NULL,
    "viTriDat" BOOLEAN NOT NULL,
    "thoiDiemGhiNhan" TIMESTAMP(3) NOT NULL,
    "thoiGian" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giao_dich_kho_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kho_donViId_dangHoatDong_idx" ON "kho"("donViId", "dangHoatDong");

-- CreateIndex
CREATE UNIQUE INDEX "kho_donViId_maKho_key" ON "kho"("donViId", "maKho");

-- CreateIndex
CREATE INDEX "giao_dich_kho_khoId_thoiGian_idx" ON "giao_dich_kho"("khoId", "thoiGian");

-- CreateIndex
CREATE INDEX "giao_dich_kho_caQuayId_thoiGian_idx" ON "giao_dich_kho"("caQuayId", "thoiGian");

-- CreateIndex
CREATE INDEX "nhat_ky_muon_tra_giaoDichKhoId_idx" ON "nhat_ky_muon_tra"("giaoDichKhoId");

-- CreateIndex
CREATE INDEX "thiet_bi_khoId_trangThai_idx" ON "thiet_bi"("khoId", "trangThai");

-- AddForeignKey
ALTER TABLE "kho" ADD CONSTRAINT "kho_donViId_fkey" FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thiet_bi" ADD CONSTRAINT "thiet_bi_khoId_fkey" FOREIGN KEY ("khoId") REFERENCES "kho"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_muon_tra" ADD CONSTRAINT "nhat_ky_muon_tra_giaoDichKhoId_fkey" FOREIGN KEY ("giaoDichKhoId") REFERENCES "giao_dich_kho"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_dich_kho" ADD CONSTRAINT "giao_dich_kho_khoId_fkey" FOREIGN KEY ("khoId") REFERENCES "kho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_dich_kho" ADD CONSTRAINT "giao_dich_kho_caQuayId_fkey" FOREIGN KEY ("caQuayId") REFERENCES "ca_quay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giao_dich_kho" ADD CONSTRAINT "giao_dich_kho_nguoiThucHienId_fkey" FOREIGN KEY ("nguoiThucHienId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
