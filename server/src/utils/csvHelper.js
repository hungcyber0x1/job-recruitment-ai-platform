/**
 * Simple CSV generation utility.
 * Handles escaping and data mapping.
 */
function jsonToCsv(data, columns) {
  if (!data || data.length === 0) return '';

  const header = columns.map(col => col.header).join(',');
  const rows = data.map(item => {
    return columns.map(col => {
      let val = col.accessor ? col.accessor(item) : item[col.key];
      if (val === null || val === undefined) val = '';
      
      // Escape for CSV
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

module.exports = { jsonToCsv };
