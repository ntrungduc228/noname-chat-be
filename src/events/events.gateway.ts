import { Injectable } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { EventsService } from './events.service';
// @WebSocketGateway(8001, { cors: '*' })

@Injectable()
@WebSocketGateway({ cors: '*' })
export class EventsGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(private eventService: EventsService) {}

  handleConnection(socket: Server) {
    console.log('socket ');
    this.eventService.socket = socket;
  }

  @WebSocketServer()
  public server: Server;

  afterInit(server: Server) {
    this.eventService.socket = server;
  }

  testUser(socket: Server) {
    // this.socket.emit('test-emit1', 'yoyo');
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: string): void {
    console.log('event from client: ', message);
    // this.server.emit('message', message);
  }

  @SubscribeMessage('test-emit')
  testFromClient(@MessageBody() message: string): void {
    // console.log('event from client 123: ', message);
    // this.server.emit('message', message + 'from server');
  }
}
