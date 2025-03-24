import http from "../http/http";
import { request } from "../http/request";

export const createProject = async (data) => {
  const response = await http.post("/createProject", data);
  return response.data;
};

export const uploadImageGroups = async (data) => {
  const response = await http.post("/uploadImageGroups", data);
  return response.data;
};

export const getImageGroupsInfo = async (data) => {
  const response = await http.post("/getImageGroupsInfo", data);
  return response.data;
};

// export const getImage = async (data) => {
//   const response = await http.get(`/getImage`, data);
//   return response.data;
// };

export const getImage = (params: any) => {
  return request({
    url: "/getImage",
    method: "get",
    params,
    responseType: "arraybuffer", // blob流处理
  });
};
export const exportAnnotations = (params: any) => {
  return request({
    url: "/exportAnnotations",
    method: "get",
    params,
    responseType: "arraybuffer", // blob流处理
  });
};

export const getAllProjects = async () => {
  const response = await http.get(`/getAllProjects`);
  return response.data;
};

export const getProjectInfo = async (data) => {
  const response = await http.get(`/getProjectInfo`, data);
  return response.data;
};

export const manualAnnotations = async (data) => {
  const response = await http.post(`/manualAnnotations`, data);
  return response.data;
};

export const autoAnnotate = async (data) => {
  const response = await http.post(`/autoAnnotate`, data);
  return response.data;
};
export const deleteProject = async (data) => {
  const response = await http.get(`/deleteProject`, data);
  return response.data;
};

export const deleteImageGroup = async (data) => {
  const response = await http.get(`/deleteImageGroup`, data);
  return response.data;
};
