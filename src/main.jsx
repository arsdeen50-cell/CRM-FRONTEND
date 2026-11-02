import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { applyBrand } from "@/constants/brand";
import { Toaster } from "@/components/ui/sonner"
import { Provider } from "react-redux";
import store from "@/redux/store";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/lib/integration/react";
import { watchInstallPrompt } from "@/components/AppUpdates";

const persistor = persistStore(store);
applyBrand();
watchInstallPrompt();
// Installable on phones (home-screen app) and quicker to reopen; production builds only
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
    <Toaster />
  </StrictMode>,
)
