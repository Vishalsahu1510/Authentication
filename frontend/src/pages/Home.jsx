import React from 'react'
import { AppData } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const {logoutUser} = AppData();
  const navigate = useNavigate();
  return (
    <div className='flex w-[100px] m-auto mt-40'>
      <button className='bg-red-500 text-white px-4 py-2 rounded' onClick={() => logoutUser(navigate)}>Logout</button>
    </div>
  )
}

export default Home