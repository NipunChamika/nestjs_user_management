import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Enable CORS for requests from frontend
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.listen(PORT, () => {
    console.log(`Server is started on http://localhost:${PORT}`);
  });
}
bootstrap();
