import axios from 'axios'
import { API_URL } from '@/constants'

const baseURL = API_URL

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default apiClient
