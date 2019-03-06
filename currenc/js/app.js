(() => {
    'use strict';

    // Check if indexedDB is supported
    if (!('indexedDB' in window)) {
        console.log("This browser doesn't support IndexedDB");
        return;
    }

    let __this = '';
    let decimalTrigger = '';
    let initialValue = '';
    let currency_list_title_visible = true;
    let defaultCountries = ['USD', 'NGN', 'GHS', 'KES', 'GBP', 'XAF', 'CNY', 'JPY', 'EUR', 'XOF', 'ZAR'];
    let retrialTimeOut = 3000;
    let newValue = '';
    let realNumber = '';
    let answer = 0;
    let activated = false;
    let memory = false;

    const idbName = "currenc";
    const currenciesAPI_URL = 'https://free.currencyconverterapi.com/api/v6/currencies?apiKey=656e06c7ed8fdabd8952';
    const exchangeRateAPI_URL = 'https://free.currencyconverterapi.com/api/v6/convert?apiKey=656e06c7ed8fdabd8952';
    const _now = String(moment().format("MMMM D, YYYY"));

    const header = document.querySelector('header');
    const currencyListContainer = document.querySelector('#currencies-list');
    const currencyList = document.querySelector('#currencies-list ul');
    const loader = document.querySelector('.loader');
    const base = document.querySelector('.base__currency__name');
    const converted = document.querySelector('.converted__currency__name');
    const currencies = document.querySelector('.currencies');
    const backButton = document.querySelector('.back__button');
    const closeButton = document.querySelector('.close__button');
    const searchButton = document.querySelector('.search__button');
    const refreshButton = document.querySelector('.refresh__button');
    const searchField = document.querySelector('.search__field');
    const alphaKeyPadClose = document.querySelector('#search-field-wrapper .back__button');
    const numberKeyPad = document.querySelector('.number__keypad');
    const alphaKeyPad = document.querySelector('.keyboard');
    const calculatorScreen = document.querySelector('.entries');

    const caret = "<span class='caret'></span>";
    searchField.insertAdjacentHTML('afterend', caret);

    const scala = document.querySelector('.scala');
    const search__hide = scala.previousElementSibling;
    search__hide.style.left = "8px";

    const switchButton = document.getElementById('switch-button');
    const convertCurrencyToField = document.getElementById('converted-to');
    const keypad = document.getElementById('keypad');
    const alphapad = document.getElementById('alphapad');
    const inputField = document.getElementById('convert-from');
    const inputWrapper = document.getElementById('input-wrapper');
    const searchWrapper = document.querySelector('.search__wrapper');
    const convertTrigger = document.getElementById('do-conversion');
    const convertInfo = document.getElementById('conversion-info');
    const baseCurrencyWrapper = document.getElementById('base-currency-wrapper');

    const updateNetworkStatus = function() {
        if ((navigator.connection.type === "none") || (window.navigator.onLine === false)) {
            header.classList.add('app__offline');

            if(typeof localStorage.first_run === "undefined") {
                toast("No internet connection. Check your mobile data or Wi-Fi");
            }
        } else {
            header.classList.remove('app__offline');
        }
    };

    function onBackKeyDown(e) {

    }

    const hideNativeKeyboard = function(el) {
        el.setAttribute('readonly', 'readonly');
        el.blur();
        el.removeAttribute('readonly');
        return true;
    };

    const changeFontSize = function(el) {
        const divider = el.innerText.length > 4 ? (el.innerText.length < 4 ? false : el.innerText.length) : false; //get input value
        let fontSize = 60 - divider * 1.5; //alter font size depending on string length
        el.style.fontSize = fontSize < 40 ? `40px` : fontSize + "px"; //set font size
    };

    const toTitleCase = function(str) {
        return str.replace(/\b\w*/g, function(txt) {
            return txt === 'and' ? txt : txt.charAt(0).toUpperCase() + txt.substr(1); //.toLowerCase();
        });
    };

    const compareValues = function(key, order = 'asc') {
        return function(a, b) {
            if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
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

    const searchFilter = function(list = currencyList.querySelectorAll('.currency__list'), headers = currencyList.querySelectorAll('.currency_list_title')) {
        // Loop through all list items, and hide those who don'Array.prototype.forEach.call(headers, (el) => {
        //                         el.classList.remove('hidden');
        //
        //                         // reset visibility of list headers
        //                         currency_list_title_visible = true;
        //                     });t match the search query
        for (let i = 0; i < list.length; i++) {
            const a = list[i].getElementsByTagName("a")[0];
            if (a.innerText.toUpperCase().indexOf(searchField.value.toUpperCase()) > -1) {
                list[i].classList.remove('hidden');

                if (searchField.value === '') {

                }
            } else {
                list[i].classList.add('hidden');
            }
        }
    };

    const disableOps = () => {
        Array.prototype.forEach.call(document.querySelectorAll('.ops'), (el) => {
            el.parentNode.classList.remove('enabled');
            setTimeout(() => {
                el.parentNode.classList.add('disabled');
            }, 100);
            activated = false;
        });
    };

    const triggeredOn = (els, r, a) => {
        Array.prototype.forEach.call(document.querySelectorAll(els), (el) => {
            el.classList.remove(r);
            setTimeout(() => {
                el.classList.add(a);
            }, 100);
        });
    };

    const calculator = (n, op) => {
        switch (op) {
            case "divide":
                realNumber = realNumber + "/";
                break;

            case "multiply":
                realNumber = realNumber + "*";
                break;

            case "add":
                realNumber = realNumber + "+";
                break;

            case "minus":
                realNumber = realNumber + "-";
                break;

            default:
                answer = parseFloat(eval(realNumber).toPrecision(12));
                memory = true;
                break;
        }
    };

    const idbPromise = idb.open(idbName, 1, function(upgradeDB) {
        console.log("Making a new object store to hold currencies list of all countries.");
        if (!upgradeDB.objectStoreNames.contains('currencyConverter')) {
            upgradeDB.createObjectStore('currencyConverter');
        }
    });

    window.addEventListener('online', updateNetworkStatus, false);
    window.addEventListener('offline', updateNetworkStatus, false);

    // Methods
    function init() {
        //const platform = (device === undefined) ? "android" : device.platform.toUpperCase();

        // add device platform as css rule to document body
        //document.body.classList.add('is_' + platform.toLowerCase());

        document.querySelector('.date data').innerHTML = _now;

        loader.classList.add('show');

        fetchDatafromIDB('currencies').then(data => {
            if (typeof data === 'undefined') {
                apiFetchCurrenciesList();
            } else {
                addCurrencyListtoDOM(data.results);

                const yesterday = data.date_log;

                if (yesterday !== _now) {
                    apiFetchCurrenciesList();
                }
            }
        });

        updateNetworkStatus();

        initializeExchangeRates();

        customEventListeners();

        calculateExchangeRate();
    }

    function customEventListeners() {
        // #base - add listener for click on base currency selection
        base.addEventListener('click', () => {
            currencyListContainer.classList.add('open');
            currencyListContainer.addEventListener('animationend', el => {
                el.target.classList.remove('hidden');
            });

            __this = base;
        });

        // #converted - add listener for click on target currency selection
        converted.addEventListener('click', () => {
            currencyListContainer.classList.add('open');
            currencyListContainer.addEventListener('animationend', el => {
                el.target.classList.remove('hidden');
            });

            __this = converted;
        });

        // #currencies - add listener for click on currency name
        currencies.addEventListener('click', event => {
            if (event.target.classList.contains('currency__list')) {
                const currencyName = event.target.childNodes["0"].childNodes["0"].textContent;
                const currencyID = event.target.id;
                const currencySymbol = event.target.childNodes["0"].dataset.currencySymbol === 'undefined' ?
                    "" : event.target.childNodes["0"].dataset.currencySymbol;

                __this.querySelector('span').innerText = currencyName;
                __this.id = currencyID;

                // fixes bug where target currency symbol shows in base currency label
                if (__this === base) {
                    document.querySelector('label').innerText = currencyID;
                } else {
                    converted.nextElementSibling.dataset.symbol = currencySymbol;
                }

                // do some house cleaning
                scala.style.transform = "scale3d(0,0,0)";
                searchField.value = "";

                setTimeout(() => {
                    searchField.classList.add('hidden');
                    search__hide.classList.add('hidden');
                    searchWrapper.classList.add('hidden');
                    alphapad.classList.remove('reveal');
                    currencyList.style.paddingBottom = "40px";

                    setTimeout(() => {
                        alphapad.classList.add('hidden');
                        searchFilter();
                    }, 20)
                }, 10);

                currencyListContainer.classList.remove('open');

                calculateExchangeRate();
            }
        });

        // #backButton - add listener for pointerdown on back__button on the currency list view
        backButton.addEventListener('click', () => {
            currencyListContainer.classList.remove('open');
        });

        // #searchButton - add listener for pointerdown on search__button on the currency list view
        searchButton.addEventListener('pointerdown', () => {
            searchWrapper.classList.remove('hidden');

            setTimeout(() => {
                // bubble reveal
                scala.style.transform = "scale3d(1,1,1)";

                setTimeout(() => {
                    // un-hide the input field and arrow
                    searchField.classList.remove('hidden');
                    search__hide.classList.remove('hidden');

                    // hide mobile native keyboard
                    hideNativeKeyboard(searchField);

                    setTimeout(() => {
                        // reveal the alpha keyboard
                        alphapad.classList.remove('hidden');
                        alphapad.classList.add('reveal');
                        currencyList.style.paddingBottom = `${(alphapad.clientHeight + 40)}px`;
                    }, 20)
                }, 400)
            }, 20);
        });

        // #alphaKeyPadClose - add listener for pointerdown on back-arrow in the search-filter input field
        alphaKeyPadClose.addEventListener('pointerdown', () => {
            scala.style.transform = "scale3d(0,0,0)";

            setTimeout(() => {
                searchField.value = "";
                searchFilter();
                searchField.classList.add('hidden');
                search__hide.classList.add('hidden');
                searchWrapper.classList.add('hidden');
                alphapad.classList.remove('reveal');
                currencyList.style.paddingBottom = "40px";

                setTimeout(() => {
                    alphapad.classList.add('hidden');
                }, 300)
            }, 200);
        });

        // #alphaKeyPad - add listener for pointerdown on alphakeypad keys
        alphaKeyPad.addEventListener('pointerdown', event => {
            if (event.target.className !== "keyboard__row") {
                // add vibration on key press for mobile
                navigator.vibrate(30);

                // remove all the list headers
                if (currency_list_title_visible) {
                    Array.prototype.forEach.call(currencyList.querySelectorAll('.currency_list_title'), (el) => {
                        el.classList.add('hidden');
                    });
                }

                // retrieve current search input value
                const currentValue = searchField.value;
                const root = document.querySelector(':root');

                //console.log(event.target);

                // shift case toggle from lower to upper and vise-versa
                if (event.target.dataset.key === 'shift') {
                    const shiftCase = getComputedStyle(root).getPropertyValue('--text-case');
                    (shiftCase === "lowercase") ? root.style.setProperty('--text-case', 'uppercase'): root.style.setProperty('--text-case', 'lowercase');
                }

                // set value of the search filter input field
                searchField.value = event.target.dataset.key === 'delete' ? currentValue.slice(0, -1) : currentValue + event.target.innerText;

                searchFilter();
            }
        });

        // #long-press - detect long press on the alpha keys
        document.addEventListener('long-press', el => {
            navigator.vibrate(40);

            el.target.setAttribute('data-editing', 'true');

            // if target key is the `delete` button
            if (el.srcElement.dataset.key === "delete") {
                searchField.value = "";

                hideNativeKeyboard(searchField);

                searchFilter();
            }
        });

        // #switchButton - switch button event handler to activate currency name switching
        switchButton.addEventListener('pointerdown', () => {
            // subtle rotate animation for visual effect
            switchButton.classList.add('rotate');

            const currentBaseId = base.id;
            const currentTargetId = converted.id;
            const currentBaseCurrency = base.querySelector('span').innerText;
            const currentTargetCurrency = converted.querySelector('span').innerText;
            const currentBaseSymbol = document.querySelector('label').innerText;
            const currentTargetSymbol = converted.nextElementSibling.dataset.symbol;

            setTimeout(() => {
                base.id = currentTargetId;
                converted.id = currentBaseId;
                base.querySelector('span').innerText = currentTargetCurrency;
                converted.querySelector('span').innerText = currentBaseCurrency;
                document.querySelector('label').innerText = currentTargetId;
                converted.nextElementSibling.dataset.symbol = currentBaseSymbol;

                switchButton.classList.remove('rotate');

                calculateExchangeRate();
            }, 450);
        });

        // #baseCurrencyWrapper - add listener for pointerdown on touch area for keypad trigger
        inputWrapper.addEventListener('pointerdown', event => {
            // hide native key[pad || board]s
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
            inputField.placeholder = 0;
        });

        // #inputField - show or hide cursor when inputField focus()
        inputField.addEventListener('focus', () => {
            hideNativeKeyboard(inputField);
        });

        // #closeButton - add listener for pointerdown on close__button on the keypad view
        closeButton.addEventListener('pointerdown', () => {
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
            }, 300);
        });

        // #refreshButton - add listener for pointerdown on button
        refreshButton.addEventListener('pointerdown', e => {
            e.target.classList.add('rotate');
            apiFetchCurrenciesList(e.target);
            calculateExchangeRate();
        });

        // #numberKeyPad - add listener for pointerdown on keypad keys
        numberKeyPad.addEventListener('pointerdown', event => {
            // add vibration on key press for mobile
            navigator.vibrate(30);

            if (memory) {
                calculatorScreen.innerText = "";
                newValue = "";
                realNumber = "";
                answer = 0;
                memory = false;
            }

            // disable accidental trigger when parent ul is touched
            if (event.target.classList.contains('number__keypad') || event.target.children["0"].dataset.ops === 'convert') {
                return;
            }

            // construct new value to be added to DOM
            if (event.target.children["0"].dataset.value) {
                newValue = answer > 0 ? event.target.children["0"].dataset.value : calculatorScreen.innerText + event.target.children["0"].dataset.value;
                realNumber += isNaN(parseInt(event.target.children["0"].dataset.value)) ? '' : event.target.children["0"].dataset.value;

                if (!activated) {
                    triggeredOn('li.key.disabled', 'disabled', 'enabled');
                    activated = true;
                }

                // disable decimal point key when clicked for the first time
                if (event.target.children["0"].dataset.value === '.') {
                    realNumber = realNumber + ".";
                    setTimeout(() => {
                        event.target.classList.add('disabled');
                        decimalTrigger = event.target;
                    }, 100);
                }
            }

            if (newValue.length > 15) {
                // Maximum number of digits (12) exceeded;
                navigator.vibrate([50]);
            } else {
                // construct new value to be added to DOM when a digit is deleted
                if (event.target.children["0"].dataset.reset === 'delete') {
                    if (!activated) {
                        triggeredOn('li.key.disabled', 'disabled', 'enabled');
                    }

                    newValue = (newValue === "") ? '' : newValue.slice(0, -1);
                    realNumber = (realNumber === "") ? '' : realNumber.slice(0, -1);
                }

                // clear values when 'c' button is clicked
                if (event.target.children["0"].dataset.reset === 'clear') {
                    newValue = "";
                    realNumber = "";
                    answer = 0;

                    triggeredOn('li.key.enabled', 'enabled', 'disabled');
                    activated = false;

                    if (decimalTrigger !== "") {
                        decimalTrigger.classList.remove('disabled');
                        decimalTrigger = "";
                    }
                }

                // if newValue is empty
                if (newValue === "") {
                    if (activated) {
                        triggeredOn('li.key.enabled', 'enabled', 'disabled');
                        activated = false;
                    }
                    if (decimalTrigger !== "") {
                        decimalTrigger.classList.remove('disabled');
                        decimalTrigger = "";
                    }
                }

                // Add click event to operators
                if (event.target.children["0"].dataset.ops) {
                    disableOps();
                    calculator(realNumber, event.target.children["0"].dataset.ops);
                }

                // do the arithmetic when 'equals' button is clicked
                if (event.target.children["0"].dataset.reset === 'equals') {
                    calculator(0, event.target.children["0"].dataset.reset);
                }

                inputField.value = (answer > 0) ? answer : realNumber;
                if (answer > 0) {
                    calculatorScreen.innerText = answer;
                } else {
                    calculatorScreen.innerText = newValue;
                }

                //console.log(inputField.value);

                hideNativeKeyboard(inputField);

                changeFontSize(calculatorScreen);
            }
        });

        // #convertTrigger - add listener for pointerdown on the `do-conversion` key
        convertTrigger.addEventListener('click', () => {
            triggeredOn('li.key.enabled', 'enabled', 'disabled');
            activated = false;

            //hide keypad
            keypad.classList.remove('slideInUp');

            // restore input to original position
            inputWrapper.classList.remove('moveUp');

            //do the conversion calculation
            calculateExchangeRate();
        });

        document.addEventListener("backbutton", onBackKeyDown(), false);
    }

    // Fetch currencies from API url
    function apiFetchCurrenciesList(el) {
        fetch(currenciesAPI_URL, {
                cache: 'default',
            })
            .then(response => response.json())
            .then(data => {
                if(el) el.classList.remove('rotate');

                data.date_log = _now; //new Date().setHours(0, 0, 0, 0);

                // Save currency list to IndexedDB for offline access
                saveCurrenciesListtoIDB('currencies', data);

                addCurrencyListtoDOM(data.results);
            })
            .catch(error => {
                if(el) el.classList.remove('rotate');

                console.error(
                    `The following error occurred while fetching the list of currencies. ${error}`
                );
                /* const li = document.createElement("li");

                li.className = "currency_list_title";
                li.innerHTML = "You are offline. Connect to internet."; */

                //currencyList.innerHTML = "<li>You are offline. Connect to internet.</li>";
            });
    }

    /* function pairwise(list) {
        if (list.length < 2) { return []; }
        var first = list[0],
            rest = list.slice(1),
            pairs = rest.map(function(x) { return [first, x]; });

        return pairs.concat(pairwise(rest));
    } */

    // Store regular currencies' exchange rates to IndexedDB
    function initializeExchangeRates() {
        let pairs = [];
        for (const i in defaultCountries) {
            const base = defaultCountries[i];

            for (const j of defaultCountries) {
                if (j !== base) {
                    pairs.push(`${base}_${j}`);
                }
            }
        }

        // TODO: uncomment block when on paid API
        /*const fetcher = setInterval(() => {
            if(pairs.length){
                console.log(pairs.splice(0,2).join());
                apiFetchExchangeRates(pairs.splice(0,2).join());
            } else {
                clearInterval(fetcher);
            }
        }, 2000);*/

        setInterval(() => {
            calculateExchangeRate();
        }, 900000);

    }

    // Fetch currency exchange rates from API url
    function apiFetchExchangeRates(pair, callback=false) {
        if(pair) {
            const url = `${exchangeRateAPI_URL}&q=${pair}&compact=ultra`;

            fetch(url, {
                cache: 'default',
            })
                .then(response => response.json())
                .then(data => {
                    const exchangeRates = Object.values(data);

                    // Save currency exchange rate to IndexedDB for when user is offline
                    saveCurrencyConversionRatetoIDB(pair.split(",")[0], exchangeRates[0]);
                    saveCurrencyConversionRatetoIDB(pair.split(",")[1], exchangeRates[1]);

                    localStorage.app_ready = true;
                    if (callback) calculateExchangeRate();
                })
                .catch(error => {
                    //console.log(`The following error occurred while getting the conversion rate. ${error}`);
                });
        }
    }

    // Fetch and update currency exchange rates from API url
    function apiFetchUpdatedExchangeRates(pair1, pair2) {
        const url = `${exchangeRateAPI_URL}&q=${pair1},${pair2}&compact=ultra`;

        fetch(url, {
                cache: 'default',
            })
            .then(response => response.json())
            .then(data => {
                const exchangeRates = Object.values(data);

                const oldConversionRate = numeral(convertInfo.innerText.split(" = ")[1]).value();

                if (exchangeRates[0] === oldConversionRate) {
                    console.log("Rates have not changed.")
                } else {
                    // Save updated currency exchange rate to IndexedDB for when user is offline
                    saveCurrencyConversionRatetoIDB(pair1, exchangeRates[0]);
                    saveCurrencyConversionRatetoIDB(pair2, exchangeRates[1]);

                    //TODO: send values off to server

                    calculateExchangeRate();
                    toast("Rates updated.");
                }
            })
            .catch(error => {
                console.log(`The following error occurred while getting the conversion rate. ${error}`);
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
    function fetchDatafromIDB(key) {
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
        // initial cleanup list items
        currencyList.innerHTML = "";

        // group data into alphabets on the `currencyName` key
        const result = Object.values(data).reduce((r, e) => {
            let group = e.currencyName[0];

            if (!r[group]) r[group] = { group, children: [e] }
            else r[group].children.push(e);

            return r;
        }, {});

        for (const currency of Object.values(result).sort(compareValues('group'))) {
            const li = document.createElement("li");

            li.className = "currency_list_title";
            li.innerHTML = currency.group;

            currencyList.appendChild(li);

            const reorder = [...currency.children].sort(function(a, b) {
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
        calculatorScreen.innerText = "";
        newValue = "";
        realNumber = "";
        answer = 0;

        // remove `disabled` from base_currency_wrapper
        baseCurrencyWrapper.classList.remove('disabled');

        // remove `disabled` from decimal key on keypad
        decimalTrigger !== "" ? decimalTrigger.classList.remove('disabled') : false;

        // retrieve current input value and format
        inputField.value = numeral(inputField.value).format('0,0.00');

        //show loader
        loader.classList.add('show');

        const amountToConvert = numeral(inputField.value).value();
        const baseCurrency = base.id;
        const targetCurrency = converted.id;
        const currencyExchange = `${baseCurrency}_${targetCurrency}`;
        const currencyExchangePair = `${targetCurrency}_${baseCurrency}`;

        let convertedCurrency = '';

        // if currencies selected are the same
        if (baseCurrency === targetCurrency) {
            convertedCurrency = amountToConvert * 1;
            convertCurrencyToField.innerText = numeral(convertedCurrency).format('0,0.00');
            convertInfo.innerText = `1 ${baseCurrency} = ${targetCurrency} 1`;

            loader.classList.remove('show');
        } else {
            // check first if exchange rate has value in idb
            fetchDatafromIDB(currencyExchange).then(data => {
                // state 1 : no
                if (typeof data === 'undefined') {
                    // check if (navigator.onLine) {
                    if ((navigator.connection.type === "none") || (window.navigator.onLine === false)) {
                        //console.log('Rate is not available offline, turn on your data.');
                        toast('Active internet connection needed to load rates for the first time.', 5000);

                        //retrialTimeOut = retrialTimeOut + 10000;

                        if (keypad.classList.contains('slideInUp')) {
                            return;
                        } else {
                            // retry after multiple of 3secs
                            setTimeout(() => {
                                calculateExchangeRate();
                            }, retrialTimeOut);
                        }
                    } else {
                        apiFetchExchangeRates(`${currencyExchange}, ${currencyExchangePair}`, true);
                    }
                }
                // state 2 : yes
                else {
                    convertedCurrency = amountToConvert * data;
                    convertCurrencyToField.innerHTML = numeral(convertedCurrency).format('0,0.00') + `<span>${targetCurrency}</span>`;
                    // convertCurrencyToField.innerHTML = numeral(convertedCurrency).format('0,0.00');
                    convertInfo.innerText = `1 ${baseCurrency} = ${targetCurrency} ${data}`;

                    loader.classList.remove('show');

                    apiFetchUpdatedExchangeRates(currencyExchange, currencyExchangePair);
                }
            });
        }
    }

    // initialize app
    document.addEventListener('deviceready', init(), false);

})();

//TODO: keep history of exchange rates