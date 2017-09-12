import { compose } from "redux";

export const ModulesEnhancerNs = "https://github.com/BEllis/redux-modules-enhancer.git/moduleTemplate/";
export const MODULE_ADDED = ModulesEnhancerNs + "MODULE_ADDED";
export const MODULE_REMOVED = ModulesEnhancerNs + "MODULE_REMOVED";

const modulesEnhancer = function() {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    var currentBaseReducer = reducer;
    let modularReducers = {};
    let modularMiddlewareChain = {};
    let unloaders = {};
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
      const chainArray = [];
      const keys = Object.keys(modularMiddlewareChain);
      for (let i = 0; i < keys.length; i++) {
        chainArray.push(modularMiddlewareChain[keys[i]]);
      }

      let newState;
      if (keys.length === 0) {
        newState = store.dispatch(...args);
      } else {
        newState = compose(...chainArray)(store.dispatch)(...args);
      }

      // TODO: Put this in reducer?
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
      let onLoad = undefined;
      let onUnload = undefined;
      if (moduleId instanceof Object) {
        if (typeof moduleId.moduleId !== "string") {
          throw new Error("module.id must be a string value.");
        }

        const module = moduleId;
        moduleId = module.moduleId;
        reducer = module.reducer;
        initialState = module.initialState;
        middleware = module.middleware;
        onLoad = module.onLoad;
        onUnload = module.onUnload;
      }

      if (typeof moduleId !== "string") {
        throw new Error("moduleId must be a string value.");
      }

      if (hasModule(moduleId)) {
        throw new Error("Module " + moduleId + " has already been loaded.");
      }

      if (middleware instanceof Array && middleware[0] instanceof Array) {
        middleware = middleware[0];
      }

      if (initialState instanceof Function) {
        middleware = [ initialState, ...middleware ]
        initialState = undefined;
      }

      if (initialState instanceof Array && (middleware == undefined || middleware.length === 0)) {
        middleware = initialState;
        initialState = undefined;
      }

      if (store.getState()[moduleId] !== undefined) {
        throw new Error("Unable to add module [" + moduleId + "] as the name is used by the initial state or a base reducer.")
      }

      const middlewareAPI = {
        getState: store.getState,
        dispatch: (...args) => innerDispatch(...args)
      }

      if (middleware instanceof Function) {
        middleware = [ middleware ];
      }

      if (middleware instanceof Array) {
        let chain = middleware.map(item => item(middlewareAPI));
        modularMiddlewareChain[moduleId] = compose(...chain);
      }

      modularReducers[moduleId] = reducer;
      innerDispatch({ type: MODULE_ADDED, moduleId: moduleId, initialState: initialState });
      if (onLoad instanceof Function) {
        onLoad(innerDispatch);
      }

      if (onUnload instanceof Function) {
        unloaders[moduleId] = onUnload;
      }
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

      if (unloaders[moduleId] instanceof Function) {
        unloaders[moduleId](innerDispatch);
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
