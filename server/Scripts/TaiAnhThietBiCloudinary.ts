// Tìm ảnh thiết bị có giấy phép mở trên Wikimedia Commons rồi tải lên Cloudinary.
// Chạy trên máy có Internet và có CLOUDINARY_* trong server/.env.
//
//   Bước 1 – xem trước (chỉ đọc Commons, không tải lên đâu cả):
//     npx tsx Scripts/TaiAnhThietBiCloudinary.ts --xem-truoc
//     -> mở docs/AnhThietBi_XemTruoc.html, kiểm tra ảnh từng mẫu.
//        Ảnh sai: sửa prisma/TrinhDien/NguonAnhThietBi.ts (thêm Tep) rồi chạy lại.
//   Bước 2 – tải lên Cloudinary theo đúng danh sách đã xem:
//     npx tsx Scripts/TaiAnhThietBiCloudinary.ts --tai-len
//     -> ghi prisma/TrinhDien/AnhThietBiCloudinary.json (seed đọc tệp này)
//        và docs/NguonAnhThietBi.md (ghi công tác giả, giấy phép).
//   Tùy chọn: --chi SONY-FX9,ATOMOS-NINJAV  (chỉ xử lý vài mẫu)
//
// Chỉ nhận CC0, CC BY, CC BY-SA, phạm vi công cộng. Ảnh CC BY/BY-SA bắt buộc
// ghi tác giả và giấy phép khi dùng: xem docs/NguonAnhThietBi.md.
import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DanhSachNguonAnh,
  type NguonAnh,
} from "../prisma/TrinhDien/NguonAnhThietBi.js";

const ThuMucServer = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TepDaChon = resolve(ThuMucServer, "prisma/TrinhDien/AnhThietBiDaChon.json");
const TepCloudinary = resolve(
  ThuMucServer,
  "prisma/TrinhDien/AnhThietBiCloudinary.json",
);
const TepXemTruoc = resolve(ThuMucServer, "../docs/AnhThietBi_XemTruoc.html");
const TepGhiCong = resolve(ThuMucServer, "../docs/NguonAnhThietBi.md");

const API = "https://commons.wikimedia.org/w/api.php";
const UA =
  "MEDIOPS-DoAnTotNghiep/1.0 (du an sinh vien; lay anh thiet bi co giay phep mo)";
const CHIEU_RONG_ANH = 1200;

export interface AnhDaChon {
  Ma: string;
  TieuDe: string;
  TrangNguon: string;
  UrlAnh: string;
  TacGia: string;
  GiayPhep: string;
  GiayPhepUrl: string | null;
  CachTim: string;
}

// ------------------------------------------------------------ tiện ích
const Ngu = (Ms: number) => new Promise((R) => setTimeout(R, Ms));

export function BoTheHtml(S: unknown) {
  return String(S ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Chỉ giấy phép cho phép dùng lại kể cả thương mại và chỉnh kích thước.
export function GiayPhepHopLe(Ten: string) {
  const T = Ten.trim().toLowerCase();
  if (!T) return false;
  if (/\b(nc|nd)\b|noncommercial|no ?deriv|fair use/.test(T)) return false;
  return (
    /^cc0\b/.test(T) ||
    /^cc[ -]by([ -]sa)?(\s|-|$)/.test(T) ||
    /^public domain\b/.test(T) ||
    /^pd\b/.test(T) ||
    /^pdm\b/.test(T)
  );
}

export function TenChuaDuTu(TieuDe: string, Tu: string[]) {
  const T = TieuDe.toLocaleLowerCase("vi");
  return Tu.every((X) => T.includes(X.toLocaleLowerCase("vi")));
}

async function GoiApi(ThamSo: Record<string, string>): Promise<any> {
  const Url = new URL(API);
  for (const [K, V] of Object.entries({
    format: "json",
    formatversion: "2",
    maxlag: "5",
    ...ThamSo,
  }))
    Url.searchParams.set(K, V);
  for (let Lan = 1; Lan <= 3; Lan++) {
    const Res = await fetch(Url, { headers: { "User-Agent": UA } });
    if (Res.ok) {
      const Json = await Res.json();
      if (Json?.error?.code === "maxlag") {
        await Ngu(2000 * Lan);
        continue;
      }
      return Json;
    }
    if (Res.status === 429 || Res.status >= 500) {
      await Ngu(2000 * Lan);
      continue;
    }
    throw new Error(`Commons trả HTTP ${Res.status} cho ${Url}`);
  }
  throw new Error(`Commons không phản hồi sau 3 lần: ${Url}`);
}

interface ThongTinTep {
  TieuDe: string;
  Mime: string;
  Rong: number;
  Cao: number;
  UrlAnh: string;
  TrangNguon: string;
  TacGia: string;
  GiayPhep: string;
  GiayPhepUrl: string | null;
}

async function LayThongTinTep(DanhSach: string[]): Promise<ThongTinTep[]> {
  if (!DanhSach.length) return [];
  const KetQua: ThongTinTep[] = [];
  for (let I = 0; I < DanhSach.length; I += 40) {
    const Json = await GoiApi({
      action: "query",
      prop: "imageinfo",
      iiprop: "url|mime|size|extmetadata",
      iiurlwidth: String(CHIEU_RONG_ANH),
      titles: DanhSach.slice(I, I + 40).join("|"),
    });
    const TheoTen = new Map<string, any>();
    for (const P of Json?.query?.pages ?? []) TheoTen.set(P.title, P);
    // Giữ đúng thứ tự đầu vào (thứ tự liên quan của tìm kiếm).
    const Chuan = new Map<string, string>();
    for (const N of Json?.query?.normalized ?? []) Chuan.set(N.from, N.to);
    for (const Ten of DanhSach.slice(I, I + 40)) {
      const P = TheoTen.get(Chuan.get(Ten) ?? Ten);
      const Ii = P?.imageinfo?.[0];
      if (!Ii) continue;
      const Em = Ii.extmetadata ?? {};
      KetQua.push({
        TieuDe: P.title,
        Mime: Ii.mime ?? "",
        Rong: Ii.width ?? 0,
        Cao: Ii.height ?? 0,
        UrlAnh: Ii.thumburl ?? Ii.url,
        TrangNguon: Ii.descriptionurl,
        TacGia:
          BoTheHtml(Em.Artist?.value) ||
          BoTheHtml(Em.Credit?.value) ||
          "Không ghi tác giả (xem trang nguồn)",
        GiayPhep: BoTheHtml(Em.LicenseShortName?.value),
        GiayPhepUrl: BoTheHtml(Em.LicenseUrl?.value) || null,
      });
    }
    await Ngu(250);
  }
  return KetQua;
}

async function TepTrongDanhMuc(DanhMuc: string) {
  const Json = await GoiApi({
    action: "query",
    list: "categorymembers",
    cmtitle: DanhMuc,
    cmtype: "file",
    cmlimit: "50",
  });
  return (Json?.query?.categorymembers ?? []).map((X: any) => X.title as string);
}

async function TimTheoTuKhoa(Tu: string[]) {
  const Json = await GoiApi({
    action: "query",
    list: "search",
    srnamespace: "6",
    srlimit: "30",
    srsearch: `${Tu.map((X) => `intitle:"${X}"`).join(" ")} filetype:bitmap`,
  });
  return (Json?.query?.search ?? [])
    .map((X: any) => X.title as string)
    .filter((T: string) => TenChuaDuTu(T, Tu));
}

export function ChonTepTotNhat(DanhSach: ThongTinTep[]) {
  return DanhSach.find(
    (X) =>
      /^image\/(jpeg|png|webp)$/.test(X.Mime) &&
      Math.min(X.Rong, X.Cao) >= 500 &&
      GiayPhepHopLe(X.GiayPhep),
  );
}

async function TimAnh(Nguon: NguonAnh): Promise<{
  Anh?: AnhDaChon;
  NhatKy: string[];
}> {
  const NhatKy: string[] = [];
  const Thu = async (CachTim: string, Ten: string[]) => {
    if (!Ten.length) {
      NhatKy.push(`${CachTim}: không có tệp`);
      return undefined;
    }
    const Tot = ChonTepTotNhat(await LayThongTinTep(Ten));
    NhatKy.push(
      `${CachTim}: ${Ten.length} tệp, ${Tot ? `chọn ${Tot.TieuDe}` : "không tệp nào đạt (giấy phép/kích thước/định dạng)"}`,
    );
    return Tot && { ...Tot, Ma: Nguon.Ma, CachTim };
  };
  if (Nguon.Tep) {
    const A = await Thu(`Tệp chỉ định`, [Nguon.Tep]);
    if (A) return { Anh: A, NhatKy };
  }
  for (const Dm of Nguon.DanhMuc ?? []) {
    const A = await Thu(`Danh mục ${Dm}`, await TepTrongDanhMuc(Dm));
    if (A) return { Anh: A, NhatKy };
  }
  for (const Tu of Nguon.TuKhoa ?? []) {
    const A = await Thu(`Từ khóa [${Tu.join(" + ")}]`, await TimTheoTuKhoa(Tu));
    if (A) return { Anh: A, NhatKy };
    await Ngu(250);
  }
  return { NhatKy };
}

const Esc = (S: string) =>
  S.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function GhiXemTruoc(
  KetQua: Array<{ Ma: string; Anh?: AnhDaChon; NhatKy: string[] }>,
) {
  const Dong = KetQua.map(
    ({ Ma, Anh, NhatKy }) => `<tr>
<td><b>${Esc(Ma)}</b></td>
<td>${Anh ? `<img src="${Esc(Anh.UrlAnh)}" loading="lazy">` : "<i>Chưa có ảnh</i>"}</td>
<td>${
      Anh
        ? `<a href="${Esc(Anh.TrangNguon)}" target="_blank">${Esc(Anh.TieuDe)}</a><br>Tác giả: ${Esc(Anh.TacGia)}<br>Giấy phép: ${Esc(Anh.GiayPhep)}`
        : ""
    }<details><summary>Cách tìm</summary><pre>${Esc(NhatKy.join("\n"))}</pre></details></td>
</tr>`,
  ).join("\n");
  const Co = KetQua.filter((X) => X.Anh).length;
  mkdirSync(dirname(TepXemTruoc), { recursive: true });
  writeFileSync(
    TepXemTruoc,
    `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Xem trước ảnh thiết bị</title>
<style>body{font-family:system-ui,sans-serif;margin:24px}table{border-collapse:collapse}td{border:1px solid #ccc;padding:8px;vertical-align:top}img{max-width:320px;max-height:220px}pre{white-space:pre-wrap;font-size:12px}</style></head><body>
<h1>Ảnh thiết bị tìm được: ${Co}/${KetQua.length} mẫu</h1>
<p>Kiểm tra từng ảnh có đúng thiết bị không. Ảnh sai: thêm <code>Tep</code> cho mẫu đó trong <code>server/prisma/TrinhDien/NguonAnhThietBi.ts</code>, chạy lại <code>--xem-truoc</code>. Ảnh đúng hết thì chạy <code>--tai-len</code>.</p>
<table>${Dong}</table></body></html>`,
  );
}

async function XemTruoc(Chi: Set<string> | null) {
  const KetQua: Array<{ Ma: string; Anh?: AnhDaChon; NhatKy: string[] }> = [];
  for (const Nguon of DanhSachNguonAnh) {
    if (Chi && !Chi.has(Nguon.Ma)) continue;
    process.stdout.write(`${Nguon.Ma} ... `);
    try {
      const { Anh, NhatKy } = await TimAnh(Nguon);
      console.log(Anh ? `${Anh.TieuDe} (${Anh.GiayPhep})` : "chưa có ảnh");
      KetQua.push({ Ma: Nguon.Ma, Anh, NhatKy });
    } catch (Loi) {
      console.log(`lỗi: ${(Loi as Error).message}`);
      KetQua.push({ Ma: Nguon.Ma, NhatKy: [String(Loi)] });
    }
  }
  // Gộp với lần xem trước cũ khi chỉ chạy lại vài mẫu.
  const Cu: Record<string, AnhDaChon> =
    Chi && existsSync(TepDaChon) ? JSON.parse(readFileSync(TepDaChon, "utf8")) : {};
  for (const { Ma, Anh } of KetQua) {
    if (Anh) Cu[Ma] = Anh;
    else delete Cu[Ma];
  }
  writeFileSync(TepDaChon, JSON.stringify(Cu, null, 2) + "\n");
  GhiXemTruoc(KetQua);
  console.log(
    `\nĐã chọn ${KetQua.filter((X) => X.Anh).length}/${KetQua.length} ảnh.` +
      `\nXem: ${TepXemTruoc}\nDanh sách đã chọn: ${TepDaChon}`,
  );
}

async function TaiLen(Chi: Set<string> | null) {
  for (const K of [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ])
    if (!process.env[K]) throw new Error(`Thiếu ${K} trong server/.env`);
  if (!existsSync(TepDaChon))
    throw new Error("Chưa có danh sách ảnh. Chạy --xem-truoc trước.");
  const { LuuTruAnh } = await import("../src/Config/Cloudinary.js");
  const DaChon: Record<string, AnhDaChon> = JSON.parse(
    readFileSync(TepDaChon, "utf8"),
  );
  const KetQua: Record<string, AnhDaChon & { Url: string }> = existsSync(
    TepCloudinary,
  )
    ? JSON.parse(readFileSync(TepCloudinary, "utf8"))
    : {};
  let Loi = 0;
  for (const Anh of Object.values(DaChon)) {
    if (Chi && !Chi.has(Anh.Ma)) continue;
    process.stdout.write(`${Anh.Ma} ... `);
    try {
      const Res = await fetch(Anh.UrlAnh, { headers: { "User-Agent": UA } });
      if (!Res.ok) throw new Error(`tải ảnh từ Commons HTTP ${Res.status}`);
      const Mime = Res.headers.get("content-type") ?? "image/jpeg";
      const DuLieu = Buffer.from(await Res.arrayBuffer()).toString("base64");
      const Tai = await LuuTruAnh.uploader.upload(
        `data:${Mime};base64,${DuLieu}`,
        {
          public_id: `mediops/thiet-bi/${Anh.Ma}`,
          overwrite: true,
          resource_type: "image",
          tags: ["mediops", "thiet-bi", "wikimedia-commons"],
        },
      );
      KetQua[Anh.Ma] = { ...Anh, Url: Tai.secure_url };
      console.log(Tai.secure_url);
    } catch (E) {
      Loi++;
      console.log(`lỗi: ${(E as Error).message}`);
    }
    await Ngu(300);
  }
  writeFileSync(TepCloudinary, JSON.stringify(KetQua, null, 2) + "\n");
  const Dong = Object.values(KetQua)
    .sort((A, B) => A.Ma.localeCompare(B.Ma))
    .map(
      (A) =>
        `| ${A.Ma} | [${A.TieuDe.replace(/^File:/, "")}](${A.TrangNguon}) | ${A.TacGia.replace(/\|/g, "/")} | ${A.GiayPhepUrl ? `[${A.GiayPhep}](${A.GiayPhepUrl})` : A.GiayPhep} |`,
    );
  writeFileSync(
    TepGhiCong,
    [
      "# Nguồn ảnh thiết bị",
      "",
      "Ảnh thiết bị trong dữ liệu trình diễn lấy từ Wikimedia Commons, chỉ dùng ảnh có giấy phép mở,",
      "đã thu nhỏ còn chiều rộng tối đa " +
        CHIEU_RONG_ANH +
        " px và lưu trên Cloudinary (thư mục `mediops/thiet-bi`).",
      "Ảnh CC BY / CC BY-SA phải ghi tác giả và giấy phép như bảng dưới khi đưa vào báo cáo hoặc slide.",
      "",
      "| Mẫu | Tệp gốc | Tác giả | Giấy phép |",
      "|---|---|---|---|",
      ...Dong,
      "",
    ].join("\n"),
  );
  console.log(
    `\nĐã tải ${Object.keys(KetQua).length} ảnh, lỗi ${Loi}.\nSeed sẽ đọc: ${TepCloudinary}\nGhi công: ${TepGhiCong}`,
  );
  if (Loi) process.exitCode = 1;
}

async function Main() {
  const ViTriChi = process.argv.indexOf("--chi");
  const Chi =
    ViTriChi > 0 && process.argv[ViTriChi + 1]
      ? new Set(process.argv[ViTriChi + 1]!.split(",").map((X) => X.trim()))
      : null;
  if (process.argv.includes("--xem-truoc")) return XemTruoc(Chi);
  if (process.argv.includes("--tai-len")) return TaiLen(Chi);
  console.log(
    "Dùng: npx tsx Scripts/TaiAnhThietBiCloudinary.ts --xem-truoc | --tai-len [--chi MA1,MA2]",
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  Main().catch((E) => {
    console.error(E);
    process.exitCode = 1;
  });
