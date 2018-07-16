(() => {
    'use strict';

    // Check if indexedDB is supported
    if (!('indexedDB' in window)) {
        console.log("This browser doesn't support IndexedDB");
        return;
    }

    // Register Service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./sw.js')
            .then(reg => {
                console.log("Service Worker Registered...");
                setInterval(() => {
                    reg.update();
                }, 3600000);
            }).catch(error => console.error(`Unable to register Service Worker. Error is ${error}`));
    }

    let __this = '';
    let decimalTrigger = '';
    let initialValue = '';

    const idbName = "currenc";

    const currencyListContainer = document.querySelector('#currencies-list');
    const currencyList = document.querySelector('#currencies-list ul');
    const loader = document.querySelector('.loader');
    const body = document.querySelector('body');
    const base = document.querySelector('.base__currency__name');
    const converted = document.querySelector('.converted__currency__name');
    const currencies = document.querySelector('.currencies');
    const backButton = document.querySelector('.back__button');
    const closeButton = document.querySelector('.close__button');
    //let md_btn = Array.prototype.slice.call(backButton);
    const numberKeyPad = document.querySelector('.number__keypad');
    const switchButton = document.getElementById('switch-button');
    const convertCurrencyToField = document.getElementById('converted-to');
    const keypad = document.getElementById('keypad');
    const inputField = document.getElementById('convert-from');
    const inputWrapper = document.getElementById('input-wrapper');
    const convertTrigger = document.getElementById('do-conversion');
    const convertInfo = document.getElementById('conversion-info');
    const baseCurrencyWrapper = document.getElementById('base-currency-wrapper');

    const hideNativeKeyboard = function(el) {
        el.setAttribute('readonly', 'readonly');
        setTimeout(function() {
            el.blur();
            el.removeAttribute('readonly');
        }, 10);
    };

    const changeFontSize = function(el) {
        const divider = el.value.length > 4 ? (el.value.length < 4 ? false : el.value.length) : false; //get input value
        let fontSize = 80 - divider * 4; //alter font size depending on string length
        el.style.fontSize = fontSize < 30 ? `30px` : fontSize + "px"; //set font size
    };

    const toTitleCase = function(str) {
        return str.replace(/\b\w*/g, function(txt){
            return txt === 'and' ? txt : txt.charAt(0).toUpperCase() + txt.substr(1);//.toLowerCase();
        });
    };

    const compareValues = function(key, order='asc') {
        return function(a, b) {
            if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
                // property doesn't exist on either object
                return 0;
            }

            const varA = (typeof a[key] === 'string') ?
                a[key].toUpperCase() : a[key];
            const varB = (typeof b[key] === 'string') ?
                b[key].toUpperCase() : b[key];

            let comparison = 0;
            if (varA > varB) {
                comparison = 1;
            } else if (varA < varB) {
                comparison = -1;
            }
            return (
                order === 'desc' ? comparison * -1 : comparison
            );
        };
    };

    /* const numberWithCommas = (x) => {
        //return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }; */

    const idbPromise = idb.open(idbName, 1, function(upgradeDB) {
        console.log("Making a new object store to hold currencies list of all countries.");
        if (!upgradeDB.objectStoreNames.contains('currencyConverter')) {
            upgradeDB.createObjectStore('currencyConverter');
            /*const currenciesOS = upgradeDB.createObjectStore('currencyConverter',{keyPath : 'id'});
            currenciesOS.createIndex('currency_id', 'currencyId', {unique : true} )*/
        }
    });

    // Methods
    function init(){
        // Check if `currencies` object already exists in DB
        fetchValuefromIDB('currencies').then(data => {
            if (typeof data === 'undefined') {
                apiFetchCurrenciesList(); return;
            }

            const today = new Date().setHours(0,0,0,0);
            const yesterday = data.date_log ? data.date_log : 86400000;

            (yesterday - today === -86400000) ? apiFetchCurrenciesList() : addCurrencyListtoDOM(data.results);
        });

        calculateExchangeRate();

        customEventListeners();
    }

    function customEventListeners() {
        // add listener for click on the `do-conversion` key
        convertTrigger.addEventListener('click', () => {
            //hide keypad
            keypad.classList.remove('slideInUp');

            // restore input to original position
            inputWrapper.classList.remove('moveUp');

            //do the conversion calculation
            calculateExchangeRate();
        });

        // detect if 'enter' key is pressed
        body.addEventListener('keydown', event => {
            if (event.keyCode === 13) {
                // restore keypad to default state
                keypad.classList.remove('slideInUp');
                // restore input to original position
                inputWrapper.classList.remove('moveUp');

                // do the conversion
                calculateExchangeRate();
            }
        });

        // add listener for click on base currency selection
        base.addEventListener('click', () => {
            currencyListContainer.classList.add('open');

            __this = this;
        });

        // add listener for click on target currency selection
        converted.addEventListener('click', () => {
            currencyListContainer.classList.add('open');

            __this = this;
        });

        // add listener for click on currency name
        currencies.addEventListener('click', event => {
            if (event.target.classList.contains('currency__list')) {
                const currencyName = event.target.childNodes["0"].childNodes["0"].textContent;
                const currencyID = event.target.id;
                const currencySymbol = event.target.childNodes["0"].dataset.currencySymbol === 'undefined' ?
                    "" : event.target.childNodes["0"].dataset.currencySymbol;

                __this.innerText = currencyName;
                __this.id = currencyID;

                // fixes bug where target currency symbol shows in base currency label
                if (__this === base) {
                    document.querySelector('label').innerText = currencySymbol;
                } else {
                    converted.nextElementSibling.dataset.symbol = currencySymbol;
                }

                currencyListContainer.classList.remove('open');
                calculateExchangeRate();
            }
        });

        // add listener for click on back__button on the currency list view
        backButton.addEventListener('click', () => {
            document.getElementById('currencies-list').classList.remove('open');
        });

        // add listener for click on close__button on the keypad view
        closeButton.addEventListener('click', () => {
            //console.log(el); return;
            setTimeout(function() {
                //hide keypad
                keypad.classList.remove('slideInUp');
                // restore input to original position
                inputWrapper.classList.remove('moveUp');
                // remove `disable` from base_currency_wrapper
                baseCurrencyWrapper.classList.remove('disabled');
                //default inputField value to 1
                inputField.value = numeral(initialValue).format('0,0.00');

                calculateExchangeRate();
            }, 500);
        });

        // allow numbers and decimal point only, applicable to desktop
        inputField.addEventListener('keydown', e => {
            const key = e.keyCode ? e.keyCode : e.which;

            // 8 : 'Backspace', 9 : '', 13 : 'Enter', 27 : '', 46 : 'Delete', 110 : 'NumpadDecimal', 190 : 'Period'
            if (!([8, 9, 13, 27, 46, 110, 190].indexOf(key) !== -1 ||
                (key === 65 && (e.ctrlKey || e.metaKey)) ||
                (key >= 35 && key <= 40) ||
                (key >= 48 && key <= 57 && !(e.shiftKey || e.altKey)) ||
                (key >= 96 && key <= 105)
            )) e.preventDefault();

            // prevents a second decimal point
            if ((key !== 190 || this.value.indexOf('.') !== -1)
                && (key !== 110 || this.value.indexOf('.') !== -1)
                && ((key < 48 && key !== 8)
                    || (key > 57 && key < 96)
                        || key > 105)) e.preventDefault();

            changeFontSize(inputField);
        });

        // add listener for click on keypad keys
        numberKeyPad.addEventListener('click', event => {
            // add vibration on key press for mobile
            navigator.vibrate(50);
            
            // actions to take during conversion process
            if(event.target.childNodes["0"].dataset.value === 'convert'){
                return;
            }
            
            // retrieve current input value
            const currentValue = inputField.value;

            if(currentValue.length > 9){
                navigator.vibrate(100);
                toast("Maximum number of digits (10) exceeded");
            } else {
                // disable decimal point key
                if(event.target.childNodes["0"].dataset.value === '.'){
                    event.target.classList.add('disabled');
                    decimalTrigger = event.target;
                }

                // construct new value to be added to DOM
                const newValue = event.target.childNodes["0"].dataset.value === 'delete' ? currentValue.slice(0, -1) : currentValue + event.target.childNodes["0"].dataset.value;

                // check if new value contains decimal point when value is being deleted
                if (event.target.childNodes["0"].dataset.value === 'delete' && decimalTrigger !== '') {
                    if (newValue.indexOf('.') === -1) {
                        decimalTrigger.classList.remove('disabled');
                    }
                }

                inputField.value = newValue;
                //inputField.focus();
                changeFontSize(inputField);
            }
        });

        // add listener for click on touch area for keypad trigger
        baseCurrencyWrapper.addEventListener('click', event => {
            if (event.target.id.match('base-currency-wrapper') || event.target.id.match('convert-from')) {
                // hide native keypads
                hideNativeKeyboard(inputField);
                // move input field up in the DOM
                inputWrapper.classList.add('moveUp');
                // reveal custom keypad
                keypad.classList.add('slideInUp');
                // disable future event on this area
                baseCurrencyWrapper.classList.add('disabled');
                // clear input field value
                initialValue = inputField.value;
                inputField.value = "";

            }
        });

        // switch button
        switchButton.addEventListener('click', () => {
            switchButton.classList.add('rotate');
            const currentBaseId = base.id;
            const currentTargetId = converted.id;
            const currentBaseCurrency = base.innerText;
            const currentTargetCurrency = converted.innerText;
            const currentBaseSymbol = document.querySelector('label').innerText;
            const currentTargetSymbol = converted.nextElementSibling.dataset.symbol;

            setTimeout(() => {
                base.id = currentTargetId;
                converted.id = currentBaseId;
                base.innerText = currentTargetCurrency;
                converted.innerText = currentBaseCurrency;
                document.querySelector('label').innerText = currentTargetSymbol;
                converted.nextElementSibling.dataset.symbol = currentBaseSymbol;

                switchButton.classList.remove('rotate');

                calculateExchangeRate();
            }, 450);
        })
    }

    // Fetch currencies from API url
    function apiFetchCurrenciesList() {
        //const apiURL = 'https://free.currencyconverterapi.com/api/v5/countries';
        const apiURL = 'https://free.currencyconverterapi.com/api/v5/currencies';

        fetch(apiURL, {
            cache: 'default',
        })
            .then(response => response.json())
            .then(data => {
                data.date_log = new Date().setHours(0,0,0,0);

                // Save currency list to IndexedDB for offline access
                saveCurrenciesListtoIDB('currencies', data);

                addCurrencyListtoDOM(data.results);
            })
            .catch(error => {
                console.error(
                    `The following error occurred while fetching the list of currencies. ${error}`
                );
                fetchValuefromIDB('currencies').then(currencies => {
                    if (typeof currencies === 'undefined'){
                        toast('No internet connection.');
                    } else {
                        addCurrencyListtoDOM(currencies);
                    }
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

    // Save exchange rates to IDB
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
    function addCurrencyListtoDOM(data) {
        // group data into alphabets on the `currencyName` key
        const result = Object.values(data).reduce((r, e) => {
            let group = e.currencyName[0];

            if(!r[group]) r[group] = {group, children: [e]}
            else r[group].children.push(e);

            return r;
        }, {});

        for (const currency of Object.values(result).sort(compareValues('group'))){
            const li = document.createElement("li");

            li.className = "currency_list_title";
            li.innerHTML = currency.group;

            currencyList.appendChild(li);

            const reorder = [...currency.children].sort(function (a, b) {
                return (a.currencyName > b.currencyName) ? 1 : ((b.currencyName > a.currencyName) ? -1 : 0);
            });

            for (const key of reorder) {
                const currencyName = key.currencyName;
                const currencySymbol = key.currencySymbol;
                //const currencyID = key.currencyId;
                const currencyID = key.id;

                const li = document.createElement("li");

                li.className = "currency__list";
                li.id = currencyID;

                const a = document.createElement("a");
                a.dataset.currencySymbol = currencySymbol;
                a.innerHTML = `${currencyName} <span>${currencyID}</span>`;

                li.appendChild(a);

                currencyList.appendChild(li);
            }
        }
    }

    // Calculate the exchange rate for selected currencies
    function calculateExchangeRate() {
        //clear current result
        convertCurrencyToField.innerText = "";
        convertInfo.innerText = "";

        // remove `disabled` from base_currency_wrapper
        baseCurrencyWrapper.classList.remove('disabled');

        // remove `disabled` from decimal key on keypad
        decimalTrigger !== "" ? decimalTrigger.classList.remove('disabled') : false;

        // retrieve current input value and format
        inputField.value = numeral(inputField.value).format('0,0.00');

        //show loader
        loader.classList.add('show');

        const amounttoConvert = numeral(inputField.value).value();
        const baseCurrency = base.id;
        const targetCurrency = converted.id;
        const currencyExchange = `${baseCurrency}_${targetCurrency}`;
        const url = `https://free.currencyconverterapi.com/api/v5/convert?q=${currencyExchange}&compact=ultra`;

        let convertedCurrency = '';

        if(navigator.onLine){
            fetch(url, {
                cache: 'default',
            })
                .then(response => response.json())
                .then(data => {
                    const exchangeRates = Object.values(data);

                    // Save currency exchange rate to IndexedDB for when user is offline
                    saveCurrencyConversionRatetoIDB(currencyExchange, exchangeRates);

                    convertedCurrency = amounttoConvert * exchangeRates;
                    convertCurrencyToField.innerText = numeral(convertedCurrency).format('0,0.00');
                    convertInfo.innerText = `1 ${baseCurrency} = ${targetCurrency} ${exchangeRates}`;

                    loader.classList.remove('show');
                })
                .catch(error => {
                    console.log(
                        `The following error occurred while getting the conversion rate. ${error}`,
                    );

                    // Get currency exchange rate when the user is offline
                    fetchValuefromIDB(currencyExchange).then(data => {
                        if (typeof data === 'undefined') return;  // display a message to let user know the app is offline

                        convertedCurrency = amounttoConvert * data;
                        convertCurrencyToField.innerText = numeral(convertedCurrency).format('0,0.00');
                        convertInfo.innerText = `1 ${baseCurrency} = ${targetCurrency} ${data}`;

                        loader.classList.remove('show');
                    });
                });
        } else {
            // Get currency exchange rate from IDB
            fetchValuefromIDB(currencyExchange).then(data => {
                if (typeof data === 'undefined') {
                    console.log('Rate is not available offline, turn on your data.');
                    toast('No connection detected. Retrying in ...', 60000);
                } else {
                    convertedCurrency = amounttoConvert * data;
                    convertCurrencyToField.innerText = numeral(convertedCurrency).format('0,0.00');
                    convertInfo.innerText = `1 ${baseCurrency} = ${targetCurrency} ${data}`;

                    loader.classList.remove('show');
                }
            });
        }
    }

    // initialize app
    init();

})();

// ... done  TODO: [1] add spinner/loader to `convertCurrencyToField` to show waiting time
// ... done  TODO: [2] add number pad to override native keypad
// ... done  TODO: [3] display notification message to let user know the app is offline when fetching from API
// ... done  TODO: [4] refetch currencies stored in IDB every 86400000ms
//  TODO: [5] refetch exchange rates stored in IDB every 3600000ms
//  TODO: [6] log the most frequently converted currencies
//  TODO: [7] add refresh button to override [4] and [5]
// ... done  TODO: [8] catch field value to remove decimal points not to exceed one
//  TODO: [9] add delete button functionality
// ... done  TODO: [10] add vibration plugin on key press/tap
// ... done  TODO: [11] catch key press to exempt non-numeric values
// ... done  TODO: [12] disable double trigger on convert button
//  TODO: [13] add search to currency list to filter list by value entered
// ... done  TODO: [14] load default conversion rate for preselected currencies
// ... done  TODO: [15] add switch for currency name and rate
//  TODO: [16] keep track of conversion history
//  TODO: [17] add app credit to icon on-click event

//COMMENTS: once app loads, check if there are data in IDB,
// if yes, display data, then fetch fresh data from API and update DOM, then save fresh data to IDB
// if no, connect to API and fetch data, then update DOM, then save data to IDB

/*
for (let attributes in data.results){
    let option1 = document.createElement('option');
    let option2 = document.createElement('option');
    option1.textContent = `${data.results[attributes].currencySymbol}   -  (${data.results[attributes].id})  -  ${data.results[attributes].currencyName}`;
    option2.textContent = `${data.results[attributes].currencySymbol}   -  (${data.results[attributes].id})  -  ${data.results[attributes].currencyName}`;

    currencyList.appendChild(option1);
    convertedTo.appendChild(option2);
}*/