import { IUserSubject } from './iuser-subject';
import { Server } from 'socket.io';
import { UserObserver } from './user-observer';

export class UserSubject implements IUserSubject {
  users = new Set<UserObserver>();
  server: Server;
  constructor(server: Server) {
    this.server = server;
  }
  subscribe(observer: UserObserver): void {
    observer.receiveAllUsers([...this.users]);
    this.notifyUserOnline(observer);
    this.users.add(observer);
  }
  unsubscribe(observer: UserObserver): void {
    this.users.delete(observer);
    let isExist = false;
    if (this.users.size) {
      isExist = [...this.users].some((user) => user._id === observer._id);
    }
    if (!isExist) {
      this.notifyUserOffline(observer);
    }
  }
  removeObserverByClientId(clientId: string): void {
    const user = [...this.users].find((user) => user.client.id === clientId);
    if (user) {
      this.unsubscribe(user);
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
  notifyUserOnline(observer: UserObserver): void {
    this.users.forEach((user) => user.notifyUserOnline(observer));
  }
  notifyUserOffline(observer: UserObserver): void {
    this.users.forEach((user) => user.notifyUserOffline(observer));
  }
}
