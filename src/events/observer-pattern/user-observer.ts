import { Socket } from 'socket.io';

export class UserObserver {
  _id: string;
  client: Socket;
  constructor(_id: string, client: Socket) {
    this._id = _id;
    this.client = client;
  }
  receiveAllUsers(users: UserObserver[]) {
    this.client.emit(
      'all-users-online',
      users.map((user) => user._id),
    );
  }
  inComingCall(callId: string) {
    this.client.emit('incoming-call', callId);
  }
}
