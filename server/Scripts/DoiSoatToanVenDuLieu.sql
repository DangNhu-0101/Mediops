-- =====================================================================
-- ĐỐI SOÁT TOÀN VẸN DỮ LIỆU MEDIOPS
-- Chỉ đọc: không INSERT, UPDATE hay DELETE. Chạy được trên CSDL ứng dụng
-- hoặc CSDL kiểm thử bằng psql, pgAdmin hay DBeaver.
--
--   psql "<chuỗi kết nối>" -f Scripts/DoiSoatToanVenDuLieu.sql
--
-- Kết quả: mỗi dòng là một phép kiểm tra, cột so_vi_pham phải bằng 0.
-- Cột mau_id liệt kê tối đa 5 bản ghi vi phạm để tra cứu.
-- Nhóm A: bản ghi mồ côi ở các cột tham chiếu chưa có khóa ngoại.
-- Nhóm B: dữ liệu khác đơn vị trộn lẫn.
-- Nhóm C: trạng thái lưu trùng ở nhiều bảng bị lệch nhau.
-- Nhóm D: giá trị vi phạm quy tắc nghiệp vụ (tiền đề cho ràng buộc CHECK).
-- Nhóm E: dữ liệu JSON tham chiếu mã không tồn tại.
-- Nhóm F: trùng lịch thực sự đã lưu (không tính khoảng đệm).
-- =====================================================================

WITH
ca_dang_chan AS (
  SELECT c.id, c."thoiGianBatDau" AS bd, c."thoiGianKetThuc" AS kt,
         c."phongStudioId", c."daoDienId", d."donViId"
  FROM ca_quay c JOIN du_an d ON d.id = c."duAnId"
  WHERE c."trangThai" NOT IN ('DA_HUY', 'HOAN_THANH')
),
kiem_tra (nhom, ma, mo_ta, so_vi_pham, mau_id) AS (

  -- ---------------- A. Bản ghi mồ côi ----------------
  SELECT 'A', 'A01', 'su_co_van_hanh.donViId không tồn tại trong don_vi',
         count(*), string_agg(s.id, ', ')
  FROM su_co_van_hanh s LEFT JOIN don_vi x ON x.id = s."donViId" WHERE x.id IS NULL
  UNION ALL
  SELECT 'A', 'A02', 'su_co_van_hanh.thietBiId không tồn tại trong thiet_bi', count(*), string_agg(s.id, ', ')
  FROM su_co_van_hanh s LEFT JOIN thiet_bi x ON x.id = s."thietBiId"
  WHERE s."thietBiId" IS NOT NULL AND x.id IS NULL
  UNION ALL
  SELECT 'A', 'A03', 'su_co_van_hanh.nguoiBaoCaoId không tồn tại trong nguoi_dung', count(*), string_agg(s.id, ', ')
  FROM su_co_van_hanh s LEFT JOIN nguoi_dung x ON x.id = s."nguoiBaoCaoId" WHERE x.id IS NULL
  UNION ALL
  SELECT 'A', 'A04', 'phien_quyet_dinh.donViId không tồn tại', count(*), string_agg(p.id, ', ')
  FROM phien_quyet_dinh p LEFT JOIN don_vi x ON x.id = p."donViId" WHERE x.id IS NULL
  UNION ALL
  SELECT 'A', 'A05', 'phien_quyet_dinh.nguoiTaoId không tồn tại', count(*), string_agg(p.id, ', ')
  FROM phien_quyet_dinh p LEFT JOIN nguoi_dung x ON x.id = p."nguoiTaoId" WHERE x.id IS NULL
  UNION ALL
  SELECT 'A', 'A06', 'phien_quyet_dinh.suCoId khác rỗng nhưng không có sự cố vận hành tương ứng', count(*), string_agg(p.id, ', ')
  FROM phien_quyet_dinh p LEFT JOIN su_co_van_hanh x ON x.id = p."suCoId"
  WHERE p."suCoId" <> '' AND x.id IS NULL
  UNION ALL
  SELECT 'A', 'A07', 'loi_moi_thay_ca.donViId không tồn tại', count(*), string_agg(l.id, ', ')
  FROM loi_moi_thay_ca l LEFT JOIN don_vi x ON x.id = l."donViId" WHERE x.id IS NULL
  UNION ALL
  SELECT 'A', 'A08', 'loi_moi_thay_ca: người nhận, người gửi hoặc người cũ không tồn tại', count(*), string_agg(l.id, ', ')
  FROM loi_moi_thay_ca l
  WHERE NOT EXISTS (SELECT 1 FROM nguoi_dung n WHERE n.id = l."nguoiNhanId")
     OR NOT EXISTS (SELECT 1 FROM nguoi_dung n WHERE n.id = l."nguoiGuiId")
     OR NOT EXISTS (SELECT 1 FROM nguoi_dung n WHERE n.id = l."nguoiCuId")
  UNION ALL
  SELECT 'A', 'A09', 'giu_cho_tai_nguyen.donViId không tồn tại', count(*), string_agg(g.id, ', ')
  FROM giu_cho_tai_nguyen g LEFT JOIN don_vi x ON x.id = g."donViId" WHERE x.id IS NULL
  UNION ALL
  SELECT 'A', 'A10', 'giu_cho_tai_nguyen.taiNguyenId không trỏ tới tài nguyên đúng loại', count(*), string_agg(g.id, ', ')
  FROM giu_cho_tai_nguyen g
  WHERE (g.loai = 'THIET_BI' AND NOT EXISTS (SELECT 1 FROM thiet_bi t WHERE t.id = g."taiNguyenId"))
     OR (g.loai = 'STUDIO'   AND NOT EXISTS (SELECT 1 FROM phong_studio t WHERE t.id = g."taiNguyenId"))
     OR (g.loai = 'NHAN_SU'  AND NOT EXISTS (SELECT 1 FROM nguoi_dung t WHERE t.id = g."taiNguyenId"))
  UNION ALL
  SELECT 'A', 'A11', 'lo_thay_the_thiet_bi.nguoiPhuTrachId không tồn tại', count(*), string_agg(l.id, ', ')
  FROM lo_thay_the_thiet_bi l LEFT JOIN nguoi_dung x ON x.id = l."nguoiPhuTrachId" WHERE x.id IS NULL
  UNION ALL
  SELECT 'A', 'A12', 'nhat_ky_su_co_van_hanh.nguoiThucHienId không tồn tại', count(*), string_agg(l.id, ', ')
  FROM nhat_ky_su_co_van_hanh l LEFT JOIN nguoi_dung x ON x.id = l."nguoiThucHienId" WHERE x.id IS NULL
  UNION ALL
  SELECT 'A', 'A13', 'nhat_ky_loi_moi.nguoiThucHienId không tồn tại', count(*), string_agg(l.id, ', ')
  FROM nhat_ky_loi_moi l LEFT JOIN nguoi_dung x ON x.id = l."nguoiThucHienId" WHERE x.id IS NULL
  UNION ALL
  SELECT 'A', 'A14', 'nhat_ky_cau_hinh_cho: người sửa hoặc phân hệ không tồn tại', count(*), string_agg(l.id, ', ')
  FROM nhat_ky_cau_hinh_cho l
  WHERE NOT EXISTS (SELECT 1 FROM nguoi_dung n WHERE n.id = l."nguoiSuaId")
     OR NOT EXISTS (SELECT 1 FROM cau_hinh_thoi_gian_cho c WHERE c."phanHe" = l."phanHe")

  -- ---------------- B. Trộn dữ liệu giữa các đơn vị ----------------
  UNION ALL
  SELECT 'B', 'B01', 'Thiết bị phân công cho ca thuộc đơn vị khác', count(*), string_agg(ct.id, ', ')
  FROM ca_quay_thiet_bi ct
  JOIN ca_quay c ON c.id = ct."caQuayId" JOIN du_an d ON d.id = c."duAnId"
  JOIN thiet_bi t ON t.id = ct."thietBiId" JOIN danh_muc_thiet_bi m ON m.id = t."danhMucId"
  WHERE m."donViId" <> d."donViId"
  UNION ALL
  SELECT 'B', 'B02', 'Nhân sự phân công cho ca thuộc đơn vị khác', count(*), string_agg(cn.id, ', ')
  FROM ca_quay_nhan_su cn
  JOIN ca_quay c ON c.id = cn."caQuayId" JOIN du_an d ON d.id = c."duAnId"
  JOIN nguoi_dung n ON n.id = cn."nguoiDungId"
  WHERE n."donViId" IS DISTINCT FROM d."donViId"
  UNION ALL
  SELECT 'B', 'B03', 'Ca quay dùng Studio hoặc đạo diễn của đơn vị khác', count(*), string_agg(c.id, ', ')
  FROM ca_quay c JOIN du_an d ON d.id = c."duAnId"
  LEFT JOIN phong_studio p ON p.id = c."phongStudioId"
  JOIN nguoi_dung n ON n.id = c."daoDienId"
  WHERE (p.id IS NOT NULL AND p."donViId" <> d."donViId")
     OR n."donViId" IS DISTINCT FROM d."donViId"
  UNION ALL
  SELECT 'B', 'B04', 'Thiết bị nằm trong kho của đơn vị khác', count(*), string_agg(t.id, ', ')
  FROM thiet_bi t JOIN danh_muc_thiet_bi m ON m.id = t."danhMucId" JOIN kho k ON k.id = t."khoId"
  WHERE k."donViId" <> m."donViId"
  UNION ALL
  SELECT 'B', 'B05', 'Phiên quyết định ghi đơn vị khác với đơn vị của ca', count(*), string_agg(p.id, ', ')
  FROM phien_quyet_dinh p JOIN ca_quay c ON c.id = p."caQuayId" JOIN du_an d ON d.id = c."duAnId"
  WHERE p."donViId" <> d."donViId"
  UNION ALL
  SELECT 'B', 'B06', 'Giữ chỗ hoặc lời mời ghi đơn vị khác với phiên', count(*), string_agg(x.id, ', ')
  FROM (
    SELECT g.id, g."donViId", g."phienId" FROM giu_cho_tai_nguyen g
    UNION ALL
    SELECT l.id, l."donViId", l."phienId" FROM loi_moi_thay_ca l
  ) x JOIN phien_quyet_dinh p ON p.id = x."phienId"
  WHERE x."donViId" <> p."donViId"
  UNION ALL
  SELECT 'B', 'B07', 'Sự cố vận hành ghi đơn vị khác với đơn vị của ca', count(*), string_agg(s.id, ', ')
  FROM su_co_van_hanh s JOIN ca_quay c ON c.id = s."caQuayId" JOIN du_an d ON d.id = c."duAnId"
  WHERE s."donViId" <> d."donViId"

  -- ---------------- C. Trạng thái lưu trùng bị lệch ----------------
  UNION ALL
  SELECT 'C', 'C01', 'Thiết bị DANG_SU_DUNG nhưng không có khoản mượn nào đang xuất kho', count(*), string_agg(t.id, ', ')
  FROM thiet_bi t
  WHERE t."trangThai" = 'DANG_SU_DUNG'
    AND NOT EXISTS (SELECT 1 FROM ca_quay_thiet_bi ct
                    WHERE ct."thietBiId" = t.id AND ct."trangThaiMuonTra" = 'DA_XUAT_KHO')
  UNION ALL
  SELECT 'C', 'C02', 'Thiết bị đang xuất kho nhưng trạng thái máy vẫn SAN_SANG', count(*), string_agg(DISTINCT t.id, ', ')
  FROM thiet_bi t JOIN ca_quay_thiet_bi ct ON ct."thietBiId" = t.id
  WHERE ct."trangThaiMuonTra" = 'DA_XUAT_KHO' AND t."trangThai" = 'SAN_SANG'
  UNION ALL
  SELECT 'C', 'C03', 'Một thiết bị có từ 2 khoản mượn cùng đang xuất kho', count(*), string_agg(x."thietBiId", ', ')
  FROM (SELECT ct."thietBiId" FROM ca_quay_thiet_bi ct
        WHERE ct."trangThaiMuonTra" = 'DA_XUAT_KHO'
        GROUP BY ct."thietBiId" HAVING count(*) > 1) x
  UNION ALL
  SELECT 'C', 'C04', 'Khoản mượn thiếu mốc thời gian hoặc nhập kho trước khi xuất kho', count(*), string_agg(ct.id, ', ')
  FROM ca_quay_thiet_bi ct
  WHERE (ct."trangThaiMuonTra" IN ('DA_XUAT_KHO', 'DA_NHAP_KHO') AND ct."thoiGianXuatKho" IS NULL)
     OR (ct."trangThaiMuonTra" = 'DA_NHAP_KHO' AND ct."thoiGianNhapKho" IS NULL)
     OR (ct."thoiGianNhapKho" < ct."thoiGianXuatKho")
  UNION ALL
  SELECT 'C', 'C05', 'Khoản mượn đã xuất kho nhưng không có dòng nhật ký XUAT_KHO', count(*), string_agg(ct.id, ', ')
  FROM ca_quay_thiet_bi ct
  WHERE ct."trangThaiMuonTra" IN ('DA_XUAT_KHO', 'DA_NHAP_KHO')
    AND NOT EXISTS (SELECT 1 FROM nhat_ky_muon_tra n
                    WHERE n."thietBiId" = ct."thietBiId" AND n."caQuayId" = ct."caQuayId"
                      AND n."loaiHanhDong" = 'XUAT_KHO')
  UNION ALL
  SELECT 'C', 'C06', 'Nhật ký mượn trả khác ca hoặc khác loại thao tác với giao dịch kho cha', count(*), string_agg(n.id, ', ')
  FROM nhat_ky_muon_tra n JOIN giao_dich_kho g ON g.id = n."giaoDichKhoId"
  WHERE n."caQuayId" <> g."caQuayId" OR n."loaiHanhDong" <> g."loaiHanhDong"
  UNION ALL
  SELECT 'C', 'C07', 'Sự cố bảo trì chưa đóng nhưng thiết bị đang SAN_SANG', count(*), string_agg(s.id, ', ')
  FROM su_co_bao_tri s JOIN thiet_bi t ON t.id = s."thietBiId"
  WHERE s."trangThai" IN ('CHO_XU_LY', 'DANG_SUA_CHUA') AND t."trangThai" = 'SAN_SANG'
  UNION ALL
  SELECT 'C', 'C08', 'Sự cố bảo trì đã khắc phục nhưng thiếu ngày hoàn tất hoặc ngày sai thứ tự', count(*), string_agg(s.id, ', ')
  FROM su_co_bao_tri s
  WHERE (s."trangThai" = 'DA_KHAC_PHUC' AND s."ngayHoanTat" IS NULL)
     OR s."ngayHoanTat" < s."ngayTao"
     OR s."ngayBatDauXuLy" < s."ngayTao"
  UNION ALL
  SELECT 'C', 'C09', 'Một ca có nhiều hơn một phiên quyết định đang mở', count(*), string_agg(x."caQuayId", ', ')
  FROM (SELECT p."caQuayId" FROM phien_quyet_dinh p WHERE p."trangThai" = 'MO'
        GROUP BY p."caQuayId" HAVING count(*) > 1) x
  UNION ALL
  SELECT 'C', 'C10', 'Giữ chỗ còn MO nhưng phiên đã kết thúc', count(*), string_agg(g.id, ', ')
  FROM giu_cho_tai_nguyen g JOIN phien_quyet_dinh p ON p.id = g."phienId"
  WHERE g."trangThai" = 'MO' AND p."trangThai" <> 'MO'
  UNION ALL
  SELECT 'C', 'C11', '(Thông tin) Giữ chỗ hoặc lời mời quá hạn chưa được dọn — hiệu lực vẫn được tính theo hạn ở truy vấn', count(*), NULL
  FROM (
    SELECT g.id FROM giu_cho_tai_nguyen g WHERE g."trangThai" = 'MO' AND g."hetHanLuc" < now()
    UNION ALL
    SELECT l.id FROM loi_moi_thay_ca l WHERE l."trangThai" = 'CHO_PHAN_HOI' AND l."hetHanLuc" < now()
  ) x

  -- ---------------- D. Vi phạm quy tắc giá trị ----------------
  UNION ALL
  SELECT 'D', 'D01', 'Ca quay có giờ kết thúc không sau giờ bắt đầu', count(*), string_agg(c.id, ', ')
  FROM ca_quay c WHERE c."thoiGianKetThuc" <= c."thoiGianBatDau"
  UNION ALL
  SELECT 'D', 'D02', 'Ca quay có mức ưu tiên ngoài 0–100 hoặc thời gian đệm âm', count(*), string_agg(c.id, ', ')
  FROM ca_quay c
  WHERE c."mucDoUuTien" NOT BETWEEN 0 AND 100
     OR c."thoiGianChuanBiPhut" < 0 OR c."thoiGianThuHoiPhut" < 0
  UNION ALL
  SELECT 'D', 'D03', 'Khung dời lịch không bao được giờ quay hiện tại', count(*), string_agg(c.id, ', ')
  FROM ca_quay c
  WHERE c."thoiGianBatDauSomNhat" > c."thoiGianBatDau"
     OR c."thoiGianKetThucMuonNhat" < c."thoiGianKetThuc"
  UNION ALL
  SELECT 'D', 'D04', 'Mốc hiệu lực phân công đảo ngược (hieuLucDen <= hieuLucTu)', count(*), string_agg(x.id, ', ')
  FROM (
    SELECT id, "hieuLucTu", "hieuLucDen" FROM ca_quay_thiet_bi
    UNION ALL
    SELECT id, "hieuLucTu", "hieuLucDen" FROM ca_quay_nhan_su
  ) x WHERE x."hieuLucDen" <= x."hieuLucTu"
  UNION ALL
  SELECT 'D', 'D05', 'Giữ chỗ có khoảng thời gian đảo ngược', count(*), string_agg(g.id, ', ')
  FROM giu_cho_tai_nguyen g WHERE g."ketThuc" <= g."batDau"
  UNION ALL
  SELECT 'D', 'D06', 'Thiết bị có thời gian kiểm tra sau sử dụng âm', count(*), string_agg(t.id, ', ')
  FROM thiet_bi t WHERE t."thoiGianKiemTraSauSuDungPhut" < 0
  UNION ALL
  SELECT 'D', 'D07', 'Kho có tọa độ ngoài phạm vi hoặc bán kính xác minh không dương', count(*), string_agg(k.id, ', ')
  FROM kho k
  WHERE k."viDo" NOT BETWEEN -90 AND 90 OR k."kinhDo" NOT BETWEEN -180 AND 180
     OR k."banKinhXacMinhMet" <= 0
  UNION ALL
  SELECT 'D', 'D08', 'Studio có sức chứa không dương', count(*), string_agg(p.id, ', ')
  FROM phong_studio p WHERE p."sucChua" <= 0
  UNION ALL
  SELECT 'D', 'D09', 'Cấu hình thời gian chờ ngoài 1–120 phút', count(*), string_agg(c."phanHe", ', ')
  FROM cau_hinh_thoi_gian_cho c WHERE c."soPhut" NOT BETWEEN 1 AND 120
  UNION ALL
  SELECT 'D', 'D10', 'Trạng thái phiên / giữ chỗ / lời mời ngoài tập giá trị mã nguồn sử dụng', count(*), string_agg(x.id, ', ')
  FROM (
    SELECT id FROM phien_quyet_dinh WHERE "trangThai" NOT IN ('MO', 'DA_CHOT', 'DA_HUY', 'HET_HAN')
    UNION ALL
    SELECT id FROM giu_cho_tai_nguyen WHERE "trangThai" NOT IN ('MO', 'DA_CHOT', 'DA_HUY', 'HET_HAN')
    UNION ALL
    SELECT id FROM loi_moi_thay_ca WHERE "trangThai" NOT IN
      ('CHO_PHAN_HOI', 'DA_DONG_Y', 'DA_TU_CHOI', 'DA_HUY', 'HET_HAN', 'DA_PHAN_CONG')
    UNION ALL
    SELECT id FROM nhat_ky_loi_moi WHERE "trangThai" NOT IN
      ('CHO_PHAN_HOI', 'DA_DONG_Y', 'DA_TU_CHOI', 'RUT_DONG_Y', 'DA_HUY', 'HET_HAN', 'DA_PHAN_CONG')
  ) x
  UNION ALL
  SELECT 'D', 'D11', 'Giao dịch kho có tọa độ, độ chính xác hoặc khoảng cách không hợp lệ', count(*), string_agg(g.id, ', ')
  FROM giao_dich_kho g
  WHERE g."viDoGhiNhan" NOT BETWEEN -90 AND 90 OR g."kinhDoGhiNhan" NOT BETWEEN -180 AND 180
     OR g."doChinhXacMet" < 0 OR g."khoangCachDenKhoMet" < 0

  -- ---------------- E. JSON tham chiếu mã không tồn tại ----------------
  UNION ALL
  SELECT 'E', 'E01', 'Trình độ nhân sự nằm ngoài khoảng 1-5', count(*), string_agg(n.id, ', ')
  FROM nguoi_dung n
  WHERE n."trinhDo" IS NOT NULL AND n."trinhDo" NOT BETWEEN 1 AND 5
  UNION ALL
  SELECT 'E', 'E02', 'Yêu cầu tài nguyên của ca đòi chức danh không tồn tại hoặc không dùng được ở đơn vị', count(*), string_agg(c.id, ', ')
  FROM ca_quay c
  JOIN du_an d ON d.id = c."duAnId"
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(c."cacYeuCauTaiNguyen") = 'array' THEN c."cacYeuCauTaiNguyen" ELSE '[]'::jsonb END) y
  WHERE y->>'ChucDanhId' IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM chuc_danh cd
      WHERE cd.id = y->>'ChucDanhId' AND (cd."donViId" IS NULL OR cd."donViId" = d."donViId")
    )
  UNION ALL
  SELECT 'E', 'E03', 'Yêu cầu tài nguyên của ca trỏ tới danh mục hoặc thiết bị ưu tiên không tồn tại', count(*), string_agg(c.id, ', ')
  FROM ca_quay c
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(c."cacYeuCauTaiNguyen") = 'array' THEN c."cacYeuCauTaiNguyen" ELSE '[]'::jsonb END) y
  WHERE (y->>'DanhMucThietBiId' IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM danh_muc_thiet_bi m WHERE m.id = y->>'DanhMucThietBiId'))
     OR (y->>'ThietBiUuTienId' IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM thiet_bi t WHERE t.id = y->>'ThietBiUuTienId'))
  UNION ALL
  SELECT 'E', 'E04', 'Khoảng không khả dụng có kết thúc không sau bắt đầu', count(*), string_agg(x.id, ', ')
  FROM (
    SELECT id, "cacKhoangKhongKhaDung" AS j FROM nguoi_dung
    UNION ALL SELECT id, "cacKhoangKhongKhaDung" FROM thiet_bi
    UNION ALL SELECT id, "cacKhoangKhongKhaDung" FROM phong_studio
  ) x
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(x.j) = 'array' THEN x.j ELSE '[]'::jsonb END) k
  WHERE (k->>'KetThuc')::timestamptz <= (k->>'BatDau')::timestamptz
  UNION ALL
  SELECT 'E', 'E05', 'Cột JSON dạng danh sách nhưng không phải mảng', count(*), string_agg(x.id, ', ')
  FROM (
    SELECT id FROM nguoi_dung WHERE jsonb_typeof("cacKhoangKhongKhaDung") <> 'array'
    UNION ALL SELECT id FROM ca_quay WHERE jsonb_typeof("cacYeuCauTaiNguyen") <> 'array'
                                        OR jsonb_typeof("lichSuStudio") <> 'array'
    UNION ALL SELECT id FROM thiet_bi WHERE jsonb_typeof("cacKhoangKhongKhaDung") <> 'array'
    UNION ALL SELECT id FROM phong_studio WHERE jsonb_typeof("cacKhoangKhongKhaDung") <> 'array'
  ) x

  -- ---------------- F. Trùng lịch thực sự đã lưu ----------------
  -- Chỉ so giờ quay gốc, không cộng đệm: nếu khác 0 nghĩa là có đường ghi
  -- đã bỏ qua bộ kiểm tra xung đột.
  UNION ALL
  SELECT 'F', 'F01', 'Một thiết bị được phân công cho hai ca đang hiệu lực chồng giờ', count(*), string_agg(a.id || '/' || b.id, ', ')
  FROM ca_quay_thiet_bi ta JOIN ca_dang_chan a ON a.id = ta."caQuayId"
  JOIN ca_quay_thiet_bi tb ON tb."thietBiId" = ta."thietBiId" AND tb."caQuayId" > ta."caQuayId"
  JOIN ca_dang_chan b ON b.id = tb."caQuayId"
  WHERE greatest(a.bd, coalesce(ta."hieuLucTu", a.bd)) < least(b.kt, coalesce(tb."hieuLucDen", b.kt))
    AND greatest(b.bd, coalesce(tb."hieuLucTu", b.bd)) < least(a.kt, coalesce(ta."hieuLucDen", a.kt))
  UNION ALL
  SELECT 'F', 'F02', 'Một Studio có hai ca đang hiệu lực chồng giờ', count(*), string_agg(a.id || '/' || b.id, ', ')
  FROM ca_dang_chan a JOIN ca_dang_chan b
    ON b."phongStudioId" = a."phongStudioId" AND b.id > a.id
  WHERE a.bd < b.kt AND b.bd < a.kt
  UNION ALL
  SELECT 'F', 'F03', 'Một người có hai ca đang hiệu lực chồng giờ (đạo diễn hoặc ê-kíp)', count(*), string_agg(x.ca_a || '/' || x.ca_b, ', ')
  FROM (
    SELECT DISTINCT LEAST(a.id, b.id) AS ca_a, GREATEST(a.id, b.id) AS ca_b
    FROM (
      SELECT c.id, c.bd, c.kt, c."daoDienId" AS nguoi FROM ca_dang_chan c
      UNION
      SELECT c.id, c.bd, c.kt, n."nguoiDungId" FROM ca_dang_chan c
      JOIN ca_quay_nhan_su n ON n."caQuayId" = c.id
    ) a JOIN (
      SELECT c.id, c.bd, c.kt, c."daoDienId" AS nguoi FROM ca_dang_chan c
      UNION
      SELECT c.id, c.bd, c.kt, n."nguoiDungId" FROM ca_dang_chan c
      JOIN ca_quay_nhan_su n ON n."caQuayId" = c.id
    ) b ON b.nguoi = a.nguoi AND b.id <> a.id
    WHERE a.bd < b.kt AND b.bd < a.kt
  ) x
)
SELECT nhom AS "Nhóm", ma AS "Mã", mo_ta AS "Phép kiểm tra",
       so_vi_pham AS "Số vi phạm",
       CASE WHEN so_vi_pham = 0 THEN 'ĐẠT'
            WHEN ma = 'C11' THEN 'THÔNG TIN'
            ELSE 'CẦN XỬ LÝ' END AS "Kết quả",
       left(mau_id, 200) AS "Mẫu Id"
FROM kiem_tra
ORDER BY ma;
