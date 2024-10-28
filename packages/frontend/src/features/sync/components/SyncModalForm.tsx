import {
    formatMinutesOffset,
    getTzMinutesOffset,
    SchedulerFormat,
    type CreateSchedulerAndTargetsWithoutIds,
    type UpdateSchedulerAndTargetsWithoutId,
} from '@lightdash/common';
import {
    Box,
    Button,
    Group,
    Input,
    Space,
    Stack,
    TextInput,
} from '@mantine/core';
import { IconCirclesRelation } from '@tabler/icons-react';
import { useEffect, useMemo, type FC } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import ErrorState from '../../../components/common/ErrorState';
import MantineIcon from '../../../components/common/MantineIcon';
import SuboptimalState from '../../../components/common/SuboptimalState/SuboptimalState';
import TimeZonePicker from '../../../components/common/TimeZonePicker';
import CronInput from '../../../components/ReactHookForm/CronInput';
import { useChartSchedulerCreateMutation } from '../../../features/scheduler/hooks/useChartSchedulers';
import { useScheduler } from '../../../features/scheduler/hooks/useScheduler';
import { useSchedulersUpdateMutation } from '../../../features/scheduler/hooks/useSchedulersUpdateMutation';
import { useActiveProjectUuid } from '../../../hooks/useActiveProject';
import { useProject } from '../../../hooks/useProject';
import { isInvalidCronExpression } from '../../../utils/fieldValidators';
import { SyncModalAction, useSyncModal } from '../providers/SyncModalProvider';
import { SelectGoogleSheetButton } from './SelectGoogleSheetButton';

export const SyncModalForm: FC<{ chartUuid: string }> = ({ chartUuid }) => {
    const { action, setAction, currentSchedulerUuid } = useSyncModal();

    const isEditing = action === SyncModalAction.EDIT;
    const {
        data: schedulerData,
        isInitialLoading: isLoadingSchedulerData,
        isError: isSchedulerError,
        error: schedulerError,
    } = useScheduler(currentSchedulerUuid ?? '', {
        enabled: !!currentSchedulerUuid && isEditing,
    });

    const {
        mutate: updateChartSync,
        isLoading: isUpdateChartSyncLoading,
        isSuccess: isUpdateChartSyncSuccess,
    } = useSchedulersUpdateMutation(currentSchedulerUuid ?? '');
    const {
        mutate: createChartSync,
        isLoading: isCreateChartSyncLoading,
        isSuccess: isCreateChartSyncSuccess,
    } = useChartSchedulerCreateMutation();

    const { activeProjectUuid } = useActiveProjectUuid();
    const { data: project } = useProject(activeProjectUuid);

    const isLoading = isCreateChartSyncLoading || isUpdateChartSyncLoading;
    const isSuccess = isCreateChartSyncSuccess || isUpdateChartSyncSuccess;

    const methods = useForm<CreateSchedulerAndTargetsWithoutIds>({
        mode: 'onSubmit',
        defaultValues: {
            cron: '0 9 * * *',
            name: '',
            options: {
                gdriveId: '',
                gdriveName: '',
                gdriveOrganizationName: '',
                url: '',
            },
            timezone: undefined,
        },
    });

    useEffect(() => {
        if (schedulerData && isEditing) {
            methods.reset(schedulerData);
            methods.setValue('timezone', schedulerData.timezone);
        }
    }, [isEditing, methods, schedulerData]);

    const handleSubmit = (
        data:
            | CreateSchedulerAndTargetsWithoutIds
            | UpdateSchedulerAndTargetsWithoutId,
    ) => {
        const defaultNewSchedulerValues = {
            format: SchedulerFormat.GSHEETS,
            enabled: true,
            targets: [],
        };

        if (isEditing) {
            updateChartSync({
                ...data,
                ...defaultNewSchedulerValues,
            });
            return;
        }

        createChartSync({
            resourceUuid: chartUuid,
            data: {
                ...data,
                ...defaultNewSchedulerValues,
            },
        });
    };

    useEffect(() => {
        if (isSuccess) {
            methods.reset();
            setAction(SyncModalAction.VIEW);
        }
    }, [isSuccess, methods, setAction]);

    const hasSetGoogleSheet = methods.watch('options.gdriveId') !== '';

    const projectDefaultOffsetString = useMemo(() => {
        if (!project) {
            return;
        }
        const minsOffset = getTzMinutesOffset('UTC', project.schedulerTimezone);
        return formatMinutesOffset(minsOffset);
    }, [project]);

    const timezoneValue = methods.watch('timezone');

    if (isEditing && isLoadingSchedulerData) {
        return <SuboptimalState title="Loading Sync" loading />;
    }

    if (isEditing && isSchedulerError) {
        return <ErrorState error={schedulerError.error} />;
    }

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
                <Stack>
                    <TextInput
                        label="Name the Sync"
                        required
                        {...methods.register('name')}
                    />
                    <Group align="flex-end">
                        <Input.Wrapper label="Set the frequency" required>
                            <Box>
                                <CronInput
                                    name="cron"
                                    defaultValue="0 9 * * 1"
                                    rules={{
                                        required: 'Required field',
                                        validate: {
                                            isValidCronExpression:
                                                isInvalidCronExpression(
                                                    'Cron expression',
                                                ),
                                        },
                                    }}
                                />
                            </Box>
                        </Input.Wrapper>
                        <TimeZonePicker
                            size="sm"
                            style={{ flexGrow: 1 }}
                            placeholder={`Project Default ${
                                projectDefaultOffsetString
                                    ? `(UTC ${projectDefaultOffsetString})`
                                    : ''
                            }`}
                            maw={350}
                            searchable
                            clearable
                            variant="default"
                            withinPortal
                            {...methods.register('timezone')}
                            onChange={(value) => {
                                methods.setValue(
                                    'timezone',
                                    value ?? undefined,
                                );
                            }}
                            value={timezoneValue}
                        />
                    </Group>

                    <SelectGoogleSheetButton />

                    <Space />

                    <Group position="apart">
                        <Button
                            variant="outline"
                            loading={isLoading}
                            onClick={() => setAction(SyncModalAction.VIEW)}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={!hasSetGoogleSheet}
                            loading={isLoading}
                            leftIcon={
                                !isEditing && (
                                    <MantineIcon icon={IconCirclesRelation} />
                                )
                            }
                        >
                            {isEditing ? 'Save changes' : 'Sync'}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </FormProvider>
    );
};
