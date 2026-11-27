-- Quản trị viên đơn vị có toàn quyền nên không thuộc nhóm quyền nào và không gán chức danh.
UPDATE "nguoi_dung"
SET "nhomQuyenId" = NULL, "chucDanhId" = NULL
WHERE "quanTriDonVi" = true;
