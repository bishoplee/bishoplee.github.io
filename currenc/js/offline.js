(() => {

    let header = document.querySelector('header');

    //After DOM Loaded
    document.addEventListener('DOMContentLoaded', function (event) {
        //On initial load to check connectivity
        if (!navigator.onLine) {
            updateNetworkStatus();
        }

        window.addEventListener('online', updateNetworkStatus, false);
        window.addEventListener('offline', updateNetworkStatus, false);
    });

    //To update network status
    function updateNetworkStatus() {
        if (navigator.onLine) {
            header.classList.remove('app__offline');
        }
        else {
            toast('You are now offline...');
            header.classList.add('app__offline');
        }
    }

})();