import {
    CompiledDimension,
    CompiledMetric,
    FieldId,
    fieldId,
    FieldType,
    friendlyName,
} from '@lightdash/common';
import { Button, Group, Stack } from '@mantine/core';
import { IconHammer, IconPlayerPlay } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useProjectCatalog } from '../../hooks/useProjectCatalog';
import { useSqlQueryMutation } from '../../hooks/useSqlQuery';
import {
    ExploreMode,
    useExplorerContext,
} from '../../providers/ExplorerProvider';
import CollapsableCard from '../common/CollapsableCard';
import MantineIcon from '../common/MantineIcon';
import SqlRunnerInput from '../SqlRunner/SqlRunnerInput';
import SqlRunnerResultsTable from '../SqlRunner/SqlRunnerResultsTable';

const CUSTOM_EXPLORE_ALIAS_NAME = 'custom_explore';

type Props = {};

const ExploreCreate: FC<Props> = ({}) => {
    const history = useHistory();

    const { projectUuid } = useParams<{ projectUuid: string }>();

    const sql = useExplorerContext((c) => c.state.customSql?.sql);
    const setMode = useExplorerContext((c) => c.actions.setMode);
    const setMetricQuery = useExplorerContext((c) => c.actions.setMetricQuery);
    const setCustomSqlResults = useExplorerContext(
        (c) => c.actions.setCustomSqlResults,
    );

    const updateCustomSql = useExplorerContext(
        (state) => state.actions.updateCustomSql,
    );

    const { isLoading: isCatalogLoading, data: catalogData } =
        useProjectCatalog();

    const sqlQueryMutation = useSqlQueryMutation();

    const { mutate, data, isLoading: isQueryLoading } = sqlQueryMutation;

    const isLoading = isCatalogLoading || isQueryLoading;

    const [expandedCards, setExpandedCards] = useState(
        new Map([
            ['sql', true],
            ['results', true],
        ]),
    );

    const handleCardExpand = (card: string, value: boolean) => {
        setExpandedCards((prev) => new Map(prev).set(card, value));
    };

    const fields = useMemo(() => {
        return Object.entries(data?.fields || []).reduce<{
            sqlQueryDimensions: Record<FieldId, CompiledDimension>;
            sqlQueryMetrics: Record<FieldId, CompiledMetric>;
        }>(
            (acc, [key, { type }]) => {
                const dimension: CompiledDimension = {
                    fieldType: FieldType.DIMENSION,
                    type,
                    name: key,
                    label: friendlyName(key),
                    table: CUSTOM_EXPLORE_ALIAS_NAME,
                    tableLabel: '',
                    sql: `${CUSTOM_EXPLORE_ALIAS_NAME}.${key}`,
                    compiledSql: `${CUSTOM_EXPLORE_ALIAS_NAME}.${key}`,
                    tablesReferences: [CUSTOM_EXPLORE_ALIAS_NAME],
                    hidden: false,
                };
                return {
                    ...acc,
                    sqlQueryDimensions: {
                        ...acc.sqlQueryDimensions,
                        [fieldId(dimension)]: dimension,
                    },
                };
            },
            { sqlQueryDimensions: {}, sqlQueryMetrics: {} },
        );
    }, [data]);

    const [dimensionKeys, metricKeys]: [string[], string[]] = useMemo(() => {
        return [
            Object.keys(fields.sqlQueryDimensions),
            Object.keys(fields.sqlQueryMetrics),
        ];
    }, [fields]);

    const resultsData = useMemo(() => {
        if (!data?.rows) return undefined;

        return {
            metricQuery: {
                exploreName: CUSTOM_EXPLORE_ALIAS_NAME,
                dimensions: dimensionKeys,
                metrics: metricKeys,
                filters: {},
                sorts: [],
                limit: 0,
                tableCalculations: [],
            },
            cacheMetadata: {
                cacheHit: false,
            },
            rows: data.rows.map((row) =>
                Object.keys(row).reduce((acc, columnName) => {
                    const raw = row[columnName];
                    return {
                        ...acc,
                        [`${CUSTOM_EXPLORE_ALIAS_NAME}_${columnName}`]: {
                            value: {
                                raw,
                                formatted: `${raw}`,
                            },
                        },
                    };
                }, {}),
            ),
            fields: {
                ...fields.sqlQueryDimensions,
                ...fields.sqlQueryMetrics,
            },
        };
    }, [data, fields, dimensionKeys, metricKeys]);

    useEffect(() => {
        if (!resultsData) return;
        setCustomSqlResults(resultsData);
        setMetricQuery(resultsData.metricQuery);
    }, [resultsData, setMetricQuery, setCustomSqlResults]);

    const handleSubmit = useCallback(() => {
        if (!sql) return;

        mutate(sql);
    }, [mutate, sql]);

    const handleChartBuild = useCallback(() => {
        // TODO: don't like this approach, need to refactor
        setMode(ExploreMode.EDIT);
        history.push(`/projects/${projectUuid}/explore/build`);
    }, [setMode, history, projectUuid]);

    // TODO: add proper loading state
    if (isCatalogLoading) {
        return null;
    }

    return (
        <Stack mt="lg" spacing="sm" sx={{ flexGrow: 1 }}>
            <Group position="right">
                <Button
                    loading={isLoading}
                    size="xs"
                    leftIcon={<MantineIcon icon={IconPlayerPlay} />}
                    onClick={handleSubmit}
                >
                    Run SQL
                </Button>

                <Button
                    disabled={isLoading}
                    size="xs"
                    variant="outline"
                    leftIcon={<MantineIcon icon={IconHammer} />}
                    onClick={handleChartBuild}
                >
                    Build a chart
                </Button>
            </Group>

            <CollapsableCard
                title="SQL"
                isOpen={expandedCards.get('sql')}
                onToggle={(value) => handleCardExpand('sql', value)}
            >
                <SqlRunnerInput
                    sql={sql ?? ''}
                    onChange={updateCustomSql}
                    projectCatalog={catalogData}
                    isDisabled={isLoading}
                />
            </CollapsableCard>

            <CollapsableCard
                title="Results"
                isOpen={expandedCards.get('results')}
                onToggle={(value) => handleCardExpand('results', value)}
            >
                <SqlRunnerResultsTable
                    onSubmit={handleSubmit}
                    resultsData={resultsData}
                    fieldsMap={{
                        ...fields.sqlQueryDimensions,
                        ...fields.sqlQueryMetrics,
                    }}
                    sqlQueryMutation={sqlQueryMutation}
                />
            </CollapsableCard>
        </Stack>
    );
};

export default ExploreCreate;
