import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { RoleService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Get()
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  @Post(':id/permissions')
  assignPermission(
    @Param('id') roleId: string,
    @Body() body: { permissionId: string },
  ) {
    return this.roleService.assignPermission(roleId, body.permissionId);
  }

  @Delete(':id/permissions/:permissionId')
  removePermission(
    @Param('id') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.roleService.removePermission(roleId, permissionId);
  }

  @Get(':id/permissions')
  listRolePermissions(@Param('id') roleId: string) {
    return this.roleService.listRolePermissions(roleId);
  }
}
