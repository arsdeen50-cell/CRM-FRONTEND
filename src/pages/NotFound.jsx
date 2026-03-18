import React from 'react';
import NotFoundImage from '../assets/404.png';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-5 p-6">
      <div className="w-full max-w-md">
        <img src={NotFoundImage} alt="not-found" className="w-full" />
      </div>
      <div>
        <Link to="/" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
         Back to Login
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
