import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Camera, FolderHeart, Heart, Upload, Image, Film } from 'lucide-react';

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-pink-50 to-white"
    >
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-12 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heart className="w-16 h-16 text-pink-500 mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-gray-800 mb-6">
              Welcome to Zahra's Gallery
            </h1>
          </motion.div>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            A beautiful space to store, organize, and share your precious memories. Create albums, upload photos and videos, and keep your moments safe.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-2xl shadow-lg text-center"
          >
            <Image className="w-12 h-12 text-pink-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Photo Gallery</h3>
            <p className="text-gray-600">
              Organize your photos in beautiful albums with easy navigation
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-2xl shadow-lg text-center"
          >
            <Film className="w-12 h-12 text-teal-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Video Support</h3>
            <p className="text-gray-600">
              Upload and manage your videos alongside your photos
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-2xl shadow-lg text-center"
          >
            <Upload className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Easy Upload</h3>
            <p className="text-gray-600">
              Quickly upload your media with drag and drop support
            </p>
          </motion.div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Link to="/gallery">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-pink-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-pink-600 transition-colors"
            >
              Start Exploring
            </motion.button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2024 Zahra's Gallery. All rights reserved.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;