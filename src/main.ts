import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import { pwa } from "./state/pwa.svelte";

const target = document.getElementById("app");
if (!target) throw new Error("#app がありません");

pwa.register();

export default mount(App, { target });
