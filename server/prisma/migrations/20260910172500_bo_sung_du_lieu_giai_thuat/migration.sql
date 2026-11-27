-- CreateEnum
CREATE TYPE "LoaiTaiNguyen" AS ENUM ('THIET_BI', 'NHAN_SU', 'STUDIO');

-- CreateEnum
CREATE TYPE "LoaiTuongThich" AS ENUM ('TUONG_THICH', 'KHONG_TUONG_THICH', 'CAN_THIET_BI_TRUNG_GIAN');

-- AlterTable
ALTER TABLE "ca_quay" ADD COLUMN     "coTheDoiLich" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maCaQuay" TEXT,
ADD COLUMN     "mucDoUuTien" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "thoiGianBatDauSomNhat" TIMESTAMP(3),
ADD COLUMN     "thoiGianChuanBiPhut" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "thoiGianKetThucMuonNhat" TIMESTAMP(3),
ADD COLUMN     "thoiGianThuHoiPhut" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ca_quay_thiet_bi" ADD COLUMN     "ghiChu" TEXT;

-- AlterTable
ALTER TABLE "danh_muc_thiet_bi" ADD COLUMN     "maDanhMuc" TEXT;

-- AlterTable
ALTER TABLE "du_an" ADD COLUMN     "hanChot" TIMESTAMP(3),
ADD COLUMN     "maDuAn" TEXT;

-- AlterTable
ALTER TABLE "phong_studio" ADD COLUMN     "khaNang" JSONB,
ADD COLUMN     "maPhong" TEXT,
ADD COLUMN     "sucChua" INTEGER;

-- AlterTable
ALTER TABLE "su_co_bao_tri" ADD COLUMN     "phuongAnXuLy" TEXT;

-- AlterTable
ALTER TABLE "thiet_bi" ADD COLUMN     "thoiGianKiemTraSauSuDungPhut" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "yeu_cau_tai_nguyen" (
    "id" TEXT NOT NULL,
    "caQuayId" TEXT NOT NULL,
    "maYeuCau" TEXT NOT NULL,
    "loaiTaiNguyen" "LoaiTaiNguyen" NOT NULL,
    "soLuong" INTEGER NOT NULL DEFAULT 1,
    "batBuoc" BOOLEAN NOT NULL DEFAULT true,
    "choPhepThayThe" BOOLEAN NOT NULL DEFAULT true,
    "trongSo" INTEGER NOT NULL DEFAULT 50,
    "danhMucThietBiId" TEXT,
    "thietBiUuTienId" TEXT,
    "maKyNang" TEXT,
    "thongSoToiThieu" JSONB,
    "thongSoUuTien" JSONB,

    CONSTRAINT "yeu_cau_tai_nguyen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quan_he_thay_the" (
    "id" TEXT NOT NULL,
    "thietBiGocId" TEXT NOT NULL,
    "thietBiThayTheId" TEXT NOT NULL,
    "diemPhuHop" INTEGER NOT NULL,
    "lyDo" TEXT,

    CONSTRAINT "quan_he_thay_the_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quan_he_tuong_thich" (
    "id" TEXT NOT NULL,
    "thietBiBenTraiId" TEXT NOT NULL,
    "thietBiBenPhaiId" TEXT NOT NULL,
    "loaiTuongThich" "LoaiTuongThich" NOT NULL,
    "thietBiTrungGianId" TEXT,
    "ghiChu" TEXT,

    CONSTRAINT "quan_he_tuong_thich_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ky_nang" (
    "maKyNang" TEXT NOT NULL,
    "tenKyNang" TEXT NOT NULL,

    CONSTRAINT "ky_nang_pkey" PRIMARY KEY ("maKyNang")
);

-- CreateTable
CREATE TABLE "ky_nang_nhan_su" (
    "nguoiDungId" TEXT NOT NULL,
    "maKyNang" TEXT NOT NULL,
    "trinhDo" INTEGER NOT NULL,

    CONSTRAINT "ky_nang_nhan_su_pkey" PRIMARY KEY ("nguoiDungId","maKyNang")
);

-- CreateTable
CREATE TABLE "thiet_bi_khong_kha_dung" (
    "id" TEXT NOT NULL,
    "thietBiId" TEXT NOT NULL,
    "batDau" TIMESTAMP(3) NOT NULL,
    "ketThuc" TIMESTAMP(3) NOT NULL,
    "lyDo" TEXT,

    CONSTRAINT "thiet_bi_khong_kha_dung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nhan_su_khong_kha_dung" (
    "id" TEXT NOT NULL,
    "nguoiDungId" TEXT NOT NULL,
    "batDau" TIMESTAMP(3) NOT NULL,
    "ketThuc" TIMESTAMP(3) NOT NULL,
    "lyDo" TEXT,

    CONSTRAINT "nhan_su_khong_kha_dung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_khong_kha_dung" (
    "id" TEXT NOT NULL,
    "phongStudioId" TEXT NOT NULL,
    "batDau" TIMESTAMP(3) NOT NULL,
    "ketThuc" TIMESTAMP(3) NOT NULL,
    "lyDo" TEXT,

    CONSTRAINT "studio_khong_kha_dung_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "yeu_cau_tai_nguyen_loaiTaiNguyen_danhMucThietBiId_idx" ON "yeu_cau_tai_nguyen"("loaiTaiNguyen", "danhMucThietBiId");

-- CreateIndex
CREATE UNIQUE INDEX "yeu_cau_tai_nguyen_caQuayId_maYeuCau_key" ON "yeu_cau_tai_nguyen"("caQuayId", "maYeuCau");

-- CreateIndex
CREATE UNIQUE INDEX "quan_he_thay_the_thietBiGocId_thietBiThayTheId_key" ON "quan_he_thay_the"("thietBiGocId", "thietBiThayTheId");

-- CreateIndex
CREATE UNIQUE INDEX "quan_he_tuong_thich_thietBiBenTraiId_thietBiBenPhaiId_key" ON "quan_he_tuong_thich"("thietBiBenTraiId", "thietBiBenPhaiId");

-- CreateIndex
CREATE INDEX "thiet_bi_khong_kha_dung_thietBiId_batDau_ketThuc_idx" ON "thiet_bi_khong_kha_dung"("thietBiId", "batDau", "ketThuc");

-- CreateIndex
CREATE INDEX "nhan_su_khong_kha_dung_nguoiDungId_batDau_ketThuc_idx" ON "nhan_su_khong_kha_dung"("nguoiDungId", "batDau", "ketThuc");

-- CreateIndex
CREATE INDEX "studio_khong_kha_dung_phongStudioId_batDau_ketThuc_idx" ON "studio_khong_kha_dung"("phongStudioId", "batDau", "ketThuc");

-- CreateIndex
CREATE UNIQUE INDEX "ca_quay_maCaQuay_key" ON "ca_quay"("maCaQuay");

-- CreateIndex
CREATE UNIQUE INDEX "danh_muc_thiet_bi_maDanhMuc_key" ON "danh_muc_thiet_bi"("maDanhMuc");

-- CreateIndex
CREATE UNIQUE INDEX "du_an_maDuAn_key" ON "du_an"("maDuAn");

-- CreateIndex
CREATE UNIQUE INDEX "phong_studio_maPhong_key" ON "phong_studio"("maPhong");

-- AddForeignKey
ALTER TABLE "yeu_cau_tai_nguyen" ADD CONSTRAINT "yeu_cau_tai_nguyen_caQuayId_fkey" FOREIGN KEY ("caQuayId") REFERENCES "ca_quay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yeu_cau_tai_nguyen" ADD CONSTRAINT "yeu_cau_tai_nguyen_danhMucThietBiId_fkey" FOREIGN KEY ("danhMucThietBiId") REFERENCES "danh_muc_thiet_bi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yeu_cau_tai_nguyen" ADD CONSTRAINT "yeu_cau_tai_nguyen_thietBiUuTienId_fkey" FOREIGN KEY ("thietBiUuTienId") REFERENCES "thiet_bi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quan_he_thay_the" ADD CONSTRAINT "quan_he_thay_the_thietBiGocId_fkey" FOREIGN KEY ("thietBiGocId") REFERENCES "thiet_bi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quan_he_thay_the" ADD CONSTRAINT "quan_he_thay_the_thietBiThayTheId_fkey" FOREIGN KEY ("thietBiThayTheId") REFERENCES "thiet_bi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quan_he_tuong_thich" ADD CONSTRAINT "quan_he_tuong_thich_thietBiBenTraiId_fkey" FOREIGN KEY ("thietBiBenTraiId") REFERENCES "thiet_bi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quan_he_tuong_thich" ADD CONSTRAINT "quan_he_tuong_thich_thietBiBenPhaiId_fkey" FOREIGN KEY ("thietBiBenPhaiId") REFERENCES "thiet_bi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quan_he_tuong_thich" ADD CONSTRAINT "quan_he_tuong_thich_thietBiTrungGianId_fkey" FOREIGN KEY ("thietBiTrungGianId") REFERENCES "thiet_bi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ky_nang_nhan_su" ADD CONSTRAINT "ky_nang_nhan_su_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ky_nang_nhan_su" ADD CONSTRAINT "ky_nang_nhan_su_maKyNang_fkey" FOREIGN KEY ("maKyNang") REFERENCES "ky_nang"("maKyNang") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thiet_bi_khong_kha_dung" ADD CONSTRAINT "thiet_bi_khong_kha_dung_thietBiId_fkey" FOREIGN KEY ("thietBiId") REFERENCES "thiet_bi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhan_su_khong_kha_dung" ADD CONSTRAINT "nhan_su_khong_kha_dung_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_khong_kha_dung" ADD CONSTRAINT "studio_khong_kha_dung_phongStudioId_fkey" FOREIGN KEY ("phongStudioId") REFERENCES "phong_studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
