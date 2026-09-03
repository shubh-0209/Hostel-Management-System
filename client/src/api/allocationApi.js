import { mockAllocations } from '../mocks/allocations';
export const allocationApi = {
  getAllocations: async () => ({ data: mockAllocations })
};