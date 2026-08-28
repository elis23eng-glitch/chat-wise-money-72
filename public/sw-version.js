const WISE_MONEY_VERSION = "v4";

self.addEventListener("message", (event) => {
  if (event.data?.type === "GET_VERSION") {
    event.ports[0]?.postMessage({ version: WISE_MONEY_VERSION });
  }
});