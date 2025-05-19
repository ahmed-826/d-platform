const ROLE_LEVELS = {
  superAdmin: 0,
  admin: 1,
  groupAdmin: 2,
  user: 3,
  unauthenticated: 4,
};

export class RoleBasedError extends Error {
  constructor(messages = {}, fallbackMessage = "Erreur s'est produite.") {
    super();
    this.name = "RoleBasedError";
    this.messages = messages;
    this.fallbackMessage = fallbackMessage;
  }

  getMessage(role = "user") {
    const { messages, fallbackMessage } = this;

    const definedLevels = Object.keys(messages).map(Number);
    const roleLevel = ROLE_LEVELS[role];

    const chosenLevel = definedLevels.find((level) => level >= roleLevel);

    return chosenLevel !== undefined ? messages[chosenLevel] : fallbackMessage;
  }
}
