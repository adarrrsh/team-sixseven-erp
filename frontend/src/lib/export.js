/**
 * Every table in the app can be downloaded as .csv or .xlsx.
 * `columns` is [{ key, header }]; `rows` is an array of plain objects.
 */

const stamp = () => new Date().toISOString().slice(0, 10)

const cell = (v) => (v === null || v === undefined ? "" : String(v))

export function toCsv(columns, rows) {
  const esc = (v) => {
    const s = cell(v)
    return /[",\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s
  }
  return [
    columns.map((c) => esc(c.header)).join(","),
    ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(",")),
  ].join("\n")
}

function save(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadCsv(name, columns, rows) {
  save(
    new Blob(["\uFEFF" + toCsv(columns, rows)], {
      type: "text/csv;charset=utf-8",
    }),
    `${name}-${stamp()}.csv`,
  )
}

export async function downloadXlsx(name, columns, rows) {
  const XLSX = await import("xlsx")
  const data = rows.map((r) =>
    Object.fromEntries(columns.map((c) => [c.header, cell(r[c.key])])),
  )
  const sheet = XLSX.utils.json_to_sheet(data, {
    header: columns.map((c) => c.header),
  })
  sheet["!cols"] = columns.map((c) => ({ wch: Math.max(12, c.header.length + 4) }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, name.slice(0, 28) || "Sheet1")
  const out = XLSX.write(book, { bookType: "xlsx", type: "array" })
  save(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${name}-${stamp()}.xlsx`,
  )
}

export function download(format, name, columns, rows) {
  return format === "xlsx"
    ? downloadXlsx(name, columns, rows)
    : downloadCsv(name, columns, rows)
}
