import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import OpenIDConnectStrategy from 'passport-openidconnect';
import { env } from './env.js';
import { prisma } from './database.js';
import { logger } from './logger.js';
import type { Role } from '../types/enums.js';

export function configurePassport() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    logger.warn('Google OAuth not configured — skipping passport setup');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'));

          // Check if OAuth account already exists
          let oauthAccount = await prisma.oAuthAccount.findUnique({
            where: { provider_providerAccountId: { provider: 'GOOGLE', providerAccountId: profile.id } },
            include: { user: true },
          });

          if (oauthAccount) {
            return done(null, { userId: oauthAccount.user.id, email: oauthAccount.user.email, role: oauthAccount.user.role as unknown as Role });
          }

          // Check if user with this email exists (link accounts)
          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName || email.split('@')[0],
                avatarUrl: profile.photos?.[0]?.value,
                role: 'CREATOR',
                creatorProfile: { create: { niche: [], languages: ['en'] } },
              },
            });
          }

          await prisma.oAuthAccount.create({
            data: {
              userId: user.id,
              provider: 'GOOGLE',
              providerAccountId: profile.id,
              accessToken: _accessToken,
              refreshToken: _refreshToken ?? null,
            },
          });

          return done(null, { userId: user.id, email: user.email, role: user.role as unknown as Role });
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );

  // ── Microsoft (Azure AD) OAuth Strategy ──
  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET && env.MICROSOFT_CALLBACK_URL) {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: env.MICROSOFT_CLIENT_ID,
          clientSecret: env.MICROSOFT_CLIENT_SECRET,
          callbackURL: env.MICROSOFT_CALLBACK_URL,
          tenant: env.MICROSOFT_TENANT_ID,
          scope: ['user.read'],
        },
        async (accessToken: string, refreshToken: string, profile: { id: string; displayName?: string; emails?: Array<{ value: string }>; photos?: Array<{ value: string }> }, done: (err: Error | null, user?: unknown) => void) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error('No email from Microsoft'));

            let oauthAccount = await prisma.oAuthAccount.findUnique({
              where: { provider_providerAccountId: { provider: 'MICROSOFT', providerAccountId: profile.id } },
              include: { user: true },
            });

            if (oauthAccount) {
              return done(null, { userId: oauthAccount.user.id, email: oauthAccount.user.email, role: oauthAccount.user.role as unknown as Role });
            }

            let user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email,
                  name: profile.displayName || email.split('@')[0],
                  avatarUrl: profile.photos?.[0]?.value,
                  role: 'CREATOR',
                  creatorProfile: { create: { niche: [], languages: ['en'] } },
                },
              });
            }

            await prisma.oAuthAccount.create({
              data: {
                userId: user.id,
                provider: 'MICROSOFT',
                providerAccountId: profile.id,
                accessToken,
                refreshToken: refreshToken ?? null,
              },
            });

            return done(null, { userId: user.id, email: user.email, role: user.role as unknown as Role });
          } catch (err) {
            return done(err as Error);
          }
        },
      ),
    );
    logger.info('Microsoft OAuth strategy configured');
  }

  // ── Okta / Company SSO (OpenID Connect) Strategy ──
  if (env.OKTA_ISSUER && env.OKTA_CLIENT_ID && env.OKTA_CLIENT_SECRET && env.OKTA_CALLBACK_URL) {
    const issuerBase = env.OKTA_ISSUER.replace(/\/$/, '');
    passport.use(
      'okta',
      new OpenIDConnectStrategy(
        {
          issuer: issuerBase,
          authorizationURL: `${issuerBase}/v1/authorize`,
          tokenURL: `${issuerBase}/v1/token`,
          userInfoURL: `${issuerBase}/v1/userinfo`,
          clientID: env.OKTA_CLIENT_ID,
          clientSecret: env.OKTA_CLIENT_SECRET,
          callbackURL: env.OKTA_CALLBACK_URL,
          scope: 'openid profile email',
        },
        async (_issuer: string, profile: { id: string; displayName?: string; emails?: Array<{ value: string }>; photos?: Array<{ value: string }> }, done: (err: Error | null, user?: Express.User | false) => void) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error('No email from Okta'));

            let oauthAccount = await prisma.oAuthAccount.findUnique({
              where: { provider_providerAccountId: { provider: 'OKTA', providerAccountId: profile.id } },
              include: { user: true },
            });

            if (oauthAccount) {
              return done(null, { userId: oauthAccount.user.id, email: oauthAccount.user.email, role: oauthAccount.user.role as unknown as Role });
            }

            let user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email,
                  name: profile.displayName || email.split('@')[0],
                  role: 'CREATOR',
                  creatorProfile: { create: { niche: [], languages: ['en'] } },
                },
              });
            }

            await prisma.oAuthAccount.create({
              data: {
                userId: user.id,
                provider: 'OKTA',
                providerAccountId: profile.id,
                accessToken: '',
                refreshToken: null,
              },
            });

            return done(null, { userId: user.id, email: user.email, role: user.role as unknown as Role });
          } catch (err) {
            return done(err as Error);
          }
        },
      ),
    );
    logger.info('Okta OIDC strategy configured');
  }

  passport.serializeUser((user: Express.User, done) => done(null, (user as Express.User).userId));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return done(null, false);
      done(null, { userId: user.id, email: user.email, role: user.role as unknown as Role } as Express.User);
    } catch (err) {
      done(err);
    }
  });
}
