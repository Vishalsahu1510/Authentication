import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { Server } from '../main';
import Loading from '../loading';

const Verify = () => {
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const params = useParams();

  async function verifyUser() {
    try {
      const { data } = await axios.post(`${Server}/api/v1/verify/${params.token}`);
      setSuccessMessage(data.message);
    } catch (error) {
      setErrorMessage(error.response.data.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    verifyUser();
  }, []);

  return (
    <>
      {loading ? <Loading /> : (
        <>
          <div className=' w-[200px] m-auto mt-12 '>
            {successMessage && <p className='text-green-500 text-2xl'>{successMessage}</p>}
            {errorMessage && <p className='text-red-500 text-2xl'>{errorMessage}</p>}
          </div>
          <button onClick={() => navigate('/login')}>Login</button>
        </>
      )}
    </>
  )
}

export default Verify