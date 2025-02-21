(function () {

  const defaultDialogFactory = () => {
    return {
      props: {},
      data() {
        return {};
      },
      methods: {},
      mounted() { },
    };
  };

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
        if (typeof this.acceptButton !== "object") {
          this.acceptButton = false;
        }
        if (typeof this.cancelButton !== "object") {
          this.cancelButton = false;
        }
      }
    }
  }

  const closeSubdialogsHook = function (id, lswDialogs) {
    const ids = Object.keys(lswDialogs.opened);
    for (let index_dialog = 0; index_dialog < ids.length; index_dialog++) {
      const idOpened = ids[index_dialog];
      const idParent = lswDialogs.opened[idOpened].parentId;
      if (idParent === id) {
        lswDialogs.close(idOpened);
      }
    }
  };

  Vue.component("LswDialogs", {
    name: "LswDialogs",
    template: $template,
    props: {
      asWindows: {
        type: Boolean,
        default: () => false
      }
    },
    data() {
      this.$trace("lsw-dialogs.data", arguments);
      return {
        enabledWindowsSystem: this.asWindows,
        opened: {},
        openedLength: 0,
        notMinimizedLength: 0,
        hookOnOpen: undefined,
        hookOnClose: closeSubdialogsHook,
      };
    },
    watch: {
      opened(newValue) {
        this.$trace("lsw-dialogs.watch.opened", ["too long object"]);
        this.openedLength = (typeof newValue !== "object") ? 0 : Object.keys(newValue).length;
        this._refreshMinimizedLength(newValue);
      }
    },
    methods: {
      open(parametricObject = {}) {
        this.$trace("lsw-dialogs.methods.open", arguments);
        if (typeof parametricObject !== "object") {
          throw new Error(`Required argument «parametricObject» to be an object on «LswDialogs.methods.open»`);
        }
        const {
          template,
          title = "",
          id = "default",
          priority = 500,
          factory = defaultDialogFactory,
          parentId = undefined,
          created_at = new Date()
        } = parametricObject;
        const componentInfo = {};
        if (typeof id !== "string") {
          throw new Error(`Required parameter «id» to be a string on «LswDialogs.methods.open»`);
        }
        if (id in this.opened) {
          throw new Error(`Cannot open dialog «${id}» because it is already opened on «LswDialogs.methods.open»`);
        }
        if (typeof template !== "string") {
          throw new Error(`Required parameter «template» to be a string on «LswDialogs.methods.open»`);
        }
        if (typeof factory === "object") {
          // @OK
        } else if (typeof factory !== "function") {
          throw new Error(`Required parameter «factory» to be an object or a function on «LswDialogs.methods.open»`);
        }
        if (typeof priority !== "number") {
          throw new Error(`Required parameter «priority» to be a number on «LswDialogs.methods.open»`);
        }
        const dialogComponentInput = typeof factory === "function" ? factory() : factory;
        const dialogComponentData = (() => {
          if (typeof dialogComponentInput.data === "undefined") {
            return function () { return {}; };
          } else if (typeof dialogComponentInput.data === "object") {
            return function () { return dialogComponentInput.data };
          } else if (typeof dialogComponentInput.data === "function") {
            return dialogComponentInput.data;
          } else {
            console.log(dialogComponentInput.data);
            throw new Error("Required parameter «data» returned by «factory» to be an object, a function or empty on «LswDialogs.methods.open»");
          }
        })();
        // 1) Este es para el Vue.component:
        const componentId = Dialog.fromIdToComponentName(id);
        const dialogComponent = Object.assign({}, dialogComponentInput, {
          name: componentId,
          template,
          data(...args) {
            this.$trace(`lsw-dialogs.[${componentId}].data`, ["too long object"]);
            const preData = dialogComponentData.call(this);
            if (typeof preData.value === "undefined") {
              preData.value = "";
            };
            console.log("El data del nuevo componente dialog:", preData);
            return preData;
          },
          watch: (dialogComponentInput.watch || {}),
          computed: (dialogComponentInput.computed || {}),
          methods: {
            getValue() {
              this.$trace(`lsw-dialogs.[${componentId}].methods.getValue`, []);
              return JSON.parse(JSON.stringify(this.value));
            },
            accept(solution = undefined, ...args) {
              this.$trace(`lsw-dialogs.[${componentId}].methods.accept`, [solution, ...args]);
              if (solution instanceof Event) {
                return this.$dialogs.resolve(id, this.getValue()).close(id);
              }
              return this.$dialogs.resolve(id, typeof solution !== "undefined" ? solution : this.getValue()).close(id);
            },
            cancel(...args) {
              this.$trace("lsw-dialogs.[${componentId}].methods.cancel", args);
              return this.$dialogs.resolve(id, -1).close(id);
            },
            abort(error = undefined, ...args) {
              this.$trace(`lsw-dialogs.[${componentId}].methods.abort`, [error, ...args]);
              if (solution instanceof Event) {
                return this.$dialogs.reject(id, new Error("Aborted dialog error")).close(id);
              }
              return this.$dialogs.reject(id, error).close(id);
            },
            close(...args) {
              this.$trace(`lsw-dialogs.[${componentId}].methods.close`, args);
              return this.$dialogs.resolve(id, -2).close(id);
            },
            ...(dialogComponentInput.methods || {})
          }
        });
        Define_component: {
          Vue.component(dialogComponent.name, dialogComponent);
        }
        // 1) Este es para el this.$dialogs:
        const dialogDefinition = Object.assign({}, {
          ...parametricObject,
          id,
          title,
          name: dialogComponent.name,
          component: dialogComponent,
          priority,
          minimized: false,
          parentId,
          created_at,
          promiser: Promise.withResolvers(),
        });
        const dialogInstance = new Dialog(dialogDefinition);
        console.log("Definición final del dialogo", dialogInstance);
        Define_dialog: {
          this.opened = Object.assign({}, this.opened, {
            [id]: dialogInstance
          });
        }
        if (typeof this.hookOnOpen === "function") {
          this.hookOnOpen(this.opened[id], id, this);
        }
        return this.opened[id].promiser.promise;
      },
      resolve(id, solution, ...args) {
        this.$trace("lsw-dialogs.methods.resolve", [id, solution, ...args]);
        if (typeof id !== "string") {
          throw new Error("Required parameter «id» (argument:1) to be a string on «LswDialogs.resolve»");
        }
        if (!(id in this.opened)) {
          throw new Error(`Cannot resolve dialog «${id}» because it is not opened on «LswDialogs.resolve»`);
        }
        this.opened[id].promiser.resolve(solution);
        return {
          close: () => this.close(id)
        };
      },
      reject(id, error, ...args) {
        this.$trace("lsw-dialogs.methods.reject", [id, error, ...args]);
        if (typeof id !== "string") {
          throw new Error("Required parameter «id» (argument:1) to be a string on «LswDialogs.reject»");
        }
        if (!(id in this.opened)) {
          throw new Error(`Cannot reject dialog «${id}» because it is not opened on «LswDialogs.reject»`);
        }
        this.opened[id].promiser.reject(error);
        return {
          close: () => this.close(id)
        };
      },
      close(id, ...args) {
        this.$trace("lsw-dialogs.methods.close", [id, ...args]);
        if (typeof id !== "string") {
          throw new Error("Required parameter «id» (argument:1) to be a string on «LswDialogs.close»");
        }
        if (!(id in this.opened)) {
          throw new Error(`Cannot close dialog «${id}» because it is not opened on «LswDialogs.close»`);
        }
        let promiseOfDialog = undefined;
        Undefine_component: {
          const dialogName = Dialog.fromIdToComponentName(id);
          delete Vue.options.components[dialogName];
        }
        Undefine_dialog: {
          Solve_promise_if_not_already: {
            if (this.opened[id].promiser.promise.state === "pending") {
              this.opened[id].promiser.resolve(-3);
            }
          }
          promiseOfDialog = this.opened[id].promiser.promise;
          delete this.opened[id];
          this.opened = Object.assign({}, this.opened);
        }
        if (typeof this.hookOnClose === "function") {
          this.hookOnClose(id, this);
        }
        return promiseOfDialog;
        // this.$forceUpdate(true);
      },
      minimize(id, ...args) {
        this.$trace("lsw-dialogs.methods.minimize", [id, ...args]);
        if (typeof id !== "string") {
          throw new Error("Required parameter «id» (argument:1) to be a string on «LswDialogs.minimize»");
        }
        if (!(id in this.opened)) {
          throw new Error(`Cannot minimize dialog «${id}» because it is not opened on «LswDialogs.minimize»`);
        }
        this.opened[id].minimized = true;
        this._refreshMinimizedLength(this.opened);
      },
      maximize(id, ...args) {
        this.$trace("lsw-dialogs.methods.maximize", [id, ...args]);
        if (typeof id !== "string") {
          throw new Error("Required parameter «id» (argument:1) to be a string on «LswDialogs.maximize»");
        }
        if (!(id in this.opened)) {
          throw new Error(`Cannot minimize dialog «${id}» because it is not opened on «LswDialogs.maximize»`);
        }
        Iterating_dialogs:
        for (let dialogId in this.opened) {
          if (id === dialogId) {
            continue Iterating_dialogs;
          }
          const dialogData = this.opened[dialogId];
          const currentPriority = parseInt(dialogData.priority);
          this.opened[dialogId].priority = currentPriority - 1;

        }
        this.opened[id].priority = 500;
        this.opened[id].minimized = false;
        this._refreshMinimizedLength();
      },
      _refreshMinimizedLength(newValue = this.opened, ...args) {
        this.$trace("lsw-dialogs.methods._refreshMinimizedLength", ["too long object", ...args]);
        this.notMinimizedLength = Object.keys(newValue).reduce((out, k) => {
          const v = newValue[k];
          if (v.minimized === false) {
            out++;
          }
          return out;
        }, 0);
        this.$forceUpdate(true);
      },
      goHome(...args) {
        this.$trace("lsw-dialogs.methods.goHome", [...args]);
        this.$window.LswWindows.show();
      },
      onOpen(callback, ...args) {
        this.$trace("lsw-dialogs.methods.onOpen", [callback, ...args]);
        this.hookOnOpen = callback;
      },
      onClose(callback, ...args) {
        this.$trace("lsw-dialogs.methods.onClose", [callback, ...args]);
        this.hookOnClose = callback;
      }
    },
    mounted(...args) {
      this.$trace("lsw-dialogs.mounted", [...args]);
      Vue.prototype.$dialogs = this;
      if (Vue.prototype.$lsw) {
        Vue.prototype.$lsw.dialogs = this;
      }
      window.LswDialogs = this;
      console.log("[*] LswDialogs mounted.");
    }
  });

})();