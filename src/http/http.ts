import { request } from "./request";
const http = {
  // auth 为false代表需要请求拦截判断，否则不需要
  get(url: string, params?: any, controller?: any) {
    const config: any = {
      method: "get",
      url: url,
      signal: controller?.signal,
    };
    if (params) {
      config.params = params;
    }

    return request(config)
      .then((res: any) => {
        if (res.status === 200) {
          return res;
        } else {
        }
      })
      .catch((error) => {});
  },
  // data为body体内的请求值，params为post请求链接后以?xxx=xxx形式增添的请求值
  post(url: string, data: any, params?: any, controller?: any) {
    const config: any = {
      method: "post",
      url: url,
      signal: controller?.signal,
    };
    if (data) {
      config.data = data;
    }
    if (params) {
      config.params = params;
    }
    return request(config)
      .then((res: any) => {
        if (res.status === 200) {
          return res;
        } else {
        }
      })
      .catch((error) => {});
  },
  put(url: string, params: any) {
    const config: any = {
      method: "put",
      url: url,
    };
    if (params) {
      config.params = params;
    }
    return request(config);
  },
  delete(url: string, params: any) {
    const config: any = {
      method: "delete",
      url: url,
    };
    if (params) {
      config.params = params;
    }
    return request(config);
  },
};
export default http;
