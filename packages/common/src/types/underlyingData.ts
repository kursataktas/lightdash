import { type ItemsMap } from './field';
import { type ResultValue } from './results';
import { type PivotReference } from './savedCharts';

export type UnderlyingDataConfig = {
    item: ItemsMap[string];
    value: ResultValue;
    fieldValues: Record<string, ResultValue>;
    dimensionsIds?: string[];
    pivotReference?: PivotReference;
};
