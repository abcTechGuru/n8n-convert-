export function toCSV(data: any[]): string {
    if (!data.length) return "";
    const header = Object.keys(data[0]);
    const csvRows = [
      header.join(","),
      ...data.map((row) =>
        header
          .map((k) =>
            `"${(row[k] || "")
              .toString()
              .replace(/"/g, '""')}"`
          )
          .join(",")
      ),
    ];
    return csvRows.join("\n");
  }
  