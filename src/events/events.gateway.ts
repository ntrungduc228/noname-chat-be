import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { Message } from 'src/messages/schemas/message.schema';
import { EventsService } from './events.service';
import { UserSubject } from './observer-pattern/user-subject';
import { UserObserver } from './observer-pattern/user-observer';
import { Room } from 'src/rooms/schemas/room.schema';

type CallPayload = {
  _id: string;
  host: string;
  peerId: string;
  participants: string[];
  usersJoined: string[];
};
const calls: CallPayload[] = [];
@WebSocketGateway({ cors: '*' })
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private eventService: EventsService) {}

  handleConnection(socket: Server, @ConnectedSocket() client: Socket) {
    console.log('socket ', client?.id);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.userSubject.removeObserverByClientId(client.id);
  }

  @WebSocketServer()
  public server: Server;
  public userSubject: UserSubject;

  afterInit(server: Server) {
    this.userSubject = new UserSubject(server);
    // this.eventService.socket = server;
  }

  @SubscribeMessage('register-listenner')
  joinListenerRoom(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log('client ', userId);
    client.join(`${userId}-listenner`);
  }

  @OnEvent('event.listen')
  async ListenEvent({
    userId,
    payload,
    type,
  }: {
    type: string;
    userId: string;
    payload: any;
  }) {
    this.server
      .to(`${userId}-listenner`)
      .emit(`${userId}-event`, { payload, type, userId });
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
    this.userSubject.subscribe(new UserObserver(userId, client));
    calls.forEach((call) => {
      if (
        call.participants.includes(userId) &&
        !call.usersJoined.includes(userId)
      ) {
        client.emit('incoming-call', call._id);
        call.usersJoined.push(userId);
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
    this.server.emit('new-message');
  }
  @OnEvent('message.delete')
  async deleteMessage(
    payload: Message & {
      _id: Types.ObjectId;
    },
  ) {
    this.server.to(`${payload.room}`).emit('message.delete', payload._id);
  }

  @OnEvent('room.update')
  async updateRoom(room: Room) {
    room.participants.forEach((participant) => {
      this.userSubject.users.forEach((user) => {
        if (user._id === participant._id.toString()) {
          user.client.emit('update-room', room);
        }
      });
    });
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
        usersJoined: [callPayload.host],
      });
    }
    this.userSubject.inComingCall(callPayload.participants, callPayload._id);
    client.join(callPayload._id);
  }
  @SubscribeMessage('join-call')
  joinCall(
    @MessageBody() { callId, userId }: { callId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(callId);
    const call = calls.find(
      (call) => call._id === callId && call.participants.includes(userId),
    );
    if (call) {
      client.emit('receive-peer-id', call.peerId);
    }
  }
  @SubscribeMessage('leave-call')
  leaveCall(
    @MessageBody() callId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log('leave-call', callId);
    client.leave(callId);
  }
  @SubscribeMessage('accept-call')
  callAccepted(
    @MessageBody() callId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.to(callId).emit('call-accepted');
  }
  @SubscribeMessage('reject-call')
  callRejected(
    @MessageBody() callId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    const index = calls.findIndex((call) => call._id === callId);
    if (index !== -1) {
      calls.splice(index, 1);
    }
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
