// src/users/dto/create-user.dto.ts
import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';

export class CreateUserDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() password: string;
  @IsOptional() @IsArray() roleIds?: string[]; // assign after user is created
}
