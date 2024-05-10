import {
    fieldId as getFieldId,
    formatItemValue,
    isDimension,
    type ApiQueryResults,
    type Field,
} from '@lightdash/common';
import { useMemo } from 'react';
import {
    columnHelper,
    type TableColumn,
} from '../components/common/Table/types';
import useColumnTotals from './useColumnTotals';

type Args = {
    resultsData: ApiQueryResults | undefined;
    columnHeader?: (dimension: Field) => JSX.Element;
};

const useUnderlyingDataColumns = ({ resultsData, columnHeader }: Args) => {
    const totals = useColumnTotals({ resultsData });

    return useMemo(() => {
        if (resultsData) {
            return Object.values(resultsData.fields)
                .filter(isDimension)
                .map<TableColumn>((dimension) => {
                    const fieldId = getFieldId(dimension);
                    return columnHelper.accessor((row) => row[fieldId], {
                        id: fieldId,
                        header: () =>
                            columnHeader !== undefined
                                ? columnHeader(dimension)
                                : dimension.label,
                        cell: (info: any) =>
                            info.getValue()?.value.formatted || '-',
                        footer: () =>
                            totals[fieldId]
                                ? formatItemValue(dimension, totals[fieldId])
                                : null,
                        meta: {
                            item: dimension,
                        },
                    });
                });
        }
        return [];
    }, [resultsData, totals, columnHeader]);
};

export default useUnderlyingDataColumns;
