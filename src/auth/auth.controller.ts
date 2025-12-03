import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RequestCodeDto } from './dto/request-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('admin/login')
  async adminLogin(@Body() adminLoginDto: AdminLoginDto) {
    return this.authService.adminLogin(
      adminLoginDto.email,
      adminLoginDto.password,
    );
  }

  @Post('public/request-code')
  async requestCode(@Body() requestCodeDto: RequestCodeDto) {
    return this.authService.requestPublicUserCode(requestCodeDto.username);
  }

  @Post('public/verify-code')
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyPublicUserCode(
      verifyCodeDto.username,
      verifyCodeDto.code,
    );
  }
}

