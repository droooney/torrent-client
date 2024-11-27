import { ZodType } from 'zod';

export default class KeeneticCommand<T> {
  readonly command: string;
  readonly schema: ZodType<T>;

  constructor(command: string, schema: ZodType<T>) {
    this.command = command;
    this.schema = schema;
  }
}
