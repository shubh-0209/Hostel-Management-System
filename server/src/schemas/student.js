import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^[0-9+\- ]{10,15}$/, "Invalid phone number (10-15 digits)").optional(),
    parent_email: z.string().email("Invalid parent email address").optional()
  }).refine(data => data.phone !== undefined || data.parent_email !== undefined, {
    message: "At least one field (phone or parent_email) must be provided"
  })
});

export const allocateBedSchema = z.object({
  body: z.object({
    bed_id: z.string().uuid("Invalid bed ID")
  })
});

export const createOutingSchema = z.object({
  body: z.discriminatedUnion("application_type", [
    z.object({
      application_type: z.literal("out_pass"),
      out_datetime: z.string().datetime("Invalid out_datetime"),
      in_datetime: z.string().datetime("Invalid in_datetime"),
      reason: z.string().min(5, "Reason is too short").max(500),
      destination: z.string().max(255).optional(),
      contact_info: z.string().max(255).optional()
    }),
    z.object({
      application_type: z.literal("leave"),
      leave_from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
      leave_to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
      leave_type: z.enum(['home_leave', 'medical_leave', 'personal_leave', 'academic_leave', 'other']),
      reason: z.string().min(5, "Reason is too short").max(500),
      destination: z.string().max(255).optional(),
      contact_info: z.string().max(255).optional()
    })
  ]).refine((data) => {
    if (data.application_type === 'out_pass') {
      const outDate = new Date(data.out_datetime);
      const inDate = new Date(data.in_datetime);
      return inDate > outDate;
    } else {
      const fromDate = new Date(data.leave_from_date);
      const toDate = new Date(data.leave_to_date);
      return toDate >= fromDate;
    }
  }, {
    message: "Return time/date must be after or on out time/date",
    path: ["reason"]
  })
});

export const createMaintenanceSchema = z.object({
  body: z.object({
    issue_type: z.string().min(3, "Issue type must be at least 3 characters").max(100),
    description: z.string().min(5, "Description must be at least 5 characters").max(1000),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
  })
});
