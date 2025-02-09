import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Folder, Image, Film, Plus, Trash2, Heart, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, supabaseOperation } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface MediaItem {
  id: string;
  url: string;
  media_type: 'image' | 'video';
}

const Gallery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [media, setMedia] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([fetchMedia(), fetchFolders()]);
      } catch (err) {
        setError('Failed to load gallery data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, currentFolder, navigate]);

  const fetchMedia = async () => {
    if (!user) return;
    try {
      let query = supabase
        .from('photos')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false });

      if (currentFolder) {
        query = query.eq('folder_id', currentFolder);
      } else {
        query = query.filter('folder_id', 'is', null);
      }

      const data = await supabaseOperation(
        () => query,
        'Error fetching media'
      );
      setMedia(data);
    } catch (error) {
      console.error('Error fetching media:', error);
      throw error;
    }
  };

  const fetchFolders = async () => {
    if (!user) return;
    try {
      const data = await supabaseOperation(
        () => supabase
          .from('folders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        'Error fetching folders'
      );
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      if (!user) {
        navigate('/login');
      }
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    
    if (file.size > maxSize) {
      alert(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percent));
          },
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('photos').insert([
        {
          url: data.path,
          folder_id: currentFolder,
          uploaded_by: user.id,
          media_type: isVideo ? 'video' : 'image'
        },
      ]);

      if (dbError) throw dbError;

      fetchMedia();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setIsMobileMenuOpen(false);
    }
  };

  const createFolder = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const name = prompt('Enter folder name:');
    if (!name) return;

    try {
      const { error } = await supabase.from('folders').insert([
        {
          name,
          user_id: user.id,
        },
      ]);

      if (error) throw error;
      fetchFolders();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Error creating folder');
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this folder and all its contents?')) return;

    try {
      const { error: photosError } = await supabase
        .from('photos')
        .delete()
        .eq('folder_id', folderId);

      if (photosError) throw photosError;

      const { error: folderError } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (folderError) throw folderError;

      fetchFolders();
      if (currentFolder === folderId) {
        setCurrentFolder(null);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Error deleting folder');
    }
  };

  const deleteMedia = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from propagating to parent
    if (!user || isDeletingMedia) return;
    if (!confirm('Are you sure you want to delete this media item?')) return;

    setIsDeletingMedia(true);
    try {
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([item.url]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', item.id);

      if (dbError) throw dbError;

      setSelectedMedia(null); // Close modal if open
      await fetchMedia();
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Error deleting media');
    } finally {
      setIsDeletingMedia(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    show: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.4
      }
    }
  };

  const folderVariants = {
    hover: { 
      scale: 1.05,
      rotate: [-1, 1, -1, 0],
      transition: {
        rotate: {
          repeat: Infinity,
          duration: 2
        }
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Please log in to view your gallery</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition-colors"
          >
            Log In
          </button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading your gallery...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 p-6 rounded-lg max-w-md w-full text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      {/* Mobile Menu Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed bottom-8 right-8 z-50 bg-pink-500 text-white p-4 rounded-full shadow-lg hover:bg-pink-600 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="md:hidden fixed bottom-24 right-8 z-50 bg-white rounded-lg shadow-xl p-4 space-y-4"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={createFolder}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-pink-500 text-white rounded-full"
            >
              <Folder className="w-5 h-5" />
              <span>New Folder</span>
            </motion.button>
            
            <motion.label 
              whileTap={{ scale: 0.95 }}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 ${
                isUploading ? 'bg-gray-400' : 'bg-teal-500'
              } text-white rounded-full relative`}
            >
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0"
                capture="environment"
              />
              <Upload className="w-5 h-5" />
              <span>{isUploading ? 'Uploading...' : 'Upload Media'}</span>
            </motion.label>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold text-gray-800">
          {currentFolder ? 'Folder Contents' : 'My Gallery'}
        </h1>
        <div className="hidden md:flex flex-wrap gap-4 justify-center md:justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createFolder}
            className="flex items-center space-x-2 px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
          >
            <Folder className="w-5 h-5" />
            <span>New Folder</span>
          </motion.button>
          
          <motion.label 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center space-x-2 px-4 py-2 ${
              isUploading ? 'bg-gray-400' : 'bg-teal-500 hover:bg-teal-600'
            } text-white rounded-full transition-colors cursor-pointer relative`}
          >
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              capture="environment"
            />
            <Upload className="w-5 h-5" />
            <span>{isUploading ? 'Uploading...' : 'Upload Media'}</span>
            {uploadProgress > 0 && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                className="absolute bottom-0 left-0 h-1 bg-white rounded-full"
              />
            )}
          </motion.label>
        </div>
      </motion.div>

      {!currentFolder && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"
        >
          {folders.map((folder) => (
            <motion.div
              key={folder.id}
              variants={itemVariants}
              whileHover="hover"
              className="relative group bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <motion.button
                variants={folderVariants}
                onClick={() => setCurrentFolder(folder.id)}
                className="w-full text-center"
                onHoverStart={() => setHoveredItem(folder.id)}
                onHoverEnd={() => setHoveredItem(null)}
              >
                <motion.div
                  animate={hoveredItem === folder.id ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, -10, 10, 0],
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Folder className="w-12 h-12 text-pink-500 mx-auto mb-2" />
                </motion.div>
                <p className="text-gray-800 font-medium truncate">{folder.name}</p>
              </motion.button>
              <motion.button
                initial={{ opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                animate={{ opacity: hoveredItem === folder.id ? 1 : 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFolder(folder.id);
                }}
                className="absolute top-2 right-2 p-1 bg-red-100 rounded-full"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <AnimatePresence>
          {media.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              layout
              whileHover={{ scale: 1.02 }}
              className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer touch-manipulation"
              onHoverStart={() => setHoveredItem(item.id)}
              onHoverEnd={() => setHoveredItem(null)}
              onClick={() => setSelectedMedia(item)}
            >
              {item.media_type === 'video' ? (
                <video
                  src={`${supabase.storage.from('photos').getPublicUrl(item.url).data.publicUrl}`}
                  className="w-full h-full object-cover"
                  playsInline
                />
              ) : (
                <img
                  src={`${supabase.storage.from('photos').getPublicUrl(item.url).data.publicUrl}`}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: hoveredItem === item.id ? 1 : 0 }}
                className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
              />
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: hoveredItem === item.id ? 1 : 0,
                  scale: hoveredItem === item.id ? 1 : 0.8
                }}
                whileHover={{ scale: 1.1 }}
                onClick={(e) => deleteMedia(item, e)}
                className="absolute top-2 right-2 p-2 bg-red-500 rounded-full z-10"
                disabled={isDeletingMedia}
              >
                <Trash2 className="w-4 h-4 text-white" />
              </motion.button>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: hoveredItem === item.id ? 1 : 0,
                  y: hoveredItem === item.id ? 0 : 20
                }}
                className="absolute bottom-2 left-2"
              >
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 touch-none"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.button
              className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50 hover:bg-black/70 z-20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedMedia(null)}
            >
              <X className="w-6 h-6" />
            </motion.button>
            <motion.div 
              className="relative max-w-7xl w-full max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.media_type === 'video' ? (
                <video
                  src={`${supabase.storage.from('photos').getPublicUrl(selectedMedia.url).data.publicUrl}`}
                  className="max-w-full max-h-[90vh] rounded-lg"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  src={`${supabase.storage.from('photos').getPublicUrl(selectedMedia.url).data.publicUrl}`}
                  alt=""
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
              )}
              <motion.button
                className="absolute top-4 right-4 p-2 bg-red-500 rounded-full"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => deleteMedia(selectedMedia, e)}
                disabled={isDeletingMedia}
              >
                <Trash2 className="w-4 h-4 text-white" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentFolder && (
        <motion.button
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: -180 }}
          onClick={() => setCurrentFolder(null)}
          className="fixed bottom-8 right-8 bg-pink-500 text-white p-4 rounded-full shadow-lg hover:bg-pink-600 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}
    </motion.div>
  );
};

export default Gallery;