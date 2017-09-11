import ReduxThunk from 'redux-thunk'

// Action
const actionTypes = {
  DO_STUFF: "@@MyModule/DO_STUFF",
  DO_MORE_STUFF: "@@MyModule/DO_MORE_STUFF",
}

export const DO_STUFF = actionTypes.DO_STUFF;
export const DO_MORE_STUFF = actionTypes.DO_MORE_STUFF;

// Action creators + thunks
const actions = {
  doStuff: (thingsToDo) => { type: DO_STUFF, thingsToDo },
  doMoreStuff: (otherStuffToDo) => { type: DO_MORE_STUFF, otherStuffToDo },
  getStuff: () => (dispatch) => dispatch(actions.doMoreStuff("Add more middleware.")),
}

export const doStuff = actions.doStuff;
export const doMoreStuff = actions.doMoreStuff;
export const getStuff = actions.getStuff;

// Module creator
export default function createMyModule(moduleId, options) {

  const initialState = { stuffToDo: [] };

  const reducerActions = [];
  const reducer = function(state, action) {
    reducerActions.push(action);
    switch (action.type) {
      case DO_STUFF:
        state = Object.assign(state, {});
        state.stuffToDo.push(action.thingsToDo);
        return state;
      case DO_MORE_STUFF:
        state = Object.assign(state, {});
        state.stuffToDo.push(action.otherStuffToDo);
        return state;
      default:
        return state;
    }
  };

  const middlewareActions = [];
  const middleware = [
    store => next => action => { middlewareActions.push(action); return next(action); },
    ReduxThunk,
    store => next => action => { console.log(action); return next(action); },
  ];

  return {
    moduleId,
    reducer,
    initialState,
    middleware,
    ...actions,
    ...actionTypes,
    middlewareActions,
    reducerActions,
  }
}
