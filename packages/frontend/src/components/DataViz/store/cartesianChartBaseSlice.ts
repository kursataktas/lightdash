// This is explicit to exploring
// Not needed when viewing a cartesian chart on a dashboard
import {
    DimensionType,
    isFormat,
    VizIndexType,
    VIZ_DEFAULT_AGGREGATION,
    type CartesianChartDisplay,
    type PivotChartLayout,
    type VizAggregationOptions,
    type VizBarChartConfig,
    type VizCartesianChartOptions,
    type VizLineChartConfig,
} from '@lightdash/common';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export type CartesianChartState = {
    defaultLayout: PivotChartLayout | undefined;
    config: VizBarChartConfig | VizLineChartConfig | undefined;
    options: VizCartesianChartOptions;
};

const initialState: CartesianChartState = {
    defaultLayout: undefined,
    config: undefined,
    options: {
        indexLayoutOptions: [],
        valuesLayoutOptions: { preAggregated: [], customAggregations: [] },
        pivotLayoutOptions: [],
    },
};

export const cartesianChartConfigSlice = createSlice({
    name: 'cartesianChartBaseConfig',
    initialState,
    reducers: {
        // Just a SETTER, it sets the viz index type but should it?
        setXAxisReference: (state, action: PayloadAction<string>) => {
            if (state.config?.fieldConfig) {
                state.config.fieldConfig.x = {
                    reference: action.payload,
                    // TODO: these lookups are awkward and we shouldn't be
                    // defaulting values here.
                    dimensionType:
                        state.options.indexLayoutOptions.find(
                            (x) => x.reference === action.payload,
                        )?.dimensionType ?? DimensionType.STRING,
                    axisType:
                        state.options.indexLayoutOptions.find(
                            (x) => x.reference === action.payload,
                        )?.axisType ?? VizIndexType.CATEGORY,
                };
            }
        },

        // Just a SETTER
        setGroupByReference: (
            { config },
            action: PayloadAction<{
                reference: string;
            }>,
        ) => {
            if (config?.fieldConfig) {
                config.fieldConfig.groupBy = [
                    { reference: action.payload.reference },
                ];
            }
        },

        // Setter
        unsetGroupByReference: ({ config }) => {
            if (config?.fieldConfig) {
                config.fieldConfig.groupBy = undefined;
            }
        },

        // Has logic for default aggregation but it shouldn't
        setYAxisReference: (
            state,
            action: PayloadAction<{
                reference: string;
                index: number;
            }>,
        ) => {
            if (state.config?.fieldConfig?.y) {
                const yAxis = state.config.fieldConfig.y[action.payload.index];

                let matchingOption =
                    state.options.valuesLayoutOptions.preAggregated.find(
                        (option) =>
                            option.reference === action.payload.reference,
                    ) ??
                    state.options.valuesLayoutOptions.customAggregations.find(
                        (option) =>
                            option.reference === action.payload.reference,
                    );

                if (yAxis) {
                    yAxis.reference = action.payload.reference;
                    yAxis.aggregation =
                        matchingOption?.aggregationOptions?.[0] ??
                        VIZ_DEFAULT_AGGREGATION;
                } else {
                    state.config.fieldConfig.y.push({
                        reference: action.payload.reference,
                        aggregation:
                            matchingOption?.aggregationOptions?.[0] ??
                            VIZ_DEFAULT_AGGREGATION,
                    });
                }
            }
        },

        // Just a SETTER
        setYAxisAggregation: (
            { config },
            action: PayloadAction<{
                index: number;
                aggregation: VizAggregationOptions;
            }>,
        ) => {
            if (!config) return;
            if (!config?.fieldConfig?.y) return;

            const yAxis = config.fieldConfig.y[action.payload.index];
            if (yAxis) {
                yAxis.aggregation = action.payload.aggregation;
            }
        },

        // Just a SETTER
        setXAxisLabel: (
            { config },
            action: PayloadAction<CartesianChartDisplay['xAxis']>,
        ) => {
            if (!config) return;
            if (!config.display) {
                config.display = {
                    xAxis: action.payload,
                };
            } else {
                config.display.xAxis = action.payload;
            }
        },

        // Just a SETTER
        setYAxisLabel: (
            { config },
            action: PayloadAction<{ index: number; label: string }>,
        ) => {
            if (!config) return;

            config.display = config.display || {};
            config.display.yAxis = config.display.yAxis || [];

            const { index, label } = action.payload;
            if (config.display.yAxis[index] === undefined) {
                config.display.yAxis[index] = {
                    label,
                };
            } else {
                config.display.yAxis[index].label = label;
            }
        },

        // Just a SETTER
        setSeriesLabel: (
            { config },
            action: PayloadAction<{
                reference: string;
                label: string;
                index: number;
            }>,
        ) => {
            if (!config) return;
            config.display = config.display || {};
            config.display.series = config.display.series || {};
            config.display.series[action.payload.reference] = {
                ...config.display.series[action.payload.reference],
                yAxisIndex: action.payload.index,
                label: action.payload.label,
            };
        },

        // Just a SETTER
        setYAxisPosition: (
            { config },
            action: PayloadAction<{
                index: number;
                position: string | undefined;
            }>,
        ) => {
            if (!config) return;

            config.display = config.display || {};
            config.display.yAxis = config.display.yAxis || [];

            const { index, position } = action.payload;
            if (config.display.yAxis[index] === undefined) {
                config.display.yAxis[index] = {
                    position,
                };
            } else {
                config.display.yAxis[index].position = position;
            }
        },

        // Just a setter
        addYAxisField: (state) => {
            if (!state.config) return;
            if (!state.config.fieldConfig) return;

            const allOptions = [
                ...state.options.valuesLayoutOptions.preAggregated,
                ...state.options.valuesLayoutOptions.customAggregations,
            ];

            const yAxisFieldsAvailable = allOptions.filter(
                (option) =>
                    !state.config?.fieldConfig?.y
                        .map((y) => y.reference)
                        .includes(option.reference),
            );
            const yAxisFields = state.config.fieldConfig.y;

            let defaultYAxisField: string | undefined;

            if (yAxisFieldsAvailable.length > 0) {
                defaultYAxisField = yAxisFieldsAvailable[0].reference;
            } else {
                defaultYAxisField = state.config.fieldConfig.y[0].reference;
            }

            if (yAxisFields) {
                state.config.fieldConfig.y.push({
                    reference: defaultYAxisField,
                    aggregation: VIZ_DEFAULT_AGGREGATION,
                });
            }
        },

        // A setter
        removeYAxisField: (state, action: PayloadAction<number>) => {
            if (!state.config?.fieldConfig?.y) return;

            const index = action.payload;
            state.config.fieldConfig.y.splice(index, 1);

            if (state.config.display) {
                if (state.config.display.yAxis) {
                    state.config.display.yAxis.splice(index, 1);
                }

                if (state.config.display.series) {
                    Object.entries(state.config.display.series).forEach(
                        ([key, series]) => {
                            if (series.yAxisIndex === index) {
                                // NOTE: Delete series from display object when it's removed from yAxis
                                delete state.config?.display?.series?.[key];
                            } else if (
                                // NOTE: Decrease yAxisIndex for series that are after the removed yAxis
                                series.yAxisIndex &&
                                series.yAxisIndex > index
                            ) {
                                series.yAxisIndex--;
                            }
                        },
                    );
                }
            }
        },

        // SETTER
        removeXAxisField: (state) => {
            if (!state.config?.fieldConfig) return;
            delete state.config.fieldConfig.x;
        },

        // SETTER
        setStacked: ({ config }, action: PayloadAction<boolean>) => {
            if (!config) return;

            config.display = config.display || {};

            config.display.stack = action.payload;
        },

        setYAxisFormat: (
            { config },
            action: PayloadAction<{ format: string }>,
        ) => {
            if (!config) return;
            config.display = config.display || {};

            const validFormat = isFormat(action.payload.format)
                ? action.payload.format
                : undefined;

            config.display.yAxis = config.display.yAxis || [];

            if (config.display.yAxis.length === 0) {
                config.display.yAxis.push({ format: validFormat });
            } else {
                config.display.yAxis[0].format = validFormat;
            }

            // Update the format for series with yAxisIndex 0
            if (config.display.series) {
                Object.values(config.display.series).forEach((series) => {
                    if (series.yAxisIndex === 0) {
                        series.format = validFormat;
                    }
                });
            } else if (config.fieldConfig?.y[0].reference) {
                config.display.series = {
                    [config.fieldConfig?.y[0].reference]: {
                        format: validFormat,
                        yAxisIndex: 0,
                    },
                };
            }
        },
        setSeriesFormat: (
            { config },
            action: PayloadAction<{
                index: number;
                format: string;
                reference: string;
            }>,
        ) => {
            if (!config?.display) return;

            const { index, format, reference } = action.payload;
            const validFormat = isFormat(format) ? format : undefined;

            config.display.series = config.display.series || {};
            config.display.series[reference] = {
                ...config.display.series[reference],
                format: validFormat,
                yAxisIndex: index,
            };

            if (index === 0) {
                config.display.yAxis = config.display.yAxis || [];
                config.display.yAxis[0] = {
                    ...config.display.yAxis[0],
                    format: validFormat,
                };
            }
        },
        setSeriesColor: (
            { config },
            action: PayloadAction<{
                reference: string;
                color: string;
                index?: number;
            }>,
        ) => {
            if (!config) return;
            config.display = config.display || {};
            config.display.yAxis = config.display.yAxis || [];
            config.display.series = config.display.series || {};

            if (config.fieldConfig?.y.length === 1) {
                const yReference = config.fieldConfig?.y[0].reference;
                if (yReference) {
                    config.display.series[yReference] = {
                        ...config.display.series[yReference],
                        yAxisIndex: 0,
                        color: action.payload.color,
                    };
                }
            }
            if (action.payload.index !== undefined) {
                config.display.series[action.payload.reference] = {
                    ...config.display.series[action.payload.reference],
                    yAxisIndex: action.payload.index,
                    color: action.payload.color,
                };
            }
        },
    },
});
