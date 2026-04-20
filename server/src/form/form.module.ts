import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';

import { FormsController } from './form.controller';
import { FormsService } from './form.service';
import { Form, FormSchema } from './schema/form.schema';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Form.name, schema: FormSchema }]),
    MulterModule.register(),
    // Reuse the centrally-configured JWT module from AuthModule so the
    // secret / expiries come from ENV and stay consistent.
    AuthModule,
  ],
  controllers: [FormsController],
  providers:   [FormsService, JwtAuthGuard],
})
export class FormModule {}
