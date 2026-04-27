import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /** Root URL — Render (and similar) health checks expect a simple response. */
  @Get()
  root(): boolean {
    return true;
  }
}
