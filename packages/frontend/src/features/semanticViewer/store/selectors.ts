import { createSelector } from '@reduxjs/toolkit';
import { type RootState } from '.';

const selectSelectedDimensions = (state: RootState) =>
    state.semanticViewer.selectedDimensions;
const selectSelectedTimeDimensions = (state: RootState) =>
    state.semanticViewer.selectedTimeDimensions;
const selectSelectedMetrics = (state: RootState) =>
    state.semanticViewer.selectedMetrics;

export const selectSelectedFieldsByKind = createSelector(
    [
        selectSelectedDimensions,
        selectSelectedTimeDimensions,
        selectSelectedMetrics,
    ],
    (dimensions, timeDimensions, metrics) => ({
        dimensions,
        timeDimensions,
        metrics,
    }),
);

export const selectAllSelectedFields = createSelector(
    [selectSelectedFieldsByKind],
    ({ dimensions, metrics, timeDimensions }) => {
        return [...dimensions, ...metrics, ...timeDimensions];
    },
);
