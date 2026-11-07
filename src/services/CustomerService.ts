import { apiClient } from '@/lib/api/ApiClient';

export const CustomerService = {
  list() {
    return apiClient.get('/customers');
  },
  get(id: string | number) {
    return apiClient.get(`/customers/${id}`);
  },
  create(data: any) {
    return apiClient.post('/customers', data);
  },
  update(id: string | number, data: any) {
    return apiClient.put(`/customers/${id}`, data);
  },
  remove(id: string | number) {
    return apiClient.delete(`/customers/${id}`);
  },
};
