import { IsNotEmpty } from 'class-validator';

export class PaginationMessageDto {
  @IsNotEmpty()
  page: number;
  @IsNotEmpty()
  limit: number;
}
