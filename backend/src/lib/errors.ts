export class AppError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }
}

export const badRequest = (message: string): AppError => new AppError(400, message);
export const unauthorized = (message = 'Não autenticado.'): AppError => new AppError(401, message);
export const forbidden = (message = 'Acesso negado.'): AppError => new AppError(403, message);
export const notFound = (message = 'Recurso não encontrado.'): AppError => new AppError(404, message);
export const conflict = (message: string): AppError => new AppError(409, message);
