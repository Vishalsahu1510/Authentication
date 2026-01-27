import React from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Server } from '../main.jsx'
import { useState } from 'react'


const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setloading] = useState(false);


  const submitHandler = async (e) => {
    e.preventDefault();
    setloading(true);
    try {
      const data = await axios.post(`${Server}/api/v1/forgot-password`, { email }, { withCredentials: true });
      toast.success(data.data.message);
      setEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setloading(false);
    }
  }
  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto flex flex-wrap items-center">
        <div className="lg:w-3/5 md:w-1/2 md:pr-16 lg:pr-0 pr-0">
          <h1 className="title-font font-medium text-3xl text-gray-900">Slow-carb next level shoindcgoitch ethical authentic, poko scenester</h1>
          {/* <p className="leading-relaxed mt-4">Poke slow-carb mixtape knausgaard, typewriter street art gentrify hammock starladder roathse. Craies vegan tousled etsy austin.</p> */}
        </div>
        <form onSubmit={submitHandler} className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0">
          <h2 className="text-gray-900 text-lg font-medium title-font mb-5">Forgot Password</h2>

          <div className="relative mb-4">
            <label htmlFor="email" className="leading-7 text-sm text-gray-600">Email</label>
            <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" />
          </div>
          <button className="text-white  bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg" disabled={loading}>
            {loading ? "submiting..." : "Submit"}
          </button>
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-500">
              <Link to="/login" className='text-blue-500 hover:text-blue-800'>Don't have an account? Login</Link>
            </p>
            {/* <p className="text-xs text-gray-500">
              <Link to="/forgotPassword" className="text-blue-500 hover:text-blue-800">Forgot Password?</Link>
            </p> */}
          </div>
        </form>
      </div>
    </section>
  )
}

export default ForgotPassword