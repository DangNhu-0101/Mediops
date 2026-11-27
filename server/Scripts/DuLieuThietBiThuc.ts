// Danh mục thiết bị có thật, bổ sung cho dữ liệu nền của prisma/Seed.ts.
// Thông số lấy từ trang thông số của hãng hoặc nhà phân phối; URL nguồn
// được lưu vào cột NguonThamKhaoUrl để tra cứu lại. Ngày tra cứu: 16/11/2026.
// Khóa thông số dùng đúng bộ từ vựng của Seed.ts (ngamOngKinh, loaiCamBien,
// tocDoKhungHinh4KToiDaFps...) để thuật toán gợi ý so sánh được với máy gốc.
// Số sê-ri do kịch bản sinh có tiền tố MAU- vì là dữ liệu mô phỏng.

export type MaDanhMucThuc =
  | "MAY_QUAY"
  | "ONG_KINH"
  | "CHIEU_SANG"
  | "MICRO"
  | "MAY_GHI_AM"
  | "PHU_KIEN";

export interface ThietBiThuc {
  Ma: string;
  TenThietBi: string;
  MaDanhMuc: MaDanhMucThuc;
  ThoiGianKiemTraSauSuDungPhut: number;
  NguonThamKhaoUrl: string;
  ThongSoKyThuat: Record<string, unknown>;
}

export const DanhSachThietBiThuc: ThietBiThuc[] = [
  // ---------------- Máy quay ----------------
  {
    Ma: "SONY-A7SIII",
    TenThietBi: "Sony Alpha 7S III",
    MaDanhMuc: "MAY_QUAY",
    ThoiGianKiemTraSauSuDungPhut: 30,
    NguonThamKhaoUrl:
      "https://www.sony.co.in/interchangeable-lens-cameras/products/ilce-7sm3/spec",
    ThongSoKyThuat: {
      thuongHieu: "Sony",
      model: "ILCE-7SM3",
      ngamOngKinh: "SONY_E",
      loaiCamBien: "CMOS_EXMOR_R_FULL_FRAME",
      kichThuocCamBienMm: "35.6 x 23.8",
      doPhanGiaiHieuDungMp: 12.1,
      doPhanGiaiVideoToiDa: "UHD_4K_3840_X_2160",
      tocDoKhungHinh4KToiDaFps: 120,
      doSauBitToiDa: 10,
      layMauMauToiDa: "4:2:2",
      codecVideo: ["XAVC_HS_H265", "XAVC_S_H264", "XAVC_SI_H264"],
      isoVideo: "80-102400; mở rộng 80-409600",
      daiTuongPhanStop: "15+",
      chongRungThanMay: "5_TRUC",
      layNetTuDong: "FAST_HYBRID_AF_759_DIEM",
      theNho: ["CFEXPRESS_TYPE_A", "SD_UHS_I_II"],
      ketNoi: ["HDMI_TYPE_A", "USB_C", "MIC_3_5_MM", "WIFI"],
      kichThuocMm: "128.9 x 96.9 x 80.8",
      khoiLuongThanMayG: 699,
    },
  },
  {
    Ma: "SONY-FX30",
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
      doPhanGiaiHieuDungMp: 26.1,
      doPhanGiaiVideoToiDa: "UHD_4K_3840_X_2160",
      tocDoKhungHinh4KToiDaFps: 120,
      doSauBitToiDa: 10,
      layMauMauToiDa: "4:2:2",
      codecVideo: ["XAVC_HS_H265", "XAVC_S_H264", "XAVC_SI_H264"],
      isoVideo: "100-32000; ISO cơ sở kép 800/2500 với S-Log3",
      daiTuongPhanStop: "14+",
      chongRungThanMay: "5_TRUC",
      layNetTuDong: "FAST_HYBRID_AF",
      theNho: ["CFEXPRESS_TYPE_A", "SD_UHS_I_II"],
      ketNoi: ["HDMI_TYPE_A", "USB_C", "XLR_TRS_QUA_TAY_CAM", "WIFI"],
      kichThuocMm: "129.7 x 77.8 x 84.5",
      khoiLuongThanMayG: 562,
    },
  },
  {
    Ma: "CANON-C70",
    TenThietBi: "Canon EOS C70",
    MaDanhMuc: "MAY_QUAY",
    ThoiGianKiemTraSauSuDungPhut: 40,
    NguonThamKhaoUrl:
      "https://www.canon.co.uk/video-cameras/eos-c70/specifications/",
    ThongSoKyThuat: {
      thuongHieu: "Canon",
      model: "EOS C70",
      ngamOngKinh: "CANON_RF",
      loaiCamBien: "CMOS_SUPER_35_DGO",
      kichThuocCamBienMm: "26.2 x 13.8",
      doPhanGiaiHieuDungMp: 8.85,
      doPhanGiaiVideoToiDa: "DCI_4K_4096_X_2160",
      tocDoKhungHinh4KToiDaFps: 120,
      doSauBitToiDa: 10,
      layMauMauToiDa: "4:2:2",
      codecVideo: ["XF_AVC", "MP4_HEVC", "MP4_H264"],
      isoVideo: "160-25600; mở rộng 100-102400",
      daiTuongPhanStop: "16+",
      chongRungThanMay: "DIEN_TU",
      layNetTuDong: "DUAL_PIXEL_CMOS_AF",
      theNho: ["SD_UHS_II"],
      ketNoi: ["HDMI_TYPE_A", "MINI_XLR", "BNC_TIMECODE", "USB_C"],
      kichThuocMm: "160 x 130 x 116",
      khoiLuongThanMayG: 1170,
    },
  },
  {
    Ma: "PANASONIC-S5II",
    TenThietBi: "Panasonic LUMIX S5II",
    MaDanhMuc: "MAY_QUAY",
    ThoiGianKiemTraSauSuDungPhut: 20,
    NguonThamKhaoUrl:
      "https://panasonic.com/ca/consumer/cameras-camcorders/mirrorless-cameras/full-frame/dc-s5m2.html",
    ThongSoKyThuat: {
      thuongHieu: "Panasonic",
      model: "DC-S5M2",
      ngamOngKinh: "L_MOUNT",
      loaiCamBien: "CMOS_FULL_FRAME",
      kichThuocCamBienMm: "35.6 x 23.8",
      doPhanGiaiHieuDungMp: 24.2,
      doPhanGiaiVideoToiDa: "DCI_4K_4096_X_2160",
      tocDoKhungHinh4KToiDaFps: 60,
      doSauBitToiDa: 10,
      layMauMauToiDa: "4:2:2",
      codecVideo: ["H265_HEVC", "H264_AVC"],
      chongRungThanMay: "5_TRUC",
      layNetTuDong: "PHASE_HYBRID_AF",
      theNho: ["SD_UHS_II"],
      ketNoi: ["HDMI_TYPE_A", "USB_C", "MIC_3_5_MM", "WIFI", "BLUETOOTH"],
      kichThuocMm: "134.3 x 102.3 x 90.1",
      khoiLuongThanMayG: 657,
    },
  },
  // ---------------- Ống kính ----------------
  {
    Ma: "SONY-SEL1635GM2",
    TenThietBi: "Sony FE 16–35mm F2.8 GM II",
    MaDanhMuc: "ONG_KINH",
    ThoiGianKiemTraSauSuDungPhut: 15,
    NguonThamKhaoUrl: "https://store.sony.com.au/lenses-g-lens/SEL1635GM2.html",
    ThongSoKyThuat: {
      thuongHieu: "Sony",
      model: "SEL1635GM2",
      ngamOngKinh: "SONY_E",
      dinhDangCamBien: "FULL_FRAME",
      tieuCuNhoNhatMm: 16,
      tieuCuLonNhatMm: 35,
      khauDoLonNhat: 2.8,
      khauDoNhoNhat: 22,
      layNetTuDong: "XD_LINEAR_MOTOR",
      chongRungQuangHoc: false,
      khoangLayNetGanNhatM: 0.22,
      duongKinhKinhLocMm: 82,
      kichThuocMm: "87.8 x 111.5",
      khoiLuongG: 547,
    },
  },
  {
    Ma: "SONY-SEL70200GM2",
    TenThietBi: "Sony FE 70–200mm F2.8 GM OSS II",
    MaDanhMuc: "ONG_KINH",
    ThoiGianKiemTraSauSuDungPhut: 20,
    NguonThamKhaoUrl:
      "https://sansmirror.com/lenses/lens-database/lenses-from-camera-makers/sony-fe-mount/sony-70-200mm-f28-gm-oss-ii.html",
    ThongSoKyThuat: {
      thuongHieu: "Sony",
      model: "SEL70200GM2",
      ngamOngKinh: "SONY_E",
      dinhDangCamBien: "FULL_FRAME",
      tieuCuNhoNhatMm: 70,
      tieuCuLonNhatMm: 200,
      khauDoLonNhat: 2.8,
      khauDoNhoNhat: 22,
      layNetTuDong: "XD_LINEAR_MOTOR",
      chongRungQuangHoc: true,
      khoangLayNetGanNhatM: "0.40-0.82",
      duongKinhKinhLocMm: 77,
      kichThuocMm: "88 x 200",
      khoiLuongG: 1045,
    },
  },
  {
    Ma: "CANON-RF70200F28L",
    TenThietBi: "Canon RF 70–200mm F2.8 L IS USM",
    MaDanhMuc: "ONG_KINH",
    ThoiGianKiemTraSauSuDungPhut: 20,
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
      chongRungQuangHoc: true,
      khoangLayNetGanNhatM: 0.7,
      duongKinhKinhLocMm: 77,
      kichThuocMm: "89.9 x 146",
      khoiLuongG: 1070,
    },
  },
  // ---------------- Chiếu sáng ----------------
  {
    Ma: "APUTURE-LS300D2",
    TenThietBi: "Aputure LS 300d II",
    MaDanhMuc: "CHIEU_SANG",
    ThoiGianKiemTraSauSuDungPhut: 25,
    NguonThamKhaoUrl:
      "https://shop.aputure.com/collections/video-production/products/ls-300d-ii",
    ThongSoKyThuat: {
      thuongHieu: "Aputure",
      model: "LS 300d II",
      loaiDen: "COB_LED_DIEM",
      congSuatDauRaW: 300,
      congSuatTieuThuToiDaW: 350,
      doRoiLux: "45000 tại 1 m với Hyper Reflector",
      nhietDoMauK: "5600",
      hoTroRgb: false,
      cri: 96,
      tlci: 97,
      daiDieuChinhPhanTram: "0-100",
      phuongThucDieuKhien: ["TRUC_TIEP", "SIDUS_LINK", "DMX512"],
      tuyChonNguon: ["AC_100_240V", "V_MOUNT", "GOLD_MOUNT"],
      ngamPhuKien: "BOWENS",
    },
  },
  {
    Ma: "NANLITE-FORZA500II",
    TenThietBi: "Nanlite Forza 500 II",
    MaDanhMuc: "CHIEU_SANG",
    ThoiGianKiemTraSauSuDungPhut: 30,
    NguonThamKhaoUrl:
      "https://www.videocraft.com.au/nanlite-forza-500-ii-daylight-led-monolight",
    ThongSoKyThuat: {
      thuongHieu: "Nanlite",
      model: "Forza 500 II",
      loaiDen: "COB_LED_DIEM",
      congSuatDauRaW: 500,
      congSuatTieuThuToiDaW: 560,
      nhietDoMauK: "5600",
      hoTroRgb: false,
      cri: 96,
      tlci: 97,
      daiDieuChinhPhanTram: "0-100",
      phuongThucDieuKhien: ["TRUC_TIEP", "NANLINK", "DMX512"],
      tuyChonNguon: ["AC_100_240V", "V_MOUNT"],
      ngamPhuKien: "BOWENS",
      khoiLuongDauDenG: 3880,
    },
  },
  // ---------------- Micro ----------------
  {
    Ma: "SENNHEISER-MKH416",
    TenThietBi: "Sennheiser MKH 416",
    MaDanhMuc: "MICRO",
    ThoiGianKiemTraSauSuDungPhut: 15,
    NguonThamKhaoUrl:
      "https://docs.cloud.sennheiser.com/en-us/mkh-416-mkh-418-s/specs-mkh-416.html",
    ThongSoKyThuat: {
      thuongHieu: "Sennheiser",
      model: "MKH 416",
      loaiThietBiAmThanh: "MICRO_SHOTGUN_CONDENSER_RF",
      huongThu: "SUPER_CARDIOID_LOBAR",
      dapTuyenTanSoHz: "40-20000",
      doNhay: "25 mV/Pa ± 1 dB",
      ketNoiAmThanh: "XLR_3_PIN",
      coDay: true,
      nguonPhantomV: 48,
      kichThuocMm: "250 x 19",
      khoiLuongG: 175,
    },
  },
  {
    Ma: "DEITY-SMIC2",
    TenThietBi: "Deity S-Mic 2",
    MaDanhMuc: "MICRO",
    ThoiGianKiemTraSauSuDungPhut: 15,
    NguonThamKhaoUrl:
      "https://www.bhphotovideo.com/c/product/1424787-REG/deity_microphones_smic_s_mic_shotgun_mic.html",
    ThongSoKyThuat: {
      thuongHieu: "Deity",
      model: "S-Mic 2",
      loaiThietBiAmThanh: "MICRO_SHOTGUN_CONDENSER",
      huongThu: "SUPER_CARDIOID",
      dapTuyenTanSoHz: "50-20000",
      doNhay: "-32 dB ± 2 dB re 1 V/Pa",
      ketNoiAmThanh: "XLR_3_PIN",
      coDay: true,
      nguonPhantomV: 48,
      kichThuocMm: "250 x 19",
      khoiLuongG: 198,
    },
  },
  // ---------------- Máy ghi âm ----------------
  {
    Ma: "SOUNDDEVICES-MIXPRE6II",
    TenThietBi: "Sound Devices MixPre-6 II",
    MaDanhMuc: "MAY_GHI_AM",
    ThoiGianKiemTraSauSuDungPhut: 20,
    NguonThamKhaoUrl: "https://store.sounddevices.com/product/mixpre-6-ii/",
    ThongSoKyThuat: {
      thuongHieu: "Sound Devices",
      model: "MixPre-6 II",
      loaiThietBiAmThanh: "MAY_GHI_AM_HIEN_TRUONG",
      soKenhDauVao: 4,
      ketNoiAmThanh: [
        "XLR_TRS_COMBO",
        "AUX_IN_3_5_MM",
        "LINE_OUT_3_5_MM",
        "HEADPHONE_3_5_MM",
      ],
      nguonPhantomV: 48,
      tanSoLayMauKhz: [44.1, 48, 96, 192],
      doSauBit: [16, 24, "32_BIT_FLOAT"],
      dongBoTimecode: "LTC_NOI_BO",
      phuongTienGhi: "SD_SDHC_SDXC",
      kichThuocMm: "166 x 36 x 118",
      khoiLuongG: 600,
    },
  },
];

// Các cặp so sánh có kết luận công khai từ nhà sản xuất hoặc báo chí chuyên
// ngành, dùng để đối chiếu thứ hạng gợi ý của hệ thống với thực tế.
export interface CapSoSanhThuc {
  Nhom: string;
  MayGocMaQR: string;
  // Mã QR của máy được kỳ vọng xếp hạng 1; máy bổ sung có mã TB-THUC-<Ma>-01
  KyVongTotNhatMaQR: string;
  CanCu: string;
  NguonCanCu: string;
}

export const DanhSachCapSoSanhThuc: CapSoSanhThuc[] = [
  {
    Nhom: "Máy quay",
    MayGocMaQR: "TB-CAM-SONY-FX3-01",
    KyVongTotNhatMaQR: "TB-THUC-SONY-A7SIII-01",
    CanCu:
      "FX3 về cơ bản là A7S III đặt trong thân máy Cinema Line (cùng cảm biến 12,1 MP, ngàm E).",
    NguonCanCu: "https://www.digitalcameraworld.com/reviews/sony-fx30-review",
  },
  {
    Nhom: "Micro shotgun",
    MayGocMaQR: "TB-MIC-SENN-MKE600-01",
    KyVongTotNhatMaQR: "TB-THUC-SENNHEISER-MKH416-01",
    CanCu:
      "MKH 416 cùng hãng, cùng dải 40–20.000 Hz và hướng thu siêu cardioid/búp như MKE 600.",
    NguonCanCu:
      "https://docs.cloud.sennheiser.com/en-us/mkh-416-mkh-418-s/specs-mkh-416.html",
  },
  {
    Nhom: "Đèn LED",
    MayGocMaQR: "TB-LGT-APUTURE-600D-01",
    KyVongTotNhatMaQR: "TB-THUC-NANLITE-FORZA500II-01",
    CanCu:
      "Forza 500 II cùng phân khúc đèn COB daylight 5600K công suất 500 W, ngàm Bowens, gần LS 600d Pro nhất về công suất.",
    NguonCanCu:
      "https://www.videocraft.com.au/nanlite-forza-500-ii-daylight-led-monolight",
  },
  {
    Nhom: "Ống kính",
    MayGocMaQR: "TB-LEN-SONY-2470GM2-01",
    KyVongTotNhatMaQR: "TB-LEN-SONY-24105G-01",
    CanCu:
      "FE 24–105mm F4 G OSS cùng ngàm E, dải tiêu cự 24–105 mm bao trọn 24–70 mm; đổi lại khẩu độ chậm hơn một stop.",
    NguonCanCu:
      "https://www.sony.com/en-om/electronics/camera-lenses/sel24105g/specifications",
  },
  {
    Nhom: "Máy ghi âm",
    MayGocMaQR: "TB-REC-ZOOM-F6-01",
    KyVongTotNhatMaQR: "TB-THUC-SOUNDDEVICES-MIXPRE6II-01",
    CanCu:
      "Cùng loại máy ghi hiện trường 32-bit float, có timecode, đầu vào XLR/TRS combo.",
    NguonCanCu: "https://store.sounddevices.com/product/mixpre-6-ii/",
  },
];
