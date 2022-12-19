import updateNetworkStatus from "./network_status.js";

//TODO: create anonymous API;
//const apiKey = "RiHI2Ov5V5apI7mYcsKutcMB3P0Ad3Im";
//const currenciesAPI_URL = `https://free.currconv.com/api/v7/currencies?apiKey=${apiKey}`;

// Declare constant configs
const config = {
	connected: "",
	disconnected: "No internet connection. Check your mobile data or Wi-Fi",
	noIndexDB: "This device's app window doesn't support IndexedDB",
};

// Monitor network connection status
const monitorNetworkStatus = () => {
	window.addEventListener("online", updateNetworkStatus, false);
	window.addEventListener("offline", updateNetworkStatus, false);
};

// Check current network status
const networkStatus = () => navigator.onLine;

// Declare window variables
window.MyLib = {};
const setWindowVariables = () => {
  MyLib._currenciesAPI_URL = `https://api.apilayer.com/fixer/symbols`;
  MyLib._exchangeRateAPI_URL = `https://api.apilayer.com/fixer/convert`;
  MyLib._now = String(moment().format("MMMM D, YYYY"));
  MyLib._idbName = "currenc";
	MyLib.__this = "";
	MyLib._decimalTrigger = "";
	MyLib._initialValue = "";
	MyLib._currency_list_title_visible = true;
	MyLib._retrialTimeOut = 3000;
	MyLib._newValue = "";
	MyLib._realNumber = "";
	MyLib._answer = 0;
	MyLib._activated = false;
	MyLib._memory = false;
	//MyLib._connected = false;
};

export { config, monitorNetworkStatus, networkStatus };

export default setWindowVariables;