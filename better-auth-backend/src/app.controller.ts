import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /** Root URL — useful for Render/up checks without affecting other routes. */
  @Get()
  root(): { ok: true; service: string } {
    return { ok: true, service: 'better-auth-backend' };
  }
}
