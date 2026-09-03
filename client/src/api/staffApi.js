import { mockStaff } from '../mocks/staff';
export const staffApi = {
  getStaff: async () => ({ data: mockStaff })
};