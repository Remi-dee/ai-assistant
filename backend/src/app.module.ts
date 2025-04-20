import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenaiService } from './openai/openai.service';
import { OpenaiController } from './openai/openai.controller';
import { OpenaiModule } from './openai/openai.module';

@Module({
  imports: [OpenaiModule],
  controllers: [AppController, OpenaiController],
  providers: [AppService, OpenaiService],
})
export class AppModule {}
