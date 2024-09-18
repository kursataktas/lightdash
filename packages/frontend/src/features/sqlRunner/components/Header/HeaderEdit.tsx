import { type SqlChart } from '@lightdash/common';
import {
    ActionIcon,
    Button,
    Group,
    Paper,
    Stack,
    Title,
    Tooltip,
} from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { isEqual } from 'lodash';
import { useCallback, useMemo, useState, type FC } from 'react';
import { useHistory } from 'react-router-dom';
import MantineIcon from '../../../../components/common/MantineIcon';
import { UpdatedInfo } from '../../../../components/common/PageHeader/UpdatedInfo';
import { ResourceInfoPopup } from '../../../../components/common/ResourceInfoPopup/ResourceInfoPopup';
import { selectChartConfigByKind } from '../../../../components/DataViz/store/selectors';
import { TitleBreadCrumbs } from '../../../../components/Explorer/SavedChartsHeader/TitleBreadcrumbs';
import { useUpdateSqlChartMutation } from '../../hooks/useSavedSqlCharts';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleModal } from '../../store/sqlRunnerSlice';
import { DeleteSqlChartModal } from '../DeleteSqlChartModal';
import { SaveSqlChartModal } from '../SaveSqlChartModal';
import { UpdateSqlChartModal } from '../UpdateSqlChartModal';

export const HeaderEdit: FC = () => {
    const history = useHistory();
    const dispatch = useAppDispatch();
    const savedSqlChart = useAppSelector(
        (state) => state.sqlRunner.savedSqlChart,
    );
    const { selectedChartType, lastSuccessfulSql } = useAppSelector(
        (state) => state.sqlRunner,
    );
    const limit = useAppSelector((state) => state.sqlRunner.limit);

    const config = useAppSelector((state) =>
        selectChartConfigByKind(state, selectedChartType),
    );

    const { mutate, isLoading } = useUpdateSqlChartMutation(
        savedSqlChart?.project.projectUuid || '',
        savedSqlChart?.savedSqlUuid || '',
    );
    // Store initial chart config to detect if there are any changes later on
    const [initialSavedSqlChart, setInitialSavedSqlChart] = useState<
        Pick<SqlChart, 'sql' | 'limit'> | undefined
    >(savedSqlChart);
    const [initialChartConfig, setInitialChartConfig] = useState(config);

    const hasChanges = useMemo(() => {
        if (!initialSavedSqlChart || !initialChartConfig) return false;
        const changedSql = lastSuccessfulSql !== initialSavedSqlChart.sql;
        const changedLimit = limit !== initialSavedSqlChart.limit;
        const changedConfig = !isEqual(config, initialChartConfig);

        return changedSql || changedLimit || changedConfig;
    }, [
        initialSavedSqlChart,
        initialChartConfig,
        lastSuccessfulSql,
        limit,
        config,
    ]);

    const onSave = useCallback(() => {
        if (config && lastSuccessfulSql) {
            mutate({
                versionedData: {
                    config,
                    sql: lastSuccessfulSql,
                    limit,
                },
            });
            setInitialChartConfig(config);
            setInitialSavedSqlChart({ sql: lastSuccessfulSql, limit });
        }
    }, [config, lastSuccessfulSql, mutate, limit]);

    const isSaveModalOpen = useAppSelector(
        (state) => state.sqlRunner.modals.saveChartModal.isOpen,
    );
    const onCloseSaveModal = useCallback(() => {
        dispatch(toggleModal('saveChartModal'));
    }, [dispatch]);
    const isDeleteModalOpen = useAppSelector(
        (state) => state.sqlRunner.modals.deleteChartModal.isOpen,
    );
    const onCloseDeleteModal = useCallback(() => {
        dispatch(toggleModal('deleteChartModal'));
    }, [dispatch]);
    const isUpdateModalOpen = useAppSelector(
        (state) => state.sqlRunner.modals.updateChartModal.isOpen,
    );
    const onCloseUpdateModal = useCallback(() => {
        dispatch(toggleModal('updateChartModal'));
    }, [dispatch]);

    if (!savedSqlChart) {
        return null;
    }

    return (
        <>
            <Paper shadow="none" radius={0} px="md" py="xs" withBorder>
                <Group position="apart">
                    <Stack spacing="none">
                        <Group spacing="two">
                            <TitleBreadCrumbs
                                projectUuid={savedSqlChart.project.projectUuid}
                                spaceUuid={savedSqlChart.space.uuid}
                                spaceName={savedSqlChart.space.name}
                            />
                            <Title c="dark.6" order={5} fw={600}>
                                {savedSqlChart.name}
                            </Title>
                            <ActionIcon
                                size="xs"
                                onClick={() => {
                                    dispatch(toggleModal('updateChartModal'));
                                }}
                            >
                                <MantineIcon icon={IconPencil} />
                            </ActionIcon>
                        </Group>
                        <Group spacing="xs">
                            <UpdatedInfo
                                updatedAt={savedSqlChart.lastUpdatedAt}
                                user={savedSqlChart.lastUpdatedBy}
                                partiallyBold={false}
                            />
                            <ResourceInfoPopup
                                resourceUuid={savedSqlChart.savedSqlUuid}
                                projectUuid={savedSqlChart.project.projectUuid}
                                description={
                                    savedSqlChart.description ?? undefined
                                }
                                viewStats={savedSqlChart.views}
                                firstViewedAt={savedSqlChart.firstViewedAt}
                                withChartData={false}
                            />
                        </Group>
                    </Stack>

                    <Group spacing="md">
                        <Button
                            size="xs"
                            color={'green.7'}
                            disabled={
                                !config || !lastSuccessfulSql || !hasChanges
                            }
                            loading={isLoading}
                            onClick={() => {
                                if (config && lastSuccessfulSql) {
                                    onSave();
                                }
                            }}
                        >
                            Save
                        </Button>
                        <Tooltip
                            variant="xs"
                            label="Back to view page"
                            position="bottom"
                        >
                            <Button
                                variant="default"
                                size="xs"
                                onClick={() =>
                                    history.push(
                                        `/projects/${savedSqlChart.project.projectUuid}/sql-runner/${savedSqlChart.slug}`,
                                    )
                                }
                            >
                                Cancel
                            </Button>
                        </Tooltip>
                        <Tooltip variant="xs" label="Delete" position="bottom">
                            <ActionIcon
                                size="xs"
                                onClick={() =>
                                    dispatch(toggleModal('deleteChartModal'))
                                }
                            >
                                <MantineIcon icon={IconTrash} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </Paper>
            <SaveSqlChartModal
                key={`${isSaveModalOpen}-saveChartModal`}
                opened={isSaveModalOpen}
                onClose={onCloseSaveModal}
            />

            <UpdateSqlChartModal
                opened={isUpdateModalOpen}
                projectUuid={savedSqlChart.project.projectUuid}
                savedSqlUuid={savedSqlChart.savedSqlUuid}
                onClose={() => onCloseUpdateModal()}
                onSuccess={() => onCloseUpdateModal()}
            />

            <DeleteSqlChartModal
                projectUuid={savedSqlChart.project.projectUuid}
                savedSqlUuid={savedSqlChart.savedSqlUuid}
                name={savedSqlChart.name}
                opened={isDeleteModalOpen}
                onClose={onCloseDeleteModal}
                onSuccess={() =>
                    history.push(
                        `/projects/${savedSqlChart.project.projectUuid}/home`,
                    )
                }
            />
        </>
    );
};
