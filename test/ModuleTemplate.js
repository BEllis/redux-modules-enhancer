import thunk from 'redux-thunk'
import { MIDDLEWARE_ACTION } from "./UnitTestModule";
import { moduleTemplateNs, unitTestNs } from "./namespaces.json";
import { List } from "immutable";

const nss = moduleTemplateNs;

// Action Types
const DO_MORE_STUFF = nss + "DO_MORE_STUFF";
const DO_STUFF =  nss + "DO_STUFF";

const publicActionTypes = {
  DO_STUFF,
}

// Action creators + thunks
const doMoreStuff = (otherStuffToDo) => { return { type: DO_MORE_STUFF, otherStuffToDo } };
const doStuff = (thingsToDo) => { return { type: DO_STUFF, thingsToDo } };
const getStuff = () => (dispatch) => dispatch(doMoreStuff("Add more middleware."));

const publicActions = {
  doStuff,
  getStuff,
};

// Reducer
const reducer = function(state, action) {
  // Used in unit test.
  if (state === undefined || state === null) {
    state = { reducerActions: List([]), middlewareActions: List([]) };
  }

  state = Object.assign(state, {});
  if (action.type !== MIDDLEWARE_ACTION) {
    state.reducerActions = state.reducerActions.push(action);
  }

  if (action.type === MIDDLEWARE_ACTION) {
    state.middlewareActions = state.middlewareActions.push(action.action);
  }

  switch (action.type) {
    case DO_STUFF:
      state.stuffToDo = state.stuffToDo.push(action.thingsToDo);
      return state;
    case DO_MORE_STUFF:
      state.stuffToDo = state.stuffToDo.push(action.otherStuffToDo);
      return state;
    default:
      return state;
  }
};

export const actions = publicActions;
export const actionTypes = publicActionTypes;

// Module factory
export default function createMyModule(moduleId, options) {
  const initialState = { stuffToDo: List([]), reducerActions: List([]), middlewareActions: List([]) };
  const middleware = [
    // Used in unit test (this is hack, must be a neater way to do this.)
    store => next => action => { const result = next(action); next({ type: MIDDLEWARE_ACTION, action }); return result;},
    thunk,
  ];

  return {
    moduleId,
    reducer,
    initialState,
    middleware,
    actions,
    actionTypes,
  }
}
