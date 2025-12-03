import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument } from '../schemas/admin.schema';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    try {
      const adminCount = await this.adminModel.countDocuments();

      if (adminCount === 0) {
        const adminEmail = this.configService.get('ADMIN_EMAIL');
        const adminPassword = this.configService.get('ADMIN_PASSWORD');

        if (!adminEmail || !adminPassword) {
          this.logger.warn(
            'Admin credentials not found in environment variables. Please set ADMIN_EMAIL and ADMIN_PASSWORD.',
          );
          return;
        }

        const password = await bcrypt.hash(adminPassword, 10);

        await this.adminModel.create({
          email: adminEmail,
          password,
        });

        this.logger.log(`Admin user created with email: ${adminEmail}`);
      } else {
        this.logger.log('Admin user already exists');
      }
    } catch (error) {
      this.logger.error('Error seeding admin user:', error);
    }
  }
}

