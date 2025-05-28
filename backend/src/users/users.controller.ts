import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthenticatedUser } from 'src/auth/interfaces/auth-user.interface';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard) // Uncomment to require authentication
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
  ) {
    return this.userService.getUsersPaginated({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
      role,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    console.log('Current user:', user);
    return this.userService.findById(user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException();
    return user;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  // Assign application to user
  @Post(':id/applications')
  @UseGuards(JwtAuthGuard)
  async assignApplication(
    @Param('id') userId: string,
    @Body() body: { applicationId: string },
  ) {
    return this.userService.assignApplication(userId, body.applicationId);
  }

  // Remove application from user
  @Delete(':id/applications/:appId')
  @UseGuards(JwtAuthGuard)
  async removeApplication(
    @Param('id') userId: string,
    @Param('appId') applicationId: string,
  ) {
    return this.userService.removeApplication(userId, applicationId);
  }

  // List user's applications
  @Get(':id/applications')
  @UseGuards(JwtAuthGuard)
  async listUserApplications(@Param('id') userId: string) {
    return this.userService.listUserApplications(userId);
  }

  @Post(':id/roles')
  @UseGuards(JwtAuthGuard)
  assignRole(@Param('id') userId: string, @Body() body: { roleId: string }) {
    return this.userService.assignRole(userId, body.roleId);
  }

  @Delete(':id/roles/:roleId')
  @UseGuards(JwtAuthGuard)
  removeRole(@Param('id') userId: string, @Param('roleId') roleId: string) {
    return this.userService.removeRole(userId, roleId);
  }
}
