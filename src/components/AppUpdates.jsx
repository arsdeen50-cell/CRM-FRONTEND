import { useEffect, useState } from "react";
import { Download, RefreshCw, Share, SquarePlus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/* Keeping the installed phone app current, and offering to install it.
   - New version: each deploy changes the hashed script named in index.html. When the app comes back to the
     front (or every 15 minutes) we fetch index.html and compare; if it changed, a banner offers a refresh.
     This matters most on phones, where an app left in the background keeps running the old code.
   - Install: Chrome/Android announce "can install" with beforeinstallprompt, which can fire before anyone has
     logged in, so it is captured from main.jsx. iPhones have no prompt: Safari's Share > Add to Home Screen. */

let installPrompt = null;
const installListeners = new Set();
export const watchInstallPrompt = () => {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installPrompt = e;
    installListeners.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installListeners.forEach((fn) => fn());
  });
};

const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const CHECK_EVERY_MS = 15 * 60 * 1000;
const MIN_GAP_MS = 60 * 1000;
const scriptOf = (html) => html.match(/<script[^>]+type="module"[^>]+src="([^"]*\/assets\/[^"]+)"/)?.[1] || "";

export const UpdateBanner = () => {
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const current = new URL(document.querySelector('script[type="module"][src*="/assets/"]')?.src || "", location.href).pathname;
    if (!current || current === "/") return;
    let last = 0;
    const check = async () => {
      if (document.visibilityState !== "visible" || Date.now() - last < MIN_GAP_MS) return;
      last = Date.now();
      try {
        const res = await fetch(`/index.html?v=${Date.now()}`, { cache: "no-store" });
        const latest = res.ok ? scriptOf(await res.text()) : "";
        if (latest && new URL(latest, location.href).pathname !== current) {
          setReady(true);
          setHidden(false);
        }
      } catch {
        // offline: try again next time
      }
    };
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  if (!ready || hidden) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-lg" role="status">
      <RefreshCw className="h-5 w-5 shrink-0 text-brand" />
      <p className="flex-1 text-sm">A new version of the CRM is available.</p>
      <button onClick={() => location.reload()} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">Refresh</button>
      <button onClick={() => setHidden(true)} className="btn-ghost size-8 shrink-0" title="Later"><X className="h-4 w-4" /></button>
    </div>
  );
};

// "Install app" in the account menu: Chrome's own prompt where there is one, step-by-step help on iPhone
export const InstallAppItem = () => {
  const [, rerender] = useState(0);
  const [iosHelp, setIosHelp] = useState(false);
  useEffect(() => {
    const fn = () => rerender((n) => n + 1);
    installListeners.add(fn);
    return () => installListeners.delete(fn);
  }, []);

  if (isStandalone() || (!installPrompt && !isIOS())) return null;
  const install = async () => {
    if (!installPrompt) return setIosHelp(true);
    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => {});
    installPrompt = null;
    rerender((n) => n + 1);
  };

  return (
    <>
      <button onClick={install} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"><Download size={16} /> Install app</button>
      <Dialog open={iosHelp} onOpenChange={setIosHelp}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add the CRM to your Home Screen</DialogTitle></DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-2"><span className="font-semibold">1.</span><span>Open this page in <b>Safari</b> (other iPhone browsers can&apos;t install apps).</span></li>
            <li className="flex gap-2"><span className="font-semibold">2.</span><span>Tap the <b>Share</b> button <Share className="inline h-4 w-4 align-text-bottom" /> at the bottom of the screen.</span></li>
            <li className="flex gap-2"><span className="font-semibold">3.</span><span>Scroll down and tap <b>Add to Home Screen</b> <SquarePlus className="inline h-4 w-4 align-text-bottom" />, then <b>Add</b>.</span></li>
          </ol>
          <p className="text-xs text-muted-foreground">The CRM then opens full screen from its own icon, like any other app.</p>
        </DialogContent>
      </Dialog>
    </>
  );
};
