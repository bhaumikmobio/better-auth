type BaseTableProps = {
  headers: string[];
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
};

export function BaseTable({ headers, isEmpty, emptyMessage, children }: BaseTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80">
      <table className="min-w-full divide-y divide-slate-200/80">
        <thead className="bg-slate-50/80">
          <tr className="text-left text-sm font-semibold text-slate-700">
            {headers.map((header) => (
              <th key={header} className="px-4 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {isEmpty ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-slate-600">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
