import { useMemo, useState } from "react"
import { Download, Search, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { download } from "@/lib/export"
import { cn } from "cn"

/**
 * columns: [{ key, header, render?, align? }]
 * Search spans every column key. Every table exports to .csv / .xlsx.
 */
export function DataTable({
  name,
  columns,
  rows,
  searchPlaceholder = "Search…",
  toolbar,
  empty,
  className,
}) {
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) =>
      columns.some((c) =>
        String(r[c.key] ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    )
  }, [q, rows, columns])

  const exportCols = columns
    .filter((c) => c.export !== false)
    .map((c) => ({ key: c.key, header: c.header }))

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label="Search table"
          />
        </div>
        {toolbar}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg">
              <Download />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{filtered.length} rows</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => download("csv", name, exportCols, filtered)}
            >
              <FileText />
              Download .csv
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => download("xlsx", name, exportCols, filtered)}
            >
              <FileSpreadsheet />
              Download .xlsx
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead
                key={c.key}
                className={c.align === "right" ? "text-right" : undefined}
              >
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableEmpty colSpan={columns.length}>
              {empty ?? "No matching records"}
            </TableEmpty>
          ) : (
            filtered.map((row, i) => (
              <TableRow key={row.id ?? row.code ?? i}>
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    className={c.align === "right" ? "text-right" : undefined}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
