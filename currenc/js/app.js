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

    let currencyName, currencySymbol, currencyID;

    const list = document.querySelector('#currencies-list ul');

    const convertCurrencyToField = document.getElementById('converted-to');

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
        // add listener for the convert-button
        document.getElementById('convert-button').addEventListener('click', event => {
            event.preventDefault();
            calculateExchangeRate();
        });

        // detect if 'enter' key is pressed
        document.querySelector('body').addEventListener('keydown', event => {
            if (event.keyCode === 13) {
                calculateExchangeRate();
            }
        });

        // add listener for base currency selection
        document.querySelector('.base__currency__name').addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            document.getElementById('currencies-list').classList.add('open');

            Array.prototype.filter.call(document.querySelectorAll('.currency__list'), el => {
                /*const _listener = function() {
                    // do something
                    console.log("i got here.");

                    /!*currencyName = el.target.children["0"].childNodes["0"].textContent;
                    currencySymbol = el.target.childNodes["0"].dataset.currencySymbol;
                    currencyID = el.target.childNodes["0"].firstElementChild.innerHTML;
                    populate('.base__currency__name', currencyName, currencySymbol, currencyID);*!/
                };

                el.addEventListener("click", _listener, true);
                el.removeEventListener("click", _listener, true);*/
                el.addEventListener('click', event => {

                    currencyName = event.target.children["0"].childNodes["0"].textContent;
                    currencySymbol = event.target.childNodes["0"].dataset.currencySymbol;
                    currencyID = event.target.childNodes["0"].firstElementChild.innerHTML;

                    populate('.base__currency__name', currencyName, currencySymbol, currencyID);

                });
            });
        });

        // add listener for target currency selection
        document.querySelector('.converted__currency__name').addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            document.getElementById('currencies-list').classList.add('open');

            Array.prototype.filter.call(document.querySelectorAll('.currency__list'), el => {
                el.addEventListener('click', event => {

                    currencyName = event.target.children["0"].childNodes["0"].textContent;
                    currencySymbol = event.target.childNodes["0"].dataset.currencySymbol;
                    currencyID = event.target.childNodes["0"].firstElementChild.innerHTML;

                    populate('.converted__currency__name', currencyName, currencySymbol, currencyID);

                });
            });
        });

        // add listener for back__button on the currency list view
        document.querySelector('.back__button').addEventListener('click', event => {
            event.preventDefault();
            document.getElementById('currencies-list').classList.remove('open');
        });

        document.getElementById('convert-from').addEventListener('focus', event => {
            //alert('focused');
        })
    }

    function populate(target, currency, symbol, id){
        target = document.querySelector(target);

        target.innerText = currency;
        target.id = id;

        document.getElementById('currencies-list').classList.remove('open');

        return false;
    }

    // Fetch currencies from API url
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

                addCurrencyListtoDOM(currencies);
            })
            .catch(error => {
                console.error(
                    `The following error occurred while fetching the list of currencies. ${error}`,
                );
                fetchValuefromIDB('currencies').then(currencies => {
                    if (typeof currencies === 'undefined') return;

                    addCurrencyListtoDOM(currencies);
                });
            });
    }

    // Save currencies to IDB
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

    // Retrieve values from IDB by key
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

    // Save exchnage rates to IDB
    function saveCurrencyConversionRatetoIDB(key, value) {
        return idbPromise
            .then(db => {
                const transaction = db.transaction('currencyConverter', 'readwrite');
                const objectStore = transaction.objectStore('currencyConverter');

                objectStore.put(value, key);
            })
            .catch(error => {
                console.error('error saving data to database', error);
            });
    }

    // Add currencies to DOM as an unordered list
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

    // Get value in the input field to convert
    function getAmounttoCovert() {
        return document.querySelector('input#convert-from').value;
    }

    // Calculate the exchange rate for selected currencies
    function calculateExchangeRate() {
        const amounttoConvert = getAmounttoCovert();
        const baseCurrency = document.querySelector('.base__currency__name').id;
        const targetCurrency = document.querySelector('.converted__currency__name').id;
        const currencyExchange = `${baseCurrency}_${targetCurrency}`;
        const url = `https://free.currencyconverterapi.com/api/v5/convert?q=${currencyExchange}&compact=ultra`;

        fetch(url, {
            cache: 'default',
        })
            .then(response => response.json())
            .then(data => {
                const exchangeRates = Object.values(data);

                // Save currency exchange rate to IndexedDB for when user is offline
                saveCurrencyConversionRatetoIDB(currencyExchange, exchangeRates);

                const convertedCurrency = amounttoConvert * exchangeRate;
                convertCurrencyToField.innerText = convertedCurrency.toFixed(2);
            })
            .catch(error => {
                console.log(
                    `The following error occurred while getting the conversion rate. ${error}`,
                );
                // Get currency exchange rate when the user is offline
                fetchValuefromIDB(currencyExchange).then(data => {
                    if (typeof data === 'undefined') return;
                    const convertedCurrency = amounttoConvert * data;
                    convertCurrencyToField.innerText = convertedCurrency.toFixed(2);
                });
            });
    }

    // initialize app
    init();

})();