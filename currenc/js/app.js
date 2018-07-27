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

    const idbName = "currenc";
    const currenciesAPI_URL = 'https://free.currencyconverterapi.com/api/v5/currencies';
    const exchangeRateAPI_URL = "https://free.currencyconverterapi.com/api/v5/convert";

    const header = document.querySelector('header');
    const currencyListContainer = document.querySelector('#currencies-list');
    const currencyList = document.querySelector('#currencies-list ul');
    const loader = document.querySelector('.loader');
    const body = document.querySelector('body');
    const base = document.querySelector('.base__currency__name');
    const converted = document.querySelector('.converted__currency__name');
    const currencies = document.querySelector('.currencies');
    const backButton = document.querySelector('.back__button');
    const closeButton = document.querySelector('.close__button');
    const searchButton = document.querySelector('.search__button');
    const searchField = document.querySelector('.search__field');
    const alphaKeyPadClose = document.querySelector('#search-field-wrapper .back__button');
    const numberKeyPad = document.querySelector('.number__keypad');
    const alphaKeyPad = document.querySelector('.keyboard');

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
    const searchWrapper = document.getElementById('search-field-wrapper');
    const convertTrigger = document.getElementById('do-conversion');
    const convertInfo = document.getElementById('conversion-info');
    const baseCurrencyWrapper = document.getElementById('base-currency-wrapper');

    const updateNetworkStatus = function() {
        if (navigator.connection.type !== "none") {
            header.classList.remove('app__offline');
        } else {
            toast('You are now offline...');
            header.classList.add('app__offline');
        }
    };

    const hideNativeKeyboard = function(el) {
        el.setAttribute('readonly', 'readonly');

        if (navigator.userAgent.indexOf("Mobile") > 0) {
            el.blur();
            el.removeAttribute('readonly');
            return true;
        } else {
            setTimeout(() => {
                el.removeAttribute('readonly');
                el.focus();
            }, 10);
        }
    };

    const changeFontSize = function(el) {
        const divider = el.value.length > 4 ? (el.value.length < 4 ? false : el.value.length) : false; //get input value
        let fontSize = 80 - divider * 4; //alter font size depending on string length
        el.style.fontSize = fontSize < 30 ? `30px` : fontSize + "px"; //set font size
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
        // Loop through all list items, and hide those who don't match the search query
        for (let i = 0; i < list.length; i++) {
            const a = list[i].getElementsByTagName("a")[0];
            if (a.innerText.toUpperCase().indexOf(searchField.value.toUpperCase()) > -1) {
                list[i].classList.remove('hidden');

                if (searchField.value === '') {
                    Array.prototype.forEach.call(headers, (el) => {
                        el.classList.remove('hidden');

                        // reset visibility of list headers
                        currency_list_title_visible = true;
                    });
                }
            } else {
                list[i].classList.add('hidden');
            }
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
        // Check if `currencies` object already exists in DB
        fetchDatafromIDB('currencies').then(data => {
            if (typeof data === 'undefined') {
                apiFetchCurrenciesList();
                return;
            }

            const today = new Date().setHours(0, 0, 0, 0);
            const yesterday = data.date_log ? data.date_log : 86400000;

            (yesterday - today === -86400000) ? apiFetchCurrenciesList(): addCurrencyListtoDOM(data.results);
        });

        calculateExchangeRate();

        customEventListeners();

        setTimeout(function() {
            navigator.splashscreen.hide();
        }, 2000);
    }

    function customEventListeners() {
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

        // #base - add listener for click on base currency selection
        base.addEventListener('click', () => {
            currencyListContainer.classList.add('open');

            __this = base;
        });

        // #converted - add listener for click on target currency selection
        converted.addEventListener('click', () => {
            currencyListContainer.classList.add('open');

            __this = converted;
        });

        // #currencies - add listener for click on currency name
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
        backButton.addEventListener('pointerdown', () => {
            document.getElementById('currencies-list').classList.remove('open');
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
            // add vibration on key press for mobile
            navigator.vibrate(40);

            // remove all the list headers
            if (currency_list_title_visible) {
                Array.prototype.forEach.call(currencyList.querySelectorAll('.currency_list_title'), (el) => {
                    el.classList.add('hidden');
                });
            }

            // retrieve current search input value
            const currentValue = searchField.value;
            const root = document.querySelector(':root');

            if (event.toElement.className !== "keyboard__row") {
                // shift case toggle from lower to upper and vise-versa
                if (event.toElement.dataset.key === 'shift') {
                    const shiftCase = getComputedStyle(root).getPropertyValue('--text-case');
                    (shiftCase === "lowercase") ? root.style.setProperty('--text-case', 'uppercase'): root.style.setProperty('--text-case', 'lowercase');
                }

                // set value of the search filter input field
                searchField.value = event.toElement.dataset.key === 'delete' ? currentValue.slice(0, -1) : currentValue + event.toElement.innerText;

                searchFilter();
            }
        });

        // #long-press - detect long press on the alpha keys
        document.addEventListener('long-press', el => {
            navigator.vibrate(80);

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
        });

        // #baseCurrencyWrapper - add listener for pointerdown on touch area for keypad trigger
        baseCurrencyWrapper.addEventListener('pointerdown', event => {
            if (event.target.id.match('base-currency-wrapper') || event.target.id.match('convert-from')) {
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
            }
        });

        // #inputField - allow numbers and decimal point only, applicable to desktop
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
            if ((key !== 190 || this.value.indexOf('.') !== -1) &&
                (key !== 110 || this.value.indexOf('.') !== -1) &&
                ((key < 48 && key !== 8) ||
                    (key > 57 && key < 96) ||
                    key > 105)) e.preventDefault();

            changeFontSize(inputField);
        });

        // #inputField - show or hide cursor when inputField focus()
        inputField.addEventListener('focus', () => {
            hideNativeKeyboard(inputField);
        })

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
            }, 500);
        });

        // #numberKeyPad - add listener for pointerdown on keypad keys
        numberKeyPad.addEventListener('pointerdown', event => {
            // add vibration on key press for mobile
            navigator.vibrate(40);

            // actions to take during conversion process
            if (event.target.childNodes["0"].dataset.value === 'convert') {
                return;
            }

            // retrieve current input value

            const currentValue = inputField.value;

            if (currentValue.length > 9) {
                navigator.vibrate([50, 80, 100]);
                toast("Maximum number of digits (10) exceeded");
            } else {
                // disable decimal point key
                if (event.target.childNodes["0"].dataset.value === '.') {
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

                hideNativeKeyboard(inputField);

                changeFontSize(inputField);
            }
        });

        // #convertTrigger - add listener for pointerdown on the `do-conversion` key
        convertTrigger.addEventListener('pointerdown', () => {
            //hide keypad
            keypad.classList.remove('slideInUp');

            // restore input to original position
            inputWrapper.classList.remove('moveUp');

            //do the conversion calculation
            calculateExchangeRate();
        });
    }

    // Fetch currencies from API url
    function apiFetchCurrenciesList() {
        fetch(currenciesAPI_URL, {
                cache: 'default',
            })
            .then(response => response.json())
            .then(data => {
                data.date_log = new Date().setHours(0, 0, 0, 0);

                // Save currency list to IndexedDB for offline access
                saveCurrenciesListtoIDB('currencies', data);

                addCurrencyListtoDOM(data.results);
            })
            .catch(error => {
                console.error(
                    `The following error occurred while fetching the list of currencies. ${error}`
                );
                fetchDatafromIDB('currencies').then(currencies => {
                    if (typeof currencies === 'undefined') {
                        toast("You\'re offline - some features are unavailable.");
                    } else {
                        addCurrencyListtoDOM(currencies);
                    }
                });
            });
    }

    // Fetch currency exchange rates from API url
    function apiFetchExchangeRates(pair1, pair2) {
        const url = `${exchangeRateAPI_URL}?q=${pair1},${pair2}&compact=ultra`;

        fetch(url, {
                cache: 'default',
            })
            .then(response => response.json())
            .then(data => {
                const exchangeRates = Object.values(data);

                // Save currency exchange rate to IndexedDB for when user is offline
                saveCurrencyConversionRatetoIDB(pair1, exchangeRates[0]);
                saveCurrencyConversionRatetoIDB(pair2, exchangeRates[1]);

                calculateExchangeRate();
            })
            .catch(error => {
                console.log(`The following error occurred while getting the conversion rate. ${error}`);
                toast('Rates not available. Connect to internet and try again.')
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

        const amountToConvert = numeral(inputField.value).value();
        const baseCurrency = base.id;
        const targetCurrency = converted.id;
        const currencyExchange = `${baseCurrency}_${targetCurrency}`;
        const currencyExchangePair = `${targetCurrency}_${baseCurrency}`;

        let convertedCurrency = '';

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
                    //if (navigator.onLine) {
                    if (navigator.connection.type !== "none") {
                        apiFetchExchangeRates(currencyExchange, currencyExchangePair);
                    } else {
                        console.log('Rate is not available offline, turn on your data.');
                        toast('Requested rate could not be loaded. Retrying in background');

                        // retry after 10secs
                        const retrial = setTimeout(() => {
                            calculateExchangeRate();
                        }, 10000);

                        document.addEventListener('online', () => {
                            clearTimeout(retrial);
                            calculateExchangeRate();
                        })
                    }
                }
                // state 2 : yes
                else {
                    convertedCurrency = amountToConvert * data;
                    convertCurrencyToField.innerText = numeral(convertedCurrency).format('0,0.00');
                    convertInfo.innerText = `1 ${baseCurrency} = ${targetCurrency} ${data}`;

                    loader.classList.remove('show');
                }
            });
        }
    }

    // initialize app
    document.addEventListener('deviceready', init(), false);

})();