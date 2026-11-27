-- Tách quyền quản trị khỏi chức vụ; giữ quyền quản lý đơn vị đang có.
ALTER TABLE "don_vi" ADD COLUMN "quyenChucVu" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "nguoi_dung" ADD COLUMN "quanTriDonVi" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "phienBanToken" INTEGER NOT NULL DEFAULT 0;
UPDATE "nguoi_dung" SET "quanTriDonVi" = true
WHERE "vaiTro" = 'QUAN_LY' AND "donViId" IS NOT NULL;
