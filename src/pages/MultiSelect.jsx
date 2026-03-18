// MultiSelect.js
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const MultiSelect = ({ options, selected, onChange, placeholder = "Select..." }) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (value) => {
        if (selected.includes(value)) {
            onChange(selected.filter((item) => item !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const handleRemove = (value) => {
        onChange(selected.filter((item) => item !== value));
    };

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="Search..." />
                        <CommandEmpty>No item found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto">
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => handleSelect(option.value)}
                                >
                                    <Check
                                        className={`mr-2 h-4 w-4 ${
                                            selected.includes(option.value)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        }`}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>

            <div className="flex flex-wrap gap-2">
                {selected.map((value) => {
                    const option = options.find((opt) => opt.value === value);
                    return (
                        <Badge key={value} variant="secondary">
                            {option?.label}
                            <button
                                type="button"
                                className="ml-1 rounded-full outline-none hover:bg-accent"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleRemove(value);
                                    }
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onClick={() => handleRemove(value)}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    );
                })}
            </div>
        </div>
    );
};

export default MultiSelect;