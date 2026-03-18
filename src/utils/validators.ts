/**
 * Generic Validation Utility Functions
 */

export const isEmailValid = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const isPhoneNumberValid = (phone: string): boolean => {
  // Simple Vietnamese phone number validation (10 digits starting with 0)
  const re = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g
  return re.test(phone)
}

export const isPasswordStrong = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/
  return re.test(password)
}
