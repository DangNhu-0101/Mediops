ALTER TYPE "VaiTro" ADD VALUE IF NOT EXISTS 'QUAN_TRI_HE_THONG';

CREATE TABLE "don_vi" (
    "id" TEXT NOT NULL,
    "maDonVi" TEXT NOT NULL,
    "tenDonVi" TEXT NOT NULL,
    "email" TEXT,
    "soDienThoai" TEXT,
    "diaChi" TEXT,
    "dangHoatDong" BOOLEAN NOT NULL DEFAULT true,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngayCapNhat" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "don_vi_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "don_vi_maDonVi_key" ON "don_vi"("maDonVi");
CREATE INDEX "don_vi_dangHoatDong_idx" ON "don_vi"("dangHoatDong");

INSERT INTO "don_vi" (
    "id",
    "maDonVi",
    "tenDonVi",
    "dangHoatDong",
    "ngayCapNhat"
) VALUES (
    '00000000-0000-4000-8000-000000000001',
    'DON-VI-HIEN-TAI',
    'Đơn vị hiện tại',
    true,
    CURRENT_TIMESTAMP
);

ALTER TABLE "nguoi_dung" ADD COLUMN "donViId" TEXT;
ALTER TABLE "du_an" ADD COLUMN "donViId" TEXT;
ALTER TABLE "phong_studio" ADD COLUMN "donViId" TEXT;
ALTER TABLE "danh_muc_thiet_bi" ADD COLUMN "donViId" TEXT;

UPDATE "nguoi_dung"
SET "donViId" = '00000000-0000-4000-8000-000000000001';

UPDATE "du_an"
SET "donViId" = '00000000-0000-4000-8000-000000000001';

UPDATE "phong_studio"
SET "donViId" = '00000000-0000-4000-8000-000000000001';

UPDATE "danh_muc_thiet_bi"
SET "donViId" = '00000000-0000-4000-8000-000000000001';

ALTER TABLE "du_an" ALTER COLUMN "donViId" SET NOT NULL;
ALTER TABLE "phong_studio" ALTER COLUMN "donViId" SET NOT NULL;
ALTER TABLE "danh_muc_thiet_bi" ALTER COLUMN "donViId" SET NOT NULL;

DROP INDEX "du_an_maDuAn_key";
DROP INDEX "phong_studio_maPhong_key";
DROP INDEX "danh_muc_thiet_bi_maDanhMuc_key";
DROP INDEX "danh_muc_thiet_bi_tenDanhMuc_key";

CREATE UNIQUE INDEX "du_an_donViId_maDuAn_key" ON "du_an"("donViId", "maDuAn");
CREATE INDEX "du_an_donViId_trangThai_idx" ON "du_an"("donViId", "trangThai");
DROP INDEX "du_an_trangThai_idx";

CREATE UNIQUE INDEX "phong_studio_donViId_maPhong_key" ON "phong_studio"("donViId", "maPhong");
CREATE INDEX "phong_studio_donViId_trangThai_idx" ON "phong_studio"("donViId", "trangThai");

CREATE UNIQUE INDEX "danh_muc_thiet_bi_donViId_maDanhMuc_key" ON "danh_muc_thiet_bi"("donViId", "maDanhMuc");
CREATE UNIQUE INDEX "danh_muc_thiet_bi_donViId_tenDanhMuc_key" ON "danh_muc_thiet_bi"("donViId", "tenDanhMuc");
CREATE INDEX "nguoi_dung_donViId_vaiTro_idx" ON "nguoi_dung"("donViId", "vaiTro");

ALTER TABLE "nguoi_dung"
ADD CONSTRAINT "nguoi_dung_donViId_fkey"
FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "du_an"
ADD CONSTRAINT "du_an_donViId_fkey"
FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "phong_studio"
ADD CONSTRAINT "phong_studio_donViId_fkey"
FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "danh_muc_thiet_bi"
ADD CONSTRAINT "danh_muc_thiet_bi_donViId_fkey"
FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
