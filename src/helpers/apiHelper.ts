/**
 * Helper to extract error message from Axios Error safely
 */
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return 'Xảy ra lỗi kết nối!'
}

/**
 * Construct query string from Object
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams()
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      query.append(key, String(params[key]))
    }
  }
  const stringified = query.toString()
  return stringified ? `?${stringified}` : ''
}
