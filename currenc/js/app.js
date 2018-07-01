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

    const list = document.querySelector('#currencies-list ul');

    let convertCurrencyFrom = document.getElementById('convertFrom');

    let convertCurrencyTo = document.getElementById('convertedTo');

    const idbName = "currenc";

    const idbPromise = idb.open(idbName, 1, function(upgradeDB) {
        console.log("Making a new object store to hold currencies list of all countries.");
        if (!upgradeDB.objectStoreNames.contains('currencyConverter')) {
            // const currencyConverterStore =
            upgradeDB.createObjectStore('currencyConverter');
        }
    });

    // Methods
    function init(){
        // Check if `currencies` object already exists in DB
        fetchValuefromIDB('currencies').then(currencies => {
            if (typeof currencies === 'undefined') {
                apiFetchCurrenciesList();
            }else{
                addCurrencyListtoDOM(currencies);
            }
        });

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
                const currencies = Object.values(data.results).sort();

                // Save currency list to IndexedDB for offline access
                saveCurrenciesListtoIDB('currencies', currencies);

                //console.log(currencies);

                addCurrencyListtoDOM(currencies);
            })
            .catch(error => {
                console.error(
                    `The following error occurred while fetching the list of currencies. ${error}`,
                );
                fetchValuefromIDB('currencies').then(currencies => {
                    if (typeof currencies === 'undefined') return;
                    //console.log(currencies);
                    addCurrencyListtoDOM(currencies);
                });
            });
    }

    function saveCurrenciesListtoIDB(key, value) {
        return idbPromise
            .then(db => {
                const transaction = db.transaction('currencyConverter', 'readwrite');
                const objectStore = transaction.objectStore('currencyConverter');

                objectStore.put(value, key);
            })
            .catch(error => {
                console.error('Error saving data to database', error);
            });
    }

    function fetchValuefromIDB(key) {
        return idbPromise
            .then(db => {
                if (!db) return;
                const transaction = db.transaction('currencyConverter');
                const objectStore = transaction.objectStore('currencyConverter');

                return objectStore.get(key);
            })
            .catch(error => {
                console.error('Error getting data from database', error);
            });
    }

    function saveCurrencyConversionRatetoIDB(key, value) {
        return idbPromise
            .then(db => {
                const transaction = db.transaction('currencyConverter', 'readwrite');
                const objectStore = transaction.objectStore('currencyConverter');

                // value.forEach(currency => store.put(currency, key));
                objectStore.put(value, key);
            })
            .catch(err => {
                console.error('error saving data to database', err);
            });
    }

    function addCurrencyListtoDOM(currencies) {
        for(let currency in currencies) {
            const currencyName = currencies[currency].currencyName;
            const currencySymbol = currencies[currency].currencySymbol;
            const currencyID = currencies[currency].id;
            const li = document.createElement("li");

            li.className = "currency__list";
            li.id = currencyID;

            const a = document.createElement("a");
            a.dataset.currencySymbol = currencySymbol;
            a.innerHTML = `${currencyName} <span>${currencyID}</span>`;

            li.appendChild(a);

            list.appendChild(li);
        }
    }

    // initialize app
    init();

})();