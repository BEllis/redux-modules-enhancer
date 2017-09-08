# Redux Modules Enhancer

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

```
  var Redux = require("redux");
  var modulesEnhancer = require("redux-modules-enhancer");
  var store = Redux.createStore(myreducer, myinitialState, modulesEnhancer());
```

or, if you want to use other enhancers as well,

```
  var store = Redux.createStore(myreducer, myinitialState, combine(modulesEnhancer(), Redux.applyMiddleware(...)));
```

## What does the enhancer do?

The enhancer adds three methods to the store returned by createStore,

```
addModule(moduleId, reducer, initialState, ...middlewares)
```
Adds a module using
the given reducer, initialState and middlewares.

- *moduleId* - (*Required*) this is equivilent to the name of the state object for a reducer when using combineReducers.
- *reducer* - (*Required*) - this is the reducer that will run on the state for this module.
- *initialState* - (*Default: {}*) this is the initialState that will be set for the module .
- *middlewares* - (*Default: None*) An array of middleware objects (store.getState() will return the root state, not the module's state, to get the module's state use store.getState()[moduleId])

```
removeModule(moduleId)
```
Removes a module that has already been added.

- *moduleId* - (*Required*) this is equivilent to the name of the state object for a reducer when using combineReducers.

```
hasModule(moduleId)
```
Returns true if a module with the given moduleId already exists OR if a base reducer or
the initial state added a key to the root state with the same name, otherwise false.

- *moduleId* - (*Required*) this is equivilent to the name of the state object for a reducer when using combineReducers.

### Examples

```javascript
var store = Redux.createStore(myInitialReducer, myInitialState, modulesEnhancer());
store.dispatch({ type: MY_EVENT });
store.addModule("my-module", myModuleReducer, myModuleInitialState, myModuleMiddleware1, myModuleMiddleware2);
store.dispatch({ type: MY_EVENT }); // Received by myInitialReducer (and any other enhancers), as well as the module's myModuleReducer.
store.removeModule("my-module");
store.dispatch({ type: MY_EVENT }); // Only received by myInitialReducer (and any other enhancers), actions are no longer dispatched to your module reducer or middleware, and the state will have been removed.
```

## Using React.js?

Why not check out my other project, redux-react-module-loader that allows you to add,

```html
<ReduxModule moduleId="my-module" reducer={ myModuleReducer } initialState={ myModuleInitialState } middlewares={ [ myModuleMiddlware1, myModuleMiddlware2 ] } />
```

anywhere that a component requires a module, so the module is added (if not already added).

## Known issues

- Using store.replaceReducer will disable the enhancer (to confirm, but believed to be a bug in Redux)
