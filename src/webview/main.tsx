import { render } from "preact";

import "./styles.css";
import { App } from "./app";
import { bootstrap } from "./store/repo";

bootstrap();
render(<App />, document.getElementById("app")!);
