import { expect } from "chai";
import * as Redux from "redux";
import modulesEnhancer from "../lib/modulesEnhancer";

describe("modulesEnhancer", function() {
    it("is function", function() {
      expect(modulesEnhancer).to.not.equal(undefined);
      expect(modulesEnhancer instanceof Function).to.equal(true);
    });

    it("should not error when creating a store", function() {
      let reducer = (state = {}, action) => state;
      let initialState = {};
      let enhancer = modulesEnhancer();
      let store = Redux.createStore(reducer, initialState, enhancer);
      store.getState();
      store.dispatch({ type: "TEST" });
    });

    it("should add a addModule method", function() {
      let reducer = (state = {}, action) => state;
      let initialState = {};
      let enhancer = modulesEnhancer();
      let store = Redux.createStore(reducer, initialState, enhancer);
      expect(store.addModule).to.not.equal(undefined);
    });

    it("should add a hasModule method", function() {
      let reducer = (state = {}, action) => state;
      let initialState = {};
      let enhancer = modulesEnhancer();
      let store = Redux.createStore(reducer, initialState, enhancer);
      expect(store.hasModule).to.not.equal(undefined);
    });

    it("should support adding a module", function() {

      const baseReducerActions = [];
      let reducer = (state = {}, action) => { baseReducerActions.push(action); return state };
      let initialState = {};
      let enhancer = modulesEnhancer();
      let store = Redux.createStore(reducer, initialState, enhancer);

      let moduleReducerActions = [];
      let moduleId = "my-module"
      let moduleReducer = function(state, action) {
        moduleReducerActions.push(action);
        return state;
      }

      let moduleInitialState = { bob: "the builder" };

      let middlewareActions = [];
      let moduleMiddleware = store => next => action => { middlewareActions.push(action); return next(action); }

      const MY_AMAZING_ACTION = "MY_AMAZING_ACTION"
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(moduleId, moduleReducer, moduleInitialState, moduleMiddleware);
      store.dispatch({ type: MY_AMAZING_ACTION });

      expect(baseReducerActions.length).to.equal(4); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION
      expect(moduleReducerActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(middlewareActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION

    });

    it("should support removing a module", function() {

      const baseReducerActions = [];
      let reducer = (state = {}, action) => { baseReducerActions.push(action); return state };
      let initialState = {};
      let enhancer = modulesEnhancer();
      let store = Redux.createStore(reducer, initialState, enhancer);

      let moduleReducerActions = [];
      let moduleId = "my-module"
      let moduleReducer = function(state, action) {
        moduleReducerActions.push(action);
        return state;
      }

      let moduleInitialState = { bob: "the builder" };

      let middlewareActions = [];
      let moduleMiddleware = store => next => action => { middlewareActions.push(action); return next(action); }

      const MY_AMAZING_ACTION = "MY_AMAZING_ACTION"
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(moduleId, moduleReducer, moduleInitialState, moduleMiddleware);
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.removeModule(moduleId);
      store.dispatch({ type: MY_AMAZING_ACTION });

      expect(baseReducerActions.length).to.equal(6); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED, MY_AMAZING_ACTION
      expect(moduleReducerActions.length).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED
      expect(middlewareActions.length).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED
      expect(store.getState()["my-module"]).to.equal(undefined);

    });

    it("should support adding a module as a module object", function() {
      const baseReducerActions = [];
      let reducer = (state = {}, action) => { baseReducerActions.push(action); return state };
      let initialState = {};
      let enhancer = modulesEnhancer();

      let store = Redux.createStore(reducer, initialState, enhancer);

      let moduleReducerActions = [];
      let middlewareActions = [];
      let module = {
        moduleId: "my-module",
        reducer: (state, action) => {
          moduleReducerActions.push(action);
          return state;
        },
        state: { bob: "the builder"},
        middlewares: [ store => next => action => { middlewareActions.push(action); return next(action); } ]
      }

      const MY_AMAZING_ACTION = "MY_AMAZING_ACTION"
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });

      expect(baseReducerActions.length).to.equal(4); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION
      expect(moduleReducerActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(middlewareActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
    })

    it("should support removing a module as a module object", function() {

      const baseReducerActions = [];
      let reducer = (state = {}, action) => { baseReducerActions.push(action); return state };
      let initialState = {};
      let enhancer = modulesEnhancer();
      let store = Redux.createStore(reducer, initialState, enhancer);

      let moduleReducerActions = [];
      let middlewareActions = [];
      let module = {
        moduleId: "my-module",
        reducer: (state, action) => {
          moduleReducerActions.push(action);
          return state;
        },
        state: { bob: "the builder"},
        middlewares: [ store => next => action => { middlewareActions.push(action); return next(action); } ]
      }

      const MY_AMAZING_ACTION = "MY_AMAZING_ACTION"
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.removeModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });

      expect(baseReducerActions.length).to.equal(6); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED, MY_AMAZING_ACTION
      expect(moduleReducerActions.length).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED
      expect(middlewareActions.length).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED
      expect(store.getState()["my-module"]).to.equal(undefined);

    });
});
