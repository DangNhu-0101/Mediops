-- CreateEnum
CREATE TYPE "VaiTro" AS ENUM ('QUAN_LY', 'DAO_DIEN', 'KY_THUAT_VIEN', 'NHAN_SU_EKIP');

-- CreateEnum
CREATE TYPE "TrangThaiDuAn" AS ENUM ('DANG_CHUAN_BI', 'DANG_SAN_XUAT', 'HOAN_THANH', 'DA_HUY');

-- CreateEnum
CREATE TYPE "TrangThaiStudio" AS ENUM ('SAN_SANG', 'BAO_TRI', 'DONG_CUA');

-- CreateEnum
CREATE TYPE "TrangThaiThietBi" AS ENUM ('SAN_SANG', 'DANG_SU_DUNG', 'BAO_TRI', 'HU_HONG');

-- CreateEnum
CREATE TYPE "TrangThaiCaQuay" AS ENUM ('DU_THAO', 'DA_DUYET', 'DANG_DIEN_RA', 'HOAN_THANH', 'DA_HUY');

-- CreateEnum
CREATE TYPE "TrangThaiMuonTra" AS ENUM ('CHO_XUAT_KHO', 'DA_XUAT_KHO', 'DA_NHAP_KHO', 'THAT_LAC');

-- CreateEnum
CREATE TYPE "MucDoSuCo" AS ENUM ('NHE', 'TRUNG_BINH', 'NGHIEM_TRONG');

-- CreateEnum
CREATE TYPE "TrangThaiSuCo" AS ENUM ('CHO_XU_LY', 'DANG_SUA_CHUA', 'DA_KHAC_PHUC');

-- CreateEnum
CREATE TYPE "LoaiHanhDong" AS ENUM ('XUAT_KHO', 'NHAP_KHO', 'CAP_NHAT_TRANG_THAI');

-- CreateEnum
CREATE TYPE "PhuongThucQuet" AS ENUM ('QUET_QR_CAMERA', 'NHAP_TAY');

-- CreateTable
CREATE TABLE "nguoi_dung" (
    "id" TEXT NOT NULL,
    "tenDangNhap" TEXT NOT NULL,
    "matKhauHash" TEXT NOT NULL,
    "hoTen" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "soDienThoai" TEXT,
    "vaiTro" "VaiTro" NOT NULL DEFAULT 'KY_THUAT_VIEN',
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nguoi_dung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "du_an" (
    "id" TEXT NOT NULL,
    "tenDuAn" TEXT NOT NULL,
    "tenKhachHang" TEXT,
    "moTa" TEXT,
    "trangThai" "TrangThaiDuAn" NOT NULL DEFAULT 'DANG_CHUAN_BI',
    "nguoiTaoId" TEXT NOT NULL,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "du_an_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phong_studio" (
    "id" TEXT NOT NULL,
    "tenPhong" TEXT NOT NULL,
    "diaDiem" TEXT,
    "trangThai" "TrangThaiStudio" NOT NULL DEFAULT 'SAN_SANG',

    CONSTRAINT "phong_studio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "danh_muc_thiet_bi" (
    "id" TEXT NOT NULL,
    "tenDanhMuc" TEXT NOT NULL,
    "moTa" TEXT,

    CONSTRAINT "danh_muc_thiet_bi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thiet_bi" (
    "id" TEXT NOT NULL,
    "maQR" TEXT NOT NULL,
    "soSeri" TEXT NOT NULL,
    "tenThietBi" TEXT NOT NULL,
    "danhMucId" TEXT NOT NULL,
    "thongSoKyThuat" JSONB NOT NULL,
    "trangThai" "TrangThaiThietBi" NOT NULL DEFAULT 'SAN_SANG',
    "hinhAnhUrl" TEXT,
    "viTriKho" TEXT,

    CONSTRAINT "thiet_bi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ca_quay" (
    "id" TEXT NOT NULL,
    "duAnId" TEXT NOT NULL,
    "tieuDe" TEXT NOT NULL,
    "thoiGianBatDau" TIMESTAMP(3) NOT NULL,
    "thoiGianKetThuc" TIMESTAMP(3) NOT NULL,
    "phongStudioId" TEXT,
    "ghiChuDiaDiem" TEXT,
    "daoDienId" TEXT NOT NULL,
    "trangThai" "TrangThaiCaQuay" NOT NULL DEFAULT 'DU_THAO',
    "ghiChu" TEXT,

    CONSTRAINT "ca_quay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ca_quay_thiet_bi" (
    "id" TEXT NOT NULL,
    "caQuayId" TEXT NOT NULL,
    "thietBiId" TEXT NOT NULL,
    "trangThaiMuonTra" "TrangThaiMuonTra" NOT NULL DEFAULT 'CHO_XUAT_KHO',
    "thoiGianXuatKho" TIMESTAMP(3),
    "thoiGianNhapKho" TIMESTAMP(3),

    CONSTRAINT "ca_quay_thiet_bi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ca_quay_nhan_su" (
    "id" TEXT NOT NULL,
    "caQuayId" TEXT NOT NULL,
    "nguoiDungId" TEXT NOT NULL,
    "vaiTroPhanCong" TEXT NOT NULL,

    CONSTRAINT "ca_quay_nhan_su_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "su_co_bao_tri" (
    "id" TEXT NOT NULL,
    "thietBiId" TEXT NOT NULL,
    "caQuayId" TEXT,
    "nguoiBaoCaoId" TEXT NOT NULL,
    "mucDo" "MucDoSuCo" NOT NULL DEFAULT 'TRUNG_BINH',
    "moTaLoi" TEXT NOT NULL,
    "hinhAnhUrl" TEXT,
    "trangThai" "TrangThaiSuCo" NOT NULL DEFAULT 'CHO_XU_LY',
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "su_co_bao_tri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nhat_ky_muon_tra" (
    "id" TEXT NOT NULL,
    "thietBiId" TEXT NOT NULL,
    "caQuayId" TEXT NOT NULL,
    "nguoiThucHienId" TEXT NOT NULL,
    "loaiHanhDong" "LoaiHanhDong" NOT NULL,
    "phuongThuc" "PhuongThucQuet" NOT NULL DEFAULT 'QUET_QR_CAMERA',
    "ghiChuTinhTrang" TEXT,
    "thoiGian" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nhat_ky_muon_tra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_tenDangNhap_key" ON "nguoi_dung"("tenDangNhap");

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_email_key" ON "nguoi_dung"("email");

-- CreateIndex
CREATE INDEX "du_an_trangThai_idx" ON "du_an"("trangThai");

-- CreateIndex
CREATE UNIQUE INDEX "danh_muc_thiet_bi_tenDanhMuc_key" ON "danh_muc_thiet_bi"("tenDanhMuc");

-- CreateIndex
CREATE UNIQUE INDEX "thiet_bi_maQR_key" ON "thiet_bi"("maQR");

-- CreateIndex
CREATE UNIQUE INDEX "thiet_bi_soSeri_key" ON "thiet_bi"("soSeri");

-- CreateIndex
CREATE INDEX "thiet_bi_danhMucId_trangThai_idx" ON "thiet_bi"("danhMucId", "trangThai");

-- CreateIndex
CREATE INDEX "ca_quay_thoiGianBatDau_thoiGianKetThuc_idx" ON "ca_quay"("thoiGianBatDau", "thoiGianKetThuc");

-- CreateIndex
CREATE INDEX "ca_quay_phongStudioId_trangThai_idx" ON "ca_quay"("phongStudioId", "trangThai");

-- CreateIndex
CREATE INDEX "ca_quay_thiet_bi_thietBiId_idx" ON "ca_quay_thiet_bi"("thietBiId");

-- CreateIndex
CREATE UNIQUE INDEX "ca_quay_thiet_bi_caQuayId_thietBiId_key" ON "ca_quay_thiet_bi"("caQuayId", "thietBiId");

-- CreateIndex
CREATE INDEX "ca_quay_nhan_su_nguoiDungId_idx" ON "ca_quay_nhan_su"("nguoiDungId");

-- CreateIndex
CREATE UNIQUE INDEX "ca_quay_nhan_su_caQuayId_nguoiDungId_key" ON "ca_quay_nhan_su"("caQuayId", "nguoiDungId");

-- CreateIndex
CREATE INDEX "su_co_bao_tri_trangThai_ngayTao_idx" ON "su_co_bao_tri"("trangThai", "ngayTao");

-- CreateIndex
CREATE INDEX "nhat_ky_muon_tra_thoiGian_idx" ON "nhat_ky_muon_tra"("thoiGian");

-- AddForeignKey
ALTER TABLE "du_an" ADD CONSTRAINT "du_an_nguoiTaoId_fkey" FOREIGN KEY ("nguoiTaoId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thiet_bi" ADD CONSTRAINT "thiet_bi_danhMucId_fkey" FOREIGN KEY ("danhMucId") REFERENCES "danh_muc_thiet_bi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ca_quay" ADD CONSTRAINT "ca_quay_duAnId_fkey" FOREIGN KEY ("duAnId") REFERENCES "du_an"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ca_quay" ADD CONSTRAINT "ca_quay_phongStudioId_fkey" FOREIGN KEY ("phongStudioId") REFERENCES "phong_studio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ca_quay" ADD CONSTRAINT "ca_quay_daoDienId_fkey" FOREIGN KEY ("daoDienId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ca_quay_thiet_bi" ADD CONSTRAINT "ca_quay_thiet_bi_caQuayId_fkey" FOREIGN KEY ("caQuayId") REFERENCES "ca_quay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ca_quay_thiet_bi" ADD CONSTRAINT "ca_quay_thiet_bi_thietBiId_fkey" FOREIGN KEY ("thietBiId") REFERENCES "thiet_bi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ca_quay_nhan_su" ADD CONSTRAINT "ca_quay_nhan_su_caQuayId_fkey" FOREIGN KEY ("caQuayId") REFERENCES "ca_quay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ca_quay_nhan_su" ADD CONSTRAINT "ca_quay_nhan_su_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "su_co_bao_tri" ADD CONSTRAINT "su_co_bao_tri_thietBiId_fkey" FOREIGN KEY ("thietBiId") REFERENCES "thiet_bi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "su_co_bao_tri" ADD CONSTRAINT "su_co_bao_tri_caQuayId_fkey" FOREIGN KEY ("caQuayId") REFERENCES "ca_quay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "su_co_bao_tri" ADD CONSTRAINT "su_co_bao_tri_nguoiBaoCaoId_fkey" FOREIGN KEY ("nguoiBaoCaoId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_muon_tra" ADD CONSTRAINT "nhat_ky_muon_tra_thietBiId_fkey" FOREIGN KEY ("thietBiId") REFERENCES "thiet_bi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_muon_tra" ADD CONSTRAINT "nhat_ky_muon_tra_caQuayId_fkey" FOREIGN KEY ("caQuayId") REFERENCES "ca_quay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_muon_tra" ADD CONSTRAINT "nhat_ky_muon_tra_nguoiThucHienId_fkey" FOREIGN KEY ("nguoiThucHienId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
