import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument } from '../schemas/admin.schema';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
  ) {}

  async getProfile(adminId: string) {
    const admin = await this.adminModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return {
      id: admin._id,
      email: admin.email,
    };
  }

  async updateEmail(adminId: string, updateEmailDto: UpdateEmailDto) {
    const admin = await this.adminModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      updateEmailDto.currentPassword,
      admin.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new email is already in use
    const existingAdmin = await this.adminModel.findOne({
      email: updateEmailDto.newEmail,
    });
    if (existingAdmin && existingAdmin._id.toString() !== adminId) {
      throw new BadRequestException('Email is already in use');
    }

    // Update email
    admin.email = updateEmailDto.newEmail;
    await admin.save();

    return {
      message: 'Email updated successfully',
      email: admin.email,
    };
  }

  async updatePassword(adminId: string, updatePasswordDto: UpdatePasswordDto) {
    const admin = await this.adminModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      admin.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password matches confirmation
    if (updatePasswordDto.newPassword !== updatePasswordDto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    // Check if new password is different from current (compare plain text passwords first)
    if (updatePasswordDto.newPassword === updatePasswordDto.currentPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    return {
      message: 'Password updated successfully',
    };
  }
}

