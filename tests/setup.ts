// web/utils.ts calls acquireVsCodeApi() at module load time — stub it out
Object.assign(globalThis, {
  acquireVsCodeApi: () => ({
    postMessage: () => {},
    setState: () => {},
    getState: () => null
  })
});
