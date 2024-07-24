import { type Dashboard } from './dashboard';
import { type DimensionType } from './field';
import { type Organization } from './organization';
import { type Project } from './projects';
import { type ResultRow } from './results';
import { ChartKind } from './savedCharts';
import {
    type ApiJobScheduledResponse,
    type SchedulerJobStatus,
} from './scheduler';
import { type Space } from './space';
import { type LightdashUser } from './user';

export type SqlRunnerPayload = {
    projectUuid: string;
    sql: string;
    userUuid: string;
    organizationUuid: string | undefined;
};

export type SqlRunnerBody = {
    sql: string;
};

export type SqlRunnerResults = ResultRow[];

export enum AggregationOptions {
    PERCENTILE = 'percentile',
    AVERAGE = 'average',
    COUNT = 'count',
    COUNT_DISTINCT = 'count_distinct',
    SUM = 'sum',
    MIN = 'min',
    MAX = 'max',
    NUMBER = 'number',
    MEDIAN = 'median',
}

export const sqlRunnerJob = 'sqlRunner';

export type ApiSqlRunnerJobStatusResponse = {
    status: 'ok';
    results: {
        status: SchedulerJobStatus;
        details: {
            fileUrl: string;
            columns: SqlColumn[];
        };
    };
};

export type SqlTableConfig = {
    columns: {
        [key: string]: {
            visible: boolean;
            reference: string;
            label: string;
            frozen: boolean;
            order?: number;
        };
    };
};

export type TableChartSqlConfig = SqlTableConfig & {
    metadata: {
        version: number;
    };
    type: ChartKind.TABLE;
};

export type Axes = {
    x: {
        reference: string;
        label?: string;
    };
    y: {
        reference: string;
        position?: 'left' | 'right';
        label: string;
        aggregation?: AggregationOptions;
    }[];
};

export type BarChartConfig = {
    metadata: {
        version: number;
    };
    type: ChartKind.VERTICAL_BAR;
    // TODO: should style be optional? or should we always have axes? If so, should we have a default handled in the barChartBizLogic?
    style?: {
        legend:
            | {
                  position: 'top' | 'bottom' | 'left' | 'right';
                  align: 'start' | 'center' | 'end';
              }
            | undefined;
    };

    // TODO: should axes be optional? or should we always have axes? If so, should we have a default handled in the barChartBizLogic?
    axes?: Axes;
    series?: {
        reference: string;
        yIndex: number;
        name: string;
    }[];
};

export type SqlRunnerChartConfig = TableChartSqlConfig | BarChartConfig;

export const isTableChartSQLConfig = (
    value: SqlRunnerChartConfig | undefined,
): value is TableChartSqlConfig => !!value && value.type === ChartKind.TABLE;

export const isBarChartSQLConfig = (
    value: SqlRunnerChartConfig | undefined,
): value is BarChartConfig => !!value && value.type === ChartKind.VERTICAL_BAR;

export type SqlChart = {
    savedSqlUuid: string;
    name: string;
    description: string | null;
    slug: string;
    sql: string;
    config: SqlRunnerChartConfig;
    chartKind: ChartKind;
    createdAt: Date;
    createdBy: Pick<
        LightdashUser,
        'userUuid' | 'firstName' | 'lastName'
    > | null;
    lastUpdatedAt: Date;
    lastUpdatedBy: Pick<
        LightdashUser,
        'userUuid' | 'firstName' | 'lastName'
    > | null;
    space: Pick<Space, 'uuid' | 'name'>;
    dashboard: Pick<Dashboard, 'uuid' | 'name'> | null;
    project: Pick<Project, 'projectUuid'>;
    organization: Pick<Organization, 'organizationUuid'>;
};

export type CreateSqlChart = {
    name: string;
    description: string | null;
    sql: string;
    config: SqlRunnerChartConfig;
    spaceUuid: string;
};

export type UpdateUnversionedSqlChart = {
    name: string;
    description: string | null;
    spaceUuid: string;
};

export type UpdateVersionedSqlChart = {
    sql: string;
    config: SqlRunnerChartConfig;
};

export type UpdateSqlChart = {
    unversionedData?: UpdateUnversionedSqlChart;
    versionedData?: UpdateVersionedSqlChart;
};

export type ApiSqlChart = {
    status: 'ok';
    results: SqlChart;
};

export type ApiCreateSqlChart = {
    status: 'ok';
    results: {
        savedSqlUuid: string;
        slug: string;
    };
};

export type ApiUpdateSqlChart = {
    status: 'ok';
    results: {
        savedSqlUuid: string;
        savedSqlVersionUuid: string | null;
    };
};

export type ApiSqlChartWithResults = {
    status: 'ok';
    results: {
        jobId: ApiJobScheduledResponse['results']['jobId'];
        chart: SqlChart;
    };
};

export type SqlColumn = {
    reference: string;
    type: DimensionType;
};
