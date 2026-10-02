import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service.js';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getHello(): string {
    return this.appService.getHello();
  }
}
