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
        if(typeof this.id !== "string") {
          throw new Error(`Required parameter «dialog.id» to be a string on «Dialog.constructor»`);
        }
        if(typeof this.name !== "string") {
          throw new Error(`Required parameter «dialog.name» to be a string on «Dialog.constructor»`);
        }
        if(typeof this.priority !== "number") {
          throw new Error(`Required parameter «dialog.priority» to be a number on «Dialog.constructor»`);
        }
        if(typeof this.component !== "object") {
          throw new Error(`Required parameter «dialog.component» to be an object on «Dialog.constructor»`);
        }
        if(typeof this.promiser !== "object") {
          throw new Error(`Required parameter «dialog.promiser» to be an object on «Dialog.constructor»`);
        }
        if(!(this.promiser.promise instanceof Promise)) {
          throw new Error(`Required parameter «dialog.promiser.promise» to be an instance of Promise on «Dialog.constructor»`);
        }
        if(typeof this.promiser.resolve !== "function") {
          throw new Error(`Required parameter «dialog.promiser.resolve» to be an function on «Dialog.constructor»`);
        }
        if(typeof this.promiser.reject !== "function") {
          throw new Error(`Required parameter «dialog.promiser.reject» to be an function on «Dialog.constructor»`);
        }
      }
    }
  }

  Vue.component("LswDialogs", {
    name: "LswDialogs",
    template: <div class="lsw_dialogs" v-if="openedLength">
    <template v-for="dialog, dialog_index in opened">
        <div class="dialog_window" v-bind:key="'dialog_' + dialog_index">
            <div class="dialog_topbar">
                <div class="dialog_title">
                    
                </div>
                <div class="dialog_topbar_buttons">
                    <button v-on:click="close(dialog.id)">Cancel</button>
                </div>
            </div>
            <div class="dialog_body">
                <component :is="dialog.name" />
            </div>
            <div class="dialog_footer">
                <button v-on:click="close(dialog.id)">Cancel</button>
            </div>
        </div>
    </template>
</div>,
    props: {},
    data() {
      return {
        opened: {},
        openedLength: 0,
      };
    },
    watch: {
      opened(newValue) {
        this.openedLength = typeof newValue !== "object" ? 0 : Object.keys(newValue).length;
      }
    },
    methods: {
      open(template, id = "default", priority = 0, factory = defaultDialogFactory) {
        const componentInfo = {};
        if(typeof id !== "string") {
          throw new Error(`Required parameter «id» (argument:1) to be a string on «LswDialogs.methods.open»`);
        }
        if(id in this.opened) {
          throw new Error(`Cannot open dialog «${id}» (argument:1) because it is already opened on «LswDialogs.methods.open»`);
        }
        if(typeof template !== "string") {
          throw new Error(`Required parameter «template» (argument:2) to be a string on «LswDialogs.methods.open»`);
        }
        if(typeof factory === "object") {
          // @OK
        } else if(typeof factory !== "function") {
          throw new Error(`Required parameter «factory» (argument:3) to be a function on «LswDialogs.methods.open»`);
        }
        if(typeof priority !== "number") {
          throw new Error(`Required parameter «priority» (argument:4) to be a number on «LswDialogs.methods.open»`);
        }
        const dialogComponentInput = typeof factory === "function" ? factory() : factory;
        const dialogComponentData = (() => {
          if(typeof dialogComponentInput.data === "undefined") {
            return () => ({});
          } else if(typeof dialogComponentInput.data === "object") {
            return () => dialogComponentInput.data;
          } else if(dialogComponentInput.data === "function") {
            return dialogComponentInput;
          } else {
            return () => ({});
          }
        })();
        // 1) Este es para el Vue.component:
        const dialogComponent = Object.assign({}, dialogComponentInput, {
          name: Dialog.fromIdToComponentName(id),
          template,
          data() {
            return {
              value: undefined,
              ...dialogComponentData()
            };
          },
          watch: {
            ...(dialogComponentInput.watch || {})
          },
          computed: {
            ...(dialogComponentInput.computed || {})
          },
          methods: {
            accept: (solution = undefined) => {
              this.$dialogs.resolve(id, typeof solution !== "undefined" ? solution : this.value).close(id);
            },
            cancel: () => {
              this.$dialogs.resolve(id, -1).close(id);
            },
            abort: (error = undefined) => {
              this.$dialogs.reject(id, error).close(id);
            },
            close: () => {
              this.$dialogs.resolve(id, -2).close(id);
            },
            ...(dialogComponentInput.methods || {})
          }
        });
        Define_component: {
          Vue.component(dialogComponent.name, dialogComponent);
        }
        // 1) Este es para el this.$dialogs:
        const dialogDefinition = Object.assign({}, {
          id,
          name: dialogComponent.name,
          component: dialogComponent,
          priority,
          promiser: Promise.withResolvers(),
        });
        Define_dialog: {
          this.opened = Object.assign({}, this.opened, { [id]: new Dialog(dialogDefinition) });
        }
        return this.opened[id].promiser.promise;
      },
      resolve(id, solution) {
        if(typeof id !== "string") {
          throw new Error("Required parameter «id» (argument:1) to be a string on «LswDialogs.resolve»");
        }
        if(!(id in this.opened)) {
          throw new Error(`Cannot resolve dialog «${id}» because it is not opened on «LswDialogs.resolve»`);
        }
        this.opened[id].promiser.resolve(solution);
        return {
          close: () => this.close(id)
        };
      },
      reject(id, error) {
        if(typeof id !== "string") {
          throw new Error("Required parameter «id» (argument:1) to be a string on «LswDialogs.reject»");
        }
        if(!(id in this.opened)) {
          throw new Error(`Cannot reject dialog «${id}» because it is not opened on «LswDialogs.reject»`);
        }
        this.opened[id].promiser.reject(error);
        return {
          close: () => this.close(id)
        };
      },
      close(id) {
        if(typeof id !== "string") {
          throw new Error("Required parameter «id» (argument:1) to be a string on «LswDialogs.close»");
        }
        if(!(id in this.opened)) {
          throw new Error(`Cannot close dialog «${id}» because it is not opened on «LswDialogs.close»`);
        }
        Undefine_component: {
          const dialogName = Dialog.fromIdToComponentName(id);
          delete Vue.options.components[dialogName];
        }
        Undefine_dialog: {
          Solve_promise_if_not_already: {
            if(this.opened[id].promiser.promise.state === "pending") {
              this.opened[id].promiser.resolve(-3);
            }
          }
          delete this.opened[id];
          this.opened = Object.assign({}, this.opened);
        }
        // this.$forceUpdate(true);
      }
    },
    mounted() {
      Vue.prototype.$dialogs = this;
      console.log("[*] LswDialogs mounted.");
    }
  });

})();