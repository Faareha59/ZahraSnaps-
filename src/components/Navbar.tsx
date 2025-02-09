import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Camera, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-pink-500" />
            <span className="text-xl font-bold text-gray-800">Zahra's Gallery</span>
          </Link>

          <div className="flex space-x-4">
            <NavLink to="/gallery" icon={Camera}>
              Gallery
            </NavLink>
            {user ? (
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-1 px-4 py-2 rounded-full text-gray-600 hover:text-pink-500 transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Logout</span>
              </button>
            ) : (
              <NavLink to="/login" icon={User}>
                Login
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="relative">
      <div className="flex items-center space-x-1 px-4 py-2 rounded-full text-gray-600 hover:text-pink-500 transition-colors">
        <Icon className="w-5 h-5" />
        <span>{children}</span>
      </div>
      {isActive && (
        <motion.div
          layoutId="navbar-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500"
          initial={false}
        />
      )}
    </Link>
  );
};

export default Navbar;