import { createSelector } from 'reselect';

const selectQuery = (state) => state.query; // Make sure `query` matches your reducer key in rootReducer

export const selectCurrentQuery = createSelector(
  [selectQuery],
  (query) => query.current
);

export const selectListItems = createSelector(
  [selectQuery],
  (query) => query.list
);

export const selectQueryById = (queryId) =>
  createSelector(
    selectListItems,
    (list) => list.result.items.find((item) => item._id === queryId)
  );

export const selectCreatedQuery = createSelector(
  [selectQuery],
  (query) => query.create
);

export const selectUpdatedQuery = createSelector(
  [selectQuery],
  (query) => query.update
);

export const selectDeletedQuery = createSelector(
  [selectQuery],
  (query) => query.delete
);

export const selectReadQuery = createSelector(
  [selectQuery],
  (query) => query.read
);

export const selectQueryNotes = createSelector(
  [selectQuery],
  (query) => query.notes
);
