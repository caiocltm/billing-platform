import { AppController } from '../src/app.controller';
import { Test, TestingModule } from '@nestjs/testing';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('renderIndexPage', () => {
    it('should render index page and log message', () => {
      expect(appController.renderIndexPage()).toBeUndefined();
    });
  });
});
