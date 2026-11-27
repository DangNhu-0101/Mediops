-- Cài đặt cấp hệ thống: tên website, logo và thông tin hỗ trợ.
CREATE TABLE "cau_hinh_he_thong" (
    "id" TEXT NOT NULL DEFAULT 'MAC_DINH',
    "tenHeThong" TEXT NOT NULL DEFAULT 'MEDIOPS',
    "khauHieu" TEXT,
    "emailHoTro" TEXT,
    "soDienThoaiHoTro" TEXT,
    "logoUrl" TEXT,
    "logoPublicId" TEXT,
    "ngayCapNhat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cau_hinh_he_thong_pkey" PRIMARY KEY ("id")
);
