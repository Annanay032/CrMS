import { PrismaClient } from '@prisma/client';

export interface SeedContext {
  prisma: PrismaClient;
  users: {
    admin: { id: string; name: string };
    creator1: { id: string; name: string };
    creator2: { id: string; name: string };
    creator3: { id: string; name: string };
    testUser: { id: string; name: string };
    brand1: { id: string; name: string };
    brand2: { id: string; name: string };
    agencyUser: { id: string; name: string };
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
