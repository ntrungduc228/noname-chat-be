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
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({ cors: '*' })
export class EventsGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(private eventService: EventsService) {}

  handleConnection(socket: Server) {
    // console.log('socket ');
    this.eventService.socket = socket;
  }

  @WebSocketServer()
  public server: Server;

  afterInit(server: Server) {
    this.eventService.socket = server;
  }

  @OnEvent('test-create')
  async testUser(payload: string) {
    this.server.emit('message', payload);
    console.log('test user hefe ', payload);
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: string): void {
    console.log('event from client: ', message);
    // this.server.emit('message', message);
  }

  @SubscribeMessage('test-emit')
  testFromClient(@MessageBody() message: string): void {
    // console.log('event from client 123: ', message);
    this.server.emit('message', message + 'from server123');
  }
}
