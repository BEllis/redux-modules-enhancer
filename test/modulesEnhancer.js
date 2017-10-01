import { expect } from "chai";
import * as Redux from "redux";
import modulesEnhancer from "../dist/redux-modules-enhancer.js";
import createTemplateModule from "./ModuleTemplate.js"
import { MIDDLEWARE_ACTION } from "./UnitTestModule.js";
import { List } from "immutable";

const MY_AMAZING_ACTION = "MY_AMAZING_ACTION";
const createSampleModule = moduleId => {
  return createTemplateModule(moduleId || "my-module-id");
}

const createStoreWithEnhancer = () => {
  const baseReducerActions = [];
  const reducer = (state = {}, action) => { if (action.type !== MIDDLEWARE_ACTION) { baseReducerActions.push(action); } return state };
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
      expect(store.getState()[module.moduleId].reducerActions.size).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].middlewareActions.size).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
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
      expect(store.getState()[module.moduleId].reducerActions.size).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].middlewareActions.size).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
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
      expect(store.getState()[module.moduleId].reducerActions.size).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].middlewareActions.size).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
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
      expect(store.getState()[module.moduleId].reducerActions.size).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].middlewareActions.size).to.equal(0); // MODULE_ADDED, MY_AMAZING_ACTION
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
      expect(store.getState()[module.moduleId].reducerActions.size).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].middlewareActions.size).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
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
      expect(store.getState()[module.moduleId].reducerActions.size).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].middlewareActions.size).to.equal(0); // MODULE_ADDED, MY_AMAZING_ACTION
    });

    it("sets initial state when adding a module", function() {
      // Arrange
      const store = createStoreWithEnhancer();
      const module = createSampleModule();

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module.moduleId, module.reducer, module.initialState, module.middleware);

      // Assert
      const state = store.getState()[module.moduleId];
      delete state.middlewareActions;
      delete state.reducerActions;
      expect(state).to.deep.equal({ stuffToDo: List([]) });
    });

    it("calls module.onLoad when the module is loaded.", function() {
      // Arrange
      const store = createStoreWithEnhancer()
      const module = createSampleModule();
      module.onLoad = (dispatch) => { return dispatch({ type: MY_AMAZING_ACTION }); };

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });

      // Assert
      expect(store.baseReducerActions.length).to.equal(5); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].reducerActions.size).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].middlewareActions.size).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MY_AMAZING_ACTION
    });

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
      expect(store.getState()[module.moduleId].reducerActions.size).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED
      expect(store.getState()[module.moduleId].middlewareActions.size).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED
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
      expect(store.getState()[module.moduleId].reducerActions.size).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED
      expect(store.getState()[module.moduleId].middlewareActions.size).to.equal(3); // MODULE_ADDED, MY_AMAZING_ACTION, MODULE_REMOVED
      expect(store.getState()["my-module"]).to.equal(undefined);
    });

    it("calls module.onUnload when a module is removed", function() {
      // Arrange
      const store = createStoreWithEnhancer();
      const module = createSampleModule();
      module.onUnload = (dispatch) => { return dispatch({ type: MY_AMAZING_ACTION }); };

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.removeModule(module.moduleId);
      store.dispatch({ type: MY_AMAZING_ACTION });

      // Assert
      expect(store.baseReducerActions.length).to.equal(7); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION, MY_AMAZING_ACTION, MODULE_REMOVED, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].reducerActions.size).to.equal(4); // MODULE_ADDED, MY_AMAZING_ACTION, MY_AMAZING_ACTION, MODULE_REMOVED
      expect(store.getState()[module.moduleId].middlewareActions.size).to.equal(4); // MODULE_ADDED, MY_AMAZING_ACTION, MY_AMAZING_ACTION, MODULE_REMOVED
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
      let newReducerActions = List([]);
      const store = createStoreWithEnhancer();
      const module = createSampleModule();
      const newReducer = (state, action) => {
        if (action.type !== MIDDLEWARE_ACTION) {
          newReducerActions = newReducerActions.push(action);
        }

        return state;
      }

      store.addModule(module);
      store.baseReducerActions.length = 0;
      store.getState()[module.moduleId].reducerActions = List([]);
      store.getState()[module.moduleId].middlewareActions = List([]);

      // Action
      store.replaceReducer(newReducer);
      store.dispatch({ type: MY_AMAZING_ACTION })

      // Assert
      expect(store.baseReducerActions.length).to.equal(0);
      expect(newReducerActions.size).to.equal(2); // INIT, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].reducerActions.size).to.equal(2); // INIT, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].middlewareActions.size).to.equal(1); // MY_AMAZING_ACTION (Middleware doesn't get @@redux/INIT as store uses it's internal dispatch not the enhanced one.)
    });
  });

  describe("Middleware support", function() {
    it("Only calls middleware once", function() {
      // Arrange
      const store = createStoreWithEnhancer();
      const module = createSampleModule();
      const module2 = createSampleModule("test-module-2");

      // Action
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module);
      store.dispatch({ type: MY_AMAZING_ACTION });
      store.addModule(module2);
      store.dispatch({ type: MY_AMAZING_ACTION });

      // Assert
      expect(store.baseReducerActions.length).to.equal(6); // INIT, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION, MODULE_ADDED, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].reducerActions.size).to.equal(4); // MODULE_ADDED, MY_AMAZING_ACTION  MODULE_ADDED, MY_AMAZING_ACTION
      expect(store.getState()[module.moduleId].middlewareActions.size).to.equal(4); // MODULE_ADDED, MY_AMAZING_ACTION MODULE_ADDED, MY_AMAZING_ACTION
      expect(store.getState()[module2.moduleId].reducerActions.size).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
      expect(store.getState()[module2.moduleId].middlewareActions.size).to.equal(2); // MODULE_ADDED, MY_AMAZING_ACTION
    });
  })

  describe("Recommended module template", function() {
    it("supports thunks middleware", function() {
      // Arrange
      let store = createStoreWithEnhancer();
      let module = createTemplateModule("my-module-id-2", {});
      store.addModule(module);

      // Action
      store.dispatch(module.actions.getStuff());

      // Assert
      expect(store.getState()["my-module-id-2"].stuffToDo.size).to.equal(1);
    })
  })
});
