import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Admin, AdminSchema } from '../schemas/admin.schema';
import { PublicUser, PublicUserSchema } from '../schemas/public-user.schema';
import {
  VerificationCode,
  VerificationCodeSchema,
} from '../schemas/verification-code.schema';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '7d',
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: PublicUser.name, schema: PublicUserSchema },
      { name: VerificationCode.name, schema: VerificationCodeSchema },
    ]),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}

