import { MoiNhanSuPhuongAn } from "./MoiNhanSuPhuongAn";
import {
  DocPhien,
  TaoPhien,
  ChotPhuongAn,
  HuyPhien,
  type PhienQuyetDinh,
} from "../Services/PhienQuyetDinhService";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useXacThuc } from "../Contexts/XacThucContext";
import { CoQuyen } from "../Services/QuyenService";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { TheoDoiVanHanh } from "../Services/SocketVanHanhService";
import {
  CapNhatSuCoVanHanh,
  GioGuiMayChu,
  GioHienThi,
  GioNhapVietNam,
  LayNguCanhSuCo,
  LaySuCoVanHanh,
  PhanTichSuCo,
  ThemAnhVanHanh,
  XacNhanBanGiao,
  type CanhBaoTraTre,
  type AnhHuongSuCo,
  type SuCoVanHanh as DuLieuSuCo,
  type TaiNguyenSuCo,
} from "../Services/SuCoVanHanhService";
import {
  NhanMucAnhHuong,
  NhanTrangThaiSuCo,
} from "../Types/HopDongSuCoVanHanh";
import { BieuMauSuCoVanHanh } from "./BieuMauSuCoVanHanh";

function ChiTietSuCo({
  SuCo,
  OnCapNhat,
}: {
  SuCo: DuLieuSuCo;
  OnCapNhat: () => void;
}) {
  const { NguoiDung } = useXacThuc();
  const [NoiDung, SetNoiDung] = useState("");
  const [HieuLuc, SetHieuLuc] = useState(() =>
    GioNhapVietNam(new Date(Date.now() + 10 * 60000)),
  );
  const [KetThuc, SetKetThuc] = useState(
    SuCo.KetThucAnhHuong ? GioNhapVietNam(new Date(SuCo.KetThucAnhHuong)) : "",
  );
  const [DuKien, SetDuKien] = useState(
    SuCo.DuKienPhucHoi ? GioNhapVietNam(new Date(SuCo.DuKienPhucHoi)) : "",
  );
  const [PhanTich, SetPhanTich] = useState<AnhHuongSuCo>();
  const [Phien, SetPhien] = useState<PhienQuyetDinh>();
  const [HienTai, SetHienTai] = useState(Date.now());
  const DaNapPhien = useRef(false);
  const HieuLucDaSua = useRef(false);
  const LechGio = useRef(0);
  const MocDaTaiLai = useRef("");
  const [TaiNguyen, SetTaiNguyen] = useState<TaiNguyenSuCo[]>([]);
  const [NguoiPhuTrachId, SetNguoiPhuTrach] = useState("");
  const [DaXacNhanGiaoNhan, SetXacNhan] = useState(false);
  const [PhuongAnCho, SetPhuongAnCho] = useState<string>();
  const [DangXuLy, SetDangXuLy] = useState(false);
  const [Loi, SetLoi] = useState("");
  const [Anh, SetAnh] = useState<File[]>([]);
  const [MaLanTai, SetMaLanTai] = useState(() => crypto.randomUUID());
  const CoTheXuLy = CoQuyen(NguoiDung, "SuCo.Sua");
  const DaDong =
    SuCo.TrangThai === "DA_KHOI_PHUC" || SuCo.TrangThai === "DA_HUY";
  useEffect(() => {
    if (!SuCo.CaQuayId) return;
    let Con = true;
    LayNguCanhSuCo({ CaQuayId: SuCo.CaQuayId })
      .then((DuLieu) => {
        if (Con) SetTaiNguyen(DuLieu.TaiNguyen);
      })
      .catch(() => {});
    return () => {
      Con = false;
    };
  }, [SuCo.CaQuayId]);
  const TaiPhien = useCallback(async () => {
    if (!CoTheXuLy || !CoQuyen(NguoiDung, "CaQuay.PhanCong")) return;
    const KetQua = await DocPhien(SuCo.Id);
    SetPhien(KetQua ?? undefined);
    if (KetQua) {
      if (!HieuLucDaSua.current) SetPhanTich(KetQua);
      LechGio.current = Date.parse(KetQua.GioMayChu) - Date.now();
      if (!DaNapPhien.current && !HieuLucDaSua.current)
        SetHieuLuc(GioNhapVietNam(new Date(KetQua.HieuLuc)));
    }
    DaNapPhien.current = true;
  }, [SuCo.Id, CoTheXuLy, NguoiDung]);
  useEffect(() => {
    void TaiPhien().catch((LoiTai) => SetLoi(LayThongBaoLoi(LoiTai)));
    const BoTheoDoi = TheoDoiVanHanh(
      ["loi_moi:cap_nhat", "quyet_dinh:cap_nhat"],
      () => void TaiPhien().catch((LoiTai) => SetLoi(LayThongBaoLoi(LoiTai))),
    );
    const BoDem = setInterval(
      () => SetHienTai(Date.now() + LechGio.current),
      1000,
    );
    return () => {
      BoTheoDoi();
      clearInterval(BoDem);
    };
  }, [TaiPhien]);
  useEffect(() => {
    const Moc = Phien?.GiuCho.filter(
      (Muc) => Date.parse(Muc.HetHanLuc) <= HienTai,
    )
      .map((Muc) => Muc.HetHanLuc)
      .sort()
      .join(",");
    if (Moc && Moc !== MocDaTaiLai.current) {
      MocDaTaiLai.current = Moc;
      void TaiPhien().catch((LoiTai) => SetLoi(LayThongBaoLoi(LoiTai)));
    }
  }, [Phien, HienTai, TaiPhien]);
  const PhienConHan =
    !!Phien &&
    Phien.TrangThaiPhien === "MO" &&
    Phien.NoiDungConHieuLuc &&
    Date.parse(Phien.HetHanLuc) > HienTai;

  async function ThucHien(ThaoTac: () => Promise<unknown>, TaiLai = true) {
    SetDangXuLy(true);
    SetLoi("");
    try {
      await ThaoTac();
      if (TaiLai) {
        SetPhanTich(undefined);
        SetPhuongAnCho(undefined);
        OnCapNhat();
      }
    } catch (LoiThaoTac) {
      SetLoi(LayThongBaoLoi(LoiThaoTac));
    } finally {
      SetDangXuLy(false);
    }
  }
  async function ChuyenTrangThai(TrangThai: DuLieuSuCo["TrangThai"]) {
    if (NoiDung.trim().length < 3) {
      SetLoi("Ghi nội dung xác nhận hoặc lý do trước khi cập nhật.");
      return;
    }
    await ThucHien(() =>
      CapNhatSuCoVanHanh(SuCo.Id, {
        TrangThai,
        NoiDung,
        KetThucAnhHuong: KetThuc ? GioGuiMayChu(KetThuc) : null,
        DuKienPhucHoi: DuKien ? GioGuiMayChu(DuKien) : null,
      }),
    );
  }
  const LopNhap =
    "mt-1 min-h-11 w-full rounded border border-rail bg-case p-2 text-base";
  return (
    <div className="mt-4 space-y-4 border-t border-rail pt-4">
      <p className="text-sm text-fog">
        Xảy ra: {GioHienThi(SuCo.ThoiDiemXayRa)} · Ghi nhận:{" "}
        {GioHienThi(SuCo.NgayTao)}
      </p>
      <p>{NhanMucAnhHuong[SuCo.MucAnhHuong]}</p>
      <ul className="list-disc space-y-1 pl-5">
        {SuCo.TaiNguyen.map((Muc) => (
          <li key={`${Muc.Loai}:${Muc.Id}`}>
            <strong>{Muc.Ten}</strong>
            {Muc.ThanhPhan ? ` · ${Muc.ThanhPhan}` : ""}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        {[
          ...SuCo.DanhSachAnh,
          ...SuCo.BaoTri.flatMap((Muc) => Muc.DanhSachAnh),
        ].map((AnhDaLuu) => (
          <a
            key={AnhDaLuu.Id}
            href={AnhDaLuu.SecureUrl}
            target="_blank"
            rel="noreferrer"
          >
            <img
              src={AnhDaLuu.SecureUrl}
              className="h-24 w-24 rounded object-cover"
              alt="Ảnh bằng chứng sự cố"
            />
          </a>
        ))}
      </div>
      {SuCo.BaoTri.length > 0 && (
        <p className="text-sm text-fog">
          Đã liên kết hồ sơ bảo trì. Khôi phục ca hoặc hủy báo cáo vẫn giữ bảo
          trì và nghĩa vụ trả máy cũ.
        </p>
      )}
      <details>
        <summary className="min-h-11 cursor-pointer">
          Bổ sung ảnh bằng chứng
        </summary>
        <label className="block">
          Tối đa 5 ảnh, mỗi ảnh 5 MB
          <input
            type="file"
            className={LopNhap}
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(SuKien) => {
              SetAnh(Array.from(SuKien.target.files ?? []));
              SetMaLanTai(crypto.randomUUID());
            }}
          />
        </label>
        <button
          className="min-h-11 px-3"
          disabled={DangXuLy || !Anh.length}
          onClick={() =>
            void ThucHien(async () => {
              await ThemAnhVanHanh(SuCo.Id, Anh, MaLanTai);
              SetAnh([]);
            })
          }
        >
          Lưu ảnh
        </button>
      </details>
      {SuCo.CaQuayId && !DaDong && (
        <div className="space-y-3">
          <label className="block">
            Mốc dự kiến bàn giao / hiệu lực thay máy (giờ Việt Nam)
            <input
              type="datetime-local"
              className={LopNhap}
              value={HieuLuc}
              onChange={(SuKien) => {
                HieuLucDaSua.current = true;
                SetHieuLuc(SuKien.target.value);
                SetPhanTich(undefined);
                SetPhuongAnCho(undefined);
              }}
            />
          </label>
          <button
            className="min-h-11 rounded border border-rail px-4"
            disabled={DangXuLy || !HieuLuc}
            onClick={() =>
              void ThucHien(
                async () =>
                  SetPhanTich(
                    await PhanTichSuCo(SuCo.Id, GioGuiMayChu(HieuLuc)),
                  ),
                false,
              )
            }
          >
            Phân tích ảnh hưởng
          </button>
          {CoTheXuLy && CoQuyen(NguoiDung, "CaQuay.PhanCong") && (
            <button
              className="min-h-11 rounded bg-tally px-4 disabled:opacity-50"
              disabled={DangXuLy || !HieuLuc}
              onClick={() =>
                void ThucHien(async () => {
                  const KetQua = await TaoPhien(
                    SuCo.Id,
                    GioGuiMayChu(HieuLuc),
                    !!Phien,
                  );
                  HieuLucDaSua.current = false;
                  SetPhien(KetQua);
                  SetPhanTich(KetQua);
                  SetHieuLuc(GioNhapVietNam(new Date(KetQua.HieuLuc)));
                }, false)
              }
            >
              {Phien
                ? "Tính lại phương án và tạo lượt giữ mới"
                : "Tìm phương án xử lý"}
            </button>
          )}
          {Phien && (
            <div className="space-y-2 text-sm">
              <p>
                {PhienConHan
                  ? "Phiên quyết định đang mở"
                  : "Phiên đã hết hiệu lực; cần tìm lại phương án"}
                . Tính lại sẽ hủy lời mời cũ, yêu cầu nhận lời lại.
              </p>
              {Phien.GiuCho.map((Muc) => (
                <p key={Muc.TaiNguyenId}>
                  Giữ <strong>{Muc.TenTaiNguyen}</strong> đến{" "}
                  {GioHienThi(Muc.HetHanLuc)} ·{" "}
                  {Date.parse(Muc.HetHanLuc) <= HienTai
                    ? "Đã hết hạn giữ; cần kiểm tra và giữ lại khi chốt"
                    : `${Math.ceil((Date.parse(Muc.HetHanLuc) - HienTai) / 1000)} giây còn lại`}
                  {" · "}Dùng từ {GioHienThi(Muc.BatDau)} đến{" "}
                  {GioHienThi(Muc.KetThuc)}
                </p>
              ))}
              <button
                className="min-h-11 underline"
                disabled={DangXuLy}
                onClick={() =>
                  void ThucHien(async () => {
                    await HuyPhien(Phien.PhienId);
                    SetPhien(undefined);
                    SetPhanTich(undefined);
                  }, false)
                }
              >
                Hủy phiên và giải phóng giữ chỗ
              </button>
            </div>
          )}
          {PhanTich && (
            <div className="space-y-4">
              <p className="text-sm text-timecode">{PhanTich.CanhBao}</p>
              {PhanTich.DanhGiaYeuCau && (
                <div>
                  <h4 className="font-semibold">Nhu cầu còn thiếu</h4>
                  <p>
                    {PhanTich.DanhGiaYeuCau.DapUngBatBuoc
                      ? "Hiện chưa thiếu yêu cầu bắt buộc."
                      : PhanTich.DanhGiaYeuCau.DienGiai.join(" ")}
                  </p>
                </div>
              )}
              <div>
                <h4 className="font-semibold">Ca tiếp theo có nguy cơ</h4>
                {PhanTich.CaLienQuan.length ? (
                  <ul className="space-y-2">
                    {PhanTich.CaLienQuan.map((Ca) => (
                      <li key={Ca.Id}>
                        <Link className="underline" to={`/ca-quay/${Ca.Id}`}>
                          {Ca.TieuDe}
                        </Link>{" "}
                        · {GioHienThi(Ca.ThoiGianBatDau)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Chưa ghi nhận ca liên quan.</p>
                )}
                {PhanTich.MocQuyetDinh && (
                  <p className="mt-2">
                    Cần quyết định trước: {GioHienThi(PhanTich.MocQuyetDinh)}
                  </p>
                )}
              </div>
              <h4 className="font-semibold">Phương án xử lý</h4>
              {!PhanTich.DanhSachPhuongAn.length && (
                <p>
                  Chưa có phương án phù hợp. Cần người phụ trách rà soát tác
                  động.
                </p>
              )}
              <div className="grid min-w-0 gap-4 xl:grid-cols-3">
                {PhanTich.DanhSachPhuongAn.map((PhuongAn) => (
                  <article
                    key={PhuongAn.Id}
                    className="space-y-2 border-t border-rail py-3"
                  >
                    <h5 className="font-semibold">{PhuongAn.TieuDe}</h5>
                    {PhuongAn.ThayDoi.ThietBi?.map((Muc) => (
                      <p key={Muc.TuId}>
                        <strong>{Muc.TenThietBiGoc}</strong> →{" "}
                        <strong>{Muc.TenThietBiMoi}</strong>
                      </p>
                    ))}
                    {PhuongAn.ThayDoi.NhanSu?.map((Muc) => (
                      <p key={Muc.TuId}>
                        {Muc.TenNhanSuGoc} → {Muc.TenNhanSuMoi} · Chờ nhận lời
                        và chốt
                      </p>
                    ))}
                    {PhuongAn.ThayDoi.NguoiPhuTrach && (
                      <p>
                        Người phụ trách ca:{" "}
                        {PhuongAn.ThayDoi.NguoiPhuTrach.TenNguoiGoc} →{" "}
                        {PhuongAn.ThayDoi.NguoiPhuTrach.TenNguoiMoi} · Chờ nhận
                        lời và chốt
                      </p>
                    )}
                    {PhuongAn.ThayDoi.Studio && (
                      <p>
                        Đổi sang{" "}
                        <strong>{PhuongAn.ThayDoi.Studio.TenStudio}</strong>
                      </p>
                    )}
                    {PhuongAn.ThayDoi.ThietBiBoSung?.map((Muc) => (
                      <p key={Muc.Id}>
                        Phụ kiện bổ sung: <strong>{Muc.TenThietBi}</strong>
                      </p>
                    ))}
                    <p className="text-sm leading-6">{PhuongAn.GiaiThich}</p>
                    <p className="text-sm">
                      {PhuongAn.ViTriDeXuat ?? "Địa điểm bàn giao cần xác nhận"}
                    </p>
                    <details>
                      <summary className="min-h-11 cursor-pointer">
                        So sánh yêu cầu và đề xuất
                      </summary>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr>
                              {[
                                "Tiêu chí",
                                "Đang cần hoặc thiết bị gốc",
                                "Đề xuất",
                                "Kết luận",
                              ].map((Nhan) => (
                                <th key={Nhan} className="p-2">
                                  {Nhan}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {PhuongAn.SoSanh?.map((Dong) => (
                              <tr key={Dong.TieuChi}>
                                <td className="p-2">{Dong.TieuChi}</td>
                                <td className="p-2">{Dong.DangCan}</td>
                                <td className="p-2">{Dong.DeXuat}</td>
                                <td className="p-2">{Dong.KetLuan}</td>
                              </tr>
                            ))}
                            <tr>
                              <td className="p-2">Yêu cầu bắt buộc</td>
                              <td className="p-2">Đáp ứng toàn bộ</td>
                              <td className="p-2">
                                {PhuongAn.DanhGiaYeuCau?.DienGiai.join(" ") ||
                                  "Theo dữ liệu ca"}
                              </td>
                              <td className="p-2">
                                {PhuongAn.DanhGiaYeuCau?.TrangThai ===
                                "CHUA_DU_DU_LIEU"
                                  ? "Chưa đủ dữ liệu"
                                  : PhuongAn.DanhGiaYeuCau?.DapUngBatBuoc
                                    ? "Đạt yêu cầu"
                                    : "Không đáp ứng"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </details>
                    {Phien && (
                      <MoiNhanSuPhuongAn
                        Phien={Phien}
                        PhuongAn={PhuongAn}
                        OnCapNhat={() =>
                          void TaiPhien().catch((LoiTai) =>
                            SetLoi(LayThongBaoLoi(LoiTai)),
                          )
                        }
                      />
                    )}
                    <p className="text-sm">
                      {PhuongAn.ApDungDuoc
                        ? "Đạt yêu cầu kiểm tra hiện tại"
                        : "Cần xác nhận / chỉ tư vấn"}{" "}
                      · {PhuongAn.XungDotConLai.length} ảnh hưởng còn lại
                    </p>
                    <ul className="list-disc pl-5 text-sm text-fog">
                      {PhuongAn.DanhSachDanhDoi.map((NoiDungDanhDoi) => (
                        <li key={NoiDungDanhDoi}>{NoiDungDanhDoi}</li>
                      ))}
                    </ul>
                    {PhuongAn.ApDungDuoc &&
                      PhienConHan &&
                      CoTheXuLy &&
                      CoQuyen(NguoiDung, "CaQuay.PhanCong") && (
                        <button
                          className="min-h-11 rounded border border-rail px-4"
                          onClick={() => SetPhuongAnCho(PhuongAn.Id)}
                        >
                          Chọn phương án
                        </button>
                      )}
                  </article>
                ))}
              </div>
              {PhuongAnCho && Phien && (
                <fieldset
                  className="space-y-3 border-t border-rail pt-4"
                  disabled={DangXuLy}
                >
                  <legend className="font-semibold">
                    Xác nhận phân công thay thế
                  </legend>
                  <p>
                    Máy cũ vẫn phải thu hồi. Máy mới chỉ được sử dụng sau xuất
                    kho, bàn giao và kiểm tra.
                  </p>
                  <label className="block">
                    Người chịu trách nhiệm thu hồi / bàn giao
                    <select
                      className={LopNhap}
                      value={NguoiPhuTrachId}
                      onChange={(SuKien) =>
                        SetNguoiPhuTrach(SuKien.target.value)
                      }
                    >
                      <option value="">Chọn người trong ca</option>
                      {TaiNguyen.filter((Muc) => Muc.Loai === "NHAN_SU").map(
                        (Muc) => (
                          <option key={Muc.Id} value={Muc.Id}>
                            {Muc.Ten}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="flex min-h-11 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={DaXacNhanGiaoNhan}
                      onChange={(SuKien) => SetXacNhan(SuKien.target.checked)}
                    />
                    Đã xác nhận thời gian chuẩn bị và giao nhận tại mốc đã chọn
                  </label>
                  <button
                    className="min-h-11 rounded bg-tally px-4 text-paper disabled:opacity-50"
                    disabled={
                      !NguoiPhuTrachId || !DaXacNhanGiaoNhan || !PhienConHan
                    }
                    onClick={() =>
                      void ThucHien(() =>
                        ChotPhuongAn(
                          Phien.PhienId,
                          PhuongAnCho,
                          NguoiPhuTrachId,
                        ),
                      )
                    }
                  >
                    Chốt phân công
                  </button>
                </fieldset>
              )}
            </div>
          )}
        </div>
      )}
      {SuCo.LoThayThe.map((Lo) => (
        <div key={Lo.Id} className="space-y-2 border-t border-rail pt-3">
          <p className="font-semibold">
            Lô thay thế · hiệu lực từ {GioHienThi(Lo.ThoiDiemHieuLuc)}
          </p>
          <p className="text-sm">Thu hồi / bàn giao: {Lo.NguoiPhuTrach}</p>
          <p>
            {Lo.ThoiDiemBanGiao
              ? `Đã bàn giao và kiểm tra: ${GioHienThi(Lo.ThoiDiemBanGiao)}`
              : "Chưa xác nhận bàn giao và kiểm tra"}
          </p>
          {!Lo.ThoiDiemBanGiao && (
            <>
              <Link
                className="inline-flex min-h-11 items-center underline"
                to={`/mobile/quet-xuat-kho/${SuCo.CaQuayId}?LoThayTheId=${Lo.Id}`}
              >
                Quét xuất lô bổ sung
              </Link>
              {CoTheXuLy && (
                <button
                  className="min-h-11 px-4 underline"
                  disabled={DangXuLy || NoiDung.trim().length < 3}
                  onClick={() =>
                    void ThucHien(() => XacNhanBanGiao(SuCo.Id, Lo.Id, NoiDung))
                  }
                >
                  Xác nhận đã bàn giao và kiểm tra
                </button>
              )}
            </>
          )}
        </div>
      ))}
      {CoTheXuLy && !DaDong && (
        <fieldset
          disabled={DangXuLy}
          className="space-y-3 border-t border-rail pt-4"
        >
          <legend className="font-semibold">Xử lý và khôi phục ca</legend>
          <label className="block">
            Dự kiến phục hồi
            <input
              type="datetime-local"
              className={LopNhap}
              value={DuKien}
              onChange={(SuKien) => SetDuKien(SuKien.target.value)}
            />
          </label>
          <label className="block">
            Kết thúc gián đoạn đã xác nhận
            <input
              type="datetime-local"
              className={LopNhap}
              value={KetThuc}
              onChange={(SuKien) => SetKetThuc(SuKien.target.value)}
            />
          </label>
          <label className="block">
            Nội dung xác nhận / lý do
            <textarea
              className={LopNhap}
              value={NoiDung}
              maxLength={2000}
              onChange={(SuKien) => SetNoiDung(SuKien.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {SuCo.TrangThai === "MOI_BAO" && (
              <button
                className="min-h-11 rounded bg-tally px-4"
                onClick={() => void ChuyenTrangThai("DA_XAC_MINH")}
              >
                Xác minh sự cố
              </button>
            )}
            {SuCo.TrangThai === "DA_XAC_MINH" && (
              <button
                className="min-h-11 rounded bg-tally px-4"
                onClick={() => void ChuyenTrangThai("DANG_XU_LY")}
              >
                Bắt đầu xử lý
              </button>
            )}
            {SuCo.TrangThai === "DANG_XU_LY" && (
              <button
                className="min-h-11 rounded bg-tally px-4"
                onClick={() => void ChuyenTrangThai("DA_KHOI_PHUC")}
              >
                Xác nhận khôi phục ca
              </button>
            )}
            <button
              className="min-h-11 px-4"
              onClick={() => void ChuyenTrangThai(SuCo.TrangThai)}
            >
              Lưu bổ sung
            </button>
            <button
              className="min-h-11 px-4 text-tally"
              onClick={() => void ChuyenTrangThai("DA_HUY")}
            >
              Báo nhầm / Hủy báo cáo
            </button>
          </div>
        </fieldset>
      )}
      <details>
        <summary className="min-h-11 cursor-pointer">Lịch sử xử lý</summary>
        <ol className="space-y-3">
          {SuCo.LichSu.map((Muc) => (
            <li key={Muc.Id}>
              <p className="text-xs text-fog">
                {GioHienThi(Muc.NgayTao)} · {Muc.NguoiThucHien}
              </p>
              <p>{Muc.NoiDung}</p>
            </li>
          ))}
        </ol>
      </details>
      {DangXuLy && <p role="status">Đang xử lý…</p>}
      {Loi && (
        <p role="alert" className="text-tally">
          {Loi}
        </p>
      )}
    </div>
  );
}

export function SuCoVanHanh({
  CaQuayId,
  ThietBiId,
  DuAnId,
}: {
  CaQuayId?: string;
  ThietBiId?: string;
  DuAnId?: string;
}) {
  const { NguoiDung } = useXacThuc();
  const [DanhSach, SetDanhSach] = useState<DuLieuSuCo[]>([]);
  const [CanhBaoTraTre, SetCanhBaoTraTre] = useState<CanhBaoTraTre[]>([]);
  const [TongSo, SetTongSo] = useState(0);
  const [Trang, SetTrang] = useState(1);
  const [DangTai, SetDangTai] = useState(true);
  const [Loi, SetLoi] = useState("");
  const [DangBao, SetDangBao] = useState(false);
  const [DangMo, SetDangMo] = useState<string>();
  const TaiLai = useCallback(async () => {
    SetDangTai(true);
    SetLoi("");
    try {
      const KetQua = await LaySuCoVanHanh({
        CaQuayId,
        ThietBiId,
        DuAnId,
        Trang,
      });
      SetDanhSach(KetQua.DanhSach);
      SetCanhBaoTraTre(KetQua.CanhBaoTraTre);
      SetTongSo(KetQua.TongSo);
    } catch (LoiTai) {
      SetLoi(LayThongBaoLoi(LoiTai));
    } finally {
      SetDangTai(false);
    }
  }, [CaQuayId, ThietBiId, DuAnId, Trang]);
  useEffect(() => {
    void TaiLai();
  }, [TaiLai]);
  useEffect(
    () =>
      TheoDoiVanHanh(
        ["su_co:cap_nhat", "kho:xuat-kho", "kho:nhap-kho", "bao_tri:cap_nhat"],
        () => void TaiLai(),
      ),
    [TaiLai],
  );
  return (
    <section className="my-5 space-y-4 rounded border border-rail bg-case p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl">Sự cố vận hành</h2>
        {(CaQuayId ||
          (ThietBiId &&
            CoQuyen(NguoiDung, "SuCo.Tao") &&
            CoQuyen(NguoiDung, "ThietBi.Xem"))) && (
          <button
            className="min-h-11 rounded bg-tally px-4 text-paper"
            onClick={() => SetDangBao(true)}
          >
            Báo sự cố
          </button>
        )}
      </div>
      {DangTai && <p role="status">Đang tải sự cố…</p>}
      {Loi && (
        <p role="alert" className="text-tally">
          {Loi}{" "}
          <button className="min-h-11 underline" onClick={() => void TaiLai()}>
            Thử lại
          </button>
        </p>
      )}
      {!DangTai && !Loi && !DanhSach.length && (
        <p className="text-sm text-fog">
          Chưa có sự cố vận hành trong phạm vi này.
        </p>
      )}
      {CanhBaoTraTre.map((Muc) => (
        <p key={Muc.Id} className="text-sm text-timecode">
          {Muc.ThietBi.TenThietBi} chưa nhập kho sau ca “{Muc.CaQuay.TieuDe}”,
          kết thúc {GioHienThi(Muc.CaQuay.ThoiGianKetThuc)}. Cần xác nhận giờ
          trả; hệ thống vẫn giữ khoản mượn mở.
        </p>
      ))}
      {DanhSach.map((SuCo) => (
        <article key={SuCo.Id} className="border-t border-rail pt-3">
          <button
            className="min-h-11 w-full text-left"
            aria-expanded={DangMo === SuCo.Id}
            onClick={() => SetDangMo(DangMo === SuCo.Id ? undefined : SuCo.Id)}
          >
            <span className="block font-semibold">{SuCo.MoTa}</span>
            <span className="text-sm text-fog">
              {NhanTrangThaiSuCo[SuCo.TrangThai]} ·{" "}
              {SuCo.CaQuay?.TieuDe ?? "Thiết bị tại kho"}
            </span>
          </button>
          {DangMo === SuCo.Id && (
            <ChiTietSuCo SuCo={SuCo} OnCapNhat={() => void TaiLai()} />
          )}
        </article>
      ))}
      {TongSo > 20 && (
        <div className="flex items-center gap-3">
          <button
            className="min-h-11 px-3"
            disabled={Trang === 1 || DangTai}
            onClick={() => SetTrang((Cu) => Cu - 1)}
          >
            Trước
          </button>
          <span>Trang {Trang}</span>
          <button
            className="min-h-11 px-3"
            disabled={Trang * 20 >= TongSo || DangTai}
            onClick={() => SetTrang((Cu) => Cu + 1)}
          >
            Sau
          </button>
        </div>
      )}
      {DangBao && (
        <BieuMauSuCoVanHanh
          CaQuayId={CaQuayId}
          ThietBiCoDinh={ThietBiId ? { Id: ThietBiId } : undefined}
          OnDong={() => SetDangBao(false)}
          OnThanhCong={() => void TaiLai()}
        />
      )}
    </section>
  );
}
