import axios from "axios";
const server = "http://localhost:5000";

const getCookie = (name) =>{
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const api = axios.create({
    baseURL: server,
    withCredentials: true,
}); 

api.interceptors.request.use(
    (config) => {
        if (
            config.method === "post" || 
            config.method === "put" || 
            config.method === "delete" || 
            config.method === "patch"
        ){
            const csrfToken = getCookie("csrfToken");
            if (csrfToken){
                config.headers["x-csrf-token"] = csrfToken;
            }
        }
        return config;
    
}, 
(error) => {
    return Promise.reject(error);
}
);


let isRefreshing = false;
let isRefreshingCSRFToken = false;
let failedQueue = [];
let csrfFailedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (token) {
            prom.resolve(token);
        } else {
            prom.reject(error);
        }
    });
    failedQueue = [];
};

const processCSRFQueue = (error, token = null) => {
    csrfFailedQueue.forEach(prom => {
        if (token) {
            prom.resolve(token);
        } else {
            prom.reject(error);
        }
    });
    csrfFailedQueue = [];
};

api.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response.status === 403 && !originalRequest._retry) {
            const errorCode = error.response.data?.code || "";

            if (errorCode.startsWith("CSRF_")){
                if(isRefreshingCSRFToken){
                    return new Promise((resolve, reject) => {
                        csrfFailedQueue.push({ resolve, reject });
                    }).then(() => {
                        return api(originalRequest);
                    }).catch(err => {
                        return Promise.reject(err);
                    });
                }
                originalRequest._retry = true;
                isRefreshingCSRFToken = true;
                try{
                    await api.post("/api/v1/refresh-csrf");
                    processCSRFQueue(null);
                    return api(originalRequest);
                } catch(error){
                    processCSRFQueue(error);
                    console.error("failed to refresh csrf token",error);
                    return Promise.reject(error);
                } finally{
                    isRefreshingCSRFToken = false;
                }
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;
            try{
                await api.post("/api/v1/refresh");
                    processQueue(null);
                    return api(originalRequest);
            } catch(error){
                 processQueue(error);
                 return Promise.reject(error);
            } finally{
                isRefreshing = false;
            }
            
        }
        return Promise.reject(error);
    }
);

export default api;


// “We use Axios interceptors to catch 403 errors.
// When access token expires, we call refresh token API.
// To avoid multiple refresh calls, we use a refresh lock and queue system.
// Once token is refreshed, all pending requests are retried automatically.”

