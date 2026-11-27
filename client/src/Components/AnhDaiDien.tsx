import { useState } from "react";

export function AnhDaiDien({
  HoTen,
  DuongDan,
  KichThuoc = "size-10",
  Lop = "",
}: {
  HoTen: string;
  DuongDan?: string | null;
  KichThuoc?: string;
  Lop?: string;
}) {
  const [AnhLoi, SetAnhLoi] = useState<string | null>(null);
  const ChuCai =
    HoTen.trim()
      .split(/\s+/)
      .slice(-2)
      .map((Tu) => Tu[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-case-2 font-semibold text-paper ${KichThuoc} ${Lop}`}
    >
      {DuongDan && AnhLoi !== DuongDan ? (
        <img
          src={DuongDan}
          alt={`Ảnh đại diện của ${HoTen}`}
          className="size-full object-cover"
          onError={() => SetAnhLoi(DuongDan)}
        />
      ) : (
        <span aria-label={`Ảnh đại diện của ${HoTen}`}>{ChuCai}</span>
      )}
    </span>
  );
}
