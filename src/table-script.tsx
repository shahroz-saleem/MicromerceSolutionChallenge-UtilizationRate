import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useMemo } from "react";
import sourceData from "./source-data.json";
import type { TableDataType } from "./types";

export default function TableComponent() {
  const tableData: TableDataType[] = useMemo(() => {
    return (sourceData as any[])
      .map((dataRow) => {
        const personData = dataRow.employees || dataRow.externals;
        if (!personData) return null;

        const status = personData.status?.toLowerCase();
        if (status !== "active" && status !== "aktiv") return null;

        const { firstname = "", lastname = "" } = personData;
        const person = `${firstname} ${lastname}`.trim() + (dataRow.externals ? " (E)" : "");

        const workforce = personData.workforceUtilisation ?? {};
        const lastThreeMonths = workforce.lastThreeMonthsIndividually ?? [];

        const utilizationByMonth = Object.fromEntries(
          lastThreeMonths.map((entry: any) => {
            const rate = parseFloat(entry.utilisationRate ?? "0");
            return [entry.month, rate ? `${(rate * 100).toFixed(0)}%` : "..."];
          })
        );

        const ytd = parseFloat(workforce.utilisationRateYearToDate ?? "0");
        const p12m = parseFloat(workforce.utilisationRateLastTwelveMonths ?? "0");

        const netEarningsPrevMonth = (() => {
          const now = new Date();
          const prevMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .slice(0, 7);

          const costEntry = personData.costsByMonth?.potentialEarningsByMonth?.find(
            (entry: any) => entry.month === prevMonth
          );

          const cost = parseFloat(costEntry?.costs ?? "0");
          return cost ? `${cost.toFixed(0)} EUR` : "...";
        })();

        return {
          person,
          past12Months: p12m ? `${(p12m * 100).toFixed(0)}%` : "...",
          y2d: ytd ? `${(ytd * 100).toFixed(0)}%` : "...",
          netEarningsPrevMonth,
          ...utilizationByMonth,
        };
      })
      .filter((row): row is TableDataType => row !== null);
  }, []);

  const dynamicMonthKeys = useMemo(() => {
    const firstValidRow = sourceData.find((row: any) =>
      (row.employees || row.externals)?.workforceUtilisation?.lastThreeMonthsIndividually?.length
    );

    const months =
      firstValidRow?.employees?.workforceUtilisation?.lastThreeMonthsIndividually ??
      firstValidRow?.externals?.workforceUtilisation?.lastThreeMonthsIndividually ??
      [];

    return months.map((entry: any) => entry.month);
  }, []);

  const columns = useMemo<MRT_ColumnDef<TableDataType>[]>(() => {
    return [
      { accessorKey: "person", header: "Person" },
      { accessorKey: "past12Months", header: "Past 12 Months" },
      { accessorKey: "y2d", header: "YTD" },
      ...dynamicMonthKeys.map((month) => ({
        accessorKey: month,
        header: month,
      })),
      { accessorKey: "netEarningsPrevMonth", header: "Net Earnings (Prev Month)" },
    ];
  }, [dynamicMonthKeys]);

  const table = useMaterialReactTable({
    columns,
    data: tableData,
    enablePagination: true,
    enableRowNumbers: true,
    initialState: { pagination: { pageSize: 10, pageIndex: 0 } },
  });

  return <MaterialReactTable table={table} />;
}
