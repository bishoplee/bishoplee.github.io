## bishoplee.github.io/currenc
#### Hosted PWA Currency Converter - ALC Google Challenge2.0

This is the currency converter progressive web app that accompanies the 7Days of Challenge. 

#### Installation

1. Clone this repository: `git clone https://github.com/bishoplee/bishoplee.github.io.git`
2. `cd` into the `bishoplee.github.io/currenc` folder.
3. Run a local server like `http-server` and see the application served on `localhost:8080`



#### Features

-  App Shell Architecture

-  Service Worker

-  Add to home screen

-  Fallback when offline

-  Online/Offline events

-  Fetch API

-  Cache API



#### License
PWA Currency Converter is open-sourced software licensed under the [MIT license](https://github.com/bishoplee/bishoplee.github.io/blob/master/LICENSE)



##### resources
- https://developers.google.com/web/ilt/pwa/working-with-indexeddb
- https://developers.google.com/web/updates/2016/06/persistent-storage
- https://developers.google.com/web/updates/2018/06/a2hs-updates
- https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle
- https://jakearchibald.com/2016/caching-best-practices/
- https://developers.google.com/web/fundamentals/codelabs/your-first-multi-screen-site/
- https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/



### TODO Updates
- ... done [1] add spinner/loader to `convertCurrencyToField` to show waiting time
- ... done [2] add number pad to override native keypad
- ... done [3] display notification message to let user know the app is offline when fetching from API
- ... done [4] refetch currencies stored in IDB every 86400000ms
- // [5] refetch exchange rates stored in IDB every 3600000ms
- // [6] log the most frequently converted currencies to history
- // [7] add refresh button to override [4] and [5]
- ... done [8] catch field value to remove decimal points not to exceed one
- // [9] add delete button functionality
- ... done [10] add vibration plugin on key press/tap
- ... done [11] catch key press to exempt non-numeric values
- ... done [12] disable double trigger on convert button
- // [13] add search to currency list to filter list by value entered
- ... done [14] load default conversion rate for preselected currencies
- ... done [15] add switch for currency name and rate
- // [16] keep track of conversion history
- // [17] add app credit to icon on-click event



##### Credits
- https://www.uplabs.com/posts/currency-converter-3a92be3e-0024-46c3-88ea-21f9efab0ab4
- https://free.currencyconverterapi.com