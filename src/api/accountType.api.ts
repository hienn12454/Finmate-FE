import axiosClient from "./axiosClient";

export const accountTypeApi = {
  getAll: () => axiosClient.get("/account-types"),

  getById: (id: number) =>
    axiosClient.get(`/account-types/${id}`),
};
