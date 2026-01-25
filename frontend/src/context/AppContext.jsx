import { createContext, useContext, useEffect, useState } from "react";
import api from "../apiIntercepter";

export const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);
    
    async function fetchUser() {
        setLoading(true);
        try {
            const {data} = await api.get(`api/v1/me`);
            setUser(data.user);
            setIsAuth(true);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AppContext.Provider value={{ user, setUser, isAuth, setIsAuth, fetchUser, loading }}>
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