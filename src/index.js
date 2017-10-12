import { compose } from "redux";

export const ModulesEnhancerNs = "@@redux-modules-enhancer/";
export const MODULE_ADDED = ModulesEnhancerNs + "MODULE_ADDED";
export const MODULE_REMOVED = ModulesEnhancerNs + "MODULE_REMOVED";

const modulesEnhancer = function() {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    var currentBaseReducer = reducer;
    let modularReducers = {};
    let moduleMiddlewareChain = {};
    let moduleMiddlewareChainNext = {};
    let moduleMiddlewareOrder = [];
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
      const chain = [];
      const keys = Object.keys(moduleMiddlewareChain);
      for (let i = 0; i < keys.length; i++) {
        chain.push(moduleMiddlewareChain[keys[i]]);
      }

      let newState;
      if (keys.length === 0) {
        newState = store.dispatch(...args);
      } else {
        newState = moduleMiddlewareChain[moduleMiddlewareOrder[moduleMiddlewareOrder.length-1]](...args);
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

      if (middleware instanceof Function) {
        middleware = [ middleware ];
      }

      if (middleware instanceof Array) {
        const middlewareAPI = {
          getState: store.getState,
          dispatch: innerDispatch
        }

        let chain = middleware.map(item => item(middlewareAPI));
        if (moduleMiddlewareOrder.length === 0) {
          moduleMiddlewareChainNext[moduleId] = store.dispatch;
        } else {
          moduleMiddlewareChainNext[moduleId] = moduleMiddlewareChain[moduleMiddlewareOrder[moduleMiddlewareOrder.length-1]];
        }

        moduleMiddlewareChain[moduleId] = compose(...chain)((...args) => moduleMiddlewareChainNext[moduleId](...args));
        moduleMiddlewareOrder.push(moduleId);
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
      if (moduleMiddlewareChain[moduleId] !== undefined) {
        let index = moduleMiddlewareOrder.indexOf(moduleId);

        if (index > 0) {
          let previousModuleId = moduleMiddlewareOrder[index - 1];
          let nextInChain = moduleMiddlewareChainNext[moduleId];
          moduleMiddlewareChainNext[previousModuleId] = nextInChain;
        } else {
          if (moduleMiddlewareOrder.length > 1) {
            moduleMiddlewareChainNext[1] = store.dispatch;
          }
        }

        moduleMiddlewareOrder = moduleMiddlewareOrder.splice(index, 1);
        delete moduleMiddlewareChainNext[moduleId];
        delete moduleMiddlewareChain[moduleId];
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
