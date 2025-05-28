import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ApplicationType, ApplicationStatus } from '@prisma/client';

export class CreateApplicationDto {
  @IsString() name: string;
  @IsEnum(ApplicationType) type: ApplicationType;
  @IsString() @IsOptional() clientId?: string;
  @IsString() @IsOptional() clientSecret?: string;
  @IsArray() @IsOptional() redirectUris?: string[];
  @IsEnum(ApplicationStatus) @IsOptional() status?: ApplicationStatus =
    ApplicationStatus.Active;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsOptional() accessTokenLifetime?: number;
  @IsNumber() @IsOptional() refreshTokenLifetime?: number;
}
