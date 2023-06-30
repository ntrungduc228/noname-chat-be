import { IUserSubject } from './iuser-subject';
import { Server } from 'socket.io';
import { UserObserver } from './user-observer';

export class UserSubject implements IUserSubject {
  users = new Set<UserObserver>();
  server: Server;
  constructor(server: Server) {
    this.server = server;
  }
  registerObserver(observer: UserObserver): void {
    observer.receiveAllUsers([...this.users]);
    this.server.emit('new-user-online', observer._id);
    this.users.add(observer);
  }
  removeObserver(observer: UserObserver): void {
    this.users.delete(observer);
    let isExist = false;
    if (this.users.size) {
      isExist = [...this.users].some((user) => user._id === observer._id);
    }
    if (!isExist) {
      this.server.emit('user-offline', observer._id);
    }
  }
  removeObserverByClientId(clientId: string): void {
    const user = [...this.users].find((user) => user.client.id === clientId);
    if (user) {
      this.removeObserver(user);
    }
  }
  findObserverById(id: string): UserObserver | undefined {
    return [...this.users].find((user) => user._id === id);
  }
  inComingCall(participant: string[], callId: string): void {
    participant.forEach((id) => {
      const user = this.findObserverById(id);
      if (user) {
        user.inComingCall(callId);
      }
    });
  }
}
