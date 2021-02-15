let headers = {
    username: undefined,
    password: undefined,

    /**
     * Create a cookie
     *
     * @param {object} cname Cookie name
     * @param {object} cvalue Cookie value
     * @param {number} exdays The number of days until the cookie expires
     */
    setCookie: function (cname, cvalue, exdays) {
        let d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        let expires = `expires=${d.toUTCString()}`;
        document.cookie = `${cname}=${cvalue};${expires};path=/`;
    },

    /**
     * Get a cookie
     *
     * @param {object} cname Cookie name
     * @returns {object} Cookie
     */
    getCookie: function (cname) {
        let cookies = document.cookie.split(`;`);
        for (let i in cookies) {
            let cookie = cookies[i];
            let name = cookie.split(`=`)[0];
            let value = cookie.split(`=`)[1];
            if (name.trim() === cname) {
                return value;
            }
        }
    },

    /**
     * Set a cookie to be invalid
     *
     * @param {object} cname Cookie name
     */
    invalidateCookie: function (cname) {
        let cookies = document.cookie.split(`;`);
        for (let i in cookies) {
            let cookie = cookies[i];
            let name = cookie.split(`=`)[0];
            if (name.trim() === cname) {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            }
        }
    }
};
