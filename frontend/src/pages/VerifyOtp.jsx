import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Server } from '../main.jsx';
import { toast } from 'react-toastify';
import { AppData } from '../context/AppContext.jsx';
import ReCAPTCHA from "react-google-recaptcha";

const VerifyOtp = () => {

  const [otp, setOtp] = useState("");
  const [loading, setloading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [captcha, setCaptcha] = useState(false);
  const navigate = useNavigate();
  const { setIsAuth, setUser } = AppData();

  const email = localStorage.getItem("email");

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const resendOtpHandler = async () => {
    try {
      setloading(true);
      const { data } = await axios.post(`${Server}/api/v1/resendOtp`, { email }, { withCredentials: true });
      toast.success(data.message);
      setTimer(60);
      setCanResend(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setloading(false);
    }
  }

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!captcha) {
      return toast.error("Please verify captcha");
    }

    setloading(true);
    // Handle form submission logic here
    try {
      const { data } = await axios.post(`${Server}/api/v1/verify`, { email, otp, captchaToken: captcha }, { withCredentials: true });
      toast.success(data.message);
      setIsAuth(true);
      setUser(data.user);
      localStorage.removeItem("email");
      navigate('/');
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setloading(false);
    }
  }

  function onChange(value) {
    // Store the actual token, not just true/false
    setCaptcha(value);
  }

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto flex flex-wrap items-center">
        <div className="lg:w-3/5 md:w-1/2 md:pr-16 lg:pr-0 pr-0">
          <h1 className="title-font font-medium text-3xl text-gray-900">Slow-carb next level shoindcgoitch ethical authentic, poko scenester</h1>
          <p className="leading-relaxed mt-4">Poke slow-carb mixtape knausgaard, typewriter street art gentrify hammock starladder roathse. Craies vegan tousled etsy austin.</p>
        </div>
        <form onSubmit={submitHandler} className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0">
          <h2 className="text-gray-900 text-lg font-medium title-font mb-5">Verify Otp</h2>

          <div className="relative mb-4">
            <label htmlFor="otp" className="leading-7 text-sm text-gray-600">Otp</label>
            <input type="text" id="otp" name="otp" value={otp} inputMode="numeric" pattern="[0-9]*" autoFocus onChange={(e) => setOtp(e.target.value)} required className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
          </div>
          <ReCAPTCHA sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={onChange} />

          <button className="text-white  bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg disabled:opacity-50" disabled={loading || !captcha}>
            {loading ? "Verifying..." : "Verify"}
          </button>

          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-500">
              <Link to="/login" className="hover:text-indigo-500">Go to Login</Link>
            </p>
            <button
              type="button"
              onClick={resendOtpHandler}
              disabled={!canResend || loading}
              className={`text-xs font-medium ${canResend ? 'text-indigo-600 hover:text-indigo-800' : 'text-gray-400'}`}
            >
              {canResend ? "Resend OTP" : `Resend in ${timer}s`}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default VerifyOtp