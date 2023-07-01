import { UserObserver } from './user-observer';

interface IUserSubject {
  subscribe(observer: UserObserver): void;
  unsubscribe(observer: UserObserver): void;
  notifyUserOnline(observer: UserObserver): void;
  notifyUserOffline(observer: UserObserver): void;
}

export { IUserSubject };
