import { DomainError } from "./DomainError";

export class NoActiveEngagementError extends DomainError {
  constructor() {
    super("Bu öğrencinin aktif bir koçluk ilişkisi bulunmuyor.");
    this.name = "NoActiveEngagementError";
  }
}

export class StudentAlreadyEngagedError extends DomainError {
  constructor() {
    super(
      "Bu öğrencinin halihazırda aktif bir koçluk ilişkisi var. Davet gönderilemez."
    );
    this.name = "StudentAlreadyEngagedError";
  }
}

export class EmailBelongsToCoachError extends DomainError {
  constructor() {
    super("Bu e-posta adresi bir koça ait; öğrenci olarak eklenemez.");
    this.name = "EmailBelongsToCoachError";
  }
}

export class InvitationExpiredError extends DomainError {
  constructor() {
    super("Bu davet süresi dolmuş veya artık geçerli değil.");
    this.name = "InvitationExpiredError";
  }
}

export class InvitationNotFoundError extends DomainError {
  constructor() {
    super("Davet bulunamadı.");
    this.name = "InvitationNotFoundError";
  }
}
