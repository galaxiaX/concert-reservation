import { IsInt, IsNotEmpty, IsString, IsPositive } from 'class-validator';

export class CreateConcertDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @IsPositive()
  totalSeats: number;
}
