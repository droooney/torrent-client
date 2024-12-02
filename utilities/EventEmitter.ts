import { EventEmitter as NativeEventEmitter } from 'node:events';

export default class EventEmitter<Events extends Record<keyof Events, any[]>> extends NativeEventEmitter<Events> {
  listen<Event extends keyof Events>(event: Event, listener: (...args: Events[Event]) => unknown): () => void {
    this.on(event as any, listener as any);

    return (): void => {
      this.off(event as any, listener as any);
    };
  }
}
