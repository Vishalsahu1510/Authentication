import React, { useEffect, useState } from 'react'
import api  from '../apiIntercepter';
import { toast } from 'react-toastify';
const Dashboard = () => {
    const [content, setContent] = useState('');
    async function fetchAdminData() {
        try {
            const { data } = await api.get(`/api/v1/admin`,{
                withCredentials:true,
            });
            setContent(data.message);
        } catch (error) {
            toast.error(error.response.data.message);
        }
    }
    useEffect(() => {
        fetchAdminData();
    }, []);
    return <>
    {
        content && <p>Admin Data: {content}</p>
    }
    </>
}

export default Dashboard;