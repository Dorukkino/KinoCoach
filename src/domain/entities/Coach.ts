import { Email } from "../value-objects/Email";

export class Coach {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: Email
  ) {}
}
