import React from "react";
import { motion } from "framer-motion";

const SuccessPopup = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-lg text-center w-80"
      >
        {/* Animation Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-green-500 text-5xl mb-3"
        >
          ✅
        </motion.div>

        <h2 className="text-lg font-semibold">{message}</h2>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          OK
        </button>
      </motion.div>
    </div>
  );
};

export default SuccessPopup;