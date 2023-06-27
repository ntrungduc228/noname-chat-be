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
import { Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { Message } from 'src/messages/schemas/message.schema';
import { EventsService } from './events.service';
type CallPayload = {
  _id: string;
  host: string;
  peerId: string;
  participants: string[];
};
const calls: CallPayload[] = [];
const users: {
  [key: string]: string[];
} = {};
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

  @SubscribeMessage('join-app')
  joinApp(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    // add client to user list
    if (users[userId]) {
      users[userId].push(client.id);
    } else {
      users[userId] = [client.id];
    }
    calls.forEach((call) => {
      if (call.participants.includes(userId) && call.host !== userId) {
        client.emit('incoming-call', call._id);
      }
    });
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
  // call from client
  @SubscribeMessage('create-call')
  createCall(
    @MessageBody()
    callPayload: CallPayload,
    @ConnectedSocket() client: Socket,
  ): void {
    const index = calls.findIndex((call) => call._id === callPayload._id);
    if (index !== -1) {
      calls[index].peerId = callPayload.peerId;
    } else {
      calls.push({
        _id: callPayload._id,
        host: callPayload.host,
        participants: callPayload.participants,
        peerId: callPayload.peerId,
      });
    }
    callPayload.participants.forEach((participant) => {
      if (users[participant] && participant !== callPayload.host) {
        users[participant].forEach((clientId) => {
          this.server.to(clientId).emit('incoming-call', callPayload._id);
        });
      }
    });
    client.join(callPayload._id);
  }
  @SubscribeMessage('join-call')
  joinCall(
    @MessageBody() { callId, userId }: { callId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(callId);
    const call = calls.find((call) => call._id === callId);
    if (call) {
      client.emit('receive-peer-id', call.peerId);
    }
  }
  @SubscribeMessage('leave-call')
  leaveCall(
    @MessageBody() callId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.leave(callId);
  }
  @SubscribeMessage('call-accepted')
  callAccepted(
    @MessageBody() callId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.to(callId).emit('call-accepted');
  }
  @SubscribeMessage('call-rejected')
  callRejected(
    @MessageBody() callId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.to(callId).emit('call-rejected');
  }
  @SubscribeMessage('end-call')
  callEnded(
    @MessageBody() callId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    const index = calls.findIndex((call) => call._id === callId);
    if (index !== -1) {
      calls.splice(index, 1);
    }
    client.to(callId).emit('call-ended');
  }
}
