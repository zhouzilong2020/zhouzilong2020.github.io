import Template from "./template.js";
import View from "./view.js";
import Controller from "./controller.js";
import Store from "./store.js";
import "./dateUtils.js";

const template = new Template();
const store = new Store("TODO-MVC");
// TODO view和model解耦
const view = new View(template);

// controller
const controller = new Controller(store, view);
controller.init();
