import type { Response, NextFunction } from 'express';
import * as startpageService from '../services/startpage.service.js';
import type { AuthRequest } from '../types/common.js';

// ─── Page CRUD ──────────────────────────────────────────────

export async function createPage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = await startpageService.createPage(req.user!.userId, req.body);
    res.status(201).json({ data: page });
  } catch (err) { next(err); }
}

export async function getMyPages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const pages = await startpageService.getPagesByUser(req.user!.userId);
    res.json({ data: pages });
  } catch (err) { next(err); }
}

export async function getPage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = await startpageService.getPageById(req.params.id as string);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json({ data: page });
  } catch (err) { next(err); }
}

export async function getPublicPage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = await startpageService.getPageBySlug(req.params.slug as string);
    if (!page || !page.published) return res.status(404).json({ error: 'Page not found' });
    // Track view (fire-and-forget)
    startpageService.trackView(page.id).catch(() => {});
    res.json({ data: page });
  } catch (err) { next(err); }
}

export async function updatePage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = await startpageService.updatePage(req.params.id as string, req.user!.userId, req.body);
    res.json({ data: page });
  } catch (err) { next(err); }
}

export async function deletePage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await startpageService.deletePage(req.params.id as string, req.user!.userId);
    res.json({ message: 'Page deleted' });
  } catch (err) { next(err); }
}

// ─── Links ──────────────────────────────────────────────────

export async function addLink(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const link = await startpageService.addLink(req.params.id as string, req.user!.userId, req.body);
    res.status(201).json({ data: link });
  } catch (err) { next(err); }
}

export async function updateLink(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const link = await startpageService.updateLink(req.params.linkId as string, req.user!.userId, req.body);
    res.json({ data: link });
  } catch (err) { next(err); }
}

export async function deleteLink(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await startpageService.deleteLink(req.params.linkId as string, req.user!.userId);
    res.json({ message: 'Link deleted' });
  } catch (err) { next(err); }
}

export async function reorderLinks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const links = await startpageService.reorderLinks(req.params.id as string, req.user!.userId, req.body.linkIds);
    res.json({ data: links });
  } catch (err) { next(err); }
}

// ─── Click tracking ──────────────────────────────────────────

export async function trackClick(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await startpageService.trackClick(req.params.linkId as string, req.params.pageId as string);
    res.json({ message: 'ok' });
  } catch (err) { next(err); }
}

// ─── Analytics ───────────────────────────────────────────────

export async function getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const analytics = await startpageService.getAnalytics(req.params.id as string, req.user!.userId, days);
    res.json({ data: analytics });
  } catch (err) { next(err); }
}

// ─── Slug check ──────────────────────────────────────────────

export async function checkSlug(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const available = await startpageService.checkSlugAvailable(
      req.query.slug as string,
      req.query.excludePageId as string | undefined,
    );
    res.json({ data: { available } });
  } catch (err) { next(err); }
}
