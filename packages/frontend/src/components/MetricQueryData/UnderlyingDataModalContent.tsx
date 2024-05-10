import { subject } from '@casl/ability';
import {
    ChartType,
    fieldId as getFieldId,
    getDimensions,
    isField,
    isMetric,
    type CreateSavedChartVersion,
} from '@lightdash/common';
import { Box, Button, Group, Modal, Title } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconShare2 } from '@tabler/icons-react';
import { useCallback, useMemo, useState, type FC } from 'react';
import { useParams } from 'react-router-dom';
import { downloadCsv } from '../../api/csv';
import { useExplore } from '../../hooks/useExplore';
import { getExplorerUrlFromCreateSavedChartVersion } from '../../hooks/useExplorerRoute';
import { useUnderlyingDataResults } from '../../hooks/useQueryResults';
import { useApp } from '../../providers/AppProvider';
import { Can } from '../common/Authorization';
import ErrorState from '../common/ErrorState';
import LinkButton from '../common/LinkButton';
import MantineIcon from '../common/MantineIcon';
import { type TableColumn } from '../common/Table/types';
import ExportCSVModal from '../ExportCSV/ExportCSVModal';
import { useMetricQueryDataContext } from './MetricQueryDataProvider';
import UnderlyingDataResultsTable from './UnderlyingDataResultsTable';

const UnderlyingDataModalContent: FC = () => {
    const modalContentElementSize = useElementSize();

    const modalHeaderElementSize = useElementSize();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const { tableName, metricQuery, underlyingDataConfig } =
        useMetricQueryDataContext();

    const { user } = useApp();

    const { data: explore } = useExplore(tableName, { refetchOnMount: false });

    const allDimensions = useMemo(
        () => (explore ? getDimensions(explore) : []),
        [explore],
    );

    const joinedTables = useMemo(
        () =>
            (explore?.joinedTables || []).map(
                (joinedTable) => joinedTable.table,
            ),
        [explore],
    );

    const showUnderlyingValues: string[] | undefined = useMemo(() => {
        return underlyingDataConfig?.item !== undefined &&
            isField(underlyingDataConfig.item) &&
            isMetric(underlyingDataConfig.item)
            ? underlyingDataConfig?.item.showUnderlyingValues
            : undefined;
    }, [underlyingDataConfig?.item]);

    const sortByUnderlyingValues = useCallback(
        (columnA: TableColumn, columnB: TableColumn) => {
            if (showUnderlyingValues === undefined) return 0;

            const indexOfUnderlyingValue = (column: TableColumn): number => {
                const columnDimension = allDimensions.find(
                    (dimension) => getFieldId(dimension) === column.id,
                );
                if (columnDimension === undefined) return -1;
                return showUnderlyingValues?.indexOf(columnDimension.name) !==
                    -1
                    ? showUnderlyingValues?.indexOf(columnDimension.name)
                    : showUnderlyingValues?.indexOf(
                          `${columnDimension.table}.${columnDimension.name}`,
                      );
            };

            return (
                indexOfUnderlyingValue(columnA) -
                indexOfUnderlyingValue(columnB)
            );
        },
        [showUnderlyingValues, allDimensions],
    );

    const {
        error,
        data: resultsData,
        isInitialLoading,
    } = useUnderlyingDataResults(tableName, metricQuery, underlyingDataConfig);

    const exploreFromHereUrl = useMemo(() => {
        if (resultsData) {
            const createSavedChartVersion: CreateSavedChartVersion = {
                tableName: resultsData.metricQuery.exploreName,
                metricQuery: resultsData.metricQuery,
                pivotConfig: undefined,
                tableConfig: {
                    columnOrder: [],
                },
                chartConfig: {
                    type: ChartType.TABLE,
                    config: {},
                },
            };
            const { pathname, search } =
                getExplorerUrlFromCreateSavedChartVersion(
                    projectUuid,
                    createSavedChartVersion,
                );
            return `${pathname}?${search}`;
        }
    }, [resultsData, projectUuid]);

    const getCsvLink = async (limit: number | null, onlyRaw: boolean) => {
        if (resultsData === undefined) {
            throw new Error('No underlying data to export');
        }
        const csvResponse = await downloadCsv({
            projectUuid,
            tableId: tableName,
            query: resultsData.metricQuery,
            csvLimit: limit,
            onlyRaw,
            showTableNames: true,
            columnOrder: [],
        });
        return csvResponse;
    };

    const [isCSVExportModalOpen, setIsCSVExportModalOpen] = useState(false);

    return (
        <Modal.Content
            ref={modalContentElementSize.ref}
            sx={{
                height: 'calc(100dvh - (1rem * 2))',
                width: 'calc(100dvw - (1rem * 2))',
                overflowY: 'hidden',
            }}
        >
            <Modal.Header ref={modalHeaderElementSize.ref}>
                <Modal.Title w="100%">
                    <Group position="apart">
                        <Title order={5}>View underlying data</Title>
                        <Box mr="md">
                            <Can
                                I="manage"
                                this={subject('ExportCsv', {
                                    organizationUuid:
                                        user.data?.organizationUuid,
                                    projectUuid: projectUuid,
                                })}
                            >
                                {resultsData && (
                                    <Button
                                        leftIcon={
                                            <MantineIcon icon={IconShare2} />
                                        }
                                        variant="subtle"
                                        compact
                                        onClick={() =>
                                            setIsCSVExportModalOpen(true)
                                        }
                                    >
                                        Export CSV
                                    </Button>
                                )}
                                <ExportCSVModal
                                    getCsvLink={getCsvLink}
                                    onClose={() =>
                                        setIsCSVExportModalOpen(false)
                                    }
                                    onConfirm={() =>
                                        setIsCSVExportModalOpen(false)
                                    }
                                    opened={isCSVExportModalOpen}
                                    projectUuid={projectUuid}
                                    rows={resultsData?.rows}
                                />
                            </Can>
                            <Can
                                I="manage"
                                this={subject('Explore', {
                                    organizationUuid:
                                        user.data?.organizationUuid,
                                    projectUuid: projectUuid,
                                })}
                            >
                                {exploreFromHereUrl && (
                                    <LinkButton
                                        href={exploreFromHereUrl}
                                        forceRefresh
                                    >
                                        Explore from here
                                    </LinkButton>
                                )}
                            </Can>
                        </Box>
                    </Group>
                </Modal.Title>

                <Modal.CloseButton />
            </Modal.Header>
            <Modal.Body
                h={
                    modalContentElementSize.height -
                    modalHeaderElementSize.height -
                    40
                }
            >
                {error ? (
                    <ErrorState error={error.error} hasMarginTop={false} />
                ) : (
                    <UnderlyingDataResultsTable
                        isLoading={isInitialLoading}
                        resultsData={resultsData}
                        hasJoins={joinedTables.length > 0}
                        sortByUnderlyingValues={sortByUnderlyingValues}
                    />
                )}
            </Modal.Body>
        </Modal.Content>
    );
};

export default UnderlyingDataModalContent;
