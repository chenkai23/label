import axios from "axios";

export function request(config: any) {
  const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    timeout: 1000000, // 在某些特殊情况下，可能要设置较长的timeout来保证接口能够顺利调用完成
  });

  // 发送真正的网络请求
  return axiosInstance(config);
}
