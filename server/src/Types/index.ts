import type { Request } from "express";
export interface DuLieuToken {
  nguoiDungId: string;
  PhienBan?: unknown;
}
export interface NguoiDungXacThuc extends DuLieuToken {
  LaQuanTriHeThong: boolean;
  QuanTriDonVi?: boolean;
  Quyen?: string[];
  DonViId: string | null;
}
export interface YeuCauXacThuc extends Request {
  NguoiDung?: NguoiDungXacThuc;
}
