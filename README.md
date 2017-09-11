# Redux Modules Enhancer

## IMPORTANT NOTICE

*Experimental* I didn't realise publishing this package to NPM would cause so many downloads. This package is still experimental so I would not currently recommend it for production use yet though I intend for it to production ready in the coming days.

Some middleware may not work with this library as all actions are pushed through each middleware in each module, so some middleware may not handle this scenario gracefully, though thunks and redux-observable have been tested.

## Motivation

Having to compile a list of possible reducers, state and/or middleware ahead-of-time is
error prone (you forget to add a reducer/middleware) and time consuming (hunting
down which reducers and middleware you need).

This was partially alleviated by grouping items together using Redux Modules (aka ducks) but
they would still need to be known ahead-of-time.

## Why not use another module injection module?

This module is less invasive and requires less code changes (none?) compared to
other module injection solutions.

## How to add it to my store?

Easy, just like any other enhancer,

```javascript
  var Redux = require("redux");
  var modulesEnhancer = require("redux-modules-enhancer");
  var store = Redux.createStore(myreducer, myinitialState, modulesEnhancer());
```

or, if you want to use other enhancers as well,

```javascript
  var store = Redux.createStore(myreducer, myinitialState, combine(modulesEnhancer(), Redux.applyMiddleware(...)));
```

## What does the enhancer do?

The enhancer adds three methods to the store returned when calling createStore,

```javascript
store.addModule(moduleId, reducer, initialState, ...middleware);
```

or

```javascript
var module = { moduleId, reducer, initialState, middleware }
store.addModule(module);
```

Adds a module using
the given reducer, initialState and middleware.

-   *moduleId* - (*Required*) this is equivalent to the name of the state object for a reducer when using combineReducers.
-   *reducer* - (*Required*) - this is the reducer that will run on the state for this module.
-   *initialState* - (*Default: {}*) this is the initialState that will be set for the module .
-   *middleware* - (*Default: None*) An array of middleware objects (store.getState() will return the root state, not the module's state, to get the module's state use store.getState()\[moduleId\])

```javascript
store.removeModule(moduleId)
```
or
```javascript
var module = { moduleId, ... };
store.removeModule(module);
```
Removes a module that has already been added.

-   *moduleId* - (*Required*) this is equivalent to the name of the state object for a reducer when using combineReducers.

```javascript
var moduleAlreadyAdded = store.hasModule(moduleId)
```
or

```javascript
var module = { moduleId, ... };
var moduleAlreadyAdded = store.hasModule(module);
```

Returns true if a module with the given moduleId already exists OR if a base reducer or
the initial state added a key to the root state with the same name, otherwise false.

-   *moduleId* - (*Required*) this is equivilent to the name of the state object for a reducer when using combineReducers.

### Examples

```javascript
var store = Redux.createStore(myInitialReducer, myInitialState, modulesEnhancer());
store.dispatch({ type: MY_EVENT });

var myModule = {
  moduleId: "my-module",
  reducer: myModuleReducer,
  initialState: myModuleInitialState,
  middleware: [ myModuleMiddleware1, myModuleMiddleware2]
};

store.addModule(myModule);
store.dispatch({ type: MY_EVENT }); // Received by myInitialReducer (and any other enhancers), as well as the module's myModuleReducer.
store.removeModule(myModule);
store.dispatch({ type: MY_EVENT }); // Only received by myInitialReducer (and any other enhancers), actions are no longer dispatched to your module reducer or middleware, and the state will have been removed.
```

## Using React.js?

Why not check out my other project, react-redux-module that allows you to add,

```html
<ReduxModule moduleId="my-module" reducer={ myModuleReducer } initialState={ myModuleInitialState } middleware={ [ myModuleMiddlware1, myModuleMiddlware2 ] } />
```
or
```javascript
var myModule = {
  moduleId: "my-module",
  reducer: myModuleReducer,
  initialState: myModuleInitialState,
  middleware: [ myModuleMiddleware1, myModuleMiddleware2]
};

...

<ReduxModule module={myModule} />
```

anywhere that a component requires a module, so the module is added (if not already added).

## Recommended module structure

The following is a template to use when creating your own modules,

```javascript
import thunk from 'redux-thunk'
import { myLibraryNs } from "./redux-namespaces.json";
import { List } from "immutable";

// Action Types
const DO_MORE_STUFF = myLibraryNs + "DO_MORE_STUFF";
const DO_STUFF =  myLibraryNs + "DO_STUFF";

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
  switch (action.type) {
    case DO_STUFF:
      state = Object.assign(state, {});
      state.stuffToDo = state.stuffToDo.push(action.thingsToDo);
      return state;
    case DO_MORE_STUFF:
      state = Object.assign(state, {});
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
  const initialState = { stuffToDo: List([]) };
  const middleware = [
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
```

If you intend to use the same namespace in multiple files, keeps your namespaces in
a separate redux-namespaces.json file,

```javascript
{
  "myLibraryNs": "http://www.example.com/myLibrary/"
}
```
