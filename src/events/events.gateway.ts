import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Message } from 'src/messages/schemas/message.schema';
import { EventsService } from './events.service';
import { Types } from 'mongoose';

@WebSocketGateway({ cors: '*' })
export class EventsGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(private eventService: EventsService) {}

  handleConnection(socket: Server, @ConnectedSocket() client: Socket) {
    // console.log('socket ', client?.id);
  }

  @WebSocketServer()
  public server: Server;

  afterInit(server: Server) {
    console.log('init');
    this.eventService.socket = server;
  }

  @SubscribeMessage('join-event')
  joinEvent(
    @MessageBody() event: string,
    @ConnectedSocket() client: Socket,
  ): void {
    // this.server.
    console.log('event ', event);
    client.join(`${event}-event`);
  }

  @SubscribeMessage('join-room')
  joinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    // this.server.
    console.log('join', roomId);
    client.join(roomId);
  }

  @OnEvent('message.new')
  async personalEvent(payload: {
    userId: string;
    message: string;
    roomId: string;
  }) {
    this.server.to(`${payload.userId}-event`).emit('event-new', payload);
  }

  @OnEvent('message.test')
  async testMessage(payload: { message: string; roomId: string }) {
    this.server.to(payload.roomId).emit('message-new', payload.message);
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

  @OnEvent('message.create')
  async sendNewMessage(payload: Message) {
    this.server.to(`${payload.room}`).emit('message.create', payload);
  }
  @OnEvent('message.delete')
  async deleteMessage(
    payload: Message & {
      _id: Types.ObjectId;
    },
  ) {
    this.server.to(`${payload.room}`).emit('message.delete', payload._id);
  }
}
