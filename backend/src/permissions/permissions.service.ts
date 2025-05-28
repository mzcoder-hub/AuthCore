import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePermissionDto) {
    return this.prisma.permission.create({ data: dto });
  }

  findAll() {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }

  update(id: string, dto: UpdatePermissionDto) {
    return this.prisma.permission.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.permission.delete({ where: { id } });
  }
}
