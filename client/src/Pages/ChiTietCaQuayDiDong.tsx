import { BieuMauSuCoVanHanh } from "../Components/BieuMauSuCoVanHanh";
import { GioHienThi } from "../Services/SuCoVanHanhService";
import { SuCoVanHanh } from "../Components/SuCoVanHanh";
import { ThongTinYeuCauTaiNguyen } from "../Components/ThongTinYeuCauTaiNguyen";
import { useXacThuc } from "../Contexts/XacThucContext";
import { CoQuyen } from "../Services/QuyenService";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Package,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LayChiTietCaQuay } from "../Services/CaQuayService";
import type { ChiTietCaQuay, PhanCongThietBi } from "../Types/CaQuay";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import { TheoDoiCapNhatLich } from "../Services/SocketLichService";

function DinhDangThoiGian(ThoiGian: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(ThoiGian));
}

function NhanTrangThaiMuonTra(TrangThai: string) {
  if (TrangThai === "DA_XUAT_KHO") return "Đã xuất kho";
  if (TrangThai === "DA_NHAP_KHO") return "Đã nhập kho";
  if (TrangThai === "THAT_LAC") return "Thất lạc";
  return "Chờ xuất kho";
}

export function ChiTietCaQuayDiDong() {
  const { NguoiDung } = useXacThuc();
  const [DangBaoSuCo, SetDangBaoSuCo] = useState(false);
  const { id: Id } = useParams();
  const DieuHuong = useNavigate();
  const [CaQuay, SetCaQuay] = useState<ChiTietCaQuay>();
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");
  const [ThietBiBaoSuCo, SetThietBiBaoSuCo] =
    useState<PhanCongThietBi["ThietBi"]>();

  useEffect(() => {
    const CaQuayId = Id ?? "";
    if (!CaQuayId) return;
    let ConHieuLuc = true;
    async function TaiDuLieu() {
      SetDangTai(true);
      SetLoi("");
      try {
        const DuLieu = await LayChiTietCaQuay(CaQuayId);
        if (ConHieuLuc) SetCaQuay(DuLieu);
      } catch {
        if (ConHieuLuc) {
          SetLoi("Không thể tải ca quay hoặc bạn không có quyền truy cập.");
        }
      } finally {
        if (ConHieuLuc) SetDangTai(false);
      }
    }
    void TaiDuLieu();
    return () => {
      ConHieuLuc = false;
    };
  }, [Id]);
  useEffect(
    () =>
      TheoDoiVanHanh(
        ["kho:xuat-kho", "kho:nhap-kho", "bao_tri:cap_nhat"],
        (DuLieu) => {
          if (Id && (!DuLieu?.CaQuayId || DuLieu.CaQuayId === Id)) {
            void LayChiTietCaQuay(Id)
              .then(SetCaQuay)
              .catch(() => SetLoi("Không thể tải lại ca quay."));
          }
        },
      ),
    [Id],
  );
  useEffect(
    () =>
      TheoDoiCapNhatLich(() => {
        if (!Id) return;
        void LayChiTietCaQuay(Id)
          .then(SetCaQuay)
          .catch(() => SetLoi("Không thể tải lại ca quay."));
      }, Id),
    [Id],
  );

  const CacNhomKho = useMemo(() => {
    const Nhom = new Map<
      string,
      { Kho: PhanCongThietBi["ThietBi"]["Kho"]; DanhSach: PhanCongThietBi[] }
    >();
    CaQuay?.DanhSachThietBi.forEach((PhanCong) => {
      const Khoa = PhanCong.ThietBi.Kho?.Id ?? "chua-co-kho";
      const HienTai = Nhom.get(Khoa) ?? {
        Kho: PhanCong.ThietBi.Kho,
        DanhSach: [],
      };
      HienTai.DanhSach.push(PhanCong);
      Nhom.set(Khoa, HienTai);
    });
    return [...Nhom.values()];
  }, [CaQuay]);

  if (DangTai) {
    return (
      <p className="rounded border border-rail bg-case p-5 text-sm text-fog">
        Đang tải ca quay...
      </p>
    );
  }
  if (Loi || !CaQuay) {
    return (
      <p className="rounded border border-tally/50 bg-tally/10 p-5 text-sm text-paper">
        {Loi || "Không tìm thấy ca quay."}
      </p>
    );
  }

  const Studio =
    CaQuay.PhongStudio?.TenPhong ??
    CaQuay.GhiChuDiaDiem ??
    "Chưa xác định địa điểm";
  const SoThietBiDangMuon = CaQuay.DanhSachThietBi.filter(
    (Muc) => Muc.TrangThaiMuonTra === "DA_XUAT_KHO",
  ).length;

  return (
    <section>
      <button
        className="mb-4 min-h-11 w-full rounded bg-tally px-4 text-paper"
        onClick={() => SetDangBaoSuCo(true)}
      >
        Báo sự cố
      </button>
      <button
        className="flex min-h-11 items-center gap-2 text-sm text-fog"
        onClick={() => DieuHuong("/mobile/ca-quay-cua-toi")}
        type="button"
      >
        <ArrowLeft aria-hidden size={17} /> Quay lại ca quay
      </button>
      <h1 className="mt-3 break-words font-serif text-2xl">{CaQuay.TieuDe}</h1>
      <p className="mt-2 text-sm text-fog">{CaQuay.DuAn.TenDuAn}</p>
      <div className="mt-5 rounded border border-rail bg-case p-4 text-sm text-fog">
        <p className="flex items-center gap-2">
          <CalendarDays aria-hidden size={15} />
          {DinhDangThoiGian(CaQuay.ThoiGianBatDau)} -{" "}
          {DinhDangThoiGian(CaQuay.ThoiGianKetThuc)}
        </p>
        <p className="mt-3 flex items-center gap-2">
          <MapPin aria-hidden size={15} />
          <span className="break-words">{Studio}</span>
        </p>
      </div>

      {SoThietBiDangMuon > 0 ? (
        <button
          hidden={!CoQuyen(NguoiDung, "VanHanhKho.QuanLy")}
          className="mt-4 min-h-12 w-full rounded-sm bg-tally px-4 text-sm font-semibold"
          onClick={() => DieuHuong(`/mobile/quet-nhap-kho/${CaQuay.Id}`)}
          type="button"
        >
          Nhập kho {SoThietBiDangMuon} thiết bị
        </button>
      ) : null}

      <div className="mt-5">
        <ThongTinYeuCauTaiNguyen DanhSach={CaQuay.CacYeuCauHienThi ?? []} />
      </div>
      <h2 className="mt-6 text-lg font-semibold">Thiết bị theo kho</h2>
      <p className="mt-1 text-sm leading-6 text-fog">
        Mỗi kho được xác minh vị trí và xuất thành một lô riêng.
      </p>
      <div className="mt-4 space-y-4">
        {CacNhomKho.length === 0 ? (
          <div className="rounded border border-rail bg-case p-5 text-center text-sm text-fog">
            Ca quay này chưa có thiết bị được phân công.
          </div>
        ) : (
          CacNhomKho.map(({ Kho: Kho, DanhSach: DanhSach }) => {
            const SoChoXuat = DanhSach.filter(
              (Muc) =>
                Muc.TrangThaiMuonTra === "CHO_XUAT_KHO" &&
                !Muc.HieuLucDen &&
                !Muc.LoThayTheId,
            ).length;
            return (
              <article
                className="rounded border border-rail bg-case p-4"
                key={Kho?.Id ?? "chua-co-kho"}
              >
                <div className="flex items-start gap-3">
                  <Warehouse
                    aria-hidden
                    className="mt-0.5 shrink-0 text-blueprint"
                    size={20}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold">
                      {Kho?.TenKho ?? "Chưa gán kho"}
                    </h3>
                    <p className="mt-1 text-sm text-fog">
                      {DanhSach.length} thiết bị, {SoChoXuat} thiết bị chờ xuất
                    </p>
                    {Kho ? (
                      <p className="mt-1 break-words text-xs text-fog">
                        {Kho.DiaChi}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {DanhSach.map((PhanCong) => (
                    <div
                      className="flex items-start gap-3 rounded border border-rail bg-case-2 p-3"
                      key={PhanCong.Id}
                    >
                      {PhanCong.TrangThaiMuonTra === "DA_XUAT_KHO" ? (
                        <CheckCircle2
                          aria-hidden
                          className="mt-0.5 shrink-0 text-phosphor"
                          size={17}
                        />
                      ) : (
                        <Package
                          aria-hidden
                          className="mt-0.5 shrink-0 text-blueprint"
                          size={17}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold">
                          {PhanCong.ThietBi.TenThietBi}
                        </p>
                        <p className="mt-1 break-all font-mono text-[11px] text-fog">
                          {PhanCong.ThietBi.MaQR}
                        </p>
                        <p className="mt-1 text-xs text-fog">
                          {NhanTrangThaiMuonTra(PhanCong.TrangThaiMuonTra)}
                          {PhanCong.HieuLucDen
                            ? ` · Hết hiệu lực sử dụng từ ${GioHienThi(PhanCong.HieuLucDen)}; vẫn cần thu hồi`
                            : PhanCong.HieuLucTu
                              ? ` · Máy thay từ ${GioHienThi(PhanCong.HieuLucTu)}`
                              : ""}
                        </p>
                        {PhanCong.TrangThaiMuonTra === "DA_XUAT_KHO" ? (
                          <button
                            className="mt-2 min-h-11 rounded border border-tally/60 px-3 text-xs font-semibold text-tally"
                            onClick={() => SetThietBiBaoSuCo(PhanCong.ThietBi)}
                            type="button"
                          >
                            Báo sự cố
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {!Kho ? (
                  <div className="mt-4 flex gap-2 rounded border border-timecode/50 bg-timecode/10 p-3 text-sm">
                    <AlertCircle
                      aria-hidden
                      className="mt-0.5 shrink-0 text-timecode"
                      size={17}
                    />
                    <p>
                      Quản lý cần gán kho cho thiết bị trước khi có thể xuất.
                    </p>
                  </div>
                ) : SoChoXuat > 0 ? (
                  <button
                    className="mt-4 min-h-11 w-full rounded-sm bg-tally px-4 text-sm font-semibold"
                    onClick={() =>
                      DieuHuong(
                        `/mobile/quet-xuat-kho/${CaQuay.Id}?KhoId=${encodeURIComponent(Kho.Id)}`,
                      )
                    }
                    type="button"
                  >
                    Xuất thiết bị tại kho này
                  </button>
                ) : (
                  <p className="mt-4 text-sm text-phosphor">
                    Kho này không còn thiết bị chờ xuất.
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>
      {ThietBiBaoSuCo ? (
        <BieuMauSuCoVanHanh
          CaQuayId={CaQuay.Id}
          OnDong={() => SetThietBiBaoSuCo(undefined)}
          ThietBiCoDinh={{ Id: ThietBiBaoSuCo.Id }}
        />
      ) : null}
      {DangBaoSuCo && (
        <BieuMauSuCoVanHanh
          CaQuayId={CaQuay.Id}
          OnDong={() => SetDangBaoSuCo(false)}
        />
      )}
      <SuCoVanHanh CaQuayId={CaQuay.Id} />
    </section>
  );
}
