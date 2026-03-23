import axios from 'axios'
import { APIURL } from '@/constaint'

const baseURL = process.env.VUE_APP_API_BASE_URL || APIURL

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default apiClient
