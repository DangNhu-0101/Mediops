-- Đưa ảnh đơn cũ vào quan hệ ảnh nhiều bản ghi trước khi bỏ bảng chuyển tiếp.
INSERT INTO "anh_su_co_bao_tri" ("id", "suCoBaoTriId", "secureUrl", "ngayTao")
SELECT 'legacy-' || "suCoBaoTriId", "suCoBaoTriId", "secureUrl", CURRENT_TIMESTAMP
FROM "anh_su_co_cu_chuyen_tiep"
ON CONFLICT ("id") DO NOTHING;

DROP TABLE "anh_su_co_cu_chuyen_tiep";

-- Mỗi lần ghi nhận kết quả xử lý được lưu riêng, không ghi đè lịch sử.
CREATE TABLE "nhat_ky_xu_ly_su_co" (
    "id" TEXT NOT NULL,
    "suCoBaoTriId" TEXT NOT NULL,
    "nguoiThucHienId" TEXT NOT NULL,
    "ghiChu" TEXT NOT NULL,
    "trangThaiThietBi" "TrangThaiThietBi" NOT NULL,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nhat_ky_xu_ly_su_co_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "nhat_ky_xu_ly_su_co_suCoBaoTriId_ngayTao_idx"
ON "nhat_ky_xu_ly_su_co"("suCoBaoTriId", "ngayTao");

ALTER TABLE "nhat_ky_xu_ly_su_co"
ADD CONSTRAINT "nhat_ky_xu_ly_su_co_suCoBaoTriId_fkey"
FOREIGN KEY ("suCoBaoTriId") REFERENCES "su_co_bao_tri"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "nhat_ky_xu_ly_su_co"
ADD CONSTRAINT "nhat_ky_xu_ly_su_co_nguoiThucHienId_fkey"
FOREIGN KEY ("nguoiThucHienId") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
