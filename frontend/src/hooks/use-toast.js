'use client';

import * as React from 'react';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map();

const listeners = [];

let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case 'DISMISS_TOAST': {
      const { toastId } = action;
      if (toastId) {
        toastTimeouts.set(
          toastId,
          setTimeout(() => {
            toastTimeouts.delete(toastId);
            dispatch({
              type: 'REMOVE_TOAST',
              toastId,
            });
          }, TOAST_REMOVE_DELAY)
        );
      }
      return {
        ...state,
        toasts: state.toasts.map((toast) =>
          toast.id === toastId
            ? { ...toast, open: false }
            : toast
        ),
      };
    }
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(
          (toast) => toast.id !== action.toastId
        ),
      };
    default:
      return state;
  }
}

function toast({ title, description, variant }) {
  const id = genId();

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      id,
      title,
      description,
      variant,
      open: true,
      onOpenChange: (open) => {
        if (!open)
          dispatch({ type: 'DISMISS_TOAST', toastId: id });
      },
    },
  });

  return {
    id,
    dismiss: () =>
      dispatch({ type: 'DISMISS_TOAST', toastId: id }),
  };
}

function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state,
    toast,
  };
}

export { useToast, toast };
