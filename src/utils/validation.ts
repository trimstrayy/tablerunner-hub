// Simple validation utilities for TableRunner Hub

export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  if (!email || email.trim() === '') {
    return { isValid: false, message: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

export const validateNepaliPhoneNumber = (phone: string): { isValid: boolean; message?: string } => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, message: 'Contact number is required' };
  }
  
  // Remove any spaces, dashes, or other characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check if it's exactly 10 digits
  const nepaliPhoneRegex = /^[0-9]{10}$/;
  
  if (!nepaliPhoneRegex.test(cleanPhone)) {
    return { isValid: false, message: 'Please enter a valid 10-digit Nepali phone number' };
  }
  
  // Check if it starts with valid Nepali mobile prefixes
  const validPrefixes = ['98', '97', '96', '95', '94', '93', '92', '91', '90', '85', '84', '83', '82', '81', '80'];
  const firstTwoDigits = cleanPhone.substring(0, 2);
  
  if (!validPrefixes.includes(firstTwoDigits)) {
    return { isValid: false, message: 'Please enter a valid Nepali mobile number (must start with 98, 97, 96, etc.)' };
  }
  
  return { isValid: true };
};

export const validateFullName = (name: string): { isValid: boolean; message?: string } => {
  if (!name || name.trim() === '') {
    return { isValid: false, message: 'Full name is required' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, message: 'Full name must be at least 2 characters long' };
  }
  
  if (trimmedName.length > 100) {
    return { isValid: false, message: 'Full name must be less than 100 characters' };
  }
  
  // Check if name contains only letters, spaces, and common name characters
  const nameRegex = /^[a-zA-Z\s\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0E00-\u0E7F\u0F00-\u0FFF.-]+$/;
  
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, dots, and hyphens' };
  }
  
  return { isValid: true };
};

export const validateProfilePhotoUrl = (url: string): { isValid: boolean; message?: string } => {
  // Profile photo is optional
  if (!url || url.trim() === '') {
    return { isValid: true };
  }
  
  try {
    new URL(url);
    
    // Check if it's a valid image URL (basic check)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const isImageUrl = imageExtensions.some(ext => 
      url.toLowerCase().includes(ext) || 
      url.includes('imgur.com') || 
      url.includes('cloudinary.com') ||
      url.includes('amazonaws.com') ||
      url.includes('googleusercontent.com')
    );
    
    if (!isImageUrl) {
      return { isValid: false, message: 'Please enter a valid image URL (jpg, png, gif, webp, or from image hosting services)' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, message: 'Please enter a valid URL' };
  }
};

export const validateHotelName = (name: string): { isValid: boolean; message?: string } => {
  if (!name || name.trim() === '') {
    return { isValid: false, message: 'Hotel name is required' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, message: 'Hotel name must be at least 2 characters long' };
  }
  
  if (trimmedName.length > 100) {
    return { isValid: false, message: 'Hotel name must be less than 100 characters' };
  }
  
  return { isValid: true };
};

export const validateHotelLocation = (location: string): { isValid: boolean; message?: string } => {
  if (!location || location.trim() === '') {
    return { isValid: false, message: 'Hotel location is required' };
  }
  
  const trimmedLocation = location.trim();
  
  if (trimmedLocation.length < 2) {
    return { isValid: false, message: 'Hotel location must be at least 2 characters long' };
  }
  
  if (trimmedLocation.length > 200) {
    return { isValid: false, message: 'Hotel location must be less than 200 characters' };
  }
  
  return { isValid: true };
};

// Helper function to format phone number for display
export const formatNepaliPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (cleanPhone.length === 10) {
    return `${cleanPhone.substring(0, 3)}-${cleanPhone.substring(3, 6)}-${cleanPhone.substring(6)}`;
  }
  return phone;
};