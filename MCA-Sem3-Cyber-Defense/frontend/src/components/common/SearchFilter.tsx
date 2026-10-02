import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export function SearchFilter({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters = [],
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onReset,
}: {
  search?: string | undefined;
  onSearchChange?: (value: string) => void | undefined;
  searchPlaceholder?: string | undefined;
  filters?: FilterConfig[] | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  onDateFromChange?: (value: string) => void | undefined;
  onDateToChange?: (value: string) => void | undefined;
  onReset?: () => void | undefined;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b px-4 py-3">
      {onSearchChange && (
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-8"
          />
        </div>
      )}

      {filters.map((filter) => (
        <div key={filter.key} className="w-[170px]">
          <label
            className="text-muted-foreground mb-1 block text-[11px] tracking-wider uppercase"
            htmlFor={`filter-${filter.key}`}
          >
            {filter.label}
          </label>
          <Select value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger id={`filter-${filter.key}`} className="w-full">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      {onDateFromChange && (
        <div>
          <label className="text-muted-foreground mb-1 block text-[11px] tracking-wider uppercase" htmlFor="date-from">
            From
          </label>
          <Input
            id="date-from"
            type="date"
            value={dateFrom ?? ""}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-[150px]"
          />
        </div>
      )}
      {onDateToChange && (
        <div>
          <label className="text-muted-foreground mb-1 block text-[11px] tracking-wider uppercase" htmlFor="date-to">
            To
          </label>
          <Input
            id="date-to"
            type="date"
            value={dateTo ?? ""}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-[150px]"
          />
        </div>
      )}

      {onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="size-4" aria-hidden /> Reset
        </Button>
      )}
    </div>
  );
}
