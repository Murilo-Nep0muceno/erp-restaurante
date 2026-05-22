import { Test, TestingModule } from '@nestjs/testing';
import { RecipeDishController } from './recipe-dish.controller';

describe('RecipeDishController', () => {
  let controller: RecipeDishController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipeDishController],
    }).compile();

    controller = module.get<RecipeDishController>(RecipeDishController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
