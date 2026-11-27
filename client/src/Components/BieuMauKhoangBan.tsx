import { Plus, Trash2 } from "lucide-react";
import type { KhoangBan } from "../Types/DuLieuNhung";

const LopNhap =
  "min-h-11 w-full rounded border border-rail bg-case-2 px-3 text-sm";
function NgayDiaPhuong(GiaTri: string) {
  const Ngay = new Date(GiaTri);
  return Number.isFinite(Ngay.getTime())
    ? new Date(Ngay.getTime() - Ngay.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";
}
export function BieuMauKhoangBan({
  GiaTri,
  OnDoi,
  ChiDoc = false,
}: {
  GiaTri: KhoangBan[];
  OnDoi: (CacMuc: KhoangBan[]) => void;
  ChiDoc?: boolean;
}) {
  function Doi(Id: string, DuLieu: Partial<KhoangBan>) {
    OnDoi(GiaTri.map((Muc) => (Muc.Id === Id ? { ...Muc, ...DuLieu } : Muc)));
  }
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-semibold">Lịch bận ngoài ca quay</h3>
        <p className="mt-1 text-sm text-fog">
          Ghi nhận nghỉ phép, bảo trì hoặc đóng cửa theo thời gian. Lịch phân
          công được hệ thống kiểm tra riêng.
        </p>
      </div>
      {!GiaTri.length && (
        <p className="text-sm text-fog">Chưa có khoảng bận.</p>
      )}
      {GiaTri.map((Muc, ChiSo) => (
        <fieldset
          disabled={ChiDoc}
          key={Muc.Id}
          className="space-y-3 border-b border-rail pb-4"
        >
          <legend className="mb-2 text-sm font-medium">
            Khoảng bận {ChiSo + 1}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Bắt đầu
              <input
                type="datetime-local"
                className={LopNhap}
                required
                value={NgayDiaPhuong(Muc.BatDau)}
                onChange={(SuKien) => {
                  if (SuKien.target.value)
                    Doi(Muc.Id, {
                      BatDau: new Date(SuKien.target.value).toISOString(),
                    });
                }}
              />
            </label>
            <label className="text-sm">
              Kết thúc
              <input
                type="datetime-local"
                className={LopNhap}
                required
                value={NgayDiaPhuong(Muc.KetThuc)}
                onChange={(SuKien) => {
                  if (SuKien.target.value)
                    Doi(Muc.Id, {
                      KetThuc: new Date(SuKien.target.value).toISOString(),
                    });
                }}
              />
            </label>
          </div>
          <label className="block text-sm">
            Lý do <span className="text-fog">(không bắt buộc)</span>
            <input
              className={LopNhap}
              value={Muc.LyDo ?? ""}
              maxLength={500}
              onChange={(SuKien) =>
                Doi(Muc.Id, { LyDo: SuKien.target.value || null })
              }
            />
          </label>
          {!ChiDoc && (
            <button
              type="button"
              className="flex min-h-11 items-center gap-2 text-sm text-tally"
              onClick={() => OnDoi(GiaTri.filter((Cu) => Cu.Id !== Muc.Id))}
            >
              <Trash2 size={16} aria-hidden />
              Bỏ khoảng bận {ChiSo + 1}
            </button>
          )}
        </fieldset>
      ))}
      {!ChiDoc && (
        <button
          type="button"
          className="flex min-h-11 items-center gap-2 rounded border border-rail px-3 text-sm hover:bg-case-2"
          onClick={() => {
            const BatDau = new Date();
            BatDau.setSeconds(0, 0);
            OnDoi([
              ...GiaTri,
              {
                Id: crypto.randomUUID(),
                BatDau: BatDau.toISOString(),
                KetThuc: new Date(BatDau.getTime() + 3600000).toISOString(),
                LyDo: null,
              },
            ]);
          }}
        >
          <Plus size={16} aria-hidden />
          Thêm khoảng bận
        </button>
      )}
    </section>
  );
}
