import { mount } from "svelte";
// Noto Sans JP（Google Fonts）を同梱して使う。必要な文字の分だけ読み込まれる
import "@fontsource-variable/noto-sans-jp";
import "./app.css";
import App from "./App.svelte";
import { pwa } from "./state/pwa.svelte";

const target = document.getElementById("app");
if (!target) throw new Error("#app がありません");

pwa.register();

export default mount(App, { target });
