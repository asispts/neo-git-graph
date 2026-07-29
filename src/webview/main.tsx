import { render } from "preact";

import "./styles.css";
import { App } from "./app";
import { restoreRepoState, startRepoPersistence } from "./store/repo/persistence";
import { startRepoSync } from "./store/repo/sync";

restoreRepoState();
startRepoPersistence();
startRepoSync();

render(<App />, document.getElementById("app")!);
