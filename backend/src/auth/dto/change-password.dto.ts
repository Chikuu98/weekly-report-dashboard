import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current Password', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  current_password: string;

  @ApiProperty({ description: 'New Password (minimum 6 characters)', example: 'newsecret123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  new_password: string;
}
