import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

import App from "./App";
import { XacThucProvider } from "./Contexts/XacThucContext";
import { CauHinhHeThongProvider } from "./Contexts/CauHinhHeThongContext";
import "./Index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <CauHinhHeThongProvider>
        <XacThucProvider>
          <App />
          <Toaster theme="dark" position="top-right" />
        </XacThucProvider>
      </CauHinhHeThongProvider>
    </BrowserRouter>
  </StrictMode>,
);
