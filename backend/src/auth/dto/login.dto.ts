import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() password: string;
  @IsString() @IsNotEmpty() client_id: string;
  @IsString() redirectUri?: string;
  @IsString() state?: string;
}
