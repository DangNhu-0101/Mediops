-- Chạy Scripts/SaoLuuTinhGon.ts và kiểm tra bản sao lưu trước khi áp dụng.
BEGIN;
LOCK TABLE "nguoi_dung", "thiet_bi", "phong_studio", "ca_quay", "su_co_bao_tri", "ky_nang_nhan_su", "nhan_su_khong_kha_dung", "thiet_bi_khong_kha_dung", "studio_khong_kha_dung", "yeu_cau_tai_nguyen", "anh_su_co_bao_tri", "quan_he_thay_the", "quan_he_tuong_thich", "thiet_bi_cho_thue", "nha_cung_cap_thiet_bi" IN ACCESS EXCLUSIVE MODE;

ALTER TABLE "nguoi_dung" ADD COLUMN "kyNang" JSONB NOT NULL DEFAULT '[]';
UPDATE "nguoi_dung" p SET "kyNang" = d."Mang" FROM (SELECT "nguoiDungId" AS "ChuId", jsonb_agg(jsonb_build_object('MaKyNang', "maKyNang", 'TrinhDo', "trinhDo") ORDER BY "maKyNang") AS "Mang" FROM "ky_nang_nhan_su" GROUP BY "nguoiDungId") d WHERE p."id" = d."ChuId";
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "nguoi_dung" p LEFT JOIN (SELECT "nguoiDungId" AS "ChuId", jsonb_agg(jsonb_build_object('MaKyNang', "maKyNang", 'TrinhDo', "trinhDo") ORDER BY "maKyNang") AS "Mang" FROM "ky_nang_nhan_su" GROUP BY "nguoiDungId") d ON p."id" = d."ChuId" WHERE p."kyNang" IS DISTINCT FROM COALESCE(d."Mang", '[]'::jsonb)) THEN
  RAISE EXCEPTION 'Du lieu chuyen doi ky_nang_nhan_su khong khop';
 END IF;
END $$;

ALTER TABLE "nguoi_dung" ADD COLUMN "cacKhoangKhongKhaDung" JSONB NOT NULL DEFAULT '[]';
UPDATE "nguoi_dung" p SET "cacKhoangKhongKhaDung" = d."Mang" FROM (SELECT "nguoiDungId" AS "ChuId", jsonb_agg(jsonb_build_object('Id', "id", 'BatDau', to_char("batDau", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'KetThuc', to_char("ketThuc", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'LyDo', "lyDo") ORDER BY "id") AS "Mang" FROM "nhan_su_khong_kha_dung" GROUP BY "nguoiDungId") d WHERE p."id" = d."ChuId";
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "nguoi_dung" p LEFT JOIN (SELECT "nguoiDungId" AS "ChuId", jsonb_agg(jsonb_build_object('Id', "id", 'BatDau', to_char("batDau", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'KetThuc', to_char("ketThuc", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'LyDo', "lyDo") ORDER BY "id") AS "Mang" FROM "nhan_su_khong_kha_dung" GROUP BY "nguoiDungId") d ON p."id" = d."ChuId" WHERE p."cacKhoangKhongKhaDung" IS DISTINCT FROM COALESCE(d."Mang", '[]'::jsonb)) THEN
  RAISE EXCEPTION 'Du lieu chuyen doi nhan_su_khong_kha_dung khong khop';
 END IF;
END $$;

ALTER TABLE "thiet_bi" ADD COLUMN "cacKhoangKhongKhaDung" JSONB NOT NULL DEFAULT '[]';
UPDATE "thiet_bi" p SET "cacKhoangKhongKhaDung" = d."Mang" FROM (SELECT "thietBiId" AS "ChuId", jsonb_agg(jsonb_build_object('Id', "id", 'BatDau', to_char("batDau", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'KetThuc', to_char("ketThuc", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'LyDo', "lyDo") ORDER BY "id") AS "Mang" FROM "thiet_bi_khong_kha_dung" GROUP BY "thietBiId") d WHERE p."id" = d."ChuId";
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "thiet_bi" p LEFT JOIN (SELECT "thietBiId" AS "ChuId", jsonb_agg(jsonb_build_object('Id', "id", 'BatDau', to_char("batDau", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'KetThuc', to_char("ketThuc", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'LyDo', "lyDo") ORDER BY "id") AS "Mang" FROM "thiet_bi_khong_kha_dung" GROUP BY "thietBiId") d ON p."id" = d."ChuId" WHERE p."cacKhoangKhongKhaDung" IS DISTINCT FROM COALESCE(d."Mang", '[]'::jsonb)) THEN
  RAISE EXCEPTION 'Du lieu chuyen doi thiet_bi_khong_kha_dung khong khop';
 END IF;
END $$;

ALTER TABLE "phong_studio" ADD COLUMN "cacKhoangKhongKhaDung" JSONB NOT NULL DEFAULT '[]';
UPDATE "phong_studio" p SET "cacKhoangKhongKhaDung" = d."Mang" FROM (SELECT "phongStudioId" AS "ChuId", jsonb_agg(jsonb_build_object('Id', "id", 'BatDau', to_char("batDau", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'KetThuc', to_char("ketThuc", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'LyDo', "lyDo") ORDER BY "id") AS "Mang" FROM "studio_khong_kha_dung" GROUP BY "phongStudioId") d WHERE p."id" = d."ChuId";
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "phong_studio" p LEFT JOIN (SELECT "phongStudioId" AS "ChuId", jsonb_agg(jsonb_build_object('Id', "id", 'BatDau', to_char("batDau", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'KetThuc', to_char("ketThuc", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'LyDo', "lyDo") ORDER BY "id") AS "Mang" FROM "studio_khong_kha_dung" GROUP BY "phongStudioId") d ON p."id" = d."ChuId" WHERE p."cacKhoangKhongKhaDung" IS DISTINCT FROM COALESCE(d."Mang", '[]'::jsonb)) THEN
  RAISE EXCEPTION 'Du lieu chuyen doi studio_khong_kha_dung khong khop';
 END IF;
END $$;

ALTER TABLE "ca_quay" ADD COLUMN "cacYeuCauTaiNguyen" JSONB NOT NULL DEFAULT '[]';
UPDATE "ca_quay" p SET "cacYeuCauTaiNguyen" = d."Mang" FROM (SELECT "caQuayId" AS "ChuId", jsonb_agg(jsonb_build_object('Id', "id", 'MaYeuCau', "maYeuCau", 'LoaiTaiNguyen', "loaiTaiNguyen", 'SoLuong', "soLuong", 'BatBuoc', "batBuoc", 'ChoPhepThayThe', "choPhepThayThe", 'TrongSo', "trongSo", 'DanhMucThietBiId', "danhMucThietBiId", 'ThietBiUuTienId', "thietBiUuTienId", 'MaKyNang', "maKyNang", 'ThongSoToiThieu', "thongSoToiThieu", 'ThongSoUuTien', "thongSoUuTien") ORDER BY "id") AS "Mang" FROM "yeu_cau_tai_nguyen" GROUP BY "caQuayId") d WHERE p."id" = d."ChuId";
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "ca_quay" p LEFT JOIN (SELECT "caQuayId" AS "ChuId", jsonb_agg(jsonb_build_object('Id', "id", 'MaYeuCau', "maYeuCau", 'LoaiTaiNguyen', "loaiTaiNguyen", 'SoLuong', "soLuong", 'BatBuoc', "batBuoc", 'ChoPhepThayThe', "choPhepThayThe", 'TrongSo', "trongSo", 'DanhMucThietBiId', "danhMucThietBiId", 'ThietBiUuTienId', "thietBiUuTienId", 'MaKyNang', "maKyNang", 'ThongSoToiThieu', "thongSoToiThieu", 'ThongSoUuTien', "thongSoUuTien") ORDER BY "id") AS "Mang" FROM "yeu_cau_tai_nguyen" GROUP BY "caQuayId") d ON p."id" = d."ChuId" WHERE p."cacYeuCauTaiNguyen" IS DISTINCT FROM COALESCE(d."Mang", '[]'::jsonb)) THEN
  RAISE EXCEPTION 'Du lieu chuyen doi yeu_cau_tai_nguyen khong khop';
 END IF;
END $$;

ALTER TABLE "su_co_bao_tri" ADD COLUMN "danhSachAnh" JSONB NOT NULL DEFAULT '[]';
UPDATE "su_co_bao_tri" p SET "danhSachAnh" = d."Mang" FROM (SELECT "suCoBaoTriId" AS "ChuId", jsonb_agg(jsonb_build_object('Id', "id", 'SecureUrl', "secureUrl", 'PublicId', "publicId", 'NgayTao', to_char("ngayTao", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) ORDER BY "id") AS "Mang" FROM "anh_su_co_bao_tri" GROUP BY "suCoBaoTriId") d WHERE p."id" = d."ChuId";
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM "su_co_bao_tri" p LEFT JOIN (SELECT "suCoBaoTriId" AS "ChuId", jsonb_agg(jsonb_build_object('Id', "id", 'SecureUrl', "secureUrl", 'PublicId', "publicId", 'NgayTao', to_char("ngayTao", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) ORDER BY "id") AS "Mang" FROM "anh_su_co_bao_tri" GROUP BY "suCoBaoTriId") d ON p."id" = d."ChuId" WHERE p."danhSachAnh" IS DISTINCT FROM COALESCE(d."Mang", '[]'::jsonb)) THEN
  RAISE EXCEPTION 'Du lieu chuyen doi anh_su_co_bao_tri khong khop';
 END IF;
END $$;
DROP TABLE "ky_nang_nhan_su";
DROP TABLE "nhan_su_khong_kha_dung";
DROP TABLE "thiet_bi_khong_kha_dung";
DROP TABLE "studio_khong_kha_dung";
DROP TABLE "yeu_cau_tai_nguyen";
DROP TABLE "anh_su_co_bao_tri";
DROP TABLE "quan_he_thay_the";
DROP TABLE "quan_he_tuong_thich";
DROP TABLE "thiet_bi_cho_thue";
DROP TABLE "nha_cung_cap_thiet_bi";
DROP TYPE "LoaiTuongThich";
DROP TYPE "TrangThaiKhaDungNhaCungCap";
ALTER TABLE "ky_nang" ADD COLUMN "donViId" TEXT;
ALTER TABLE "ky_nang" ADD CONSTRAINT "ky_nang_donViId_fkey" FOREIGN KEY ("donViId") REFERENCES "don_vi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;
