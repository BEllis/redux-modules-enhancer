import * as Redux from "redux";

const MODULE_ADDED = "@@modulesEnhancer/MODULE_LOADED";
const MODULE_REMOVED = "@@modulesEnhancer/MODULE_UNLOADED";

const modulesEnhancer = function() {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    var currentBaseReducer = reducer;
    let modularReducers = {};
    let modularMiddlewareChain = {};
    const modularCombinedReducer = function(state, action) {
      if (action.type === MODULE_ADDED) {
        state[action.moduleId] = action.initialState;
      }

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
      if (moduleId instanceof Object) {
        if (typeof moduleId.moduleId !== "string") {
          throw new Error("module.id must be a string value.");
        }

        moduleId = moduleId.moduleId;
      }

      if (typeof moduleId !== "string") {
        throw new Error("moduleId must be a string value.");
      }

      return modularReducers[moduleId] !== undefined;
    }

    const addModule = function(moduleId, reducer, initialState, ...middleware) {
      if (moduleId instanceof Object) {
        if (typeof moduleId.moduleId !== "string") {
          throw new Error("module.id must be a string value.");
        }

        const module = moduleId;
        moduleId = module.moduleId;
        reducer = module.reducer;
        initialState = module.initialState;
        middleware = module.middleware;
      }

      if (typeof moduleId !== "string") {
        throw new Error("moduleId must be a string value.");
      }

      if (hasModule(moduleId)) {
        throw new Error("Module " + moduleId + " has already been loaded.");
      }

      if (initialState instanceof Function) {
        middleware = [ initialState, ...middleware ]
      }

      if (initialState instanceof Array && (middleware == undefined || middleware.length === 0)) {
        middleware = initialState;
      }

      if (store.getState()[moduleId] !== undefined) {
        throw new Error("Unable to add module [" + moduleId + "] as the name is used by the initial state or a base reducer.")
      }

      const middlewareAPI = {
        getState: store.getState,
        dispatch: (...args) => innerDispatch(...args)
      }

      if (middleware instanceof Function) {
        middleware = [ middleware];
      }

      if (middleware instanceof Array) {
        let chain = middleware.map(middleware => middleware(middlewareAPI));
        modularMiddlewareChain[moduleId] = Redux.compose(...chain);
      }

      modularReducers[moduleId] = reducer;
      innerDispatch({ type: MODULE_ADDED, moduleId: moduleId, initialState: initialState });
    }

    const removeModule = function(moduleId) {
      if (moduleId instanceof Object) {
        if (typeof moduleId.moduleId !== "string") {
          throw new Error("module.id must be a string value.");
        }

        moduleId = moduleId.moduleId;
      }

      if (typeof moduleId !== "string") {
        throw new Error("moduleId must be a string value.");
      }

      if (!hasModule(moduleId)) {
        throw new Error("No such module [" + moduleId + "] has been added");
      }

      innerDispatch({ type: MODULE_REMOVED, moduleId: moduleId });
      if (modularMiddlewareChain[moduleId] !== undefined) {
        delete modularMiddlewareChain[moduleId];
      }

      if (modularReducers[moduleId] !== undefined) {
        delete modularReducers[moduleId];
      }
    }

    const replaceReducer = function(nextReducer) {
      currentBaseReducer = nextReducer;
      store.replaceReducer(modularCombinedReducer);
    }

    const dispatch = innerDispatch;

    return {
      ...store,
      replaceReducer,
      dispatch,
      hasModule,
      addModule,
      removeModule
    };
  };
};

export default modulesEnhancer;
