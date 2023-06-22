import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class EventsService {
  public socket: Server = null;

  testUserser() {
    this.socket.emit('test-emit1', 'yoyo');
  }
}
