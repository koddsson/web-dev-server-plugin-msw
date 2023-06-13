export const rest = {
  get: (endpoint, handler) => {
    return { method: 'get', endpoint, handler };
  },
  post: (endpoint, handler) => {
    return { method: 'post', endpoint, handler };
  },
  put: (endpoint, handler) => {
    return { method: 'put', endpoint, handler };
  },
  patch: (endpoint, handler) => {
    return { method: 'patch', endpoint, handler };
  },
  delete: (endpoint, handler) => {
    return { method: 'delete', endpoint, handler };
  },
  options: (endpoint, handler) => {
    return { method: 'options', endpoint, handler };
  }
}