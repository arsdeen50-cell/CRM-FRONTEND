import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* Styled replacements for window.confirm / prompt / alert. Each returns a Promise:
     if (!(await confirmDialog("Delete this?"))) return;
     const reason = await promptDialog("Reason", "");   // null when cancelled
     await alertDialog("Done");
   Pass an object for more control: { title, description, confirmText, destructive, multiline, placeholder }. */
let push = null;
const queue = [];
const open = (req) =>
  new Promise((resolve) => {
    const item = { ...req, resolve };
    if (push) push(item);
    else queue.push(item);
  });
const norm = (m) => (typeof m === "string" ? { description: m } : m || {});
const looksDestructive = (t = "") => /delete|remove|cancel|switch off|revoke|reject|stop|discard/i.test(t);

export const confirmDialog = (m) => {
  const o = norm(m);
  return open({ kind: "confirm", destructive: o.destructive ?? looksDestructive(`${o.title || ""} ${o.description || ""}`), ...o });
};
export const promptDialog = (m, defaultValue = "", extra = {}) => open({ kind: "prompt", defaultValue: defaultValue ?? "", ...norm(m), ...extra });
export const alertDialog = (m) => open({ kind: "alert", ...norm(m) });

export const AppDialogs = () => {
  const [item, setItem] = useState(null);
  const [value, setValue] = useState("");
  const pending = useRef([]);
  useEffect(() => {
    push = (it) => {
      setItem((cur) => {
        if (cur) {
          pending.current.push(it);
          return cur;
        }
        setValue(it.defaultValue ?? "");
        return it;
      });
    };
    while (queue.length) push(queue.shift());
    return () => {
      push = null;
    };
  }, []);
  const close = (result) => {
    item?.resolve(result);
    const next = pending.current.shift() || null;
    setValue(next?.defaultValue ?? "");
    setItem(next);
  };
  if (!item) return null;
  const cancelValue = item.kind === "prompt" ? null : item.kind === "confirm" ? false : undefined;
  const lines = String(item.description || "").split("\n");
  const title = item.title || (item.kind === "confirm" ? "Are you sure?" : item.kind === "prompt" ? lines[0] : "Notice");
  const body = item.title || item.kind !== "prompt" ? lines : lines.slice(1);
  return (
    <Dialog open onOpenChange={(o) => !o && close(cancelValue)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {body.filter(Boolean).length > 0 && (
            <DialogDescription asChild>
              <div className="space-y-1 whitespace-pre-wrap">{body.map((l, i) => <p key={i}>{l}</p>)}</div>
            </DialogDescription>
          )}
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            close(item.kind === "prompt" ? value : item.kind === "confirm" ? true : undefined);
          }}
          className="space-y-4"
        >
          {item.kind === "prompt" &&
            (item.multiline ? (
              <Textarea autoFocus rows={3} value={value} placeholder={item.placeholder} onChange={(e) => setValue(e.target.value)} />
            ) : (
              <Input autoFocus value={value} placeholder={item.placeholder} onChange={(e) => setValue(e.target.value)} />
            ))}
          <div className="flex justify-end gap-2">
            {item.kind !== "alert" && <Button type="button" variant="outline" onClick={() => close(cancelValue)}>{item.cancelText || "Cancel"}</Button>}
            <Button type="submit" autoFocus={item.kind !== "prompt"} variant={item.destructive ? "destructive" : "default"}>
              {item.confirmText || (item.kind === "alert" ? "OK" : item.kind === "prompt" ? "Save" : item.destructive ? "Yes, continue" : "Confirm")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
