import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StandupController } from './standup.controller';
import { StandupService } from './standup.service';

@Module({
  controllers: [StandupController],
  providers: [StandupService, PrismaService],
})
export class StandupModule {}
