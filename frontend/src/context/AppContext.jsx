import { createContext, useContext, useEffect, useState } from "react";
import api from "../apiIntercepter";
import { toast } from "react-toastify";

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    async function fetchUser() {
        setLoading(true);
        try {
            const { data } = await api.get(`api/v1/me`);
            setUser(data);  
            setIsAuth(true);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    async function logoutUser(navigate) {
        try {
            const { data } = await api.post(`api/v1/logout`);
            toast.success(data.message);
            setUser(null);
            setIsAuth(false);
            navigate('/login');
        } catch (error) {
            toast.error(error.response.data.message);
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AppContext.Provider value={{ user, setUser, isAuth, setIsAuth, fetchUser, loading, logoutUser }}>
            {children}
        </AppContext.Provider>
    );
};

export const AppData = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("AppData must be used within AppProvider");
    }
    return context;
};