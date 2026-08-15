import "./styles.css";

import { render } from "preact";

import { App } from "./App";
import { initWebview } from "./lib/bootstrap";

initWebview();

render(<App />, document.getElementById("app")!);
