import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { ThietBi } from "../Types/ThietBi";

export function TemInQR({ ThietBi: ThietBi }: { ThietBi: ThietBi }) {
  const [DuongDanQR, SetDuongDanQR] = useState("");

  useEffect(() => {
    let ConHieuLuc = true;
    QRCode.toDataURL(ThietBi.MaQR, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
    })
      .then((DuongDan) => {
        if (ConHieuLuc) SetDuongDanQR(DuongDan);
      })
      .catch(() => {
        if (ConHieuLuc) SetDuongDanQR("");
      });
    return () => {
      ConHieuLuc = false;
    };
  }, [ThietBi.MaQR]);

  return (
    <article className="tem-in-qr bg-white p-2 text-center text-black">
      {DuongDanQR ? (
        <img
          alt={`Mã QR của ${ThietBi.TenThietBi}`}
          className="mx-auto aspect-square w-full max-w-24"
          src={DuongDanQR}
        />
      ) : (
        <div className="mx-auto aspect-square w-full max-w-24 animate-pulse bg-slate-200" />
      )}
      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-tight">
        {ThietBi.TenThietBi}
      </p>
      <p className="mt-1 font-mono text-[10px]">{ThietBi.MaQR}</p>
    </article>
  );
}
