(() => {

    // Register Service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./sw.js')
            .then(function () {
                toast('Service Worker Registered...');
                apiFetchCurrencies();
            });
    }

    //let convertCurrencyFrom = document.getElementById('base-currency').value;
    //let convertCurrencyTo = document.getElementById('converted-currency');

    function apiFetchCurrencies() {
        let currencies = '';
        if(!localStorage.currencies) {
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
        }
    }

})();