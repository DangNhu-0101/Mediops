import { useEffect, useState } from "react";
import { Api } from "../Services/Api";
import { LayThongBaoLoi } from "../Services/XacThucService";
import { GioHienThi } from "../Services/SuCoVanHanhService";
import { useCauHinhHeThong } from "../Contexts/CauHinhHeThongContext";

const NhanPhanHe = {
  THIET_BI: "Giữ thiết bị",
  STUDIO: "Giữ Studio",
  NHAN_SU: "Phản hồi nhân sự / người phụ trách ca",
};
type PhanHe = keyof typeof NhanPhanHe;
interface DuLieuCauHinh {
  GiaTri: Record<PhanHe, number>;
  LichSu: {
    Id: string;
    PhanHe: PhanHe;
    GiaTriCu: number;
    GiaTriMoi: number;
    NguoiSuaId: string;
    NgayTao: string;
  }[];
}
export function CauHinhThoiGianCho() {
  const { CauHinh } = useCauHinhHeThong();
  const [DuLieu, SetDuLieu] = useState<DuLieuCauHinh>();
  const [GiaTri, SetGiaTri] = useState<Partial<Record<PhanHe, number>>>({});
  const [Loi, SetLoi] = useState("");
  const [DangLuu, SetDangLuu] = useState(false);
  async function TaiLai() {
    const KetQua = (
      await Api.get<DuLieuCauHinh>("/quan-tri-he-thong/thoi-gian-cho")
    ).data;
    SetDuLieu(KetQua);
    SetGiaTri(KetQua.GiaTri);
  }
  useEffect(() => {
    void TaiLai().catch((LoiTai) => SetLoi(LayThongBaoLoi(LoiTai)));
  }, []);
  async function Luu(PhanHe: PhanHe) {
    SetDangLuu(true);
    SetLoi("");
    try {
      await Api.put("/quan-tri-he-thong/thoi-gian-cho", {
        PhanHe,
        SoPhut: GiaTri[PhanHe],
      });
      await TaiLai();
    } catch (LoiLuu) {
      SetLoi(LayThongBaoLoi(LoiLuu));
    } finally {
      SetDangLuu(false);
    }
  }
  return (
    <section className="max-w-4xl space-y-5">
      <h1 className="font-serif text-2xl">Cấu hình thời gian chờ</h1>
      <p>
        Áp dụng cho lượt tạo mới trên toàn hệ thống. Lượt đang mở giữ nguyên hạn
        đã ghi. Mỗi phân hệ nhận số phút nguyên từ 1 đến 120.
      </p>
      {Loi && (
        <p role="alert" className="text-tally">
          {Loi}{" "}
          <button
            className="min-h-11 underline"
            onClick={() =>
              void TaiLai().catch((LoiTai) => SetLoi(LayThongBaoLoi(LoiTai)))
            }
          >
            Thử lại
          </button>
        </p>
      )}
      {!DuLieu && !Loi && <p role="status">Đang tải cấu hình…</p>}
      {DuLieu &&
        (Object.keys(NhanPhanHe) as PhanHe[]).map((PhanHe) => (
          <form
            key={PhanHe}
            className="flex flex-wrap items-end gap-3 border-t border-rail pt-4"
            onSubmit={(SuKien) => {
              SuKien.preventDefault();
              void Luu(PhanHe);
            }}
          >
            <label className="flex-1">
              {NhanPhanHe[PhanHe]} (phút)
              <input
                type="number"
                required
                min={1}
                max={120}
                step={1}
                value={GiaTri[PhanHe] ?? ""}
                onChange={(SuKien) =>
                  SetGiaTri((Cu) => ({
                    ...Cu,
                    [PhanHe]: Number(SuKien.target.value),
                  }))
                }
                className="mt-2 block min-h-11 w-full rounded border border-rail bg-case p-2"
              />
            </label>
            <button
              disabled={DangLuu}
              className="min-h-11 rounded bg-tally px-4"
            >
              {DangLuu ? "Đang lưu…" : "Lưu thời gian chờ"}
            </button>
          </form>
        ))}

        
    </section>
  );
}
