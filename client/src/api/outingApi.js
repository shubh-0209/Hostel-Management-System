import { mockOutings } from '../mocks/outings';
export const outingApi = {
  getAll: async () => ({ data: mockOutings })
};