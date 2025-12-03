import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicUsersService } from './public-users.service';
import { PublicUsersController } from './public-users.controller';
import { PublicUser, PublicUserSchema } from '../schemas/public-user.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicUser.name, schema: PublicUserSchema },
    ]),
    AuthModule,
  ],
  controllers: [PublicUsersController],
  providers: [PublicUsersService],
})
export class PublicUsersModule {}

