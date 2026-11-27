-- AlterTable
ALTER TABLE "ca_quay" ADD COLUMN     "daoDienHieuLucTu" TIMESTAMP(3),
ADD COLUMN     "lichSuStudio" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "studioHieuLucTu" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ca_quay_nhan_su" ADD COLUMN     "hieuLucDen" TIMESTAMP(3),
ADD COLUMN     "hieuLucTu" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "phien_quyet_dinh" (
    "id" TEXT NOT NULL,
    "donViId" TEXT NOT NULL,
    "caQuayId" TEXT NOT NULL,
    "suCoId" TEXT NOT NULL,
    "nguoiTaoId" TEXT NOT NULL,
    "hieuLuc" TIMESTAMP(3) NOT NULL,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hetHanLuc" TIMESTAMP(3) NOT NULL,
    "trangThai" TEXT NOT NULL DEFAULT 'MO',
    "ketQua" JSONB NOT NULL,
    "dauVanTay" TEXT NOT NULL,
    "phuongAnDaChot" TEXT,

    CONSTRAINT "phien_quyet_dinh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giu_cho_tai_nguyen" (
    "id" TEXT NOT NULL,
    "phienId" TEXT NOT NULL,
    "donViId" TEXT NOT NULL,
    "loai" "LoaiTaiNguyen" NOT NULL,
    "taiNguyenId" TEXT NOT NULL,
    "batDau" TIMESTAMP(3) NOT NULL,
    "ketThuc" TIMESTAMP(3) NOT NULL,
    "hetHanLuc" TIMESTAMP(3) NOT NULL,
    "trangThai" TEXT NOT NULL DEFAULT 'MO',

    CONSTRAINT "giu_cho_tai_nguyen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loi_moi_thay_ca" (
    "id" TEXT NOT NULL,
    "phienId" TEXT NOT NULL,
    "donViId" TEXT NOT NULL,
    "phuongAnId" TEXT NOT NULL,
    "nguoiNhanId" TEXT NOT NULL,
    "nguoiGuiId" TEXT NOT NULL,
    "nguoiCuId" TEXT NOT NULL,
    "vaiTro" TEXT NOT NULL,
    "noiDung" JSONB NOT NULL,
    "ghiChuBanGiao" TEXT NOT NULL,
    "hetHanLuc" TIMESTAMP(3) NOT NULL,
    "trangThai" TEXT NOT NULL DEFAULT 'CHO_PHAN_HOI',
    "coMatLuc" TIMESTAMP(3),
    "phanHoiLuc" TIMESTAMP(3),

    CONSTRAINT "loi_moi_thay_ca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nhat_ky_loi_moi" (
    "id" TEXT NOT NULL,
    "loiMoiId" TEXT NOT NULL,
    "nguoiThucHienId" TEXT NOT NULL,
    "trangThai" TEXT NOT NULL,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nhat_ky_loi_moi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cau_hinh_thoi_gian_cho" (
    "phanHe" TEXT NOT NULL,
    "soPhut" INTEGER NOT NULL,

    CONSTRAINT "cau_hinh_thoi_gian_cho_pkey" PRIMARY KEY ("phanHe")
);

-- CreateTable
CREATE TABLE "nhat_ky_cau_hinh_cho" (
    "id" TEXT NOT NULL,
    "phanHe" TEXT NOT NULL,
    "giaTriCu" INTEGER NOT NULL,
    "giaTriMoi" INTEGER NOT NULL,
    "nguoiSuaId" TEXT NOT NULL,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nhat_ky_cau_hinh_cho_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phien_quyet_dinh_donViId_caQuayId_trangThai_idx" ON "phien_quyet_dinh"("donViId", "caQuayId", "trangThai");

-- CreateIndex
CREATE INDEX "giu_cho_tai_nguyen_donViId_loai_taiNguyenId_trangThai_hetHa_idx" ON "giu_cho_tai_nguyen"("donViId", "loai", "taiNguyenId", "trangThai", "hetHanLuc");

-- CreateIndex
CREATE UNIQUE INDEX "giu_cho_tai_nguyen_phienId_loai_taiNguyenId_key" ON "giu_cho_tai_nguyen"("phienId", "loai", "taiNguyenId");

-- CreateIndex
CREATE INDEX "loi_moi_thay_ca_donViId_nguoiNhanId_hetHanLuc_idx" ON "loi_moi_thay_ca"("donViId", "nguoiNhanId", "hetHanLuc");

-- CreateIndex
CREATE UNIQUE INDEX "loi_moi_thay_ca_phienId_phuongAnId_nguoiNhanId_key" ON "loi_moi_thay_ca"("phienId", "phuongAnId", "nguoiNhanId");

-- AddForeignKey
ALTER TABLE "phien_quyet_dinh" ADD CONSTRAINT "phien_quyet_dinh_caQuayId_fkey" FOREIGN KEY ("caQuayId") REFERENCES "ca_quay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giu_cho_tai_nguyen" ADD CONSTRAINT "giu_cho_tai_nguyen_phienId_fkey" FOREIGN KEY ("phienId") REFERENCES "phien_quyet_dinh"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loi_moi_thay_ca" ADD CONSTRAINT "loi_moi_thay_ca_phienId_fkey" FOREIGN KEY ("phienId") REFERENCES "phien_quyet_dinh"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_loi_moi" ADD CONSTRAINT "nhat_ky_loi_moi_loiMoiId_fkey" FOREIGN KEY ("loiMoiId") REFERENCES "loi_moi_thay_ca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "phien_quyet_dinh_mot_phien_mo" ON "phien_quyet_dinh" ("caQuayId") WHERE "trangThai" = 'MO';
