/**
 * Domain errors, kept free of any framework or auth imports so that modules
 * which only need to *recognise* them do not pull in the whole auth stack.
 */
export class UnauthenticatedError extends Error {
  constructor() {
    super("You need to sign in to do that.");
    this.name = "UnauthenticatedError";
  }
}
