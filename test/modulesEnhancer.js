import { expect } from "chai";
import * as Redux from "redux";
import modulesEnhancer from "../lib/modulesEnhancer";

const MY_AMAZING_ACTION = "MY_AMAZING_ACTION";
const createSampleModule = () => {
  const middlewareActions = [];
  const reducerActions = [];
  return {
    moduleId: "my-module-id",
    reducer: (state, action) => { reducerActions.push(action); return state; },
    initialState: { bob: "the builder" },
    middleware: store => next => action => { middlewareActions.push(action); return next(action); },
    middlewareActions,
    reducerActions,
  }
};

const createStoreWithEnhancer = () => {
  const baseReducerActions = [];
  const reducer = (state = {}, action) => { baseReducerActions.push(action); return state };
  const initialState = {};
  const enhancer = modulesEnhancer();
  const store = Redux.createStore(reducer, initialState, enhancer);
  store.baseReducerActions = baseReducerActions;
  return store;
}

describe("modulesEnhancer", function() {
  it("is function", function() {
    // Assert
    expect(modulesEnhancer).to.not.equal(undefined);
    expect(modulesEnhancer instanceof Function).to.equal(true);
  });

  it("does not break getState or dispatch when creating a store", function() {
    // Arrange + Action
    const store = createStoreWithEnhancer();

    // Assert
    store.getState();
    store.dispatch({ type: "TEST" });
  });

  describe("store.addModule", function() {

    it("store has an addModule function", function() {
      const store = createStoreWithEnhancer();
      expect(store.addModule).to.not.equal(undefined);
    });

    it("adds a module", function() {
      // Arrange
      const store = createStoreWithEnhancer();
      const module = createSampleModule();

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module.moduleId, module.reducer, module.initialState, module.middleware);
      store.dispatch({ type: MY_AMAZING_ACTION });

      // Assert
      expect(store.baseReducerActions.length).to.equal(4); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION
      expect(module.reducerActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(module.middlewareActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
    });

    it("adds a module with only moduleId, reducer and middleware", function() {
      // Arrange
      const store = createStoreWithEnhancer();
      const module = createSampleModule();

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module.moduleId, module.reducer, module.middleware);
      store.dispatch({ type: MY_AMAZING_ACTION });

      // Assert
      expect(store.baseReducerActions.length).to.equal(4); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION
      expect(module.reducerActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(module.middlewareActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
    });

    it("adds a module as a module object", function() {
      // Arrange
      const store = createStoreWithEnhancer();
      const module = createSampleModule();

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });

      // Assert
      expect(store.baseReducerActions.length).to.equal(4); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION
      expect(module.reducerActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(module.middlewareActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
    });

    it("adds a module as a module object with only moduleId and reducer", function() {
      // Arrange
      const store = createStoreWithEnhancer();
      const module = createSampleModule();
      delete module.initialState;
      delete module.middleware;

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });

      // Assert
      expect(store.baseReducerActions.length).to.equal(4); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION
      expect(module.reducerActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(module.middlewareActions.length).to.equal(0); // MODULE_ADDED, MY_AMAZING_ACTION
    });

    it("adds a module as a module object with only moduleId, reducer and middleware", function() {
      // Arange
      const store = createStoreWithEnhancer();
      const module = createSampleModule();
      delete module.initialState;

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });

      // Assert
      expect(store.baseReducerActions.length).to.equal(4); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION
      expect(module.reducerActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(module.middlewareActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
    });

    it("adds a module as a module object with only moduleId, reducer and initialState", function() {
      // Arrange
      const store = createStoreWithEnhancer()
      const module = createSampleModule();
      delete module.middleware;

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });

      // Assert
      expect(store.baseReducerActions.length).to.equal(4); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION
      expect(module.reducerActions.length).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(module.middlewareActions.length).to.equal(0); // MODULE_ADDED, MY_AMAZING_ACTION
    });

    it("sets initial state when adding a module", function() {
      // Arrange
      const store = createStoreWithEnhancer();
      const module = createSampleModule();

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module.moduleId, module.reducer, module.initialState, module.middleware);

      // Assert
      expect(store.getState()[module.moduleId]).to.deep.equal({ bob: "the builder" });
    })

  });

  describe("store.removeModule", function() {

    it("store has an removeModule function", function() {
      // Arrange + Action
      const store = createStoreWithEnhancer();

      // Assert
      expect(store.removeModule).to.not.equal(undefined);
    });

    it("removes a module using moduleId", function() {
      // Arrange
      const store = createStoreWithEnhancer();
      const module = createSampleModule();

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.removeModule(module.moduleId);
      store.dispatch({ type: MY_AMAZING_ACTION });

      // Assert
      expect(store.baseReducerActions.length).to.equal(6); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED, MY_AMAZING_ACTION
      expect(module.reducerActions.length).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED
      expect(module.middlewareActions.length).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED
      expect(store.getState()["my-module"]).to.equal(undefined);
    });

    it("removes a module using module object", function() {
      // Arrange
      const store = createStoreWithEnhancer();
      const module = createSampleModule();

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.removeModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });

      // Assert
      expect(store.baseReducerActions.length).to.equal(6); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED, MY_AMAZING_ACTION
      expect(module.reducerActions.length).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED
      expect(module.middlewareActions.length).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED
      expect(store.getState()["my-module"]).to.equal(undefined);
    });

  });

  describe("store.hasModule", function() {

    it("store has a hasModule function", function() {
      // Arrange + Action
      const store = createStoreWithEnhancer();

      // Assert
      expect(store.hasModule).to.not.equal(undefined);
    });
  });

  describe("store.replaceReducer", function() {
    it("only changes the base reducer, module reducers and middleware still work.", function() {
      // Arrange
      const newReducerActions = [];
      const store = createStoreWithEnhancer();
      const module = createSampleModule();
      const newReducer = (state, action) => {
        newReducerActions.push(action);
        return state;
      }

      store.addModule(module);
      store.baseReducerActions.length = 0;
      module.reducerActions.length = 0;
      module.middlewareActions.length = 0;

      // Action
      store.replaceReducer(newReducer);
      store.dispatch({ type: MY_AMAZING_ACTION })

      // Assert
      expect(store.baseReducerActions.length).to.equal(0);
      expect(newReducerActions.length).to.equal(2); // INIT, MY_AMAZING_ACTION
      expect(module.reducerActions.length).to.equal(2); // INIT, MY_AMAZING_ACTION
      expect(module.middlewareActions.length).to.equal(1); // MY_AMAZING_ACTION (Middleware doesn't get @@redux/INIT as store uses it's internal dispatch not the enhanced one.)
    });
  });
});
