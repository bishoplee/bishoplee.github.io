import defaultCountries from "./countries.js";
import requestOptions from "./api_request.js";
import toast from "./toast.js";
import updateNetworkStatus from "./network_status.js";
import * as dom from "./dom.js";
import setWindowVariables, * as Helper from "./helper.js";

const init = async () => {
	//navigator.splashscreen.show();
	//const platform = window.cordova; //.platformId; //(device === undefined) ? "android" : device.platform.toUpperCase();
	//console.log(platform);

	// Add device platform as css rule to document body
	//document.body.classList.add('is_' + platform.toLowerCase());

	// Check if indexedDB is supported
	if (!("indexedDB" in window)) {
		toast(Helper.config.noIndexDB);
		console.log("This browser doesn't support IndexedDB");
		return;
	}

	// add loader animation
	dom.loader.classList.add("show");

	dom.search__hide.style.left = "24px";

	// define window variables
	await setWindowVariables();

	// add todays date at the app bar
	document.querySelector(".date data").innerHTML = window.MyLib._now;

	// Monitor network status
	Helper.monitorNetworkStatus();

	// Check if network is active
	console.log(Helper.networkStatus());
	if (Helper.networkStatus()) {
		// fetch details from IDB
		/* fetchDatafromIDB("currencies").then((data) => {
			if (data === undefined) {
				apiFetchCurrenciesList();
			} else {
				addCurrencyListtoDOM(data.symbols);
	
				const yesterday = data.date_log;
	
				if (yesterday !== _now) {
					apiFetchCurrenciesList();
				}
			}
		}); */
	} else {
		toast(Helper.config.disconnected);
		updateNetworkStatus();
	}


	// Initialize event listeners
	//Helper.customEventListeners();

	/* updateNetworkStatus() && initializeExchangeRates();

	calculateExchangeRate(); */
};

// initialize app
document.addEventListener("deviceready", init(), false);

//TODO: keep history of exchange rates