import { z } from "zod";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

export enum CourseStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum RiasecCode {
  R = "R",
  I = "I",
  A = "A",
  S = "S",
  E = "E",
  C = "C",
}

export const uzPhoneSchema = z
  .string()
  .regex(/^\+998\d{9}$/, "Telefon raqam +998XXXXXXXXX formatida bo‘lishi kerak");

export const passwordSchema = z
  .string()
  .min(8, "Parol kamida 8 ta belgidan iborat bo‘lishi kerak")
  .regex(/[A-Z]/, "Kamida bitta katta harf bo‘lishi kerak")
  .regex(/[0-9]/, "Kamida bitta raqam bo‘lishi kerak");

export const registerSchema = z.object({
  role: z.enum([UserRole.STUDENT, UserRole.TEACHER]),
  firstName: z.string().min(2, "Ism kamida 2 ta harf bo‘lishi kerak"),
  lastName: z.string().min(2, "Familiya kamida 2 ta harf bo‘lishi kerak"),
  middleName: z.string().optional(),
  birthDate: z.string().min(4, "Tug‘ilgan sana majburiy"),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: uzPhoneSchema,
  email: z.string().email("Noto‘g‘ri elektron pochta manzili"),
  password: passwordSchema,
  schoolId: z.string().min(1, "Maktabni tanlang"),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Foydalanish shartlariga rozilik majburiy" }),
  }),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: "Shaxsiy ma’lumotlarni qayta ishlashga rozilik majburiy" }),
  }),
  // Student fields
  grade: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  interests: z.array(z.string()).optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  // Teacher fields
  subjects: z.array(z.string()).optional(),
  education: z.string().optional(),
  experienceYears: z.number().int().min(0).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email noto‘g‘ri"),
  password: z.string().min(1, "Parolni kiriting"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
