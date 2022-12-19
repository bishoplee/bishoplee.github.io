import * as dom from "./dom.js";
import toast from "./toast.js";
import { config } from "./helper.js";

const updateNetworkStatus = () => {
  if (
    navigator.connection.type === "none" ||
    window.navigator.onLine === false
  ) {
    dom.header.classList.add("app__offline");
    dom.closeButton.classList.add("app__offline");
    toast(config.disconnected);

    /* if (typeof localStorage.first_run === "undefined") {
              toast("No internet connection. Check your mobile data or Wi-Fi");
          } */
  } else {
    dom.header.classList.remove("app__offline");
    dom.closeButton.classList.remove("app__offline");
  }
};

export default updateNetworkStatus;