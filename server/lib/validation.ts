import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is too short"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  restaurantName: z.string().trim().min(2, "Restaurant name is too short"),
  businessType: z.string().trim().min(1, "Select a business type"),
  city: z.string().trim().min(1, "City is required"),
  phone: z.string().trim().min(6, "Enter a valid phone number"),
  gstin: z.string().trim().optional().default(""),
  plan: z.enum(["Basic", "Standard", "Premium"]).default("Standard"),
  billingCycle: z.enum(["Monthly", "Annual"]).default("Monthly"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  category: z.string().trim().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  gst: z.coerce.number().min(0).default(5),
  foodType: z.enum(["Veg", "Non-Veg"]).default("Veg"),
  available: z.coerce.boolean().default(true),
});

export const menuItemUpdateSchema = menuItemSchema.partial();

const orderLineInput = z.object({
  menuItemId: z.string().optional(),
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  gst: z.coerce.number().min(0),
  qty: z.coerce.number().min(1),
});

export const orderSchema = z.object({
  tableOrNo: z.string().trim().optional().default(""),
  customerName: z.string().trim().optional().default("Walk-in"),
  items: z.array(orderLineInput).min(1, "Add at least one item"),
  mode: z.enum(["Cash", "UPI", "Card"]).default("Cash"),
  status: z.enum(["Paid", "Pending", "Refunded"]).default("Paid"),
  notes: z.string().trim().optional().default(""),
  createdAt: z.string().trim().optional(),
});

export const orderUpdateSchema = z.object({
  status: z.enum(["Paid", "Pending", "Refunded"]),
});

export const stockEntrySchema = z.object({
  item: z.string().trim().min(1, "Select an item"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().trim().min(1, "Unit is required"),
  supplier: z.string().trim().optional().default(""),
  cost: z.coerce.number().min(0).default(0),
});

export const expenseSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  category: z.enum(["Raw Materials", "Fuel", "Payroll", "Utilities", "Operations", "Maintenance", "Other"]),
  paymentMode: z.enum(["Cash", "UPI", "Card", "Online", "Bank Transfer"]).default("Cash"),
  hasBill: z.coerce.boolean().default(false),
  billUrl: z.string().trim().optional().default(""),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  createdAt: z.string().trim().optional(),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(6, "Enter a valid phone number"),
  totalVisits: z.coerce.number().min(0).default(0),
  totalSpent: z.coerce.number().min(0).default(0),
});

const optionalEmail = z.union([z.string().trim().email("Enter a valid email"), z.literal("")]);

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Restaurant name is required").optional(),
    ownerName: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: optionalEmail.optional(),
    gstin: z.string().trim().optional(),
    fssai: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    address: z.string().trim().optional(),
    logoUrl: z.string().trim().optional(),
    gstEnabled: z.boolean().optional(),
    cgst: z.coerce.number().min(0).optional(),
    sgst: z.coerce.number().min(0).optional(),
    igst: z.coerce.number().min(0).optional(),
    gstInclusive: z.boolean().optional(),
    invoicePrefix: z.string().trim().optional(),
    invoiceStartNumber: z.coerce.number().int().min(1, "Starting number must be at least 1").optional(),
    invoiceFooterText: z.string().trim().optional(),
    invoiceTerms: z.string().trim().optional(),
    showLogoOnInvoice: z.boolean().optional(),
    digitalSignature: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});
