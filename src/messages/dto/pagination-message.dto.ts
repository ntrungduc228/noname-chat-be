import { IsNotEmpty } from 'class-validator';

export class PaginationMessageDto {
  cursor: string;
  @IsNotEmpty()
  limit: number;
}
