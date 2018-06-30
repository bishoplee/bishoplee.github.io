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
                console.log('Service Worker Registered...');
            });
    }

    //let convertCurrencyFrom = document.getElementById('base-currency').value;
    //let convertCurrencyTo = document.getElementById('converted-currency');

    // Methods
    function apiFetchCurrenciesList() {
        const apiURL = 'https://free.currencyconverterapi.com/api/v5/currencies';

        /*if(!localStorage.currencies) {
            fetch('https://free.currencyconverterapi.com/api/v5/countries')
                .then(response => response.json())
                .then(data => {
                    currencies = data.results;
                    console.log(currencies);
                    localStorage.setItem('currencies', JSON.stringify(currencies));
                });
        }else{
            currencies = JSON.parse(localStorage.currencies);
            const allcurrencies = Object.values(currencies).sort();
            console.log(allcurrencies);
        }*/

        const idbPromise = idb.open('currenc', 1, function(upgradeDb) {
            console.log('making a new object store to hold currencies list of all countries.');
            if (!upgradeDb.objectStoreNames.contains('currenciesByCountries')) {
                let currencies = '';
                fetch('https://free.currencyconverterapi.com/api/v5/countries')
                    .then(response => response.json())
                    .then(data => {
                        currencies = data.results;
                    })
                    .then(_ => {
                        console.log(currencies);
                    });
                const currenciesByCountriesStore = upgradeDb.createObjectStore('currenciesByCountries');
                currenciesByCountriesStore.put(currencies, 'currencies');
            }
        });

    }

    apiFetchCurrenciesList();

})();