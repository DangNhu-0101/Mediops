-- Giữ URL ảnh đơn cũ trước khi migration kế tiếp bỏ cột hinhAnhUrl.
-- to_jsonb cho phép migration này chạy cả trên cơ sở dữ liệu phát triển đã áp dụng migration kế tiếp.
CREATE TABLE "anh_su_co_cu_chuyen_tiep" (
    "suCoBaoTriId" TEXT NOT NULL PRIMARY KEY,
    "secureUrl" TEXT NOT NULL
);

INSERT INTO "anh_su_co_cu_chuyen_tiep" ("suCoBaoTriId", "secureUrl")
SELECT "id", to_jsonb(su_co_bao_tri)->>'hinhAnhUrl'
FROM "su_co_bao_tri"
WHERE NULLIF(BTRIM(to_jsonb(su_co_bao_tri)->>'hinhAnhUrl'), '') IS NOT NULL;
