import axios from "axios";
const server = "http://localhost:5000";
const api = axios.create({
    baseURL: server,
    withCredentials: true,
}); 

let isRefreshing = false;
let failedQueue = [];

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

api.interceptors.response.use(
    response => response,
    
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 403 && !originalRequest._retry) {
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
                    isRefreshing = false;
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

