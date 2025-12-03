import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument } from '../schemas/admin.schema';
import { PublicUser, PublicUserDocument } from '../schemas/public-user.schema';
import {
  VerificationCode,
  VerificationCodeDocument,
} from '../schemas/verification-code.schema';
import { MailService } from '../mail/mail.service';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(PublicUser.name)
    private publicUserModel: Model<PublicUserDocument>,
    @InjectModel(VerificationCode.name)
    private verificationCodeModel: Model<VerificationCodeDocument>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async adminLogin(email: string, password: string) {
    const admin = await this.adminModel.findOne({ email });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: admin._id.toString(),
      role: 'admin',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: admin._id,
        email: admin.email,
        role: 'admin',
      },
    };
  }

  async requestPublicUserCode(username: string) {
    const user = await this.publicUserModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete any existing codes for this email
    await this.verificationCodeModel.deleteMany({ email: user.email });

    // Store new code
    await this.verificationCodeModel.create({
      email: user.email,
      code,
      expiresAt,
    });

    // Send email
    await this.mailService.sendVerificationCode(user.email, code, username);

    return {
      message: 'Verification code sent to your email',
      email: this.maskEmail(user.email),
    };
  }

  async verifyPublicUserCode(username: string, code: string) {
    const user = await this.publicUserModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verificationCode = await this.verificationCodeModel.findOne({
      email: user.email,
      code,
    });

    if (!verificationCode) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (verificationCode.expiresAt < new Date()) {
      await this.verificationCodeModel.deleteOne({ _id: verificationCode._id });
      throw new UnauthorizedException('Verification code has expired');
    }

    // Delete used code
    await this.verificationCodeModel.deleteOne({ _id: verificationCode._id });

    const payload: JwtPayload = {
      sub: user._id.toString(),
      role: 'public',
      username: user.username,
      permissions: user.projectPermissions.map((p) => ({
        projectId: p.projectId,
        canRead: p.canRead,
        canWrite: p.canWrite,
      })),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: 'public',
        permissions: user.projectPermissions,
      },
    };
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart.slice(0, 2)}***@${domain}`;
  }
}

