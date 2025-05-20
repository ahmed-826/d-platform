const ROLE_LEVELS = {
  superAdmin: 0,
  admin: 1,
  groupAdmin: 2,
  user: 3,
  unauthenticated: 4,
};

export class RoleBasedError extends Error {
  constructor(
    message = {},
    status = 200,
    fallbackMessage = "Erreur s'est produite."
  ) {
    super();
    this.name = "RoleBasedError";
    this.message = message;
    this.status = status;
    this.fallbackMessage = fallbackMessage;
  }

  getMessage(role = "user") {
    const { message, fallbackMessage } = this;

    if (typeof message === "string") return message;

    const definedLevels = Object.keys(message).map(Number);
    const roleLevel = ROLE_LEVELS[role];

    const chosenLevel = definedLevels.find((level) => level >= roleLevel);

    return chosenLevel !== undefined ? message[chosenLevel] : fallbackMessage;
  }

  getStatus() {
    return this.status;
  }
}

export class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
  }
}
