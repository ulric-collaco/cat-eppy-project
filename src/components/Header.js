import React, { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { greetings } from '../data/greetings';
import './Header.css';

const Header = () => { 
  const { currentUser } = useContext(UserContext);
  if (!currentUser) return null;
  const message = greetings[currentUser] || `Hi ${currentUser}!`;
  return (
    <header className="site-header">
      <div className="greeting">{message}</div>
    </header>
  );
};

export default Header;
