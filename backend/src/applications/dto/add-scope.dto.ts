import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AddScopeDto {
  @ApiProperty({ example: 'app-uuid-123' })
  @IsString()
  applicationId: string;

  @ApiProperty({
    example: ['read:user', 'write:user', 'read:roles'],
    description: 'List of scopes to add to the application',
  })
  @IsArray()
  scopes: string[];
}
