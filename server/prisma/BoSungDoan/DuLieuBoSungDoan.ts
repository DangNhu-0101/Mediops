// Dữ liệu bổ sung cho CSDL `doan` (đơn vị MEDIOPS-DEMO-A – Hãng phim Minh Dương).
// Mục đích: đủ thiết bị, lịch và khoảng bận để trình bày THỦ CÔNG các chức năng
// phát hiện và giải quyết xung đột. Không có ca nào được seed sẵn ở trạng thái xung đột.
//
// Thông số kỹ thuật: chỉ ghi những giá trị đọc được trên trang nguồn ở NguonThamKhaoUrl
// (trang shop B&H, cửa hàng chính hãng hoặc trang thông số của hãng), tra ngày 24/11/2026.
// Trường nào trang nguồn không ghi thì bỏ trống, không suy đoán. Khóa thông số dùng
// cùng bộ từ vựng với thiết bị đã có để thuật toán gợi ý so sánh được.
// Số sê-ri có tiền tố DEMO- vì là thiết bị mô phỏng của đơn vị, không phải số máy thật.

export type MaDanhMucBoSung =
  "MAY_QUAY" | "ONG_KINH" | "CHIEU_SANG" | "MICRO" | "MAY_GHI_AM" | "PHU_KIEN";

export interface MauBoSung {
  // Mã ảnh trong prisma/TrinhDien/AnhThietBiCloudinary.json (null nếu chưa có ảnh giấy phép mở).
  MaAnh: string | null;
  MaMau: string;
  TenMau: string;
  TenThietBi: string;
  MaDanhMuc: MaDanhMucBoSung;
  ThoiGianKiemTraSauSuDungPhut: number;
  NguonThamKhaoUrl: string;
  ThongSoKyThuat: Record<string, unknown>;
  // Mỗi phần tử là một máy: [mã QR, số sê-ri, mã kho, vị trí kệ].
  DanhSachMay: Array<[string, string, MaKho, string]>;
}

export type MaKho = "TRUNG_TAM" | "PHIA_DONG";

export const TenKhoTheoMa: Record<MaKho, string> = {
  TRUNG_TAM: "Kho thiết bị Trung tâm",
  PHIA_DONG: "Kho thiết bị phía Đông",
};

export const DanhSachMauBoSung: MauBoSung[] = [
  // ---------------------------------------------------------------- máy quay
  {
    MaAnh: "SONY-A7SIII",
    MaMau: "SONY ILCE-7SM3",
    TenMau: "Sony ILCE-7SM3",
    TenThietBi: "Sony Alpha 7S III",
    MaDanhMuc: "MAY_QUAY",
    ThoiGianKiemTraSauSuDungPhut: 20,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1577838-REG/sony_ilce7sm3_b_alpha_a7s_iii_mirrorless.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "Sony",
      model: "ILCE-7SM3",
      ngamOngKinh: "SONY_E",
      loaiCamBien: "CMOS_FULL_FRAME",
      kichThuocCamBienMm: "35.6 x 23.8",
      doPhanGiaiHieuDungMp: 12.1,
      doPhanGiaiVideoToiDa: "UHD_4K_3840_X_2160",
      tocDoKhungHinh4KToiDaFps: 120,
      doSauBitToiDa: 10,
      layMauMauToiDa: "4:2:2",
      codecVideo: ["XAVC_HS_H265", "XAVC_S_H264", "XAVC_SI_H264"],
      isoVideo: "80-102400; mở rộng 80-409600",
      chongRungThanMay: "5_TRUC",
      layNetTuDong: "PHASE_DETECTION_759_DIEM",
      ketNoi: ["HDMI", "USB_C", "MIC_3_5_MM", "HEADPHONE_3_5_MM", "WIFI"],
      kichThuocMm: "128.9 x 96.9 x 80.8",
      khoiLuongThanMayG: 614,
    },
    DanhSachMay: [
      [
        "TB-CAM-SONY-A7SIII-01",
        "DEMO-ILCE-7SM3-001",
        "TRUNG_TAM",
        "Tủ CAM-A · Ngăn 03",
      ],
    ],
  },
  {
    MaAnh: "SONY-FX30",
    MaMau: "SONY ILME-FX30",
    TenMau: "Sony ILME-FX30",
    TenThietBi: "Sony Cinema Line FX30",
    MaDanhMuc: "MAY_QUAY",
    ThoiGianKiemTraSauSuDungPhut: 25,
    NguonThamKhaoUrl:
      "https://store.sony.com.my/blogs/7125535457314_40848166617122/7125535457314_specifications",
    ThongSoKyThuat: {
      thuongHieu: "Sony",
      model: "ILME-FX30",
      ngamOngKinh: "SONY_E",
      loaiCamBien: "CMOS_EXMOR_R_APS_C",
      kichThuocCamBienMm: "23.3 x 15.5",
      doPhanGiaiHieuDungMp: 26.0,
      doPhanGiaiVideoToiDa: "UHD_4K_3840_X_2160",
      tocDoKhungHinh4KToiDaFps: 120,
      doSauBitToiDa: 10,
      layMauMauToiDa: "4:2:2",
      codecVideo: ["XAVC_HS_H265", "XAVC_S_H264", "XAVC_SI_H264"],
      isoVideo: "100-32000",
      daiTuongPhanStop: "14+",
      chongRungThanMay: "5_TRUC",
      layNetTuDong: "FAST_HYBRID_AF",
      ketNoi: ["HDMI_TYPE_A", "USB_C", "XLR_TRS_QUA_TAY_CAM", "WIFI"],
      kichThuocMm: "129.7 x 77.8 x 84.5",
      khoiLuongThanMayG: 562,
    },
    DanhSachMay: [
      [
        "TB-CAM-SONY-FX30-01",
        "DEMO-ILME-FX30-001",
        "PHIA_DONG",
        "Tủ CAM-B · Ngăn 02",
      ],
    ],
  },
  {
    MaAnh: "CANON-C70",
    MaMau: "CANON EOS C70",
    TenMau: "Canon EOS C70",
    TenThietBi: "Canon EOS C70",
    MaDanhMuc: "MAY_QUAY",
    ThoiGianKiemTraSauSuDungPhut: 30,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1595392-REG/canon_eos_c70_cinema_camera.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "Canon",
      model: "EOS C70",
      ngamOngKinh: "CANON_RF",
      loaiCamBien: "CMOS_SUPER_35",
      kichThuocCamBienMm: "26.2 x 13.8",
      doPhanGiaiHieuDungMp: 8.85,
      doPhanGiaiVideoToiDa: "DCI_4K_4096_X_2160",
      tocDoKhungHinh4KToiDaFps: 60,
      doSauBitToiDa: 10,
      layMauMauToiDa: "4:2:2",
      codecVideo: ["XF_AVC", "H265", "H264"],
      isoVideo: "160-25600; mở rộng 100-102400",
      daiTuongPhanStop: "16",
      chongRungThanMay: "DIEN_TU_5_TRUC",
      locNd: "ND cơ 2, 4, 6, 8, 10 stop",
      theNho: ["SD", "SD"],
      ketNoi: ["HDMI", "MINI_XLR", "BNC_TIMECODE", "USB_C"],
      kichThuocMm: "130.2 x 160 x 115.9",
      khoiLuongThanMayG: 1170,
    },
    DanhSachMay: [
      [
        "TB-CAM-CANON-C70-01",
        "DEMO-EOS-C70-001",
        "PHIA_DONG",
        "Tủ CAM-B · Ngăn 03",
      ],
    ],
  },
  {
    MaAnh: "PANASONIC-S5II",
    MaMau: "PANASONIC DC-S5M2",
    TenMau: "Panasonic DC-S5M2",
    TenThietBi: "Panasonic LUMIX S5II",
    MaDanhMuc: "MAY_QUAY",
    ThoiGianKiemTraSauSuDungPhut: 20,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1936322-REG/panasonic_dc_s5m2body9_lumix_s5_ii_mirrorless.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "Panasonic",
      model: "DC-S5M2",
      ngamOngKinh: "L_MOUNT",
      loaiCamBien: "CMOS_FULL_FRAME",
      kichThuocCamBienMm: "35.6 x 23.8",
      doPhanGiaiHieuDungMp: 24.2,
      doPhanGiaiVideoToiDa: "5.9K_5952_X_3968",
      tocDoKhungHinh4KToiDaFps: 60,
      doSauBitToiDa: 10,
      layMauMauToiDa: "4:2:2",
      codecVideo: ["H264", "H265"],
      isoVideo: "100-51200; mở rộng 50-204800; ISO cơ sở kép 100/640",
      chongRungThanMay: "5_TRUC",
      layNetTuDong: "PHASE_DETECTION_779_DIEM",
      ketNoi: [
        "HDMI",
        "USB_C",
        "MIC_3_5_MM",
        "HEADPHONE_3_5_MM",
        "WIFI",
        "BLUETOOTH",
      ],
      kichThuocMm: "134.4 x 102.4 x 90.2",
      khoiLuongThanMayG: 658,
    },
    DanhSachMay: [
      [
        "TB-CAM-PANA-S5II-01",
        "DEMO-DC-S5M2-001",
        "TRUNG_TAM",
        "Tủ CAM-A · Ngăn 04",
      ],
    ],
  },
  {
    MaAnh: null,
    MaMau: "BLACKMAGIC POCKET CINEMA CAMERA 6K PRO",
    TenMau: "Blackmagic Pocket Cinema Camera 6K Pro",
    TenThietBi: "Blackmagic Pocket Cinema Camera 6K Pro",
    MaDanhMuc: "MAY_QUAY",
    ThoiGianKiemTraSauSuDungPhut: 25,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1625642-REG/blackmagic_design_cinecampochdef6kp_pocket_cinema_camera_6k.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "Blackmagic Design",
      model: "Pocket Cinema Camera 6K Pro",
      ngamOngKinh: "CANON_EF",
      loaiCamBien: "CMOS_SUPER_35",
      kichThuocCamBienMm: "23.1 x 12.99",
      doPhanGiaiHieuDungMp: 21.2,
      doPhanGiaiVideoToiDa: "6K_6144_X_3456",
      codecVideo: ["BLACKMAGIC_RAW"],
      isoVideo: "100-25600",
      daiTuongPhanStop: "13",
      chongRungThanMay: "KHONG",
      locNd: "ND cơ 2, 4, 6 stop",
      theNho: ["SD_UHS_II", "CFAST"],
      ketNoi: [
        "HDMI",
        "MINI_XLR",
        "MIC_3_5_MM",
        "HEADPHONE_3_5_MM",
        "USB_C",
        "BLUETOOTH",
      ],
    },
    DanhSachMay: [
      [
        "TB-CAM-BMD-6KPRO-01",
        "DEMO-BMPCC6KPRO-001",
        "PHIA_DONG",
        "Tủ CAM-B · Ngăn 04",
      ],
    ],
  },
  {
    MaAnh: null,
    MaMau: "CANON EOS C300 MARK III",
    TenMau: "Canon EOS C300 Mark III",
    TenThietBi: "Canon EOS C300 Mark III",
    MaDanhMuc: "MAY_QUAY",
    ThoiGianKiemTraSauSuDungPhut: 40,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1557488-REG/canon_3795c002_cinema_eos_c300_mark.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "Canon",
      model: "EOS C300 Mark III",
      ngamOngKinh: "CANON_EF",
      loaiCamBien: "CMOS_SUPER_35",
      kichThuocCamBienMm: "26.2 x 13.8",
      doPhanGiaiHieuDungMp: 8.85,
      doPhanGiaiVideoToiDa: "DCI_4K_4096_X_2160",
      codecVideo: ["CINEMA_RAW_LIGHT", "XF_AVC"],
      isoVideo: "100-102400",
      daiTuongPhanStop: "16",
      chongRungThanMay: "KHONG",
      locNd: "ND cơ 2, 4, 6, 8, 10 stop",
      theNho: ["CFEXPRESS_TYPE_B", "CFEXPRESS_TYPE_B", "SD"],
      ketNoi: ["SDI_3G", "HDMI", "XLR_3_PIN", "MIC_3_5_MM", "BNC_TIMECODE"],
      kichThuocMm: "153 x 148 x 168",
      khoiLuongThanMayG: 1750,
    },
    DanhSachMay: [
      [
        "TB-CAM-CANON-C300M3-01",
        "DEMO-C300MK3-001",
        "TRUNG_TAM",
        "Tủ CAM-C · Ngăn 01",
      ],
    ],
  },

  // ---------------------------------------------------------------- ống kính
  {
    MaAnh: "SONY-SEL1635GM2",
    MaMau: "SONY SEL1635GM2",
    TenMau: "Sony SEL1635GM2",
    TenThietBi: "Sony FE 16–35mm F2.8 GM II",
    MaDanhMuc: "ONG_KINH",
    ThoiGianKiemTraSauSuDungPhut: 15,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1784822-REG/sony_fe_16_35mm_f_2_8_gm.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "Sony",
      model: "SEL1635GM2",
      ngamOngKinh: "SONY_E",
      dinhDangCamBien: "FULL_FRAME",
      tieuCuNhoNhatMm: 16,
      tieuCuLonNhatMm: 35,
      khauDoLonNhat: 2.8,
      khauDoNhoNhat: 22,
      soLaKhauDo: 11,
      chongRungQuangHoc: false,
      khoangLayNetGanNhatM: 0.221,
      duongKinhKinhLocMm: 82,
      kichThuocMm: "87.8 x 111.5",
      khoiLuongG: 547,
    },
    DanhSachMay: [
      [
        "TB-LEN-SONY-1635GM2-01",
        "DEMO-SEL1635GM2-001",
        "TRUNG_TAM",
        "Tủ LEN-A · Ngăn 03",
      ],
    ],
  },
  {
    MaAnh: null,
    MaMau: "SONY SEL70200GM2",
    TenMau: "Sony SEL70200GM2",
    TenThietBi: "Sony FE 70–200mm F2.8 GM OSS II",
    MaDanhMuc: "ONG_KINH",
    ThoiGianKiemTraSauSuDungPhut: 15,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1666363-REG/sony_fe_70_200mm_f_2_8_gm.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "Sony",
      model: "SEL70200GM2",
      ngamOngKinh: "SONY_E",
      dinhDangCamBien: "FULL_FRAME",
      tieuCuNhoNhatMm: 70,
      tieuCuLonNhatMm: 200,
      khauDoLonNhat: 2.8,
      khauDoNhoNhat: 22,
      soLaKhauDo: 11,
      chongRungQuangHoc: true,
      khoangLayNetGanNhatM: 0.4,
      duongKinhKinhLocMm: 77,
      kichThuocMm: "88 x 200",
      khoiLuongG: 1045,
    },
    DanhSachMay: [
      [
        "TB-LEN-SONY-70200GM2-01",
        "DEMO-SEL70200GM2-001",
        "TRUNG_TAM",
        "Tủ LEN-A · Ngăn 04",
      ],
    ],
  },
  {
    MaAnh: "SONY-SEL35F14GM",
    MaMau: "SONY SEL35F14GM",
    TenMau: "Sony SEL35F14GM",
    TenThietBi: "Sony FE 35mm F1.4 GM",
    MaDanhMuc: "ONG_KINH",
    ThoiGianKiemTraSauSuDungPhut: 10,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1613424-REG/sony_fe35f14gm_fe_35mm_f_1_4_gm.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "Sony",
      model: "SEL35F14GM",
      ngamOngKinh: "SONY_E",
      dinhDangCamBien: "FULL_FRAME",
      tieuCuNhoNhatMm: 35,
      tieuCuLonNhatMm: 35,
      khauDoLonNhat: 1.4,
      khauDoNhoNhat: 16,
      soLaKhauDo: 11,
      chongRungQuangHoc: false,
      khoangLayNetGanNhatM: 0.25,
      duongKinhKinhLocMm: 67,
      kichThuocMm: "76 x 96",
      khoiLuongG: 524,
    },
    DanhSachMay: [
      [
        "TB-LEN-SONY-35GM-01",
        "DEMO-SEL35F14GM-001",
        "PHIA_DONG",
        "Tủ LEN-A · Ngăn 05",
      ],
    ],
  },
  {
    MaAnh: "SONY-SEL85F14GM",
    MaMau: "SONY SEL85F14GM",
    TenMau: "Sony SEL85F14GM",
    TenThietBi: "Sony FE 85mm F1.4 GM",
    MaDanhMuc: "ONG_KINH",
    ThoiGianKiemTraSauSuDungPhut: 10,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1222775-REG/sony_sel85f14gm_fe_85mm_f_1_4_gm.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "Sony",
      model: "SEL85F14GM",
      ngamOngKinh: "SONY_E",
      dinhDangCamBien: "FULL_FRAME",
      tieuCuNhoNhatMm: 85,
      tieuCuLonNhatMm: 85,
      khauDoLonNhat: 1.4,
      khauDoNhoNhat: 16,
      soLaKhauDo: 11,
      chongRungQuangHoc: false,
      khoangLayNetGanNhatM: 0.8,
      duongKinhKinhLocMm: 77,
      kichThuocMm: "89.5 x 107.5",
      khoiLuongG: 820,
    },
    DanhSachMay: [
      [
        "TB-LEN-SONY-85GM-01",
        "DEMO-SEL85F14GM-001",
        "PHIA_DONG",
        "Tủ LEN-A · Ngăn 06",
      ],
    ],
  },
  {
    MaAnh: "CANON-RF70200F28L",
    MaMau: "CANON RF70-200MM F2.8 L IS USM",
    TenMau: "Canon RF70-200mm F2.8 L IS USM",
    TenThietBi: "Canon RF 70–200mm F2.8 L IS USM",
    MaDanhMuc: "ONG_KINH",
    ThoiGianKiemTraSauSuDungPhut: 15,
    NguonThamKhaoUrl: "https://global.canon/en/c-museum/product/rf486.html",
    ThongSoKyThuat: {
      thuongHieu: "Canon",
      model: "RF70-200mm F2.8 L IS USM",
      ngamOngKinh: "CANON_RF",
      dinhDangCamBien: "FULL_FRAME",
      tieuCuNhoNhatMm: 70,
      tieuCuLonNhatMm: 200,
      khauDoLonNhat: 2.8,
      khauDoNhoNhat: 32,
      layNetTuDong: "NANO_USM",
      khoangLayNetGanNhatM: 0.7,
      duongKinhKinhLocMm: 77,
      kichThuocMm: "89.9 x 146",
      khoiLuongG: 1070,
    },
    DanhSachMay: [
      [
        "TB-LEN-CANON-RF70200-01",
        "DEMO-RF70200L-001",
        "PHIA_DONG",
        "Tủ LEN-B · Ngăn 03",
      ],
    ],
  },
  {
    MaAnh: "SIGMA-1835F18ART",
    MaMau: "SIGMA A013 EF",
    TenMau: "Sigma 18-35mm F1.8 DC HSM Art (ngàm Canon EF)",
    TenThietBi: "Sigma 18-35mm F1.8 DC HSM Art (ngàm Canon EF)",
    MaDanhMuc: "ONG_KINH",
    ThoiGianKiemTraSauSuDungPhut: 15,
    NguonThamKhaoUrl: "https://www.sigma-global.com/en/lenses/a013_18_35_18/",
    ThongSoKyThuat: {
      thuongHieu: "Sigma",
      model: "18-35mm F1.8 DC HSM | Art",
      ngamOngKinh: "CANON_EF",
      dinhDangCamBien: "APS_C",
      tieuCuNhoNhatMm: 18,
      tieuCuLonNhatMm: 35,
      khauDoLonNhat: 1.8,
      khauDoNhoNhat: 16,
      soLaKhauDo: 9,
      layNetTuDong: "HSM",
      khoangLayNetGanNhatM: 0.28,
      duongKinhKinhLocMm: 72,
      kichThuocMm: "78 x 121",
      khoiLuongG: 810,
    },
    DanhSachMay: [
      [
        "TB-LEN-SIGMA-1835-01",
        "DEMO-A013-EF-001",
        "TRUNG_TAM",
        "Tủ LEN-B · Ngăn 04",
      ],
    ],
  },

  // ---------------------------------------------------------------- chiếu sáng
  {
    MaAnh: null,
    MaMau: "APUTURE LS 300D II",
    TenMau: "Aputure LS 300d II",
    TenThietBi: "Aputure LS 300d II",
    MaDanhMuc: "CHIEU_SANG",
    ThoiGianKiemTraSauSuDungPhut: 25,
    NguonThamKhaoUrl: "https://aputure.com/en-US/products/ls-300d-ii",
    ThongSoKyThuat: {
      thuongHieu: "Aputure",
      model: "LS 300d II",
      loaiDen: "COB_LED_DIEM",
      congSuatDauRaW: 300,
      congSuatTieuThuToiDaW: 350,
      doRoiLux: "45000 tại 1 m với Hyper Reflector",
      nhietDoMauK: "5600 ± 200",
      hoTroRgb: false,
      cri: 96,
      tlci: 96,
      daiDieuChinhPhanTram: "0-100",
      phuongThucDieuKhien: [
        "TRUC_TIEP",
        "SIDUS_LINK",
        "DMX512",
        "REMOTE_2_4GHZ",
      ],
      tuyChonNguon: ["AC_100_240V", "V_MOUNT", "GOLD_MOUNT"],
      ngamPhuKien: "BOWENS",
      khoiLuongDauDenG: 3200,
    },
    DanhSachMay: [
      [
        "TB-LGT-APUTURE-300D2-01",
        "DEMO-LS300D2-001",
        "TRUNG_TAM",
        "Kệ LGT-A · Vị trí 03",
      ],
    ],
  },
  {
    MaAnh: null,
    MaMau: "APUTURE NOVA P300C",
    TenMau: "Aputure Nova P300c",
    TenThietBi: "Aputure Nova P300c",
    MaDanhMuc: "CHIEU_SANG",
    ThoiGianKiemTraSauSuDungPhut: 30,
    NguonThamKhaoUrl: "https://aputure.com/en-US/products/nova-p300c",
    ThongSoKyThuat: {
      thuongHieu: "Aputure",
      model: "Nova P300c",
      loaiDen: "LED_PANEL_RGBWW",
      congSuatDauRaW: 300,
      congSuatTieuThuToiDaW: 360,
      doRoiLux: "Trên 9000 tại 1 m",
      gocChieuDo: 120,
      nhietDoMauK: "2000-10000",
      hoTroRgb: true,
      cri: 95,
      tlci: 95,
      phuongThucDieuKhien: ["TRUC_TIEP", "SIDUS_LINK", "DMX512"],
      tuyChonNguon: ["AC_100_240V", "DC_24_48V"],
      kichThuocMm: "561.9 x 457 x 166",
      khoiLuongG: 10350,
    },
    DanhSachMay: [
      [
        "TB-LGT-APUTURE-P300C-01",
        "DEMO-NOVAP300C-001",
        "PHIA_DONG",
        "Kệ LGT-B · Vị trí 01",
      ],
    ],
  },

  // ---------------------------------------------------------------- micro
  {
    MaAnh: "SENNHEISER-MKH416",
    MaMau: "SENNHEISER MKH 416",
    TenMau: "Sennheiser MKH 416",
    TenThietBi: "Sennheiser MKH 416",
    MaDanhMuc: "MICRO",
    ThoiGianKiemTraSauSuDungPhut: 10,
    NguonThamKhaoUrl:
      "https://docs.cloud.sennheiser.com/en-us/mkh-416-mkh-418-s/specs-mkh-416.html",
    ThongSoKyThuat: {
      thuongHieu: "Sennheiser",
      model: "MKH 416",
      loaiThietBiAmThanh: "MICRO_CONDENSER_RF",
      huongThu: "SUPER_CARDIOID_LOBAR",
      dapTuyenTanSoHz: "40-20000",
      doNhay: "25 mV/Pa ± 1 dB",
      ketNoiAmThanh: "XLR_3_PIN",
      nguonPhantomV: 48,
      kichThuocMm: "19 x 250",
      khoiLuongG: 175,
    },
    DanhSachMay: [
      [
        "TB-MIC-SENN-MKH416-01",
        "DEMO-MKH416-001",
        "PHIA_DONG",
        "Tủ AUD-A · Ngăn 03",
      ],
    ],
  },
  {
    MaAnh: null,
    MaMau: "DEITY S-MIC 2",
    TenMau: "Deity S-Mic 2",
    TenThietBi: "Deity S-Mic 2",
    MaDanhMuc: "MICRO",
    ThoiGianKiemTraSauSuDungPhut: 10,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1424787-REG/deity_microphones_smic_s_mic_shotgun_mic.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "Deity",
      model: "S-Mic 2",
      loaiThietBiAmThanh: "MICRO_SHOTGUN_CONDENSER",
      huongThu: "SUPER_CARDIOID",
      dapTuyenTanSoHz: "50-20000",
      ketNoiAmThanh: "XLR_3_PIN",
      coDay: true,
      nguonPhantomV: 48,
      kichThuocMm: "19 x 250",
      khoiLuongG: 198,
    },
    DanhSachMay: [
      [
        "TB-MIC-DEITY-SMIC2-01",
        "DEMO-SMIC2-001",
        "TRUNG_TAM",
        "Tủ AUD-A · Ngăn 04",
      ],
    ],
  },
  {
    MaAnh: "RODE-WIRELESSGO2",
    MaMau: "RØDE WIRELESS GO II",
    TenMau: "RØDE Wireless GO II",
    TenThietBi: "RØDE Wireless GO II",
    MaDanhMuc: "MICRO",
    ThoiGianKiemTraSauSuDungPhut: 10,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1622642-REG/rode_wigoii_wireless_go_ii_compact.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "RØDE",
      model: "Wireless GO II",
      loaiThietBiAmThanh: "HE_THONG_KHONG_DAY_2_KENH",
      huongThu: "OMNIDIRECTIONAL",
      ketNoiAmThanh: ["TRS_3_5_MM", "USB_C"],
      coDay: false,
      tanSoTruyen: "2.4 GHz kỹ thuật số, mã hóa 128-bit",
      tamPhatM: 200,
      thoiGianPinGio: 7,
      kichThuocMm: "45 x 44 x 18",
      khoiLuongG: 30,
    },
    DanhSachMay: [
      [
        "TB-MIC-RODE-WGO2-01",
        "DEMO-WIGOII-001",
        "TRUNG_TAM",
        "Tủ AUD-A · Ngăn 05",
      ],
    ],
  },
  {
    MaAnh: null,
    MaMau: "SENNHEISER EW 112P G4-A",
    TenMau: "Sennheiser EW 112P G4-A",
    TenThietBi: "Sennheiser EW 112P G4 (bộ micro cài áo ME 2-II)",
    MaDanhMuc: "MICRO",
    ThoiGianKiemTraSauSuDungPhut: 10,
    NguonThamKhaoUrl:
      "https://www.sennheiser.com/en-us/catalog/products/wireless-systems/ew-112p-g4/ew-112p-g4-a-509507",
    ThongSoKyThuat: {
      thuongHieu: "Sennheiser",
      model: "EW 112P G4-A",
      loaiThietBiAmThanh: "HE_THONG_KHONG_DAY_UHF",
      huongThu: "OMNIDIRECTIONAL",
      dapTuyenTanSoHz: "80-18000",
      ketNoiAmThanh: "JACK_3_5_MM",
      coDay: false,
      tanSoTruyen: "UHF 516-558 MHz (dải A)",
      tamPhatM: 100,
      thoiGianPinGio: 8,
      kichThuocMm: "82 x 64 x 24",
      khoiLuongG: 160,
    },
    DanhSachMay: [
      [
        "TB-MIC-SENN-EW112-01",
        "DEMO-EW112PG4-001",
        "PHIA_DONG",
        "Tủ AUD-A · Ngăn 06",
      ],
    ],
  },

  // ---------------------------------------------------------------- máy ghi âm
  {
    MaAnh: null,
    MaMau: "ZOOM F8N PRO",
    TenMau: "Zoom F8n Pro",
    TenThietBi: "Zoom F8n Pro",
    MaDanhMuc: "MAY_GHI_AM",
    ThoiGianKiemTraSauSuDungPhut: 20,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1692954-REG/zoom_zf8npro_8_channel_field_recorder_with.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "Zoom",
      model: "F8n Pro",
      loaiThietBiAmThanh: "MAY_GHI_AM_HIEN_TRUONG",
      soKenhDauVao: 8,
      soTrackGhiDongThoi: 10,
      ketNoiAmThanh: [
        "XLR_TRS_COMBO",
        "TA3_LINE_OUT",
        "LINE_OUT_3_5_MM",
        "HEADPHONE_6_3_MM",
      ],
      nguonPhantomV: 48,
      tanSoLayMauKhz: "44.1-192",
      doSauBit: [16, 24, "32_BIT_FLOAT"],
      dongBoTimecode: "BNC_VAO_RA",
      phuongTienGhi: "SD_SDHC_SDXC",
      kichThuocMm: "178.2 x 140.3 x 54.3",
      khoiLuongG: 1200,
    },
    DanhSachMay: [
      [
        "TB-REC-ZOOM-F8NPRO-01",
        "DEMO-F8NPRO-001",
        "TRUNG_TAM",
        "Tủ AUD-B · Ngăn 02",
      ],
    ],
  },
  {
    MaAnh: null,
    MaMau: "SOUND DEVICES MIXPRE-6 II",
    TenMau: "Sound Devices MixPre-6 II",
    TenThietBi: "Sound Devices MixPre-6 II",
    MaDanhMuc: "MAY_GHI_AM",
    ThoiGianKiemTraSauSuDungPhut: 20,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1503005-REG/sound_devices_mixpre_6_ii_6_channel.html/specs",
    ThongSoKyThuat: {
      thuongHieu: "Sound Devices",
      model: "MixPre-6 II",
      loaiThietBiAmThanh: "MAY_GHI_AM_HIEN_TRUONG",
      soKenhDauVao: 4,
      soTrackGhiDongThoi: 8,
      ketNoiAmThanh: [
        "XLR_TRS_COMBO",
        "AUX_IN_3_5_MM",
        "LINE_OUT_3_5_MM",
        "HEADPHONE_3_5_MM",
      ],
      nguonPhantomV: 48,
      tanSoLayMauKhz: "44.1-192",
      doSauBit: [16, 24, "32_BIT_FLOAT"],
      dongBoTimecode: "SMPTE_VAO_RA_3_5_MM",
      phuongTienGhi: "SD_SDHC_SDXC",
      kichThuocMm: "166 x 36 x 118",
      khoiLuongG: 600,
    },
    DanhSachMay: [
      [
        "TB-REC-SD-MIXPRE6-01",
        "DEMO-MIXPRE6II-001",
        "PHIA_DONG",
        "Tủ AUD-B · Ngăn 03",
      ],
    ],
  },

  // ---------------------------------------------------------------- phụ kiện
  {
    MaAnh: null,
    MaMau: "DJI RS 3 PRO",
    TenMau: "DJI RS 3 Pro",
    TenThietBi: "DJI RS 3 Pro",
    MaDanhMuc: "PHU_KIEN",
    ThoiGianKiemTraSauSuDungPhut: 15,
    NguonThamKhaoUrl: "https://www.dji.com/support/product/rs-3-pro",
    ThongSoKyThuat: {
      thuongHieu: "DJI",
      model: "RS 3 Pro",
      loaiPhuKien: "GIMBAL_3_TRUC",
      taiTrongThuNghiemKg: 4.5,
      thoiGianPinGio: 12,
      dungLuongPinMah: 1950,
      ketNoi: ["USB_C", "RSS", "BLUETOOTH"],
      khoiLuongG: 1143,
    },
    DanhSachMay: [
      [
        "TB-ACC-DJI-RS3PRO-01",
        "DEMO-RS3PRO-001",
        "TRUNG_TAM",
        "Tủ ACC-A · Ngăn 02",
      ],
    ],
  },
];

// Máy thứ hai của các mẫu đã có trong `doan` (sao chép mẫu và thông số từ máy #01),
// để trình bày gợi ý thay bằng máy cùng mẫu (điểm tương đồng 100%).
export const DanhSachMayCungMau: Array<{
  MaQRGoc: string;
  MaQR: string;
  SoSeri: string;
  MaKho: MaKho;
  ViTriKho: string;
}> = [
  {
    MaQRGoc: "TB-CAM-SONY-FX3-01",
    MaQR: "TB-CAM-SONY-FX3-02",
    SoSeri: "DEMO-ILME-FX3-002",
    MaKho: "PHIA_DONG",
    ViTriKho: "Tủ CAM-B · Ngăn 05",
  },
  {
    MaQRGoc: "TB-LEN-SONY-2470GM2-01",
    MaQR: "TB-LEN-SONY-2470GM2-02",
    SoSeri: "DEMO-SEL2470GM2-002",
    MaKho: "PHIA_DONG",
    ViTriKho: "Tủ LEN-A · Ngăn 07",
  },
  {
    MaQRGoc: "TB-LGT-APUTURE-600D-01",
    MaQR: "TB-LGT-APUTURE-600D-02",
    SoSeri: "DEMO-LS600DPRO-002",
    MaKho: "PHIA_DONG",
    ViTriKho: "Kệ LGT-B · Vị trí 02",
  },
  {
    MaQRGoc: "TB-MIC-RODE-NTG5-01",
    MaQR: "TB-MIC-RODE-NTG5-02",
    SoSeri: "DEMO-RODE-NTG5-002",
    MaKho: "TRUNG_TAM",
    ViTriKho: "Tủ AUD-A · Ngăn 07",
  },
];

// Ảnh Cloudinary (giấy phép mở, xem docs/NguonAnhThietBi.md) cho máy đã có trong `doan`.
export const AnhChoMayDaCo: Record<string, string> = {
  "TB-CAM-SONY-FX3-01": "SONY-FX3",
  "TB-CAM-SONY-FX6-01": "SONY-FX6",
  "TB-CAM-SONY-A7IV-01": "SONY-A7IV",
  "TB-ACC-SIGMA-MC11-01": "SIGMA-MC11",
  "TB-LEN-SONY-24105G-01": "SONY-SEL24105G",
  "TB-LEN-SONY-2470GM2-01": "SONY-SEL2470GM2",
  "TB-LEN-CANON-RF2470-01": "CANON-RF2470F28L",
  "TB-LEN-SIGMA-EF2470-01": "SIGMA-EF2470ART",
  "TB-LGT-AMARAN-300C-01": "AMARAN-300C",
  "TB-MIC-SENN-MKE600-01": "SENNHEISER-MKE600",
  "TB-REC-ZOOM-F6-01": "ZOOM-F6",
};
