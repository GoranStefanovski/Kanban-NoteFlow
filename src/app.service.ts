import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Ovde e nekoja recenica sho e na homepage';
  }
}
