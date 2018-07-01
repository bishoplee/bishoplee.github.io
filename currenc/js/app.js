(() => {

    // Check if indexedDB is supported
    if (!('indexedDB' in window)) {
        console.log("This browser doesn't support IndexedDB");
        return;
    }

    // Register Service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./sw.js')
            .then(() => {
                console.log("Service Worker Registered...");
            }).catch(error => console.error(`Unable to register Service Worker. Error is ${error}`));
    }

    //let convertCurrencyFrom = document.getElementById('base-currency').value;
    //let convertCurrencyTo = document.getElementById('converted-currency');

    const idbPromise = idb.open('currenc', 1, function(upgradeDb) {
        console.log("Making a new object store to hold currencies list of all countries.");
        if (!upgradeDb.objectStoreNames.contains('currencyConverter')) {
            // const currencyConverterStore =
            upgradeDb.createObjectStore('currencyConverter');
        }
    });

    // Methods
    function init(){
        apiFetchCurrenciesList();
        customEventListeners();

    }

    function customEventListeners() {

    }

    function apiFetchCurrenciesList() {
        const apiURL = 'https://free.currencyconverterapi.com/api/v5/currencies';

        fetch(apiURL, {
            cache: 'default',
        })
            .then(response => response.json())
            .then(data => {
                const currencies = Object.keys(data.results).sort();

                // Save currency list to IndexedDB for offline access
                saveCurrenciesListtoIDB('currencies', currencies);
                })
            .catch(error => {
                console.error(
                    `The following error occurred while fetching the list of currencies. ${error}`,
                );
                getValuefromIDB('currencies').then(currencies => {
                    if (typeof currencies === 'undefined') return;
                    console.log(currencies);
                });
            });
    }

    function saveCurrenciesListtoIDB(key, value) {
        return idbPromise
            .then(db => {
                const transaction = db.transaction('currencyConverter', 'readwrite');
                const store = transaction.objectStore('currencyConverter');

                store.put(value, key);
            })
            .catch(error => {
                console.error('Error saving data to database', error);
            });
    }

    function getValuefromIDB(key) {
        return idbPromise
            .then(db => {
                if (!db) return;
                const transaction = db.transaction('currencyConverter');
                const store = transaction.objectStore('currencyConverter');

                return store.get(key);
            })
            .catch(error => {
                console.error('Error getting data from database', error);
            });
    }

    function saveCurrencyConversionRatetoIDB(key, value) {
        return idbPromise
            .then(db => {
                const transaction = db.transaction('currencyConverter', 'readwrite');
                const store = transaction.objectStore('currencyConverter');

                store.put(value, key);
            })
            .catch(err => {
                console.error('error saving data to database', err);
            });
    }

    // initialize app
    init();

})();