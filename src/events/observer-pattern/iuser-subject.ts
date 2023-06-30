import { UserObserver } from './user-observer';

interface IUserSubject {
  registerObserver(observer: UserObserver): void;
  removeObserver(observer: UserObserver): void;
}

export { IUserSubject };
