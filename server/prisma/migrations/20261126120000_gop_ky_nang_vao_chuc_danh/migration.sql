-- Gộp danh mục kỹ năng vào chức danh.
-- Chức danh có donViId NULL là chức danh dùng chung do quản trị hệ thống quản lý.
-- Nhân sự giữ trình độ theo chức danh; yêu cầu nhân sự của ca quay tham chiếu chức danh.

ALTER TABLE "chuc_danh" ALTER COLUMN "donViId" DROP NOT NULL;
ALTER TABLE "nguoi_dung" ADD COLUMN "trinhDo" INTEGER;

-- 1. Chức danh mẫu trở thành chức danh dùng chung.
INSERT INTO "chuc_danh" ("id", "donViId", "maChucDanh", "tenChucDanh", "ngayCapNhat")
SELECT gen_random_uuid()::text, NULL, m."ma", m."ten", CURRENT_TIMESTAMP
FROM (VALUES
  ('QUAN_LY_SAN_XUAT', 'Quản lý sản xuất'),
  ('DAO_DIEN', 'Đạo diễn'),
  ('QUAY_PHIM', 'Quay phim'),
  ('ANH_SANG', 'Ánh sáng'),
  ('AM_THANH', 'Âm thanh'),
  ('NHAN_VIEN_KHO', 'Nhân viên kho'),
  ('NHAN_VIEN_SAN_XUAT', 'Nhân viên sản xuất')
) AS m("ma", "ten");

-- 2. Kỹ năng dùng chung: kỹ năng tương đương gộp vào chức danh mẫu, còn lại thành chức danh dùng chung mới.
CREATE TEMP TABLE "tam_ky_nang_tuong_duong" ("maKyNang" TEXT PRIMARY KEY, "maChucDanh" TEXT NOT NULL);
INSERT INTO "tam_ky_nang_tuong_duong" ("maKyNang", "maChucDanh") VALUES
  ('DAO_DIEN', 'DAO_DIEN'),
  ('KY_THUAT_AM_THANH', 'AM_THANH'),
  ('KY_THUAT_ANH_SANG', 'ANH_SANG'),
  ('VAN_HANH_MAY_QUAY', 'QUAY_PHIM'),
  ('QUAN_LY_THIET_BI', 'NHAN_VIEN_KHO');

INSERT INTO "chuc_danh" ("id", "donViId", "maChucDanh", "tenChucDanh", "ngayCapNhat")
SELECT gen_random_uuid()::text, NULL, k."maKyNang", k."tenKyNang", CURRENT_TIMESTAMP
FROM "ky_nang" k
WHERE k."donViId" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "tam_ky_nang_tuong_duong" t WHERE t."maKyNang" = k."maKyNang")
  AND NOT EXISTS (
    SELECT 1 FROM "chuc_danh" c
    WHERE c."donViId" IS NULL
      AND (c."maChucDanh" = k."maKyNang" OR lower(c."tenChucDanh") = lower(k."tenKyNang"))
  );

CREATE TEMP TABLE "tam_ky_nang_chuc_danh" ("maKyNang" TEXT PRIMARY KEY, "donViId" TEXT, "chucDanhId" TEXT NOT NULL);
INSERT INTO "tam_ky_nang_chuc_danh" ("maKyNang", "donViId", "chucDanhId")
SELECT k."maKyNang", NULL, c."id"
FROM "ky_nang" k
JOIN LATERAL (
  SELECT c."id"
  FROM "chuc_danh" c
  WHERE c."donViId" IS NULL
    AND (
      c."maChucDanh" = COALESCE(
        (SELECT t."maChucDanh" FROM "tam_ky_nang_tuong_duong" t WHERE t."maKyNang" = k."maKyNang"),
        k."maKyNang"
      )
      OR lower(c."tenChucDanh") = lower(k."tenKyNang")
    )
  ORDER BY c."maChucDanh" = COALESCE(
    (SELECT t."maChucDanh" FROM "tam_ky_nang_tuong_duong" t WHERE t."maKyNang" = k."maKyNang"),
    k."maKyNang"
  ) DESC
  LIMIT 1
) c ON true
WHERE k."donViId" IS NULL;

-- 3. Chức danh đơn vị trùng tên chức danh dùng chung được gộp vào chức danh dùng chung.
UPDATE "nguoi_dung" u
SET "chucDanhId" = chung."id"
FROM "chuc_danh" rieng
JOIN "chuc_danh" chung
  ON chung."donViId" IS NULL AND lower(chung."tenChucDanh") = lower(rieng."tenChucDanh")
WHERE rieng."donViId" IS NOT NULL AND u."chucDanhId" = rieng."id";

DELETE FROM "chuc_danh" rieng
WHERE rieng."donViId" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "chuc_danh" chung
    WHERE chung."donViId" IS NULL AND lower(chung."tenChucDanh") = lower(rieng."tenChucDanh")
  );

-- 4. Kỹ năng riêng của đơn vị thành chức danh riêng của đơn vị.
INSERT INTO "chuc_danh" ("id", "donViId", "maChucDanh", "tenChucDanh", "ngayCapNhat")
SELECT gen_random_uuid()::text, k."donViId", 'KY_NANG_' || upper(substr(md5(k."maKyNang"), 1, 12)), k."tenKyNang", CURRENT_TIMESTAMP
FROM "ky_nang" k
WHERE k."donViId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "chuc_danh" c
    WHERE (c."donViId" = k."donViId" OR c."donViId" IS NULL)
      AND lower(c."tenChucDanh") = lower(k."tenKyNang")
  );

INSERT INTO "tam_ky_nang_chuc_danh" ("maKyNang", "donViId", "chucDanhId")
SELECT k."maKyNang", k."donViId", c."id"
FROM "ky_nang" k
JOIN LATERAL (
  SELECT c."id"
  FROM "chuc_danh" c
  WHERE (c."donViId" = k."donViId" OR c."donViId" IS NULL)
    AND lower(c."tenChucDanh") = lower(k."tenKyNang")
  ORDER BY c."donViId" NULLS LAST
  LIMIT 1
) c ON true
WHERE k."donViId" IS NOT NULL;

-- 5. Nhân sự nhận chức danh và trình độ theo kỹ năng có trình độ cao nhất.
UPDATE "nguoi_dung" u
SET "chucDanhId" = x."chucDanhId", "trinhDo" = x."trinhDo"
FROM (
  SELECT DISTINCT ON (nd."id")
    nd."id",
    m."chucDanhId",
    CASE
      WHEN jsonb_typeof(e.v -> 'TrinhDo') = 'number'
        THEN LEAST(GREATEST((e.v ->> 'TrinhDo')::numeric::int, 1), 5)
    END AS "trinhDo"
  FROM "nguoi_dung" nd
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(nd."kyNang") = 'array' THEN nd."kyNang" ELSE '[]'::jsonb END
  ) WITH ORDINALITY AS e(v, "thuTu")
  JOIN "tam_ky_nang_chuc_danh" m
    ON m."maKyNang" = e.v ->> 'MaKyNang'
   AND (m."donViId" IS NULL OR m."donViId" = nd."donViId")
  ORDER BY nd."id", (e.v ->> 'TrinhDo') DESC NULLS LAST, e."thuTu"
) x
WHERE x."id" = u."id";

-- 6. Yêu cầu nhân sự của ca quay: MaKyNang chuyển thành ChucDanhId.
UPDATE "ca_quay" cq
SET "cacYeuCauTaiNguyen" = (
  SELECT COALESCE(
    jsonb_agg(
      (e.v - 'MaKyNang') || jsonb_build_object('ChucDanhId', m."chucDanhId")
      ORDER BY e."thuTu"
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(cq."cacYeuCauTaiNguyen") WITH ORDINALITY AS e(v, "thuTu")
  LEFT JOIN "tam_ky_nang_chuc_danh" m
    ON m."maKyNang" = e.v ->> 'MaKyNang'
   AND (m."donViId" IS NULL OR m."donViId" = da."donViId")
)
FROM "du_an" da
WHERE da."id" = cq."duAnId"
  AND jsonb_typeof(cq."cacYeuCauTaiNguyen") = 'array'
  AND jsonb_array_length(cq."cacYeuCauTaiNguyen") > 0;

-- 7. Bỏ quyền danh mục kỹ năng khỏi các nhóm quyền.
UPDATE "nhom_quyen"
SET "quyen" = COALESCE(
  (
    SELECT jsonb_agg(q.v ORDER BY q."thuTu")
    FROM jsonb_array_elements("quyen") WITH ORDINALITY AS q(v, "thuTu")
    WHERE (q.v #>> '{}') NOT LIKE 'KyNang.%'
  ),
  '[]'::jsonb
)
WHERE jsonb_typeof("quyen") = 'array';

-- 8. Bỏ cấu trúc kỹ năng cũ.
DROP TABLE "tam_ky_nang_chuc_danh";
DROP TABLE "tam_ky_nang_tuong_duong";
ALTER TABLE "nguoi_dung" DROP COLUMN "kyNang";
DROP TABLE "ky_nang";
