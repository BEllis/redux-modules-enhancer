import * as Redux from "redux";

const MODULE_ADDED = "MODULE_LOADED";
const MODULE_REMOVED = "MODULE_UNLOADED";

const modulesEnhancer = function() {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    let currentBaseReducer = reducer;
    let modularReducers = {};
    let modularMiddlewareChain = {};
    const modularCombinedReducer = function(state, action) {
      let modularReducersKeys = Object.keys(modularReducers);
      let modularState = {};
      for (let i = 0; i < modularReducersKeys.length; i++) {
        const key = modularReducersKeys[i];
        modularState[key] = modularReducers[key](state[key], action);
      }

      const newBaseState = currentBaseReducer(state, action);
      return {
        ...newBaseState,
        ...modularState
      }
    }

    const store = createStore(modularCombinedReducer, preloadedState, enhancer);
    let innerDispatch = function(...args) {
      let chainArray = [];
      let keys = Object.keys(modularMiddlewareChain);
      for (let i = 0; i < keys.length; i++) {
        chainArray.push(modularMiddlewareChain[keys[i]]);
      }

      let newState = Redux.compose(...chainArray)(store.dispatch)(...args);
      if (args[0] !== undefined && args[0].type === MODULE_REMOVED) {
        delete newState[args[0].moduleId];
      }

      return newState;
    }

    const hasModule = function(moduleId) {
      if (typeof moduleId !== "string") {
        throw new Error("moduleId must be a string value.");
      }

      return modularReducers[moduleId] !== undefined;
    }

    const addModule = function(moduleId, reducer, initialState, ...middlewares) {
      if (typeof moduleId !== "string") {
        throw new Error("moduleId must be a string value.");
      }

      if (hasModule(moduleId)) {
        throw new Error("Module " + moduleId + " has already been loaded.");
      }

      if (store.getState()[moduleId] !== undefined) {
        throw new Error("Unable to add module [" + moduleId + "] as the name is used by the initial state or a base reducer.")
      }

      const middlewareAPI = {
        getState: store.getState,
        dispatch: (...args) => innerDispatch(...args)
      }

      let chain = middlewares.map(middleware => middleware(middlewareAPI));
      modularMiddlewareChain[moduleId] = Redux.compose(...chain);
      modularReducers[moduleId] = reducer;
      innerDispatch({ type: MODULE_ADDED, moduleId: moduleId });
    }

    const removeModule = function(moduleId) {
      if (typeof moduleId !== "string") {
        throw new Error("moduleId must be a string value.");
      }

      if (!hasModule(moduleId)) {
        throw new Error("No such module [" + moduleId + "] has been added");
      }

      innerDispatch({ type: MODULE_REMOVED, moduleId: moduleId });
      delete modularMiddlewareChain[moduleId];
      delete modularReducers[moduleId];
    }

    const dispatch = innerDispatch;

    return {
      ...store,
      dispatch,
      hasModule,
      addModule,
      removeModule
    };
  };
};

export default modulesEnhancer;
