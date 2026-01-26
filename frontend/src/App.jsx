import React from 'react'
import { BrowserRouter as Router, Routes, Route, BrowserRouter } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import VerifyOtp from './pages/VerifyOtp.jsx'
import Verify from './pages/Verify.jsx'
import { ToastContainer } from "react-toastify";
import { AppData } from './context/AppContext.jsx'
import Loading from './loading.jsx'


const App = () => {

  const {isAuth, loading} = AppData();
  return (
    <>
      {loading ? <Loading /> : <BrowserRouter>
        <Routes>
          <Route path='/' element={isAuth ? <Home /> : <Login />} />
          <Route path='/login' element={isAuth ? <Home /> : <Login /> } />
          <Route path='/register' element={isAuth ? <Home /> : <Register />} />
          <Route path='/verifyOtp' element={isAuth ? <Home /> : <VerifyOtp />} />
          <Route path='/verify' element={isAuth ? <Home /> : <Verify />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>}
    </>
  )
}

export default App