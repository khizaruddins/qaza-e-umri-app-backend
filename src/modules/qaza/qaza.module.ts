import { Module } from '@nestjs/common';
import { QazaController } from './controllers/qaza.controller';
import { QazaService } from './services/qaza.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [QazaController],
  providers: [QazaService],
  exports: [QazaService],
})
export class QazaModule {}
