import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserDataContext } from '../Context/UserContext';

function ProtectedWrapper({ children }) {
  const token = localStorage.getItem('usertoken');
  const [loading, setLoading] = useState(true);
  const { user, setUser } = useContext(UserDataContext); // Correctly destructuring the context
  const nav = useNavigate();

  useEffect(() => {
    if (!token) {
      nav('/login');
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BASE_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setUser(response.data?.user);
          console.log(response.data?.user);
          setLoading(false);
        }
      })
      .catch((err) => {
        localStorage.removeItem('usertoken');
        nav('/login');
        console.log(err);
      });
  }, [token, nav, setUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}

export default ProtectedWrapper;