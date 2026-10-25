import React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/* "⋯" menu for table rows. items: [{ label, icon: Icon, onClick, danger, hidden, disabled }] or "-" for a divider. */
const RowActions = ({ items = [], label = "More actions" }) => {
  const shown = items.filter((i) => i === "-" || !i.hidden);
  // drop leading/trailing/double dividers left after hiding items
  const clean = shown.filter((i, k) => i !== "-" || (k > 0 && k < shown.length - 1 && shown[k - 1] !== "-"));
  if (!clean.some((i) => i !== "-")) return null;
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title={label} aria-label={label}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {clean.map((i, k) =>
          i === "-" ? (
            <DropdownMenuSeparator key={`s${k}`} />
          ) : (
            <DropdownMenuItem key={i.label} disabled={i.disabled} onSelect={() => setTimeout(() => i.onClick?.(), 0)} className={i.danger ? "text-destructive focus:text-destructive" : ""}>
              {i.icon && <i.icon className="mr-2 h-4 w-4" />}
              {i.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RowActions;
