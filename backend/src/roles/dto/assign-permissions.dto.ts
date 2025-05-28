import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({ example: 'role-uuid-123' })
  @IsString()
  roleId: string;

  @ApiProperty({ example: ['perm-uuid-1', 'perm-uuid-2'] })
  @IsArray()
  permissionIds: string[];
}
