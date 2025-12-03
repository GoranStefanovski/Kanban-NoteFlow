import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PublicUsersService } from './public-users.service';
import { CreatePublicUserDto } from './dto/create-public-user.dto';
import { UpdatePublicUserDto } from './dto/update-public-user.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

@Controller('public-users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PublicUsersController {
  constructor(private readonly publicUsersService: PublicUsersService) {}

  @Post()
  create(@Body() createPublicUserDto: CreatePublicUserDto) {
    return this.publicUsersService.create(createPublicUserDto);
  }

  @Get()
  findAll() {
    return this.publicUsersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publicUsersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePublicUserDto: UpdatePublicUserDto,
  ) {
    return this.publicUsersService.update(id, updatePublicUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.publicUsersService.remove(id);
  }
}

