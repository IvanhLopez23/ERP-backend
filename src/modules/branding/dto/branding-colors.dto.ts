import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

const HEX_6_MESSAGE = 'Cada color debe ser un HEX de 6 dígitos (ej. #0f172a)';

export class BrandingColorsDto {
  @ApiProperty({ example: '#0f172a' })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: HEX_6_MESSAGE })
  headerBg: string;

  @ApiProperty({ example: '#f6f7f8' })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: HEX_6_MESSAGE })
  headerText: string;

  @ApiProperty({ example: '#1e3a5f' })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: HEX_6_MESSAGE })
  primary: string;

  @ApiProperty({ example: '#f1f5f9' })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: HEX_6_MESSAGE })
  secondary: string;

  @ApiProperty({ example: '#0ea5e9' })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: HEX_6_MESSAGE })
  tertiary: string;

  @ApiProperty({ example: '#0f172a' })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: HEX_6_MESSAGE })
  quaternary: string;
}
