-- CreateEnum
CREATE TYPE "TrangThaiKhaDungNhaCungCap" AS ENUM ('DA_XAC_NHAN', 'CAN_LIEN_HE', 'KHONG_KHA_DUNG');

-- CreateTable
CREATE TABLE "nha_cung_cap_thiet_bi" (
    "id" TEXT NOT NULL,
    "donViId" TEXT NOT NULL,
    "tenNhaCungCap" TEXT NOT NULL,
    "nguoiLienHe" TEXT,
    "email" TEXT,
    "soDienThoai" TEXT,
    "diaChi" TEXT,
    "quanHuyen" TEXT,
    "tinhThanh" TEXT,
    "dangHoatDong" BOOLEAN NOT NULL DEFAULT true,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngayCapNhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nha_cung_cap_thiet_bi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thiet_bi_cho_thue" (
    "id" TEXT NOT NULL,
    "nhaCungCapId" TEXT NOT NULL,
    "danhMucThietBiId" TEXT,
    "tenThietBi" TEXT NOT NULL,
    "model" TEXT,
    "thongSoKyThuat" JSONB,
    "giaThueTheoNgay" DECIMAL(14,2),
    "trangThaiKhaDung" "TrangThaiKhaDungNhaCungCap" NOT NULL DEFAULT 'CAN_LIEN_HE',
    "khaDungTu" TIMESTAMP(3),
    "khaDungDen" TIMESTAMP(3),
    "thoiDiemXacNhan" TIMESTAMP(3),
    "thoiGianDanTruocPhut" INTEGER,
    "ghiChu" TEXT,
    "dangHoatDong" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "thiet_bi_cho_thue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nha_cung_cap_thiet_bi_donViId_tenNhaCungCap_key" ON "nha_cung_cap_thiet_bi"("donViId", "tenNhaCungCap");

-- CreateIndex
CREATE INDEX "nha_cung_cap_thiet_bi_donViId_dangHoatDong_idx" ON "nha_cung_cap_thiet_bi"("donViId", "dangHoatDong");

-- CreateIndex
CREATE INDEX "thiet_bi_cho_thue_nhaCungCapId_dangHoatDong_idx" ON "thiet_bi_cho_thue"("nhaCungCapId", "dangHoatDong");

-- CreateIndex
CREATE INDEX "thiet_bi_cho_thue_danhMucThietBiId_trangThaiKhaDung_idx" ON "thiet_bi_cho_thue"("danhMucThietBiId", "trangThaiKhaDung");

-- AddForeignKey
ALTER TABLE "nha_cung_cap_thiet_bi" ADD CONSTRAINT "nha_cung_cap_thiet_bi_donViId_fkey" FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thiet_bi_cho_thue" ADD CONSTRAINT "thiet_bi_cho_thue_nhaCungCapId_fkey" FOREIGN KEY ("nhaCungCapId") REFERENCES "nha_cung_cap_thiet_bi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thiet_bi_cho_thue" ADD CONSTRAINT "thiet_bi_cho_thue_danhMucThietBiId_fkey" FOREIGN KEY ("danhMucThietBiId") REFERENCES "danh_muc_thiet_bi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
