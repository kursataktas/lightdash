import {
    ApiQueryResults,
    formatItemValue,
    friendlyName,
    isField,
    ItemsMap,
    ResultRow,
} from '@lightdash/common';
import { Row } from '@tanstack/react-table';
import React from 'react';
import {
    TableHeaderBoldLabel,
    TableHeaderLabelContainer,
    TableHeaderRegularLabel,
} from '../../components/common/Table/Table.styles';
import {
    columnHelper,
    TableColumn,
    TableHeader,
} from '../../components/common/Table/types';

type Args = {
    itemsMap: ItemsMap;
    selectedItemIds: string[];
    resultsData: ApiQueryResults;
    isColumnVisible: (key: string) => boolean;
    isColumnFrozen: (key: string) => boolean;
    showTableNames: boolean;
    getFieldLabelOverride: (key: string) => string | undefined;
    columnOrder: string[];
    totals?: Record<string, number>;
};

// Adapted from https://stackoverflow.com/a/45337588
const decimalLength = (numStr: number) => {
    const pieces = numStr.toString().split('.');
    if (!pieces[1]) return 0;
    return pieces[1].length;
};
const getDecimalPrecision = (addend1: number, addend2: number) =>
    Math.pow(10, Math.max(decimalLength(addend1), decimalLength(addend2)));

const getDataAndColumns = ({
    itemsMap,
    selectedItemIds,
    resultsData,
    isColumnVisible,
    isColumnFrozen,
    showTableNames,
    getFieldLabelOverride,
    columnOrder,
    totals,
}: Args): {
    rows: ResultRow[];
    columns: Array<TableHeader | TableColumn>;
    error?: string;
} => {
    const columns = selectedItemIds.reduce<Array<TableHeader | TableColumn>>(
        (acc, itemId) => {
            const item = itemsMap[itemId] as
                | typeof itemsMap[number]
                | undefined;

            if (!columnOrder.includes(itemId)) {
                return acc;
            }
            const headerOverride = getFieldLabelOverride(itemId);

            const anyItem = item as any;
            const shouldAggregate =
                anyItem?.fieldType === 'metric' &&
                ['sum', 'count'].includes(anyItem.type);
            const aggregationFunction = shouldAggregate
                ? (
                      columnId: string,
                      _leafRows: Row<ResultRow>[],
                      childRows: Row<ResultRow>[],
                  ) => {
                      const aggregatedValue = childRows.reduce((sum, next) => {
                          const nextValue =
                              next.getValue<any>(columnId).value.raw;
                          const numVal = Number(nextValue);
                          const adder = isNaN(numVal) ? 0 : numVal;
                          const precision = getDecimalPrecision(numVal, sum);
                          const result =
                              (sum * precision + adder * precision) / precision;

                          return result;
                      }, 0);

                      return <b>{formatItemValue(item, aggregatedValue)}</b>;
                  }
                : undefined;

            const column: TableHeader | TableColumn = columnHelper.accessor(
                (row) => row[itemId],
                {
                    id: itemId,
                    header: () => (
                        <TableHeaderLabelContainer>
                            {!!headerOverride ? (
                                <TableHeaderBoldLabel>
                                    {headerOverride}
                                </TableHeaderBoldLabel>
                            ) : isField(item) ? (
                                <>
                                    {showTableNames && (
                                        <TableHeaderRegularLabel>
                                            {item.tableLabel}{' '}
                                        </TableHeaderRegularLabel>
                                    )}

                                    <TableHeaderBoldLabel>
                                        {item.label}
                                    </TableHeaderBoldLabel>
                                </>
                            ) : (
                                <TableHeaderBoldLabel>
                                    {item === undefined
                                        ? 'Undefined'
                                        : 'displayName' in item
                                        ? item.displayName
                                        : friendlyName(item.name)}
                                </TableHeaderBoldLabel>
                            )}
                        </TableHeaderLabelContainer>
                    ),
                    cell: (info: any) =>
                        info.getValue()?.value.formatted || '-',

                    footer: () =>
                        totals?.[itemId]
                            ? formatItemValue(item, totals[itemId])
                            : null,
                    meta: {
                        item,
                        isVisible: isColumnVisible(itemId),
                        frozen: isColumnFrozen(itemId),
                    },

                    // Some features work in the TanStack Table demos but not here, for unknown reasons.
                    // For example, setting grouping value here does not work. The workaround is to use
                    // a custom getGroupedRowModel.
                    // getGroupingValue: (row) => { // Never gets called.
                    //     const value = row[itemId]?.value.raw;
                    //     return value === null || value === undefined ? 'null' : value;
                    // },
                    // aggregationFn: 'sum', // Not working.
                    // aggregationFn: 'max', // At least results in a cell value, although it's incorrect.

                    aggregationFn: aggregationFunction,
                    aggregatedCell: (info: any) => {
                        const value = info.getValue();
                        const ret = value ?? info.cell.getValue();
                        const numVal = Number(ret);
                        return isNaN(numVal) ? ret : numVal;
                    },
                },
            );
            return [...acc, column];
        },
        [],
    );
    return {
        rows: resultsData.rows,
        columns,
    };
};

export default getDataAndColumns;
