import { toast } from 'react-toastify';

export const showToast = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  info: (message) => toast.info(message),
  warning: (message) => toast.warning(message),
  
  // Custom success for cart/wishlist actions
  addedToCart: (beatTitle, licenseName) => 
    toast.success(`${beatTitle} with ${licenseName} added to cart!`, {
      icon: '🛒'
    }),
  
  addedToWishlist: (beatTitle) => 
    toast.success(`${beatTitle} added to wishlist!`, {
      icon: '❤️'
    }),
  
  removedFromWishlist: (beatTitle) => 
    toast.info(`${beatTitle} removed from wishlist`, {
      icon: '💔'
    }),
  
  loginRequired: () => 
    toast.warning('Please log in to continue', {
      icon: '🔐'
    }),
  
  uploadSuccess: (beatTitle) =>
    toast.success(`${beatTitle} uploaded successfully!`, {
      icon: '🎵'
    }),
  
  deleteSuccess: (beatTitle) =>
    toast.success(`${beatTitle} deleted successfully`, {
      icon: '🗑️'
    })
};