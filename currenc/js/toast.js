/* (exports => {
    'use strict';

    const toastContainer = document.querySelector('.toast__container');
    let last_message;

    //To show notification
    function toast(msg, options) {
        if (!msg) return;

        // prevent displaying more than one instance of same message
        if (last_message && last_message === msg) return;

        options = options || 3000;

        const toastMsg = document.createElement('div');

        toastMsg.className = 'toast__msg';
        last_message = toastMsg.textContent = msg;

        toastContainer.appendChild(toastMsg);

        //Show toast for 3secs and hide it
        setTimeout(_ => {
            toastMsg.classList.add('toast__msg--hide');
            last_message = undefined;
        }, options);

        //Remove the element after hiding
        toastMsg.addEventListener('transitionend', event => {
            event.target.parentNode.removeChild(event.target);
        });
    }

    exports.toast = toast; //Make this method available in global
})(typeof window === 'undefined' ? module.exports : window); */

const toastContainer = document.querySelector(".toast__container");
let last_message;

//To show notification
const toast = (msg, options) => {
	if (!msg) return;

	// prevent displaying more than one instance of same message
	if (last_message && last_message === msg) return;

	options = options || 3000;

	const toastMsg = document.createElement("div");

	toastMsg.className = "toast__msg";
	last_message = toastMsg.textContent = msg;

	toastContainer.appendChild(toastMsg);

	//Show toast for 3secs and hide it
	setTimeout((_) => {
		toastMsg.classList.add("toast__msg--hide");
		last_message = undefined;
	}, options);

	//Remove the element after hiding
	toastMsg.addEventListener("transitionend", (event) => {
		event.target.parentNode.removeChild(event.target);
	});
};

export default toast;