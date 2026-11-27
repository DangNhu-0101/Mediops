-- Thay enum vai trò bằng Nhóm quyền (cấp quyền) và Chức danh (phân công ca) theo từng đơn vị.
-- Dữ liệu được chuyển sao cho mỗi người dùng giữ đúng bộ quyền hiệu lực như trước.

-- 1. Bảng mới và cột mới.
CREATE TABLE "nhom_quyen" (
    "id" TEXT NOT NULL,
    "donViId" TEXT NOT NULL,
    "maNhom" TEXT NOT NULL,
    "tenNhom" TEXT NOT NULL,
    "moTa" TEXT,
    "quyen" JSONB NOT NULL DEFAULT '[]',
    "laMau" BOOLEAN NOT NULL DEFAULT false,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngayCapNhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nhom_quyen_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chuc_danh" (
    "id" TEXT NOT NULL,
    "donViId" TEXT NOT NULL,
    "maChucDanh" TEXT NOT NULL,
    "tenChucDanh" TEXT NOT NULL,
    "dangSuDung" BOOLEAN NOT NULL DEFAULT true,
    "ngayTao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngayCapNhat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chuc_danh_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "nhom_quyen_donViId_maNhom_key" ON "nhom_quyen"("donViId", "maNhom");
CREATE UNIQUE INDEX "nhom_quyen_donViId_tenNhom_key" ON "nhom_quyen"("donViId", "tenNhom");
CREATE UNIQUE INDEX "chuc_danh_donViId_maChucDanh_key" ON "chuc_danh"("donViId", "maChucDanh");
CREATE UNIQUE INDEX "chuc_danh_donViId_tenChucDanh_key" ON "chuc_danh"("donViId", "tenChucDanh");

ALTER TABLE "nhom_quyen" ADD CONSTRAINT "nhom_quyen_donViId_fkey" FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chuc_danh" ADD CONSTRAINT "chuc_danh_donViId_fkey" FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nguoi_dung"
ADD COLUMN "laQuanTriHeThong" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "nhomQuyenId" TEXT,
ADD COLUMN "chucDanhId" TEXT;

-- 2. Nhóm quyền mẫu cho từng đơn vị, lấy từ cấu hình chức vụ đã lưu
--    hoặc bộ quyền mặc định đang áp dụng khi chức vụ chưa được lưu.
CREATE TEMP TABLE "tam_quyen_mac_dinh" ("vaiTro" TEXT PRIMARY KEY, "quyen" JSONB NOT NULL);
INSERT INTO "tam_quyen_mac_dinh" ("vaiTro", "quyen") VALUES
  ('QUAN_LY', '["KyNang.Xem","KyNang.Tao","KyNang.Sua","KyNang.Xoa","NhanSu.Xem","NhanSu.Tao","NhanSu.Sua","NhanSu.Xoa","NhanSu.DatLaiMatKhau","DuAn.Xem","DuAn.Tao","DuAn.Sua","DuAn.Xoa","CaQuay.Xem","CaQuay.Tao","CaQuay.Sua","CaQuay.Xoa","CaQuay.PhanCong","ThietBi.Xem","ThietBi.Tao","ThietBi.Sua","ThietBi.Xoa","Studio.Xem","Studio.Tao","Studio.Sua","Studio.Xoa","Kho.Xem","Kho.Tao","Kho.Sua","Kho.Xoa","SuCo.Xem","SuCo.Tao","SuCo.Sua","NhatKy.Xem","BangDieuKhien.Xem","VanHanhKho.QuanLy","VanHanhKho.ToanDonVi"]'),
  ('KY_THUAT_VIEN', '["BangDieuKhien.Xem","CaQuay.Xem","ThietBi.Xem","ThietBi.Tao","ThietBi.Sua","Kho.Xem","Kho.Tao","Kho.Sua","Studio.Xem","SuCo.Xem","SuCo.Tao","SuCo.Sua","NhatKy.Xem","VanHanhKho.QuanLy","VanHanhKho.ToanDonVi"]'),
  ('DAO_DIEN', '["ThietBi.Xem","Studio.Xem","SuCo.Tao","DuAn.Xem","CaQuay.Xem"]'),
  ('NHAN_SU_EKIP', '["ThietBi.Xem","Studio.Xem","SuCo.Tao"]');

CREATE TEMP TABLE "tam_quyen_hieu_luc" AS
SELECT
  d."id" AS "donViId",
  m."vaiTro",
  CASE
    WHEN jsonb_typeof(d."quyenChucVu" -> m."vaiTro") = 'array' THEN d."quyenChucVu" -> m."vaiTro"
    ELSE m."quyen"
  END AS "quyen"
FROM "don_vi" d
CROSS JOIN "tam_quyen_mac_dinh" m;

INSERT INTO "nhom_quyen" ("id", "donViId", "maNhom", "tenNhom", "moTa", "quyen", "laMau", "ngayCapNhat")
SELECT gen_random_uuid()::text, q."donViId", n."maNhom", n."tenNhom", n."moTa", q."quyen", true, CURRENT_TIMESTAMP
FROM "tam_quyen_hieu_luc" q
JOIN (VALUES
  ('QUAN_LY', 'QUAN_LY_SAN_XUAT', 'Quản lý sản xuất', 'Điều phối dự án, ca quay, tài nguyên và xử lý xung đột.'),
  ('KY_THUAT_VIEN', 'NHAN_VIEN_KHO', 'Nhân viên kho', 'Quản lý thiết bị, kho, xuất nhập kho và sự cố.'),
  ('NHAN_SU_EKIP', 'NHAN_VIEN_SAN_XUAT', 'Nhân viên sản xuất', 'Tra cứu thiết bị, phòng quay và báo sự cố.')
) AS n("vaiTro", "maNhom", "tenNhom", "moTa") ON n."vaiTro" = q."vaiTro";

-- Chức vụ Đạo diễn từng có bộ quyền khác Nhân sự ê-kíp: tách nhóm riêng để không mất hoặc dư quyền.
CREATE TEMP TABLE "tam_don_vi_tach_dao_dien" AS
SELECT dd."donViId"
FROM "tam_quyen_hieu_luc" dd
JOIN "tam_quyen_hieu_luc" ek ON ek."donViId" = dd."donViId" AND ek."vaiTro" = 'NHAN_SU_EKIP'
WHERE dd."vaiTro" = 'DAO_DIEN'
  AND COALESCE((SELECT jsonb_agg(DISTINCT e ORDER BY e) FROM jsonb_array_elements_text(dd."quyen") AS x(e)), '[]')
   <> COALESCE((SELECT jsonb_agg(DISTINCT e ORDER BY e) FROM jsonb_array_elements_text(ek."quyen") AS x(e)), '[]');

INSERT INTO "nhom_quyen" ("id", "donViId", "maNhom", "tenNhom", "moTa", "quyen", "laMau", "ngayCapNhat")
SELECT gen_random_uuid()::text, q."donViId", 'NHAN_VIEN_SAN_XUAT_DAO_DIEN', 'Nhân viên sản xuất (đạo diễn)',
  'Chuyển từ cấu hình quyền chức vụ Đạo diễn trước đây.', q."quyen", false, CURRENT_TIMESTAMP
FROM "tam_quyen_hieu_luc" q
JOIN "tam_don_vi_tach_dao_dien" t ON t."donViId" = q."donViId"
WHERE q."vaiTro" = 'DAO_DIEN';

-- 3. Chức danh theo chức vụ cũ và các tên vị trí đã dùng trong lịch sử ca quay.
INSERT INTO "chuc_danh" ("id", "donViId", "maChucDanh", "tenChucDanh", "ngayCapNhat")
SELECT gen_random_uuid()::text, d."id", c."maChucDanh", c."tenChucDanh", CURRENT_TIMESTAMP
FROM "don_vi" d
CROSS JOIN (VALUES
  ('QUAN_LY_SAN_XUAT', 'Quản lý sản xuất'),
  ('DAO_DIEN', 'Đạo diễn'),
  ('NHAN_VIEN_KHO', 'Nhân viên kho'),
  ('NHAN_VIEN_SAN_XUAT', 'Nhân viên sản xuất')
) AS c("maChucDanh", "tenChucDanh");

INSERT INTO "chuc_danh" ("id", "donViId", "maChucDanh", "tenChucDanh", "ngayCapNhat")
SELECT gen_random_uuid()::text, ls."donViId", 'LICH_SU_' || upper(substr(md5(ls."ten"), 1, 12)), ls."ten", CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT da."donViId", ns."vaiTroPhanCong" AS "ten"
  FROM "ca_quay_nhan_su" ns
  JOIN "ca_quay" cq ON cq."id" = ns."caQuayId"
  JOIN "du_an" da ON da."id" = cq."duAnId"
  WHERE btrim(ns."vaiTroPhanCong") <> ''
) AS ls
ON CONFLICT DO NOTHING;

-- 4. Gán nhóm quyền và chức danh theo chức vụ cũ.
UPDATE "nguoi_dung" u
SET "nhomQuyenId" = n."id"
FROM "nhom_quyen" n
WHERE n."donViId" = u."donViId"
  AND n."maNhom" = CASE u."vaiTro"::text
    WHEN 'QUAN_LY' THEN 'QUAN_LY_SAN_XUAT'
    WHEN 'KY_THUAT_VIEN' THEN 'NHAN_VIEN_KHO'
    WHEN 'NHAN_SU_EKIP' THEN 'NHAN_VIEN_SAN_XUAT'
    WHEN 'DAO_DIEN' THEN CASE
      WHEN EXISTS (SELECT 1 FROM "tam_don_vi_tach_dao_dien" t WHERE t."donViId" = u."donViId")
        THEN 'NHAN_VIEN_SAN_XUAT_DAO_DIEN'
      ELSE 'NHAN_VIEN_SAN_XUAT'
    END
  END;

UPDATE "nguoi_dung" u
SET "chucDanhId" = c."id"
FROM "chuc_danh" c
WHERE c."donViId" = u."donViId"
  AND c."maChucDanh" = CASE u."vaiTro"::text
    WHEN 'QUAN_LY' THEN 'QUAN_LY_SAN_XUAT'
    WHEN 'DAO_DIEN' THEN 'DAO_DIEN'
    WHEN 'KY_THUAT_VIEN' THEN 'NHAN_VIEN_KHO'
    WHEN 'NHAN_SU_EKIP' THEN 'NHAN_VIEN_SAN_XUAT'
  END;

-- 5. Bản ghi quản trị hệ thống cũ.
UPDATE "nguoi_dung" SET "laQuanTriHeThong" = true WHERE "vaiTro" = 'QUAN_TRI_HE_THONG';

-- 6. Bỏ cấu trúc vai trò cũ.
DROP TABLE "tam_don_vi_tach_dao_dien";
DROP TABLE "tam_quyen_hieu_luc";
DROP TABLE "tam_quyen_mac_dinh";

DROP INDEX "nguoi_dung_donViId_vaiTro_idx";
ALTER TABLE "nguoi_dung" DROP COLUMN "vaiTro";
DROP TYPE "VaiTro";
ALTER TABLE "don_vi" DROP COLUMN "quyenChucVu";

CREATE INDEX "nguoi_dung_donViId_nhomQuyenId_idx" ON "nguoi_dung"("donViId", "nhomQuyenId");
CREATE INDEX "nguoi_dung_donViId_chucDanhId_idx" ON "nguoi_dung"("donViId", "chucDanhId");

ALTER TABLE "nguoi_dung" ADD CONSTRAINT "nguoi_dung_nhomQuyenId_fkey" FOREIGN KEY ("nhomQuyenId") REFERENCES "nhom_quyen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "nguoi_dung" ADD CONSTRAINT "nguoi_dung_chucDanhId_fkey" FOREIGN KEY ("chucDanhId") REFERENCES "chuc_danh"("id") ON DELETE SET NULL ON UPDATE CASCADE;
