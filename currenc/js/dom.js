const header = document.querySelector("header");
const currencyListContainer = document.querySelector("#currencies-list");
const currencyList = document.querySelector("#currencies-list ul");
const loader = document.querySelector(".loader");
const base = document.querySelector(".base__currency__name");
const converted = document.querySelector(".converted__currency__name");
const currencies = document.querySelector(".currencies");
const backButton = document.querySelector(".back__button");
const closeButton = document.querySelector(".close__button");
const searchButton = document.querySelector(".search__button");
const refreshButton = document.querySelector(".refresh__button");
const searchField = document.querySelector(".search__field");
const alphaKeyPadClose = document.querySelector(
	"#search-field-wrapper .back__button"
);
const numberKeyPad = document.querySelector(".number__keypad");
const alphaKeyPad = document.querySelector(".keyboard");
const calculatorScreen = document.querySelector(".entries");
const scala = document.querySelector(".scala");
const search__hide = scala.previousElementSibling;
//search__hide.style.left = "24px";

const switchButton = document.getElementById("switch-button");
const convertCurrencyToField = document.getElementById("converted-to");
const keypad = document.getElementById("keypad");
const alphaPad = document.getElementById("alphapad");
const inputField = document.getElementById("convert-from");
const inputWrapper = document.getElementById("input-wrapper");
const searchWrapper = document.querySelector(".search__wrapper");
const convertTrigger = document.getElementById("do-conversion");
const convertInfo = document.getElementById("conversion-info");
const baseCurrencyWrapper = document.getElementById("base-currency-wrapper");

export {
  alphaPad,
  alphaKeyPad,
  alphaKeyPadClose,
  backButton,
  base,
  baseCurrencyWrapper,
  calculatorScreen,
  closeButton,
  convertCurrencyToField,
  converted,
  convertInfo,
  convertTrigger,
  currencies,
  currencyList,
  currencyListContainer,
  header,
  inputField,
  inputWrapper,
  keypad,
  loader,
  numberKeyPad,
  refreshButton,
  search__hide,
  searchButton,
  searchField,
  searchWrapper,
  switchButton
};