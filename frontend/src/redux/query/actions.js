import * as actionTypes from './types';
import { request } from '@/request';

export const query = {
  resetState: () => (dispatch) => {
    dispatch({ type: actionTypes.RESET_STATE });
  },

  resetAction:
    ({ actionType }) =>
      (dispatch) => {
        dispatch({
          type: actionTypes.RESET_ACTION,
          keyState: actionType,
          payload: null,
        });
      },

  currentQuery:
    ({ data }) =>
      (dispatch) => {
        dispatch({
          type: actionTypes.CURRENT_ITEM,
          payload: { ...data },
        });
      },

  currentAction:
    ({ actionType, data }) =>
      (dispatch) => {
        dispatch({
          type: actionTypes.CURRENT_ACTION,
          keyState: actionType,
          payload: { ...data },
        });
      },

  list:
    ({ entity, options = { page: 1, items: 10 } }) =>
      async (dispatch) => {
        dispatch({
          type: actionTypes.REQUEST_LOADING,
          keyState: 'list',
          payload: null,
        });

        const data = await request.listQuery({ entity, options });
        if (data.success === true) {
          const result = {
            items: data.result,
            pagination: {
              current: parseInt(data.pagination.page, 10),
              pageSize: options?.items || 10,
              total: parseInt(data.pagination.count, 10),
            },
          };
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'list',
            payload: result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'list',
            payload: null,
          });
        }
      },

  create:
    ({ entity, jsonData }) =>
      async (dispatch) => {
        dispatch({
          type: actionTypes.REQUEST_LOADING,
          keyState: 'create',
          payload: null,
        });

        const data = await request.createQuery({ entity, jsonData });
        if (data) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'create',
            payload: data,
          });
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: data,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'create',
            payload: null,
          });
        }
      },

  read:
    ({ entity, id }) =>
      async (dispatch) => {
        dispatch({
          type: actionTypes.REQUEST_LOADING,
          keyState: 'read',
          payload: null,
        });

        const data = await request.readQuery({ entity, id });

        if (data.success === true) {
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: data.result,
          });
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'read',
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'read',
            payload: null,
          });
        }
      },

  update:
    ({ entity, id, jsonData }) =>
      async (dispatch) => {
        dispatch({
          type: actionTypes.REQUEST_LOADING,
          keyState: 'update',
          payload: null,
        });

        const data = await request.updateQuery({ entity, id, jsonData });

        if (data) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'update',
            payload: data.result,
          });
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'update',
            payload: null,
          });
        }
      },

  addQueryNotes:
    ({ id, entity, noteData }) =>
      async (dispatch) => {
        dispatch({
          type: actionTypes.REQUEST_LOADING,
          keyState: 'add',
          payload: null,
        });

        const data = await request.addQueryNote({ id, entity, noteData });

        if (data) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'add',
            payload: data.result,
          });
          dispatch({
            type: actionTypes.CURRENT_ITEM,
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'update',
            payload: null,
          });
        }
        return data;
      },
  deleteQueryNote:
    ({ id, noteId, entity }) =>
      async (dispatch) => {
        dispatch({ type: actionTypes.RESET_ACTION, keyState: 'delete' });
        dispatch({
          type: actionTypes.REQUEST_LOADING,
          keyState: 'delete',
          payload: null,
        });

        const data = await request.deleteQueryNote({ id, noteId, entity });

        if (data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'delete',
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'delete',
            payload: null,
          });
        }
      },

  delete:
    ({ entity, id }) =>
      async (dispatch) => {
        dispatch({ type: actionTypes.RESET_ACTION, keyState: 'delete' });
        dispatch({
          type: actionTypes.REQUEST_LOADING,
          keyState: 'delete',
          payload: null,
        });

        const data = await request.deleteQuery({ entity, id });

        if (data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'delete',
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'delete',
            payload: null,
          });
        }
      },

  search:
    ({ entity, options }) =>
      async (dispatch) => {
        dispatch({
          type: actionTypes.REQUEST_LOADING,
          keyState: 'search',
          payload: null,
        });

        const data = await request.search({ entity, options });

        if (data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'search',
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'search',
            payload: null,
          });
        }
      },

  notes:
    ({ entity, id }) =>
      async (dispatch) => {
        dispatch({
          type: actionTypes.REQUEST_LOADING,
          keyState: 'notes',
          payload: null,
        });

        const data = await request.notes({ entity, id });

        if (data.success === true) {
          dispatch({
            type: actionTypes.REQUEST_SUCCESS,
            keyState: 'notes',
            payload: data.result,
          });
        } else {
          dispatch({
            type: actionTypes.REQUEST_FAILED,
            keyState: 'notes',
            payload: null,
          });
        }
      },
};
