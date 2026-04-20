import { Test, TestingModule } from '@nestjs/testing';

import { FormsController } from './form.controller';
import { FormsService } from './form.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

describe('FormsController', () => {
  let controller: FormsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormsController],
      providers: [
        { provide: FormsService,  useValue: {} },
        { provide: JwtAuthGuard,  useValue: { canActivate: () => true } },
      ],
    }).compile();

    controller = module.get<FormsController>(FormsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
