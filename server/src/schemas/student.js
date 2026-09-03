import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
    jntu_number: z.string().min(10, "Invalid JNTU number").max(20).optional(),
    department: z.string().min(2).max(100).optional(),
    academic_year: z.number().int().min(1).max(4).optional(),
    phone: z.string().min(10, "Invalid phone number").max(15).optional(),
    parent_phone: z.string().min(10, "Invalid parent phone number").max(15).optional(),
    address: z.string().max(500).optional()
  })
});

export const allocateBedSchema = z.object({
  body: z.object({
    bed_id: z.string().uuid("Invalid bed ID")
  })
});

export const createOutingSchema = z.object({
  body: z.object({
    out_datetime: z.string().datetime("Invalid out_datetime"),
    in_datetime: z.string().datetime("Invalid in_datetime"),
    reason: z.string().min(5, "Reason is too short").max(500)
  }).refine((data) => {
    const outDate = new Date(data.out_datetime);
    const inDate = new Date(data.in_datetime);
    return inDate > outDate;
  }, {
    message: "Return time (in_datetime) must be after out time (out_datetime)",
    path: ["in_datetime"]
  })
});
