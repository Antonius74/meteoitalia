export interface Output {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export const consoleOutput: Output = {
  info: (message) => console.log(message),
  warn: (message) => console.warn(message),
  error: (message) => console.error(message),
};
