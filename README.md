# lsw-dialogs

Dialogs manager tool for LSW.

Based on [vue@2](#).

## Installation

```sh
npm i -s @allnulled/lsw-dialogs
```

## Importation

```html
<script src="node_modules/@allnulled/lsw-dialogs/lsw-dialogs.compiled.js"></script>
<link rel="stylesheet" type="text/css" href="node_modules/@allnulled/lsw-dialogs/lsw-dialogs.css" />
```

The *compiled version* is because the template is injected to the JavaScript via a simple replace (but it is still needed).

Then you have to include it on you `vue@2` markup, somewhere:

```html
<lsw-dialogs />
```

Then magic can work.

## Usage

This example only misses the `parentId`, which can be extracted from `LswDialogs.opened[$id]` and references to a parent process in the processes tree.

```js
const userData = await LswDialogs.open({
  // defaults to "default", used to identify the dialog on LswDialogs.opened[?]
  id: "collecting-user-data-dialog",
  // defaults to undefined, used to close children processes when a parent process is closed
  parentId: undefined,
  // defaults to 500, used to organize the z-index css property in live
  priority: 500,
  // defaults to "", used to identify the window by the header on the UI
  title: "Collecting user data",
  // template is not optional, used as template for the vue@2 component
  template: `
    <div>
      <input type="text" v-model="value.name" style="width:100%;" placeholder="Nombre" />
      <input type="number" v-model="value.age" style="width:100%;" placeholder="Edad" />
      <input type="text" v-model="value.city" style="width:100%;" placeholder="Ciudad" />
      <button v-on:click="accept">Aceptar</button>
    </div>
  `,
  // factory can be a function that returns an object too, used as definition of the vue@2 component
  factory: {
    // data can be a function that returns an object too, used as part of the vue@2 component definition
    data: {
      // data.value is what is returned by default on 'accept' injected method
      value: {
        name: "Guybrush Threwpood",
        age: 35,
        city: "Inda Siri"
      }
    }
  }
});
console.log(userData);
```

The parameters `factory` and `data` can be functions too. Like `vue@2`.

## API

The API is composed mainly by 2 kinds of artifacts: the manager, and the dialogs.

The manager corresponds directly to the vue@2 component that manages the dialogs stuff, `LswDialogs`.

The dialogs are abstractions that the manager knows how to render, and tracks their *opens*, *resolve/reject*, *closes* properly. Basically.

### 1. Dialogs manager

The dialogs are handled by `LswDialogs.opened` map. Its keys are the `id` of the dialog.

Using `await LswDialogs.open({ ... })` you can invoke a dialog and extract the form data.

Using `await LswDialogs.close(id)` you can close a dialog and its children.

Using `LswDialogs.opened` you can access the currently active dialogs.

Then, on `LswDialogs.open({...})`, you have to provide a dialog signature, as shown on the example. Below, it is further explained.

### 2. Dialogs signature

This is the signature that a dialog must provide:

```js
class Dialog {
    static fromIdToComponentName(id) {
      return "lsw-dialog-" + id;
    }
    constructor(info = {}) {
      Object.assign(this, info);
      Validations: {
        if (typeof this.id !== "string") {
          throw new Error(`Required parameter «dialog.id» to be a string on «Dialog.constructor»`);
        }
        if (typeof this.name !== "string") {
          throw new Error(`Required parameter «dialog.name» to be a string on «Dialog.constructor»`);
        }
        if (typeof this.priority !== "number") {
          throw new Error(`Required parameter «dialog.priority» to be a number on «Dialog.constructor»`);
        }
        if (typeof this.component !== "object") {
          throw new Error(`Required parameter «dialog.component» to be an object on «Dialog.constructor»`);
        }
        if (typeof this.promiser !== "object") {
          throw new Error(`Required parameter «dialog.promiser» to be an object on «Dialog.constructor»`);
        }
        if (!(this.promiser.promise instanceof Promise)) {
          throw new Error(`Required parameter «dialog.promiser.promise» to be an instance of Promise on «Dialog.constructor»`);
        }
        if (typeof this.promiser.resolve !== "function") {
          throw new Error(`Required parameter «dialog.promiser.resolve» to be an function on «Dialog.constructor»`);
        }
        if (typeof this.promiser.reject !== "function") {
          throw new Error(`Required parameter «dialog.promiser.reject» to be an function on «Dialog.constructor»`);
        }
      }
    }
  }
```

You do not have to provide all of these properties. From you, what is expected, is specified here:

```js
const {
  template,
  title = "",
  id = "default",
  priority = 0,
  factory = defaultDialogFactory,
  parentId = undefined,
} = parametricObject;
```

So, as you can see, only `template` is required.

Further from this, is all about how the API works, and it only takes around 300 lines to understand deeper what it does.

So, if you want to use it, I think this is enough to start. And if you want to fork/customize/intensively explote, you can explore the sources.

## Extras de LSW

Para ponerle los botones de aceptar o cancelar, puedes usar los parámetros:

```js
await Vue.prototype.$dialogs.open({
  title: "Example of bottom buttons customization",
  template: `
    <div>
      <p>OK, there we go!</p>
    </div>
  `,
  factory: {
    data: {
      acceptButton: {
        text: "OK",
        callback: function() {}
      },
      cancelButton: {
        text: "Nope, no way!",
        callback: function() {}
      }
    }
  }
});
```