import { mockStudents } from '../mocks/students';
export const studentApi = {
  getStudents: async () => ({ data: mockStudents })
};