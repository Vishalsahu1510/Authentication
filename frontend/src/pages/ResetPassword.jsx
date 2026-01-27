import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Server } from '../main.jsx'
import { AppData } from '../context/AppContext.jsx'

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { setIsAuth, setUser } = AppData();
    const navigate = useNavigate();
    const params = useParams();

    const submitHandler = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post(
                `${Server}/api/v1/reset-password/${params.token}`,
                { password },
                { withCredentials: true }
            );
            toast.success(data.message);
            setPassword("");
            setConfirmPassword("");
            setUser(data.user);
            setIsAuth(true);
            navigate("/");
        } catch (error) {
            toast.error(error.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="text-gray-600 body-font">
            <div className="container px-5 py-24 mx-auto flex flex-wrap items-center">
                <div className="lg:w-3/5 md:w-1/2 md:pr-16 lg:pr-0 pr-0">
                    <h1 className="title-font font-medium text-3xl text-gray-900">
                        Reset Your Password
                    </h1>
                    <p className="leading-relaxed mt-4">
                        Enter your new password below to reset your account password.
                    </p>
                </div>
                <form onSubmit={submitHandler} className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0">
                    <h2 className="text-gray-900 text-lg font-medium title-font mb-5">Reset Password</h2>

                    <div className="relative mb-4">
                        <label htmlFor="password" className="leading-7 text-sm text-gray-600">New Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                        />
                    </div>

                    <div className="relative mb-4">
                        <label htmlFor="confirmPassword" className="leading-7 text-sm text-gray-600">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                        />
                    </div>

                    <button
                        className="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg"
                        disabled={loading}
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>

                    <div className="flex justify-between items-center mt-3">
                        <p className="text-xs text-gray-500">
                            <Link to="/login" className="text-blue-500 hover:text-blue-800">
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </section>
    )
}

export default ResetPassword