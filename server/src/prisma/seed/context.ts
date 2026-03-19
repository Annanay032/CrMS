import { PrismaClient } from '@prisma/client';

export interface SeedContext {
  prisma: PrismaClient;
  users: {
    admin: { id: string };
    creator1: { id: string };
    creator2: { id: string };
    creator3: { id: string };
    testUser: { id: string };
    brand1: { id: string };
    brand2: { id: string };
    agencyUser: { id: string };
  };
  profiles: {
    cp1: { id: string };
    cp2: { id: string };
    cp3: { id: string };
    cpTest: { id: string };
    bp1: { id: string };
    bp2: { id: string };
    ap1: { id: string };
  };
}

export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export function futureDate(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

export function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
