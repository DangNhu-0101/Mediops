import axios from "axios";

const KhoaToken = "maXacThuc";

export function LayTokenDaLuu() {
  return localStorage.getItem(KhoaToken) ?? sessionStorage.getItem(KhoaToken);
}

export function LuuToken(Token: string, GhiNho: boolean) {
  XoaToken();
  const NoiLuu = GhiNho ? localStorage : sessionStorage;
  NoiLuu.setItem(KhoaToken, Token);
}

export function XoaToken() {
  localStorage.removeItem(KhoaToken);
  sessionStorage.removeItem(KhoaToken);
}

export const Api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
});

Api.interceptors.request.use((CauHinh) => {
  const Token = LayTokenDaLuu();
  if (Token) {
    CauHinh.headers.Authorization = `Bearer ${Token}`;
  }
  return CauHinh;
});

Api.interceptors.response.use(
  (PhanHoi) => PhanHoi,
  (Loi: unknown) => {
    if (
      axios.isAxiosError(Loi) &&
      Loi.response?.status === 401 &&
      !Loi.config?.url?.endsWith("/xac-thuc/dang-nhap")
    ) {
      XoaToken();
      window.dispatchEvent(new Event("xac-thuc-het-han"));
    }
    return Promise.reject(Loi);
  },
);
